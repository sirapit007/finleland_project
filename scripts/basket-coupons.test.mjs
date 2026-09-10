import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import test from "node:test";
import * as Vue from "vue";

const source = stripTypeScriptTypes(
  readFileSync(
    new URL("../app/composables/useBasketCoupons.ts", import.meta.url),
    "utf8",
  ),
)
  .replace(
    /import\s*\{[\s\S]*?\}\s*from\s*["']vue["'];?/,
    "const { computed, ref, watch } = Vue; const onMounted = () => {}; const onBeforeUnmount = (callback) => cleanups.push(callback);",
  )
  .replace("export function useBasketCoupons", "function useBasketCoupons")
  .replaceAll("import.meta.client", "true");
const createComposable = new Function(
  "Vue",
  "$fetch",
  "cleanups",
  source + "\nreturn useBasketCoupons;",
);

const coupon = {
  uuid: "campaign-1",
  user_coupon_uuid: "holding-1",
  coupon_name: "Welcome",
  coupon_discount_type: "amount",
  coupon_discount_value: 50,
  coupon_min_purchase_amount: 500,
  coupon_min_quantity: 0,
  coupon_min_items: 0,
  coupon_usage_limit: 1,
  coupon_recipient_limit: 20,
  coupon_issued_count: 1,
  user_coupon_used_count: 0,
  eligible: true,
  discount_amount: 50,
};
const quote = (amount = 50, merchandiseTotal = 500) => ({
  row: {
    user_coupon_uuid: "holding-1",
    coupon_name: "Welcome",
    discount_amount: amount,
  },
  basket: {
    subtotal: merchandiseTotal + 100,
    promotionDiscount: 100,
    merchandiseTotal,
    totalQuantity: 2,
    distinctItems: 1,
  },
});
const list = (rows = [coupon], claimableRows = []) => ({
  rows,
  claimableRows,
  eligibleCount: rows.filter((row) => row.eligible).length,
  claimableCount: claimableRows.filter((row) => !row.claimed).length,
});
const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};
const flush = async () => {
  for (let count = 0; count < 8; count++) await Promise.resolve();
};

function setup(fetcher) {
  const scope = Vue.effectScope();
  const cleanups = [];
  const basketKey = Vue.ref("basket-500");
  const basketBusy = Vue.ref(false);
  const user = Vue.ref("user-1");
  const useCoupons = createComposable(Vue, fetcher, cleanups);
  const state = scope.run(() =>
    useCoupons(
      Vue.computed(() => user.value),
      Vue.computed(() => basketKey.value),
      Vue.computed(() => basketBusy.value),
    ),
  );
  return {
    state,
    basketKey,
    basketBusy,
    user,
    dispose: () => {
      cleanups.forEach((cleanup) => cleanup());
      scope.stop();
    },
  };
}

test("quote previews discount without claiming or consuming a coupon", async () => {
  const requests = [];
  const ctx = setup(async (url) => {
    requests.push(url);
    return url === "/api/user/coupons" ? list() : quote();
  });
  try {
    assert.equal(await ctx.state.refreshCoupons(), true);
    assert.equal(ctx.state.eligibleCouponCount.value, 1);
    assert.equal(await ctx.state.selectCoupon(coupon), true);
    assert.equal(ctx.state.couponDiscount.value, 50);
    assert.equal(ctx.state.couponCheckoutBlocked.value, false);
    assert.deepEqual(requests, ["/api/user/coupons", "/api/coupon/quote"]);
  } finally {
    ctx.dispose();
  }
});

test("cart losing eligibility removes the discount and requires explicit review", async () => {
  let eligible = true;
  const ctx = setup(async (url) =>
    url === "/api/user/coupons"
      ? list([
          {
            ...coupon,
            eligible,
            ineligible_reason: eligible ? null : "Buy 200 more",
          },
        ])
      : quote(),
  );
  try {
    await ctx.state.refreshCoupons();
    await ctx.state.selectCoupon(coupon);
    eligible = false;
    ctx.basketKey.value = "basket-300";
    assert.equal(ctx.state.couponCheckoutBlocked.value, true);
    await flush();
    assert.equal(ctx.state.selectedCouponUuid.value, "");
    assert.equal(ctx.state.couponDiscount.value, 0);
    assert.equal(ctx.state.couponNeedsReview.value, true);
    assert.equal(await ctx.state.verifyCoupon(), false);
    ctx.state.removeCoupon();
    assert.equal(ctx.state.couponCheckoutBlocked.value, false);
    assert.equal(await ctx.state.verifyCoupon(), true);
  } finally {
    ctx.dispose();
  }
});

