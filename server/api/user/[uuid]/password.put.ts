import { createHash } from "node:crypto";
import { requireCurrentUser } from "@@/server/utils/session";
import { useDb } from "@@/server/utils/db";

type PasswordBody = {
  password?: string;
  confirmPassword?: string;
};

export default defineEventHandler(async (event) => {
  const currentUser = await requireCurrentUser(event);
  const uuid = getRouterParam(event, "uuid");
  const body = await readBody<PasswordBody>(event);
  const password = String(body.password || "");
  const confirmPassword = String(body.confirmPassword || "");

  if (!uuid || uuid !== currentUser.uuid) {
    throw createError({
      statusCode: 403,
      statusMessage: "You can only change your own password",
    });
  }

  if (password.length < 6) {
    throw createError({
      statusCode: 400,
      statusMessage: "Password must contain at least 6 characters",
    });
  }

  if (password !== confirmPassword) {
    throw createError({ statusCode: 400, statusMessage: "Passwords do not match" });
  }

  const db = useDb();
  const result = await db.query(
    `UPDATE tb_users
     SET password = $1,
         updated_by = $2,
         updated_at = now()
     WHERE uuid = $3
       AND deleted_at IS NULL
     RETURNING uuid, updated_at`,
    [createHash("sha256").update(password).digest("hex"), currentUser.uuid, uuid],
  );

  if (!result.rows[0]) {
    throw createError({ statusCode: 404, statusMessage: "User not found" });
  }

  return { row: result.rows[0] };
});
