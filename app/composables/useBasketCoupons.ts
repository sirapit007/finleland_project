import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type ComputedRef,
} from "vue";

export type BasketCoupon = {
  uuid: string;
  user_coupon_uuid?: string;
  coupon_name: string;
  coupon_description?: string | null;
  coupon_discount_type: "amount" | "percent";
  coupon_discount_value: number | string;
  coupon_max_discount?: number | string | null;
  coupon_min_purchase_amount: number | string;
  coupon_min_quantity: number | string;
  coupon_min_items: number | string;
  coupon_usage_limit: number | string;
  coupon_recipient_limit: number | string;
  coupon_issued_count: number | string;
  coupon_expires_at?: string | null;
  user_coupon_used_count?: number | string;
  claimed?: boolean;
  eligible: boolean;
  discount_amount: number;
  ineligible_reason?: string | null;
};

type CouponBasketQuote = {
  subtotal: number;
  promotionDiscount: number;
  merchandiseTotal: number;
  totalQuantity: number;
  distinctItems: number;
};

type CouponQuote = {
  user_coupon_uuid: string;
  coupon_name: string;
  discount_amount: number;
  basket: CouponBasketQuote;
};

type CouponResponse = {
  rows: BasketCoupon[];
  claimableRows: BasketCoupon[];
  eligibleCount: number;
  claimableCount: number;
};

