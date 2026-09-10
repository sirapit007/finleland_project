import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile, unlink, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { test } from "node:test";
import { build } from "esbuild";
import pg from "pg";

const bundlePath = resolve("tmp", `.coupon-tests-${randomUUID()}.mjs`);
await mkdir(resolve("tmp"), { recursive: true });
await build({
  stdin: {
    contents: `export * from './server/utils/coupons.ts'; export * from './server/utils/couponRules.ts';`,
    resolveDir: resolve("."),
  },
  bundle: true,
  platform: "node",
  format: "esm",
  packages: "external",
  outfile: bundlePath,
  logLevel: "silent",
});
const core = await import(pathToFileURL(bundlePath).href);
await unlink(bundlePath);
const base = {
  coupon_name: "Test coupon",
  coupon_discount_type: "amount",
  coupon_discount_value: 50,
  coupon_min_purchase_amount: 500,
  coupon_min_quantity: 0,
  coupon_min_items: 0,
  coupon_usage_limit: 1,
  coupon_recipient_limit: 20,
  coupon_distribution_method: "claim",
  coupon_status: "active",
};
const basket = { merchandiseTotal: 500, totalQuantity: 5, distinctItems: 2 };

await test("coupon rules: after-promotion minimum, all conditions, unique items and discount caps", () => {
  assert.equal(core.evaluateCouponRules(base, basket).discount_amount, 50);
  assert.equal(
    core.evaluateCouponRules(base, { ...basket, merchandiseTotal: 499.99 })
      .eligible,
    false,
  );
  assert.equal(
    core.evaluateCouponRules({ ...base, coupon_min_quantity: 6 }, basket)
      .eligible,
    false,
  );
  assert.equal(
    core.evaluateCouponRules({ ...base, coupon_min_items: 3 }, basket).eligible,
    false,
  );
  assert.equal(
    core.evaluateCouponRules(
      {
        ...base,
        coupon_discount_type: "percent",
        coupon_discount_value: 15,
        coupon_max_discount: 60,
      },
      basket,
    ).discount_amount,
    60,
  );
  assert.equal(
    core.evaluateCouponRules(
      {
        ...base,
        coupon_discount_type: "percent",
        coupon_discount_value: 15,
        coupon_max_discount: null,
      },
      { ...basket, merchandiseTotal: 500.33 },
    ).discount_amount,
    75.05,
  );
  assert.equal(
    core.evaluateCouponRules({ ...base, coupon_discount_value: 800 }, basket)
      .discount_amount,
    500,
  );
  assert.equal(
    core.evaluateCouponRules(base, {
      merchandiseTotal: 0,
      totalQuantity: 0,
      distinctItems: 0,
    }).eligible,
    false,
  );
});
await test("validation locks issued terms, preserves partial updates and rejects malformed limits", () => {
  const current = {
    ...core.normalizeCouponInput(base),
    coupon_discount_value: "50.00",
    coupon_min_purchase_amount: "500.00",
    coupon_issued_count: 1,
  };
  assert.equal(
    core.normalizeCouponInput({ coupon_status: "paused" }, current)
      .coupon_discount_value,
    50,
  );
  assert.throws(
    () => core.normalizeCouponInput({ coupon_discount_value: 51 }, current),
    /แจกแล้ว/,
  );
  assert.throws(() =>
    core.normalizeCouponInput({ coupon_status: "draft" }, current),
  );
  assert.throws(() =>
    core.normalizeCouponInput({ ...base, coupon_usage_limit: 1.1 }),
  );
  assert.throws(() =>
    core.normalizeCouponInput({ ...base, coupon_recipient_limit: NaN }),
  );
  assert.throws(() =>
    core.normalizeCouponInput({
      ...base,
      coupon_discount_type: "percent",
      coupon_discount_value: 101,
    }),
  );
  assert.throws(() =>
    core.normalizeCouponInput({ ...base, coupon_expires_at: "2020-01-01" }),
  );
});

