<template>
  <dialog ref="dialog" class="modal" @cancel.prevent="close">
    <div class="modal-box max-w-md">
      <h3 class="text-lg font-bold">
        {{ method === "put" ? "แก้ไขหมวดหมู่ย่อย" : "เพิ่มหมวดหมู่ย่อย" }}
      </h3>

      <div class="mt-4 space-y-3 min-h-[600px]">
        <ImageUpload v-model="form.image_url" />

        <fieldset class="fieldset">
          <legend class="fieldset-legend">หมวดหมู่หลัก</legend>
          <ComboBox
            ref="categoryComboBox"
            v-model="form.subcategory_category"
            fetch-url="/api/categories"
            placeholder="เลือกหมวดหมู่หลัก..."
            label="category_name"
            value="uuid"
            :disabled="saving"
            allow-create
            create-label="เพิ่มหมวดหมู่หลักใหม่"
            @create="categoryFormModal?.onCreate({ category_name: $event })"
          />
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">ชื่อหมวดหมู่ย่อย</legend>
          <textarea
            v-model="form.subcategory_name"
            maxlength="100"
            class="textarea textarea-sm w-full"
            placeholder="สูงสุด 100 ตัวอักษร..."
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

  <CategoryFormModal ref="categoryFormModal" @changed="onCategoryCreated" />
</template>

<script setup lang="ts">
type SubcategoryForm = {
  [key: string]: unknown;
  uuid?: string;
  subcategory_category?: string;
  subcategory_name?: string;
  image_url?: string;
};

type CategoryRow = {
  [key: string]: unknown;
  uuid?: string;
  category_name?: string;
};

type CategoryFormModalExpose = {
  onCreate: (defaults?: Partial<CategoryRow>) => Promise<void>;
};

type ComboBoxExpose = {
  selectOption: (row: CategoryRow) => void;
  refreshOptions: () => Promise<void>;
};

const emit = defineEmits<{
  // changed: [row: SubcategoryForm];
  changed: [row: any];
  "save-error": [error: unknown, row: SubcategoryForm];
  close: [];
}>();

const dialog = ref<HTMLDialogElement | null>(null);
const categoryFormModal = ref<CategoryFormModalExpose | null>(null);
const categoryComboBox = ref<ComboBoxExpose | null>(null);
const form = ref<SubcategoryForm>({});
const method = ref<"post" | "put">("post");
const saving = ref(false);
const errorMessage = ref("");

const open = () => {
  if (!dialog.value?.open) dialog.value?.showModal();
};

const close = () => {
  if (saving.value) return;
  dialog.value?.close();
  emit("close");
};

const onCreate = async (defaults: Partial<SubcategoryForm> = {}) => {
  form.value = { ...defaults };
  method.value = "post";
  errorMessage.value = "";
  open();
};

const onEdit = async (row: SubcategoryForm) => {
  form.value = { ...row };
  method.value = "put";
  errorMessage.value = "";
  open();
};

const onCategoryCreated = (row: CategoryRow) => {
  if (row.uuid) {
    form.value.subcategory_category = row.uuid;
    categoryComboBox.value?.selectOption(row);
  } else {
    void categoryComboBox.value?.refreshOptions();
  }
};

const onSubmit = async () => {
  if (saving.value) return;
  errorMessage.value = "";
  const row = { ...form.value };

  if (!String(row.subcategory_category || "").trim()) {
    errorMessage.value = "กรุณาเลือกหมวดหมู่หลัก";
    return;
  }
  if (!String(row.subcategory_name || "").trim()) {
    errorMessage.value = "กรุณากรอกชื่อหมวดหมู่ย่อย";
    return;
  }
  if (method.value === "put" && !row.uuid) {
    errorMessage.value = "ไม่พบ uuid ของหมวดหมู่ย่อยที่ต้องการแก้ไข";
    return;
  }

  saving.value = true;

  try {
    const path =
      method.value === "post"
        ? "/api/subcategories"
        : `/api/subcategories/${encodeURIComponent(String(row.uuid))}`;
    const response = await $fetch<{ row?: SubcategoryForm }>(path, {
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
      "ไม่สามารถบันทึกหมวดหมู่ย่อยได้ กรุณาลองใหม่อีกครั้ง";
    emit("save-error", error, row);
  } finally {
    saving.value = false;
  }
};

defineExpose({ onCreate, onEdit, onSubmit });
</script>
