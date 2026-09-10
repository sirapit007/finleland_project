<template>
  <dialog
    ref="dialog"
    class="modal"
    aria-labelledby="coupon-modal-title"
    @close="emit('update:modelValue', false)"
  >
    <div class="modal-box max-w-2xl p-0">
      <div
        class="flex items-start justify-between gap-3 border-b border-base-300 px-5 py-4 sm:px-6"
      >
        <div>
          <h2 id="coupon-modal-title" class="text-xl font-bold">
            ใส่คูปองส่วนลด
          </h2>
          <p class="mt-1 text-sm text-base-content/60">
            เลือกใช้ได้ 1 คูปองต่อคำสั่งซื้อ หลังส่วนลดโปรโมชั่นสินค้า
          </p>
        </div>
        <button
          type="button"
          class="btn btn-circle btn-ghost btn-sm shrink-0"
          aria-label="ปิดหน้าคูปอง"
          @click="close"
        >
          <Icon name="lucide:x" size="18" />
        </button>
      </div>

      <div class="max-h-[70vh] space-y-4 overflow-y-auto p-5 sm:p-6">
        <div
          class="tabs tabs-box grid grid-cols-2"
          role="tablist"
          aria-label="รายการคูปอง"
        >
          <button
            id="owned-coupons-tab"
            type="button"
            role="tab"
            :aria-selected="activeTab === 'owned'"
            aria-controls="coupon-list"
            class="tab gap-2"
            :class="{ 'tab-active': activeTab === 'owned' }"
            @click="activeTab = 'owned'"
          >
            คูปองของฉัน
            <span class="badge badge-sm">{{ eligibleCoupons.length }}</span>
          </button>
          <button
            id="claim-coupons-tab"
            type="button"
            role="tab"
            :aria-selected="activeTab === 'claim'"
            aria-controls="coupon-list"
            class="tab gap-2"
            :class="{ 'tab-active': activeTab === 'claim' }"
            @click="activeTab = 'claim'"
          >
            รับคูปองเพิ่ม
            <span class="badge badge-sm">{{ claimableCount }}</span>
          </button>
        </div>

        <p
          v-if="notice"
          role="status"
          class="rounded-lg bg-success/10 px-3 py-2 text-sm text-success"
        >
          {{ notice }}
        </p>
        <div
          v-if="error"
          role="alert"
          class="space-y-2 rounded-lg bg-warning/10 px-3 py-3 text-sm"
        >
          <p>{{ error }}</p>
          <button
            type="button"
            class="btn btn-ghost btn-xs"
            :disabled="busy"
            @click="emit('refresh')"
          >
            <Icon name="lucide:refresh-cw" size="14" /> ลองใหม่
          </button>
        </div>

        <div
          class="flex items-center justify-between gap-3 text-xs text-base-content/60"
        >
          <p>
            {{
              activeTab === "owned"
                ? "แสดงคูปองที่ใช้กับตะกร้านี้ได้ เรียงตามส่วนลดมากที่สุด"
                : "รับเก็บไว้ก่อนได้ แม้ตะกร้ายังไม่ครบเงื่อนไข"
            }}
          </p>
          <button
            type="button"
            class="btn btn-ghost btn-xs shrink-0"
            :disabled="busy"
            @click="emit('refresh')"
          >
            <Icon name="lucide:refresh-cw" size="14" /> อัปเดต
          </button>
        </div>

        <div
          v-if="loading"
          role="status"
          aria-label="กำลังโหลดคูปอง"
          class="space-y-3"
        >
          <div
            v-for="index in 2"
            :key="index"
            class="skeleton h-40 w-full rounded-xl"
          />
        </div>
        <div
          v-else
          id="coupon-list"
          role="tabpanel"
          :aria-labelledby="
            activeTab === 'owned' ? 'owned-coupons-tab' : 'claim-coupons-tab'
          "
          class="space-y-3"
        >
          <div v-if="!visibleCoupons.length" class="py-8 text-center">
            <Icon
              name="lucide:ticket"
              size="36"
              class="mb-3 text-base-content/30"
            />
            <p class="font-semibold">
              {{
                activeTab === "owned"
                  ? "ยังไม่มีคูปองที่ใช้กับตะกร้านี้ได้"
                  : "ยังไม่มีคูปองเปิดให้รับเพิ่ม"
              }}
            </p>
            <p class="mt-2 text-sm text-base-content/60">
              {{
                activeTab === "owned"
                  ? "ลองดูคูปองในแท็บรับคูปองเพิ่ม หรือเพิ่มสินค้าให้ครบเงื่อนไข"
                  : "กลับมาตรวจสอบคูปองใหม่ได้ในภายหลัง"
              }}
            </p>
          </div>

          <article
            v-for="coupon in visibleCoupons"
            :key="coupon.uuid"
            class="overflow-hidden rounded-xl border"
            :class="
              holdingFor(coupon)?.user_coupon_uuid === selectedUuid
                ? 'border-primary bg-primary/5'
                : 'border-base-300'
            "
          >
            <div class="flex gap-4 p-4">
              <div
                class="flex w-20 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 p-2 text-center text-primary sm:w-24"
              >
                <Icon name="lucide:ticket-percent" size="24" />
                <p
                  class="mt-2 max-w-full break-all text-xl font-bold leading-tight"
                >
                  {{
                    coupon.coupon_discount_type === "percent"
                      ? formatNumber(coupon.coupon_discount_value) + "%"
                      : "฿" + formatNumber(coupon.coupon_discount_value)
                  }}
                </p>
                <span class="text-xs">ส่วนลด</span>
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-start justify-between gap-2">
                  <h3 class="font-bold">{{ coupon.coupon_name }}</h3>
                  <span
                    v-if="activeTab === 'claim' && isClaimed(coupon)"
                    class="badge badge-success badge-soft badge-sm"
                    >รับแล้ว</span
                  >
                </div>
                <p
                  v-if="coupon.coupon_description"
                  class="mt-1 text-sm text-base-content/60"
                >
                  {{ coupon.coupon_description }}
                </p>
                <p class="mt-2 text-sm">{{ conditionsFor(coupon) }}</p>
                <p
                  v-if="
                    coupon.coupon_discount_type === 'percent' &&
                    Number(coupon.coupon_max_discount) > 0
                  "
                  class="mt-1 text-xs text-base-content/60"
                >
                  ลดสูงสุด ฿{{ formatPrice(coupon.coupon_max_discount || 0) }}
                </p>
                <p class="mt-1 text-xs text-base-content/60">
                  {{ expiryFor(coupon) }}
                </p>
                <p class="mt-1 text-xs text-base-content/60">
                  ใช้ได้ {{ coupon.coupon_usage_limit }} ครั้งต่อคน · รับได้คนละ
                  1 สิทธิ์
                </p>
              </div>
            </div>
            <div
              class="flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-base-300 px-4 py-3"
            >
              <div class="min-w-0 flex-1 text-xs text-base-content/65">
                <template v-if="activeTab === 'claim' && !isClaimed(coupon)">
                  <p>
                    เหลือ
                    {{
                      Math.max(
                        Number(coupon.coupon_recipient_limit) -
                          Number(coupon.coupon_issued_count),
                        0,
                      ).toLocaleString("th-TH")
                    }}
                    สิทธิ์
                  </p>
                  <p
                    v-if="!coupon.eligible && coupon.ineligible_reason"
                    class="mt-1"
                  >
                    {{ coupon.ineligible_reason }}
                  </p>
                </template>
                <template v-else-if="holdingFor(coupon)?.eligible">
                  <p class="font-semibold text-success">
                    ตะกร้านี้ลด ฿{{
                      formatPrice(holdingFor(coupon)?.discount_amount || 0)
                    }}
                  </p>
                  <p class="mt-1">
                    ใช้ไปแล้ว
                    {{ holdingFor(coupon)?.user_coupon_used_count || 0 }}/{{
                      coupon.coupon_usage_limit
                    }}
                    ครั้ง
                  </p>
                </template>
                <p v-else>
                  {{
                    holdingFor(coupon)?.ineligible_reason ||
                    coupon.ineligible_reason ||
                    "รับแล้ว แต่ยังใช้กับตะกร้านี้ไม่ได้"
                  }}
                </p>
              </div>

              <button
                v-if="activeTab === 'claim' && !isClaimed(coupon)"
                type="button"
                class="btn btn-primary btn-sm shrink-0"
                :disabled="
                  busy ||
                  Number(coupon.coupon_issued_count) >=
                    Number(coupon.coupon_recipient_limit)
                "
                @click="emit('claim', coupon)"
              >
                <span
                  v-if="claimingUuid === coupon.uuid"
                  class="loading loading-spinner loading-xs"
                />
                <Icon v-else name="lucide:plus" size="15" />
                รับคูปอง
              </button>
              <button
                v-else
                type="button"
                class="btn btn-sm shrink-0"
                :class="
                  holdingFor(coupon)?.user_coupon_uuid === selectedUuid
                    ? 'btn-outline btn-primary'
                    : 'btn-primary'
                "
                :disabled="busy || !holdingFor(coupon)?.eligible"
                @click="selectOwnedCoupon(coupon)"
              >
                <Icon
                  v-if="holdingFor(coupon)?.user_coupon_uuid === selectedUuid"
                  name="lucide:check"
                  size="15"
                />
                {{
                  holdingFor(coupon)?.user_coupon_uuid === selectedUuid
                    ? "เลือกแล้ว"
                    : holdingFor(coupon)?.eligible
                      ? "ใช้คูปองนี้"
                      : "รับแล้ว"
                }}
              </button>
            </div>
          </article>
        </div>

        <p class="text-center text-xs text-base-content/50">
          ระบบจะนับการใช้คูปองเมื่อสร้างคำสั่งซื้อสำเร็จ
        </p>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop"><button>ปิด</button></form>
  </dialog>
