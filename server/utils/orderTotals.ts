import type { PoolClient } from "pg";
import { adjustOrderCoupon, returnOrderCoupon } from "@@/server/utils/coupons";

const toMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export async function refreshOrderTotals(
  client: PoolClient,
  orderUuid: string,
  userUuid: string,
  options: { removeCoupon?: boolean } = {},
) {
  // Callers lock and validate the order before changing any items.
  if (options.removeCoupon) {
    await returnOrderCoupon(
      client,
      orderUuid,
      userUuid,
      "Admin removed coupon while adjusting order items",
    );
    await client.query(
      `UPDATE tb_shopping_orders
       SET order_user_coupon = NULL, order_coupon_discount = 0,
           order_coupon_snapshot = NULL, updated_by = $2, updated_at = NOW()
       WHERE uuid::text = $1 AND deleted_at IS NULL`,
      [orderUuid, userUuid],
    );
  }
  await adjustOrderCoupon(client, orderUuid, userUuid, {});

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
         order_grand_total = $1::numeric - $2::numeric - COALESCE(order_coupon_discount, 0::numeric) + COALESCE(order_shipping_fee, 0::numeric),
         updated_by = $3,
         updated_at = NOW()
     WHERE uuid::text = $4
       AND deleted_at IS NULL
     RETURNING *`,
    [subtotal, discount, userUuid, orderUuid],
  );

  let order = result.rows[0] || null;
  // Editing an unpaid order can reduce its payable balance to zero.
  // Settle it without a payment slip, just as initial coupon checkout does.
  if (
    order?.order_user_coupon &&
    Number(order.order_coupon_discount) > 0 &&
    Number(order.order_grand_total) === 0
  ) {
    const paidResult = await client.query(
      `UPDATE tb_shopping_orders
       SET order_payment_status = 'paid', order_payment_method = 'coupon',
           order_paid_at = NOW(), updated_by = $2, updated_at = NOW()
       WHERE uuid = $1 RETURNING *`,
      [orderUuid, userUuid],
    );
    order = paidResult.rows[0];
  }
  return order;
}
