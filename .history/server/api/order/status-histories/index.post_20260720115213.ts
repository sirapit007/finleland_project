import { useDb } from "@@/server/utils/db";
import { notifyLineCustomerOfOrderStatus } from "@@/server/utils/lineMessaging";
import { requireCurrentAdmin } from "@@/server/utils/session";

type StatusHistoryBody = {
  order_status_history_note?: string;
  order_status_history_order?: string;
  order_status_history_status?: string;
};

const orderStatuses = new Set([
  "pending",
  "confirmed",
  "processing",
  "ready_for_pickup",
  "shipped",
  "completed",
  "canceled",
]);

export default defineEventHandler(async (event) => {
  const admin = await requireCurrentAdmin(event);
  const body = await readBody<StatusHistoryBody>(event);
  const orderUuid = String(body.order_status_history_order || "").trim();
  const nextStatus = String(body.order_status_history_status || "").trim();
  const note = String(body.order_status_history_note || "").trim() || null;

  if (!orderUuid || !nextStatus) {
    throw createError({
      statusCode: 400,
      statusMessage: "Order and next status are required",
    });
  }
  if (!orderStatuses.has(nextStatus)) {
    throw createError({ statusCode: 400, statusMessage: "Order status is invalid" });
  }

  const db = useDb();
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const currentResult = await client.query(
      `SELECT uuid::text AS uuid, order_status, order_user, order_number
       FROM tb_shopping_orders
       WHERE uuid::text = $1
         AND deleted_at IS NULL
       LIMIT 1
       FOR UPDATE`,
      [orderUuid],
    );
    const currentOrder = currentResult.rows[0];

    if (!currentOrder) {
      throw createError({ statusCode: 404, statusMessage: "Order was not found" });
    }

    const previousStatus = String(currentOrder.order_status || "").trim() || null;
    if (previousStatus === nextStatus) {
      throw createError({
        statusCode: 409,
        statusMessage: "Order already has this status",
      });
    }

    const orderResult = await client.query(
      `UPDATE tb_shopping_orders
       SET order_status = $1::varchar,
           order_confirmed_at = CASE
             WHEN $1::text = 'confirmed' THEN COALESCE(order_confirmed_at, NOW())
             ELSE order_confirmed_at
           END,
           order_shipped_at = CASE
             WHEN $1::text = 'shipped' THEN COALESCE(order_shipped_at, NOW())
             ELSE order_shipped_at
           END,
           order_completed_at = CASE
             WHEN $1::text = 'completed' THEN COALESCE(order_completed_at, NOW())
             ELSE order_completed_at
           END,
           order_canceled_at = CASE
             WHEN $1::text = 'canceled' THEN COALESCE(order_canceled_at, NOW())
             ELSE order_canceled_at
           END,
           updated_by = $2,
           updated_at = NOW()
       WHERE uuid::text = $3
       RETURNING *`,
      [nextStatus, admin.uuid, orderUuid],
    );
    const historyResult = await client.query(
      `INSERT INTO tb_shopping_order_status_histories (
         order_status_history_order,
         order_status_history_previous_status,
         order_status_history_status,
         order_status_history_note,
         created_by
       ) VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [orderUuid, previousStatus, nextStatus, note, admin.uuid],
    );

    await client.query("COMMIT");

    let lineNotification = {
      sent: false,
      reason: "LINE notification was not attempted",
    };
    try {
      const notification = await notifyLineCustomerOfOrderStatus({
        customerUuid: String(currentOrder.order_user),
        note,
        orderNumber: String(currentOrder.order_number),
        status: nextStatus,
      });
      lineNotification = { sent: notification.sent, reason: notification.reason };
    } catch (error) {
      console.error("Unable to send LINE order status notification", error);
      lineNotification = {
        sent: false,
        reason: "LINE rejected the notification request. Check the server log.",
      };
    }

    return {
      row: historyResult.rows[0],
      order: orderResult.rows[0],
      lineNotification,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});