</template>

<script setup lang="ts">
import type { BasketCoupon } from "~/composables/useBasketCoupons";

const props = defineProps<{
  modelValue: boolean;
  ownedCoupons: BasketCoupon[];
  eligibleCoupons: BasketCoupon[];
  claimableCoupons: BasketCoupon[];
  claimableCount: number;
  selectedUuid: string;
  loading: boolean;
  busy: boolean;
  claimingUuid: string;
  error: string;
  notice: string;
}>();
const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  select: [coupon: BasketCoupon];
  claim: [coupon: BasketCoupon];
  refresh: [];
}>();
const dialog = ref<HTMLDialogElement | null>(null);
const activeTab = ref<"owned" | "claim">("owned");
const visibleCoupons = computed(() =>
  activeTab.value === "owned" ? props.eligibleCoupons : props.claimableCoupons,
);
const holdingFor = (coupon: BasketCoupon) =>
  props.ownedCoupons.find((owned) => owned.uuid === coupon.uuid) ||
  (coupon.user_coupon_uuid ? coupon : undefined);
const isClaimed = (coupon: BasketCoupon) =>
  Boolean(coupon.claimed || holdingFor(coupon));
const formatNumber = (value: number | string) =>
  Number(value || 0).toLocaleString("th-TH", { maximumFractionDigits: 2 });
