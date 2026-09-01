export type ShippingProduct = {
  productUuid: string;
  productCode: string;
  productName: string;
  quantity: number;
  weightGrams: unknown;
  lengthCm: unknown;
  widthCm: unknown;
  heightCm: unknown;
};

type Queryable = {
  query: (
    text: string,
    values?: unknown[],
  ) => Promise<{ rows: Record<string, any>[] }>;
};

type ShippingRateTier = {
  order: number;
  maxWeightKg: number;
  maxSizeCm: number | null;
  fee: number;
};

export type ShippingRateService = {
  code: string;
  provider: string;
  label: string;
  description: string;
  volumetricDivisor: number | null;
  maxWeightKg: number | null;
  estimatedDaysMin: number | null;
  estimatedDaysMax: number | null;
  rateCardUuid: string;
  rateVersion: string;
  tiers: ShippingRateTier[];
};

export type ParcelQuoteGroup = {
  productUuid: string;
  productCode: string;
  productName: string;
  quantity: number;
  actualWeightKg: number;
  volumetricWeightKg: number | null;
  billableWeightKg: number;
  sizeCm: number;
  dimensionsCm: {
    length: number;
    width: number;
    height: number;
  };
  unitFee: number;
  totalFee: number;
};

export type ParcelDeliveryQuote = {
  id: string;
  serviceCode: string;
  provider: string;
  label: string;
  description: string;
  available: boolean;
  unavailableReason: string | null;
  price: number | null;
  estimatedDaysMin: number | null;
  estimatedDaysMax: number | null;
  rateCardUuid: string;
  rateVersion: string;
  parcelCount: number;
  parcels: ParcelQuoteGroup[];
  missingProducts: Array<{
    productUuid: string;
    productCode: string;
    productName: string;
  }>;
};

