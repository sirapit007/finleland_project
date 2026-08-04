import { useDb } from "@@/server/utils/db";
import { sanitizePaymentRow } from "@@/server/utils/orderPayments";
import { requireCurrentActor } from "@@/server/utils/session";

export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, "uuid");
  const actor = await requireCurrentActor(event);
  if (!uuid) {
    throw createError({
      statusCode: 400,
      statusMessage: "Payment uuid is required",
    });
  }

  const db = useDb();
  const result = await db.query(
    `SELECT base.*,
            orders.order_number,
            orders.order_user,
            orders.order_customer_name,
            orders.order_grand_total,
            orders.order_payment_status AS current_order_payment_status,
            concat_ws(' ', user_c.firstname, user_c.lastname) AS created_username,
            concat_ws(' ', user_u.firstname, user_u.lastname) AS updated_username
     FROM tb_shopping_order_payments AS base
     INNER JOIN tb_shopping_orders AS orders
       ON orders.uuid = base.order_payment_order
     LEFT JOIN tb_users AS user_c ON user_c.uuid::text = base.created_by
     LEFT JOIN tb_users AS user_u ON user_u.uuid::text = base.updated_by
     WHERE base.uuid::text = $1
       AND base.deleted_at IS NULL
       AND orders.deleted_at IS NULL
       AND ($2::boolean OR orders.order_user = $3)
     LIMIT 1`,
    [uuid, actor.isAdmin, actor.user.uuid],
  );
  const row = result.rows[0];
  if (!row) {
    throw createError({
      statusCode: 404,
      statusMessage: "ไม่พบข้อมูลการชำระเงิน หรือคุณไม่มีสิทธิ์เข้าถึง",
    });
  }

  return {
    row: sanitizePaymentRow(row, {
      includeProviderResponse: actor.isAdmin,
    }),
  };
});
