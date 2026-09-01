export type ShippingAddressArea = {
  subdistrict?: unknown;
  district?: unknown;
  province?: unknown;
  postcode?: unknown;
};

export type ShippingDistanceConfig = {
  geocodingBaseUrl: string;
  routingBaseUrl: string;
  userAgent: string;
  referer?: string;
};

export type ShippingDistanceResult = {
  distanceMeters: number;
  durationSeconds: number;
};

export type ShippingCoordinate = {
  latitude: number;
  longitude: number;
};

type Coordinate = ShippingCoordinate;

type NominatimResult = {
  lat?: string;
  lon?: string;
  display_name?: string;
  address?: Record<string, string | undefined>;
};

type OsrmResult = {
  code?: string;
  routes?: Array<{
    distance?: number;
    duration?: number;
  }>;
};

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

export type ShippingDistanceErrorCode =
  "location_not_found" | "route_not_found" | "service_unavailable";

export class ShippingDistanceError extends Error {
  constructor(
    public readonly code: ShippingDistanceErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ShippingDistanceError";
  }
}

const REQUEST_TIMEOUT_MS = 10_000;
const REQUEST_INTERVAL_MS = 1_100;
const GEOCODE_CACHE_TTL_MS = 6 * 60 * 60 * 1_000;
const ROUTE_CACHE_TTL_MS = 60 * 60 * 1_000;
const MAX_CACHE_ENTRIES = 500;

const geocodeCache = new Map<string, CacheEntry<Coordinate>>();
const routeCache = new Map<string, CacheEntry<ShippingDistanceResult>>();
const geocodeInFlight = new Map<string, Promise<Coordinate>>();
const routeInFlight = new Map<string, Promise<ShippingDistanceResult>>();

function createThrottledExecutor(intervalMs: number) {
  let queue: Promise<unknown> = Promise.resolve();
  let lastRequestAt = 0;

  return function run<T>(operation: () => Promise<T>): Promise<T> {
    const result = queue.then(async () => {
      const waitMs = Math.max(intervalMs - (Date.now() - lastRequestAt), 0);

      if (waitMs > 0) {
        await new Promise<void>((resolve) => setTimeout(resolve, waitMs));
      }

      lastRequestAt = Date.now();
      return operation();
    });

    queue = result.catch(() => undefined);
    return result;
  };
}

const runGeocodingRequest = createThrottledExecutor(REQUEST_INTERVAL_MS);
const runRoutingRequest = createThrottledExecutor(REQUEST_INTERVAL_MS);

function getCached<T>(cache: Map<string, CacheEntry<T>>, key: string) {
  const entry = cache.get(key);

  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }

  return entry.value;
}

function setCached<T>(
  cache: Map<string, CacheEntry<T>>,
  key: string,
  value: T,
  ttlMs: number,
) {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) {
      cache.delete(oldestKey);
    }
  }

  cache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

function serviceUrl(baseUrl: string, path: string) {
  const normalizedBaseUrl = `${String(baseUrl || "").replace(/\/+$/, "")}/`;
  return new URL(path.replace(/^\/+/, ""), normalizedBaseUrl);
}

async function fetchJson<T>(
  url: URL,
  headers: Record<string, string>,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Map service returned HTTP ${response.status}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ShippingDistanceError) {
      throw error;
    }

    throw new ShippingDistanceError(
      "service_unavailable",
      "The map service is unavailable",
    );
  } finally {
    clearTimeout(timeout);
  }
}

function cleanAddressPart(value: unknown) {
  return String(value || "").trim();
}

function normalizeLocationText(value: unknown) {
  return cleanAddressPart(value)
    .toLocaleLowerCase("th-TH")
    .replace(/ตำบล|อำเภอ|จังหวัด|ต\.|อ\.|จ\./g, "")
    .replace(/[\s,.-]/g, "");
}

function areaQueries(address: ShippingAddressArea) {
  const subdistrict = cleanAddressPart(address.subdistrict);
  const district = cleanAddressPart(address.district);
  const province = cleanAddressPart(address.province);
  const postcode = cleanAddressPart(address.postcode);
  const candidates = [
    {
      query: [subdistrict, district, province, postcode, "ประเทศไทย"]
        .filter(Boolean)
        .join(", "),
      requiredParts: [subdistrict, district, province].filter(Boolean),
    },
    {
      query: [subdistrict, district, province, "ประเทศไทย"]
        .filter(Boolean)
        .join(", "),
      requiredParts: [subdistrict, district, province].filter(Boolean),
    },
    {
      query: [district, province, postcode, "ประเทศไทย"]
        .filter(Boolean)
        .join(", "),
      requiredParts: [district, province].filter(Boolean),
    },
    {
      query: [district, province, "ประเทศไทย"].filter(Boolean).join(", "),
      requiredParts: [district, province].filter(Boolean),
    },
  ];

  return candidates.filter(
    (candidate, index, all) =>
      candidate.query !== "ประเทศไทย" &&
      all.findIndex((entry) => entry.query === candidate.query) === index,
  );
}

