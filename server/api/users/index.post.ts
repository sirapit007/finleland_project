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

  const body = await readBody<UserBody>(event);
  const db = useDb();

  const username = String(body.username || "").trim();
  const password = String(body.password || "").trim();
  const role = String(body.role || "admin").trim();
  const user: any = body.user || "";

  if (!username || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: "Username and password are required",
    });
  }

  const exists = await db.query(
    `SELECT id
     FROM ${tableName}
     WHERE username = $1
     LIMIT 1`,
    [username],
  );

  if (exists.rows.length > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: "Username already exists",
    });
  }

  const hashedPassword = hashPassword(password);

  const result = await db.query(
    `INSERT INTO ${tableName}
      (username, password, role, created_by)
     VALUES
      ($1, $2, $3, $4)
     RETURNING *`,
    [username, hashedPassword, role, user.uuid],
  );

  return {
    row: result.rows[0],
  };
});