const numberOrNull = (value: unknown) => {
  if (value === undefined || value === null || String(value).trim() === "") {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const money = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;
const decimal = (value: number, digits = 3) => {
  const scale = 10 ** digits;
  return Math.round((value + Number.EPSILON) * scale) / scale;
};

export async function loadActiveShippingRateServices(
  queryable: Queryable,
): Promise<ShippingRateService[]> {
  const result = await queryable.query(
    `SELECT service.shipping_service_code,
            service.shipping_service_provider,
            service.shipping_service_label,
            service.shipping_service_description,
            service.shipping_service_volumetric_divisor,
            service.shipping_service_max_weight_kg,
            service.shipping_service_estimated_days_min,
            service.shipping_service_estimated_days_max,
            rate_card.uuid::text AS rate_card_uuid,
            rate_card.shipping_rate_card_version,
            tier.shipping_rate_tier_order,
            tier.shipping_rate_tier_max_weight_kg,
            tier.shipping_rate_tier_max_size_cm,
            tier.shipping_rate_tier_fee
     FROM tb_shipping_services AS service
     INNER JOIN LATERAL (
       SELECT card.*
       FROM tb_shipping_rate_cards AS card
       WHERE card.shipping_rate_card_service_code = service.shipping_service_code
         AND card.shipping_rate_card_is_active = TRUE
         AND card.shipping_rate_card_effective_from <= CURRENT_DATE
         AND (
           card.shipping_rate_card_effective_to IS NULL
           OR card.shipping_rate_card_effective_to >= CURRENT_DATE
         )
       ORDER BY card.shipping_rate_card_effective_from DESC, card.created_at DESC
       LIMIT 1
     ) AS rate_card ON TRUE
     INNER JOIN tb_shipping_rate_tiers AS tier
       ON tier.shipping_rate_tier_card = rate_card.uuid
     WHERE service.shipping_service_is_active = TRUE
     ORDER BY service.shipping_service_code, tier.shipping_rate_tier_order`,
  );
  const services = new Map<string, ShippingRateService>();

  for (const row of result.rows) {
    const code = String(row.shipping_service_code);
    let service = services.get(code);

    if (!service) {
      service = {
        code,
        provider: String(row.shipping_service_provider),
        label: String(row.shipping_service_label),
        description: String(row.shipping_service_description || ""),
        volumetricDivisor: numberOrNull(
          row.shipping_service_volumetric_divisor,
        ),
        maxWeightKg: numberOrNull(row.shipping_service_max_weight_kg),
        estimatedDaysMin: numberOrNull(row.shipping_service_estimated_days_min),
        estimatedDaysMax: numberOrNull(row.shipping_service_estimated_days_max),
        rateCardUuid: String(row.rate_card_uuid),
        rateVersion: String(row.shipping_rate_card_version),
        tiers: [],
      };
      services.set(code, service);
    }

    service.tiers.push({
      order: Number(row.shipping_rate_tier_order),
      maxWeightKg: Number(row.shipping_rate_tier_max_weight_kg),
      maxSizeCm: numberOrNull(row.shipping_rate_tier_max_size_cm),
      fee: Number(row.shipping_rate_tier_fee),
    });
  }

  return [...services.values()];
}

export function calculateParcelDeliveryQuotes(
  products: ShippingProduct[],
  services: ShippingRateService[],
): ParcelDeliveryQuote[] {
  const missingProducts = products
    .filter((product) => {
      const measurements = [
        product.weightGrams,
        product.lengthCm,
        product.widthCm,
        product.heightCm,
      ].map(numberOrNull);

      return measurements.some(
        (measurement) => measurement === null || measurement <= 0,
      );
    })
    .map((product) => ({
      productUuid: product.productUuid,
      productCode: product.productCode,
      productName: product.productName,
    }));

  return services.map((service) => {
    const baseQuote: ParcelDeliveryQuote = {
      id: service.code,
      serviceCode: service.code,
      provider: service.provider,
      label: service.label,
      description: service.description,
      available: false,
      unavailableReason: null,
      price: null,
      estimatedDaysMin: service.estimatedDaysMin,
      estimatedDaysMax: service.estimatedDaysMax,
      rateCardUuid: service.rateCardUuid,
      rateVersion: service.rateVersion,
      parcelCount: 0,
      parcels: [],
      missingProducts,
    };

    if (missingProducts.length) {
      return {
        ...baseQuote,
        unavailableReason: `สินค้า ${missingProducts[0]?.productName || "ในตะกร้า"} ยังไม่มีข้อมูลน้ำหนักหรือขนาดหลังแพ็ก`,
      };
    }

    const parcels: ParcelQuoteGroup[] = [];

    for (const product of products) {
      const quantity = Math.max(Math.floor(Number(product.quantity)), 0);
      const actualWeightKg = decimal(Number(product.weightGrams) / 1_000);
      const length = Number(product.lengthCm);
      const width = Number(product.widthCm);
      const height = Number(product.heightCm);
      const sizeCm = decimal(length + width + height, 2);
      const volumetricWeightKg = service.volumetricDivisor
        ? decimal((length * width * height) / service.volumetricDivisor)
        : null;
      const chargeableWeight = Math.max(
        actualWeightKg,
        volumetricWeightKg || 0,
      );
      const billableWeightKg = Math.max(Math.ceil(chargeableWeight), 1);
      const tier = service.tiers.find(
        (candidate) =>
          billableWeightKg <= candidate.maxWeightKg &&
          (candidate.maxSizeCm === null || sizeCm <= candidate.maxSizeCm),
      );

      if (
        !quantity ||
        (service.maxWeightKg !== null &&
          billableWeightKg > service.maxWeightKg) ||
        !tier
      ) {
        return {
          ...baseQuote,
          parcels,
          parcelCount: parcels.reduce(
            (total, parcel) => total + parcel.quantity,
            0,
          ),
          unavailableReason: `${product.productName} มีน้ำหนักหรือขนาดเกินเงื่อนไขของบริการ`,
        };
      }

      parcels.push({
        productUuid: product.productUuid,
        productCode: product.productCode,
        productName: product.productName,
        quantity,
        actualWeightKg,
        volumetricWeightKg,
        billableWeightKg,
        sizeCm,
        dimensionsCm: { length, width, height },
        unitFee: money(tier.fee),
        totalFee: money(tier.fee * quantity),
      });
    }

    return {
      ...baseQuote,
      available: true,
      price: money(
        parcels.reduce((total, parcel) => total + parcel.totalFee, 0),
      ),
      parcelCount: parcels.reduce(
        (total, parcel) => total + parcel.quantity,
        0,
      ),
      parcels,
    };
  });
}
