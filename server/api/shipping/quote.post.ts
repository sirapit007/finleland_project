import { useDb } from "@@/server/utils/db";
import { createShippingQuote } from "@@/server/utils/shippingQuote";
import { requireCurrentUser } from "@@/server/utils/session";

type ShippingQuoteBody = {
  shipping_address_uuid?: string;
  delivery_method?: string;
};

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
  const config = useRuntimeConfig();

  return createShippingQuote(
    useDb(),
    currentUser.uuid,
    shippingAddressUuid,
    {
      geocodingBaseUrl: config.shippingGeocodingBaseUrl,
      routingBaseUrl: config.shippingRoutingBaseUrl,
      userAgent: config.shippingMapUserAgent,
      referer: getRequestURL(event).origin,
    },
    body.delivery_method === "express",
  );
});
