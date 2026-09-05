export const LOCAL_EXPRESS_MINIMUM_ORDER_AMOUNT = 500;
export const LOCAL_EXPRESS_FEE_RATE = 0.05;

/**
 * Local express fees are always rounded up to a whole-baht price ending in 5 or 9.
 * Examples: 31 -> 35, 35 -> 35, 36 -> 39, 39 -> 39.
 */
export function calculateLocalExpressShippingFee(purchaseTotal: number) {
  const safePurchaseTotal = Number(purchaseTotal);
  if (!Number.isFinite(safePurchaseTotal) || safePurchaseTotal <= 0) return 0;

  const feeInSatang = Math.round(
    (safePurchaseTotal * LOCAL_EXPRESS_FEE_RATE + Number.EPSILON) * 100,
  );
  const wholeBahtFee = Math.ceil(feeInSatang / 100);
  const lastDigit = wholeBahtFee % 10;

  if (lastDigit <= 4) return wholeBahtFee + (5 - lastDigit);
  if (lastDigit >= 6 && lastDigit <= 8) {
    return wholeBahtFee + (9 - lastDigit);
  }
  return wholeBahtFee;
}
