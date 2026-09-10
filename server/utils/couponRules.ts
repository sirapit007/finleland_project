import { createError } from "h3";
import { toMoney } from "./orderPricing";

export type CouponBasket = {
  merchandiseTotal: number;
  totalQuantity: number;
  distinctItems: number;
};
export type CouponRecord = Record<string, any>;
export const couponEditableFields = [
  "coupon_name",
  "coupon_description",
  "coupon_discount_type",
  "coupon_discount_value",
  "coupon_max_discount",
  "coupon_min_purchase_amount",
  "coupon_min_quantity",
  "coupon_min_items",
  "coupon_usage_limit",
  "coupon_recipient_limit",
  "coupon_distribution_method",
  "coupon_status",
  "coupon_expires_at",
] as const;
const mutableAfterIssue = new Set([
  "coupon_name",
  "coupon_description",
  "coupon_recipient_limit",
  "coupon_status",
]);
export function couponError(
  message: string,
  statusCode = 400,
  code?: string,
): never {
  throw createError({
    statusCode,
    message,
    data: { message, ...(code ? { code } : {}) },
  });
}
export function assertCouponUuid(value: unknown) {
  const uuid = String(value || "").trim();
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      uuid,
    )
  )
    couponError("รหัสคูปองหรือผู้ใช้ไม่ถูกต้อง");
  return uuid;
}
export function normalizeCouponInput(
  body: CouponRecord,
  current?: CouponRecord,
) {
  if (!body || typeof body !== "object" || Array.isArray(body))
    couponError("ข้อมูลคูปองไม่ถูกต้อง");
  const input = { ...current, ...body };
  const number = (
    field: string,
    fallback: number,
    minimum: number,
    integer = false,
  ) => {
    const raw = input[field] ?? fallback;
    const value = Number(raw);
    if (
      typeof raw === "boolean" ||
      raw === "" ||
      !Number.isFinite(value) ||
      value < minimum ||
      value > (integer ? 1000000 : 9999999999.99) ||
      (integer && !Number.isInteger(value)) ||
      (!integer && Math.abs(value - toMoney(value)) > 0.000001)
    )
      couponError(`ค่าของ ${field} ไม่ถูกต้อง`);
    return value;
  };
  const row: CouponRecord = {
    coupon_name: String(input.coupon_name || "").trim(),
    coupon_description: String(input.coupon_description || "").trim() || null,
    coupon_discount_type: String(input.coupon_discount_type || ""),
    coupon_discount_value: number("coupon_discount_value", 0, 0.01),
    coupon_max_discount:
      input.coupon_max_discount === null ||
      input.coupon_max_discount === "" ||
      input.coupon_max_discount === undefined
        ? null
        : number("coupon_max_discount", 0, 0.01),
    coupon_min_purchase_amount: number("coupon_min_purchase_amount", 0, 0),
    coupon_min_quantity: number("coupon_min_quantity", 0, 0, true),
    coupon_min_items: number("coupon_min_items", 0, 0, true),
    coupon_usage_limit: number("coupon_usage_limit", 1, 1, true),
    coupon_recipient_limit: number("coupon_recipient_limit", 0, 1, true),
    coupon_distribution_method: String(input.coupon_distribution_method || ""),
    coupon_status: String(input.coupon_status || "draft"),
    coupon_expires_at: null,
  };
  if (!row.coupon_name || row.coupon_name.length > 200)
    couponError("กรุณาระบุชื่อคูปองไม่เกิน 200 ตัวอักษร");
  if (row.coupon_description && row.coupon_description.length > 4000)
    couponError("รายละเอียดคูปองยาวเกินไป");
  if (!["amount", "percent"].includes(row.coupon_discount_type))
    couponError("ประเภทส่วนลดไม่ถูกต้อง");
  if (row.coupon_discount_type === "percent" && row.coupon_discount_value > 100)
    couponError("ส่วนลดเปอร์เซ็นต์ต้องไม่เกิน 100");
  if (row.coupon_discount_type === "amount") row.coupon_max_discount = null;
  if (
    !["signup", "random", "manual", "claim"].includes(
      row.coupon_distribution_method,
    )
  )
    couponError("วิธีแจกคูปองไม่ถูกต้อง");
  if (!["draft", "active", "paused"].includes(row.coupon_status))
    couponError("สถานะคูปองไม่ถูกต้อง");
  if (input.coupon_expires_at) {
    const expires = new Date(input.coupon_expires_at);
    if (!Number.isFinite(expires.getTime()))
      couponError("วันหมดอายุไม่ถูกต้อง");
    row.coupon_expires_at = expires.toISOString();
    const oldExpiry = current?.coupon_expires_at
      ? new Date(current.coupon_expires_at).toISOString()
      : null;
    if (row.coupon_expires_at !== oldExpiry && expires.getTime() <= Date.now())
      couponError("วันหมดอายุต้องเป็นเวลาในอนาคต");
  }
  if (current && Number(current.coupon_issued_count) > 0) {
    for (const field of couponEditableFields) {
      if (mutableAfterIssue.has(field)) continue;
      const old =
        field === "coupon_expires_at" && current[field]
          ? new Date(current[field]).toISOString()
          : current[field];
      if (
        typeof row[field] === "number"
          ? Number(old) !== row[field]
          : String(old ?? "") !== String(row[field] ?? "")
      )
        couponError(
          "คูปองที่แจกแล้วไม่สามารถแก้ส่วนลด เงื่อนไข วิธีแจก หรือวันหมดอายุได้",
          409,
        );
    }
    if (row.coupon_status === "draft")
      couponError("คูปองที่แจกแล้วไม่สามารถกลับเป็นฉบับร่างได้", 409);
    if (row.coupon_recipient_limit < Number(current.coupon_issued_count))
      couponError("จำนวนผู้รับต้องไม่น้อยกว่าจำนวนที่แจกไปแล้ว", 409);
  }
  return row;
}

