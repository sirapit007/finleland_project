import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const LINE_STATE_COOKIE = "line_connect_state";
const LINE_STATE_TTL_SECONDS = 10 * 60;

type LineStatePayload = {
  userUuid: string;
  nonce: string;
  expiresAt: number;
};

export type LineLoginConfig = {
  channelId: string;
  channelSecret: string;
  callbackUrl: string;
  providerId: string;
  stateSecret: string;
};

function toBase64Url(value: string | Buffer) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function fromBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  return Buffer.from(padded, "base64");
}

export function getLineLoginConfig(): LineLoginConfig {
  const config = useRuntimeConfig();
  const channelId = String(config.lineLoginChannelId || "").trim();
  const channelSecret = String(config.lineLoginChannelSecret || "").trim();
  const callbackUrl = String(config.lineLoginCallbackUrl || "").trim();
  const providerId = String(config.lineProviderId || "").trim();
  const stateSecret = String(
    config.lineStateSecret || process.env.JWT_SECRET || "",
  ).trim();

  if (!channelId || !channelSecret || !callbackUrl || !providerId || !stateSecret) {
    throw createError({
      statusCode: 503,
      statusMessage: "LINE Login has not been configured",
    });
  }

  return {
    channelId,
    channelSecret,
    callbackUrl,
    providerId,
    stateSecret,
  };
}

function signState(payload: string, secret: string) {
  return toBase64Url(createHmac("sha256", secret).update(payload).digest());
}

export function createLineConnectState(userUuid: string, secret: string) {
  const statePayload: LineStatePayload = {
    userUuid,
    nonce: randomBytes(24).toString("hex"),
    expiresAt: Date.now() + LINE_STATE_TTL_SECONDS * 1000,
  };
  const encodedPayload = toBase64Url(JSON.stringify(statePayload));
  const state = `${encodedPayload}.${signState(encodedPayload, secret)}`;

  return { state, nonce: statePayload.nonce };
}

export function readLineConnectState(state: string, secret: string) {
  const [encodedPayload, signature] = String(state || "").split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = Buffer.from(signState(encodedPayload, secret));
  const receivedSignature = Buffer.from(signature);

  if (
    expectedSignature.length !== receivedSignature.length ||
    !timingSafeEqual(expectedSignature, receivedSignature)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      fromBase64Url(encodedPayload).toString("utf8"),
    ) as LineStatePayload;

    if (!payload.userUuid || !payload.nonce || payload.expiresAt <= Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function setLineConnectStateCookie(event: any, nonce: string) {
  setCookie(event, LINE_STATE_COOKIE, nonce, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: LINE_STATE_TTL_SECONDS,
  });
}

export function hasLineConnectStateCookie(event: any, nonce: string) {
  return getCookie(event, LINE_STATE_COOKIE) === nonce;
}

export function clearLineConnectStateCookie(event: any) {
  deleteCookie(event, LINE_STATE_COOKIE, { path: "/" });
}

export function createLineAuthorizeUrl(
  config: LineLoginConfig,
  state: string,
  nonce: string,
) {
  const search = new URLSearchParams({
    response_type: "code",
    client_id: config.channelId,
    redirect_uri: config.callbackUrl,
    state,
    scope: "openid profile",
    nonce,
  });

  return `https://access.line.me/oauth2/v2.1/authorize?${search.toString()}`;
}
