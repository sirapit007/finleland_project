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
    `UPDATE tb_user_line_accounts
     SET line_is_connected = FALSE,
         line_disconnected_at = now(),
         updated_by = $1,
         updated_at = now(),
         deleted_by = $1,
         deleted_at = now()
     WHERE uuid = $2
       AND line_user = $1
       AND deleted_at IS NULL
     RETURNING *`,
    [currentUser.uuid, uuid],
  );

  if (!result.rows[0]) {
    throw createError({ statusCode: 404, statusMessage: "LINE account not found" });
  }

  return { row: result.rows[0] };
});
