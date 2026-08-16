import { useDb } from "@@/server/utils/db";
import { hashPassword } from "@@/server/utils/password";
import { requireCurrentActor } from "@@/server/utils/session";

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
  const db = useDb();
  const uuid = getRouterParam(event, "uuid");
  const body = await readBody<UserBody>(event);
  const actor = await requireCurrentActor(event);

  if (!uuid) {
    throw createError({
      statusCode: 400,
      statusMessage: "User uuid is required",
    });
  }

  const firstname = String(body.firstname || "").trim();
  const lastname = String(body.lastname || "").trim();
  const phone = String(body.phone || "").trim();
  const email = String(body.email || "")
    .trim()
    .toLowerCase();
  const password = actor.isAdmin ? String(body.password || "") : "";
  const role =
    actor.isAdmin && typeof body.role === "string" && body.role.trim()
      ? body.role.trim()
      : null;

  if (!actor.isAdmin && uuid !== actor.user.uuid) {
    throw createError({
      statusCode: 403,
      statusMessage: "You can only update your own profile",
    });
  }

  if (!firstname || !lastname || !phone || !email) {
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

  if (password && password.length < 6) {
    throw createError({
      statusCode: 400,
      statusMessage: "Password must contain at least 6 characters",
    });
  }

  if (role && !allowedRoles.has(role)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid user role",
    });
  }

  const hashedPassword = password ? await hashPassword(password) : "";
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
         AND uuid <> $3
         AND deleted_at IS NULL
       LIMIT 1`,
      [email, phone, uuid],
    );

    if (duplicate.rows.length > 0) {
      throw createError({
        statusCode: 409,
        statusMessage: "อีเมลหรือเบอร์โทรศัพท์นี้ถูกใช้งานแล้ว",
      });
    }

    const result = hashedPassword
      ? await client.query(
          `UPDATE ${tableName}
           SET firstname = $1,
               lastname = $2,
               phone = $3,
               email = $4,
               password = $5,
               role = COALESCE($6, role),
               updated_by = $7,
               updated_at = NOW()
           WHERE uuid = $8
             AND deleted_at IS NULL
           RETURNING id, uuid, firstname, lastname, phone, email, role, created_at, updated_at`,
          [
            firstname,
            lastname,
            phone,
            email,
            hashedPassword,
            role,
            actor.user.uuid,
            uuid,
          ],
        )
      : await client.query(
          `UPDATE ${tableName}
           SET firstname = $1,
               lastname = $2,
               phone = $3,
               email = $4,
               role = COALESCE($5, role),
               updated_by = $6,
               updated_at = NOW()
           WHERE uuid = $7
             AND deleted_at IS NULL
           RETURNING id, uuid, firstname, lastname, phone, email, role, created_at, updated_at`,
          [firstname, lastname, phone, email, role, actor.user.uuid, uuid],
        );

    if (!result.rows[0]) {
      throw createError({
        statusCode: 404,
        statusMessage: "ไม่พบข้อมูลผู้ใช้งาน",
      });
    }

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
