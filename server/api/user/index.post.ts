import { createHash } from "node:crypto";
import { useDb } from "@@/server/utils/db";
import { requireCurrentAdmin } from "@@/server/utils/session";

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

  const body = await readBody<UserBody>(event);
  const db = useDb();
  const admin = await requireCurrentAdmin(event);

  const firstname = String(body.firstname || "").trim();
  const lastname = String(body.lastname || "").trim();
  const phone = String(body.phone || "").trim();
  const email = String(body.email || "").trim();
  const password = String(body.password || "").trim();
  const role = String(body.role || "User").trim();

  if (!firstname || !lastname || !phone || !email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: "All fields are required",
    });
  }

  const exists = await db.query(
    `SELECT id
     FROM ${tableName}
     WHERE email = $1 OR phone = $2
     LIMIT 1`,
    [email, phone],
  );

  if (exists.rows.length > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: "Email or phone already exists",
    });
  }

  const hashedPassword = hashPassword(password);

  const result = await db.query(
    `INSERT INTO ${tableName}
      (firstname, lastname, phone, email, password, role, created_by)
     VALUES
      ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [firstname, lastname, phone, email, hashedPassword, role, admin.uuid],
  );

  return {
    row: result.rows[0],
  };
});
