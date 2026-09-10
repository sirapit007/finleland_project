<template>
  <dialog
    ref="dialog"
    class="modal"
    :aria-labelledby="titleId"
    @cancel.prevent="close"
    @close="onDialogClose"
  >
    <div
      class="modal-box flex max-h-[92dvh] w-11/12 max-w-3xl flex-col overflow-hidden p-0"
    >
      <header
        class="flex shrink-0 items-start justify-between gap-4 border-b border-base-300 px-5 py-4 sm:px-6"
      >
        <div>
          <h2 :id="titleId" class="text-lg font-bold">
            {{ form.uuid ? "แก้ไขคูปองส่วนลด" : "เพิ่มคูปองส่วนลด" }}
          </h2>
          <p class="mt-1 text-sm text-base-content/60">
            กำหนดส่วนลด เงื่อนไข และวิธีรับคูปอง
          </p>
        </div>
        <button
          type="button"
          class="btn btn-circle btn-ghost btn-sm"
          :disabled="saving"
          aria-label="ปิดหน้าต่าง"
          @click="close"
        >
          <Icon name="lucide:x" size="18" />
        </button>
      </header>

      <form
        :id="formId"
        ref="formElement"
        class="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6"
        @submit.prevent="onSubmit"
      >
        <div
          v-if="loading"
          class="flex items-center gap-2 text-sm"
          role="status"
        >
          <span
            class="loading loading-spinner loading-xs"
          />กำลังโหลดข้อมูลล่าสุด...
        </div>
        <div
          v-if="locked"
          class="rounded-xl border border-info/20 bg-info/5 p-3 text-sm text-base-content/70"
        >
          แจกแล้ว {{ form.coupon_issued_count }} คน
          จึงล็อกส่วนลดและเงื่อนไขเพื่อรักษาสิทธิ์ผู้รับ สามารถแก้ชื่อ
          รายละเอียด สถานะ และจำนวนผู้รับได้
        </div>
        <section class="grid gap-4 sm:grid-cols-2">
          <label class="fieldset sm:col-span-2"
            ><span class="fieldset-legend"
              >ชื่อคูปอง <span class="text-error">*</span></span
            ><input
              v-model="form.coupon_name"
              class="input input-sm w-full"
              maxlength="200"
              required
              :disabled="busy"
              placeholder="เช่น คูปองต้อนรับสมาชิกใหม่"
          /></label>
          <label class="fieldset sm:col-span-2"
            ><span class="fieldset-legend">รายละเอียด</span
            ><textarea
              v-model="form.coupon_description"
              class="textarea textarea-sm min-h-20 w-full"
              maxlength="2000"
              :disabled="busy"
              placeholder="รายละเอียดที่ผู้รับคูปองควรทราบ"
            />
          </label>
          <label class="fieldset"
            ><span class="fieldset-legend">ประเภทส่วนลด</span
            ><select
              v-model="form.coupon_discount_type"
              class="select select-sm w-full"
              :disabled="busy || locked"
            >
              <option value="amount">จำนวนเงิน (บาท)</option>
              <option value="percent">เปอร์เซ็นต์ (%)</option>
            </select></label
          >
          <label class="fieldset"
            ><span class="fieldset-legend"
              >ส่วนลด ({{
                form.coupon_discount_type === "percent" ? "%" : "บาท"
              }}) <span class="text-error">*</span></span
            ><input
              v-model.number="form.coupon_discount_value"
              type="number"
              class="input input-sm w-full"
              min="0.01"
              :max="form.coupon_discount_type === 'percent' ? 100 : undefined"
              step="0.01"
              required
              :disabled="busy || locked"
          /></label>
          <label
            v-if="form.coupon_discount_type === 'percent'"
            class="fieldset sm:col-span-2"
            ><span class="fieldset-legend">ส่วนลดสูงสุด (บาท)</span
            ><input
              v-model="form.coupon_max_discount"
              type="number"
              class="input input-sm w-full"
              min="0.01"
              step="0.01"
              :disabled="busy || locked"
              placeholder="เว้นว่างหากไม่จำกัด"
          /></label>
        </section>

        <section class="border-t border-base-300 pt-4">
          <h3 class="font-semibold">เงื่อนไขการใช้</h3>
          <p class="mt-1 text-xs leading-5 text-base-content/60">
            ต้องผ่านทุกเงื่อนไขที่กำหนด ใช้ยอดสินค้าหลังหักโปรโมชั่น
            ไม่รวมค่าจัดส่ง ระบุ 0 หากไม่กำหนดขั้นต่ำ
          </p>
          <div class="mt-2 grid gap-4 sm:grid-cols-4 grid-cols-2">
            <label class="fieldset"
              ><span class="fieldset-legend">ยอดซื้อขั้นต่ำ (บาท)</span
              ><input
                v-model.number="form.coupon_min_purchase_amount"
                type="number"
                class="input input-sm w-full"
                min="0"
                step="0.01"
                required
                :disabled="busy || locked"
            /></label>
            <label class="fieldset"
              ><span class="fieldset-legend">จำนวนชิ้นขั้นต่ำ</span
              ><input
                v-model.number="form.coupon_min_quantity"
                type="number"
                class="input input-sm w-full"
                min="0"
                step="1"
                required
                :disabled="busy || locked"
            /></label>
            <label class="fieldset"
              ><span class="fieldset-legend">จำนวนรายการขั้นต่ำ</span
              ><input
                v-model.number="form.coupon_min_items"
                type="number"
                class="input input-sm w-full"
                min="0"
                step="1"
                required
                :disabled="busy || locked"
            /></label>
            <label class="fieldset"
              ><span class="fieldset-legend"
                >ใช้ได้ต่อผู้ใช้ (ครั้ง) <span class="text-error">*</span></span
              ><input
                v-model.number="form.coupon_usage_limit"
                type="number"
                class="input input-sm w-full"
                min="1"
                step="1"
                required
                :disabled="busy || locked"
            /></label>
          </div>
          <p class="mt-2 text-xs text-base-content/55">
            สินค้า A 3 ชิ้น และ B 2 ชิ้น เท่ากับ 5 ชิ้น / 2 รายการ
          </p>
          <div class="mt-3 grid gap-4 sm:grid-cols-2">
            <div class="fieldset">
              <label class="flex cursor-pointer items-center gap-2 py-2 text-sm"
                ><input
                  v-model="noExpiry"
                  type="checkbox"
                  class="checkbox checkbox-sm"
                  :disabled="busy || locked"
                />ไม่มีวันหมดอายุ</label
              >
              <label v-if="!noExpiry"
                ><span class="mb-1 block text-xs font-semibold"
                  >หมดอายุวันที่และเวลา (ประเทศไทย)</span
                ><input
                  v-model="expiresAt"
                  type="datetime-local"
                  class="input input-sm w-full"
                  required
                  :disabled="busy || locked"
              /></label>
            </div>
          </div>
        </section>

        <section class="border-t border-base-300 pt-4">
          <h3 class="font-semibold">การแจกจ่าย</h3>
          <div class="mt-2 grid gap-4 sm:grid-cols-3">
            <label class="fieldset"
              ><span class="fieldset-legend">วิธีรับคูปอง</span
              ><select
                v-model="form.coupon_distribution_method"
                class="select select-sm w-full"
                :disabled="busy || locked"
              >
                <option
                  v-for="(label, value) in couponDistributionLabels"
                  :key="value"
                  :value="value"
                >
                  {{ label }}
                </option>
              </select></label
            >
            <label class="fieldset"
              ><span class="fieldset-legend"
                >จำนวนผู้รับสูงสุด (คน) <span class="text-error">*</span></span
              ><input
                v-model.number="form.coupon_recipient_limit"
                type="number"
                class="input input-sm w-full"
                :min="Math.max(1, Number(form.coupon_issued_count || 0))"
                step="1"
                required
                :disabled="busy"
            /></label>
            <label class="fieldset"
              ><span class="fieldset-legend">สถานะ</span
              ><select
                v-model="form.coupon_status"
                class="select select-sm w-full"
                :disabled="busy"
              >
                <option
                  v-for="(label, value) in couponStatusLabels"
                  :key="value"
                  :value="value"
                  :disabled="locked && value === 'draft'"
                >
                  {{ label }}
                </option>
              </select></label
            >
          </div>
          <p
            class="mt-3 rounded-lg bg-base-200 p-3 text-xs leading-5 text-base-content/65"
          >
            {{ distributionDescription }}
          </p>
          <p class="mt-2 text-xs leading-5 text-base-content/60">
            แต่ละคนรับคูปองเดียวกันได้หนึ่งสิทธิ์
            การหยุดแจกไม่กระทบคูปองที่ได้รับแล้ว
          </p>
        </section>
        <div
          v-if="errorMessage"
          class="alert alert-error alert-soft text-sm"
          role="alert"
        >
          <Icon name="lucide:circle-alert" size="18" /><span>{{
            errorMessage
          }}</span
          ><button
            v-if="loadFailed"
            type="button"
            class="btn btn-xs"
            @click="loadLatest"
          >
            โหลดใหม่
          </button>
        </div>
      </form>

      <footer
        class="grid shrink-0 grid-cols-2 gap-3 border-t border-base-300 bg-base-200/35 p-4"
      >
        <button
          type="button"
          class="btn btn-sm"
          :disabled="saving"
          @click="close"
        >
          ปิด
        </button>
        <button
          type="submit"
          :form="formId"
          class="btn btn-secondary btn-sm"
          :disabled="busy || loadFailed"
        >
          <span v-if="saving" class="loading loading-spinner loading-xs" /><Icon
            v-else
            name="lucide:save"
            size="16"
          />{{ saving ? "กำลังบันทึก..." : "บันทึกคูปอง" }}
        </button>
      </footer>
    </div>
  </dialog>
