type ShippingProduct = {
  product_shipping_weight_grams?: number | string | null;
  product_shipping_length_cm?: number | string | null;
  product_shipping_width_cm?: number | string | null;
  product_shipping_height_cm?: number | string | null;
};

const formatMeasurement = (value: number, maximumFractionDigits = 2) =>
  new Intl.NumberFormat("th-TH", {
    maximumFractionDigits,
  }).format(value);

export const formatProductShippingWeight = (product: ShippingProduct) => {
  const weightGrams = Number(product.product_shipping_weight_grams || 0);
  if (weightGrams <= 0) return "";

  return weightGrams >= 1000
    ? `${formatMeasurement(weightGrams / 1000)} กก.`
    : `${formatMeasurement(weightGrams, 3)} กรัม`;
};

export const formatProductShippingDimensions = (product: ShippingProduct) => {
  const dimensions = [
    product.product_shipping_length_cm,
    product.product_shipping_width_cm,
    product.product_shipping_height_cm,
  ].map((value) => Number(value || 0));

  if (dimensions.some((value) => value <= 0)) return "";

  return `${dimensions.map((value) => formatMeasurement(value)).join(" × ")} ซม.`;
};

export const getProductShippingSummary = (product: ShippingProduct) => {
  const weight = formatProductShippingWeight(product);
  const dimensions = formatProductShippingDimensions(product);

  return {
    weight,
    dimensions,
    hasDetails: Boolean(weight || dimensions),
    compact: [weight, dimensions].filter(Boolean).join(" · "),
  };
};
