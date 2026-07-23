import { requireCurrentUser } from "@@/server/utils/session";

export default defineEventHandler(async (event) => {
  await requireCurrentUser(event);

  const config = useRuntimeConfig();
  const configured = [
    config.lineLoginChannelId,
    config.lineLoginChannelSecret,
    config.lineLoginCallbackUrl,
    config.lineProviderId,
  ].every((value) => Boolean(String(value || "").trim()));

  return { configured };
});
