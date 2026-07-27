export function normalizeProductImageUrls(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value !== "string") return [];

  const source = value.trim();
  if (!source) return [];

  try {
    const parsed = JSON.parse(source);
    if (Array.isArray(parsed) || typeof parsed === "string") {
      return normalizeProductImageUrls(parsed);
    }
  } catch {
    // Supports legacy product rows that contain a plain URL or CSV value.
  }

  return source
    .split(/,(?=https?:\/\/)/i)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function firstProductImageUrl(value: unknown): string {
  return normalizeProductImageUrls(value)[0] || "";
}
