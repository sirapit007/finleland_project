import { startLineAuth } from "@@/server/utils/lineAuth";
import { getLineLoginConfig } from "@@/server/utils/lineLogin";

export default defineEventHandler((event) => {
  setResponseHeader(event, "Cache-Control", "no-store");
  const query = getQuery(event);
  if (query.intent !== "login" && query.intent !== "register") {
    throw createError({ statusCode: 400, statusMessage: "Invalid LINE login intent" });
  }
  try {
    return sendRedirect(event, startLineAuth(event, getLineLoginConfig(), query.intent, query.device === "desktop"));
  } catch {
    return sendRedirect(event, "/auth/line?result=error");
  }
});
