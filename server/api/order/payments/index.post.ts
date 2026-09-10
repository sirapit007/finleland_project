import {
  destroyAuthenticatedPaymentSlip,
  uploadAuthenticatedPaymentSlip,
  validatePaymentSlip,
} from "@@/server/utils/paymentSlips";
import {
  sanitizePaymentRow,
  toPaymentMoney,
} from "@@/server/utils/orderPayments";
import {
  parseSlipOkTransactionAt,
  SlipOkConnectionError,
  type SlipOkResponseBody,
  type SlipOkTransaction,
  verifySlipWithSlipOk,
} from "@@/server/utils/slipOk";
import { useDb } from "@@/server/utils/db";
import { notifyLineAdminGroupOfVerifiedPayment } from "@@/server/utils/lineMessaging";
import { requireCurrentUser } from "@@/server/utils/session";

type PaymentAttemptStatus = "verified" | "rejected" | "manual_review";

const positiveInteger = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

const formValue = (
  parts: Awaited<ReturnType<typeof readMultipartFormData>>,
  name: string,
) => String(parts?.find((part) => part.name === name)?.data || "").trim();

const comparableValue = (value: unknown) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const comparableName = (value: unknown) =>
  String(value || "")
    .normalize("NFKC")
    .toLocaleLowerCase("th")
    .replace(/[\s\p{P}\p{S}]+/gu, "");

const matchesExpectedValue = (expected: string, values: unknown[]) =>
  values.some((value) => comparableValue(value) === expected);

const matchesExpectedName = (expected: string, value: unknown) => {
  const actual = comparableName(value);
  if (!expected || !actual) return false;
  if (actual === expected) return true;

  // Slip providers can mask or truncate the receiver surname.
  const [shorter, longer] =
    actual.length < expected.length ? [actual, expected] : [expected, actual];
  return shorter.length >= 6 && longer.startsWith(shorter);
};

const displayName = (party?: SlipOkTransaction["sender"]) =>
  String(party?.displayName || party?.name || "").trim() || null;

const accountValue = (party?: SlipOkTransaction["sender"]) =>
  String(party?.account?.value || "").trim() || null;

const classifyProviderResponse = (input: {
  httpStatus: number;
  body: SlipOkResponseBody;
}): PaymentAttemptStatus => {
  if (
    input.httpStatus >= 200 &&
    input.httpStatus < 300 &&
    input.body.success === true &&
    input.body.data?.success === true
  ) {
    return "verified";
  }

  const code = Number(input.body.code || 0);
  if (
    [1001, 1002, 1003, 1004, 1009, 1010].includes(code) ||
    input.httpStatus === 401 ||
    input.httpStatus === 408 ||
    input.httpStatus === 429 ||
    input.httpStatus >= 500
  ) {
    return "manual_review";
  }
  return "rejected";
};

