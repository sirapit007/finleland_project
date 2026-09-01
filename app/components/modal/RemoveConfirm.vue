<template>
  <dialog
    ref="dialog"
    class="modal"
    @cancel.prevent="close"
    @close="onDialogClose"
  >
    <div
      class="modal-box"
      :class="isOrderConfirmation ? 'max-w-lg' : 'max-w-xs'"
    >
      <h3 class="text-lg font-bold">{{ displayTitle }}</h3>
      <div class="mt-5 text-center">
        <Icon :name="displayIcon" :class="iconClass" size="60" />
      </div>
      <p
        v-if="displayMessage"
        class="mt-4 text-center text-sm text-base-content/65"
      >
        {{ displayMessage }}
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
                  class="badge badge-xs badge-soft"
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
      <div
        v-if="removeErrorMessage"
        role="alert"
        class="alert alert-error alert-soft mt-4 py-2 text-left text-sm"
      >
        <Icon name="lucide:circle-alert" class="shrink-0" size="18" />
        <span>{{ removeErrorMessage }}</span>
      </div>
      <div class="modal-action">
        <button
          class="btn btn-sm flex-1"
          type="button"
          :disabled="displayLoading"
          @click="close"
        >
          {{ cancelText }}
        </button>
        <button
          class="btn btn-sm flex-1"
          :class="confirmClass"
          type="button"
          :disabled="displayLoading"
          @click="onConfirm"
        >
          <span
            v-if="displayLoading"
            class="loading loading-spinner loading-xs"
          />
          <template v-else>{{ displayConfirmText }}</template>
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop" @submit.prevent="close">
      <button :disabled="displayLoading">{{ cancelText }}</button>
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

type RemoveRow = Record<string, unknown>;

type RemoveRequest = {
  row: RemoveRow;
  path: string;
};

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "error" | "primary" | "warning";
    icon?: string;
    loading?: boolean;
    shippingAddress?: ConfirmShippingAddress | null;
    deliveryMethod?: any | null;
  }>(),
  {
    modelValue: false,
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
  removed: [row: RemoveRow, response: unknown, path: string];
  "remove-error": [error: unknown, row: RemoveRow, path: string];
}>();

const dialog = ref<HTMLDialogElement | null>(null);
const internalOpen = ref(false);
const removeRequest = ref<RemoveRequest | null>(null);
const removing = ref(false);
const removeErrorMessage = ref("");

const isRemoveMode = computed(() => Boolean(removeRequest.value));
const isOpen = computed(() => props.modelValue || internalOpen.value);
const displayTitle = computed(() =>
  isRemoveMode.value ? "ยืนยันการลบรายการนี้" : props.title,
);
const displayMessage = computed(() => {
  if (!isRemoveMode.value) return props.message;

  const row = removeRequest.value?.row;
  const itemName =
    row?.product_name ??
    row?.category_name ??
    row?.subcategory_name ??
    row?.supplier_name ??
    row?.promotion_name ??
    row?.promotion_type_name ??
    row?.username ??
    row?.email;

  return itemName ? `รายการที่เลือก: ${String(itemName)}` : "";
});
const displayConfirmText = computed(() =>
  isRemoveMode.value ? "ยืนยัน" : props.confirmText,
);
const displayIcon = computed(() =>
  isRemoveMode.value ? "lucide:trash-2" : props.icon,
);
const displayVariant = computed(() =>
  isRemoveMode.value ? "error" : props.variant,
);
const displayLoading = computed(() => props.loading || removing.value);

const isOrderConfirmation = computed(
  () =>
    !isRemoveMode.value &&
    props.title === "ยืนยันการสั่งซื้อ" &&
    Boolean(props.deliveryMethod),
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
  if (displayVariant.value === "primary") return "btn-primary";
  if (displayVariant.value === "warning") return "btn-warning";
  return "btn-error";
});

const iconClass = computed(() => {
  if (displayVariant.value === "primary") return "text-primary";
  if (displayVariant.value === "warning") return "text-warning";
  return "text-error";
});

const resetRemoveState = () => {
  removeRequest.value = null;
  removeErrorMessage.value = "";
};

const close = () => {
  if (displayLoading.value) return;

  internalOpen.value = false;
  emit("update:modelValue", false);
  emit("cancel");
};

const onDialogClose = () => {
  if (isOpen.value) {
    internalOpen.value = false;
    emit("update:modelValue", false);
    emit("cancel");
  }
};

const onRemove = async (row: RemoveRow, path: string) => {
  removeRequest.value = {
    row: { ...row },
    path: path.trim().replace(/\/+$/, ""),
  };
  removeErrorMessage.value = "";
  internalOpen.value = true;
};

const onSubmit = async () => {
  if (!removeRequest.value || removing.value) return;

  const { path } = removeRequest.value;
  const row = { ...removeRequest.value.row };
  const identifier = row.uuid;

  if (!path) {
    removeErrorMessage.value = "ไม่พบ API path สำหรับลบรายการ";
    return;
  }

  if (identifier === undefined || identifier === null || identifier === "") {
    removeErrorMessage.value = "ไม่พบ uuid ของรายการที่ต้องการลบ";
    return;
  }

  removing.value = true;
  removeErrorMessage.value = "";

  try {
    const response = await $fetch(
      `${path}/${encodeURIComponent(String(identifier))}`,
      {
        method: "delete",
        body: { ...row },
      },
    );

    emit("removed", row, response, path);
    internalOpen.value = false;
    emit("update:modelValue", false);
  } catch (error: unknown) {
    const fetchError = error as { data?: { statusMessage?: string } };
    removeErrorMessage.value =
      fetchError.data?.statusMessage ||
      "ไม่สามารถลบรายการได้ กรุณาลองใหม่อีกครั้ง";
    emit("remove-error", error, row, path);
  } finally {
    removing.value = false;
  }
};

const onConfirm = () => {
  if (isRemoveMode.value) {
    void onSubmit();
    return;
  }

  emit("confirm");
};

const syncDialog = (open: boolean) => {
  if (open && !dialog.value?.open) {
    dialog.value?.showModal();
    return;
  }

  if (!open && dialog.value?.open) {
    dialog.value.close();
  }
};

defineExpose({
  onRemove,
  onSubmit,
});

onMounted(() => syncDialog(isOpen.value));

watch(
  () => props.modelValue,
  (open) => {
    if (open && !internalOpen.value) {
      resetRemoveState();
    }
  },
);

watch(isOpen, syncDialog);
</script>
