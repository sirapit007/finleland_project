import { useDb } from "@@/server/utils/db";
import { returnOrderCoupon } from "@@/server/utils/coupons";
import { requireCurrentAdmin } from "@@/server/utils/session";

export default defineEventHandler(async (event) => {
  const admin = await requireCurrentAdmin(event);
  const orderUuid = String(getRouterParam(event, "uuid") || "").trim();
  const body = await readBody<{ refund_confirmed?: boolean; reason?: string }>(
    event,
  );
  const reason = String(body?.reason || "").trim();
  if (!orderUuid || reason.length < 5 || reason.length > 2000) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "กรุณาระบุคำสั่งซื้อและเหตุผลการคืนสิทธิ์ 5–2,000 ตัวอักษร",
    });
  }
  const client = await useDb().connect();
  try {
    await client.query("BEGIN");
    const currentResult = await client.query(
      `SELECT * FROM tb_shopping_orders
       WHERE uuid::text = $1 AND deleted_at IS NULL FOR UPDATE`,
      [orderUuid],
    );
    const current = currentResult.rows[0];
    if (!current)
      throw createError({
        statusCode: 404,
        statusMessage: "Order was not found",
      });
    if (current.order_status !== "canceled") {
      throw createError({
        statusCode: 409,
        statusMessage: "คืนสิทธิ์ได้เฉพาะคำสั่งซื้อที่ยกเลิกแล้ว",
      });
    }
    // All usage changes lock the parent order first, so this state cannot
    // change underneath a concurrent cancellation, refund, or return request.
    const usageResult = await client.query(
      `SELECT usage_status FROM tb_shopping_order_coupon_usages
       WHERE usage_order = $1::uuid AND deleted_at IS NULL`,
      [orderUuid],
    );
    const usage = usageResult.rows[0];
    if (!usage) {
      throw createError({
        statusCode: 404,
        statusMessage: "คำสั่งซื้อนี้ไม่มีประวัติการใช้คูปอง",
      });
    }
    if (usage.usage_status === "returned") {
      await client.query("COMMIT");
      return {
        row: { ...current, order_coupon_usage_status: "returned" },
        returned: false,
      };
    }

    const couponCoveredOrder =
      Number(current.order_grand_total) === 0 &&
      current.order_payment_method === "coupon";
    const hadPayment =
      !couponCoveredOrder &&
      (Boolean(current.order_paid_at) ||
        ["paid", "refunded"].includes(String(current.order_payment_status)));
    if (hadPayment && body.refund_confirmed !== true) {
      throw createError({
        statusCode: 400,
        statusMessage: "กรุณายืนยันว่าได้คืนเงินให้ลูกค้านอกระบบเรียบร้อยแล้ว",
      });
    }
    const returned = await returnOrderCoupon(
      client,
      orderUuid,
      admin.uuid,
      reason,
    );
    let row = current;
    if (returned) {
      const result = await client.query(
        `UPDATE tb_shopping_orders
         SET order_payment_status = CASE WHEN $2::boolean THEN 'refunded' ELSE order_payment_status END,
             updated_by = $3, updated_at = NOW()
         WHERE uuid::text = $1 RETURNING *`,
        [orderUuid, hadPayment, admin.uuid],
      );
      row = result.rows[0];
      await client.query(
        `INSERT INTO tb_shopping_order_status_histories (
          order_status_history_order, order_status_history_previous_status,
          order_status_history_status, order_status_history_note, created_by
        ) VALUES ($1, 'canceled', 'canceled', $2, $3)`,
        [
          orderUuid,
          `${hadPayment ? "ยืนยันการคืนเงินนอกระบบแล้ว และคืนสิทธิ์คูปอง" : "คืนสิทธิ์คูปอง"}: ${reason}`,
          admin.uuid,
        ],
      );
    }
    await client.query("COMMIT");
    return {
      row: {
        ...row,
        order_coupon_usage_status: returned ? "returned" : usage.usage_status,
      },
      returned,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});
