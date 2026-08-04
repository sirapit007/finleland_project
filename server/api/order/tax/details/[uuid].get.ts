import { useDb } from "@@/server/utils/db";
import { requireCurrentActor } from "@@/server/utils/session";

export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, "uuid");
  const actor = await requireCurrentActor(event);
  if (!uuid) throw createError({ statusCode: 400, statusMessage: "Order tax detail uuid is required" });
  const db = useDb();
  const result = await db.query(
    `SELECT base.*, orders.order_number
     FROM tb_shopping_order_tax_details AS base
     INNER JOIN tb_shopping_orders AS orders ON orders.uuid::text=base.order_tax_order
     WHERE base.uuid::text=$1 AND orders.deleted_at IS NULL
       AND ($2::boolean OR orders.order_user=$3)
     LIMIT 1`,
    [uuid, actor.isAdmin, actor.user.uuid],
  );
  return { row: result.rows[0] || null };
});
