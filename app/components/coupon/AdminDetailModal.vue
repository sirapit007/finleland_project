<template>
  <dialog
    ref="dialog"
    class="modal"
    :aria-labelledby="titleId"
    @cancel.prevent="close"
    @close="onDialogClose"
  >
    <div
      class="modal-box flex max-h-[92dvh] w-11/12 max-w-5xl flex-col overflow-hidden p-0"
    >
      <header
        class="flex shrink-0 items-start justify-between gap-4 border-b border-base-300 px-5 py-4 sm:px-6"
      >
        <div class="min-w-0">
          <h2 :id="titleId" class="text-lg font-bold">
            {{ detail?.row.coupon_name || "รายละเอียดคูปอง" }}
          </h2>
          <p class="mt-1 text-sm text-base-content/60">
            ผู้ถือครอง ประวัติการใช้ และการแจกคูปอง
          </p>
        </div>
        <button
          type="button"
          class="btn btn-circle btn-ghost btn-sm"
          :disabled="distributing"
          aria-label="ปิดหน้าต่าง"
          @click="close"
        >
          <Icon name="lucide:x" size="18" />
        </button>
      </header>
      <div class="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
        <div
          v-if="loading && !detail"
          class="flex min-h-40 items-center justify-center gap-2"
          role="status"
        >
          <span class="loading loading-spinner loading-sm" />กำลังโหลดข้อมูล...
        </div>
        <div
          v-if="errorMessage"
          class="alert alert-error alert-soft text-sm"
          role="alert"
        >
          <span>{{ errorMessage }}</span
          ><button
            type="button"
            class="btn btn-xs"
            :disabled="busy"
            @click="loadDetail"
          >
            โหลดใหม่
          </button>
        </div>
        <div
          v-if="successMessage"
          class="alert alert-success alert-soft text-sm"
          role="status"
        >
          {{ successMessage }}
        </div>
        <template v-if="detail">
          <section class="grid gap-3 sm:grid-cols-3">
            <div class="rounded-xl border border-base-300 bg-base-200/40 p-4">
              <p class="text-xs text-base-content/55">ส่วนลด</p>
              <p class="mt-1 text-xl font-bold text-primary">
                {{ couponDiscountLabel(detail.row) }}
              </p>
              <p v-if="detail.row.coupon_max_discount" class="mt-1 text-xs">
                สูงสุด {{ couponMoney(detail.row.coupon_max_discount) }} บาท
              </p>
            </div>
            <div class="rounded-xl border border-base-300 bg-base-200/40 p-4">
              <p class="text-xs text-base-content/55">จำนวนผู้รับ</p>
              <p class="mt-1 text-xl font-bold">
                {{ couponMoney(detail.row.coupon_issued_count) }} /
                {{ couponMoney(detail.row.coupon_recipient_limit) }} คน
              </p>
              <p class="mt-1 text-xs text-base-content/60">
                เหลือ {{ couponMoney(remaining) }} สิทธิ์สำหรับผู้รับใหม่
              </p>
            </div>
            <div class="rounded-xl border border-base-300 bg-base-200/40 p-4">
              <p class="text-xs text-base-content/55">ใช้คูปองแล้ว</p>
              <p class="mt-1 text-xl font-bold">
                {{ couponMoney(detail.row.coupon_usage_count) }} ครั้ง
              </p>
              <p class="mt-1 text-xs text-base-content/60">
                ใช้ได้คนละ {{ detail.row.coupon_usage_limit }} ครั้ง
              </p>
            </div>
          </section>
          <section
            class="space-y-2 rounded-xl border border-base-300 p-4 text-sm"
          >
            <div class="flex flex-wrap gap-2">
              <span class="badge badge-soft">{{
                couponStatusLabels[detail.row.coupon_status]
              }}</span
              ><span class="badge badge-soft">{{
                couponDistributionLabels[detail.row.coupon_distribution_method]
              }}</span
              ><span v-if="expired" class="badge badge-error badge-soft"
                >หมดอายุแล้ว</span
              >
            </div>
            <p
              v-if="detail.row.coupon_description"
              class="whitespace-pre-line text-base-content/70"
            >
              {{ detail.row.coupon_description }}
            </p>
            <p>
              ยอดซื้อขั้นต่ำ
              {{ couponMoney(detail.row.coupon_min_purchase_amount) }} บาท ·
              ขั้นต่ำ {{ detail.row.coupon_min_quantity }} ชิ้น /
              {{ detail.row.coupon_min_items }} รายการ
            </p>
            <p class="text-base-content/65">
              {{
                detail.row.coupon_expires_at
                  ? `หมดอายุ ${couponDate(detail.row.coupon_expires_at)} (ประเทศไทย)`
                  : "ไม่มีวันหมดอายุ"
              }}
            </p>
          </section>

          <section
            v-if="
              ['random', 'manual'].includes(
                detail.row.coupon_distribution_method,
              )
            "
            class="rounded-xl border border-primary/20 bg-primary/5 p-4"
          >
            <h3 class="font-semibold">
              {{
                detail.row.coupon_distribution_method === "random"
                  ? "สุ่มแจกคูปอง"
                  : "เลือกสมาชิกเพื่อแจกคูปอง"
              }}
            </h3>
            <p class="mt-1 text-xs leading-5 text-base-content/65">
              แจกให้สมาชิกที่ยังไม่เคยได้รับคูปองนี้
              การแจกสำเร็จจะใช้โควตาผู้รับทันที
            </p>
            <p v-if="!canDistribute" class="mt-3 text-sm text-base-content/65">
              {{ distributionUnavailableReason }}
            </p>
            <form v-else class="mt-3 space-y-3" @submit.prevent="distribute">
              <label
                v-if="detail.row.coupon_distribution_method === 'random'"
                class="fieldset max-w-xs"
                ><span class="fieldset-legend"
                  >จำนวนผู้รับในการสุ่มครั้งนี้ (คน)</span
                ><input
                  v-model.number="distributionCount"
                  type="number"
                  min="1"
                  :max="Math.min(remaining, 500)"
                  step="1"
                  required
                  class="input input-sm w-full"
                  :disabled="busy"
              /></label>
              <div v-else class="space-y-2">
                <p class="text-xs font-semibold">
                  ค้นหาสมาชิกด้วยชื่อ อีเมล หรือเบอร์โทร
                </p>
                <MultiComboBox
                  v-if="isOpen"
                  :key="`${couponUuid}-${selectorVersion}`"
                  v-model="selectedUsers"
                  fetch-url="/api/user?role=User"
                  label="email"
                  value="uuid"
                  placeholder="เลือกสมาชิกผู้รับคูปอง..."
                  :max="Math.min(remaining, 500)"
                  :disabled="busy"
                  @change="onSelectedUsers"
                />
                <p
                  v-if="selectedUsers.length"
                  class="text-xs text-base-content/65"
                >
                  เลือกแล้ว {{ selectedUsers.length }} คน
                </p>
                <p v-if="selectedHolderCount" class="text-xs text-warning">
                  {{ selectedHolderCount }} คนที่เลือกได้รับคูปองนี้แล้ว
                  กรุณานำออกก่อนแจก
                </p>
              </div>
              <div
                class="flex flex-wrap items-center justify-between gap-3 border-t border-primary/15 pt-3"
              >
                <p class="text-xs text-base-content/60">
                  {{
                    detail.row.coupon_distribution_method === "random"
                      ? "ระบบจะสุ่มจากสมาชิกที่มีสิทธิ์รับคูปอง"
                      : selectedNames.join(", ") || "ยังไม่ได้เลือกผู้รับ"
                  }}
                </p>
                <button
                  type="submit"
                  class="btn btn-primary btn-sm shrink-0"
                  :disabled="
                    busy ||
                    !requestCount ||
                    requestCount > Math.min(remaining, 500) ||
                    selectedHolderCount > 0
                  "
                >
                  <span
                    v-if="distributing"
                    class="loading loading-spinner loading-xs"
                  /><Icon v-else name="lucide:gift" size="16" />{{
                    distributing
                      ? "กำลังแจกคูปอง..."
                      : `${detail.row.coupon_distribution_method === "random" ? "สุ่มแจก" : "แจกคูปองให้"} ${requestCount || 0} คน`
                  }}
                </button>
              </div>
            </form>
          </section>

          <section>
            <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div
                class="tabs tabs-border"
                role="tablist"
                aria-label="ข้อมูลคูปอง"
              >
                <button
                  :id="holdersTabId"
                  type="button"
                  role="tab"
                  :aria-selected="activeTab === 'holders'"
                  :aria-controls="panelId"
                  class="tab"
                  :class="{ 'tab-active': activeTab === 'holders' }"
                  @click="activeTab = 'holders'"
                >
                  ผู้ถือครอง ({{ detail.holderTotal }})
                </button>
                <button
                  :id="usagesTabId"
                  type="button"
                  role="tab"
                  :aria-selected="activeTab === 'usages'"
                  :aria-controls="panelId"
                  class="tab"
                  :class="{ 'tab-active': activeTab === 'usages' }"
                  @click="activeTab = 'usages'"
                >
                  ประวัติการใช้ ({{ detail.usageTotal }})
                </button>
              </div>
              <button
                type="button"
                class="btn btn-ghost btn-sm"
                :disabled="busy"
                @click="loadDetail"
              >
                <Icon
                  name="lucide:refresh-cw"
                  size="15"
                  :class="{ 'animate-spin': loading }"
                />อัปเดตข้อมูล
              </button>
            </div>
            <div
              :id="panelId"
              role="tabpanel"
              :aria-labelledby="
                activeTab === 'holders' ? holdersTabId : usagesTabId
              "
              class="overflow-x-auto rounded-xl border border-base-300"
              :aria-busy="loading"
            >
              <table v-if="activeTab === 'holders'" class="table table-sm">
                <thead>
                  <tr>
                    <th>สมาชิก</th>
                    <th>วันที่ได้รับ</th>
                    <th>ใช้แล้ว / ใช้ได้</th>
                    <th>สถานะสิทธิ์</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="holder in detail.holders"
                    :key="String(holder.user_coupon_uuid || holder.uuid)"
                  >
                    <td>
                      <p class="font-medium">{{ userName(holder) }}</p>
                      <p class="text-xs text-base-content/55">
                        {{ holder.email }}
                      </p>
                    </td>
                    <td class="whitespace-nowrap">
                      {{
                        couponDate(
                          holder.user_coupon_granted_at || holder.created_at,
                        )
                      }}
                    </td>
                    <td>
                      {{ holder.user_coupon_used_count || 0 }} /
                      {{ detail.row.coupon_usage_limit }} ครั้ง
                    </td>
                    <td>
                      <span
                        class="badge badge-sm badge-soft"
                        :class="
                          Number(holder.user_coupon_used_count || 0) >=
                          Number(detail.row.coupon_usage_limit)
                            ? 'badge-neutral'
                            : expired
                              ? 'badge-warning'
                              : 'badge-success'
                        "
                        >{{
                          Number(holder.user_coupon_used_count || 0) >=
                          Number(detail.row.coupon_usage_limit)
                            ? "ใช้ครบแล้ว"
                            : expired
                              ? "หมดอายุ"
                              : "มีสิทธิ์คงเหลือ"
                        }}</span
                      >
                    </td>
                  </tr>
                  <tr v-if="!detail.holders.length">
                    <td
                      colspan="4"
                      class="py-10 text-center text-base-content/55"
                    >
                      ยังไม่มีผู้ได้รับคูปองนี้
                    </td>
                  </tr>
                </tbody>
              </table>
              <table v-else class="table table-sm">
                <thead>
                  <tr>
                    <th>คำสั่งซื้อ / สมาชิก</th>
                    <th>ส่วนลด</th>
                    <th>การใช้สิทธิ์</th>
                    <th>วันที่ใช้</th>
                    <th>วันที่คืนสิทธิ์</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="usage in detail.usages"
                    :key="String(usage.uuid || usage.id)"
                  >
                    <td>
                      <NuxtLink
                        v-if="orderUuid(usage)"
                        :to="`/admin/orders/${encodeURIComponent(orderUuid(usage))}/quotation`"
                        class="font-semibold text-primary underline underline-offset-2"
                        @click="close"
                        >{{ usage.order_number || "ดูคำสั่งซื้อ" }}</NuxtLink
                      >
                      <p v-else class="font-medium">
                        {{ usage.order_number || "—" }}
                      </p>
                      <p class="mt-1 text-xs text-base-content/65">
                        {{ userName(usage) }}
                      </p>
                      <p
                        v-if="orderState(usage)"
                        class="mt-1 text-xs text-base-content/55"
                      >
                        {{ orderState(usage) }}
                      </p>
                    </td>
                    <td class="whitespace-nowrap">
                      {{ couponMoney(usage.usage_discount_amount) }} บาท
                    </td>
                    <td>
                      <span
                        class="badge badge-sm badge-soft"
                        :class="
                          usage.usage_status === 'returned'
                            ? 'badge-info'
                            : 'badge-success'
                        "
                        >{{
                          usage.usage_status === "returned"
                            ? "คืนสิทธิ์แล้ว"
                            : "ใช้แล้ว"
                        }}</span
                      >
                    </td>
                    <td class="whitespace-nowrap">
                      {{ couponDate(usage.usage_used_at || usage.created_at) }}
                    </td>
                    <td class="whitespace-nowrap">
                      {{ couponDate(usage.usage_returned_at) }}
                    </td>
                  </tr>
                  <tr v-if="!detail.usages.length">
                    <td
                      colspan="5"
                      class="py-10 text-center text-base-content/55"
                    >
                      ยังไม่มีประวัติการใช้คูปองนี้
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div
              v-if="historyTotal > detailPageSize"
              class="mt-3 flex items-center justify-between gap-3 text-xs"
            >
              <p class="text-base-content/60">
                หน้า {{ historyPage }} / {{ historyPages }} · ทั้งหมด
                {{ historyTotal }} รายการ
              </p>
              <div class="flex gap-2">
                <button
                  type="button"
                  class="btn btn-sm btn-ghost"
                  :disabled="busy || historyPage <= 1"
                  @click="changeHistoryPage(-1)"
                >
                  ก่อนหน้า
                </button>
                <button
                  type="button"
                  class="btn btn-sm btn-ghost"
                  :disabled="busy || historyPage >= historyPages"
                  @click="changeHistoryPage(1)"
                >
                  ถัดไป
                </button>
              </div>
            </div>
          </section>
        </template>
      </div>
    </div>
  </dialog>
