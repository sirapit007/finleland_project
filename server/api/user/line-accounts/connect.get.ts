import {
  createLineAuthorizeUrl,
  createLineConnectState,
  getLineLoginConfig,
  setLineConnectStateCookie,
} from "@@/server/utils/lineLogin";
import { requireCurrentUser } from "@@/server/utils/session";

export default defineEventHandler(async (event) => {
  const currentUser = await requireCurrentUser(event);
  const config = getLineLoginConfig();
  const { state, nonce } = createLineConnectState(
    currentUser.uuid,
    config.stateSecret,
  );

  setLineConnectStateCookie(event, nonce);
  return sendRedirect(event, createLineAuthorizeUrl(config, state, nonce));
});
