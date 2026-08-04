<template>
  <section class="rounded-xl border border-base-300 bg-base-100 p-4">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <Icon name="lucide:badge-dollar-sign" size="18" class="text-primary" />
        <h2 class="font-bold">การชำระเงิน</h2>
      </div>
      <span v-if="payment" class="badge badge-sm" :class="statusMeta?.badge">
        {{ statusMeta?.label }}
      </span>
    </div>

    <div v-if="loading" class="mt-4 space-y-3" aria-hidden="true">
      <div class="skeleton h-40 w-full" />
      <div class="skeleton h-4 w-2/3" />
      <div class="skeleton h-4 w-1/2" />
    </div>

    <div
      v-else-if="!payment"
      class="py-8 text-center text-sm text-base-content/55"
    >
      <Icon name="lucide:receipt" size="30" class="mx-auto mb-2 opacity-50" />
      ยังไม่มีการแนบสลิปสำหรับคำสั่งซื้อนี้
    </div>

    <template v-else>
      <a
        v-if="payment.order_payment_slip_endpoint"
        :href="payment.order_payment_slip_endpoint"
        target="_blank"
        rel="noopener"
        class="mt-4 block overflow-hidden rounded-xl border border-base-300 bg-base-200/60"
      >
        <img
          :src="payment.order_payment_slip_endpoint"
          alt="สลิปการชำระเงิน"
          class="mx-auto max-h-72 w-full object-contain"
        />
      </a>

      <dl class="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt class="text-xs text-base-content/50">ยอดที่ต้องชำระ</dt>
          <dd class="font-semibold">
            ฿{{ formatMoney(payment.order_payment_expected_amount) }}
          </dd>
        </div>
        <div>
          <dt class="text-xs text-base-content/50">ยอดที่ตรวจพบ</dt>
          <dd class="font-semibold">
            {{
              payment.order_payment_verified_amount === null ||
              payment.order_payment_verified_amount === undefined
                ? "-"
                : `฿${formatMoney(payment.order_payment_verified_amount)}`
            }}
          </dd>
        </div>
        <div>
          <dt class="text-xs text-base-content/50">เลขอ้างอิงธุรกรรม</dt>
          <dd class="break-all font-mono text-xs">
            {{ payment.order_payment_transaction_ref || "-" }}
          </dd>
        </div>
        <div>
          <dt class="text-xs text-base-content/50">เวลาธุรกรรม</dt>
          <dd>{{ formatDate(payment.order_payment_transaction_at) }}</dd>
        </div>
        <div>
          <dt class="text-xs text-base-content/50">ผู้โอน</dt>
          <dd>{{ payment.order_payment_sender_name || "-" }}</dd>
        </div>
        <div>
          <dt class="text-xs text-base-content/50">ผู้รับ</dt>
          <dd>{{ payment.order_payment_receiver_name || "-" }}</dd>
        </div>
      </dl>

      <div
        v-if="resultMessage"
        class="mt-4 rounded-lg px-3 py-2 text-xs leading-5"
        :class="messageClass"
      >
        {{ resultMessage }}
      </div>

      <div
        v-if="admin && payment.order_payment_status !== 'verified'"
        class="mt-5 border-t border-base-300 pt-4"
      >
        <h3 class="text-sm font-bold">ตรวจสอบด้วยเจ้าหน้าที่</h3>
        <div class="mt-3 grid gap-3 sm:grid-cols-2">
          <label class="fieldset">
            <span class="fieldset-legend">ยอดที่ตรวจพบ</span>
            <input
              v-model.number="reviewForm.amount"
              type="number"
              min="0"
              step="0.01"
              class="input input-sm w-full"
            />
          </label>
          <label class="fieldset">
            <span class="fieldset-legend">ธนาคารต้นทาง</span>
            <input
              v-model.trim="reviewForm.sendingBank"
              class="input input-sm w-full"
              placeholder="เช่น 004"
            />
          </label>
          <label class="fieldset sm:col-span-2">
            <span class="fieldset-legend">เลขอ้างอิงธุรกรรม</span>
            <input
              v-model.trim="reviewForm.transactionRef"
              class="input input-sm w-full"
            />
          </label>
          <label class="fieldset sm:col-span-2">
            <span class="fieldset-legend">เวลาธุรกรรม</span>
            <input
              v-model="reviewForm.transactionAt"
              type="datetime-local"
              class="input input-sm w-full"
            />
          </label>
          <label class="fieldset sm:col-span-2">
            <span class="fieldset-legend">หมายเหตุการตรวจสอบ</span>
            <textarea
              v-model.trim="reviewForm.note"
              class="textarea textarea-sm w-full"
              placeholder="ระบุเหตุผลก่อนอนุมัติหรือปฏิเสธ"
            />
          </label>
        </div>
        <p v-if="reviewError" class="mt-2 text-xs text-error">
          {{ reviewError }}
        </p>
        <div class="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            class="btn btn-outline btn-error btn-sm"
            :disabled="isReviewing"
            @click="reviewPayment('rejected')"
          >
            ปฏิเสธ
          </button>
          <button
            type="button"
            class="btn btn-success btn-sm"
            :disabled="isReviewing"
            @click="reviewPayment('verified')"
          >
            <span
              v-if="isReviewing"
              class="loading loading-spinner loading-xs"
            />
            <template v-else>ยืนยันว่าชำระแล้ว</template>
          </button>
        </div>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
