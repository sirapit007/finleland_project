import { useDb } from "@@/server/utils/db";
import { requireCurrentActor } from "@@/server/utils/session";

export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, "uuid");
  const actor = await requireCurrentActor(event);

  if (!uuid) {
    throw createError({ statusCode: 400, statusMessage: "Order item uuid is required" });
  }

  const db = useDb();
  const result = await db.query(
    `SELECT base.*, orders.order_number,
            concat_ws(' ', user_c.firstname, user_c.lastname) AS created_username,
            concat_ws(' ', user_u.firstname, user_u.lastname) AS updated_username,
            concat_ws(' ', user_d.firstname, user_d.lastname) AS deleted_username
     FROM tb_shopping_order_items AS base
     LEFT JOIN tb_shopping_orders AS orders ON orders.uuid::text = base.order_item_order
     LEFT JOIN tb_users AS user_c ON user_c.uuid::text = base.created_by
     LEFT JOIN tb_users AS user_u ON user_u.uuid::text = base.updated_by
     LEFT JOIN tb_users AS user_d ON user_d.uuid::text = base.deleted_by
     WHERE base.uuid::text = $1
       AND base.deleted_at IS NULL
       AND ($2::boolean OR orders.order_user = $3)
     LIMIT 1`,
    [uuid, actor.isAdmin, actor.user.uuid],
  );

  return { row: result.rows[0] || null };
});
