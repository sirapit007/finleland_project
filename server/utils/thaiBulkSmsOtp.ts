const OTP_REQUEST_URL = "https://otp.thaibulksms.com/v2/otp/request";
const OTP_VERIFY_URL = "https://otp.thaibulksms.com/v2/otp/verify";

type ProviderResponse = {
  status?: string;
  token?: string;
  refno?: string;
  message?: string;
  code?: string | number;
};

export class OtpProviderError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "OtpProviderError";
  }
}

function getCredentials() {
  const config = useRuntimeConfig();
  const key = String(config.thaiBulkSmsOtpKey || "").trim();
  const secret = String(config.thaiBulkSmsOtpSecret || "").trim();

  if (!key || !secret) {
    throw new OtpProviderError(
      "ThaiBulkSMS OTP credentials are not configured",
      500,
    );
  }

  return { key, secret };
}

async function postOtpForm(url: string, form: URLSearchParams) {
  try {
    return await $fetch.raw<ProviderResponse>(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
      timeout: 10_000,
      ignoreResponseError: true,
    });
  } catch {
    throw new OtpProviderError("OTP provider is unavailable", 502);
  }
}

export async function requestThaiBulkSmsOtp(phone: string) {
  const { key, secret } = getCredentials();
  const form = new URLSearchParams({ key, secret, msisdn: phone });
  const response = await postOtpForm(OTP_REQUEST_URL, form);
  const data = response._data;

  if (
    response.status < 400 &&
    data?.status === "success" &&
    data.token &&
    data.refno
  ) {
    return { token: data.token, refno: data.refno };
  }

  console.error("ThaiBulkSMS OTP request failed", {
    statusCode: response.status,
    providerStatus: data?.status,
    providerCode: data?.code,
    providerMessage: data?.message,
  });
  throw new OtpProviderError("Unable to request OTP", 502);
}

export async function verifyThaiBulkSmsOtp(token: string, pin: string) {
  const { key, secret } = getCredentials();
  const form = new URLSearchParams({ key, secret, token, pin });
  const response = await postOtpForm(OTP_VERIFY_URL, form);
  const data = response._data;

  if (response.status < 400 && data?.status === "success") {
    return true;
  }

  if (response.status >= 500) {
    console.error("ThaiBulkSMS OTP verify failed", {
      statusCode: response.status,
      providerStatus: data?.status,
      providerCode: data?.code,
      providerMessage: data?.message,
    });
    throw new OtpProviderError("OTP provider is unavailable", 502);
  }

  return false;
}
