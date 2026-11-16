import assert from "node:assert/strict";
import { test } from "node:test";
import { build } from "esbuild";
import { randomUUID } from "node:crypto";

async function loadHandler(entry) {
  const built = await build({
    entryPoints: [entry], bundle: true, format: "esm", platform: "node", write: false, logLevel: "silent",
    alias: { "@@": process.cwd() },
    plugins: [{ name: "test-otp", setup(build) {
      build.onResolve({ filter: /server\/utils\/db$/ }, () => ({ path: "db", namespace: "mock" }));
      build.onResolve({ filter: /server\/utils\/thaiBulkSmsOtp$/ }, () => ({ path: "provider", namespace: "mock" }));
      build.onLoad({ filter: /db/, namespace: "mock" }, () => ({ contents: "export const useDb = () => globalThis.__resetDb", loader: "js" }));
      build.onLoad({ filter: /provider/, namespace: "mock" }, () => ({ contents: `
        export class OtpProviderError extends Error {}
        export const requestThaiBulkSmsOtp = (phone) => globalThis.__otpRequest(phone);
        export const verifyThaiBulkSmsOtp = (token, pin) => globalThis.__otpVerify(token, pin);
      `, loader: "js" }));
    } }],
  });
  return (await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].contents).toString("base64")}`)).default;
}
globalThis.defineEventHandler = (handler) => handler;
globalThis.readBody = (event) => event.body;
globalThis.getRequestIP = () => "127.0.0.1";
globalThis.setResponseHeader = (event, key, value) => { event.headers[key] = value; };
globalThis.setCookie = (event, name, value, options) => { event.cookies[name] = value; event.options[name] = options; };
globalThis.getCookie = (event, name) => event.cookies[name];
globalThis.deleteCookie = (event, name) => { delete event.cookies[name]; };
globalThis.createError = (details) => Object.assign(new Error(details.statusMessage), details);
globalThis.useRuntimeConfig = () => ({});
const request = await loadHandler("server/api/auth/password-reset/request.post.ts");
const verify = await loadHandler("server/api/auth/password-reset/verify.post.ts");
const complete = await loadHandler("server/api/auth/password-reset/complete.post.ts");
const secret = process.env.JWT_SECRET;
process.env.JWT_SECRET = "password-reset-test-secret";

function setup(users = [{ uuid: randomUUID(), phone: "0812345678", password: "old" }]) {
  const state = { users, challenges: new Map(), sent: [], attempts: 0, latest: null, writes: 0 };
  globalThis.__otpRequest = async (phone) => { state.sent.push(phone); return { token: "provider-token", refno: "ABCD" }; };
  globalThis.__otpVerify = async (_token, pin) => pin === "123456";
  globalThis.__resetDb = { connect: async () => ({ release() {}, query: async (sql, args = []) => {
    if (/^(BEGIN|COMMIT|ROLLBACK)$/.test(sql) || sql.includes("pg_advisory_xact_lock")) return { rows: [] };
    if (sql.includes("MAX(created_at)")) return { rows: [{ latest_phone_request: state.latest, phone_request_count: state.challenges.size, ip_request_count: state.challenges.size }] };
    if (sql.includes("SELECT uuid, role FROM tb_users")) {
      if (sql.includes("FOR UPDATE") && state.expireWhenAccountLocked) {
        for (const challenge of state.challenges.values()) challenge.expires_at = new Date(Date.now() - 1);
      }
      return { rows: state.users.filter((u) => u.phone === args[0] && !u.deleted).slice(0, 2) };
    }
    if (sql.includes("INSERT INTO tb_otp_challenges")) {
      const uuid = randomUUID();
      state.challenges.set(uuid, { phone: args[0], provider_token: args[1], attempts: 0, expires_at: new Date(Date.now() + 300000), verified_at: null, consumed_at: null, purpose: "password_reset" });
      return { rows: [{ uuid }] };
    }
    if (sql.includes("SELECT phone, provider_token") || sql.includes("SELECT phone, expires_at")) {
      const challenge = state.challenges.get(args[0]);
      return { rows: challenge?.purpose === "password_reset" ? [challenge] : [] };
    }
    if (sql.includes("SET attempts =")) { const c = state.challenges.get(args[0]); c.attempts = args[1]; if (args[1] >= args[2]) c.consumed_at = new Date(); return { rows: [] }; }
    if (sql.includes("SET verified_at = NOW()")) { state.challenges.get(args[0]).verified_at = new Date(); return { rows: [] }; }
    if (sql.includes("SET consumed_at = clock_timestamp()")) {
      const c = state.challenges.get(args[0]);
      if (new Date(c.expires_at).getTime() <= Date.now()) return { rows: [], rowCount: 0 };
      c.consumed_at = new Date();
      return { rows: [{ uuid: args[0] }], rowCount: 1 };
    }
    if (sql.includes("UPDATE tb_otp_challenges SET consumed_at")) { for (const c of state.challenges.values()) if (c.phone === args[0]) c.consumed_at = new Date(); return { rows: [] }; }
    if (sql.includes("UPDATE tb_users SET password")) { const u = state.users.find((row) => row.uuid === args[1] && row.phone === args[2] && !row.deleted); if (u) { u.password = args[0]; state.writes++; } return { rows: [] }; }
    throw new Error(`Unexpected SQL: ${sql}`);
  } }) };
  const event = { body: { phone: "0812345678" }, cookies: {}, options: {}, headers: {} };
  return { state, event };
}
async function start(event) {
  const result = await request(event);
  event.body = { challengeId: result.challengeId, phone: "0812345678", otp: "123456", password: "new-pass-123" };
  return result;
}
async function verifyOtp(event) {
  assert.deepEqual(await verify(event), { verified: true });
  assert.equal(event.options.password_reset_verified.httpOnly, true);
  assert.equal(event.options.password_reset_verified.sameSite, "lax");
}

await test("verified OTP changes password once and binds a cookie to the challenge", async () => {
  const { state, event } = setup();
  const challenge = await start(event);
  assert.equal(event.headers["Cache-Control"], "no-store");
  assert.equal(event.options.password_reset_binding.httpOnly, true);
  assert.equal(event.options.password_reset_binding.path, "/api/auth/password-reset");
  const binding = event.cookies.password_reset_binding;
  await assert.rejects(() => complete(event), { statusCode: 403 });
  await verifyOtp(event);
  const proof = event.cookies.password_reset_verified;
  assert.deepEqual(await complete(event), { success: true });
  assert.equal(state.writes, 1);
  assert.match(state.users[0].password, /^scrypt\$v1\$/);
  event.cookies.password_reset_binding = binding;
  event.cookies.password_reset_verified = proof;
  await assert.rejects(() => complete(event), { statusCode: 400 });
  assert.equal(state.writes, 1);
  assert.ok(state.challenges.get(challenge.challengeId).consumed_at);
});

await test("unknown phone receives identical response shape and a real OTP without account disclosure", async () => {
  const { state, event } = setup([]);
  const response = await start(event);
  assert.deepEqual(Object.keys(response).sort(), ["challengeId", "expiresIn", "otpLength", "refno", "resendAfter"].sort());
  assert.deepEqual(state.sent, ["0812345678"]);
  assert.equal(event.cookies.password_reset_binding.length, 64);
  await verifyOtp(event);
  assert.deepEqual(await complete(event), { success: true });
  assert.equal(state.writes, 0);
});

await test("OTP cannot reset a reassigned phone or a phone shared by multiple accounts", async () => {
  for (const change of ["reassign", "duplicate"]) {
    const { state, event } = setup();
    await start(event);
    await verifyOtp(event);
    if (change === "reassign") state.users[0] = { uuid: randomUUID(), phone: "0812345678", password: "other" };
    else state.users.push({ uuid: randomUUID(), phone: "0812345678", password: "other" });
    assert.deepEqual(await complete(event), { success: true });
    assert.equal(state.writes, 0);
  }
});

await test("administrators cannot reset via SMS even if their role changes during the flow", async () => {
  for (const roles of [["Admin", "Admin"], ["Admin", "User"], ["User", "Admin"]]) {
    const { state, event } = setup([{ uuid: randomUUID(), phone: "0812345678", password: "old", role: roles[0] }]);
    await start(event);
    await verifyOtp(event);
    state.users[0].role = roles[1];
    assert.deepEqual(await complete(event), { success: true });
    assert.equal(state.writes, 0);
  }
});

await test("incorrect OTP is rate-limited and never changes password", async () => {
  const { state, event } = setup();
  const result = await start(event);
  event.body.otp = "000000";
  for (let i = 0; i < 5; i++) await assert.rejects(() => verify(event), { statusCode: i === 4 ? 429 : 400 });
  assert.equal(state.challenges.get(result.challengeId).attempts, 5);
  assert.ok(state.challenges.get(result.challengeId).consumed_at);
  event.body.otp = "123456";
  await assert.rejects(() => verify(event), { statusCode: 400 });
  assert.equal(state.writes, 0);
});

await test("missing or substituted browser binding cannot change a password", async () => {
  for (const value of [undefined, "a".repeat(64)]) {
    const { state, event } = setup();
    await start(event);
    await verifyOtp(event);
    event.cookies.password_reset_binding = value;
    await assert.rejects(() => complete(event), { statusCode: 403 });
    assert.equal(state.writes, 0);
  }
});

await test("expired challenge and cooldown block further operations", async () => {
  const { state, event } = setup();
  const result = await start(event);
  state.challenges.get(result.challengeId).expires_at = new Date(Date.now() - 1);
  await assert.rejects(() => verify(event), { statusCode: 410 });
  state.latest = new Date();
  event.body = { phone: "0812345678" };
  await assert.rejects(() => request(event), { statusCode: 429 });
  assert.equal(state.sent.length, 1);
});

await test("verification proof is required and OTP cannot mint another proof", async () => {
  const { state, event } = setup();
  await start(event);
  await verifyOtp(event);
  const proof = event.cookies.password_reset_verified;
  await assert.rejects(() => verify(event), { statusCode: 400 });
  for (const value of [undefined, "a".repeat(64)]) {
    event.cookies.password_reset_verified = value;
    await assert.rejects(() => complete(event), { statusCode: 403 });
  }
  event.cookies.password_reset_verified = proof;
  assert.equal(state.writes, 0);
  assert.deepEqual(await complete(event), { success: true });
});

await test("verified proof expires with the challenge and is bound to the original challenge", async () => {
  const { state, event } = setup();
  const result = await start(event);
  await verifyOtp(event);
  const otherId = randomUUID();
  state.challenges.set(otherId, { ...state.challenges.get(result.challengeId) });
  event.body.challengeId = otherId;
  await assert.rejects(() => complete(event), { statusCode: 403 });
  event.body.challengeId = result.challengeId;
  state.challenges.get(result.challengeId).expires_at = new Date(Date.now() - 1);
  await assert.rejects(() => complete(event), { statusCode: 410 });
  assert.equal(state.writes, 0);
});

await test("completion fails if proof expires while waiting for the account lock", async () => {
  const { state, event } = setup();
  await start(event);
  await verifyOtp(event);
  state.expireWhenAccountLocked = true;
  await assert.rejects(() => complete(event), { statusCode: 410 });
  assert.equal(state.writes, 0);
});

await test("signup OTP challenge cannot be used to verify a reset", async () => {
  const { state, event } = setup();
  const result = await start(event);
  state.challenges.get(result.challengeId).purpose = "signup";
  await assert.rejects(() => verify(event), { statusCode: 400 });
  assert.equal(event.cookies.password_reset_verified, undefined);
});

await test("requesting another OTP invalidates old proof and challenge", async () => {
  const { state, event } = setup();
  const first = await start(event);
  await verifyOtp(event);
  const originalCookies = { ...event.cookies };
  event.body = { phone: "0812345678" };
  await request(event);
  assert.equal(event.cookies.password_reset_verified, undefined);
  assert.ok(state.challenges.get(first.challengeId).consumed_at);
  event.cookies = originalCookies;
  event.body = { challengeId: first.challengeId, phone: "0812345678", password: "new-pass-123" };
  await assert.rejects(() => complete(event), { statusCode: 400 });
  assert.equal(state.writes, 0);
});

if (secret === undefined) delete process.env.JWT_SECRET;
else process.env.JWT_SECRET = secret;