if (!process.env.DB_HOST) {
  await test(
    "database coupon lifecycle (set DB_* or use --env-file=.env)",
    { skip: true },
    () => {},
  );
} else {
  const schema = `coupon_test_${randomUUID().replaceAll("-", "")}`;
  assert.match(schema, /^coupon_test_[a-f0-9]{32}$/);
  const config = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === "false" ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  };
  const manager = new pg.Client(config);
  const rawPool = new pg.Pool({ ...config, max: 10 });
  const pool = {
    connect: () => rawPool.connect(),
    end: () => rawPool.end(),
    query: async (...args) => {
      const client = await rawPool.connect();
      try {
        await client.query("BEGIN");
        await client.query(`SET LOCAL search_path TO ${schema}, public`);
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
  const tx = async (action) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(`SET LOCAL search_path TO ${schema}, public`);
      const result = await action(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  };
  const campaign = async (overrides = {}) => {
    const data = core.normalizeCouponInput({ ...base, ...overrides });
    const fields = core.couponEditableFields;
    const result = await pool.query(
      `INSERT INTO tb_event_coupons (${fields.join(",")},coupon_activated_at) VALUES (${fields.map((_, i) => `$${i + 1}`).join(",")},clock_timestamp()) RETURNING *`,
      fields.map((f) => data[f]),
    );
    return result.rows[0];
  };
  let users, coupon, holder, winningOrder;
  try {
    await manager.connect();
    await manager.query("BEGIN");
    await manager.query(`CREATE SCHEMA ${schema}`);
    await manager.query(`SET LOCAL search_path TO ${schema}, public`);
    await manager.query(`CREATE TABLE tb_users (id BIGSERIAL PRIMARY KEY,uuid UUID NOT NULL DEFAULT gen_random_uuid(),role TEXT DEFAULT 'User',created_at TIMESTAMPTZ DEFAULT clock_timestamp(),deleted_at TIMESTAMPTZ);
      CREATE TABLE tb_shopping_orders (id BIGSERIAL PRIMARY KEY,uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,order_status TEXT DEFAULT 'pending',order_payment_status TEXT DEFAULT 'unpaid',updated_by TEXT,updated_at TIMESTAMPTZ);
      CREATE TABLE tb_shopping_order_items (id BIGSERIAL PRIMARY KEY,order_item_order TEXT,order_item_product TEXT,order_item_subtotal NUMERIC,order_item_discount NUMERIC DEFAULT 0,order_item_quantity INTEGER,deleted_at TIMESTAMPTZ);
      CREATE TABLE tb_shopping_basket (id BIGSERIAL PRIMARY KEY,basket_product TEXT,basket_quantity INTEGER,created_by TEXT,deleted_at TIMESTAMPTZ,basket_expire TIMESTAMPTZ DEFAULT NOW()+INTERVAL '1 day');
      CREATE TABLE vw_master_products (uuid UUID,product_selling_price NUMERIC);
      CREATE TABLE tb_event_promotions (id BIGSERIAL PRIMARY KEY,promotion_product TEXT,promotion_is_active BOOLEAN,deleted_at TIMESTAMPTZ,promotion_start_date DATE,promotion_end_date DATE,promotion_discounted_price NUMERIC,promotion_bundle_price NUMERIC,promotion_min_quantity INTEGER,promotion_min_purchase_amount NUMERIC);`);
    await manager.query(
      await readFile(
        new URL("../database/tb_event_coupons.sql", import.meta.url),
        "utf8",
      ),
    );
    await manager.query("COMMIT");
    users = (
      await pool.query(
        "INSERT INTO tb_users (created_at) SELECT clock_timestamp() FROM generate_series(1,30) RETURNING uuid",
      )
    ).rows.map((row) => row.uuid);
    coupon = await campaign();
    await test("new coupon tables retain every required id/uuid/audit field", async () => {
      const result = await pool.query(
        "SELECT table_name,column_name FROM information_schema.columns WHERE table_schema=$1",
        [schema],
      );
      for (const table of [
        "tb_event_coupons",
        "tb_user_coupons",
        "tb_shopping_order_coupon_usages",
      ])
        for (const field of [
          "id",
          "uuid",
          "created_by",
          "created_at",
          "updated_by",
          "updated_at",
          "deleted_by",
          "deleted_at",
        ])
          assert.ok(
            result.rows.some(
              (row) => row.table_name === table && row.column_name === field,
            ),
            `${table}.${field}`,
          );
    });
    await test("25 concurrent claims allocate exactly 20 recipients; full quota and retries are safe", async () => {
      const results = await Promise.allSettled(
        users
          .slice(0, 25)
          .map((user) =>
            tx((client) =>
              core.grantCoupon(client, coupon.uuid, user, "claim", user),
            ),
          ),
      );
      assert.equal(
        results.filter((row) => row.status === "fulfilled").length,
        20,
      );
      assert.equal(
        results.filter(
          (row) =>
            row.status === "rejected" &&
            row.reason.data?.code === "COUPON_QUOTA_EXHAUSTED",
        ).length,
        5,
      );
      const count = await pool.query(
        "SELECT coupon_issued_count FROM tb_event_coupons WHERE uuid=$1",
        [coupon.uuid],
      );
      assert.equal(count.rows[0].coupon_issued_count, 20);
      holder = (
        await pool.query(
          "SELECT * FROM tb_user_coupons WHERE user_coupon_coupon=$1 ORDER BY id LIMIT 1",
          [coupon.uuid],
        )
      ).rows[0];
      const retries = await Promise.all(
        Array.from({ length: 5 }, () =>
          tx((client) =>
            core.grantCoupon(
              client,
              coupon.uuid,
              holder.user_coupon_user,
              "claim",
              holder.user_coupon_user,
            ),
          ),
        ),
      );
      assert.ok(retries.every((result) => result.alreadyClaimed));
      assert.equal(
        (
          await pool.query(
            "SELECT COUNT(*)::int AS count FROM tb_user_coupons WHERE user_coupon_coupon=$1",
            [coupon.uuid],
          )
        ).rows[0].count,
        20,
      );
    });
    await test("claim cannot obtain signup/random/manual campaigns or other ownership", async () => {
      for (const method of ["signup", "random", "manual"]) {
        const c = await campaign({ coupon_distribution_method: method });
        await assert.rejects(
          tx((client) =>
            core.grantCoupon(client, c.uuid, users[29], "claim", users[29]),
          ),
          /วิธีนี้/,
        );
      }
      await assert.rejects(
        tx((client) =>
          core.evaluateAndLockUserCoupon(
            client,
            users[29],
            holder.uuid,
            basket,
          ),
        ),
        /ถือครอง/,
      );
    });
    await test("three concurrent redemptions spend one allowed use exactly once", async () => {
      const orderIds = (
        await pool.query(
          "INSERT INTO tb_shopping_orders (order_status) SELECT $1 FROM generate_series(1,3) RETURNING uuid",
          ["pending"],
        )
      ).rows.map((row) => row.uuid);
      const results = await Promise.allSettled(
        orderIds.map((orderUuid) =>
          tx(async (client) => {
            const evaluation = await core.evaluateAndLockUserCoupon(
              client,
              holder.user_coupon_user,
              holder.uuid,
              basket,
            );
            await client.query(
              "UPDATE tb_shopping_orders SET order_user_coupon=$2,order_coupon_discount=$3,order_coupon_snapshot=$4::jsonb WHERE uuid=$1",
              [
                orderUuid,
                holder.uuid,
                evaluation.discountAmount,
                JSON.stringify(evaluation.snapshot),
              ],
            );
            await core.consumeUserCoupon(client, evaluation, {
              orderUuid,
              userUuid: holder.user_coupon_user,
            });
            return orderUuid;
          }),
        ),
      );
      assert.equal(
        results.filter((row) => row.status === "fulfilled").length,
        1,
      );
      winningOrder = results.find((row) => row.status === "fulfilled").value;
      assert.equal(
        (
          await pool.query(
            "SELECT user_coupon_used_count FROM tb_user_coupons WHERE uuid=$1",
            [holder.uuid],
          )
        ).rows[0].user_coupon_used_count,
        1,
      );
      assert.equal(
        (
          await pool.query(
            "SELECT COUNT(*)::int AS count FROM tb_shopping_order_coupon_usages WHERE usage_user_coupon=$1",
            [holder.uuid],
          )
        ).rows[0].count,
        1,
      );
    });
    await test("returning same usage twice restores one use and retains order history", async () => {
      const returns = await Promise.all(
        [1, 2].map(() =>
          tx((client) =>
            core.returnOrderCoupon(
              client,
              winningOrder,
              holder.user_coupon_user,
              "Canceled before payment",
            ),
          ),
        ),
      );
      assert.deepEqual(returns.sort(), [false, true]);
      assert.equal(
        (
          await pool.query(
            "SELECT user_coupon_used_count FROM tb_user_coupons WHERE uuid=$1",
            [holder.uuid],
          )
        ).rows[0].user_coupon_used_count,
        0,
      );
      assert.equal(
        Number(
          (
            await pool.query(
              "SELECT order_coupon_discount FROM tb_shopping_orders WHERE uuid=$1",
              [winningOrder],
            )
          ).rows[0].order_coupon_discount,
        ),
        50,
      );
      assert.equal(
        (
          await pool.query(
            "SELECT usage_status FROM tb_shopping_order_coupon_usages WHERE usage_order=$1",
            [winningOrder],
          )
        ).rows[0].usage_status,
        "returned",
      );
      assert.equal(
        (
          await tx((client) =>
            core.grantCoupon(
              client,
              coupon.uuid,
              holder.user_coupon_user,
              "claim",
              holder.user_coupon_user,
            ),
          )
        ).alreadyClaimed,
        true,
      );
    });
    await test("paused campaign stops new grants while holders can still redeem; expired holds cannot", async () => {
      await pool.query(
        "UPDATE tb_event_coupons SET coupon_status='paused' WHERE uuid=$1",
        [coupon.uuid],
      );
      assert.equal(
        (
          await tx((client) =>
            core.evaluateAndLockUserCoupon(
              client,
              holder.user_coupon_user,
              holder.uuid,
              basket,
            ),
          )
        ).discountAmount,
        50,
      );
      await assert.rejects(
        tx((client) =>
          core.grantCoupon(client, coupon.uuid, users[29], "claim", users[29]),
        ),
      );
      await pool.query(
        "UPDATE tb_event_coupons SET coupon_expires_at=NOW()-INTERVAL '1 second' WHERE uuid=$1",
        [coupon.uuid],
      );
      await assert.rejects(
        tx((client) =>
          core.evaluateAndLockUserCoupon(
            client,
            holder.user_coupon_user,
            holder.uuid,
            basket,
          ),
        ),
        /หมดอายุ/,
      );
    });
    await test("signup campaigns allocate only new users, and never exceed remaining quota", async () => {
      const c = await campaign({
        coupon_distribution_method: "signup",
        coupon_recipient_limit: 2,
      });
      await tx((client) => core.grantSignupCoupons(client, users[0]));
      assert.equal(
        (
          await pool.query(
            "SELECT coupon_issued_count FROM tb_event_coupons WHERE uuid=$1",
            [c.uuid],
          )
        ).rows[0].coupon_issued_count,
        0,
      );
      const newUsers = (
        await pool.query(
          "INSERT INTO tb_users (created_at) SELECT clock_timestamp() FROM generate_series(1,4) RETURNING uuid",
        )
      ).rows;
      await Promise.all(
        newUsers.map((user) =>
          tx((client) => core.grantSignupCoupons(client, user.uuid)),
        ),
      );
      assert.equal(
        (
          await pool.query(
            "SELECT coupon_issued_count FROM tb_event_coupons WHERE uuid=$1",
            [c.uuid],
          )
        ).rows[0].coupon_issued_count,
        2,
      );
    });
    await test("preview uses current product promotions and counts distinct products", async () => {
      const product = randomUUID();
      await pool.query("INSERT INTO vw_master_products VALUES ($1,150)", [
        product,
      ]);
      await pool.query(
        "INSERT INTO tb_event_promotions (promotion_product,promotion_is_active,promotion_start_date,promotion_end_date,promotion_discounted_price,promotion_min_quantity) VALUES ($1,true,CURRENT_DATE,CURRENT_DATE+1,100,2)",
        [product],
      );
      await pool.query(
        "INSERT INTO tb_shopping_basket (basket_product,basket_quantity,created_by) VALUES ($1,3,$2)",
        [product, users[0]],
      );
      const result = await tx((client) =>
        core.getCouponBasket(client, users[0]),
      );
      assert.deepEqual(result, {
        subtotal: 450,
        promotionDiscount: 150,
        merchandiseTotal: 300,
        totalQuantity: 3,
        distinctItems: 1,
      });
    });
    await test("order adjustments use original terms; below-minimum edit rolls back; explicit removal restores entitlement", async () => {
      const c = await campaign({ coupon_distribution_method: "manual" });
      const held = await tx((client) =>
        core.grantCoupon(client, c.uuid, users[28], "manual", users[28]),
      );
      const o = (
        await pool.query(
          "INSERT INTO tb_shopping_orders(order_status) VALUES ('pending') RETURNING uuid",
        )
      ).rows[0].uuid;
      await tx(async (client) => {
        const evaluation = await core.evaluateAndLockUserCoupon(
          client,
          users[28],
          held.row.uuid,
          basket,
        );
        await client.query(
          "UPDATE tb_shopping_orders SET order_user_coupon=$2,order_coupon_discount=$3,order_coupon_snapshot=$4::jsonb WHERE uuid=$1",
          [
            o,
            held.row.uuid,
            evaluation.discountAmount,
            JSON.stringify(evaluation.snapshot),
          ],
        );
        await core.consumeUserCoupon(client, evaluation, {
          orderUuid: o,
          userUuid: users[28],
        });
      });
      await pool.query(
        "INSERT INTO tb_shopping_order_items (order_item_order,order_item_product,order_item_subtotal,order_item_quantity) VALUES ($1,$2,500,1)",
        [o, randomUUID()],
      );
      await pool.query(
        "UPDATE tb_event_coupons SET coupon_name='Changed name',coupon_discount_value=90 WHERE uuid=$1",
        [c.uuid],
      );
      await tx((client) => core.adjustOrderCoupon(client, o, users[28]));
      assert.equal(
        Number(
          (
            await pool.query(
              "SELECT order_coupon_discount FROM tb_shopping_orders WHERE uuid=$1",
              [o],
            )
          ).rows[0].order_coupon_discount,
        ),
        50,
      );
      await assert.rejects(
        tx(async (client) => {
          await client.query(
            "UPDATE tb_shopping_order_items SET order_item_subtotal=400 WHERE order_item_order=$1",
            [o],
          );
          await core.adjustOrderCoupon(client, o, users[28]);
        }),
        (error) => error.data?.code === "ORDER_COUPON_CONDITIONS_CHANGED",
      );
      assert.equal(
        Number(
          (
            await pool.query(
              "SELECT order_item_subtotal FROM tb_shopping_order_items WHERE order_item_order=$1",
              [o],
            )
          ).rows[0].order_item_subtotal,
        ),
        500,
      );
      await tx(async (client) => {
        await client.query(
          "UPDATE tb_shopping_order_items SET order_item_subtotal=400 WHERE order_item_order=$1",
          [o],
        );
        await core.adjustOrderCoupon(client, o, users[28], {
          removeCoupon: true,
        });
      });
      assert.equal(
        (
          await pool.query(
            "SELECT order_user_coupon FROM tb_shopping_orders WHERE uuid=$1",
            [o],
          )
        ).rows[0].order_user_coupon,
        null,
      );
      assert.equal(
        (
          await pool.query(
            "SELECT user_coupon_used_count FROM tb_user_coupons WHERE uuid=$1",
            [held.row.uuid],
          )
        ).rows[0].user_coupon_used_count,
        0,
      );
    });
  } finally {
    await pool.end();
    // Only this random, explicitly created test namespace is removed; application tables are untouched.
    await manager.query("ROLLBACK");
    await manager.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await manager.end();
  }
}
