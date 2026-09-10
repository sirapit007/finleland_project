import type { PoolClient } from "pg";
import { calculateOrderItemPricing, toMoney } from "./orderPricing";
import {
  assertCouponUuid,
  couponError,
  couponSnapshot,
  evaluateCouponRules,
  type CouponBasket,
  type CouponRecord,
} from "./couponRules";

export async function lockCoupon(client: PoolClient, couponUuid: string) {
  const result = await client.query(
    "SELECT * FROM tb_event_coupons WHERE uuid=$1 FOR UPDATE",
    [assertCouponUuid(couponUuid)],
  );
  const coupon = result.rows[0];
  if (!coupon || coupon.deleted_at) couponError("ไม่พบคูปองนี้", 404);
  return coupon;
}
export function assertCouponDistributable(
  coupon: CouponRecord,
  source: string,
) {
  if (
    coupon.coupon_status !== "active" ||
    coupon.coupon_distribution_method !== source
  )
    couponError("คูปองนี้ยังไม่เปิดให้รับด้วยวิธีนี้", 409);
  if (
    coupon.coupon_expires_at &&
    new Date(coupon.coupon_expires_at).getTime() <= Date.now()
  )
    couponError("คูปองนี้หมดอายุแล้ว", 409);
}
// All operations lock campaign BEFORE ownership. Callers that alter existing orders lock the order first.
export async function grantCoupon(
  client: PoolClient,
  couponUuid: string,
  userUuid: string,
  source: string,
  actorUuid: string,
) {
  assertCouponUuid(userUuid);
  const coupon = await lockCoupon(client, couponUuid);
  const existing = await client.query(
    "SELECT *,uuid AS user_coupon_uuid FROM tb_user_coupons WHERE user_coupon_coupon=$1 AND user_coupon_user=$2",
    [couponUuid, userUuid],
  );
  if (existing.rows[0]) return { row: existing.rows[0], alreadyClaimed: true };
  assertCouponDistributable(coupon, source);
  if (
    Number(coupon.coupon_issued_count) >= Number(coupon.coupon_recipient_limit)
  )
    couponError("คูปองนี้มีผู้รับครบจำนวนแล้ว", 409, "COUPON_QUOTA_EXHAUSTED");
  const userResult = await client.query(
    "SELECT uuid,created_at FROM tb_users WHERE uuid=$1 AND deleted_at IS NULL AND role='User'",
    [userUuid],
  );
  const user = userResult.rows[0];
  if (!user) couponError("ผู้รับต้องเป็นสมาชิกที่ใช้งานอยู่", 400);
  if (
    source === "signup" &&
    (!coupon.coupon_activated_at ||
      new Date(user.created_at).getTime() <
        new Date(coupon.coupon_activated_at).getTime())
  )
    couponError("คูปองนี้สำหรับสมาชิกที่สมัครหลังเปิดแจกเท่านั้น", 409);
  const result = await client.query(
    `INSERT INTO tb_user_coupons (user_coupon_coupon,user_coupon_user,user_coupon_source,created_by)
    VALUES ($1,$2,$3,$4) RETURNING *,uuid AS user_coupon_uuid`,
    [couponUuid, userUuid, source, actorUuid],
  );
  await client.query(
    "UPDATE tb_event_coupons SET coupon_issued_count=coupon_issued_count+1,updated_by=$2::text,updated_at=NOW() WHERE uuid=$1",
    [couponUuid, actorUuid],
  );
  return { row: result.rows[0], alreadyClaimed: false };
}
export async function grantSignupCoupons(client: PoolClient, userUuid: string) {
  // Stable order prevents deadlocks when multiple signup campaigns are active.
  const result = await client.query(
    `SELECT c.uuid FROM tb_event_coupons c JOIN tb_users u ON u.uuid=$1
    WHERE c.coupon_distribution_method='signup' AND c.coupon_status='active' AND c.deleted_at IS NULL
      AND c.coupon_activated_at <= u.created_at AND (c.coupon_expires_at IS NULL OR c.coupon_expires_at > clock_timestamp())
      AND c.coupon_issued_count < c.coupon_recipient_limit ORDER BY c.id`,
    [userUuid],
  );
  for (const row of result.rows) {
    const locked = await client.query(
      "SELECT * FROM tb_event_coupons WHERE uuid=$1 FOR UPDATE",
      [row.uuid],
    );
    const coupon = locked.rows[0];
    // A queued registration may find that the preceding transaction took the last slot or admin paused it.
    if (
      !coupon ||
      coupon.deleted_at ||
      coupon.coupon_distribution_method !== "signup" ||
      coupon.coupon_status !== "active" ||
      Number(coupon.coupon_issued_count) >=
        Number(coupon.coupon_recipient_limit) ||
      (coupon.coupon_expires_at &&
        new Date(coupon.coupon_expires_at).getTime() <= Date.now())
    )
      continue;
    await grantCoupon(client, row.uuid, userUuid, "signup", userUuid);
  }
}
export async function getCouponBasket(client: PoolClient, userUuid: string) {
  const result = await client.query(
    `SELECT b.basket_product,b.basket_quantity,p.product_selling_price,p.uuid AS product_uuid,
    promo.promotion_discounted_price,promo.promotion_bundle_price,promo.promotion_min_quantity,promo.promotion_min_purchase_amount
    FROM tb_shopping_basket b LEFT JOIN vw_master_products p ON p.uuid::text=b.basket_product
    LEFT JOIN LATERAL (SELECT x.* FROM tb_event_promotions x WHERE x.promotion_product=b.basket_product
      AND x.promotion_is_active=TRUE AND x.deleted_at IS NULL
      AND CURRENT_DATE BETWEEN x.promotion_start_date AND x.promotion_end_date ORDER BY x.promotion_start_date DESC,x.id DESC LIMIT 1) promo ON TRUE
    WHERE b.created_by=$1 AND b.deleted_at IS NULL AND b.basket_expire>NOW() ORDER BY b.id`,
    [userUuid],
  );
  let subtotal = 0,
    promotionDiscount = 0,
    totalQuantity = 0;
  const products = new Set<string>();
  for (const item of result.rows) {
    if (
      !item.product_uuid ||
      !Number.isInteger(Number(item.basket_quantity)) ||
      Number(item.basket_quantity) <= 0
    )
      couponError("กรุณาตรวจสอบสินค้าในตะกร้าก่อนใช้คูปอง", 409);
    const price = calculateOrderItemPricing(item, Number(item.basket_quantity));
    subtotal += price.subtotal;
    promotionDiscount += price.discount;
    totalQuantity += Number(item.basket_quantity);
    products.add(item.basket_product);
  }
  return {
    subtotal: toMoney(subtotal),
    promotionDiscount: toMoney(promotionDiscount),
    merchandiseTotal: toMoney(subtotal - promotionDiscount),
    totalQuantity,
    distinctItems: products.size,
  };
}
export function evaluateOwnedCoupon(
  coupon: CouponRecord,
  basket: CouponBasket,
) {
  if (
    coupon.deleted_at ||
    coupon.user_coupon_deleted_at ||
    coupon.coupon_status === "draft"
  )
    return {
      eligible: false,
      discount_amount: 0,
      ineligible_reason: "คูปองนี้ไม่พร้อมใช้งาน",
    };
  if (
    coupon.coupon_expires_at &&
    new Date(coupon.coupon_expires_at).getTime() <= Date.now()
  )
    return {
      eligible: false,
      discount_amount: 0,
      ineligible_reason: "คูปองนี้หมดอายุแล้ว",
    };
  if (
    Number(coupon.user_coupon_used_count) >= Number(coupon.coupon_usage_limit)
  )
    return {
      eligible: false,
      discount_amount: 0,
      ineligible_reason: "ใช้คูปองครบจำนวนครั้งแล้ว",
    };
  return evaluateCouponRules(coupon, basket);
}
export type CouponEvaluation = {
  userCouponUuid: string;
  couponUuid: string;
  discountAmount: number;
  snapshot: CouponRecord;
};
export async function evaluateAndLockUserCoupon(
  client: PoolClient,
  userUuid: string,
  userCouponUuid: string,
  basket: CouponBasket,
): Promise<CouponEvaluation> {
  assertCouponUuid(userCouponUuid);
  const lookup = await client.query(
    "SELECT user_coupon_coupon FROM tb_user_coupons WHERE uuid=$1 AND user_coupon_user=$2",
    [userCouponUuid, userUuid],
  );
  if (!lookup.rows[0]) couponError("ไม่พบคูปองที่คุณถือครอง", 404);
  const coupon = await lockCoupon(client, lookup.rows[0].user_coupon_coupon);
  const holding = await client.query(
    "SELECT * FROM tb_user_coupons WHERE uuid=$1 AND user_coupon_user=$2 FOR UPDATE",
    [userCouponUuid, userUuid],
  );
  const holder = holding.rows[0];
  if (!holder || holder.deleted_at) couponError("ไม่พบคูปองที่คุณถือครอง", 404);
  const eligibility = evaluateOwnedCoupon(
    { ...coupon, user_coupon_used_count: holder.user_coupon_used_count },
    basket,
  );
  if (!eligibility.eligible)
    couponError(
      eligibility.ineligible_reason || "คูปองไม่ผ่านเงื่อนไข",
      409,
      "COUPON_NOT_ELIGIBLE",
    );
  return {
    userCouponUuid,
    couponUuid: coupon.uuid,
    discountAmount: eligibility.discount_amount,
    snapshot: couponSnapshot(coupon),
  };
}
export async function consumeUserCoupon(
  client: PoolClient,
  evaluation: CouponEvaluation,
  input: { orderUuid: string; userUuid: string },
) {
  const updated = await client.query(
    `UPDATE tb_user_coupons h SET user_coupon_used_count=h.user_coupon_used_count+1,updated_by=$2::text,updated_at=NOW()
    FROM tb_event_coupons c WHERE h.uuid=$1 AND h.user_coupon_user=$2::uuid AND h.user_coupon_coupon=c.uuid
      AND h.user_coupon_used_count<c.coupon_usage_limit AND h.deleted_at IS NULL RETURNING h.uuid`,
    [evaluation.userCouponUuid, input.userUuid],
  );
  if (!updated.rowCount)
    couponError("คูปองถูกใช้ครบจำนวนครั้งแล้ว กรุณาเลือกใหม่", 409);
  await client.query(
    `INSERT INTO tb_shopping_order_coupon_usages (usage_order,usage_user_coupon,usage_coupon,usage_user,usage_discount_amount,usage_snapshot,created_by)
    VALUES ($1,$2,$3,$4::uuid,$5,$6::jsonb,$4::text)`,
    [
      input.orderUuid,
      evaluation.userCouponUuid,
      evaluation.couponUuid,
      input.userUuid,
      evaluation.discountAmount,
      JSON.stringify(evaluation.snapshot),
    ],
  );
}
export async function returnOrderCoupon(
  client: PoolClient,
  orderUuid: string,
  actorUuid: string,
  reason: string,
) {
  await client.query(
    "SELECT uuid FROM tb_shopping_orders WHERE uuid=$1 FOR UPDATE",
    [orderUuid],
  );
  const lookup = await client.query(
    "SELECT * FROM tb_shopping_order_coupon_usages WHERE usage_order=$1",
    [orderUuid],
  );
  const usage = lookup.rows[0];
  if (!usage || usage.usage_status === "returned") return false;
  await lockCoupon(client, usage.usage_coupon);
  await client.query(
    "SELECT uuid FROM tb_user_coupons WHERE uuid=$1 FOR UPDATE",
    [usage.usage_user_coupon],
  );
  const changed = await client.query(
    `UPDATE tb_shopping_order_coupon_usages SET usage_status='returned',usage_returned_at=NOW(),usage_returned_by=$2::text,usage_return_reason=$3,updated_by=$2::text,updated_at=NOW()
    WHERE usage_order=$1 AND usage_status='used' RETURNING uuid`,
    [orderUuid, actorUuid, reason],
  );
  if (!changed.rowCount) return false;
  const counter = await client.query(
    "UPDATE tb_user_coupons SET user_coupon_used_count=user_coupon_used_count-1,updated_by=$2::text,updated_at=NOW() WHERE uuid=$1 AND user_coupon_used_count>0 RETURNING uuid",
    [usage.usage_user_coupon, actorUuid],
  );
  if (!counter.rowCount)
    couponError("ข้อมูลจำนวนครั้งที่ใช้คูปองไม่สอดคล้องกัน", 409);
  return true;
}
export async function adjustOrderCoupon(
  client: PoolClient,
  orderUuid: string,
  actorUuid: string,
  options: { removeCoupon?: boolean } = {},
) {
  const orderResult = await client.query(
    "SELECT * FROM tb_shopping_orders WHERE uuid=$1 FOR UPDATE",
    [orderUuid],
  );
  const order = orderResult.rows[0];
  if (!order?.order_user_coupon) return;
  if (options.removeCoupon) {
    await returnOrderCoupon(
      client,
      orderUuid,
      actorUuid,
      "Admin removed coupon while adjusting unpaid order",
    );
    await client.query(
      "UPDATE tb_shopping_orders SET order_user_coupon=NULL,order_coupon_discount=0,order_coupon_snapshot=NULL,updated_by=$2::text,updated_at=NOW() WHERE uuid=$1",
      [orderUuid, actorUuid],
    );
    return;
  }
  const amounts = await client.query(
    `SELECT COALESCE(SUM(order_item_subtotal-order_item_discount),0) AS merchandise,
    COALESCE(SUM(order_item_quantity),0) AS quantity,COUNT(DISTINCT order_item_product) AS items
    FROM tb_shopping_order_items WHERE order_item_order=$1 AND deleted_at IS NULL`,
    [orderUuid],
  );
  const current = amounts.rows[0];
  const result = evaluateCouponRules(order.order_coupon_snapshot || {}, {
    merchandiseTotal: Number(current.merchandise),
    totalQuantity: Number(current.quantity),
    distinctItems: Number(current.items),
  });
  if (!result.eligible)
    couponError(
      "รายการสินค้าหลังแก้ไขไม่ผ่านเงื่อนไขคูปอง กรุณาถอดคูปองและคืนสิทธิ์ก่อนบันทึก",
      409,
      "ORDER_COUPON_CONDITIONS_CHANGED",
    );
  await client.query(
    "UPDATE tb_shopping_orders SET order_coupon_discount=$2,updated_by=$3,updated_at=NOW() WHERE uuid=$1",
    [orderUuid, result.discount_amount, actorUuid],
  );
  await client.query(
    "UPDATE tb_shopping_order_coupon_usages SET usage_discount_amount=$2,updated_by=$3,updated_at=NOW() WHERE usage_order=$1 AND usage_status='used'",
    [orderUuid, result.discount_amount, actorUuid],
  );
}
