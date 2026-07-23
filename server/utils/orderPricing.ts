export type PromotionSnapshot = {
  promotion_uuid?: string | null;
  promotion_name?: string | null;
  promotion_discounted_price?: number | string | null;
  promotion_bundle_price?: number | string | null;
  promotion_min_quantity?: number | string | null;
  promotion_min_purchase_amount?: number | string | null;
};

export type ProductPricingSource = PromotionSnapshot & {
  product_selling_price?: number | string | null;
};

export const toMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export function calculateOrderItemPricing(
  source: ProductPricingSource,
  quantity: number,
) {
  const safeQuantity = Math.max(Math.floor(Number(quantity) || 0), 0);
  const normalUnitPrice = toMoney(Number(source.product_selling_price || 0));
  const promotionUnitPrice = toMoney(
    Number(
      source.promotion_discounted_price || source.promotion_bundle_price || 0,
    ),
  );
  const minimumQuantity = Math.max(
    Math.floor(Number(source.promotion_min_quantity || 0)),
    0,
  );
  const minimumPurchaseAmount = toMoney(
    Number(source.promotion_min_purchase_amount || 0),
  );
  const subtotal = toMoney(normalUnitPrice * safeQuantity);
  const hasPromotion =
    promotionUnitPrice > 0 && promotionUnitPrice < normalUnitPrice;
  const isEligible =
    hasPromotion &&
    (!minimumQuantity || safeQuantity >= minimumQuantity) &&
    (!minimumPurchaseAmount || subtotal >= minimumPurchaseAmount);
  const unitPrice = isEligible ? promotionUnitPrice : normalUnitPrice;
  const total = toMoney(unitPrice * safeQuantity);

  return {
    discount: toMoney(Math.max(subtotal - total, 0)),
    hasPromotion,
    isEligible,
    normalUnitPrice,
    promotionName: isEligible
      ? String(source.promotion_name || "").trim() || null
      : null,
    promotionUuid: isEligible
      ? String(source.promotion_uuid || "").trim() || null
      : null,
    subtotal,
    total,
    unitPrice,
  };
}
