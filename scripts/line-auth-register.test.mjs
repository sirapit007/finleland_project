import assert from "node:assert/strict";
import { test } from "node:test";
import { build } from "esbuild";

const output = await build({
  entryPoints: ["server/api/auth/register.post.ts"],
  bundle: true, format: "esm", platform: "node", write: false, logLevel: "silent",
  alias: { "@@": process.cwd() },
  plugins: [{
    name: "mock-registration-dependencies",
    setup(build) {
      build.onResolve({ filter: /server\/utils\/(db|coupons|password)$/ }, (args) => ({
        path: args.path.split("/").pop(), namespace: "mock",
      }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, (args) => ({
        contents: {
          db: "export const useDb = () => globalThis.__lineRegisterTestDb",
          coupons: "export const grantSignupCoupons = async (client, uuid) => { globalThis.__lineRegisterCouponUser = uuid }",
          password: "export const hashPassword = async () => 'test-password-hash'",
        }[args.path],
        loader: "js",
      }));
    },
  }],
});
globalThis.defineEventHandler = (handler) => handler;
globalThis.readBody = async (event) => event.body;
globalThis.getCookie = (event, name) => event.cookies[name];
globalThis.setCookie = (event, name, value, options) => { event.cookies[name] = value; event.options[name] = options; };
globalThis.deleteCookie = (event, name) => { delete event.cookies[name]; };
globalThis.createError = ({ statusCode, statusMessage }) => Object.assign(new Error(statusMessage), { statusCode, statusMessage });
globalThis.useRuntimeConfig = () => ({
  lineLoginChannelId: "12345", lineLoginChannelSecret: "test-only-channel-secret",
  lineLoginCallbackUrl: "https://example.test/api/user/line-accounts/callback",
  lineProviderId: "provider-1", lineStateSecret: "test-only-secret",
});
const register = (await import(`data:text/javascript;base64,${Buffer.from(output.outputFiles[0].contents).toString("base64")}`)).default;
const helperOutput = await build({
  entryPoints: ["server/utils/lineAuth.ts"], bundle: true, format: "esm", platform: "node", write: false, logLevel: "silent",
});
const auth = await import(`data:text/javascript;base64,${Buffer.from(helperOutput.outputFiles[0].contents).toString("base64")}`);
const config = { channelId: "12345", channelSecret: "test-only-channel-secret", callbackUrl: "https://example.test/api/user/line-accounts/callback", providerId: "provider-1", stateSecret: "test-only-secret" };
const previousSecret = process.env.JWT_SECRET;
process.env.JWT_SECRET = "test-only-jwt-secret";
const lineId = `U${"a".repeat(32)}`;
const user = { id: 7, uuid: "9a4148a5-6f3d-460e-b832-89db9fdf2e40", firstname: "test", lastname: "user", phone: "0123456789", email: "member@example.test", role: "User" };
const challengeId = "b210c080-e1f0-4458-a5db-a83f5e5cb8e3";

function setup({ consumed = false, duplicate = false, conflict = false, pending = true, usedProofs = new Set() } = {}) {
  const event = { cookies: {}, options: {}, body: { firstname: user.firstname, lastname: user.lastname, phone: user.phone, email: user.email, password: "password", challengeId, lineSignup: true } };
  if (pending) auth.setLineSignup(event, config, { sub: lineId });
  const calls = [];
  let candidateProof = null;
  globalThis.__lineRegisterCouponUser = null;
  globalThis.__lineRegisterTestDb = {
    connect: async () => ({
      query: async (sql, params = []) => {
        calls.push(sql);
        if (sql.includes("UPDATE tb_otp_challenges") && params[1]) {
          if (usedProofs.has(params[1])) throw Object.assign(new Error("proof used"), { code: "23505", constraint: "tb_otp_challenges_line_signup_proof_unique" });
          candidateProof = params[1];
        }
        if (sql === "COMMIT" && candidateProof) usedProofs.add(candidateProof);
        if (sql.includes("FROM tb_otp_challenges")) return { rows: [{ uuid: params[0], phone: user.phone, email: user.email, expires_at: new Date(Date.now() + 60000), verified_at: new Date(), consumed_at: consumed ? new Date() : null }] };
        if (sql.includes("FROM tb_users")) return { rowCount: 0, rows: [] };
        if (sql.includes("SELECT 1 FROM tb_user_line_accounts")) return { rowCount: duplicate ? 1 : 0, rows: [] };
        if (sql.includes("INSERT INTO tb_users")) return { rowCount: 1, rows: [user] };
        if (sql.includes("INSERT INTO tb_user_line_accounts")) {
          assert.equal(params[0], user.uuid);
          assert.deepEqual(params.slice(1, 3), [config.providerId, lineId]);
          assert.match(sql, /line_login_verified_at/);
          if (conflict) throw Object.assign(new Error("duplicate"), { code: "23505", constraint: "tb_user_line_accounts_active_identity_unique" });
        }
        return { rowCount: 1, rows: [] };
      },
      release: () => {},
    }),
  };
  return { event, calls };
}

await test("registration commits user, verified LINE and OTP together", async () => {
  const { event, calls } = setup();
  const result = await register(event);
  assert.equal(result.user.uuid, user.uuid);
  assert.ok(calls.includes("COMMIT"));
  assert.ok(calls.some((sql) => sql.includes("INSERT INTO tb_user_line_accounts")));
  assert.ok(calls.some((sql) => sql.includes("UPDATE tb_otp_challenges")));
  assert.equal(globalThis.__lineRegisterCouponUser, user.uuid);
  assert.ok(event.cookies.user_token);
  assert.equal(event.cookies.line_signup_pending, undefined);
});

await test("missing or expired LINE proof is rejected before database writes", async () => {
  const { event } = setup({ pending: false });
  await assert.rejects(register(event), (error) => error.statusCode === 403);
  assert.equal(event.cookies.user_token, undefined);
});

await test("existing LINE link and concurrent identity conflict roll back", async () => {
  for (const options of [{ duplicate: true }, { conflict: true }]) {
    const { event, calls } = setup(options);
    await assert.rejects(register(event), (error) => error.statusCode === 409 && error.statusMessage === "LINE นี้เชื่อมต่อบัญชีอื่นอยู่แล้ว");
    assert.ok(calls.includes("ROLLBACK"));
    assert.ok(!calls.includes("COMMIT"));
    assert.equal(event.cookies.user_token, undefined);
  }
});

await test("consumed OTP cannot be replayed for LINE signup", async () => {
  const { event, calls } = setup({ consumed: true });
  await assert.rejects(register(event), (error) => error.statusCode === 403);
  assert.ok(calls.includes("ROLLBACK"));
  assert.ok(!calls.some((sql) => sql.includes("INSERT INTO tb_users")));
  assert.equal(event.cookies.user_token, undefined);
});

await test("a copied LINE proof cannot be replayed after unlink with a new OTP", async () => {
  const usedProofs = new Set();
  const first = setup({ usedProofs });
  const copiedProof = first.event.cookies.line_signup_pending;
  await register(first.event);
  assert.equal(usedProofs.size, 1);

  // The original LINE link was removed; a different verified OTP is presented.
  const second = setup({ usedProofs });
  second.event.cookies.line_signup_pending = copiedProof;
  second.event.body.challengeId = "b6b125f1-f632-4883-b5c3-8ee4fc180539";
  await assert.rejects(register(second.event), (error) => error.statusCode === 403);
  assert.ok(second.calls.includes("ROLLBACK"));
  assert.ok(!second.calls.includes("COMMIT"));
  assert.equal(second.event.cookies.user_token, undefined);
});

if (previousSecret === undefined) delete process.env.JWT_SECRET;
else process.env.JWT_SECRET = previousSecret;

