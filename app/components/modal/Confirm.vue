<template>
  <dialog ref="dialog" class="modal" @close="onDialogClose">
    <div
      class="modal-box"
      :class="isOrderConfirmation ? 'max-w-lg' : 'max-w-xs'"
    >
      <h3 class="text-lg font-bold">{{ title }}</h3>
      <div class="mt-5 text-center">
        <Icon :name="icon" :class="iconClass" size="60" />
      </div>
      <p v-if="message" class="mt-4 text-center text-sm text-base-content/65">
        {{ message }}
      </p>
      <div v-if="isOrderConfirmation" class="mt-4 space-y-3 text-left">
        <div class="rounded-xl border border-base-300 bg-base-200/50 p-3">
          <div class="flex items-start gap-3">
            <div
              class="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
            >
              <Icon :name="deliveryMethod?.icon || 'lucide:truck'" size="18" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-xs text-base-content/55">วิธีการจัดส่ง</p>
              <p class="font-semibold">{{ deliveryMethod?.label }}</p>
              <p
                v-if="deliveryMethod?.description"
                class="mt-0.5 text-xs text-base-content/60"
              >
                {{ deliveryMethod.description }}
              </p>
            </div>
            <span class="badge badge-sm badge-soft badge-primary shrink-0">
              {{ deliveryPriceText }}
            </span>
          </div>
        </div>

        <div
          v-if="shippingAddress"
          class="rounded-xl border border-base-300 bg-base-200/50 p-3"
        >
          <div class="flex items-start gap-3">
            <div
              class="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
            >
              <Icon name="lucide:map-pin" size="18" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <p class="text-xs text-base-content/55">ที่อยู่จัดส่ง</p>
                <span
                  v-if="shippingAddress.label"
                  class="badge badge-xs badge-outline"
                >
                  {{ shippingAddress.label }}
                </span>
              </div>
              <p class="mt-1 text-sm font-semibold">
                {{ shippingAddress.recipient }}
                <span
                  v-if="shippingAddress.phone"
                  class="font-normal text-base-content/65"
                >
                  · {{ shippingAddress.phone }}
                </span>
              </p>
              <p class="mt-1 text-sm leading-5 text-base-content/65">
                {{ shippingAddress.address }}
              </p>
              <p
                v-if="shippingAddress.note"
                class="mt-1 text-xs text-base-content/55"
              >
                หมายเหตุ: {{ shippingAddress.note }}
              </p>
            </div>
          </div>
        </div>

        <p
          v-else-if="deliveryMethod?.id === 'pickup'"
          class="rounded-lg bg-info/10 px-3 py-2 text-center text-xs text-info"
        >
          รับสินค้าด้วยตัวเอง จึงไม่ใช้ที่อยู่จัดส่ง
        </p>
      </div>
      <div class="modal-action">
        <button
          class="btn btn-sm flex-1"
          type="button"
          :disabled="loading"
          @click="close"
        >
          {{ cancelText }}
        </button>
        <button
          class="btn btn-sm flex-1"
          :class="confirmClass"
          type="button"
          :disabled="loading"
          @click="$emit('confirm')"
        >
          <span v-if="loading" class="loading loading-spinner loading-xs" />
          <template v-else>{{ confirmText }}</template>
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>{{ cancelText }}</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
type ConfirmShippingAddress = {
  label?: string;
  recipient: string;
  phone?: string;
  address: string;
  note?: string;
};

type ConfirmDeliveryMethod = {
  id: string;
  label: string;
  description?: string;
  price?: number;
  icon?: string;
};

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "error" | "primary" | "warning";
    icon?: string;
    loading?: boolean;
    shippingAddress?: ConfirmShippingAddress | null;
    deliveryMethod?: ConfirmDeliveryMethod | null;
  }>(),
  {
    title: "ยืนยันการดำเนินการ",
    message: "",
    confirmText: "ยืนยัน",
    cancelText: "ปิด",
    variant: "error",
    icon: "lucide:message-circle-warning",
    loading: false,
    shippingAddress: null,
    deliveryMethod: null,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  confirm: [];
  cancel: [];
}>();

const dialog = ref<HTMLDialogElement | null>(null);

const isOrderConfirmation = computed(
  () => props.title === "ยืนยันการสั่งซื้อ" && Boolean(props.deliveryMethod),
);

const deliveryPriceText = computed(() => {
  const price = Number(props.deliveryMethod?.price || 0);
  if (price <= 0) return "ฟรี";

  return `฿${new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price)}`;
});

const confirmClass = computed(() => {
  if (props.variant === "primary") return "btn-primary";
  if (props.variant === "warning") return "btn-warning";
  return "btn-error";
});

const iconClass = computed(() => {
  if (props.variant === "primary") return "text-primary";
  if (props.variant === "warning") return "text-warning";
  return "text-error";
});

const close = () => {
  emit("update:modelValue", false);
  emit("cancel");
};

const onDialogClose = () => {
  if (props.modelValue) {
    emit("update:modelValue", false);
    emit("cancel");
  }
};

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen && !dialog.value?.open) {
      dialog.value?.showModal();
      return;
    }

    if (!isOpen && dialog.value?.open) {
      dialog.value.close();
    }
  },
);
</script>