const formatPrice = (value: number | string) =>
  Number(value || 0).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const expiryFor = (coupon: BasketCoupon) => {
  if (!coupon.coupon_expires_at) return "ไม่มีวันหมดอายุ";
  const date = new Date(coupon.coupon_expires_at);
  return Number.isFinite(date.getTime())
    ? "ใช้ได้ถึง " +
        date.toLocaleString("th-TH", {
          dateStyle: "medium",
          timeStyle: "short",
        })
    : "ตรวจสอบวันหมดอายุก่อนใช้งาน";
};
const conditionsFor = (coupon: BasketCoupon) => {
  const conditions = [];
  if (Number(coupon.coupon_min_purchase_amount))
    conditions.push(
      "ยอดซื้อขั้นต่ำ ฿" + formatPrice(coupon.coupon_min_purchase_amount),
    );
  if (Number(coupon.coupon_min_quantity))
    conditions.push("ซื้ออย่างน้อย " + coupon.coupon_min_quantity + " ชิ้น");
  if (Number(coupon.coupon_min_items))
    conditions.push("อย่างน้อย " + coupon.coupon_min_items + " รายการสินค้า");
  return conditions.join(" และ ") || "ไม่มีขั้นต่ำ";
};
const close = () => {
  dialog.value?.close();
  emit("update:modelValue", false);
};
const selectOwnedCoupon = (coupon: BasketCoupon) => {
  const owned = holdingFor(coupon);
  if (owned?.eligible) emit("select", owned);
};
watch(
  () => props.modelValue,
  async (open) => {
    await nextTick();
    if (open) {
      activeTab.value =
        !props.eligibleCoupons.length && props.claimableCount
          ? "claim"
          : "owned";
      if (!dialog.value?.open) dialog.value?.showModal();
    } else {
      dialog.value?.close();
    }
  },
);
</script>
