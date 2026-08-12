<template>
  <dialog
    ref="dialog"
    class="modal"
    @cancel.prevent="close"
    @close="onDialogClose"
  >
    <div class="modal-box w-11/12 max-w-4xl p-3 sm:p-5">
      <!-- <button
        class="btn btn-sm btn-circle btn-neutral absolute right-2 top-2 z-10"
        type="button"
        aria-label="ปิดหน้าต่างรูปภาพ"
        @click="close"
      >
        <Icon name="lucide:x" size="18" />
      </button> -->

      <div
        class="flex min-h-64 items-center justify-center overflow-hidden rounded-xl bg-base-200 p-3 sm:min-h-96 sm:p-5"
      >
        <img
          v-if="imageSrc"
          :src="imageSrc"
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
    modelValue?: boolean;
    src?: string;
    alt?: string;
  }>(),
  {
    modelValue: false,
    src: "",
    alt: "รูปภาพสินค้า",
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  close: [];
}>();

const dialog = ref<HTMLDialogElement | null>(null);
const isImagePreviewOpen = ref(props.modelValue);
const imageSrc = ref(props.src);

const onOpen = (src: string) => {
  imageSrc.value = src;
  isImagePreviewOpen.value = true;
  emit("update:modelValue", true);
};

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
  isImagePreviewOpen.value = false;
  emit("update:modelValue", false);
  emit("close");
};

const onDialogClose = () => {
  if (isImagePreviewOpen.value) {
    isImagePreviewOpen.value = false;
    emit("update:modelValue", false);
    emit("close");
  }
};

defineExpose({
  onOpen,
  close,
});

onMounted(() => syncDialog(isImagePreviewOpen.value));

watch(
  () => props.modelValue,
  (isOpen) => {
    isImagePreviewOpen.value = isOpen;
  },
);

watch(
  () => props.src,
  (src) => {
    imageSrc.value = src;
  },
);

watch(isImagePreviewOpen, syncDialog, { flush: "post" });
</script>
