import { createHash, randomBytes } from "node:crypto";

const COOKIE_NAME = "line_connect_verifier";

export function createLineConnectVerifier(event: any) {
  const verifier = randomBytes(32).toString("base64url");
  setCookie(event, COOKIE_NAME, verifier, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60,
  });
  return createHash("sha256").update(verifier).digest("base64url");
}

export function clearLineConnectVerifier(event: any) {
  deleteCookie(event, COOKIE_NAME, { path: "/" });
}

export function takeLineConnectVerifier(event: any) {
  const verifier = getCookie(event, COOKIE_NAME);
  clearLineConnectVerifier(event);
  return verifier && /^[A-Za-z0-9_-]{43}$/.test(verifier) ? verifier : null;
}