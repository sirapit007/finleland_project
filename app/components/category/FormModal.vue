<template>
  <dialog ref="dialog" class="modal" @cancel.prevent="close">
    <div class="modal-box max-w-sm">
      <h3 class="text-lg font-bold">
        {{ method === "put" ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่" }}
      </h3>

      <div class="mt-4 space-y-3">
        <ImageUpload v-model="form.image_url" />

        <fieldset class="fieldset">
          <legend class="fieldset-legend">ชื่อหมวดหมู่</legend>
          <input
            v-model="form.category_name"
            type="text"
            maxlength="40"
            class="input input-sm w-full"
            placeholder="สูงสุด 40 ตัวอักษร..."
            :disabled="saving"
          />
        </fieldset>
      </div>

      <div
        v-if="errorMessage"
        class="alert alert-error alert-soft mt-4 text-sm"
      >
        <Icon name="lucide:circle-alert" size="18" />
        <span>{{ errorMessage }}</span>
      </div>

      <div class="modal-action grid grid-cols-2 gap-3">
        <button
          class="btn btn-sm"
          type="button"
          :disabled="saving"
          @click="close"
        >
          ปิด
        </button>
        <button
          class="btn btn-sm btn-primary"
          type="button"
          :disabled="saving"
          @click="onSubmit"
        >
          <span v-if="saving" class="loading loading-spinner loading-xs" />
          <Icon v-else name="lucide:save" size="16" />
          {{ saving ? "กำลังบันทึก..." : "บันทึก" }}
        </button>
      </div>
    </div>

    <form method="dialog" class="modal-backdrop" @submit.prevent="close">
      <button :disabled="saving" aria-label="ปิดหน้าต่าง">ปิด</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
type CategoryForm = {
  [key: string]: unknown;
  uuid?: string;
  category_name?: string;
  image_url?: string;
};

const emit = defineEmits<{
  changed: [row: CategoryForm];
  "save-error": [error: unknown, row: CategoryForm];
  close: [];
}>();

const dialog = ref<HTMLDialogElement | null>(null);
const form = ref<CategoryForm>({});
const method = ref<"post" | "put">("post");
const saving = ref(false);
const errorMessage = ref("");

const open = () => {
  if (!dialog.value?.open) {
    dialog.value?.showModal();
  }
};

const close = () => {
  if (saving.value) return;

  dialog.value?.close();
  emit("close");
};

const onCreate = async (defaults: Partial<CategoryForm> = {}) => {
  form.value = { ...defaults };
  method.value = "post";
  errorMessage.value = "";
  open();
};

const onEdit = async (row: CategoryForm) => {
  form.value = { ...row };
  method.value = "put";
  errorMessage.value = "";
  open();
};

const onSubmit = async () => {
  if (saving.value) return;

  errorMessage.value = "";
  const row = { ...form.value };

  if (!String(row.category_name || "").trim()) {
    errorMessage.value = "กรุณากรอกชื่อหมวดหมู่";
    return;
  }

  if (method.value === "put" && !row.uuid) {
    errorMessage.value = "ไม่พบ uuid ของหมวดหมู่ที่ต้องการแก้ไข";
    return;
  }

  saving.value = true;

  try {
    const path =
      method.value === "post"
        ? "/api/categories"
        : `/api/categories/${encodeURIComponent(String(row.uuid))}`;
    const response = await $fetch<{ row?: CategoryForm }>(path, {
      method: method.value,
      body: row,
    });
    const savedRow = response.row ?? row;

    form.value = { ...savedRow };
    emit("changed", { ...savedRow });
    dialog.value?.close();
  } catch (error: unknown) {
    const fetchError = error as { data?: { statusMessage?: string } };
    errorMessage.value =
      fetchError.data?.statusMessage ||
      "ไม่สามารถบันทึกหมวดหมู่ได้ กรุณาลองใหม่อีกครั้ง";
    emit("save-error", error, row);
  } finally {
    saving.value = false;
  }
};

defineExpose({
  onCreate,
  onEdit,
  onSubmit,
});
</script>
