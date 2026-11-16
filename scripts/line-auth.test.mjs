import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { build } from "esbuild";

const output = await build({
  entryPoints: ["server/utils/lineAuth.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
  logLevel: "silent",
});
const auth = await import(`data:text/javascript;base64,${Buffer.from(output.outputFiles[0].contents).toString("base64")}`);

globalThis.setCookie = (event, name, value, options) => {
  event.cookies[name] = value;
  event.options[name] = options;
};
globalThis.getCookie = (event, name) => event.cookies[name];
globalThis.deleteCookie = (event, name) => delete event.cookies[name];
globalThis.useRuntimeConfig = () => ({ lineLoginEmailEnabled: false });

const config = {
  channelId: "12345",
  callbackUrl: "https://example.test/api/user/line-accounts/callback",
  providerId: "provider-1",
  stateSecret: "test-only-secret",
};
const newEvent = () => ({ cookies: {}, options: {} });

await test("OAuth state is bound to the browser, cleared on use, and uses PKCE", () => {
  const event = newEvent();
  const url = new URL(auth.startLineAuth(event, config, "register", true));
  const state = url.searchParams.get("state");
  assert.match(state, /^[a-f0-9]+$/);
  assert.equal(url.searchParams.get("initial_amr_display"), "lineqr");
  assert.equal(url.searchParams.get("scope"), "openid profile");
  assert.equal(event.options.line_auth_state.httpOnly, true);
  assert.equal(event.options.line_auth_state.sameSite, "lax");
  const payload = auth.consumeLineAuthState(event, config.stateSecret, state);
  assert.equal(payload.intent, "register");
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
  assert.equal(url.searchParams.get("code_challenge"), createHash("sha256").update(payload.verifier).digest("base64url"));
  assert.equal(auth.consumeLineAuthState(event, config.stateSecret, state), null);
  const other = newEvent();
  assert.equal(auth.consumeLineAuthState(other, config.stateSecret, state), null);
});

await test("tampered, expired, or mismatched state never authenticates", () => {
  const event = newEvent();
  const state = new URL(auth.startLineAuth(event, config, "login", false)).searchParams.get("state");
  const cookie = event.cookies.line_auth_state;
  const [body, signature] = cookie.split(".");
  event.cookies.line_auth_state = `${body}.${signature[0] === "A" ? "B" : "A"}${signature.slice(1)}`;
  assert.equal(auth.consumeLineAuthState(event, config.stateSecret, state), null);
  assert.equal(auth.readLinePayload(auth.signLinePayload({ expiresAt: Date.now() - 1 }, config.stateSecret), config.stateSecret), null);
  auth.startLineAuth(event, config, "login", false);
  assert.equal(auth.consumeLineAuthState(event, config.stateSecret, "wrong-state"), null);
  assert.equal(auth.consumeLineAuthState(event, config.stateSecret, state), null);
});

await test("pending signup accepts only an unexpired verified identity for this provider", () => {
  const event = newEvent();
  auth.setLineSignup(event, config, { sub: `U${"a".repeat(32)}`, email: "member@example.test" });
  assert.equal(auth.getLineSignup(event, config).email, "member@example.test");
  assert.equal(auth.getLineSignup(event, { ...config, providerId: "other" }), null);
  event.cookies.line_signup_pending = auth.signLinePayload({ kind: "signup", providerId: config.providerId, lineUserId: `U${"a".repeat(32)}`, expiresAt: Date.now() - 1 }, config.stateSecret);
  assert.equal(auth.getLineSignup(event, config), null);
  auth.clearLineSignup(event);
  assert.equal(auth.getLineSignup(event, config), null);
});
