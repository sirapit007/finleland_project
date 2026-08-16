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
  };
}

export function toShippingAddressForm(
  address?: Partial<ShippingAddress> | null,
): ShippingAddressForm {
  return createShippingAddressForm({
    shipping_user: address?.shipping_user || "",
    shipping_label: address?.shipping_label || "",
    shipping_recipient: address?.shipping_recipient || "",
    shipping_phone: address?.shipping_phone || "",
    shipping_address: address?.shipping_address || "",
    shipping_subdistrict: address?.shipping_subdistrict || "",
    shipping_district: address?.shipping_district || "",
    shipping_province: address?.shipping_province || "",
    shipping_postcode: address?.shipping_postcode || "",
    shipping_note: address?.shipping_note || "",
    shipping_is_default: Boolean(address?.shipping_is_default),
  });
}

export async function fetchShippingAddresses(shippingUser: string) {
  if (!shippingUser) {
    return [];
  }

  const response = await $fetch<{ rows: ShippingAddress[] }>(
    "/api/user/shipping-addresses",
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
  return $fetch<{ row: ShippingAddress }>("/api/user/shipping-addresses", {
    method: "POST",
    body: {
      ...form,
      user,
    },
  });
}

export async function updateShippingAddress(
  uuid: string,
  form: ShippingAddressForm,
  user?: object,
) {
  return $fetch<{ row: ShippingAddress }>(
    `/api/user/shipping-addresses/${uuid}`,
    {
      method: "PUT",
      body: {
        ...form,
        user,
      },
    },
  );
}

export async function deleteShippingAddress(uuid: string, user?: object) {
  return $fetch(`/api/user/shipping-addresses/${uuid}`, {
    method: "DELETE",
    body: {
      user,
    },
  });
}
