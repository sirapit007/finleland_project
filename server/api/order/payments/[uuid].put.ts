import { useDb } from "@@/server/utils/db";
import {
  sanitizePaymentRow,
  toPaymentMoney,
} from "@@/server/utils/orderPayments";
import { notifyLineAdminGroupOfVerifiedPayment } from "@@/server/utils/lineMessaging";
import { requireCurrentAdmin } from "@@/server/utils/session";

type PaymentReviewBody = {
  order_payment_status?: string;
  order_payment_verified_amount?: number;
  order_payment_transaction_ref?: string;
  order_payment_transaction_at?: string;
  order_payment_sending_bank?: string;
  order_payment_receiving_bank?: string;
  order_payment_review_note?: string;
};

const reviewStatuses = new Set([
  "verified",
  "rejected",
  "manual_review",
  "error",
]);

export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, "uuid");
  const body = await readBody<PaymentReviewBody>(event);
  const admin = await requireCurrentAdmin(event);
  if (!uuid) {
    throw createError({
      statusCode: 400,
      statusMessage: "Payment uuid is required",
    });
  }

  const nextStatus = String(body.order_payment_status || "").trim();
  if (!reviewStatuses.has(nextStatus)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Payment review status is invalid",
    });
  }
  const reviewNote = String(body.order_payment_review_note || "").trim();
  if (!reviewNote) {
    throw createError({
      statusCode: 400,
      statusMessage: "กรุณาระบุหมายเหตุการตรวจสอบ",
    });
  }

  const db = useDb();
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const currentResult = await client.query(
      `SELECT base.*,
              orders.order_payment_status AS current_order_payment_status,
              orders.order_number,
              orders.order_customer_name,
              orders.order_grand_total
       FROM tb_shopping_order_payments AS base
       INNER JOIN tb_shopping_orders AS orders
         ON orders.uuid = base.order_payment_order
       WHERE base.uuid::text = $1
         AND base.deleted_at IS NULL
         AND orders.deleted_at IS NULL
       FOR UPDATE OF base, orders`,
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
        statusMessage: "รายการที่ยืนยันแล้วไม่สามารถเปลี่ยนผลตรวจได้",
      });
    }

    const verifiedAmount = toPaymentMoney(
      body.order_payment_verified_amount ??
        current.order_payment_verified_amount,
    );
    const transactionRef = String(
      body.order_payment_transaction_ref ||
        current.order_payment_transaction_ref ||
        "",
    ).trim();
    const sendingBank = String(
      body.order_payment_sending_bank ||
        current.order_payment_sending_bank ||
        "",
    ).trim();
    const receivingBank = String(
      body.order_payment_receiving_bank ||
        current.order_payment_receiving_bank ||
        "",
    ).trim();
    const transactionAtValue =
      body.order_payment_transaction_at ||
      current.order_payment_transaction_at ||
      null;
    const transactionAt = transactionAtValue
      ? new Date(transactionAtValue)
      : null;

    if (nextStatus === "verified") {
      if (
        !transactionRef ||
        !sendingBank ||
        !transactionAt ||
        Number.isNaN(transactionAt.getTime())
      ) {
        throw createError({
          statusCode: 400,
          statusMessage:
            "การอนุมัติต้องมีเลขอ้างอิง ธนาคารต้นทาง ยอดเงิน และเวลาธุรกรรม",
        });
      }
      if (
        verifiedAmount !== toPaymentMoney(current.order_payment_expected_amount)
      ) {
        throw createError({
          statusCode: 409,
          statusMessage: "ยอดเงินในสลิปไม่ตรงกับยอดคำสั่งซื้อ",
        });
      }

      const otherVerified = await client.query(
        `SELECT 1
         FROM tb_shopping_order_payments
         WHERE order_payment_order = $1
           AND order_payment_status = 'verified'
           AND deleted_at IS NULL
           AND uuid::text <> $2
         LIMIT 1`,
        [current.order_payment_order, uuid],
      );
      if (otherVerified.rows[0]) {
        throw createError({
          statusCode: 409,
          statusMessage: "คำสั่งซื้อนี้มีรายการชำระเงินที่ยืนยันแล้ว",
        });
      }
    }

    const paymentResult = await client.query(
      `UPDATE tb_shopping_order_payments
       SET order_payment_status = $1::varchar(30),
           order_payment_verified_amount = CASE
             WHEN $1::varchar(30) = 'verified' THEN $2
             ELSE order_payment_verified_amount
           END,
           order_payment_transaction_ref = COALESCE(
             NULLIF($3::varchar(100), ''),
             order_payment_transaction_ref
           ),
           order_payment_transaction_at = COALESCE($4, order_payment_transaction_at),
           order_payment_sending_bank = COALESCE(
             NULLIF($5::varchar(10), ''),
             order_payment_sending_bank
           ),
           order_payment_receiving_bank = COALESCE(
             NULLIF($6::varchar(10), ''),
             order_payment_receiving_bank
           ),
           order_payment_verified_at = CASE
             WHEN $1::varchar(30) = 'verified' THEN NOW()
             ELSE order_payment_verified_at
           END,
           order_payment_rejection_reason = CASE
             WHEN $1::varchar(30) = 'rejected' THEN $7
             ELSE order_payment_rejection_reason
           END,
           order_payment_reviewed_by = $8,
           order_payment_reviewed_at = NOW(),
           order_payment_review_note = $7,
           updated_by = $8,
           updated_at = NOW()
       WHERE uuid::text = $9
       RETURNING *`,
      [
        nextStatus,
        verifiedAmount,
        transactionRef,
        transactionAt,
        sendingBank,
        receivingBank,
        reviewNote,
        admin.uuid,
        uuid,
      ],
    );
    const payment = paymentResult.rows[0];

    if (nextStatus === "verified") {
      await client.query(
        `UPDATE tb_shopping_orders
         SET order_payment_method = 'merchant_qr',
             order_payment_status = 'paid',
             order_paid_at = COALESCE(order_paid_at, $1, NOW()),
             updated_by = $2,
             updated_at = NOW()
         WHERE uuid = $3`,
        [transactionAt, admin.uuid, current.order_payment_order],
      );
    } else {
      const orderPaymentStatus =
        nextStatus === "rejected" ? "failed" : "pending";
      await client.query(
        `UPDATE tb_shopping_orders
         SET order_payment_method = 'merchant_qr',
             order_payment_status = CASE
               WHEN order_payment_status = 'paid' THEN 'paid'
               ELSE $1::varchar(30)
             END,
             updated_by = $2,
             updated_at = NOW()
         WHERE uuid = $3`,
        [orderPaymentStatus, admin.uuid, current.order_payment_order],
      );
    }

    await client.query("COMMIT");
    let lineNotification = {
      sent: false,
      skipped: true,
      reason: "Payment was not verified",
    };
    if (nextStatus === "verified") {
      try {
        lineNotification = await notifyLineAdminGroupOfVerifiedPayment({
          customerName: String(current.order_customer_name || ""),
          orderNumber: String(current.order_number || ""),
          total: toPaymentMoney(current.order_grand_total),
          transactionRef: String(payment.order_payment_transaction_ref || ""),
          paidAt: transactionAt || new Date(),
        });
      } catch (notificationError) {
        console.error(
          "Unable to notify LINE admin group of manually verified payment",
          notificationError,
        );
        lineNotification = {
          sent: false,
          skipped: false,
          reason: "LINE rejected the payment notification",
        };
      }
    }
    return {
      row: sanitizePaymentRow(payment, {
        includeProviderResponse: true,
      }),
      lineNotification,
    };
  } catch (error: any) {
    await client.query("ROLLBACK");
    if (error?.code === "23505") {
      throw createError({
        statusCode: 409,
        statusMessage: "เลขอ้างอิงธุรกรรมนี้ถูกใช้งานแล้ว",
      });
    }
    throw error;
  } finally {
    client.release();
  }
});