</template>

<script setup lang="ts">
import {
  couponDistributionLabels,
  couponStatusLabels,
  couponError,
  type AdminCouponRow,
} from "~/utils/adminCoupon";

const emit = defineEmits<{ changed: [] }>();
const dialog = ref<HTMLDialogElement | null>(null);
const formElement = ref<HTMLFormElement | null>(null);
const titleId = useId();
const formId = useId();
const saving = ref(false);
const loading = ref(false);
const loadFailed = ref(false);
const errorMessage = ref("");
const noExpiry = ref(true);
const expiresAt = ref("");
const originalExpiresAtInput = ref("");
let requestId = 0;
const defaults = (): AdminCouponRow => ({
  coupon_name: "",
  coupon_description: "",
  coupon_discount_type: "amount",
  coupon_discount_value: 50,
  coupon_max_discount: null,
  coupon_min_purchase_amount: 0,
  coupon_min_quantity: 0,
  coupon_min_items: 0,
  coupon_usage_limit: 1,
  coupon_recipient_limit: 20,
  coupon_distribution_method: "claim",
  coupon_status: "draft",
  coupon_expires_at: null,
  coupon_issued_count: 0,
});
const form = ref<AdminCouponRow>(defaults());
const busy = computed(() => saving.value || loading.value);
const locked = computed(() => Number(form.value.coupon_issued_count || 0) > 0);
const distributionDescription = computed(
  () =>
    ({
      signup:
        "แจกอัตโนมัติให้สมาชิกที่สมัครและยืนยัน OTP สำเร็จหลังสร้างคูปอง ขณะเปิดแจก จนกว่าจะครบจำนวนผู้รับ ไม่รวมสมาชิกเดิมและบัญชีที่ผู้ดูแลสร้าง",
      random:
        "หลังบันทึกและเปิดแจก กดดูรายละเอียดเพื่อสุ่มแจกเป็นครั้ง ๆ จากสมาชิกที่ยังไม่เคยได้รับคูปองนี้",
      manual:
        "หลังบันทึกและเปิดแจก กดดูรายละเอียดเพื่อเลือกสมาชิกที่ต้องการแจกคูปอง",
      claim:
        "เมื่อเปิดแจก สมาชิกจะเห็นคูปองในส่วนรับคูปองเพิ่มที่ตะกร้า และกดรับเก็บไว้ใช้ได้แม้ยอดซื้อยังไม่ถึงขั้นต่ำ",
    })[form.value.coupon_distribution_method],
);