type PaymentRow = Record<string, any>;

const props = withDefaults(
  defineProps<{
    payment?: PaymentRow | null;
    admin?: boolean;
    loading?: boolean;
  }>(),
  {
    payment: null,
    admin: false,
    loading: false,
  },
);
const emit = defineEmits<{ refreshed: [] }>();

const isReviewing = ref(false);
const reviewError = ref("");
const reviewForm = reactive({
  amount: 0,
  sendingBank: "",
  transactionRef: "",
  transactionAt: "",
  note: "",
});

const statusMap: Record<
  string,
  { badge: string; label: string; messageClass: string }
> = {
  pending: {
    badge: "badge-info",
    label: "กำลังตรวจสอบ",
    messageClass: "bg-info/10 text-info",
  },
  verified: {
    badge: "badge-success",
    label: "ตรวจสอบแล้ว",
    messageClass: "bg-success/10 text-success",
  },
  rejected: {
    badge: "badge-error",
    label: "ไม่ผ่านการตรวจสอบ",
    messageClass: "bg-error/10 text-error",
  },
  manual_review: {
    badge: "badge-warning",
    label: "รอเจ้าหน้าที่ตรวจ",
    messageClass: "bg-warning/10 text-warning-content",
  },
  error: {
    badge: "badge-warning",
    label: "ระบบตรวจขัดข้อง",
    messageClass: "bg-warning/10 text-warning-content",
  },
};
const statusMeta = computed(
  () =>
    statusMap[String(props.payment?.order_payment_status || "pending")] ||
    statusMap.pending,
);
const messageClass = computed(() => statusMeta.value?.messageClass);
const resultMessage = computed(
  () =>
    props.payment?.order_payment_rejection_reason ||
    props.payment?.order_payment_provider_message ||
    (props.payment?.order_payment_status === "verified"
      ? "ตรวจสอบการชำระเงินเรียบร้อยแล้ว"
      : ""),
);

const toDatetimeLocal = (value: unknown) => {
  if (!value) return "";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
};

watch(
  () => props.payment,
  (payment) => {
    if (!payment) return;
    reviewForm.amount = Number(
      payment.order_payment_verified_amount ??
        payment.order_payment_expected_amount ??
        0,
    );
    reviewForm.sendingBank = String(payment.order_payment_sending_bank || "");
    reviewForm.transactionRef = String(
      payment.order_payment_transaction_ref || "",
    );
    reviewForm.transactionAt = toDatetimeLocal(
      payment.order_payment_transaction_at,
    );
    reviewForm.note = "";
  },
  { immediate: true },
);

const reviewPayment = async (status: "verified" | "rejected") => {
  if (!props.payment?.uuid) return;
  reviewError.value = "";
  if (!reviewForm.note) {
    reviewError.value = "กรุณาระบุหมายเหตุการตรวจสอบ";
    return;
  }
  if (
    status === "verified" &&
    (!reviewForm.transactionRef ||
      !reviewForm.sendingBank ||
      !reviewForm.transactionAt)
  ) {
    reviewError.value =
      "การอนุมัติต้องระบุเลขอ้างอิง ธนาคารต้นทาง และเวลาธุรกรรม";
    return;
  }

  isReviewing.value = true;
  try {
    await $fetch(`/api/order/payments/${props.payment.uuid}`, {
      method: "PUT",
      body: {
        order_payment_status: status,
        order_payment_verified_amount: reviewForm.amount,
        order_payment_transaction_ref: reviewForm.transactionRef,
        order_payment_transaction_at: reviewForm.transactionAt
          ? new Date(reviewForm.transactionAt).toISOString()
          : undefined,
        order_payment_sending_bank: reviewForm.sendingBank,
        order_payment_review_note: reviewForm.note,
      },
    });
    emit("refreshed");
  } catch (error: any) {
    reviewError.value =
      error?.data?.statusMessage || "ไม่สามารถบันทึกผลตรวจสอบได้";
  } finally {
    isReviewing.value = false;
  }
};

const formatMoney = (value: unknown) =>
  new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
const formatDate = (value: unknown) =>
  value
    ? new Intl.DateTimeFormat("th-TH", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(String(value)))
    : "-";
</script>
