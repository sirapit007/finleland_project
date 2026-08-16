import { createHmac, timingSafeEqual } from "node:crypto";

function base64Url(input: string | Buffer) {
  return Buffer.from(input).toString("base64url");
}

export function createPasswordSessionVersion(
  passwordHash: string,
  secret: string,
) {
  return createHmac("sha256", secret)
    .update(`password-session:${passwordHash}`)
    .digest("base64url");
}

export function matchesPasswordSessionVersion(
  version: string,
  passwordHash: string,
  secret: string,
) {
  const expected = Buffer.from(
    createPasswordSessionVersion(passwordHash, secret),
  );
  const received = Buffer.from(String(version || ""));

  return (
    expected.length === received.length && timingSafeEqual(expected, received)
  );
}

export function signSessionToken(
  payload: Record<string, unknown>,
  secret: string,
  expiresIn: number,
) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const tokenPayload = { ...payload, iat: now, exp: now + expiresIn };
  const unsignedToken = `${base64Url(JSON.stringify(header))}.${base64Url(
    JSON.stringify(tokenPayload),
  )}`;
  const signature = createHmac("sha256", secret).update(unsignedToken).digest();

  return `${unsignedToken}.${base64Url(signature)}`;
}
