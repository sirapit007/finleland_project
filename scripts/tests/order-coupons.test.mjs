import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import { transformSync } from "esbuild";

const nativeRequire = createRequire(import.meta.url);
const actor = { uuid: "11111111-1111-4111-8111-111111111111" };
const orderUuid = "22222222-2222-4222-8222-222222222222";
const holdingUuid = "33333333-3333-4333-8333-333333333333";
const couponUuid = "44444444-4444-4444-8444-444444444444";
const makeError = (input) => Object.assign(new Error(input.statusMessage), input);

function loadTs(file, imports = {}, globals = {}) {
  const { code } = transformSync(readFileSync(file, "utf8"), { loader: "ts", format: "cjs", target: "node22" });
  const module = { exports: {} };
  const context = {
    module, exports: module.exports, console, Date, URL,
    require: (id) => imports[id] ?? (id.startsWith("node:") ? nativeRequire(id) : (() => { throw new Error("Unmocked import " + id); })()),
    defineEventHandler: (handler) => handler,
    createError: makeError,
    readBody: async (event) => event.body || {},
    getRouterParam: (event, key) => event.params?.[key],
    useRuntimeConfig: () => ({}),
    getRequestURL: () => new URL("http://localhost"),
    ...globals,
  };
  vm.runInNewContext(code, context, { filename: file });
  return module.exports;
}
const pricing = loadTs("server/utils/orderPricing.ts");
const baseImports = {
  "@@/server/utils/session": { requireCurrentUser: async () => actor, requireCurrentAdmin: async () => actor },
  "@@/server/utils/lineMessaging": {
    notifyLineAdminGroupOfNewOrder: async () => ({ sent: false, reason: "Test" }),
    notifyLineCustomerOfOrderStatus: async () => ({ sent: false, reason: "Test" }),
  },
  "@@/server/utils/orderPricing": pricing,
  "@@/server/utils/shippingQuote": { createShippingQuote: async () => ({
    options: [{ id: "thailand_post_ems", available: true, price: 20, label: "EMS" }],
  }) },
  "@@/shared/utils/localExpress": { LOCAL_EXPRESS_MINIMUM_ORDER_AMOUNT: 500 },
  "@@/server/utils/orderItemTransactions": { createOrderItemTransactions: async () => [] },
};
const tests = [];
const test = (name, fn) => tests.push([name, fn]);

function creationFixture({ discount = 50, failConsumption = false, delivery = "pickup", expectations = {} } = {}) {
  const log = [];
  let insertedOrder, basket, consumed = 0;
  const client = {
    release() { log.push("RELEASE"); },
    async query(sql, params = []) {
      log.push(sql.trim());
      if (sql.includes("FROM tb_users")) return { rows: [{ ...actor, firstname: "Test", phone: "000" }] };
      if (sql.includes("FROM tb_user_shipping_addresses")) return { rows: [{ uuid: actor.uuid }] };
      if (sql.includes("FROM tb_shopping_basket AS basket")) return { rows: [{
        basket_uuid: actor.uuid, basket_product: couponUuid, basket_quantity: 2,
        product_code: "TEST", product_name: "Fixture", product_selling_price: 300,
        promotion_discounted_price: 275, promotion_uuid: couponUuid, promotion_name: "Promo",
      }] };
      if (sql.includes("INSERT INTO tb_shopping_orders")) {
        const columns = sql.split("(")[1].split(")")[0].split(",").map((c) => c.trim());
        insertedOrder = { uuid: orderUuid };
        columns.forEach((column, index) => { insertedOrder[column] = params[index]; });
        return { rows: [insertedOrder] };
      }
      if (sql.includes("order_payment_status = 'paid'")) {
        insertedOrder.order_payment_status = "paid";
        insertedOrder.order_payment_method = "coupon";
        return { rows: [insertedOrder] };
      }
      if (sql.includes("INSERT INTO tb_shopping_order_items")) return { rows: [{ uuid: holdingUuid }] };
      return { rows: [] };
    },
  };
  const handler = loadTs("server/api/order/index.post.ts", {
    ...baseImports, "@@/server/utils/db": { useDb: () => ({ connect: async () => client }) },
    "@@/server/utils/coupons": {
      async evaluateAndLockUserCoupon(_client, user, holding, totals) {
        assert.equal(_client, client);
        assert.equal(user, actor.uuid);
        assert.equal(holding, holdingUuid);
        basket = totals;
        return { userCouponUuid: holdingUuid, couponUuid, discountAmount: discount, snapshot: { coupon_name: "Welcome" } };
      },
      async consumeUserCoupon(_client, _evaluation, input) {
        assert.equal(_client, client);
        assert.equal(input.orderUuid, orderUuid);
        assert.equal(input.userUuid, actor.uuid);
        assert.ok(!log.includes("COMMIT"));
        consumed++;
        if (failConsumption) throw makeError({ statusCode: 409, statusMessage: "Coupon exhausted" });
      },
    },
  }).default;
  return {
    run: () => handler({ body: {
      order_stock_terms_accepted: true, order_delivery_method: delivery,
      order_shipping_address_uuid: actor.uuid, order_user_coupon_uuid: holdingUuid,
      user: { uuid: couponUuid }, order_coupon_discount: 999999, ...expectations,
    } }),
    log, getOrder: () => insertedOrder, getBasket: () => basket, getConsumed: () => consumed,
  };
}

