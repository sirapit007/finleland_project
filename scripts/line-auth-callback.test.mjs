import assert from "node:assert/strict";
import { test } from "node:test";
import { build } from "esbuild";
import path from "node:path";

const output = await build({
  entryPoints: ["server/api/auth/line/callback.get.ts"],
  bundle: true, format: "esm", platform: "node", write: false, logLevel: "silent",
  alias: { "@@": process.cwd() },
  plugins: [{
    name: "mock-line-db",
    setup(build) {
      build.onResolve({ filter: /server\/utils\/db/ }, () => ({ path: "mock-db", namespace: "mock" }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, () => ({
        contents: "export const useDb = () => globalThis.__lineCallbackTestDb",
        loader: "js",
      }));
    },
  }],
});
globalThis.defineEventHandler = (handler) => handler;
globalThis.getQuery = (event) => event.query;
globalThis.setResponseHeader = (event, name, value) => { event.headers[name] = value; };
globalThis.sendRedirect = (event, url) => { event.redirect = url; return url; };
globalThis.getCookie = (event, name) => event.cookies[name];
globalThis.setCookie = (event, name, value, options) => { event.cookies[name] = value; event.options[name] = options; };
globalThis.deleteCookie = (event, name) => { delete event.cookies[name]; };
globalThis.useRuntimeConfig = () => ({
  lineLoginChannelId: "12345",
  lineLoginChannelSecret: "test-only-channel-secret",
  lineLoginCallbackUrl: "https://example.test/api/user/line-accounts/callback",
  lineProviderId: "provider-1",
  lineStateSecret: "test-only-secret",
  lineLoginEmailEnabled: false,
});
const callback = (await import(`data:text/javascript;base64,${Buffer.from(output.outputFiles[0].contents).toString("base64")}`)).default;
const helperOutput = await build({
  entryPoints: ["server/utils/lineAuth.ts"], bundle: true, format: "esm", platform: "node", write: false, logLevel: "silent",
});
const auth = await import(`data:text/javascript;base64,${Buffer.from(helperOutput.outputFiles[0].contents).toString("base64")}`);
const config = {
  channelId: "12345", channelSecret: "test-only-channel-secret",
  callbackUrl: "https://example.test/api/user/line-accounts/callback",
  providerId: "provider-1", stateSecret: "test-only-secret",
};
const previousSecret = process.env.JWT_SECRET;
process.env.JWT_SECRET = "test-only-jwt-secret";
const lineId = `U${"a".repeat(32)}`;
const user = { id: 7, uuid: "9a4148a5-6f3d-460e-b832-89db9fdf2e40", firstname: "test", lastname: "user", phone: "0123456789", email: "member@example.test", password: "stored-hash", role: "User" };

function setup(intent, { duplicate = false, verified = false } = {}) {
  const event = { cookies: {}, options: {}, headers: {}, query: {} };
  const url = new URL(auth.startLineAuth(event, config, intent, false));
  event.query = { code: "one-time-code", state: url.searchParams.get("state") };
  const stateCookie = event.cookies.line_auth_state;
  const nonce = url.searchParams.get("nonce");
  let tokenCalls = 0;
  globalThis.$fetch = async (endpoint) => {
    if (endpoint.endsWith("/token")) {
      if (++tokenCalls > 1) throw new Error("authorization code already used");
      return { id_token: "test-only-id-token" };
    }
    return { sub: lineId, nonce };
  };
  globalThis.__lineCallbackTestDb = {
    query: async (sql, params) => {
      assert.deepEqual(params, ["provider-1", lineId]);
      if (intent === "register") return { rowCount: duplicate ? 1 : 0, rows: [] };
      assert.match(sql, /line_login_verified_at IS NOT NULL/);
      assert.match(sql, /line_is_connected = TRUE/);
      assert.match(sql, /l\.deleted_at IS NULL/);
      assert.match(sql, /u\.deleted_at IS NULL/);
      assert.match(sql, /u\.uuid::text = l\.line_user/);
      return { rowCount: verified ? 1 : 0, rows: verified ? [user] : [] };
    },
  };
  return { event, stateCookie };
}

await test("registration with an existing LINE link warns without creating a session", async () => {
  const { event } = setup("register", { duplicate: true });
  assert.equal(await callback(event), "/auth/line?result=duplicate");
  assert.equal(event.cookies.user_token, undefined);
  assert.equal(event.cookies.line_signup_pending, undefined);
  assert.equal(event.headers["Cache-Control"], "no-store");
});

await test("new registration gets short-lived pending proof but no session", async () => {
  const { event } = setup("register");
  assert.equal(await callback(event), "/auth/line?result=register");
  assert.equal(event.cookies.user_token, undefined);
  assert.equal(auth.getLineSignup(event, config).lineUserId, lineId);
});

await test("unverified LINE link cannot log in", async () => {
  const { event } = setup("login");
  assert.equal(await callback(event), "/auth/line?result=unlinked");
  assert.equal(event.cookies.user_token, undefined);
});

await test("verified active LINE link issues a secure session and rejects replayed code", async () => {
  const { event, stateCookie } = setup("login", { verified: true });
  assert.equal(await callback(event), "/auth/line?result=login");
  assert.ok(event.cookies.user_token);
  assert.equal(event.options.user_token.httpOnly, true);
  assert.equal(event.options.user_token.sameSite, "lax");
  delete event.cookies.user_token;
  event.cookies.line_auth_state = stateCookie;
  assert.equal(await callback(event), "/auth/line?result=error");
  assert.equal(event.cookies.user_token, undefined);
});

if (previousSecret === undefined) delete process.env.JWT_SECRET;
else process.env.JWT_SECRET = previousSecret;
