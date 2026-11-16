import { getLineSignup } from "@@/server/utils/lineAuth";
import { getLineLoginConfig } from "@@/server/utils/lineLogin";

export default defineEventHandler((event) => {
  setResponseHeader(event, "Cache-Control", "no-store");
  const pending = getLineSignup(event, getLineLoginConfig());
  return pending
    ? { pending: true, displayName: pending.displayName, pictureUrl: pending.pictureUrl, email: pending.email }
    : { pending: false };
});