export function evaluateCouponRules(
  coupon: CouponRecord,
  basket: CouponBasket,
) {
  const reasons: string[] = [];
  const merchandise = toMoney(basket.merchandiseTotal);
  if (
    basket.totalQuantity <= 0 ||
    basket.distinctItems <= 0 ||
    merchandise <= 0
  )
    reasons.push("เพิ่มสินค้าในตะกร้าเพื่อใช้คูปอง");
  if (merchandise < Number(coupon.coupon_min_purchase_amount || 0))
    reasons.push(
      `ซื้อเพิ่มอีก ${toMoney(Number(coupon.coupon_min_purchase_amount) - merchandise).toFixed(2)} บาท`,
    );
  if (basket.totalQuantity < Number(coupon.coupon_min_quantity || 0))
    reasons.push(
      `ซื้อเพิ่มอีก ${Number(coupon.coupon_min_quantity) - basket.totalQuantity} ชิ้น`,
    );
  if (basket.distinctItems < Number(coupon.coupon_min_items || 0))
    reasons.push(
      `เพิ่มสินค้าอีก ${Number(coupon.coupon_min_items) - basket.distinctItems} รายการ`,
    );
  let discount =
    coupon.coupon_discount_type === "percent"
      ? toMoney((merchandise * Number(coupon.coupon_discount_value)) / 100)
      : Number(coupon.coupon_discount_value);
  if (
    coupon.coupon_discount_type === "percent" &&
    coupon.coupon_max_discount !== null &&
    coupon.coupon_max_discount !== undefined
  )
    discount = Math.min(discount, Number(coupon.coupon_max_discount));
  discount = toMoney(Math.max(0, Math.min(merchandise, discount)));
  return {
    eligible: reasons.length === 0 && discount > 0,
    discount_amount: reasons.length ? 0 : discount,
    ineligible_reason: reasons.join(" และ ") || null,
  };
}
export function couponSnapshot(coupon: CouponRecord) {
  return Object.fromEntries(
    ["uuid", ...couponEditableFields].map((field) => [
      field,
      coupon[field] ?? null,
    ]),
  );
}
