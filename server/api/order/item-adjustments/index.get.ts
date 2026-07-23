import { useDb } from "@@/server/utils/db";
import { requireCurrentAdmin } from "@@/server/utils/session";

export default defineEventHandler(async (event) => {
  await requireCurrentAdmin(event);
  const query = getQuery(event);
  const orderUuid = String(query.order_item_adjustment_order || "").trim();

  if (!orderUuid) {
    throw createError({ statusCode: 400, statusMessage: "Order uuid is required" });
  }

  const db = useDb();
  const result = await db.query(
    `SELECT base.*, concat_ws(' ', actor.firstname, actor.lastname) AS created_username
     FROM tb_shopping_order_item_adjustments AS base
     LEFT JOIN tb_users AS actor ON actor.uuid::text = base.created_by
     WHERE base.order_item_adjustment_order = $1
       AND base.deleted_at IS NULL
     ORDER BY base.created_at DESC, base.id DESC`,
    [orderUuid],
  );

  return { rows: result.rows, total: result.rows.length };
});
