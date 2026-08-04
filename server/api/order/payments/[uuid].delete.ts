import { useDb } from "@@/server/utils/db";
import { sanitizePaymentRow } from "@@/server/utils/orderPayments";
import { requireCurrentAdmin } from "@@/server/utils/session";

export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, "uuid");
  const admin = await requireCurrentAdmin(event);
  if (!uuid) {
    throw createError({
      statusCode: 400,
      statusMessage: "Payment uuid is required",
    });
  }

  const db = useDb();
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const currentResult = await client.query(
      `SELECT *
       FROM tb_shopping_order_payments
       WHERE uuid::text = $1
         AND deleted_at IS NULL
       FOR UPDATE`,
      [uuid],
    );
    const current = currentResult.rows[0];
    if (!current) {
      throw createError({
        statusCode: 404,
        statusMessage: "ไม่พบข้อมูลการชำระเงิน",
      });
    }
    if (current.order_payment_status === "verified") {
      throw createError({
        statusCode: 409,
        statusMessage:
          "ไม่สามารถลบรายการชำระเงินที่ยืนยันแล้ว กรุณาใช้กระบวนการคืนเงิน",
      });
    }

    const result = await client.query(
      `UPDATE tb_shopping_order_payments
       SET deleted_by = $1,
           deleted_at = NOW(),
           updated_by = $1,
           updated_at = NOW()
       WHERE uuid::text = $2
       RETURNING *`,
      [admin.uuid, uuid],
    );

    const latestResult = await client.query(
      `SELECT order_payment_status
       FROM tb_shopping_order_payments
       WHERE order_payment_order = $1
         AND deleted_at IS NULL
       ORDER BY id DESC
       LIMIT 1`,
      [current.order_payment_order],
    );
    const latestStatus = String(
      latestResult.rows[0]?.order_payment_status || "",
    );
    const orderPaymentStatus =
      latestStatus === "rejected"
        ? "failed"
        : latestStatus
          ? "pending"
          : "unpaid";
    await client.query(
      `UPDATE tb_shopping_orders
       SET order_payment_status = CASE
             WHEN order_payment_status = 'paid' THEN 'paid'
             ELSE $1::varchar(30)
           END,
           updated_by = $2,
           updated_at = NOW()
       WHERE uuid = $3`,
      [orderPaymentStatus, admin.uuid, current.order_payment_order],
    );

    await client.query("COMMIT");
    return { row: sanitizePaymentRow(result.rows[0]) };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});