</template>

<script setup lang="ts">
import {
  couponMoney,
  couponDate,
  couponError,
  couponDiscountLabel,
  couponDistributionLabels,
  couponStatusLabels,
  type AdminCouponRow,
} from "~/utils/adminCoupon";

type DetailRecord = Record<string, unknown>;
type CouponDetail = {
  row: AdminCouponRow;
  holders: DetailRecord[];
  usages: DetailRecord[];
  holderTotal: number;
  usageTotal: number;
};
const emit = defineEmits<{ changed: [] }>();
const dialog = ref<HTMLDialogElement | null>(null);
const titleId = useId();
const holdersTabId = useId();
const usagesTabId = useId();
const panelId = useId();
const detail = ref<CouponDetail | null>(null);
const couponUuid = ref("");
const isOpen = ref(false);
const loading = ref(false);
const distributing = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const activeTab = ref<"holders" | "usages">("holders");
const distributionCount = ref(1);
const selectedUsers = ref<string[]>([]);
const selectedRows = ref<DetailRecord[]>([]);
const selectorVersion = ref(0);
const holderPage = ref(1);
const usagePage = ref(1);
const detailPageSize = 20;
const historyPage = computed(() =>
  activeTab.value === "holders" ? holderPage.value : usagePage.value,
);
const historyTotal = computed(() =>
  activeTab.value === "holders"
    ? Number(detail.value?.holderTotal || 0)
    : Number(detail.value?.usageTotal || 0),
);
const historyPages = computed(() =>
  Math.max(1, Math.ceil(historyTotal.value / detailPageSize)),
);
async function changeHistoryPage(delta: number) {
  if (busy.value) return;
  const next = Math.min(
    historyPages.value,
    Math.max(1, historyPage.value + delta),
  );
  if (activeTab.value === "holders") holderPage.value = next;
  else usagePage.value = next;
  await loadDetail();
}
let requestId = 0;
const busy = computed(() => loading.value || distributing.value);
const remaining = computed(() =>
  Math.max(
    0,
    Number(detail.value?.row.coupon_recipient_limit || 0) -
      Number(detail.value?.row.coupon_issued_count || 0),
  ),
);
const expired = computed(() =>
  Boolean(
    detail.value?.row.coupon_expires_at &&
    new Date(detail.value.row.coupon_expires_at).getTime() <= Date.now(),
  ),
);
const canDistribute = computed(
  () =>
    detail.value?.row.coupon_status === "active" &&
    remaining.value > 0 &&
    !expired.value,
);
const distributionUnavailableReason = computed(() =>
  expired.value
    ? "คูปองหมดอายุแล้ว จึงไม่สามารถแจกเพิ่มได้"
    : remaining.value <= 0
      ? "แจกครบจำนวนผู้รับแล้ว"
      : "เปิดสถานะเป็น “เปิดแจก” ก่อนแจกคูปอง",
);
const requestCount = computed(() =>
  detail.value?.row.coupon_distribution_method === "random"
    ? Number(distributionCount.value)
    : selectedUsers.value.length,
);
const selectedHolderCount = computed(() => {
  const holders = new Set(
    detail.value?.holders.map((row) =>
      String(row.user_coupon_user || row.user_uuid || ""),
    ) || [],
  );
  return selectedUsers.value.filter((uuid) => holders.has(uuid)).length;
});
const selectedNames = computed(() => selectedRows.value.map(userName));
function userName(row: DetailRecord) {
  return (
    [row.firstname, row.lastname].filter(Boolean).join(" ").trim() ||
    String(row.email || "สมาชิก")
  );
}
const orderStatusLabels: Record<string, string> = {
  pending: "รอตรวจสอบ",
  confirmed: "ยืนยันแล้ว",
  processing: "กำลังเตรียมสินค้า",
  ready_for_pickup: "พร้อมรับสินค้า",
  shipped: "กำลังจัดส่ง",
  completed: "สำเร็จ",
  canceled: "ยกเลิก",
};
const orderPaymentLabels: Record<string, string> = {
  unpaid: "ยังไม่ชำระ",
  pending: "รอตรวจสอบการชำระ",
  paid: "ชำระแล้ว",
  failed: "ชำระไม่สำเร็จ",
  refunded: "คืนเงินแล้ว",
};
function orderState(row: DetailRecord) {
  return [
    orderStatusLabels[String(row.order_status)],
    orderPaymentLabels[String(row.order_payment_status)],
  ]
    .filter(Boolean)
    .join(" · ");
}
function orderUuid(row: DetailRecord) {
  return String(row.order_uuid || row.usage_order || "");
}
function onSelectedUsers(_values: string[], rows: DetailRecord[]) {
  selectedRows.value = rows;
}
function close() {
  if (!distributing.value) {
    isOpen.value = false;
    requestId += 1;
    loading.value = false;
    dialog.value?.close();
  }
}
function onDialogClose() {
  isOpen.value = false;
  requestId += 1;
  loading.value = false;
}
async function loadDetail() {
  if (!couponUuid.value) return;
  const currentRequest = ++requestId;
  loading.value = true;
  errorMessage.value = "";
  try {
    const response = await $fetch<CouponDetail>(
      `/api/coupon/${encodeURIComponent(couponUuid.value)}`,
      {
        query: {
          holderPage: holderPage.value,
          usagePage: usagePage.value,
          pageSize: detailPageSize,
        },
      },
    );
    if (currentRequest !== requestId) return;
    detail.value = {
      row: response.row,
      holders: response.holders || [],
      usages: response.usages || [],
      holderTotal: Number(
        response.holderTotal ??
          response.row.coupon_issued_count ??
          response.holders?.length ??
          0,
      ),
      usageTotal: Number(response.usageTotal ?? response.usages?.length ?? 0),
    };
    distributionCount.value = Math.max(
      1,
      Math.min(Number(distributionCount.value) || 1, remaining.value),
    );
  } catch (error) {
    if (currentRequest === requestId)
      errorMessage.value = couponError(
        error,
        "โหลดรายละเอียดคูปองไม่สำเร็จ กรุณาลองอีกครั้ง",
      );
  } finally {
    if (currentRequest === requestId) loading.value = false;
  }
}
async function onOpen(row: AdminCouponRow) {
  if (!row.uuid) return;
  requestId += 1;
  couponUuid.value = row.uuid;
  holderPage.value = 1;
  usagePage.value = 1;
  detail.value = null;
  selectedUsers.value = [];
  selectedRows.value = [];
  distributionCount.value = 1;
  activeTab.value = "holders";
  errorMessage.value = "";
  successMessage.value = "";
  isOpen.value = true;
  dialog.value?.showModal();
  await loadDetail();
}
async function distribute() {
  if (
    busy.value ||
    !canDistribute.value ||
    !Number.isInteger(requestCount.value) ||
    requestCount.value < 1 ||
    requestCount.value > Math.min(remaining.value, 500) ||
    selectedHolderCount.value > 0
  )
    return;
  distributing.value = true;
  successMessage.value = "";
  errorMessage.value = "";
  try {
    const response = await $fetch<{ count: number }>(
      `/api/coupon/${encodeURIComponent(couponUuid.value)}/distribute`,
      {
        method: "post",
        body:
          detail.value?.row.coupon_distribution_method === "random"
            ? { count: requestCount.value }
            : { userUuids: selectedUsers.value },
      },
    );
    successMessage.value =
      Number(response.count) > 0
        ? `แจกคูปองสำเร็จ ${response.count} คน`
        : "ไม่มีสมาชิกที่ได้รับคูปองเพิ่ม กรุณาตรวจสอบรายชื่อผู้รับ";
    selectedUsers.value = [];
    selectedRows.value = [];
    selectorVersion.value += 1;
    holderPage.value = 1;
    emit("changed");
    await loadDetail();
  } catch (error) {
    const message = couponError(
      error,
      "แจกคูปองไม่สำเร็จ กรุณาตรวจสอบรายชื่อผู้รับก่อนลองใหม่",
    );
    await loadDetail();
    errorMessage.value = message;
  } finally {
    distributing.value = false;
  }
}
defineExpose({ onOpen });
onBeforeUnmount(() => {
  requestId += 1;
});
</script>