export default defineEventHandler(async (event) => {
  const currentUser = await requireCurrentUser(event);
  const config = useRuntimeConfig();
  const maxBytes = positiveInteger(config.paymentSlipMaxBytes, 5 * 1_048_576);
  const requestLength = Number(getHeader(event, "content-length") || 0);
  if (requestLength > maxBytes + 256 * 1024) {
    throw createError({
      statusCode: 413,
      statusMessage: `ไฟล์สลิปต้องมีขนาดไม่เกิน ${Math.ceil(maxBytes / 1_048_576)} MB`,
    });
  }

  const parts = await readMultipartFormData(event);
  if (!parts) {
    throw createError({
      statusCode: 400,
      statusMessage: "กรุณาแนบไฟล์สลิป",
    });
  }
  const orderUuid = formValue(parts, "orderUuid");
  const filePart = parts.find(
    (part) => part.name === "file" && Boolean(part.filename),
  );
  if (!orderUuid) {
    throw createError({
      statusCode: 400,
      statusMessage: "ไม่พบรหัสคำสั่งซื้อ",
    });
  }
  if (!filePart) {
    throw createError({
      statusCode: 400,
      statusMessage: "กรุณาแนบไฟล์สลิป",
    });
  }

  const slip = validatePaymentSlip({
    data: filePart.data,
    filename: filePart.filename,
    declaredMimeType: filePart.type,
    maxBytes,
  });
  const db = useDb();
  const orderResult = await db.query(
    `SELECT uuid, order_number, order_user, order_customer_name,
            order_grand_total, order_status, order_payment_status,
            order_placed_at, created_at
     FROM tb_shopping_orders
     WHERE uuid::text = $1
       AND order_user = $2
       AND deleted_at IS NULL
     LIMIT 1`,
    [orderUuid, currentUser.uuid],
  );
  const order = orderResult.rows[0];
  if (!order) {
    throw createError({
      statusCode: 404,
      statusMessage: "ไม่พบคำสั่งซื้อ หรือคุณไม่มีสิทธิ์ชำระรายการนี้",
    });
  }
  if (["completed", "canceled"].includes(String(order.order_status))) {
    throw createError({
      statusCode: 409,
      statusMessage: "คำสั่งซื้อนี้ไม่สามารถรับการชำระเงินได้แล้ว",
    });
  }
  if (order.order_payment_status === "paid") {
    throw createError({
      statusCode: 409,
      statusMessage: "คำสั่งซื้อนี้ชำระเงินแล้ว",
    });
  }

  const rateLimit = positiveInteger(config.paymentAttemptRateLimit, 5);
  const rateWindowMinutes = positiveInteger(
    config.paymentAttemptRateWindowMinutes,
    15,
  );
  const rateResult = await db.query(
    `SELECT COUNT(*) AS total
     FROM tb_shopping_order_payments
     WHERE order_payment_order::text = $1
       AND created_by = $2
       AND created_at >= NOW() - ($3::text || ' minutes')::interval`,
    [orderUuid, currentUser.uuid, rateWindowMinutes],
  );
  if (Number(rateResult.rows[0]?.total || 0) >= rateLimit) {
    setHeader(event, "Retry-After", rateWindowMinutes * 60);
    throw createError({
      statusCode: 429,
      statusMessage: `อัปโหลดสลิปบ่อยเกินไป กรุณารอ ${rateWindowMinutes} นาทีแล้วลองใหม่`,
    });
  }

  let uploaded: { publicId: string; secureUrl: string };
  try {
    uploaded = await uploadAuthenticatedPaymentSlip(slip, orderUuid);
  } catch (error) {
    console.error("Unable to store payment slip", error);
    throw createError({
      statusCode: 502,
      statusMessage: "ไม่สามารถจัดเก็บไฟล์สลิปได้ กรุณาลองใหม่อีกครั้ง",
    });
  }

  let paymentUuid = "";
  const createClient = await db.connect();
  try {
    await createClient.query("BEGIN");
    const lockedOrderResult = await createClient.query(
      `SELECT uuid, order_payment_status, order_status, order_grand_total
       FROM tb_shopping_orders
       WHERE uuid::text = $1
         AND order_user = $2
         AND deleted_at IS NULL
       FOR UPDATE`,
      [orderUuid, currentUser.uuid],
    );
    const lockedOrder = lockedOrderResult.rows[0];
    if (
      !lockedOrder ||
      ["paid", "refunded"].includes(String(lockedOrder.order_payment_status)) ||
      ["completed", "canceled"].includes(String(lockedOrder.order_status))
    ) {
      throw createError({
        statusCode: 409,
        statusMessage: "คำสั่งซื้อนี้ชำระเงินแล้วหรือไม่พร้อมรับชำระ",
      });
    }

    // The order may have changed while the slip was uploading.
    order.order_grand_total = lockedOrder.order_grand_total;
    const paymentResult = await createClient.query(
      `INSERT INTO tb_shopping_order_payments (
         order_payment_order,
         order_payment_provider,
         order_payment_method,
         order_payment_status,
         order_payment_expected_amount,
         order_payment_slip_url,
         order_payment_slip_public_id,
         order_payment_slip_original_name,
         order_payment_slip_mime_type,
         order_payment_slip_size,
         order_payment_slip_sha256,
         created_by
       ) VALUES (
         $1, 'slipok', 'merchant_qr', 'pending', $2,
         $3, $4, $5, $6, $7, $8, $9
       )
       RETURNING *`,
      [
        lockedOrder.uuid,
        toPaymentMoney(order.order_grand_total),
        uploaded.secureUrl,
        uploaded.publicId,
        slip.filename,
        slip.mimeType,
        slip.size,
        slip.sha256,
        currentUser.uuid,
      ],
    );
    paymentUuid = String(paymentResult.rows[0].uuid);
    await createClient.query(
      `UPDATE tb_shopping_orders
       SET order_payment_method = 'merchant_qr',
           order_payment_status = 'pending',
           updated_by = $1,
           updated_at = NOW()
       WHERE uuid = $2`,
      [currentUser.uuid, lockedOrder.uuid],
    );
    await createClient.query("COMMIT");
  } catch (error) {
    await createClient.query("ROLLBACK");
    try {
      await destroyAuthenticatedPaymentSlip(uploaded.publicId);
    } catch (cleanupError) {
      console.error("Unable to remove orphan payment slip", cleanupError);
    }
    throw error;
  } finally {
    createClient.release();
  }

  let providerHttpStatus = 503;
  let providerBody: SlipOkResponseBody = {};
  try {
    const providerResult = await verifySlipWithSlipOk({
      data: slip.data,
      filename: slip.filename,
      mimeType: slip.mimeType,
      amount: toPaymentMoney(order.order_grand_total),
    });
    providerHttpStatus = providerResult.httpStatus;
    providerBody = providerResult.body;
  } catch (error) {
    providerBody = {
      code: "CONNECTION_ERROR",
      message:
        error instanceof SlipOkConnectionError
          ? error.message
          : "ไม่สามารถตรวจสอบสลิปได้",
    };
  }

  const transaction = providerBody.data || {};
  const transactionAt = parseSlipOkTransactionAt(transaction);
  const transactionRef = String(transaction.transRef || "").trim();
  const sendingBank = String(transaction.sendingBank || "").trim();
  const receivingBank = String(transaction.receivingBank || "").trim();
  const verifiedAmount =
    transaction.amount === undefined
      ? null
      : toPaymentMoney(transaction.amount);
  const senderName = displayName(transaction.sender);
  const senderAccount = accountValue(transaction.sender);
  const receiverName = displayName(transaction.receiver);
  const receiverAccount = accountValue(transaction.receiver);
  const receiverProxyType =
    String(transaction.receiver?.proxy?.type || "").trim() || null;
  const receiverProxyValue =
    String(transaction.receiver?.proxy?.value || "").trim() || null;
  const merchantId = String(transaction.toMerchantId || "").trim() || null;
  let attemptStatus = classifyProviderResponse({
    httpStatus: providerHttpStatus,
    body: providerBody,
  });
  let rejectionReason =
    String(providerBody.message || transaction.message || "").trim() || null;
  const expectedAccount = comparableValue(config.paymentReceiverAccount);

  if (import.meta.dev || process.env.PAYMENT_DEBUG === "true") {
    console.log("[payment-slip:receiver-account-check]", {
      providerHttpStatus,
      providerCode: providerBody.code ?? null,
      providerMessage: providerBody.message ?? null,
      attemptStatus,
      expectedAccountRaw: String(config.paymentReceiverAccount || ""),
      expectedAccount,
      receiverName,
      receiverAccount,
      receiverAccountNormalized: comparableValue(receiverAccount),
      receiverProxyType,
      receiverProxyValue,
      receiverProxyValueNormalized: comparableValue(receiverProxyValue),
      receivingBank,
      merchantId,
    });
  }

  if (attemptStatus === "verified") {
    const expectedAmount = toPaymentMoney(order.order_grand_total);
    const expectedBank = String(config.paymentReceiverBankCode || "").trim();
    const expectedReceiverName = comparableName(config.paymentReceiverName);
    const expectedMerchantId = comparableValue(
      config.paymentReceiverMerchantId,
    );
    const orderCreatedAt = new Date(order.order_placed_at || order.created_at);
    const earliestAcceptedAt = new Date(orderCreatedAt.getTime() - 5 * 60_000);

    if (verifiedAmount !== expectedAmount) {
      attemptStatus = "rejected";
      rejectionReason = "ยอดเงินในสลิปไม่ตรงกับยอดคำสั่งซื้อ";
    } else if (!transactionRef || !sendingBank || !transactionAt) {
      attemptStatus = "manual_review";
      rejectionReason = "SlipOK ส่งข้อมูลอ้างอิงธุรกรรมไม่ครบ";
    } else if (transactionAt < earliestAcceptedAt) {
      attemptStatus = "rejected";
      rejectionReason = "เวลาธุรกรรมเกิดก่อนสร้างคำสั่งซื้อ";
    } else if (
      expectedBank &&
      receivingBank &&
      receivingBank !== expectedBank
    ) {
      attemptStatus = "rejected";
      rejectionReason = "ธนาคารผู้รับไม่ตรงกับบัญชีร้านค้า";
    } else if (
      expectedAccount &&
      !matchesExpectedValue(expectedAccount, [
        receiverAccount,
        receiverProxyValue,
      ])
    ) {
      attemptStatus = "rejected";
      rejectionReason = "บัญชีผู้รับไม่ตรงกับบัญชีร้านค้า";
    } else if (
      expectedReceiverName &&
      !matchesExpectedName(expectedReceiverName, receiverName)
    ) {
      attemptStatus = "rejected";
      rejectionReason = "ชื่อผู้รับไม่ตรงกับชื่อร้านค้า";
    } else if (
      expectedMerchantId &&
      comparableValue(merchantId) !== expectedMerchantId
    ) {
      attemptStatus = "rejected";
      rejectionReason = "Merchant ID ไม่ตรงกับร้านค้า";
    }
  }

  const finalClient = await db.connect();
  let payment: Record<string, any> | null = null;
  let orderPaymentStatus = "pending";
  let storedTransactionRef: string | null = transactionRef || null;
  try {
    await finalClient.query("BEGIN");
    const lockedResult = await finalClient.query(
      `SELECT payment.*, orders.order_payment_status AS current_order_payment_status,
              orders.order_status AS current_order_status,
              orders.deleted_at AS order_deleted_at,
              orders.order_grand_total AS current_order_grand_total
       FROM tb_shopping_order_payments AS payment
       INNER JOIN tb_shopping_orders AS orders
         ON orders.uuid = payment.order_payment_order
       WHERE payment.uuid::text = $1
         AND payment.deleted_at IS NULL
       FOR UPDATE OF payment, orders`,
      [paymentUuid],
    );
    const locked = lockedResult.rows[0];
    if (!locked) {
      throw createError({
        statusCode: 404,
        statusMessage: "ไม่พบรายการตรวจสอบการชำระเงิน",
      });
    }

    if (
      ["paid", "refunded"].includes(String(locked.current_order_payment_status))
    ) {
      attemptStatus = "rejected";
      rejectionReason = "คำสั่งซื้อนี้มีการชำระเงินที่ยืนยันแล้ว";
    }

    if (
      locked.order_deleted_at ||
      ["completed", "canceled"].includes(String(locked.current_order_status))
    ) {
      attemptStatus = "manual_review";
      rejectionReason =
        "คำสั่งซื้อถูกยกเลิกหรือปิดแล้ว กรุณาติดต่อเจ้าหน้าที่เพื่อตรวจสอบยอดเงิน";
    } else if (
      attemptStatus === "verified" &&
      verifiedAmount !== toPaymentMoney(locked.current_order_grand_total)
    ) {
      attemptStatus = "manual_review";
      rejectionReason =
        "ยอดคำสั่งซื้อเปลี่ยนระหว่างตรวจสอบสลิป กรุณาให้เจ้าหน้าที่ตรวจสอบส่วนต่าง";
    }

    if (sendingBank && transactionRef) {
      const duplicateResult = await finalClient.query(
        `SELECT uuid
         FROM tb_shopping_order_payments
         WHERE order_payment_sending_bank = $1
           AND order_payment_transaction_ref = $2
           AND uuid::text <> $3
         LIMIT 1`,
        [sendingBank, transactionRef, paymentUuid],
      );
      if (duplicateResult.rows[0]) {
        attemptStatus = "rejected";
        rejectionReason = "สลิปนี้ถูกใช้กับรายการอื่นแล้ว";
        storedTransactionRef = null;
      }
    }

    const paymentResult = await finalClient.query(
      `UPDATE tb_shopping_order_payments
       SET order_payment_status = $1::varchar(30),
           order_payment_verified_amount = $2,
           order_payment_transaction_ref = $3,
           order_payment_transaction_at = $4,
           order_payment_sending_bank = $5,
           order_payment_receiving_bank = $6,
           order_payment_sender_name = $7,
           order_payment_sender_account = $8,
           order_payment_receiver_name = $9,
           order_payment_receiver_account = $10,
           order_payment_receiver_proxy_type = $11,
           order_payment_receiver_proxy_value = $12,
           order_payment_merchant_id = $13,
           order_payment_provider_response = $14::jsonb,
           order_payment_provider_code = $15,
           order_payment_provider_message = $16,
           order_payment_rejection_reason = $17,
           order_payment_verified_at = CASE
             WHEN $1::varchar(30) = 'verified' THEN NOW()
             ELSE NULL
           END,
           updated_by = $18,
           updated_at = NOW()
       WHERE uuid::text = $19
       RETURNING *`,
      [
        attemptStatus,
        verifiedAmount,
        storedTransactionRef,
        transactionAt,
        sendingBank || null,
        receivingBank || null,
        senderName,
        senderAccount,
        receiverName,
        receiverAccount,
        receiverProxyType,
        receiverProxyValue,
        merchantId,
        JSON.stringify(providerBody),
        providerBody.code === undefined ? null : String(providerBody.code),
        String(providerBody.message || transaction.message || "").trim() ||
          null,
        rejectionReason,
        currentUser.uuid,
        paymentUuid,
      ],
    );
    payment = paymentResult.rows[0];

    orderPaymentStatus =
      attemptStatus === "verified"
        ? "paid"
        : attemptStatus === "rejected"
          ? "failed"
          : "pending";
    await finalClient.query(
      `UPDATE tb_shopping_orders
       SET order_payment_method = 'merchant_qr',
           order_payment_status = CASE
             WHEN order_payment_status IN ('paid', 'refunded') THEN order_payment_status
             ELSE $1::varchar(30)
           END,
           order_paid_at = CASE
             WHEN $1::varchar(30) = 'paid' THEN COALESCE(order_paid_at, $2, NOW())
             ELSE order_paid_at
           END,
           updated_by = $3,
           updated_at = NOW()
       WHERE uuid::text = $4`,
      [orderPaymentStatus, transactionAt, currentUser.uuid, orderUuid],
    );
    await finalClient.query("COMMIT");
  } catch (error: any) {
    await finalClient.query("ROLLBACK");
    if (error?.code === "23505") {
      attemptStatus = "rejected";
      rejectionReason = "สลิปนี้ถูกใช้แล้ว";
      await db.query(
        `UPDATE tb_shopping_order_payments
         SET order_payment_status = 'rejected',
             order_payment_provider_response = $1::jsonb,
             order_payment_provider_code = $2,
             order_payment_provider_message = $3,
             order_payment_rejection_reason = 'สลิปนี้ถูกใช้แล้ว',
             updated_by = $4,
             updated_at = NOW()
         WHERE uuid::text = $5`,
        [
          JSON.stringify(providerBody),
          providerBody.code === undefined ? null : String(providerBody.code),
          String(providerBody.message || "").trim() || null,
          currentUser.uuid,
          paymentUuid,
        ],
      );
      await db.query(
        `UPDATE tb_shopping_orders
         SET order_payment_status = CASE
               WHEN order_payment_status IN ('paid', 'refunded') THEN order_payment_status
               ELSE 'failed'
             END,
             updated_by = $1,
             updated_at = NOW()
         WHERE uuid::text = $2`,
        [currentUser.uuid, orderUuid],
      );
      orderPaymentStatus = "failed";
      const duplicateRow = await db.query(
        `SELECT * FROM tb_shopping_order_payments WHERE uuid::text = $1`,
        [paymentUuid],
      );
      payment = duplicateRow.rows[0] || null;
    } else {
      throw error;
    }
  } finally {
    finalClient.release();
  }

  if (attemptStatus === "manual_review") {
    setResponseStatus(event, 202);
  }
  let lineNotification: any = {
    sent: false,
    skipped: true,
    reason: "Payment was not verified",
  };
  if (attemptStatus === "verified" && payment) {
    try {
      lineNotification = await notifyLineAdminGroupOfVerifiedPayment({
        customerName: String(order.order_customer_name || ""),
        orderNumber: String(order.order_number || ""),
        total: toPaymentMoney(order.order_grand_total),
        transactionRef: String(payment.order_payment_transaction_ref || ""),
        paidAt: transactionAt || new Date(),
      });
    } catch (notificationError) {
      console.error(
        "Unable to notify LINE admin group of payment",
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
    row: sanitizePaymentRow(payment),
    orderPaymentStatus,
    lineNotification,
    message:
      attemptStatus === "verified"
        ? "ตรวจสอบสลิปสำเร็จและยืนยันการชำระเงินแล้ว"
        : attemptStatus === "manual_review"
          ? "รับสลิปแล้ว และกำลังรอเจ้าหน้าที่ตรวจสอบ"
          : rejectionReason || "สลิปไม่ผ่านการตรวจสอบ",
  };
});
