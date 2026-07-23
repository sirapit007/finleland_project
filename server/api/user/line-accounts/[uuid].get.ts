import { requireCurrentUser } from "@@/server/utils/session";
import { useDb } from "@@/server/utils/db";

export default defineEventHandler(async (event) => {
  const currentUser = await requireCurrentUser(event);
  const uuid = getRouterParam(event, "uuid");

  if (!uuid) {
    throw createError({
      statusCode: 400,
      statusMessage: "LINE account uuid is required",
    });
  }

  const db = useDb();
  const result = await db.query(
    `SELECT *
     FROM tb_user_line_accounts
     WHERE uuid = $1
       AND line_user = $2
       AND deleted_at IS NULL
     LIMIT 1`,
    [uuid, currentUser.uuid],
  );

  if (!result.rows[0]) {
    throw createError({ statusCode: 404, statusMessage: "LINE account not found" });
  }

  return { row: result.rows[0] };
});
