import { useDb } from "@@/server/utils/db";
import { createAuthenticatedPaymentSlipUrl } from "@@/server/utils/paymentSlips";
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
    `SELECT base.order_payment_slip_public_id,
            base.order_payment_slip_mime_type
     FROM tb_shopping_order_payments AS base
     INNER JOIN tb_shopping_orders AS orders
       ON orders.uuid = base.order_payment_order
     WHERE base.uuid::text = $1
       AND base.deleted_at IS NULL
       AND orders.deleted_at IS NULL
       AND ($2::boolean OR orders.order_user = $3)
     LIMIT 1`,
    [uuid, actor.isAdmin, actor.user.uuid],
  );
  const slip = result.rows[0];
  const publicId = String(slip?.order_payment_slip_public_id || "").trim();
  if (!publicId) {
    throw createError({
      statusCode: 404,
      statusMessage: "ไม่พบรูปสลิปของรายการนี้",
    });
  }

  const mimeType = String(slip.order_payment_slip_mime_type || "");
  const extension =
    mimeType === "image/png"
      ? "png"
      : mimeType === "image/webp"
        ? "webp"
        : "jpg";

  setHeader(event, "Cache-Control", "private, no-store, max-age=0");
  return sendRedirect(
    event,
    createAuthenticatedPaymentSlipUrl(publicId, extension),
    302,
  );
});
