import { getUserSession } from "@@/server/utils/session";

export default defineEventHandler((event) => {
  return {
    authenticated: Boolean(getUserSession(event)),
  };
});
