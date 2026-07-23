import { createHmac, timingSafeEqual } from "node:crypto";

type LineWebhookEvent = {
  type?: string;
  source?: {
    type?: string;
    groupId?: string;
  };
};

type LineWebhookPayload = {
  events?: LineWebhookEvent[];
};

function hasValidSignature(
  payload: string,
  receivedSignature: string,
  channelSecret: string,
) {
  const expectedSignature = createHmac("sha256", channelSecret)
    .update(payload)
    .digest("base64");
  const expected = Buffer.from(expectedSignature);
  const received = Buffer.from(receivedSignature);

  return (
    expected.length === received.length &&
    timingSafeEqual(expected, received)
  );
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const channelSecret = String(config.lineMessagingChannelSecret || "").trim();
  const signature = String(getHeader(event, "x-line-signature") || "").trim();
  const rawPayload = await readRawBody(event);

  if (!channelSecret) {
    throw createError({
      statusCode: 503,
      statusMessage: "LINE Messaging API webhook has not been configured",
    });
  }

  if (!rawPayload || !signature || !hasValidSignature(rawPayload, signature, channelSecret)) {
    throw createError({
      statusCode: 401,
      statusMessage: "LINE webhook signature is invalid",
    });
  }

  let payload: LineWebhookPayload;

  try {
    payload = JSON.parse(rawPayload) as LineWebhookPayload;
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: "LINE webhook payload is invalid",
    });
  }

  for (const lineEvent of payload.events || []) {
    if (lineEvent.source?.type !== "group" || !lineEvent.source.groupId) {
      continue;
    }

    // Never log member messages or profile data while collecting the group ID.
    console.info(
      `[LINE webhook] group event=${lineEvent.type || "unknown"} groupId=${lineEvent.source.groupId}`,
    );
  }

  return { ok: true };
});
