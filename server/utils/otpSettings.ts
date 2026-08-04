const DEFAULTS = {
  length: 6,
  ttlSeconds: 5 * 60,
  resendCooldownSeconds: 60,
  rateLimitWindowSeconds: 15 * 60,
  maxRequestsPerWindow: 3,
  maxVerifyAttempts: 5,
};

function positiveInteger(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function getOtpSettings() {
  const config = useRuntimeConfig();

  return {
    length: positiveInteger(config.otpLength, DEFAULTS.length),
    ttlSeconds: positiveInteger(config.otpTtlSeconds, DEFAULTS.ttlSeconds),
    resendCooldownSeconds: positiveInteger(
      config.otpResendCooldownSeconds,
      DEFAULTS.resendCooldownSeconds,
    ),
    rateLimitWindowSeconds: positiveInteger(
      config.otpRateLimitWindowSeconds,
      DEFAULTS.rateLimitWindowSeconds,
    ),
    maxRequestsPerWindow: positiveInteger(
      config.otpMaxRequestsPerWindow,
      DEFAULTS.maxRequestsPerWindow,
    ),
    maxVerifyAttempts: positiveInteger(
      config.otpMaxVerifyAttempts,
      DEFAULTS.maxVerifyAttempts,
    ),
  };
}
