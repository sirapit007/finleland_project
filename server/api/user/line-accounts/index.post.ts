import { requireCurrentUser } from "@@/server/utils/session";

export default defineEventHandler(async (event) => {
  await requireCurrentUser(event);
  throw createError({
    statusCode: 410,
    statusMessage: "Please connect your LINE account through LINE Login",
  });
});