export type PaymentRow = Record<string, any>;

export function sanitizePaymentRow(
  row: PaymentRow | null | undefined,
  options: { includeProviderResponse?: boolean } = {},
) {
  if (!row) return null;
  const sanitized = { ...row };
  const hasSlip = Boolean(sanitized.order_payment_slip_public_id);
  delete sanitized.order_payment_slip_public_id;
  delete sanitized.order_payment_slip_url;
  if (!options.includeProviderResponse) {
    delete sanitized.order_payment_provider_response;
  }
  sanitized.order_payment_has_slip = hasSlip;
  sanitized.order_payment_slip_endpoint = hasSlip
    ? `/api/order/payments/${sanitized.uuid}/slip`
    : null;
  return sanitized;
}

export const toPaymentMoney = (value: unknown) => {
  const parsed = Number(value || 0);
  if (!Number.isFinite(parsed)) return 0;
  return Math.round((parsed + Number.EPSILON) * 100) / 100;
};
