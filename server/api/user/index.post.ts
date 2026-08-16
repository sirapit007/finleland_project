import { useDb } from "@@/server/utils/db";
import { hashPassword } from "@@/server/utils/password";
import { requireCurrentAdmin } from "@@/server/utils/session";

type UserBody = {
  firstname?: string;
  lastname?: string;
  phone?: string;
  email?: string;
  password?: string;
  role?: string;
};

const allowedRoles = new Set(["User", "Superuser", "Admin"]);

export default defineEventHandler(async (event) => {
  const tableName = "tb_users";
  const body = await readBody<UserBody>(event);
  const db = useDb();
  const admin = await requireCurrentAdmin(event);

  const firstname = String(body.firstname || "").trim();
  const lastname = String(body.lastname || "").trim();
  const phone = String(body.phone || "").trim();
  const email = String(body.email || "")
    .trim()
    .toLowerCase();
  const password = String(body.password || "");
  const role = String(body.role || "").trim();

  if (!firstname || !lastname || !phone || !email || !password || !role) {
    throw createError({
      statusCode: 400,
      statusMessage: "All fields are required",
    });
  }

  if (!/^[0-9]{10}$/.test(phone)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Phone number must contain exactly 10 digits",
    });
  }

  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({
      statusCode: 400,
      statusMessage: "กรุณากรอกอีเมลให้ถูกต้อง",
    });
  }

  if (password.length < 6) {
    throw createError({
      statusCode: 400,
      statusMessage: "Password must contain at least 6 characters",
    });
  }

  if (!allowedRoles.has(role)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid user role",
    });
  }

  const hashedPassword = await hashPassword(password);
  const client = await db.connect();
  let transactionStarted = false;

  try {
    await client.query("BEGIN");
    transactionStarted = true;

    const identityLocks = [
      `signup-email:${email}`,
      `signup-phone:${phone}`,
    ].sort();

    for (const lockKey of identityLocks) {
      await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
        lockKey,
      ]);
    }

    const duplicate = await client.query(
      `SELECT id
       FROM ${tableName}
       WHERE (LOWER(BTRIM(email)) = $1 OR BTRIM(phone) = $2)
         AND deleted_at IS NULL
       LIMIT 1`,
      [email, phone],
    );

    if (duplicate.rows.length > 0) {
      throw createError({
        statusCode: 409,
        statusMessage: "อีเมลหรือเบอร์โทรศัพท์นี้ถูกใช้งานแล้ว",
      });
    }

    const result = await client.query(
      `INSERT INTO ${tableName}
        (firstname, lastname, phone, email, password, role, created_by)
       VALUES
        ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, uuid, firstname, lastname, phone, email, role, created_at, updated_at`,
      [firstname, lastname, phone, email, hashedPassword, role, admin.uuid],
    );

    await client.query("COMMIT");
    transactionStarted = false;

    return {
      row: result.rows[0],
    };
  } catch (error: unknown) {
    if (transactionStarted) {
      await client.query("ROLLBACK").catch(() => undefined);
    }

    if ((error as { code?: string }).code === "23505") {
      throw createError({
        statusCode: 409,
        statusMessage: "อีเมลหรือเบอร์โทรศัพท์นี้ถูกใช้งานแล้ว",
      });
    }

    throw error;
  } finally {
    client.release();
  }
});
