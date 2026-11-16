import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { LineLoginConfig } from "@@/server/utils/lineLogin";

const OAUTH_COOKIE = "line_auth_state";
const PENDING_COOKIE = "line_signup_pending";
const OAUTH_TTL = 10 * 60;
const PENDING_TTL = 30 * 60;

type OAuthState = {
  kind: "oauth";
  state: string;
  nonce: string;
  verifier: string;
  intent: "login" | "register";
  expiresAt: number;
};

export type LineSignup = {
  kind: "signup";
  providerId: string;
  lineUserId: string;
  signupId: string;
  displayName: string | null;
  pictureUrl: string | null;
  email: string | null;
  expiresAt: number;
};

export function signLinePayload(payload: object, secret: string) {
  const value = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret).update(value).digest("base64url");
  return `${value}.${signature}`;
}

export function readLinePayload(value: string | undefined, secret: string): any | null {
  const parts = String(value || "").split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  const expected = Buffer.from(createHmac("sha256", secret).update(parts[0]).digest("base64url"));
  const actual = Buffer.from(parts[1]);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    return typeof payload.expiresAt === "number" && payload.expiresAt > Date.now() ? payload : null;
  } catch {
    return null;
  }
}

function setSignedCookie(event: any, name: string, payload: object, secret: string, maxAge: number) {
  setCookie(event, name, signLinePayload(payload, secret), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
}

export function lineAuthCallbackUrl(config: LineLoginConfig) {
  return new URL("/api/auth/line/callback", config.callbackUrl).toString();
}

export function startLineAuth(event: any, config: LineLoginConfig, intent: "login" | "register", desktop: boolean) {
  const payload: OAuthState = {
    kind: "oauth",
    state: randomBytes(24).toString("hex"),
    nonce: randomBytes(24).toString("hex"),
    verifier: randomBytes(32).toString("base64url"),
    intent,
    expiresAt: Date.now() + OAUTH_TTL * 1000,
  };
  setSignedCookie(event, OAUTH_COOKIE, payload, config.stateSecret, OAUTH_TTL);
  deleteCookie(event, PENDING_COOKIE, { path: "/" });
  const emailEnabled = String(useRuntimeConfig().lineLoginEmailEnabled || "").toLowerCase() === "true";
  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.channelId,
    redirect_uri: lineAuthCallbackUrl(config),
    state: payload.state,
    scope: emailEnabled ? "openid profile email" : "openid profile",
    nonce: payload.nonce,
    code_challenge: createHash("sha256").update(payload.verifier).digest("base64url"),
    code_challenge_method: "S256",
  });
  if (desktop) {
    params.set("initial_amr_display", "lineqr");
    params.set("prompt", "login");
  }
  return `https://access.line.me/oauth2/v2.1/authorize?${params}`;
}

export function consumeLineAuthState(event: any, secret: string, state: string): OAuthState | null {
  const payload = readLinePayload(getCookie(event, OAUTH_COOKIE), secret);
  deleteCookie(event, OAUTH_COOKIE, { path: "/" });
  if (!payload || payload.kind !== "oauth" || payload.state !== state ||
      !payload.nonce || !payload.verifier || !["login", "register"].includes(payload.intent)) return null;
  return payload as OAuthState;
}

export function setLineSignup(event: any, config: LineLoginConfig, profile: { sub: string; name?: string; picture?: string; email?: string }) {
  const payload: LineSignup = {
    kind: "signup",
    providerId: config.providerId,
    lineUserId: profile.sub,
    signupId: randomBytes(32).toString("hex"),
    displayName: typeof profile.name === "string" ? profile.name.slice(0, 255) : null,
    pictureUrl: typeof profile.picture === "string" ? profile.picture.slice(0, 1024) : null,
    email: typeof profile.email === "string" ? profile.email.slice(0, 100) : null,
    expiresAt: Date.now() + PENDING_TTL * 1000,
  };
  setSignedCookie(event, PENDING_COOKIE, payload, config.stateSecret, PENDING_TTL);
}

export function getLineSignup(event: any, config: LineLoginConfig): LineSignup | null {
  const payload = readLinePayload(getCookie(event, PENDING_COOKIE), config.stateSecret);
  if (!payload || payload.kind !== "signup" || payload.providerId !== config.providerId ||
      typeof payload.lineUserId !== "string" || !/^U[0-9a-f]{32}$/i.test(payload.lineUserId) ||
      typeof payload.signupId !== "string" || !/^[0-9a-f]{64}$/.test(payload.signupId)) return null;
  return payload as LineSignup;
}

export function clearLineSignup(event: any) {
  deleteCookie(event, PENDING_COOKIE, { path: "/" });
}

