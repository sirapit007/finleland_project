import { useDb } from "@@/server/utils/db";
import { requireCurrentAdmin } from "@@/server/utils/session";

type OrderBody = {
  order_status?: string;
  order_payment_method?: string;
  order_payment_status?: string;
  order_carrier?: string;
  order_tracking_number?: string;
  order_cancel_reason?: string;
  user?: { uuid?: string };
};

const paymentStatuses = new Set(["unpaid", "pending", "paid", "failed", "refunded"]);

export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, "uuid");
  const body = await readBody<OrderBody>(event);
  const admin = await requireCurrentAdmin(event);
  const userUuid = admin.uuid;
  const paymentStatus = body.order_payment_status
    ? String(body.order_payment_status).trim()
    : null;

  if (!uuid) {
    throw createError({
      statusCode: 400,
      statusMessage: "Order uuid is required",
    });
  }
  if (body.order_status !== undefined) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "Use /api/order/status-histories to change an order status",
    });
  }
  if (paymentStatus && !paymentStatuses.has(paymentStatus)) {
    throw createError({ statusCode: 400, statusMessage: "Payment status is invalid" });
  }

  const db = useDb();
  const result = await db.query(
    `UPDATE tb_shopping_orders
     SET order_payment_method = COALESCE($1, order_payment_method),
         order_payment_status = COALESCE($2, order_payment_status),
         order_carrier = COALESCE($3, order_carrier),
         order_tracking_number = COALESCE($4, order_tracking_number),
         order_cancel_reason = COALESCE($5, order_cancel_reason),
         updated_by = $6,
         updated_at = NOW()
     WHERE uuid::text = $7
       AND deleted_at IS NULL
     RETURNING *`,
    [
      body.order_payment_method ? String(body.order_payment_method).trim() : null,
      paymentStatus,
      body.order_carrier ? String(body.order_carrier).trim() : null,
      body.order_tracking_number ? String(body.order_tracking_number).trim() : null,
      body.order_cancel_reason ? String(body.order_cancel_reason).trim() : null,
      userUuid,
      uuid,
    ],
  );

  return { row: result.rows[0] || null };
});
