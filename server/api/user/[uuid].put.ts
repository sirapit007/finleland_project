import { createHash } from "node:crypto";
import { useDb } from "@@/server/utils/db";
import { requireCurrentActor } from "@@/server/utils/session";

type UserBody = {
  firstname?: string;
  lastname?: string;
  phone?: string;
  email?: string;
  password?: string;
  role?: string;
  user?: object;
};

function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

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
  const email = String(body.email || "").trim();
  const password = actor.isAdmin ? String(body.password || "").trim() : "";
  const role = actor.isAdmin
    ? String(body.role || "User").trim()
    : String(actor.user.role || "User");

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

  // ตรวจสอบ email ซ้ำ (ยกเว้น record ตัวเอง)
  const duplicate = await db.query(
    `SELECT id
     FROM ${tableName}
     WHERE email = $1 OR phone = $2
       AND uuid <> $3
     LIMIT 1`,
    [email, phone, uuid],
  );

  if (duplicate.rows.length > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: "Email or phone already exists",
    });
  }

  let result;

  // ถ้ามีการส่ง password มาให้ update password ด้วย
  if (password) {
    const hashedPassword = hashPassword(password);

    result = await db.query(
      `UPDATE ${tableName}
       SET firstname = $1,
           lastname = $2,
           phone = $3,
           email = $4,
           password = $5,
           role = $6,
           updated_by = $7,
           updated_at = NOW()
       WHERE uuid = $8
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
    );
  } else {
    // ไม่แก้ password
    result = await db.query(
      `UPDATE ${tableName}
       SET firstname = $1,
           lastname = $2,
           phone = $3,
           email = $4,
           role = $5,
           updated_by = $6,
           updated_at = NOW()
       WHERE uuid = $7
       RETURNING id, uuid, firstname, lastname, phone, email, role, created_at, updated_at`,
      [firstname, lastname, phone, email, role, actor.user.uuid, uuid],
    );
  }

  return {
    row: result.rows[0],
  };
});