test("checkout uses server merchandise after promotions, excludes shipping, and stores coupon snapshot", async () => {
  const fixture = creationFixture({ delivery: "thailand_post_ems" });
  const result = await fixture.run();
  assert.deepEqual(JSON.parse(JSON.stringify(fixture.getBasket())), { merchandiseTotal: 550, totalQuantity: 2, distinctItems: 1 });
  assert.equal(result.row.order_subtotal, 600);
  assert.equal(result.row.order_discount, 50);
  assert.equal(result.row.order_coupon_discount, 50);
  assert.equal(result.row.order_grand_total, 520);
  assert.equal(result.row.order_user_coupon, holdingUuid);
  assert.equal(JSON.parse(result.row.order_coupon_snapshot).coupon_name, "Welcome");
  assert.equal(fixture.getConsumed(), 1);
  assert.ok(fixture.log.includes("COMMIT"));
});
test("failed coupon consumption rolls the whole order back", async () => {
  const fixture = creationFixture({ failConsumption: true });
  await assert.rejects(fixture.run, { statusCode: 409 });
  assert.ok(fixture.log.includes("ROLLBACK"));
  assert.ok(!fixture.log.includes("COMMIT"));
});
test("zero payable pickup order is settled by coupon", async () => {
  const fixture = creationFixture({ discount: 550 });
  const result = await fixture.run();
  assert.equal(result.row.order_grand_total, 0);
  assert.equal(result.row.order_payment_status, "paid");
  assert.equal(result.row.order_payment_method, "coupon");
});

