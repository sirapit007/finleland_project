import { requireCurrentUser } from "@@/server/utils/session";
import { useDb } from "@@/server/utils/db";

type LineAccountBody = {
  line_display_name?: string;
  line_picture_url?: string;
};

export default defineEventHandler(async (event) => {
  const currentUser = await requireCurrentUser(event);
  const uuid = getRouterParam(event, "uuid");
  const body = await readBody<LineAccountBody>(event);

  if (!uuid) {
    throw createError({
      statusCode: 400,
      statusMessage: "LINE account uuid is required",
    });
  }

  const db = useDb();
  const existing = await db.query(
    `SELECT line_display_name, line_picture_url
     FROM tb_user_line_accounts
     WHERE uuid = $1
       AND line_user = $2
       AND deleted_at IS NULL
     LIMIT 1`,
    [uuid, currentUser.uuid],
  );

  if (!existing.rows[0]) {
    throw createError({ statusCode: 404, statusMessage: "LINE account not found" });
  }

  const result = await db.query(
    `UPDATE tb_user_line_accounts
     SET line_display_name = $1,
         line_picture_url = $2,
         updated_by = $3,
         updated_at = now()
     WHERE uuid = $4
     RETURNING *`,
    [
      body.line_display_name === undefined
        ? existing.rows[0].line_display_name
        : String(body.line_display_name || "").trim() || null,
      body.line_picture_url === undefined
        ? existing.rows[0].line_picture_url
        : String(body.line_picture_url || "").trim() || null,
      currentUser.uuid,
      uuid,
    ],
  );

  return { row: result.rows[0] };
});
