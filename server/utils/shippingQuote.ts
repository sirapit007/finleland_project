import {
  calculateShippingDistance,
  ShippingDistanceError,
} from "@@/server/utils/shippingDistance";
import {
  calculateParcelDeliveryQuotes,
  loadActiveShippingRateServices,
  type ShippingProduct,
} from "@@/server/utils/shippingPricing";

type Queryable = {
  query: (
    text: string,
    values?: unknown[],
  ) => Promise<{ rows: Record<string, any>[] }>;
};

export type ShippingQuoteConfig = {
  geocodingBaseUrl: string;
  routingBaseUrl: string;
  userAgent: string;
  referer?: string;
};

export const LOCAL_EXPRESS_MAX_DISTANCE_METERS = 10_000;
export const LOCAL_EXPRESS_FEE = 39;

export const STORE_ADDRESS = {
  label: "สาขาเวียงสา",
  display: "728 ม.4 ต.กลางเวียง อ.เวียงสา จ.น่าน 55110",
  area: {
    subdistrict: "กลางเวียง",
    district: "เวียงสา",
    province: "น่าน",
    postcode: "55110",
  },
};

const toShippingProducts = (rows: Record<string, any>[]): ShippingProduct[] =>
  rows.map((row) => ({
    productUuid: String(row.product_uuid || ""),
    productCode: String(row.product_code || ""),
    productName: String(row.product_name || row.product_code || "สินค้า"),
    quantity: Math.max(Math.floor(Number(row.basket_quantity || 0)), 0),
    weightGrams: row.product_shipping_weight_grams,
    lengthCm: row.product_shipping_length_cm,
    widthCm: row.product_shipping_width_cm,
    heightCm: row.product_shipping_height_cm,
  }));

export async function createShippingQuote(
  queryable: Queryable,
  userUuid: string,
  shippingAddressUuid: string,
  config: ShippingQuoteConfig,
  includeExpressRoute = true,
) {
  const [addressResult, basketResult, services] = await Promise.all([
    queryable.query(
      `SELECT uuid::text AS uuid,
              shipping_subdistrict,
              shipping_district,
              shipping_province,
              shipping_postcode,
              shipping_latitude,
              shipping_longitude
       FROM tb_user_shipping_addresses
       WHERE uuid::text = $1
         AND shipping_user = $2
         AND deleted_at IS NULL
       LIMIT 1`,
      [shippingAddressUuid, userUuid],
    ),
    queryable.query(
      `SELECT product.uuid::text AS product_uuid,
              product.product_code,
              product.product_name,
              product.product_shipping_weight_grams,
              product.product_shipping_length_cm,
              product.product_shipping_width_cm,
              product.product_shipping_height_cm,
              basket.basket_quantity
       FROM tb_shopping_basket AS basket
       INNER JOIN tb_master_products AS product
         ON product.uuid::text = basket.basket_product
       WHERE basket.created_by = $1
         AND basket.deleted_at IS NULL
         AND basket.basket_expire > NOW()
         AND product.deleted_at IS NULL
       ORDER BY basket.id ASC`,
      [userUuid],
    ),
    loadActiveShippingRateServices(queryable),
  ]);
  const address = addressResult.rows[0];

  if (!address) {
    throw createError({
      statusCode: 404,
      statusMessage: "ไม่พบที่อยู่จัดส่งที่เลือก",
    });
  }

  if (!basketResult.rows.length) {
    throw createError({
      statusCode: 400,
      statusMessage: "ไม่พบสินค้าในตะกร้า",
    });
  }

  const products = toShippingProducts(basketResult.rows);
  const parcelOptions = calculateParcelDeliveryQuotes(products, services);
  let route:
    | {
        distanceMeters: number;
        distanceKm: number;
        durationMinutes: number;
      }
    | undefined;
  let routeError: string | null = includeExpressRoute
    ? null
    : "เลือกส่งด่วนใกล้บ้านเพื่อตรวจสอบระยะทาง";

  if (includeExpressRoute) {
    try {
      const distance = await calculateShippingDistance(
        STORE_ADDRESS.area,
        {
          subdistrict: address.shipping_subdistrict,
          district: address.shipping_district,
          province: address.shipping_province,
          postcode: address.shipping_postcode,
        },
        config,
      );
      const distanceMeters = Math.max(Math.round(distance.distanceMeters), 0);
      route = {
        distanceMeters,
        distanceKm: Math.round((distanceMeters / 1_000) * 10) / 10,
        durationMinutes: Math.max(Math.round(distance.durationSeconds / 60), 1),
      };
    } catch (error) {
      routeError =
        error instanceof ShippingDistanceError &&
        error.code === "location_not_found"
          ? "ไม่สามารถระบุตำแหน่งของที่อยู่นี้ได้"
          : error instanceof ShippingDistanceError &&
              error.code === "route_not_found"
            ? "ไม่พบเส้นทางจากร้านไปยังที่อยู่นี้"
            : "ไม่สามารถตรวจสอบระยะทางได้ในขณะนี้";
    }
  }

  const expressAvailable = Boolean(
    route && route.distanceMeters <= LOCAL_EXPRESS_MAX_DISTANCE_METERS,
  );
  const expressReason = routeError
    ? routeError
    : expressAvailable
      ? null
      : `ให้บริการเฉพาะระยะทางไม่เกิน ${LOCAL_EXPRESS_MAX_DISTANCE_METERS / 1_000} กม. จากร้าน`;

  return {
    addressUuid: String(address.uuid),
    destination: {
      latitude:
        address.shipping_latitude === null
          ? null
          : Number(address.shipping_latitude),
      longitude:
        address.shipping_longitude === null
          ? null
          : Number(address.shipping_longitude),
      province: address.shipping_province,
      postcode: address.shipping_postcode,
    },
    store: {
      label: STORE_ADDRESS.label,
      address: STORE_ADDRESS.display,
    },
    distanceMeters: route?.distanceMeters ?? null,
    distanceKm: route?.distanceKm ?? null,
    durationMinutes: route?.durationMinutes ?? null,
    isOverWarningDistance: Boolean(
      route && route.distanceMeters > LOCAL_EXPRESS_MAX_DISTANCE_METERS,
    ),
    warningDistanceKm: LOCAL_EXPRESS_MAX_DISTANCE_METERS / 1_000,
    approximate: true,
    calculatedAt: new Date().toISOString(),
    attribution: "© OpenStreetMap contributors",
    options: [
      ...(includeExpressRoute
        ? [
            {
              id: "express",
              serviceCode: "local_express",
              provider: "store_local",
              label: "ส่งด่วนใกล้บ้าน",
              description: "ภายใน 1 - 2 ชม. · ไม่เกิน 10 กม. จากร้าน",
              available: expressAvailable,
              unavailableReason: expressReason,
              price: expressAvailable ? LOCAL_EXPRESS_FEE : null,
              estimatedDaysMin: 0,
              estimatedDaysMax: 0,
              rateVersion: "local-express-v1",
              parcelCount: products.reduce(
                (total, product) => total + product.quantity,
                0,
              ),
              parcels: [],
              missingProducts: [],
            },
          ]
        : []),
      ...parcelOptions,
    ],
  };
}
