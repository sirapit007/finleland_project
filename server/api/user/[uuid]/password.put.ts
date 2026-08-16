import { useDb } from "@@/server/utils/db";
import { hashPassword, verifyPassword } from "@@/server/utils/password";
import { getUserSession, requireCurrentUser } from "@@/server/utils/session";
import {
  createPasswordSessionVersion,
  signSessionToken,
} from "@@/server/utils/sessionToken";

type PasswordBody = {
  currentPassword?: string;
  password?: string;
  confirmPassword?: string;
};

type PasswordRow = {
  password: string;
};

export default defineEventHandler(async (event) => {
  const currentUser = await requireCurrentUser(event);
  const session = getUserSession(event);
  const uuid = getRouterParam(event, "uuid");
  const body = await readBody<PasswordBody>(event);
  const currentPassword = String(body.currentPassword || "");
  const password = String(body.password || "");
  const confirmPassword = String(body.confirmPassword || "");

  if (!uuid || uuid !== currentUser.uuid) {
    throw createError({
      statusCode: 403,
      statusMessage: "You can only change your own password",
    });
  }

  if (!currentPassword) {
    throw createError({
      statusCode: 400,
      statusMessage: "กรุณากรอกรหัสผ่านปัจจุบัน",
    });
  }

  if (password.length < 6) {
    throw createError({
      statusCode: 400,
      statusMessage: "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร",
    });
  }

  if (password !== confirmPassword) {
    throw createError({
      statusCode: 400,
      statusMessage: "รหัสผ่านใหม่และการยืนยันรหัสผ่านต้องตรงกัน",
    });
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw createError({
      statusCode: 500,
      statusMessage: "JWT_SECRET is not configured",
    });
  }

  const db = useDb();
  const client = await db.connect();
  const hashedPassword = await hashPassword(password);
  let updatedRow: { uuid: string; updated_at: Date | string } | undefined;

  try {
    await client.query("BEGIN");
    const passwordResult = await client.query<PasswordRow>(
      `SELECT password
       FROM tb_users
       WHERE uuid = $1
         AND deleted_at IS NULL
       LIMIT 1
       FOR UPDATE`,
      [uuid],
    );
    const storedPassword = passwordResult.rows[0]?.password;

    if (!storedPassword) {
      throw createError({ statusCode: 404, statusMessage: "User not found" });
    }

    const currentPasswordResult = await verifyPassword(
      currentPassword,
      storedPassword,
    );
    if (!currentPasswordResult.valid) {
      throw createError({
        statusCode: 400,
        statusMessage: "รหัสผ่านปัจจุบันไม่ถูกต้อง",
      });
    }

    const result = await client.query<{
      uuid: string;
      updated_at: Date | string;
    }>(
      `UPDATE tb_users
       SET password = $1,
           updated_by = $2,
           updated_at = now()
       WHERE uuid = $3
         AND deleted_at IS NULL
       RETURNING uuid, updated_at`,
      [hashedPassword, currentUser.uuid, uuid],
    );
    updatedRow = result.rows[0];

    if (!updatedRow) {
      throw createError({ statusCode: 404, statusMessage: "User not found" });
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  const now = Math.floor(Date.now() / 1000);
  const maxAge = Math.max(1, Math.floor((session?.exp || now + 86400) - now));
  const token = signSessionToken(
    {
      sub: String(currentUser.id),
      pwdv: createPasswordSessionVersion(hashedPassword, jwtSecret),
      firstname: currentUser.firstname,
      lastname: currentUser.lastname,
      phone: currentUser.phone,
      email: currentUser.email,
      role: currentUser.role,
    },
    jwtSecret,
    maxAge,
  );

  setCookie(event, "user_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });

  return { row: updatedRow };
});
