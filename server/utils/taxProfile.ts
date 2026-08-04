export type TaxProfileInput = {
  tax_profile_label: string;
  taxpayer_type: "individual" | "company";
  taxpayer_name: string;
  taxpayer_id: string;
  taxpayer_branch_type: "none" | "head_office" | "branch";
  taxpayer_branch_code: string | null;
  taxpayer_address: string;
  taxpayer_subdistrict: string;
  taxpayer_district: string;
  taxpayer_province: string;
  taxpayer_postcode: string;
  taxpayer_phone: string | null;
  taxpayer_email: string | null;
  tax_profile_is_default: boolean;
};

const toBoolean = (value: unknown) =>
  value === true || value === "true" || value === 1 || value === "1";

export function normalizeTaxProfileInput(
  body: Record<string, unknown>,
): TaxProfileInput {
  const taxpayerType = String(
    body.taxpayer_type || "individual",
  ).trim() as TaxProfileInput["taxpayer_type"];
  let branchType = String(body.taxpayer_branch_type || "none").trim();
  let branchCode = String(body.taxpayer_branch_code || "").trim() || null;

  if (taxpayerType === "individual") {
    branchType = "none";
    branchCode = null;
  } else if (branchType === "head_office") {
    branchCode = "00000";
  }

  return {
    tax_profile_label: String(body.tax_profile_label || "").trim(),
    taxpayer_type: taxpayerType,
    taxpayer_name: String(body.taxpayer_name || "").trim(),
    taxpayer_id: String(body.taxpayer_id || "").trim(),
    taxpayer_branch_type: branchType as TaxProfileInput["taxpayer_branch_type"],
    taxpayer_branch_code: branchCode,
    taxpayer_address: String(body.taxpayer_address || "").trim(),
    taxpayer_subdistrict: String(body.taxpayer_subdistrict || "").trim(),
    taxpayer_district: String(body.taxpayer_district || "").trim(),
    taxpayer_province: String(body.taxpayer_province || "").trim(),
    taxpayer_postcode: String(body.taxpayer_postcode || "").trim(),
    taxpayer_phone: String(body.taxpayer_phone || "").trim() || null,
    taxpayer_email: String(body.taxpayer_email || "").trim() || null,
    tax_profile_is_default: toBoolean(body.tax_profile_is_default),
  };
}

export function validateTaxProfileInput(input: TaxProfileInput) {
  if (!["individual", "company"].includes(input.taxpayer_type)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Taxpayer type is invalid",
    });
  }

  if (
    !input.tax_profile_label ||
    !input.taxpayer_name ||
    !input.taxpayer_address ||
    !input.taxpayer_subdistrict ||
    !input.taxpayer_district ||
    !input.taxpayer_province ||
    !input.taxpayer_postcode
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "Tax profile fields are required",
    });
  }

  if (
    input.tax_profile_label.length > 100 ||
    input.taxpayer_name.length > 200 ||
    input.taxpayer_subdistrict.length > 100 ||
    input.taxpayer_district.length > 100 ||
    input.taxpayer_province.length > 100
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "Tax profile contains a value that is too long",
    });
  }

  if (!/^[0-9]{13}$/.test(input.taxpayer_id)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Taxpayer ID must contain exactly 13 digits",
    });
  }

  if (!/^[0-9]{5}$/.test(input.taxpayer_postcode)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Postcode must contain exactly 5 digits",
    });
  }

  if (input.taxpayer_phone && !/^[0-9]{10}$/.test(input.taxpayer_phone)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Phone number must contain exactly 10 digits",
    });
  }

  if (
    input.taxpayer_email &&
    (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.taxpayer_email) ||
      input.taxpayer_email.length > 254)
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "Taxpayer email is invalid",
    });
  }

  if (
    input.taxpayer_type === "company" &&
    !["head_office", "branch"].includes(input.taxpayer_branch_type)
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "Company branch type is required",
    });
  }

  if (
    input.taxpayer_branch_type === "branch" &&
    (!input.taxpayer_branch_code ||
      !/^[0-9]{5}$/.test(input.taxpayer_branch_code) ||
      input.taxpayer_branch_code === "00000")
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "Branch code must contain 5 digits and cannot be 00000",
    });
  }
}

export function throwFriendlyTaxProfileError(error: unknown): never {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "23505"
  ) {
    throw createError({
      statusCode: 409,
      statusMessage: "This taxpayer ID and branch already exist",
    });
  }
  throw error;
}