function setForm(row: AdminCouponRow) {
  form.value = { ...defaults(), ...row };
  noExpiry.value = !row.coupon_expires_at;
  if (row.coupon_expires_at) {
    const date = new Date(row.coupon_expires_at);
    expiresAt.value = Number.isFinite(date.getTime())
      ? new Date(date.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 16)
      : "";
  } else expiresAt.value = "";
  originalExpiresAtInput.value = expiresAt.value;
}

function close() {
  if (saving.value) return;
  requestId += 1;
  loading.value = false;
  dialog.value?.close();
}
function onDialogClose() {
  requestId += 1;
  loading.value = false;
}
function onCreate() {
  requestId += 1;
  setForm(defaults());
  errorMessage.value = "";
  loadFailed.value = false;
  loading.value = false;
  dialog.value?.showModal();
}
async function loadLatest() {
  if (!form.value.uuid) return;
  const currentRequest = ++requestId;
  loading.value = true;
  loadFailed.value = false;
  errorMessage.value = "";
  try {
    const response = await $fetch<{ row: AdminCouponRow }>(
      `/api/coupon/${encodeURIComponent(form.value.uuid)}`,
    );
    if (currentRequest === requestId) setForm(response.row);
  } catch (error) {
    if (currentRequest !== requestId) return;
    loadFailed.value = true;
    errorMessage.value = couponError(
      error,
      "โหลดข้อมูลคูปองไม่สำเร็จ กรุณาลองอีกครั้ง",
    );
  } finally {
    if (currentRequest === requestId) loading.value = false;
  }
}
async function onEdit(row: AdminCouponRow) {
  setForm(row);
  dialog.value?.showModal();
  await loadLatest();
}
async function onSubmit() {
  if (busy.value || loadFailed.value || !formElement.value?.reportValidity())
    return;
  errorMessage.value = "";
  const row = form.value;
  if (!row.coupon_name.trim()) {
    errorMessage.value = "กรุณาระบุชื่อคูปอง";
    return;
  }
  const expiryUnchanged =
    !noExpiry.value &&
    expiresAt.value === originalExpiresAtInput.value &&
    Boolean(row.coupon_expires_at);
  const expiry = noExpiry.value
    ? null
    : expiryUnchanged
      ? new Date(row.coupon_expires_at!)
      : new Date(`${expiresAt.value}:00+07:00`);
  if (
    !locked.value &&
    !expiryUnchanged &&
    expiry &&
    (!Number.isFinite(expiry.getTime()) || expiry.getTime() <= Date.now())
  ) {
    errorMessage.value = "กรุณาระบุวันหมดอายุในอนาคต";
    return;
  }
  const body = {
    coupon_name: row.coupon_name.trim(),
    coupon_description: row.coupon_description?.trim() || null,
    coupon_status: row.coupon_status,
    coupon_recipient_limit: Number(row.coupon_recipient_limit),
    ...(!locked.value
      ? {
          coupon_discount_type: row.coupon_discount_type,
          coupon_discount_value: Number(row.coupon_discount_value),
          coupon_max_discount:
            row.coupon_discount_type === "percent" &&
            row.coupon_max_discount !== null &&
            row.coupon_max_discount !== ""
              ? Number(row.coupon_max_discount)
              : null,
          coupon_min_purchase_amount: Number(row.coupon_min_purchase_amount),
          coupon_min_quantity: Number(row.coupon_min_quantity),
          coupon_min_items: Number(row.coupon_min_items),
          coupon_usage_limit: Number(row.coupon_usage_limit),
          coupon_distribution_method: row.coupon_distribution_method,
          coupon_expires_at: expiry?.toISOString() || null,
        }
      : {}),
  };
  saving.value = true;
  try {
    await $fetch(
      row.uuid ? `/api/coupon/${encodeURIComponent(row.uuid)}` : "/api/coupon",
      {
        method: row.uuid ? "put" : "post",
        body,
      },
    );
    emit("changed");
    dialog.value?.close();
  } catch (error) {
    errorMessage.value = couponError(
      error,
      "บันทึกคูปองไม่สำเร็จ กรุณาลองอีกครั้ง",
    );
  } finally {
    saving.value = false;
  }
}
defineExpose({ onCreate, onEdit });
onBeforeUnmount(() => {
  requestId += 1;
});
</script>
