import { getUserSession, requireCurrentUser } from "@@/server/utils/session";

export default defineEventHandler(async (event) => {
  setResponseHeader(event, "Cache-Control", "no-store");
  if (!getUserSession(event)) return { authenticated: false };
  try {
    const user = await requireCurrentUser(event);
    return { authenticated: true, user };
  } catch (error) {
    if ((error as { statusCode?: number }).statusCode === 401) return { authenticated: false };
    throw error;
  }
});
