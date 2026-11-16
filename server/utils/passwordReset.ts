import { createHmac, timingSafeEqual } from "node:crypto";

export const RESET_COOKIE = "password_reset_binding";
export const RESET_VERIFIED_COOKIE = "password_reset_verified";
export const RESET_COOKIE_PATH = "/api/auth/password-reset";

// The binding conceals the account ID and changes for every OTP challenge.
export function resetAccountBinding(challengeId: string, userId: string, secret: string) {
  return createHmac("sha256", secret)
    .update(`password-reset:${challengeId}:${userId}`)
    .digest("hex");
}

export function matchesResetAccountBinding(value: string, challengeId: string, userId: string, secret: string) {
  if (!/^[0-9a-f]{64}$/.test(value)) return false;
  const expected = resetAccountBinding(challengeId, userId, secret);
  return timingSafeEqual(Buffer.from(value, "hex"), Buffer.from(expected, "hex"));
}

// Only the OTP verification endpoint can mint this proof. It is bound to both
// the challenge and the browser's original account binding cookie.
export function resetVerificationProof(challengeId: string, binding: string, secret: string) {
  return createHmac("sha256", secret)
    .update(`password-reset-verified:${challengeId}:${binding}`)
    .digest("hex");
}

export function matchesResetVerificationProof(value: string, challengeId: string, binding: string, secret: string) {
  if (!/^[0-9a-f]{64}$/.test(value)) return false;
  const expected = resetVerificationProof(challengeId, binding, secret);
  return timingSafeEqual(Buffer.from(value, "hex"), Buffer.from(expected, "hex"));
}
