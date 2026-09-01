export type ShippingAddressForm = {
  shipping_user: string;
  shipping_label: string;
  shipping_recipient: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_subdistrict: string;
  shipping_district: string;
  shipping_province: string;
  shipping_postcode: string;
  shipping_note: string;
  shipping_is_default: boolean;
  shipping_latitude: number | null;
  shipping_longitude: number | null;
  shipping_location_provider: string | null;
  shipping_place_id: string | null;
  shipping_location_source:
    | "map_pin"
    | "current_location"
    | "address_search"
    | "manual"
    | null;
  shipping_location_accuracy: "exact" | "approximate" | "area" | null;
  shipping_location_confirmed_at: string | null;
};

export type ShippingAddress = ShippingAddressForm & {
  id: number;
  uuid: string;
  created_by: string | null;
  created_at: string;
  updated_by: string | null;
  updated_at: string | null;
  deleted_by: string | null;
  deleted_at: string | null;
  created_username?: string | null;
  updated_username?: string | null;
  deleted_username?: string | null;
};

function toBoolean(value: unknown) {
  return value === true || value === "true" || value === 1 || value === "1";
}

function toNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function createShippingAddressForm(
  initial: Partial<ShippingAddressForm> = {},
): ShippingAddressForm {
  return {
    shipping_user: String(initial.shipping_user || ""),
    shipping_label: String(initial.shipping_label || ""),
    shipping_recipient: String(initial.shipping_recipient || ""),
    shipping_phone: String(initial.shipping_phone || ""),
    shipping_address: String(initial.shipping_address || ""),
    shipping_subdistrict: String(initial.shipping_subdistrict || ""),
    shipping_district: String(initial.shipping_district || ""),
    shipping_province: String(initial.shipping_province || ""),
    shipping_postcode: String(initial.shipping_postcode || ""),
    shipping_note: String(initial.shipping_note || ""),
    shipping_is_default: toBoolean(initial.shipping_is_default),
    shipping_latitude: toNullableNumber(initial.shipping_latitude),
    shipping_longitude: toNullableNumber(initial.shipping_longitude),
    shipping_location_provider: initial.shipping_location_provider || null,
    shipping_place_id: initial.shipping_place_id || null,
    shipping_location_source: initial.shipping_location_source || null,
    shipping_location_accuracy: initial.shipping_location_accuracy || null,
    shipping_location_confirmed_at:
      initial.shipping_location_confirmed_at || null,
  };
}

export function toShippingAddressForm(
  address?: Partial<ShippingAddress> | null,
): ShippingAddressForm {
  return createShippingAddressForm(address || {});
}

export async function fetchShippingAddresses(shippingUser: string) {
  if (!shippingUser) return [];
  const response = await $fetch<{ rows: ShippingAddress[] }>(
    "/api/user/smart-shipping-addresses",
    {
      query: {
        shipping_user: shippingUser,
        page: 1,
        pageSize: 100,
      },
    },
  );
  return response.rows || [];
}

export async function createShippingAddress(
  form: ShippingAddressForm,
  user?: object,
) {
  return $fetch<{ row: ShippingAddress }>(
    "/api/user/smart-shipping-addresses",
    {
      method: "POST",
      body: { ...form, user },
    },
  );
}

export async function updateShippingAddress(
  uuid: string,
  form: ShippingAddressForm,
  user?: object,
) {
  return $fetch<{ row: ShippingAddress }>(
    `/api/user/smart-shipping-addresses/${uuid}`,
    {
      method: "PUT",
      body: { ...form, user },
    },
  );
}

export async function deleteShippingAddress(uuid: string, user?: object) {
  return $fetch(`/api/user/smart-shipping-addresses/${uuid}`, {
    method: "DELETE",
    body: { user },
  });
}
