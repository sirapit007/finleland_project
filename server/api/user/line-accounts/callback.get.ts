import {
  clearLineConnectStateCookie,
  getLineLoginConfig,
  hasLineConnectStateCookie,
  readLineConnectState,
} from "@@/server/utils/lineLogin";
import { upsertLineAccount } from "@@/server/utils/lineAccounts";

type LineTokenResponse = {
  id_token?: string;
};

type LineIdTokenProfile = {
  sub?: string;
  name?: string;
  picture?: string;
  nonce?: string;
};

function profileRedirect(status: "connected" | "cancelled" | "error") {
  return `/profile?line=${status}`;
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  if (query.error) {
    return sendRedirect(event, profileRedirect("cancelled"));
  }

  const code = String(query.code || "");
  const state = String(query.state || "");
  const config = getLineLoginConfig();
  const statePayload = readLineConnectState(state, config.stateSecret);

  if (!code || !statePayload || !hasLineConnectStateCookie(event, statePayload.nonce)) {
    clearLineConnectStateCookie(event);
    return sendRedirect(event, profileRedirect("error"));
  }

  clearLineConnectStateCookie(event);

  try {
    const token = await $fetch<LineTokenResponse>(
      "https://api.line.me/oauth2/v2.1/token",
      {
        method: "POST",
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: config.callbackUrl,
          client_id: config.channelId,
          client_secret: config.channelSecret,
        }),
      },
    );

    if (!token.id_token) {
      throw new Error("LINE did not return an ID token");
    }

    const profile = await $fetch<LineIdTokenProfile>(
      "https://api.line.me/oauth2/v2.1/verify",
      {
        method: "POST",
        body: new URLSearchParams({
          id_token: token.id_token,
          client_id: config.channelId,
        }),
      },
    );

    if (!profile.sub || profile.nonce !== statePayload.nonce) {
      throw new Error("LINE ID token verification failed");
    }

    await upsertLineAccount({
      lineUser: statePayload.userUuid,
      lineProviderId: config.providerId,
      lineUserId: profile.sub,
      lineDisplayName: profile.name || null,
      linePictureUrl: profile.picture || null,
    });

    return sendRedirect(event, profileRedirect("connected"));
  } catch {
    return sendRedirect(event, profileRedirect("error"));
  }
});
