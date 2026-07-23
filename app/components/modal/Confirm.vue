<template>
  <dialog ref="dialog" class="modal" @close="onDialogClose">
    <div class="modal-box max-w-xs">
      <h3 class="text-lg font-bold">{{ title }}</h3>
      <div class="mt-5 text-center">
        <Icon :name="icon" :class="iconClass" size="60" />
      </div>
      <p v-if="message" class="mt-4 text-center text-sm text-base-content/65">
        {{ message }}
      </p>
      <div class="modal-action">
        <button class="btn btn-sm flex-1" type="button" :disabled="loading" @click="close">
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
  }>(),
  {
    title: "ยืนยันการดำเนินการ",
    message: "",
    confirmText: "ยืนยัน",
    cancelText: "ปิด",
    variant: "error",
    icon: "lucide:message-circle-warning",
    loading: false,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  confirm: [];
  cancel: [];
}>();

const dialog = ref<HTMLDialogElement | null>(null);

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
