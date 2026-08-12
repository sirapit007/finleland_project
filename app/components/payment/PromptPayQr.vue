<template>
  <div
    v-if="qrSvg"
    class="promptpay-qr mx-auto w-full max-w-72"
    role="img"
    :aria-label="`PromptPay QR ยอดชำระ ${formattedAmount} บาท`"
    v-html="qrSvg"
  />
  <div v-else role="alert" class="alert alert-warning text-sm">
    <Icon name="lucide:triangle-alert" size="18" />
    <span>{{ errorMessage }}</span>
  </div>
</template>

<script setup lang="ts">
import { renderThaiQRPaymentMatrix } from "thai-qr-payment";

const props = defineProps<{
  recipient: string;
  amount: number;
}>();

const normalizedRecipient = computed(() =>
  String(props.recipient || "").replace(/\D/g, ""),
);
const normalizedAmount = computed(() => Number(props.amount || 0));
const formattedAmount = computed(() => normalizedAmount.value.toFixed(2));

const validationMessage = computed(() => {
  if (!normalizedRecipient.value) return "ร้านค้ายังไม่ได้ตั้งค่า PromptPay ID";
  if (![10, 13, 15].includes(normalizedRecipient.value.length)) {
    return "PromptPay ID ของร้านค้าไม่ถูกต้อง";
  }
  if (!Number.isFinite(normalizedAmount.value) || normalizedAmount.value <= 0) {
    return "ยอดชำระเงินไม่ถูกต้อง";
  }
  return "";
});

const qrError = ref("");
const errorMessage = computed(
  () =>
    validationMessage.value ||
    qrError.value ||
    "ไม่สามารถสร้าง PromptPay QR ได้",
);
const qrSvg = computed(() => {
  qrError.value = "";
  if (validationMessage.value) return "";

  try {
    return renderThaiQRPaymentMatrix({
      recipient: normalizedRecipient.value,
      amount: normalizedAmount.value,
      errorCorrectionLevel: "M",
      size: 288,
      quietZone: 4,
    });
  } catch {
    qrError.value = "ไม่สามารถสร้าง PromptPay QR ได้";
    return "";
  }
});
</script>

<style scoped>
.promptpay-qr :deep(svg) {
  display: block;
  width: 100%;
  height: auto;
}
</style>