export function useBasketCoupons(
  userUuid: ComputedRef<string>,
  basketKey: ComputedRef<string>,
  basketBusy: ComputedRef<boolean>,
) {
  const ownedCoupons = ref<BasketCoupon[]>([]);
  const claimableCoupons = ref<BasketCoupon[]>([]);
  const eligibleCouponCount = ref(0);
  const claimableCouponCount = ref(0);
  const selectedCoupon = ref<CouponQuote | null>(null);
  const selectedCouponUuid = ref("");
  const couponError = ref("");
  const couponNotice = ref("");
  const isCouponsLoading = ref(false);
  const isCouponQuoting = ref(false);
  const areCouponsLoaded = ref(false);
  const claimingCouponUuid = ref("");
  const couponNeedsReview = ref(false);
  const isCouponQuoteFresh = ref(false);
  let listRequest = 0;
  let quoteRequest = 0;
  let listController: AbortController | null = null;
  let quoteController: AbortController | null = null;
  let disposed = false;

  const eligibleCoupons = computed(() =>
    ownedCoupons.value
      .filter((coupon) => coupon.eligible && coupon.user_coupon_uuid)
      .sort(
        (left, right) =>
          Number(right.discount_amount) - Number(left.discount_amount),
      ),
  );
  const couponDiscount = computed(() =>
    Number(selectedCoupon.value?.discount_amount || 0),
  );
  const couponOrderFields = computed(() =>
    selectedCoupon.value && isCouponQuoteFresh.value
      ? {
          order_user_coupon_uuid: selectedCoupon.value.user_coupon_uuid,
          order_expected_coupon_discount: selectedCoupon.value.discount_amount,
          order_expected_coupon_merchandise_total:
            selectedCoupon.value.basket.merchandiseTotal,
        }
      : {},
  );
  const couponBusy = computed(
    () =>
      isCouponsLoading.value ||
      isCouponQuoting.value ||
      Boolean(claimingCouponUuid.value),
  );
  const couponCheckoutBlocked = computed(
    () =>
      couponNeedsReview.value ||
      couponBusy.value ||
      Boolean(selectedCouponUuid.value && !isCouponQuoteFresh.value),
  );

  function stopQuote() {
    quoteRequest += 1;
    quoteController?.abort();
    quoteController = null;
    isCouponQuoting.value = false;
  }

  function removeCoupon() {
    stopQuote();
    selectedCoupon.value = null;
    selectedCouponUuid.value = "";
    isCouponQuoteFresh.value = false;
    couponNeedsReview.value = false;
    couponError.value = "";
    couponNotice.value = "";
  }

  function invalidateCoupon(reason: string) {
    removeCoupon();
    couponNeedsReview.value = true;
    couponError.value = reason;
  }

  async function quoteCoupon(uuid: string): Promise<boolean> {
    stopQuote();
    if (!uuid || basketBusy.value || disposed) return false;
    const request = quoteRequest;
    const key = basketKey.value;
    const user = userUuid.value;
    const controller = new AbortController();
    quoteController = controller;
    isCouponQuoting.value = true;
    isCouponQuoteFresh.value = false;
    couponError.value = "";

    try {
      const response = await $fetch<{
        row: Omit<CouponQuote, "basket">;
        basket: CouponBasketQuote;
      }>("/api/coupon/quote", {
        method: "POST",
        body: { user_coupon_uuid: uuid },
        signal: controller.signal,
      });
      if (
        request !== quoteRequest ||
        controller.signal.aborted ||
        disposed ||
        key !== basketKey.value ||
        user !== userUuid.value ||
        uuid !== selectedCouponUuid.value ||
        basketBusy.value
      )
        return false;
      if (
        response.row?.user_coupon_uuid !== uuid ||
        !Number.isFinite(Number(response.row.discount_amount)) ||
        Number(response.row.discount_amount) <= 0 ||
        !response.basket ||
        [
          "subtotal",
          "promotionDiscount",
          "merchandiseTotal",
          "totalQuantity",
          "distinctItems",
        ].some(
          (field) =>
            !Number.isFinite(
              Number(response.basket[field as keyof CouponBasketQuote]),
            ) || Number(response.basket[field as keyof CouponBasketQuote]) < 0,
        ) ||
        Number(response.row.discount_amount) >
          Number(response.basket.merchandiseTotal)
      )
        throw new Error("Invalid coupon quote");
      selectedCoupon.value = {
        ...response.row,
        discount_amount: Number(response.row.discount_amount),
        basket: {
          subtotal: Number(response.basket.subtotal),
          promotionDiscount: Number(response.basket.promotionDiscount),
          merchandiseTotal: Number(response.basket.merchandiseTotal),
          totalQuantity: Number(response.basket.totalQuantity),
          distinctItems: Number(response.basket.distinctItems),
        },
      };
      isCouponQuoteFresh.value = true;
      couponNeedsReview.value = false;
      return true;
    } catch (error: any) {
      if (request !== quoteRequest || controller.signal.aborted || disposed)
        return false;
      const status = Number(
        error?.statusCode || error?.status || error?.response?.status,
      );
      const message =
        error?.data?.data?.message ||
        error?.data?.message ||
        error?.data?.statusMessage ||
        "ตรวจสอบคูปองไม่สำเร็จ กรุณาลองใหม่";
      if ([400, 403, 404, 409, 410, 422].includes(status)) {
        invalidateCoupon(message);
      } else {
        couponError.value = message;
      }
      return false;
    } finally {
      if (request === quoteRequest) {
        quoteController = null;
        isCouponQuoting.value = false;
      }
    }
  }

  async function refreshCoupons(): Promise<boolean> {
    listRequest += 1;
    const request = listRequest;
    listController?.abort();
    stopQuote();
    isCouponQuoteFresh.value = false;
    if (!userUuid.value || basketBusy.value || disposed) {
      isCouponsLoading.value = false;
      return false;
    }
    const controller = new AbortController();
    listController = controller;
    const key = basketKey.value;
    const user = userUuid.value;
    isCouponsLoading.value = true;
    couponError.value = couponNeedsReview.value ? couponError.value : "";

    try {
      const response = await $fetch<CouponResponse>("/api/user/coupons", {
        signal: controller.signal,
      });
      if (
        request !== listRequest ||
        controller.signal.aborted ||
        disposed ||
        key !== basketKey.value ||
        user !== userUuid.value ||
        basketBusy.value
      )
        return false;
      ownedCoupons.value = response.rows || [];
      claimableCoupons.value = response.claimableRows || [];
      eligibleCouponCount.value = Number(response.eligibleCount || 0);
      claimableCouponCount.value = Number(response.claimableCount || 0);
      areCouponsLoaded.value = true;

      const uuid = selectedCouponUuid.value;
      if (uuid) {
        const coupon = ownedCoupons.value.find(
          (row) => row.user_coupon_uuid === uuid,
        );
        if (!coupon?.eligible) {
          invalidateCoupon(
            coupon?.ineligible_reason ||
              "คูปองที่เลือกไม่สามารถใช้กับตะกร้านี้ได้แล้ว",
          );
          return false;
        }
        return await quoteCoupon(uuid);
      }
      return !couponNeedsReview.value;
    } catch (error: any) {
      if (request !== listRequest || controller.signal.aborted || disposed)
        return false;
      areCouponsLoaded.value = false;
      couponError.value =
        error?.data?.data?.message ||
        error?.data?.message ||
        error?.data?.statusMessage ||
        "โหลดคูปองไม่สำเร็จ กรุณาลองใหม่";
      return false;
    } finally {
      if (request === listRequest) {
        listController = null;
        isCouponsLoading.value = false;
      }
    }
  }

  async function selectCoupon(coupon: BasketCoupon): Promise<boolean> {
    if (
      !coupon.user_coupon_uuid ||
      !coupon.eligible ||
      couponBusy.value ||
      basketBusy.value
    )
      return false;
    couponNotice.value = "";
    selectedCouponUuid.value = coupon.user_coupon_uuid;
    selectedCoupon.value = null;
    return quoteCoupon(coupon.user_coupon_uuid);
  }

  async function claimCoupon(coupon: BasketCoupon): Promise<boolean> {
    if (claimingCouponUuid.value || coupon.claimed || disposed) return false;
    claimingCouponUuid.value = coupon.uuid;
    couponNotice.value = "";
    couponError.value = "";
    let succeeded = false;
    let claimError = "";
    try {
      const response = await $fetch<{ alreadyClaimed?: boolean }>(
        "/api/coupon/" + encodeURIComponent(coupon.uuid) + "/claim",
        { method: "POST", body: {} },
      );
      if (disposed) return false;
      succeeded = true;
      couponNotice.value = response.alreadyClaimed
        ? "คุณรับคูปองนี้แล้ว"
        : "รับคูปองเรียบร้อยแล้ว";
    } catch (error: any) {
      claimError =
        error?.data?.data?.message ||
        error?.data?.message ||
        error?.data?.statusMessage ||
        "รับคูปองไม่สำเร็จ กรุณาลองใหม่";
    } finally {
      if (!disposed) {
        // Refresh even after rejection: the last remaining right may have been claimed elsewhere.
        await refreshCoupons();
        if (claimError) couponError.value = claimError;
        claimingCouponUuid.value = "";
      }
    }
    return succeeded;
  }

  async function verifyCoupon(): Promise<boolean> {
    if (basketBusy.value || couponNeedsReview.value || couponBusy.value)
      return false;
    if (!selectedCouponUuid.value) return true;
    return quoteCoupon(selectedCouponUuid.value);
  }

  watch(
    [userUuid, basketKey, basketBusy],
    ([user], [previousUser]) => {
      if (!import.meta.client) return;
      if (user !== previousUser) {
        removeCoupon();
        ownedCoupons.value = [];
        claimableCoupons.value = [];
        eligibleCouponCount.value = 0;
        claimableCouponCount.value = 0;
        areCouponsLoaded.value = false;
      }
      void refreshCoupons();
    },
    { flush: "sync" },
  );

  onMounted(() => {
    void refreshCoupons();
  });
  onBeforeUnmount(() => {
    disposed = true;
    listRequest += 1;
    listController?.abort();
    stopQuote();
  });

  return {
    ownedCoupons,
    eligibleCoupons,
    claimableCoupons,
    eligibleCouponCount,
    claimableCouponCount,
    selectedCoupon,
    selectedCouponUuid,
    couponDiscount,
    couponOrderFields,
    couponError,
    couponNotice,
    isCouponsLoading,
    isCouponQuoting,
    areCouponsLoaded,
    claimingCouponUuid,
    couponBusy,
    couponNeedsReview,
    couponCheckoutBlocked,
    refreshCoupons,
    selectCoupon,
    claimCoupon,
    removeCoupon,
    verifyCoupon,
  };
}
