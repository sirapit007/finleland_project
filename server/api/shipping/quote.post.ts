import { useDb } from "@@/server/utils/db";
import { requireCurrentUser } from "@@/server/utils/session";
import {
  calculateShippingDistance,
  ShippingDistanceError,
} from "@@/server/utils/shippingDistance";

type ShippingQuoteBody = {
  shipping_address_uuid?: string;
};

type ShippingAddressAreaRow = {
  uuid: string;
  shipping_subdistrict: string | null;
  shipping_district: string | null;
  shipping_province: string | null;
  shipping_postcode: string | null;
};

const STORE_ADDRESS = {
  label: "สาขาเวียงสา",
  display: "728 ม.4 ต.กลางเวียง อ.เวียงสา จ.น่าน 55110",
  area: {
    subdistrict: "กลางเวียง",
    district: "เวียงสา",
    province: "น่าน",
    postcode: "55110",
  },
};

const WARNING_DISTANCE_METERS = 10_000;

export default defineEventHandler(async (event) => {
  const body = await readBody<ShippingQuoteBody>(event);
  const shippingAddressUuid = String(body.shipping_address_uuid || "").trim();

  if (!shippingAddressUuid) {
    throw createError({
      statusCode: 400,
      statusMessage: "กรุณาเลือกที่อยู่จัดส่ง",
    });
  }

  const currentUser = await requireCurrentUser(event);
  const db = useDb();
  const result = await db.query<ShippingAddressAreaRow>(
    `SELECT uuid::text AS uuid,
            shipping_subdistrict,
            shipping_district,
            shipping_province,
            shipping_postcode
     FROM tb_user_shipping_addresses
     WHERE uuid::text = $1
       AND shipping_user = $2
       AND deleted_at IS NULL
     LIMIT 1`,
    [shippingAddressUuid, currentUser.uuid],
  );
  const shippingAddress = result.rows[0];

  if (!shippingAddress) {
    throw createError({
      statusCode: 404,
      statusMessage: "ไม่พบที่อยู่จัดส่งที่เลือก",
    });
  }

  const config = useRuntimeConfig();

  try {
    const quote = await calculateShippingDistance(
      STORE_ADDRESS.area,
      {
        subdistrict: shippingAddress.shipping_subdistrict,
        district: shippingAddress.shipping_district,
        province: shippingAddress.shipping_province,
        postcode: shippingAddress.shipping_postcode,
      },
      {
        geocodingBaseUrl: config.shippingGeocodingBaseUrl,
        routingBaseUrl: config.shippingRoutingBaseUrl,
        userAgent: config.shippingMapUserAgent,
        referer: getRequestURL(event).origin,
      },
    );
    const distanceMeters = Math.max(Math.round(quote.distanceMeters), 0);
    const durationMinutes = Math.max(Math.round(quote.durationSeconds / 60), 1);

    return {
      addressUuid: shippingAddress.uuid,
      store: {
        label: STORE_ADDRESS.label,
        address: STORE_ADDRESS.display,
      },
      distanceMeters,
      distanceKm: Math.round((distanceMeters / 1_000) * 10) / 10,
      durationMinutes,
      isOverWarningDistance: distanceMeters > WARNING_DISTANCE_METERS,
      warningDistanceKm: WARNING_DISTANCE_METERS / 1_000,
      approximate: true,
      calculatedAt: new Date().toISOString(),
      attribution: "© OpenStreetMap contributors",
    };
  } catch (error) {
    console.warn("[shipping-quote] Distance calculation failed", {
      code:
        error instanceof ShippingDistanceError
          ? error.code
          : "unexpected_error",
      message: error instanceof Error ? error.message : "Unknown error",
    });

    if (
      error instanceof ShippingDistanceError &&
      error.code === "location_not_found"
    ) {
      throw createError({
        statusCode: 422,
        statusMessage: "ไม่สามารถระบุตำแหน่งจากพื้นที่ของที่อยู่ที่เลือกได้",
      });
    }

    if (
      error instanceof ShippingDistanceError &&
      error.code === "route_not_found"
    ) {
      throw createError({
        statusCode: 422,
        statusMessage: "ไม่พบเส้นทางจากสาขาไปยังพื้นที่จัดส่ง",
      });
    }

    throw createError({
      statusCode: 503,
      statusMessage:
        "ไม่สามารถคำนวณระยะทางได้ในขณะนี้ แต่ยังสั่งซื้อได้ตามปกติ",
    });
  }
});
