export type SmartShippingAddressBody = {
  shipping_label?: string;
  shipping_recipient?: string;
  shipping_phone?: string;
  shipping_address?: string;
  shipping_subdistrict?: string;
  shipping_district?: string;
  shipping_province?: string;
  shipping_postcode?: string;
  shipping_note?: string;
  shipping_is_default?: boolean | string | number;
  shipping_latitude?: number | string | null;
  shipping_longitude?: number | string | null;
  shipping_location_provider?: string | null;
  shipping_place_id?: string | null;
  shipping_location_source?: string | null;
  shipping_location_accuracy?: string | null;
  shipping_location_confirmed_at?: string | Date | null;
  user?: object;
};

const LOCATION_SOURCES = new Set([
  "map_pin",
  "current_location",
  "address_search",
  "manual",
]);
const LOCATION_ACCURACIES = new Set(["exact", "approximate", "area"]);

const toBoolean = (value: unknown) =>
  value === true || value === "true" || value === 1 || value === "1";

const toNullableString = (value: unknown, maxLength: number) => {
  const normalized = String(value ?? "").trim();
  return normalized ? normalized.slice(0, maxLength) : null;
};

const toNullableCoordinate = (value: unknown) => {
  if (value === null || value === undefined || value === "") return null;
  const coordinate = Number(value);
  return Number.isFinite(coordinate) ? coordinate : Number.NaN;
};

export function parseSmartShippingAddress(body: SmartShippingAddressBody) {
  const latitude = toNullableCoordinate(body.shipping_latitude);
  const longitude = toNullableCoordinate(body.shipping_longitude);
  const provider = toNullableString(body.shipping_location_provider, 30);
  const placeId = toNullableString(body.shipping_place_id, 255);
  const source = toNullableString(body.shipping_location_source, 30);
  const accuracy = toNullableString(body.shipping_location_accuracy, 20);
  const confirmedAtValue = body.shipping_location_confirmed_at;
  const confirmedAt = confirmedAtValue ? new Date(confirmedAtValue) : null;

  if ((latitude === null) !== (longitude === null)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Latitude and longitude must be provided together",
    });
  }

  if (
    latitude !== null &&
    (!Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      Number(longitude) < -180 ||
      Number(longitude) > 180)
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "Shipping coordinates are invalid",
    });
  }

  if (source && !LOCATION_SOURCES.has(source)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Shipping location source is invalid",
    });
  }

  if (accuracy && !LOCATION_ACCURACIES.has(accuracy)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Shipping location accuracy is invalid",
    });
  }

  if (confirmedAt && Number.isNaN(confirmedAt.getTime())) {
    throw createError({
      statusCode: 400,
      statusMessage: "Shipping location confirmation time is invalid",
    });
  }

  const input = {
    shipping_label: String(body.shipping_label || "").trim(),
    shipping_recipient: String(body.shipping_recipient || "").trim(),
    shipping_phone: String(body.shipping_phone || "").trim(),
    shipping_address: String(body.shipping_address || "").trim(),
    shipping_subdistrict: String(body.shipping_subdistrict || "").trim(),
    shipping_district: String(body.shipping_district || "").trim(),
    shipping_province: String(body.shipping_province || "").trim(),
    shipping_postcode: String(body.shipping_postcode || "").trim(),
    shipping_note: String(body.shipping_note || "").trim() || null,
    shipping_is_default: toBoolean(body.shipping_is_default),
    shipping_latitude: latitude,
    shipping_longitude: longitude,
    shipping_location_provider: latitude === null ? null : provider,
    shipping_place_id: latitude === null ? null : placeId,
    shipping_location_source: latitude === null ? null : source || "map_pin",
    shipping_location_accuracy: latitude === null ? null : accuracy || "exact",
    shipping_location_confirmed_at:
      latitude === null ? null : confirmedAt || new Date(),
  };

  if (
    !input.shipping_label ||
    !input.shipping_recipient ||
    !input.shipping_phone ||
    !input.shipping_address ||
    !input.shipping_subdistrict ||
    !input.shipping_district ||
    !input.shipping_province ||
    !input.shipping_postcode
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "Shipping address fields are required",
    });
  }

  if (!/^[0-9]{10}$/.test(input.shipping_phone)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Phone number must contain exactly 10 digits",
    });
  }

  return input;
}
