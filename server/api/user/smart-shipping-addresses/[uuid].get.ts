import { useDb } from "@@/server/utils/db";
import { requireCurrentUser } from "@@/server/utils/session";

export default defineEventHandler(async (event) => {
  const tableName = "tb_user_shipping_addresses";
  const db = useDb();
  const uuid = getRouterParam(event, "uuid");
  const currentUser = await requireCurrentUser(event);

  if (!uuid) {
    throw createError({
      statusCode: 400,
      statusMessage: "Shipping address uuid is required",
    });
  }

  const result = await db.query(
    `SELECT
      base.*,
      concat_ws(' ', user_c.firstname, user_c.lastname) AS created_username,
      concat_ws(' ', user_u.firstname, user_u.lastname) AS updated_username,
      concat_ws(' ', user_d.firstname, user_d.lastname) AS deleted_username
     FROM ${tableName} AS base
     LEFT JOIN tb_users AS user_c ON base.created_by = user_c.uuid::text
     LEFT JOIN tb_users AS user_u ON base.updated_by = user_u.uuid::text
     LEFT JOIN tb_users AS user_d ON base.deleted_by = user_d.uuid::text
     WHERE base.uuid = $1 AND base.shipping_user = $2
     LIMIT 1`,
    [uuid, currentUser.uuid],
  );

  return { row: result.rows[0] || null };
});