function coordinateFromNominatim(
  result: NominatimResult | undefined,
  requiredParts: string[],
): Coordinate | null {
  const searchableLocation = [
    result?.display_name,
    ...Object.values(result?.address || {}),
  ]
    .filter(Boolean)
    .join(" ");
  const normalizedDisplayName = normalizeLocationText(searchableLocation);
  const matchesRequestedArea = requiredParts.every((part) =>
    normalizedDisplayName.includes(normalizeLocationText(part)),
  );
  const latitude = Number(result?.lat);
  const longitude = Number(result?.lon);

  if (
    !matchesRequestedArea ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  ) {
    return null;
  }

  return { latitude, longitude };
}

async function geocodeArea(
  address: ShippingAddressArea,
  config: ShippingDistanceConfig,
) {
  const candidates = areaQueries(address);

  if (!candidates.length) {
    throw new ShippingDistanceError(
      "location_not_found",
      "The address does not contain enough location information",
    );
  }

  const cacheKey = `${config.geocodingBaseUrl}|${candidates
    .map((candidate) => candidate.query)
    .join("|")
    .toLocaleLowerCase("th-TH")}`;
  const cached = getCached(geocodeCache, cacheKey);
  if (cached) {
    return cached;
  }

  const existingRequest = geocodeInFlight.get(cacheKey);
  if (existingRequest) {
    return existingRequest;
  }

  const request = (async () => {
    for (const candidate of candidates) {
      const coordinate = await runGeocodingRequest(async () => {
        const url = serviceUrl(config.geocodingBaseUrl, "search");
        url.search = new URLSearchParams({
          format: "jsonv2",
          limit: "5",
          countrycodes: "th",
          layer: "address",
          addressdetails: "1",
          "accept-language": "th",
          q: candidate.query,
        }).toString();

        const results = await fetchJson<NominatimResult[]>(url, {
          Accept: "application/json",
          "Accept-Language": "th,en;q=0.8",
          "User-Agent": config.userAgent,
        });

        return (
          results
            .map((result) =>
              coordinateFromNominatim(result, candidate.requiredParts),
            )
            .find(Boolean) || null
        );
      });

      if (coordinate) {
        setCached(geocodeCache, cacheKey, coordinate, GEOCODE_CACHE_TTL_MS);
        return coordinate;
      }
    }

    throw new ShippingDistanceError(
      "location_not_found",
      "The address could not be located",
    );
  })();

  geocodeInFlight.set(cacheKey, request);

  try {
    return await request;
  } finally {
    geocodeInFlight.delete(cacheKey);
  }
}

function coordinateKey(coordinate: Coordinate) {
  return `${coordinate.longitude.toFixed(6)},${coordinate.latitude.toFixed(6)}`;
}

async function routeBetween(
  origin: Coordinate,
  destination: Coordinate,
  config: ShippingDistanceConfig,
) {
  const originKey = coordinateKey(origin);
  const destinationKey = coordinateKey(destination);
  const cacheKey = `${config.routingBaseUrl}|${originKey};${destinationKey}`;
  const cached = getCached(routeCache, cacheKey);
  if (cached) {
    return cached;
  }

  const existingRequest = routeInFlight.get(cacheKey);
  if (existingRequest) {
    return existingRequest;
  }

  const request = runRoutingRequest(async () => {
    const url = serviceUrl(
      config.routingBaseUrl,
      `route/v1/driving/${originKey};${destinationKey}`,
    );
    url.search = new URLSearchParams({
      overview: "false",
      steps: "false",
    }).toString();

    const headers: Record<string, string> = {
      Accept: "application/json",
      "User-Agent": config.userAgent,
    };

    if (config.referer) {
      headers.Referer = config.referer;
    }

    const response = await fetchJson<OsrmResult>(url, headers);
    const route = response.routes?.[0];
    const distanceMeters = Number(route?.distance);
    const durationSeconds = Number(route?.duration);

    if (
      response.code !== "Ok" ||
      !Number.isFinite(distanceMeters) ||
      !Number.isFinite(durationSeconds)
    ) {
      throw new ShippingDistanceError(
        "route_not_found",
        "A driving route could not be calculated",
      );
    }

    const result = {
      distanceMeters,
      durationSeconds,
    };
    setCached(routeCache, cacheKey, result, ROUTE_CACHE_TTL_MS);
    return result;
  });

  routeInFlight.set(cacheKey, request);

  try {
    return await request;
  } finally {
    routeInFlight.delete(cacheKey);
  }
}

export async function calculateShippingDistance(
  origin: ShippingAddressArea,
  destination: ShippingAddressArea,
  config: ShippingDistanceConfig,
) {
  const [originCoordinate, destinationCoordinate] = await Promise.all([
    geocodeArea(origin, config),
    geocodeArea(destination, config),
  ]);

  return routeBetween(originCoordinate, destinationCoordinate, config);
}

export async function calculateShippingDistanceToCoordinate(
  origin: ShippingAddressArea,
  destination: ShippingCoordinate,
  config: ShippingDistanceConfig,
) {
  const originCoordinate = await geocodeArea(origin, config);
  return routeBetween(originCoordinate, destination, config);
}

export async function calculateShippingDistanceBetweenCoordinates(
  origin: ShippingCoordinate,
  destination: ShippingCoordinate,
  config: ShippingDistanceConfig,
) {
  return routeBetween(origin, destination, config);
}
