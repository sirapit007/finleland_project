<template>
  <div v-if="order.order_user_coupon" class="mt-3">
    <p
      v-if="order.order_coupon_usage_status === 'returned'"
      class="text-xs text-base-content/60"
    >
      คืนสิทธิ์คูปองแล้ว
    </p>
    <button
      v-else-if="canRemove || canReturn"
      type="button"
      class="btn btn-outline btn-xs"
      :disabled="saving"
      @click="open"
    >
      {{ canReturn ? "คืนสิทธิ์คูปอง" : "ถอดคูปองและคืนสิทธิ์" }}
    </button>
  </div>
  <dialog ref="dialog" class="modal" @cancel="preventWhileSaving">
    <div class="modal-box max-w-md">
      <h3 class="text-lg font-bold">
        {{ canReturn ? "คืนสิทธิ์คูปอง" : "ถอดคูปองและคืนสิทธิ์" }}
      </h3>
      <p class="mt-3 text-sm text-base-content/70">
        {{
          canReturn
            ? "คืนจำนวนครั้งให้คูปองใบเดิม โดยยอดและข้อมูลคำสั่งซื้อที่ยกเลิกยังเก็บไว้เป็นประวัติ"
            : "ถอดส่วนลดคูปองจากคำสั่งซื้อนี้ คำนวณยอดใหม่ และคืนจำนวนครั้งให้เจ้าของคูปอง"
        }}
      </p>
      <template v-if="canReturn">
        <label class="fieldset mt-3">
          <span class="fieldset-legend">เหตุผล / หลักฐานอ้างอิงการคืนเงิน</span>
          <textarea
            v-model.trim="reason"
            class="textarea w-full"
            maxlength="2000"
            :disabled="saving"
            placeholder="ระบุเหตุผลอย่างน้อย 5 ตัวอักษร"
          />
        </label>
        <label
          v-if="requiresRefund"
          class="mt-3 flex items-start gap-3 text-sm"
        >
          <input
            v-model="refundConfirmed"
            type="checkbox"
            class="checkbox checkbox-sm mt-0.5"
            :disabled="saving"
          />
          <span
            >ยืนยันว่าได้คืนเงินให้ลูกค้านอกระบบเรียบร้อยแล้ว
            การบันทึกนี้ไม่โอนเงินให้อัตโนมัติ</span
          >
        </label>
      </template>
      <p v-if="errorMessage" role="alert" class="mt-3 text-sm text-error">
        {{ errorMessage }}
      </p>
      <div class="modal-action">
        <button
          type="button"
          class="btn btn-sm"
          :disabled="saving"
          @click="dialog?.close()"
        >
          ยกเลิก
        </button>
        <button
          type="button"
          class="btn btn-warning btn-sm"
          :disabled="saving || !canSubmit"
          @click="submit"
        >
          <span v-if="saving" class="loading loading-spinner loading-xs" />
          ยืนยันคืนสิทธิ์
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button :disabled="saving">ปิด</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
const props = defineProps<{ order: Record<string, any> }>();
const emit = defineEmits<{ refreshed: [] }>();
const dialog = ref<HTMLDialogElement | null>(null);
const saving = ref(false);
const reason = ref("");
const refundConfirmed = ref(false);
const errorMessage = ref("");
const { showToast } = useToast();
const paid = computed(
  () =>
    Boolean(props.order.order_paid_at) ||
    ["paid", "refunded"].includes(String(props.order.order_payment_status)),
);
const canRemove = computed(
  () =>
    !paid.value &&
    !["completed", "canceled"].includes(String(props.order.order_status)),
);
const canReturn = computed(() => props.order.order_status === "canceled");
const requiresRefund = computed(
  () =>
    paid.value &&
    !(
      Number(props.order.order_grand_total) === 0 &&
      props.order.order_payment_method === "coupon"
    ),
);
const canSubmit = computed(
  () =>
    !canReturn.value ||
    (reason.value.length >= 5 &&
      (!requiresRefund.value || refundConfirmed.value)),
);
const preventWhileSaving = (event: Event) => {
  if (saving.value) event.preventDefault();
};
const open = () => {
  reason.value = "";
  refundConfirmed.value = false;
  errorMessage.value = "";
  dialog.value?.showModal();
};
const submit = async () => {
  if (saving.value || !canSubmit.value) return;
  saving.value = true;
  errorMessage.value = "";
  try {
    const response: any = await $fetch(
      `/api/order/${props.order.uuid}/coupon/${canReturn.value ? "return" : "remove"}`,
      {
        method: "POST",
        body: { reason: reason.value, refund_confirmed: refundConfirmed.value },
      },
    );
    if (response.row) Object.assign(props.order, response.row);
    dialog.value?.close();
    showToast("คืนสิทธิ์คูปองแล้ว");
    emit("refreshed");
    await refreshNuxtData();
  } catch (error: any) {
    errorMessage.value =
      error?.data?.statusMessage || "ไม่สามารถคืนสิทธิ์คูปองได้";
  } finally {
    saving.value = false;
  }
};
</script>
