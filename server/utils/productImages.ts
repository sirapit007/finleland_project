export function normalizeProductImageUrls(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value !== "string") {
    return [];
  }

  const source = value.trim();
  if (!source) {
    return [];
  }

  try {
    const parsed = JSON.parse(source);
    if (Array.isArray(parsed)) {
      return normalizeProductImageUrls(parsed);
    }
    if (typeof parsed === "string") {
      return normalizeProductImageUrls(parsed);
    }
  } catch {
    // Backward compatibility for legacy rows saved as a plain URL or CSV.
  }

  return source
    .split(/,(?=https?:\/\/)/i)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function serializeProductImageUrls(value: unknown): string {
  return JSON.stringify(normalizeProductImageUrls(value));
}
