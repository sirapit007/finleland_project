<template>
  <dialog ref="dialog" class="modal" @cancel.prevent="close">
    <div class="modal-box max-w-sm">
      <h3 class="text-lg font-bold">
        {{ method === "put" ? "แก้ไขผู้จัดจำหน่าย" : "เพิ่มผู้จัดจำหน่าย" }}
      </h3>

      <div class="mt-4 space-y-3">
        <fieldset class="fieldset">
          <legend class="fieldset-legend">รหัสผู้จัดจำหน่าย</legend>
          <input
            v-model="form.supplier_code"
            type="text"
            maxlength="20"
            class="input input-sm w-full"
            placeholder="สูงสุด 20 ตัวอักษร..."
            :disabled="saving"
          />
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">ชื่อผู้จัดจำหน่าย</legend>
          <input
            v-model="form.supplier_name"
            type="text"
            maxlength="150"
            class="input input-sm w-full"
            placeholder="สูงสุด 150 ตัวอักษร..."
            :disabled="saving"
          />
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">ที่อยู่ผู้จัดจำหน่าย</legend>
          <textarea
            v-model="form.supplier_address"
            class="textarea textarea-sm w-full"
            placeholder="กรอกที่อยู่ผู้จัดจำหน่าย..."
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
type SupplierForm = {
  [key: string]: unknown;
  uuid?: string;
  supplier_code?: string;
  supplier_name?: string;
  supplier_address?: string;
};

const emit = defineEmits<{
  changed: [row: SupplierForm];
  "save-error": [error: unknown, row: SupplierForm];
  close: [];
}>();

const dialog = ref<HTMLDialogElement | null>(null);
const form = ref<SupplierForm>({});
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

const onCreate = async (defaults: Partial<SupplierForm> = {}) => {
  form.value = { ...defaults };
  method.value = "post";
  errorMessage.value = "";
  open();
};

const onEdit = async (row: SupplierForm) => {
  form.value = { ...row };
  method.value = "put";
  errorMessage.value = "";
  open();
};

const onSubmit = async () => {
  if (saving.value) return;

  errorMessage.value = "";
  const row = { ...form.value };

  if (!String(row.supplier_code || "").trim()) {
    errorMessage.value = "กรุณากรอกรหัสผู้จัดจำหน่าย";
    return;
  }

  if (!String(row.supplier_name || "").trim()) {
    errorMessage.value = "กรุณากรอกชื่อผู้จัดจำหน่าย";
    return;
  }

  if (method.value === "put" && !row.uuid) {
    errorMessage.value = "ไม่พบ uuid ของผู้จัดจำหน่ายที่ต้องการแก้ไข";
    return;
  }

  saving.value = true;

  try {
    const path =
      method.value === "post"
        ? "/api/suppliers"
        : `/api/suppliers/${encodeURIComponent(String(row.uuid))}`;
    const response = await $fetch<{ row?: SupplierForm }>(path, {
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
      "ไม่สามารถบันทึกผู้จัดจำหน่ายได้ กรุณาลองใหม่อีกครั้ง";
    emit("save-error", error, row);
  } finally {
    saving.value = false;
  }
};

defineExpose({
  onCreate: onCreate,
  onEdit: onEdit,
  onSubmit: onSubmit,
});
</script>
