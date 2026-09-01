import { requireCurrentUser } from "@@/server/utils/session";

type NominatimAddress = Record<string, string | undefined>;

type NominatimReverseResult = {
  place_id?: number | string;
  display_name?: string;
  address?: NominatimAddress;
};

type ReverseGeocodeResult = {
  provider: "nominatim";
  placeId: string | null;
  displayName: string;
  postcode: string;
  provinceCandidates: string[];
  districtCandidates: string[];
  subdistrictCandidates: string[];
};

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 500;
const reverseCache = new Map<
  string,
  { expiresAt: number; value: ReverseGeocodeResult }
>();
let upstreamQueue: Promise<void> = Promise.resolve();
let lastUpstreamStartedAt = 0;

const uniqueStrings = (values: Array<string | undefined>) =>
  [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];

const getCached = (key: string) => {
  const entry = reverseCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    reverseCache.delete(key);
    return null;
  }
  return entry.value;
};

const setCached = (key: string, value: ReverseGeocodeResult) => {
  if (reverseCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = reverseCache.keys().next().value;
    if (oldestKey) reverseCache.delete(oldestKey);
  }
  reverseCache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, value });
};

const enqueueUpstreamRequest = <T>(task: () => Promise<T>) => {
  const run = upstreamQueue.then(async () => {
    const waitMs = Math.max(0, 1_000 - (Date.now() - lastUpstreamStartedAt));
    if (waitMs) await new Promise((resolve) => setTimeout(resolve, waitMs));
    lastUpstreamStartedAt = Date.now();
    return task();
  });
  upstreamQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
};

export default defineEventHandler(async (event) => {
  await requireCurrentUser(event);

  const query = getQuery(event);
  const latitude = Number(query.latitude ?? query.lat);
  const longitude = Number(query.longitude ?? query.lon ?? query.lng);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "Valid latitude and longitude are required",
    });
  }

  const cacheKey = `${latitude.toFixed(5)}:${longitude.toFixed(5)}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const config = useRuntimeConfig(event);
  const baseUrl = String(config.shippingGeocodingBaseUrl || "").replace(/\/$/, "");
  const url = new URL(`${baseUrl}/reverse`);
  url.search = new URLSearchParams({
    format: "jsonv2",
    lat: String(latitude),
    lon: String(longitude),
    zoom: "18",
    addressdetails: "1",
    layer: "address",
    "accept-language": "th,en;q=0.8",
  }).toString();

  const data = await enqueueUpstreamRequest(async () => {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "Accept-Language": "th,en;q=0.8",
        "User-Agent": String(config.shippingMapUserAgent),
        Referer: getRequestURL(event).origin,
      },
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) {
      throw createError({
        statusCode: 502,
        statusMessage: "Reverse geocoding service is unavailable",
      });
    }

    return (await response.json()) as NominatimReverseResult;
  });

  const address = data.address || {};
  if (address.country_code && address.country_code.toLowerCase() !== "th") {
    throw createError({
      statusCode: 422,
      statusMessage: "Selected location is outside Thailand",
    });
  }

  const result: ReverseGeocodeResult = {
    provider: "nominatim",
    placeId: data.place_id === undefined ? null : String(data.place_id),
    displayName: String(data.display_name || ""),
    postcode: String(address.postcode || "").trim(),
    provinceCandidates: uniqueStrings([
      address.state,
      address.province,
      address.region,
    ]),
    districtCandidates: uniqueStrings([
      address.county,
      address.state_district,
      address.city_district,
      address.district,
      address.municipality,
      address.city,
      address.town,
    ]),
    subdistrictCandidates: uniqueStrings([
      address.suburb,
      address.quarter,
      address.neighbourhood,
      address.village,
      address.city_district,
      address.district,
      address.hamlet,
    ]),
  };

  setCached(cacheKey, result);
  return result;
});
