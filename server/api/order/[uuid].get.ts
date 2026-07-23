import { useDb } from "@@/server/utils/db";
import { requireCurrentActor } from "@@/server/utils/session";

export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, "uuid");
  const actor = await requireCurrentActor(event);

  if (!uuid) {
    throw createError({ statusCode: 400, statusMessage: "Order uuid is required" });
  }

  const db = useDb();
  const result = await db.query(
    `SELECT base.*,
            concat_ws(' ', customer.firstname, customer.lastname) AS order_customer_current_name,
            concat_ws(' ', user_c.firstname, user_c.lastname) AS created_username,
            concat_ws(' ', user_u.firstname, user_u.lastname) AS updated_username,
            concat_ws(' ', user_d.firstname, user_d.lastname) AS deleted_username
     FROM tb_shopping_orders AS base
     LEFT JOIN tb_users AS customer ON customer.uuid::text = base.order_user
     LEFT JOIN tb_users AS user_c ON user_c.uuid::text = base.created_by
     LEFT JOIN tb_users AS user_u ON user_u.uuid::text = base.updated_by
     LEFT JOIN tb_users AS user_d ON user_d.uuid::text = base.deleted_by
     WHERE base.uuid::text = $1
       AND base.deleted_at IS NULL
       AND ($2::boolean OR base.order_user = $3)
     LIMIT 1`,
    [uuid, actor.isAdmin, actor.user.uuid],
  );

  return { row: result.rows[0] || null };
});
