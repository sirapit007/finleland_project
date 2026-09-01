export type ProductShippingInput = {
  product_shipping_weight_grams?: unknown;
  product_shipping_length_cm?: unknown;
  product_shipping_width_cm?: unknown;
  product_shipping_height_cm?: unknown;
};

export type ProductShippingMeasurements = {
  weightGrams: number | null;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
};

const nullablePositiveNumber = (value: unknown) => {
  if (value === undefined || value === null || String(value).trim() === "") {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : Number.NaN;
};

export function normalizeProductShippingMeasurements(
  input: ProductShippingInput,
): ProductShippingMeasurements {
  const measurements = {
    weightGrams: nullablePositiveNumber(input.product_shipping_weight_grams),
    lengthCm: nullablePositiveNumber(input.product_shipping_length_cm),
    widthCm: nullablePositiveNumber(input.product_shipping_width_cm),
    heightCm: nullablePositiveNumber(input.product_shipping_height_cm),
  };
  const values = Object.values(measurements);
  const completedValues = values.filter((value) => value !== null);

  if (!completedValues.length) {
    return measurements;
  }

  if (
    completedValues.length !== values.length ||
    completedValues.some((value) => !Number.isFinite(value))
  ) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "กรุณาระบุน้ำหนัก กว้าง ยาว และสูงหลังแพ็กให้ครบ โดยทุกค่าต้องมากกว่า 0",
    });
  }

  return measurements;
}
