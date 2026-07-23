import type { PoolClient } from "pg";

const toMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export async function refreshOrderTotals(
  client: PoolClient,
  orderUuid: string,
  userUuid: string,
) {
  const totalsResult = await client.query(
    `SELECT COALESCE(SUM(order_item_subtotal), 0) AS subtotal,
            COALESCE(SUM(order_item_discount), 0) AS discount
     FROM tb_shopping_order_items
     WHERE order_item_order = $1
       AND deleted_at IS NULL`,
    [orderUuid],
  );
  const subtotal = toMoney(Number(totalsResult.rows[0]?.subtotal || 0));
  const discount = toMoney(Number(totalsResult.rows[0]?.discount || 0));

  const result = await client.query(
    `UPDATE tb_shopping_orders
     SET order_subtotal = $1,
         order_discount = $2,
         order_grand_total = $1::numeric - $2::numeric + COALESCE(order_shipping_fee, 0::numeric),
         updated_by = $3,
         updated_at = NOW()
     WHERE uuid::text = $4
       AND deleted_at IS NULL
     RETURNING *`,
    [subtotal, discount, userUuid, orderUuid],
  );

  return result.rows[0] || null;
}
