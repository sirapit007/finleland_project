export type TaxpayerType = "individual" | "company";
export type TaxpayerBranchType = "none" | "head_office" | "branch";

export type TaxProfileForm = {
  tax_profile_user: string;
  tax_profile_label: string;
  taxpayer_type: TaxpayerType;
  taxpayer_name: string;
  taxpayer_id: string;
  taxpayer_branch_type: TaxpayerBranchType;
  taxpayer_branch_code: string;
  taxpayer_address: string;
  taxpayer_subdistrict: string;
  taxpayer_district: string;
  taxpayer_province: string;
  taxpayer_postcode: string;
  taxpayer_phone: string;
  taxpayer_email: string;
  tax_profile_is_default: boolean;
};

export type TaxProfile = TaxProfileForm & {
  id: number;
  uuid: string;
  created_by: string;
  created_at: string;
  updated_by: string | null;
  updated_at: string | null;
  deleted_by: string | null;
  deleted_at: string | null;
};

const toBoolean = (value: unknown) =>
  value === true || value === "true" || value === 1 || value === "1";

export function createTaxProfileForm(
  initial: Partial<TaxProfileForm> = {},
): TaxProfileForm {
  return {
    tax_profile_user: String(initial.tax_profile_user || ""),
    tax_profile_label: String(initial.tax_profile_label || ""),
    taxpayer_type: initial.taxpayer_type === "company" ? "company" : "individual",
    taxpayer_name: String(initial.taxpayer_name || ""),
    taxpayer_id: String(initial.taxpayer_id || ""),
    taxpayer_branch_type:
      initial.taxpayer_branch_type === "branch" ||
      initial.taxpayer_branch_type === "head_office"
        ? initial.taxpayer_branch_type
        : "none",
    taxpayer_branch_code: String(initial.taxpayer_branch_code || ""),
    taxpayer_address: String(initial.taxpayer_address || ""),
    taxpayer_subdistrict: String(initial.taxpayer_subdistrict || ""),
    taxpayer_district: String(initial.taxpayer_district || ""),
    taxpayer_province: String(initial.taxpayer_province || ""),
    taxpayer_postcode: String(initial.taxpayer_postcode || ""),
    taxpayer_phone: String(initial.taxpayer_phone || ""),
    taxpayer_email: String(initial.taxpayer_email || ""),
    tax_profile_is_default: toBoolean(initial.tax_profile_is_default),
  };
}

export function toTaxProfileForm(
  profile?: Partial<TaxProfile> | null,
): TaxProfileForm {
  return createTaxProfileForm(profile || {});
}

export function formatTaxProfileAddress(profile: Partial<TaxProfileForm>) {
  return [
    profile.taxpayer_address,
    profile.taxpayer_subdistrict,
    profile.taxpayer_district,
    profile.taxpayer_province,
    profile.taxpayer_postcode,
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(", ");
}

export async function fetchTaxProfiles(taxProfileUser: string) {
  if (!taxProfileUser) return [];

  const response = await $fetch<{ rows: TaxProfile[] }>(
    "/api/user/tax-profiles",
    { query: { page: 1, pageSize: 100 } },
  );
  return response.rows || [];
}

export async function createTaxProfile(form: TaxProfileForm) {
  return $fetch<{ row: TaxProfile }>("/api/user/tax-profiles", {
    method: "POST",
    body: form,
  });
}

export async function updateTaxProfile(uuid: string, form: TaxProfileForm) {
  return $fetch<{ row: TaxProfile }>(`/api/user/tax-profiles/${uuid}`, {
    method: "PUT",
    body: form,
  });
}

export async function deleteTaxProfile(uuid: string) {
  return $fetch<{ row: TaxProfile }>(`/api/user/tax-profiles/${uuid}`, {
    method: "DELETE",
  });
}
