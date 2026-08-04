import { useDb } from "@@/server/utils/db";
import { requireCurrentUser } from "@@/server/utils/session";

export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, "uuid");
  const currentUser = await requireCurrentUser(event);
  if (!uuid) throw createError({ statusCode: 400, statusMessage: "Tax profile uuid is required" });
  const db = useDb();
  const result = await db.query(
    `SELECT base.*,
            concat_ws(' ', user_c.firstname, user_c.lastname) AS created_username,
            concat_ws(' ', user_u.firstname, user_u.lastname) AS updated_username,
            concat_ws(' ', user_d.firstname, user_d.lastname) AS deleted_username
     FROM tb_user_tax_profiles AS base
     LEFT JOIN tb_users AS user_c ON user_c.uuid::text = base.created_by
     LEFT JOIN tb_users AS user_u ON user_u.uuid::text = base.updated_by
     LEFT JOIN tb_users AS user_d ON user_d.uuid::text = base.deleted_by
     WHERE base.uuid::text = $1 AND base.tax_profile_user = $2
     LIMIT 1`,
    [uuid, currentUser.uuid],
  );
  return { row: result.rows[0] || null };
});