function statusFixture(current) {
  let returned = 0;
  const log = [];
  const client = {
    release() {},
    async query(sql) {
      log.push(sql.trim());
      if (sql.includes("SELECT uuid::text")) return { rows: [{ uuid: orderUuid, order_user: actor.uuid, ...current }] };
      if (sql.includes("INSERT INTO tb_shopping_order_status_histories")) return { rows: [{ uuid: holdingUuid }] };
      return { rows: [{ ...current }] };
    },
  };
  const handler = loadTs("server/api/order/status-histories/index.post.ts", {
    ...baseImports, "@@/server/utils/db": { useDb: () => ({ connect: async () => client }) },
    "@@/server/utils/coupons": { returnOrderCoupon: async () => { returned++; return true; } },
  }).default;
  return { run: (status) => handler({ body: { order_status_history_order: orderUuid, order_status_history_status: status } }), count: () => returned, log };
}
test("cancel unpaid restores coupon; cancel paid keeps entitlement consumed", async () => {
  const unpaid = statusFixture({ order_status: "pending", order_payment_status: "unpaid" });
  await unpaid.run("canceled"); assert.equal(unpaid.count(), 1);
  const paid = statusFixture({ order_status: "confirmed", order_payment_status: "paid", order_paid_at: new Date(), order_grand_total: 500 });
  await paid.run("canceled"); assert.equal(paid.count(), 0);
});
test("cancel coupon-covered zero total restores entitlement despite paid flag", async () => {
  const fixture = statusFixture({ order_status: "pending", order_payment_status: "paid", order_paid_at: new Date(), order_grand_total: 0, order_payment_method: "coupon" });
  await fixture.run("canceled"); assert.equal(fixture.count(), 1);
});
test("canceled orders cannot reopen after coupon return", async () => {
  const fixture = statusFixture({ order_status: "canceled", order_payment_status: "unpaid" });
  await assert.rejects(() => fixture.run("pending"), { statusCode: 409 });
  assert.ok(!fixture.log.includes("COMMIT"));
});
test("paid and refunded item changes are rejected under parent lock", async () => {
  const { assertOrderItemsAreEditable } = loadTs("server/utils/orderItemAdjustments.ts");
  for (const paymentStatus of ["paid", "refunded"]) {
    const client = { query: async (sql) => {
      assert.match(sql, /FOR UPDATE/);
      return { rows: [{ uuid: orderUuid, order_status: "pending", order_payment_status: paymentStatus }] };
    }};
    await assert.rejects(() => assertOrderItemsAreEditable(client, orderUuid), { statusCode: 409 });
  }
});
test("item total refresh revalidates coupon before writing totals; explicit removal returns then clears", async () => {
  const sequence = [];
  let fail = true;
  const { refreshOrderTotals } = loadTs("server/utils/orderTotals.ts", {
    "@@/server/utils/coupons": {
      adjustOrderCoupon: async () => { sequence.push("ADJUST"); if (fail) throw makeError({ statusCode: 409, statusMessage: "conditions", data: { code: "ORDER_COUPON_CONDITIONS_CHANGED" } }); },
      returnOrderCoupon: async () => { sequence.push("RETURN"); return true; },
    },
  });
  const client = { query: async (sql) => {
    if (sql.includes("order_user_coupon = NULL")) sequence.push("CLEAR");
    else if (sql.includes("SUM")) { sequence.push("READ_TOTAL"); return { rows: [{ subtotal: 600, discount: 50 }] }; }
    else { sequence.push("TOTAL_UPDATE"); assert.match(sql, /- COALESCE\(order_coupon_discount/); }
    return { rows: [{ uuid: orderUuid }] };
  }};
  await assert.rejects(() => refreshOrderTotals(client, orderUuid, actor.uuid), { statusCode: 409 });
  assert.deepEqual(sequence, ["ADJUST"]);
  sequence.length = 0; fail = false;
  await refreshOrderTotals(client, orderUuid, actor.uuid, { removeCoupon: true });
  assert.deepEqual(sequence, ["RETURN", "CLEAR", "ADJUST", "READ_TOTAL", "TOTAL_UPDATE"]);
});

test("paid coupon return requires recorded external refund confirmation and audits without repricing", async () => {
  let returned = 0;
  const logs = [];
  const current = { uuid: orderUuid, order_status: "canceled", order_payment_status: "paid", order_paid_at: new Date(), order_grand_total: 500, order_coupon_discount: 50 };
  const client = { release() {}, query: async (sql, params) => {
    logs.push([sql, params]);
    if (sql.includes("SELECT * FROM tb_shopping_orders")) return { rows: [current] };
    if (sql.includes("SELECT usage_status")) return { rows: [{ usage_status: "used" }] };
    return { rows: [{ ...current, order_payment_status: "refunded" }] };
  }};
  const handler = loadTs("server/api/order/[uuid]/coupon/return.post.ts", {
    ...baseImports, "@@/server/utils/db": { useDb: () => ({ connect: async () => client }) },
    "@@/server/utils/coupons": { returnOrderCoupon: async () => { returned++; return true; } },
  }).default;
  await assert.rejects(() => handler({ params: { uuid: orderUuid }, body: { reason: "Refund checked" } }), { statusCode: 400 });
  assert.equal(returned, 0);
  const result = await handler({ params: { uuid: orderUuid }, body: { reason: "Refund checked", refund_confirmed: true } });
  assert.equal(returned, 1);
  assert.equal(result.row.order_coupon_discount, 50);
  assert.equal(result.row.order_grand_total, 500);
  assert.equal(result.row.order_payment_status, "refunded");
  assert.ok(logs.some(([sql, params]) => sql.includes("INSERT INTO tb_shopping_order_status_histories") && params[1].includes("Refund checked")));
});


test("manual payment verification refuses stale total and canceled orders", async () => {
  const paymentUtils = loadTs("server/utils/orderPayments.ts");
  for (const current of [
    { current_order_status: "pending", order_grand_total: 550 },
    { current_order_status: "canceled", order_grand_total: 500 },
  ]) {
    const logs = [];
    const client = {
      release() {},
      async query(sql) {
        logs.push(sql.trim());
        return { rows: [{
          uuid: holdingUuid, order_payment_order: orderUuid,
          current_order_payment_status: "pending", order_payment_status: "manual_review",
          order_payment_expected_amount: 500, ...current,
        }] };
      },
    };
    const handler = loadTs("server/api/order/payments/[uuid].put.ts", {
      ...baseImports,
      "@@/server/utils/orderPayments": paymentUtils,
      "@@/server/utils/db": { useDb: () => ({ connect: async () => client }) },
    }).default;
    await assert.rejects(() => handler({
      params: { uuid: holdingUuid },
      body: { order_payment_status: "verified", order_payment_verified_amount: 500,
        order_payment_review_note: "Reviewed", order_payment_transaction_ref: "REF123",
        order_payment_sending_bank: "004", order_payment_transaction_at: "2026-09-11T12:00:00Z" },
    }), { statusCode: 409 });
    assert.ok(!logs.includes("COMMIT"));
    assert.ok(!logs.some((sql) => sql.startsWith("UPDATE")));
  }
});


test("coupon return never invents usage and repeated returns do not refund twice", async () => {
  for (const usage of [null, { usage_status: "returned" }]) {
    let returned = 0;
    const logs = [];
    const client = { release() {}, query: async (sql) => {
      logs.push(sql.trim());
      if (sql.includes("SELECT * FROM tb_shopping_orders")) return { rows: [{ uuid: orderUuid, order_status: "canceled", order_payment_status: "paid" }] };
      if (sql.includes("SELECT usage_status")) return { rows: usage ? [usage] : [] };
      return { rows: [] };
    }};
    const handler = loadTs("server/api/order/[uuid]/coupon/return.post.ts", {
      ...baseImports, "@@/server/utils/db": { useDb: () => ({ connect: async () => client }) },
      "@@/server/utils/coupons": { returnOrderCoupon: async () => { returned++; return true; } },
    }).default;
    const event = { params: { uuid: orderUuid }, body: { reason: "Refund checked", refund_confirmed: true } };
    if (!usage) {
      await assert.rejects(() => handler(event), { statusCode: 404 });
      assert.ok(!logs.includes("COMMIT"));
    } else {
      const result = await handler(event);
      assert.equal(result.returned, false);
      assert.equal(result.row.order_coupon_usage_status, "returned");
      assert.equal(result.row.order_payment_status, "paid");
    }
    assert.equal(returned, 0);
    assert.ok(!logs.some((sql) => sql.startsWith("UPDATE") || sql.startsWith("INSERT")));
  }
});

test("valid admin adjustment to zero payable settles the order using its coupon", async () => {
  const { refreshOrderTotals } = loadTs("server/utils/orderTotals.ts", {
    "@@/server/utils/coupons": { adjustOrderCoupon: async () => {}, returnOrderCoupon: async () => false },
  });
  let settled = false;
  const client = { query: async (sql) => {
    if (sql.includes("SUM")) return { rows: [{ subtotal: 75, discount: 0 }] };
    if (sql.includes("order_payment_status = 'paid'")) {
      settled = true;
      return { rows: [{ uuid: orderUuid, order_grand_total: 0, order_payment_status: "paid", order_payment_method: "coupon" }] };
    }
    return { rows: [{ uuid: orderUuid, order_user_coupon: holdingUuid, order_coupon_discount: 75, order_grand_total: 0 }] };
  }};
  const order = await refreshOrderTotals(client, orderUuid, actor.uuid);
  assert.equal(settled, true);
  assert.equal(order.order_payment_status, "paid");
  assert.equal(order.order_payment_method, "coupon");
});


test("checkout rejects a changed coupon quote before order insertion and consumption", async () => {
  for (const expectations of [
    { order_expected_coupon_discount: 100, order_expected_coupon_merchandise_total: 550 },
    { order_expected_coupon_discount: 50, order_expected_coupon_merchandise_total: 600 },
  ]) {
    const fixture = creationFixture({ expectations });
    await assert.rejects(fixture.run, (error) => error.statusCode === 409 && error.data.code === "COUPON_QUOTE_CHANGED");
    assert.equal(fixture.getOrder(), undefined);
    assert.equal(fixture.getConsumed(), 0);
    assert.ok(fixture.log.includes("ROLLBACK"));
  }
  const valid = creationFixture({ expectations: { order_expected_coupon_discount: 50, order_expected_coupon_merchandise_total: 550 } });
  await valid.run();
  assert.ok(valid.log.includes("COMMIT"));
});

test("checkout quote expectations must be finite nonnegative numbers", async () => {
  for (const value of [NaN, Infinity, -1, "50", null]) {
    const fixture = creationFixture({ expectations: { order_expected_coupon_discount: value } });
    await assert.rejects(fixture.run, { statusCode: 400 });
    assert.equal(fixture.getOrder(), undefined);
    assert.equal(fixture.getConsumed(), 0);
  }
});

for (const [name, fn] of tests) {
  await fn();
  console.log("PASS", name);
}
console.log(`${tests.length} order coupon integration checks passed (isolated stubs; no database access).`);