test("a late response from the old basket cannot overwrite its new coupon quote", async () => {
  const oldQuote = deferred();
  const currentQuote = deferred();
  let calls = 0;
  const ctx = setup(async (url) => {
    if (url === "/api/user/coupons") return list();
    calls += 1;
    return calls === 1 ? oldQuote.promise : currentQuote.promise;
  });
  try {
    await ctx.state.refreshCoupons();
    const initialSelection = ctx.state.selectCoupon(coupon);
    ctx.basketKey.value = "basket-700";
    await flush();
    assert.equal(calls, 2);
    oldQuote.resolve(quote(999));
    assert.equal(await initialSelection, false);
    assert.equal(ctx.state.couponDiscount.value, 0);
    assert.equal(ctx.state.couponCheckoutBlocked.value, true);
    currentQuote.resolve(quote(50));
    await flush();
    assert.equal(ctx.state.couponDiscount.value, 50);
    assert.equal(ctx.state.couponCheckoutBlocked.value, false);
  } finally {
    ctx.dispose();
  }
});

test("failed quote refresh retains selection and blocks stale checkout until recovery", async () => {
  let fail = false;
  const ctx = setup(async (url) => {
    if (url === "/api/user/coupons") return list();
    if (fail) throw new Error("offline");
    return quote();
  });
  try {
    await ctx.state.selectCoupon(coupon);
    fail = true;
    assert.equal(await ctx.state.verifyCoupon(), false);
    assert.equal(ctx.state.selectedCouponUuid.value, "holding-1");
    assert.equal(ctx.state.couponDiscount.value, 50);
    assert.equal(ctx.state.couponCheckoutBlocked.value, true);
    fail = false;
    assert.equal(await ctx.state.verifyCoupon(), true);
    assert.equal(ctx.state.couponCheckoutBlocked.value, false);
  } finally {
    ctx.dispose();
  }
});

test("claim rejection refreshes remaining quota and preserves rejection reason", async () => {
  const requests = [];
  const ctx = setup(async (url) => {
    requests.push(url);
    if (url.endsWith("/claim"))
      throw { statusCode: 409, data: { statusMessage: "All claimed" } };
    return list([], []);
  });
  try {
    const result = await ctx.state.claimCoupon({
      ...coupon,
      user_coupon_uuid: undefined,
    });
    assert.equal(result, false);
    assert.deepEqual(requests, [
      "/api/coupon/campaign-1/claim",
      "/api/user/coupons",
    ]);
    assert.equal(ctx.state.claimableCouponCount.value, 0);
    assert.equal(ctx.state.couponError.value, "All claimed");
    assert.equal(ctx.state.claimingCouponUuid.value, "");
  } finally {
    ctx.dispose();
  }
});

test("successful claim reloads owned and public rows and suppresses duplicate clicks", async () => {
  const pendingClaim = deferred();
  let postCount = 0;
  const ctx = setup(async (url) => {
    if (url.endsWith("/claim")) {
      postCount += 1;
      return pendingClaim.promise;
    }
    return list([coupon], [{ ...coupon, claimed: true }]);
  });
  try {
    const firstClaim = ctx.state.claimCoupon({
      ...coupon,
      user_coupon_uuid: undefined,
    });
    assert.equal(
      await ctx.state.claimCoupon({ ...coupon, user_coupon_uuid: undefined }),
      false,
    );
    assert.equal(ctx.state.couponCheckoutBlocked.value, true);
    pendingClaim.resolve({ alreadyClaimed: false });
    assert.equal(await firstClaim, true);
    assert.equal(postCount, 1);
    assert.equal(ctx.state.eligibleCouponCount.value, 1);
    assert.equal(ctx.state.claimableCouponCount.value, 0);
    assert.equal(ctx.state.claimableCoupons.value[0].claimed, true);
  } finally {
    ctx.dispose();
  }
});

