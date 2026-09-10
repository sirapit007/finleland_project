import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { build } from "esbuild";
import pg from "pg";
import { readFile, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { test } from "node:test";
import { createError } from "h3";

if (!process.env.DB_HOST)
  throw new Error(
    "Run with node --env-file=.env --test scripts/coupon-api.test.mjs",
  );
const schema = `coupon_api_test_${randomUUID().replaceAll("-", "")}`;
assert.match(schema, /^coupon_api_test_[a-f0-9]{32}$/);
const config = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === "false" ? false : { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
};
const pool = new pg.Pool({ ...config, max: 3 });
const scopedClient = async () => {
  const client = await pool.connect();
  return {
    query: async (...args) => {
      const result = await client.query(...args);
      if (args[0] === "BEGIN")
        await client.query(`SET LOCAL search_path TO ${schema}, public`);
      return result;
    },
    release: () => client.release(),
  };
};
const db = {
  connect: scopedClient,
  query: async (...args) => {
    const client = await scopedClient();
    try {
      await client.query("BEGIN");
      const result = await client.query(...args);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },
};
globalThis.__couponTestDb = db;
globalThis.defineEventHandler = (fn) => fn;
globalThis.readBody = async (event) => event.body;
globalThis.getRouterParam = (event, key) => event.params?.[key];
globalThis.getQuery = (event) => event.query || {};
globalThis.setHeader = () => {};
const routes = {
  create: "index.post",
  list: "index.get",
  update: "[uuid].put",
  detail: "[uuid].get",
  remove: "[uuid].delete",
  claim: "[uuid]/claim.post",
  distribute: "[uuid]/distribute.post",
  quote: "quote.post",
};
const bundlePath = resolve("tmp", `.coupon-api-${randomUUID()}.mjs`);
await build({
  stdin: {
    contents:
      Object.entries(routes)
        .map(
          ([key, file]) =>
            `export {default as ${key}} from './server/api/coupon/${file}.ts';`,
        )
        .join("\n") +
      `\nexport {default as owned} from './server/api/user/coupons/index.get.ts';`,
    resolveDir: resolve("."),
  },
  bundle: true,
  platform: "node",
  format: "esm",
  packages: "external",
  alias: { "@@": resolve(".") },
  outfile: bundlePath,
  logLevel: "silent",
  plugins: [
    {
      name: "coupon-test-session-db",
      setup(build) {
        build.onResolve(
          { filter: /(server\/utils\/(session|db)|\.\/db)$/ },
          (args) => ({
            path: args.path.endsWith("/db") ? "db" : "session",
            namespace: "coupon-test-mock",
          }),
        );
        build.onLoad(
          { filter: /.*/, namespace: "coupon-test-mock" },
          (args) => ({
            loader: "js",
            resolveDir: resolve("."),
            contents:
              args.path === "db"
                ? `export function useDb(){return globalThis.__couponTestDb}`
                : `import {createError} from 'h3'; export async function requireCurrentAdmin(event){if(!event.admin)throw createError({statusCode:401});return event.admin;}export async function requireCurrentUser(event){if(!event.user)throw createError({statusCode:401});return event.user;}`,
          }),
        );
      },
    },
  ],
});
const api = await import(pathToFileURL(bundlePath).href);
await unlink(bundlePath);
const manager = await pool.connect();
let admin, user, user2, created;
const input = {
  coupon_name: "API คูปอง",
  coupon_discount_type: "amount",
  coupon_discount_value: 50,
  coupon_min_purchase_amount: 500,
  coupon_usage_limit: 1,
  coupon_recipient_limit: 2,
  coupon_distribution_method: "claim",
  coupon_status: "draft",
  coupon_expires_at: null,
};
try {
  await manager.query("BEGIN");
  await manager.query(`CREATE SCHEMA ${schema}`);
  await manager.query(`SET LOCAL search_path TO ${schema}, public`);
  await manager.query(`CREATE TABLE tb_users(id BIGSERIAL PRIMARY KEY,uuid UUID DEFAULT gen_random_uuid(),role TEXT,firstname TEXT,lastname TEXT,email TEXT,created_at TIMESTAMPTZ DEFAULT clock_timestamp(),deleted_at TIMESTAMPTZ);
    CREATE TABLE tb_shopping_orders(id BIGSERIAL PRIMARY KEY,uuid UUID DEFAULT gen_random_uuid() UNIQUE,order_number TEXT,order_status TEXT,order_payment_status TEXT);
    CREATE TABLE tb_shopping_basket(id BIGSERIAL PRIMARY KEY,basket_product TEXT,basket_quantity INTEGER,created_by TEXT,deleted_at TIMESTAMPTZ,basket_expire TIMESTAMPTZ DEFAULT NOW()+INTERVAL '1 day');
    CREATE TABLE vw_master_products(uuid UUID,product_selling_price NUMERIC);
    CREATE TABLE tb_event_promotions(id BIGSERIAL PRIMARY KEY,promotion_product TEXT,promotion_is_active BOOLEAN,deleted_at TIMESTAMPTZ,promotion_start_date DATE,promotion_end_date DATE,promotion_discounted_price NUMERIC,promotion_bundle_price NUMERIC,promotion_min_quantity INTEGER,promotion_min_purchase_amount NUMERIC);`);
  await manager.query(
    await readFile(
      new URL("../database/tb_event_coupons.sql", import.meta.url),
      "utf8",
    ),
  );
  await manager.query("COMMIT");
  const members = (
    await db.query(
      "INSERT INTO tb_users(role,firstname,email) VALUES ('Admin','Admin','admin@example.invalid'),('User','Member','member@example.invalid'),('User','Second','second@example.invalid') RETURNING uuid,role",
    )
  ).rows;
  [admin, user, user2] = members;
  await test("admin coupon endpoints require admin and customer endpoints require a member session", async () => {
    await assert.rejects(
      api.create({ body: input }),
      (error) => error.statusCode === 401,
    );
    await assert.rejects(api.list({}), (error) => error.statusCode === 401);
    await assert.rejects(api.owned({}), (error) => error.statusCode === 401);
    await assert.rejects(
      api.claim({ params: { uuid: randomUUID() } }),
      (error) => error.statusCode === 401,
    );
  });
  await test("actual admin CRUD SQL accepts draft, activation, numeric values, and parameterized search", async () => {
    created = (await api.create({ admin, body: input })).row;
    assert.equal(created.coupon_status, "draft");
    assert.equal(created.coupon_activated_at, null);
    const active = (
      await api.update({
        admin,
        params: { uuid: created.uuid },
        body: { coupon_status: "active" },
      })
    ).row;
    assert.equal(active.coupon_status, "active");
    assert.ok(active.coupon_activated_at);
    assert.equal(Number(active.coupon_discount_value), 50);
    const listed = await api.list({ admin, query: { q: "API", pageSize: 10 } });
    assert.equal(listed.total, 1);
    assert.equal(
      (await api.list({ admin, query: { q: "' OR 1=1 --" } })).total,
      0,
    );
    await assert.rejects(
      api.remove({ admin, params: { uuid: created.uuid } }),
      (error) => error.statusCode === 409,
    );
  });
  await test("claim reload moves coupon to ownership, remains unique, and cannot use below minimum", async () => {
    const initial = await api.owned({ user });
    assert.equal(initial.claimableCount, 1);
    assert.equal(initial.eligibleCount, 0);
    const claimed = await api.claim({ user, params: { uuid: created.uuid } });
    assert.equal(claimed.alreadyClaimed, false);
    const again = await api.claim({ user, params: { uuid: created.uuid } });
    assert.equal(again.alreadyClaimed, true);
    assert.equal(again.row.uuid, claimed.row.uuid);
    const owned = await api.owned({ user });
    assert.equal(owned.rows.length, 1);
    assert.equal(owned.claimableRows[0].claimed, true);
    assert.equal(owned.claimableCount, 0);
    await assert.rejects(
      api.quote({ user, body: { user_coupon_uuid: claimed.row.uuid } }),
      (error) => error.statusCode === 409,
    );
    const product = randomUUID();
    await db.query("INSERT INTO vw_master_products VALUES($1,500)", [product]);
    await db.query(
      "INSERT INTO tb_shopping_basket(basket_product,basket_quantity,created_by) VALUES($1,1,$2)",
      [product, user.uuid],
    );
    const quote = await api.quote({
      user,
      body: { user_coupon_uuid: claimed.row.uuid },
    });
    assert.equal(quote.row.discount_amount, 50);
    assert.equal(quote.basket.merchandiseTotal, 500);
    assert.equal((await api.owned({ user })).eligibleCount, 1);
    assert.equal(
      (
        await db.query(
          "SELECT user_coupon_used_count FROM tb_user_coupons WHERE uuid=$1",
          [claimed.row.uuid],
        )
      ).rows[0].user_coupon_used_count,
      0,
    );
  });
  await test("issued coupon can pause/edit description while numeric terms remain locked; holder keeps benefit", async () => {
    const paused = (
      await api.update({
        admin,
        params: { uuid: created.uuid },
        body: { coupon_status: "paused", coupon_description: "หยุดแจกเพิ่ม" },
      })
    ).row;
    assert.equal(paused.coupon_status, "paused");
    assert.equal(Number(paused.coupon_min_purchase_amount), 500);
    await assert.rejects(
      api.update({
        admin,
        params: { uuid: created.uuid },
        body: { coupon_discount_value: 60 },
      }),
      (error) => error.statusCode === 409,
    );
    assert.equal((await api.owned({ user })).eligibleCount, 1);
    await assert.rejects(
      api.claim({ user: user2, params: { uuid: created.uuid } }),
      (error) => error.statusCode === 409,
    );
    const detail = await api.detail({
      admin,
      params: { uuid: created.uuid },
      query: { pageSize: 1 },
    });
    assert.equal(detail.holderTotal, 1);
    assert.equal(detail.holders[0].user_coupon_user, user.uuid);
  });
  await test("manual and random distribution are exclusive, bounded, and report newly issued recipients", async () => {
    const manual = (
      await api.create({
        admin,
        body: {
          ...input,
          coupon_distribution_method: "manual",
          coupon_status: "active",
        },
      })
    ).row;
    assert.equal(
      (
        await api.distribute({
          admin,
          params: { uuid: manual.uuid },
          body: { userUuids: [user.uuid, user2.uuid] },
        })
      ).count,
      2,
    );
    assert.equal(
      (
        await api.distribute({
          admin,
          params: { uuid: manual.uuid },
          body: { userUuids: [user.uuid] },
        })
      ).count,
      0,
    );
    await assert.rejects(
      api.distribute({
        admin,
        params: { uuid: manual.uuid },
        body: { userUuids: [admin.uuid] },
      }),
    );
    const random = (
      await api.create({
        admin,
        body: {
          ...input,
          coupon_distribution_method: "random",
          coupon_status: "active",
        },
      })
    ).row;
    assert.equal(
      (
        await api.distribute({
          admin,
          params: { uuid: random.uuid },
          body: { count: 2 },
        })
      ).count,
      2,
    );
    await assert.rejects(
      api.distribute({
        admin,
        params: { uuid: random.uuid },
        body: { count: 1 },
      }),
      (error) => error.statusCode === 409,
    );
    const lateUser = (
      await db.query(
        "INSERT INTO tb_users(role,firstname) VALUES('User','Late') RETURNING uuid",
      )
    ).rows[0];
    await assert.rejects(
      api.claim({ user: lateUser, params: { uuid: random.uuid } }),
      (error) => error.statusCode === 409,
    );
  });
  await test("draft deletion retains audit and removes coupon from active listing", async () => {
    const draft = (
      await api.create({
        admin,
        body: { ...input, coupon_name: "Deleted draft" },
      })
    ).row;
    const deleted = (await api.remove({ admin, params: { uuid: draft.uuid } }))
      .row;
    assert.ok(deleted.deleted_at);
    assert.equal(deleted.deleted_by, admin.uuid);
    assert.equal(
      (await api.list({ admin, query: { q: "Deleted draft" } })).total,
      0,
    );
    assert.equal(
      (
        await api.list({
          admin,
          query: { q: "Deleted draft", deleted: "true" },
        })
      ).total,
      1,
    );
  });
} finally {
  await manager.query("ROLLBACK");
  await manager.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
  manager.release();
  await pool.end();
}
