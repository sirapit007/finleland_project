import {
  createLineAuthorizeUrl,
  createLineConnectState,
  getLineLoginConfig,
  setLineConnectStateCookie,
} from "@@/server/utils/lineLogin";
import { requireCurrentUser } from "@@/server/utils/session";
import { createLineConnectVerifier } from "@@/server/utils/lineConnectPkce";

export default defineEventHandler(async (event) => {
  const currentUser = await requireCurrentUser(event);
  const config = getLineLoginConfig();
  const { state, nonce } = createLineConnectState(
    currentUser.uuid,
    config.stateSecret,
  );

  setLineConnectStateCookie(event, nonce);
  const url = new URL(createLineAuthorizeUrl(config, state, nonce));
  url.searchParams.set("code_challenge", createLineConnectVerifier(event));
  url.searchParams.set("code_challenge_method", "S256");
  return sendRedirect(event, url.toString());
});
