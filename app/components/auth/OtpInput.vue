<template>
  <div>
    <div class="mb-6 text-center">
      <div
        class="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary"
      >
        <Icon name="lucide:message-square-lock" size="32" />
      </div>
      <h1 class="text-2xl font-bold text-primary sm:text-3xl">
        ยืนยันเบอร์โทรศัพท์
      </h1>
      <p class="mt-2 text-xs font-semibold text-base-content/60 sm:text-sm">
        กรอกรหัส OTP ที่ส่งไปยัง {{ maskedPhone }}
      </p>
      <p v-if="refno" class="mt-1 text-xs text-base-content/50">
        หมายเลขอ้างอิง {{ refno }}
      </p>
    </div>

    <form class="space-y-5" novalidate @submit.prevent="submitOtp">
      <div v-if="errorMessage" role="alert" class="alert alert-error text-sm">
        <Icon name="lucide:message-circle-x" size="20" />
        <span>{{ errorMessage }}</span>
      </div>

      <div class="flex justify-center gap-2 sm:gap-3" @paste.prevent="onPaste">
        <input
          v-for="(_, index) in digits"
          :key="index"
          :ref="(element) => setInputRef(element, index)"
          :value="digits[index]"
          :aria-label="`OTP หลักที่ ${index + 1}`"
          :autocomplete="index === 0 ? 'one-time-code' : 'off'"
          class="input input-bordered size-10 px-0 text-center text-lg font-bold sm:size-12 sm:text-xl"
          inputmode="numeric"
          maxlength="1"
          pattern="[0-9]*"
          type="text"
          :disabled="loading || isExpired"
          @input="onInput(index, $event)"
          @keydown="onKeydown(index, $event)"
        />
      </div>

      <div class="text-center text-xs sm:text-sm">
        <p v-if="!isExpired" class="text-base-content/60">
          รหัสจะหมดอายุใน
          <span class="font-semibold text-primary">{{ formattedExpiry }}</span>
        </p>
        <p v-else class="font-semibold text-error">
          รหัส OTP หมดอายุแล้ว กรุณาขอรหัสใหม่
        </p>
      </div>

      <button
        class="btn btn-primary btn-sm w-full sm:btn-md"
        type="submit"
        :disabled="!isComplete || loading || isExpired"
      >
        <span v-if="loading" class="loading loading-spinner loading-sm" />
        {{ loading ? "กำลังตรวจสอบ..." : "ยืนยันรหัส OTP" }}
      </button>

      <div class="flex items-center justify-between gap-2 text-xs sm:text-sm">
        <button
          class="btn btn-ghost btn-sm px-2"
          type="button"
          :disabled="loading"
          @click="emit('back')"
        >
          <Icon name="lucide:arrow-left" size="16" />
          แก้ไขเบอร์โทร
        </button>
        <button
          class="btn btn-link btn-sm px-2 no-underline"
          type="button"
          :disabled="loading || resendRemaining > 0"
          @click="emit('resend')"
        >
          {{
            resendRemaining > 0
              ? `ส่งรหัสใหม่ใน ${resendRemaining} วินาที`
              : "ส่งรหัสใหม่"
          }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    phone: string;
    refno?: string;
    length?: number;
    expiresIn?: number;
    resendAfter?: number;
    loading?: boolean;
    errorMessage?: string;
  }>(),
  {
    refno: "",
    length: 6,
    expiresIn: 300,
    resendAfter: 60,
    loading: false,
    errorMessage: "",
  },
);

const emit = defineEmits<{
  submit: [pin: string];
  resend: [];
  back: [];
}>();

const normalizedLength = computed(() => Math.max(4, Math.min(8, props.length)));
const digits = ref<string[]>(
  Array.from({ length: normalizedLength.value }, () => ""),
);
const inputRefs = ref<HTMLInputElement[]>([]);
const expiryRemaining = ref(props.expiresIn);
const resendRemaining = ref(props.resendAfter);
let timer: ReturnType<typeof setInterval> | null = null;

const maskedPhone = computed(() => {
  const phone = props.phone.replace(/\D/g, "");
  if (phone.length !== 10) return props.phone;
  return `${phone.slice(0, 3)}-xxx-${phone.slice(-3)}`;
});

const isExpired = computed(() => expiryRemaining.value <= 0);
const isComplete = computed(
  () => digits.value.join("").length === normalizedLength.value,
);
const formattedExpiry = computed(() => {
  const minutes = Math.floor(expiryRemaining.value / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (expiryRemaining.value % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
});

function setInputRef(element: unknown, index: number) {
  if (element instanceof HTMLInputElement) {
    inputRefs.value[index] = element;
  }
}

function focusInput(index: number) {
  nextTick(() => inputRefs.value[index]?.focus());
}

function distributeDigits(startIndex: number, value: string) {
  const incoming = value.replace(/\D/g, "");
  if (!incoming) return;

  for (
    let offset = 0;
    offset < incoming.length && startIndex + offset < digits.value.length;
    offset += 1
  ) {
    digits.value[startIndex + offset] = incoming[offset] || "";
  }

  const nextIndex = Math.min(
    startIndex + incoming.length,
    digits.value.length - 1,
  );
  focusInput(nextIndex);
}

function onInput(index: number, event: Event) {
  const target = event.target as HTMLInputElement;
  const value = target.value.replace(/\D/g, "");

  if (value.length > 1) {
    distributeDigits(index, value);
    return;
  }

  digits.value[index] = value.slice(-1);
  target.value = digits.value[index] || "";

  if (digits.value[index] && index < digits.value.length - 1) {
    focusInput(index + 1);
  }
}

function onKeydown(index: number, event: KeyboardEvent) {
  if (event.key === "Backspace" && !digits.value[index] && index > 0) {
    event.preventDefault();
    digits.value[index - 1] = "";
    focusInput(index - 1);
  } else if (event.key === "ArrowLeft" && index > 0) {
    event.preventDefault();
    focusInput(index - 1);
  } else if (event.key === "ArrowRight" && index < digits.value.length - 1) {
    event.preventDefault();
    focusInput(index + 1);
  }
}

function onPaste(event: ClipboardEvent) {
  distributeDigits(0, event.clipboardData?.getData("text") || "");
}

function submitOtp() {
  if (!isComplete.value || isExpired.value || props.loading) return;
  emit("submit", digits.value.join(""));
}

watch(
  () => props.errorMessage,
  (message) => {
    if (!message) return;
    digits.value = Array.from({ length: normalizedLength.value }, () => "");
    focusInput(0);
  },
);

onMounted(() => {
  focusInput(0);
  timer = setInterval(() => {
    expiryRemaining.value = Math.max(0, expiryRemaining.value - 1);
    resendRemaining.value = Math.max(0, resendRemaining.value - 1);
  }, 1000);
});

onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});
</script>
