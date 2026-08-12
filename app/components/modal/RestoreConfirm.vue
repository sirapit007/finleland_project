<template>
  <dialog
    ref="dialog"
    class="modal"
    :aria-labelledby="titleId"
    :aria-describedby="descriptionId"
    @cancel.prevent="close"
    @close="onDialogClose"
  >
    <div class="modal-box max-w-sm overflow-hidden p-0">
      <div class="relative px-6 pb-6 pt-7 text-center">
        <button
          class="btn btn-ghost btn-sm btn-circle absolute right-3 top-3 text-base-content/55"
          type="button"
          :disabled="restoring"
          aria-label="ปิดหน้าต่าง"
          @click="close"
        >
          <Icon name="lucide:x" size="18" />
        </button>

        <div
          class="mx-auto flex size-16 items-center justify-center rounded-full bg-success/10 ring-8 ring-success/5"
        >
          <Icon name="lucide:rotate-ccw" class="text-success" size="24" />
        </div>

        <h3 :id="titleId" class="mt-4 sm:text-lg text-base font-bold">
          ยืนยันที่จะกู้คืนรายการนี้
        </h3>
        <p
          :id="descriptionId"
          class="mx-auto mt-2 max-w-xs sm:text-sm text-xs leading-6 text-base-content/65"
        >
          รายการที่กู้คืนจะกลับมาแสดงและสามารถใช้งานได้ตามปกติ
        </p>

        <div
          v-if="selectedItemName"
          class="mt-4 flex items-center gap-3 rounded-xl border border-base-300 bg-base-200/60 px-4 py-3 text-left"
        >
          <div class="min-w-0 space-x-2 flex items-center">
            <p class="text-xs text-base-content/50">รายการที่เลือก: </p>
            <p class="truncate text-sm font-semibold">
              {{ selectedItemName }}
            </p>
          </div>
        </div>

        <div
          v-if="errorMessage"
          role="alert"
          class="alert alert-error alert-soft mt-4 py-2 text-left text-sm"
        >
          <Icon name="lucide:circle-alert" class="shrink-0" size="18" />
          <span>{{ errorMessage }}</span>
        </div>
      </div>

      <div
        class="grid grid-cols-2 gap-3 border-t border-base-300 bg-base-200/35 p-4"
      >
        <button
          class="btn btn-sm"
          type="button"
          :disabled="restoring"
          @click="close"
        >
          ปิด
        </button>
        <button
          class="btn btn-success btn-sm"
          type="button"
          :disabled="restoring"
          @click="onSubmit"
        >
          <span v-if="restoring" class="loading loading-spinner loading-xs" />
          <Icon v-else name="lucide:rotate-ccw" size="16" />
          {{ restoring ? "กำลังกู้คืน..." : "ยืนยันการกู้คืน" }}
        </button>
      </div>
    </div>

    <form method="dialog" class="modal-backdrop" @submit.prevent="close">
      <button :disabled="restoring" aria-label="ปิดหน้าต่าง">ปิด</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
type RestoreRow = Record<string, unknown>;

const props = withDefaults(
  defineProps<{
    endpoint?: string;
    identifierKey?: string;
    itemNameKey?: string;
  }>(),
  {
    endpoint: "/api/suppliers",
    identifierKey: "uuid",
    itemNameKey: "supplier_name",
  },
);

const emit = defineEmits<{
  restored: [row: RestoreRow, response: unknown];
  "restore-error": [error: unknown, row: RestoreRow];
  cancel: [];
}>();

const dialog = ref<HTMLDialogElement | null>(null);
const showRestoreModal = ref(false);
const restoring = ref(false);
const selectedRow = ref<RestoreRow | null>(null);
const errorMessage = ref("");
const titleId = useId();
const descriptionId = useId();

const selectedItemName = computed(() => {
  const value = selectedRow.value?.[props.itemNameKey];
  return value == null ? "" : String(value);
});

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
  if (restoring.value) return;

  showRestoreModal.value = false;
  emit("cancel");
};

const onDialogClose = () => {
  if (showRestoreModal.value) {
    showRestoreModal.value = false;
    emit("cancel");
  }
};

const onRestore = (row: RestoreRow) => {
  selectedRow.value = { ...row };
  errorMessage.value = "";
  showRestoreModal.value = true;
};

const onSubmit = async () => {
  if (!selectedRow.value || restoring.value) return;

  const row = { ...selectedRow.value };
  const identifier = row[props.identifierKey];

  if (identifier === undefined || identifier === null || identifier === "") {
    errorMessage.value = `ไม่พบข้อมูล ${props.identifierKey} ของรายการ`;
    return;
  }

  restoring.value = true;
  errorMessage.value = "";

  try {
    const endpoint = props.endpoint.replace(/\/$/, "");
    const response = await $fetch(
      `${endpoint}/${encodeURIComponent(String(identifier))}`,
      {
        method: "put",
        body: { ...row },
      },
    );

    emit("restored", row, response);
    showRestoreModal.value = false;
  } catch (error) {
    errorMessage.value = "ไม่สามารถกู้คืนรายการได้ กรุณาลองใหม่อีกครั้ง";
    emit("restore-error", error, row);
  } finally {
    restoring.value = false;
  }
};

defineExpose({
  onRestore,
});

onMounted(() => syncDialog(showRestoreModal.value));
watch(showRestoreModal, syncDialog);
</script>
