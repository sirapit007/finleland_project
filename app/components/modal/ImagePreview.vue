<template>
  <dialog ref="dialog" class="modal" @cancel.prevent="close" @close="onClose">
    <div class="modal-box w-11/12 max-w-4xl p-3 sm:p-5">
      <button
        class="btn btn-sm btn-circle btn-neutral absolute right-2 top-2 z-10"
        type="button"
        aria-label="ปิดหน้าต่างรูปภาพ"
        @click="close"
      >
        <Icon name="lucide:x" size="18" />
      </button>

      <div
        class="flex min-h-64 items-center justify-center overflow-hidden rounded-xl bg-base-200 p-3 sm:min-h-96 sm:p-5"
      >
        <img
          v-if="src"
          :src="src"
          :alt="alt"
          class="max-h-[75dvh] w-full object-contain"
        />
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button aria-label="ปิดหน้าต่างรูปภาพ">ปิด</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    src?: string;
    alt?: string;
  }>(),
  {
    src: "",
    alt: "รูปภาพสินค้า",
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const dialog = ref<HTMLDialogElement | null>(null);

const syncDialog = (isOpen: boolean) => {
  if (!dialog.value) return;

  if (isOpen && !dialog.value.open) {
    dialog.value.showModal();
  }

  if (!isOpen && dialog.value.open) {
    dialog.value.close();
  }
};

const close = () => {
  emit("update:modelValue", false);
};

const onClose = () => {
  if (props.modelValue) {
    emit("update:modelValue", false);
  }
};

onMounted(() => syncDialog(props.modelValue));
watch(() => props.modelValue, syncDialog);
</script>
