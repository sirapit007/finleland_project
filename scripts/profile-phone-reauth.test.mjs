import assert from "node:assert/strict";
import { test } from "node:test";
import { build } from "esbuild";

const output = await build({
  entryPoints: ["server/api/user/[uuid].put.ts"],
  bundle: true, format: "esm", platform: "node", write: false, logLevel: "silent",
  alias: { "@@": process.cwd() },
  plugins: [{
    name: "mock-profile-dependencies",
    setup(build) {
      build.onResolve({ filter: /server\/utils\/(db|password|session)$/ }, (args) => ({
        path: args.path.split("/").pop(), namespace: "mock",
      }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, (args) => ({
        contents: {
          db: "export const useDb = () => globalThis.__profileTestDb",
          password: "export const hashPassword = async () => 'new-hash'; export const verifyPassword = async (password, hash) => ({ valid: password === 'correct-password' && hash === 'old-hash' })",
          session: "export const requireCurrentActor = async () => globalThis.__profileTestActor",
        }[args.path],
        loader: "js",
      }));
    },
  }],
});
globalThis.defineEventHandler = (handler) => handler;
globalThis.readBody = async (event) => event.body;
globalThis.getRouterParam = (event) => event.uuid;
globalThis.createError = ({ statusCode, statusMessage }) => Object.assign(new Error(statusMessage), { statusCode, statusMessage });
const updateProfile = (await import(`data:text/javascript;base64,${Buffer.from(output.outputFiles[0].contents).toString("base64")}`)).default;

function setup({ phone = "0812345678", currentPassword, admin = false, uuid = "user-1" } = {}) {
  const calls = [];
  globalThis.__profileTestActor = { isAdmin: admin, user: { uuid: "user-1" } };
  globalThis.__profileTestDb = { connect: async () => ({
    query: async (sql) => {
      calls.push(sql);
      if (sql.includes("SELECT phone, password")) return { rows: [{ phone: "0812345678", password: "old-hash" }] };
      if (sql.includes("SELECT id")) return { rows: [] };
      if (sql.includes("UPDATE tb_users")) return { rows: [{ uuid, phone }] };
      return { rows: [] };
    },
    release() {},
  }) };
  return { event: { uuid, body: { firstname: "A", lastname: "B", phone, email: "a@example.test", currentPassword } }, calls };
}

await test("unchanged phone needs no password", async () => {
  const { event, calls } = setup();
  assert.equal((await updateProfile(event)).row.phone, "0812345678");
  assert.ok(calls.includes("COMMIT"));
});

await test("changed phone rejects missing and incorrect passwords before updating", async () => {
  for (const currentPassword of [undefined, "wrong-password"]) {
    const { event, calls } = setup({ phone: "0898765432", currentPassword });
    await assert.rejects(updateProfile(event), (error) => error.statusCode === 403);
    assert.ok(calls.includes("ROLLBACK"));
    assert.ok(!calls.some((sql) => sql.includes("UPDATE tb_users")));
  }
});

await test("changed phone accepts current password", async () => {
  const { event, calls } = setup({ phone: "0898765432", currentPassword: "correct-password" });
  assert.equal((await updateProfile(event)).row.phone, "0898765432");
  assert.ok(calls.includes("COMMIT"));
});

await test("admin phone edits do not require the target user's password", async () => {
  const { event, calls } = setup({ phone: "0898765432", admin: true });
  assert.equal((await updateProfile(event)).row.phone, "0898765432");
  assert.ok(!calls.some((sql) => sql.includes("SELECT phone, password")));
});

await test("a user cannot edit another account", async () => {
  const { event, calls } = setup({ uuid: "user-2" });
  await assert.rejects(updateProfile(event), (error) => error.statusCode === 403);
  assert.equal(calls.length, 0);
});
