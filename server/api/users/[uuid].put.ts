import { createHash } from "node:crypto";
import { useDb } from "@@/server/utils/db";

type UserBody = {
  username?: string;
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

  if (!uuid) {
    throw createError({
      statusCode: 400,
      statusMessage: "User uuid is required",
    });
  }

  const username = String(body.username || "").trim();
  const password = String(body.password || "").trim();
  const role = String(body.role || "admin").trim();
  const user: any = body.user || "";

  if (!username) {
    throw createError({
      statusCode: 400,
      statusMessage: "Username is required",
    });
  }

  // ตรวจสอบ username ซ้ำ (ยกเว้น record ตัวเอง)
  const duplicate = await db.query(
    `SELECT id
     FROM ${tableName}
     WHERE username = $1
       AND uuid <> $2
     LIMIT 1`,
    [username, uuid],
  );

  if (duplicate.rows.length > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: "Username already exists",
    });
  }

  let result;

  // ถ้ามีการส่ง password มาให้ update password ด้วย
  if (password) {
    const hashedPassword = hashPassword(password);

    result = await db.query(
      `UPDATE ${tableName}
       SET username = $1,
           password = $2,
           role = $3,
           updated_by = $4,
           updated_at = NOW()
       WHERE uuid = $5
       RETURNING id, uuid, username, role, created_at, updated_at`,
      [username, hashedPassword, role, user.uuid, uuid],
    );
  } else {
    // ไม่แก้ password
    result = await db.query(
      `UPDATE ${tableName}
       SET username = $1,
           role = $2,
           updated_by = $3,
           updated_at = NOW()
       WHERE uuid = $4
       RETURNING id, uuid, username, role, created_at, updated_at`,
      [username, role, user.uuid, uuid],
    );
  }

  return {
    row: result.rows[0],
  };
});