test("an invalidated coupon never silently becomes a full-price checkout", async () => {
  let expire = false;
  const ctx = setup(async (url) => {
    if (url === "/api/user/coupons") return list();
    if (expire)
      throw { statusCode: 409, data: { statusMessage: "Already used" } };
    return quote();
  });
  try {
    await ctx.state.selectCoupon(coupon);
    expire = true;
    assert.equal(await ctx.state.verifyCoupon(), false);
    assert.equal(ctx.state.couponNeedsReview.value, true);
    assert.equal(ctx.state.couponDiscount.value, 0);
    assert.equal(await ctx.state.verifyCoupon(), false);
  } finally {
    ctx.dispose();
  }
});

test("checkout expectations use authoritative merchandise totals even when the fixed discount does not change", async () => {
  let merchandiseTotal = 500;
  const ctx = setup(async () => quote(50, merchandiseTotal));
  try {
    await ctx.state.selectCoupon(coupon);
    assert.deepEqual(ctx.state.couponOrderFields.value, {
      order_user_coupon_uuid: "holding-1",
      order_expected_coupon_discount: 50,
      order_expected_coupon_merchandise_total: 500,
    });
    merchandiseTotal = 700;
    assert.equal(await ctx.state.verifyCoupon(), true);
    assert.equal(ctx.state.couponDiscount.value, 50);
    assert.equal(ctx.state.selectedCoupon.value.basket.subtotal, 800);
    assert.equal(ctx.state.selectedCoupon.value.basket.promotionDiscount, 100);
    assert.equal(ctx.state.selectedCoupon.value.basket.merchandiseTotal, 700);
    assert.equal(
      ctx.state.couponOrderFields.value.order_expected_coupon_merchandise_total,
      700,
    );
    ctx.state.removeCoupon();
    assert.deepEqual(ctx.state.couponOrderFields.value, {});
  } finally {
    ctx.dispose();
  }
});

test("zero payable total is a valid coupon quote and still submits its monetary expectations", async () => {
  const ctx = setup(async () => quote(500, 500));
  try {
    assert.equal(await ctx.state.selectCoupon(coupon), true);
    const selected = ctx.state.selectedCoupon.value;
    assert.equal(
      selected.basket.merchandiseTotal - selected.discount_amount,
      0,
    );
    assert.equal(ctx.state.couponCheckoutBlocked.value, false);
    assert.equal(
      ctx.state.couponOrderFields.value.order_expected_coupon_discount,
      500,
    );
  } finally {
    ctx.dispose();
  }
});

test("quote expectations disappear while stale or failed and malformed basket totals block checkout", async () => {
  let response = quote();
  const ctx = setup(async () => response);
  try {
    await ctx.state.selectCoupon(coupon);
    response = {
      ...quote(),
      basket: { ...quote().basket, merchandiseTotal: NaN },
    };
    assert.equal(await ctx.state.verifyCoupon(), false);
    assert.equal(ctx.state.couponCheckoutBlocked.value, true);
    assert.deepEqual(ctx.state.couponOrderFields.value, {});
    response = quote(50, 400);
    assert.equal(await ctx.state.verifyCoupon(), true);
    assert.equal(
      ctx.state.couponOrderFields.value.order_expected_coupon_merchandise_total,
      400,
    );
  } finally {
    ctx.dispose();
  }
});

test("Nitro nested Thai coupon error messages are preserved in quote, list, and claim failures", async () => {
  const message = "คูปองนี้มีผู้รับครบจำนวนแล้ว";
  const envelope = {
    statusCode: 409,
    data: {
      statusCode: 409,
      statusMessage: "Conflict",
      message: "Generic outer message",
      data: { message, code: "COUPON_QUOTA_EXHAUSTED" },
    },
  };
  for (const action of ["quote", "list", "claim"]) {
    const ctx = setup(async () => {
      throw envelope;
    });
    try {
      if (action === "quote") await ctx.state.selectCoupon(coupon);
      else if (action === "list") await ctx.state.refreshCoupons();
      else
        await ctx.state.claimCoupon({ ...coupon, user_coupon_uuid: undefined });
      assert.equal(ctx.state.couponError.value, message, action);
    } finally {
      ctx.dispose();
    }
  }
});
