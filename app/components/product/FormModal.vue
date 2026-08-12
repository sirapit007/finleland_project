<template>
  <dialog
    ref="dialog"
    class="modal"
    :aria-labelledby="titleId"
    :aria-describedby="descriptionId"
    @cancel.prevent="close"
    @close="onDialogClose"
  >
    <div
      class="modal-box flex max-h-[92dvh] w-11/12 max-w-7xl flex-col overflow-hidden p-0"
    >
      <header
        class="flex shrink-0 items-start justify-between gap-4 border-b border-base-300 px-5 py-4 sm:px-6"
      >
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <h3 :id="titleId" class="text-lg font-bold">
              {{ modalTitle }}
            </h3>
          </div>
          <p
            :id="descriptionId"
            class="mt-1 text-xs text-base-content/55 sm:text-sm"
          >
            {{ modalDescription }}
          </p>
        </div>

        <button
          class="btn btn-sm btn-circle btn-ghost shrink-0"
          type="button"
          :disabled="saving"
          aria-label="ปิดหน้าต่าง"
          @click="close"
        >
          <Icon name="lucide:x" size="18" />
        </button>
      </header>

      <div class="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
        <div
          class="grid grid-cols-1 gap-5"
          :class="
            isDeleted
              ? 'lg:grid-cols-[minmax(16rem,0.8fr)_1.2fr]'
              : 'lg:grid-cols-2'
          "
        >
          <section>
            <p class="mb-2 text-sm font-semibold">รูปภาพสินค้า</p>

            <MultiImageUpload v-if="!isDeleted" v-model="editableImages" />

            <div
              v-else-if="productImages.length"
              class="grid gap-3 sm:grid-cols-2"
            >
              <figure
                v-for="(url, index) in productImages"
                :key="`${url}-${index}`"
                class="overflow-hidden rounded-xl border border-base-300 bg-base-200"
              >
                <img
                  :src="url"
                  :alt="`รูปสินค้า ${form.product_name || ''}`"
                  class="h-44 w-full object-cover cursor-pointer"
                  @click="
                    imagePreviewModal?.onOpen(
                      firstProductImageUrl(form.image_url),
                    )
                  "
                />
              </figure>
            </div>

            <div
              v-else
              class="flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed border-base-300 bg-base-200/50 text-base-content/45"
            >
              <Icon name="lucide:image-off" size="32" />
              <p class="mt-2 text-sm">ไม่มีรูปภาพสินค้า</p>
            </div>
          </section>

          <section
            class="grid content-start grid-cols-1 gap-x-4 sm:grid-cols-2"
          >
            <fieldset class="fieldset">
              <legend class="fieldset-legend">รหัสสินค้า</legend>
              <input
                v-model="form.product_code"
                type="text"
                class="input input-sm w-full"
                placeholder="สูงสุด 50 ตัวอักษร..."
                :disabled="formDisabled"
              />
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">ชื่อสินค้า</legend>
              <input
                v-model="form.product_name"
                type="text"
                class="input input-sm w-full"
                placeholder="สูงสุด 150 ตัวอักษร..."
                :disabled="formDisabled"
              />
            </fieldset>

            <fieldset class="fieldset sm:col-span-2">
              <legend class="fieldset-legend">รายละเอียดสินค้า</legend>
              <textarea
                v-model="form.product_description"
                class="textarea textarea-sm min-h-24 w-full"
                placeholder="กรอกรายละเอียดสินค้า..."
                :disabled="formDisabled"
              />
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">ผู้จัดจำหน่าย</legend>
              <ComboBox
                ref="supplierComboBox"
                v-model="form.product_supplier"
                fetch-url="/api/suppliers"
                placeholder="เลือกผู้จัดจำหน่าย..."
                label="supplier_name"
                value="uuid"
                :disabled="formDisabled"
                allow-create
                create-label="เพิ่มผู้จัดจำหน่ายใหม่"
                @create="onCreateSupplier"
              />
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">หมวดหมู่สินค้า</legend>
              <ComboBox
                v-model="form.product_category"
                ref="categoryComboBox"
                fetch-url="/api/categories"
                placeholder="เลือกหมวดหมู่สินค้า..."
                label="category_name"
                value="uuid"
                allow-create
                create-label="เพิ่มหมวดหมู่หลักใหม่"
                @create="onCreateCategory"
                :disabled="formDisabled"
                @select="onCategorySelect"
              />
            </fieldset>

            <fieldset class="fieldset sm:col-span-2">
              <legend class="fieldset-legend">หมวดหมู่ย่อย</legend>
              <MultiComboBox
                ref="subcategoryComboBox"
                v-model="form.product_subcategories"
                :fetch-url="subcategoryFetchUrl"
                placeholder="เลือกหมวดหมู่ย่อย..."
                label="subcategory_name"
                value="uuid"
                :disabled="formDisabled || !form.product_category"
                allow-create
                create-label="เพิ่มหมวดหมู่ย่อยใหม่"
                @create="onCreateSubcategory"
              />
              <p
                v-if="!form.product_category"
                class="mt-1 text-xs text-base-content/50"
              >
                เลือกหมวดหมู่หลักก่อน จึงจะเลือกหรือเพิ่มหมวดหมู่ย่อยได้
              </p>
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">ราคาทุน</legend>
              <input
                v-model="form.product_cost_price"
                type="number"
                min="0"
                class="input input-sm w-full"
                placeholder="ตัวเลขมากกว่าหรือเท่ากับ 0..."
                :disabled="formDisabled"
              />
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">ราคาขาย</legend>
              <input
                v-model="form.product_selling_price"
                type="number"
                min="0"
                class="input input-sm w-full"
                placeholder="ตัวเลขมากกว่าหรือเท่ากับ 0..."
                :disabled="formDisabled"
              />
            </fieldset>
          </section>
        </div>

        <div
          v-if="errorMessage"
          role="alert"
          class="alert alert-error alert-soft mt-5 text-sm"
        >
          <Icon name="lucide:circle-alert" class="shrink-0" size="18" />
          <span>{{ errorMessage }}</span>
        </div>

        <section
          v-if="showPromotions"
          class="mt-6 border-t border-base-300 pt-5"
        >
          <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 class="font-semibold">โปรโมชั่นของสินค้า</h4>
              <p class="text-xs text-base-content/50">
                ทั้งหมด {{ promotions.length }} รายการ
              </p>
            </div>
            <button
              v-if="!isDeleted"
              class="btn btn-secondary btn-xs"
              type="button"
              :disabled="saving || loadingPromotions"
              @click="onCreatePromotion"
            >
              <Icon name="lucide:plus" size="16" />
              เพิ่มโปรโมชั่น
            </button>
          </div>

          <div class="overflow-x-auto rounded-xl border border-base-300">
            <table class="table table-zebra table-xs min-w-max">
              <thead>
                <tr class="text-xs">
                  <th>#</th>
                  <th>ชื่อโปรโมชั่น</th>
                  <th>รายละเอียด</th>
                  <th class="text-right">ราคา</th>
                  <th>วันที่เริ่มต้น</th>
                  <th>วันที่สิ้นสุด</th>
                  <th>สร้างโดย / เมื่อ</th>
                  <th>แก้ไขโดย / เมื่อ</th>
                  <th v-if="!isDeleted" />
                </tr>
              </thead>
              <tbody>
                <tr v-if="loadingPromotions">
                  <td :colspan="isDeleted ? 8 : 9" class="py-8 text-center">
                    <span
                      class="loading loading-spinner loading-sm text-primary"
                    />
                    <span class="ml-2 text-base-content/55">
                      กำลังโหลดโปรโมชั่น...
                    </span>
                  </td>
                </tr>
                <tr v-else-if="!promotions.length">
                  <td
                    :colspan="isDeleted ? 8 : 9"
                    class="py-8 text-center text-base-content/45"
                  >
                    ไม่พบโปรโมชั่นของสินค้านี้
                  </td>
                </tr>
                <tr
                  v-for="(row, index) in promotions"
                  v-else
                  :key="row.uuid ?? row.id ?? index"
                  class="hover:bg-primary/5"
                >
                  <th>{{ row.id ?? index + 1 }}</th>
                  <td>{{ row.promotion_name || "-" }}</td>
                  <td class="max-w-64 whitespace-normal">
                    {{ row.promotion_description || "-" }}
                  </td>
                  <td class="text-right">{{ promotionPrice(row) }}</td>
                  <td>{{ row.promotion_start_date || "-" }}</td>
                  <td>{{ row.promotion_end_date || "-" }}</td>
                  <td>
                    <div>
                      {{ row.created_username ?? row.created_by ?? "-" }}
                    </div>
                    <div class="text-base-content/55">
                      {{ row.created_at || "-" }}
                    </div>
                  </td>
                  <td>
                    <div>
                      {{ row.updated_username ?? row.updated_by ?? "-" }}
                    </div>
                    <div class="text-base-content/55">
                      {{ row.updated_at || "-" }}
                    </div>
                  </td>
                  <td v-if="!isDeleted" class="text-right">
                    <button
                      class="btn btn-xs btn-link"
                      type="button"
                      :disabled="saving"
                      @click="onEditPromotion(row)"
                    >
                      แก้ไข
                    </button>
                    <button
                      class="btn btn-error btn-xs btn-link no-underline"
                      type="button"
                      :disabled="saving"
                      @click="onRemovePromotion(row)"
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <footer
        class="grid shrink-0 gap-3 border-t border-base-300 bg-base-200/35 p-4"
        :class="isDeleted ? 'grid-cols-1' : 'grid-cols-2'"
      >
        <button
          class="btn btn-sm"
          type="button"
          :disabled="saving"
          @click="close"
        >
          ปิด
        </button>
        <button
          v-if="!isDeleted"
          class="btn btn-primary btn-sm"
          type="button"
          :disabled="saving"
          @click="onSubmit"
        >
          <span v-if="saving" class="loading loading-spinner loading-xs" />
          <Icon v-else name="lucide:save" size="16" />
          {{ saving ? "กำลังบันทึก..." : "บันทึก" }}
        </button>
      </footer>
    </div>

    <form method="dialog" class="modal-backdrop" @submit.prevent="close">
      <button :disabled="saving" aria-label="ปิดหน้าต่าง">ปิด</button>
    </form>
  </dialog>

  <ModalImagePreview ref="imagePreviewModal" />

  <PromotionFormModal ref="promotionFormModal" @changed="loadPromotions" />

  <SupplierFormModal ref="supplierFormModal" @changed="onSupplierCreated" />

  <CategoryFormModal ref="categoryFormModal" @changed="onCategoryCreated" />

  <SubcategoryFormModal
    ref="subcategoryFormModal"
    @changed="onSubcategoryCreated"
  />
</template>

<CategoryFormModal ref="categoryFormModal" @changed="onCategoryCreated" />
<SupplierFormModal ref="supplierFormModal" @changed="onSupplierCreated" />
<script setup lang="ts">
import { normalizeProductImageUrls } from "~/utils/productImages";

type ImagePreviewExpose = {
  onOpen: (src: string) => void;
};

const imagePreviewModal = ref<ImagePreviewExpose | null>(null);

type ProductForm = {
  [key: string]: unknown;
  image_url?: unknown;
  product_code?: string;
  product_name?: string;
  product_description?: string;
  product_category?: string;
  product_supplier?: string;
  product_subcategories?: any[];
  product_cost_price?: number | string;
  product_selling_price?: number | string;
};

type PromotionRow = {
  id?: number | string;
  uuid?: string;
  promotion_name?: string;
  promotion_description?: string;
  promotion_discounted_price?: number | string;
  promotion_bundle_price?: number | string;
  promotion_start_date?: string;
  promotion_end_date?: string;
  created_username?: string;
  created_by?: string;
  created_at?: string;
  updated_username?: string;
  updated_by?: string;
  updated_at?: string;
};

type PromotionFormModalExpose = {
  onCreate: (product: ProductForm) => Promise<void>;
  onEdit: (row: PromotionRow, product: ProductForm) => Promise<void>;
  onRemove: (row: PromotionRow) => void;
};

type SubcategoryRow = {
  [key: string]: unknown;
  uuid?: string;
  subcategory_category?: string;
  subcategory_name?: string;
};

type SubcategoryFormModalExpose = {
  onCreate: (defaults: Partial<SubcategoryRow>) => Promise<void>;
};

type MultiComboBoxExpose = {
  addOption: (row: SubcategoryRow, select?: boolean) => void;
};

type OptionRow = Record<string, any>;

type CreateOptionModalExpose = {
  onCreate: (defaults?: OptionRow) => Promise<void>;
};

type ComboBoxExpose = {
  selectOption: (row: OptionRow) => void;
  refreshOptions: () => Promise<void>;
};

const props = withDefaults(
  defineProps<{
    isDeleted?: boolean;
  }>(),
  {
    isDeleted: false,
  },
);

const emit = defineEmits<{
  saved: [row: ProductForm, response: unknown];
  "save-error": [error: unknown, row: ProductForm];
  close: [];
}>();

const dialog = ref<HTMLDialogElement | null>(null);
const promotionFormModal = ref<PromotionFormModalExpose | null>(null);
const isOpen = ref(false);
const form = ref<ProductForm>({});
const subcategoryFormModal = ref<SubcategoryFormModalExpose | null>(null);
const subcategoryComboBox = ref<MultiComboBoxExpose | null>(null);
const method = ref<"post" | "put">("post");
const promotions = ref<PromotionRow[]>([]);
const errorMessage = ref("");
const categoryFormModal = ref<CreateOptionModalExpose | null>(null);
const supplierFormModal = ref<CreateOptionModalExpose | null>(null);
const categoryComboBox = ref<ComboBoxExpose | null>(null);
const supplierComboBox = ref<ComboBoxExpose | null>(null);
const saving = ref(false);
const loadingPromotions = ref(false);
const titleId = useId();
const descriptionId = useId();
let promotionRequestId = 0;

const formDisabled = computed(() => props.isDeleted || saving.value);
const showPromotions = computed(
  () => props.isDeleted || method.value === "put",
);
const productImages = computed(() =>
  normalizeProductImageUrls(form.value.image_url),
);
const subcategoryFetchUrl = computed(() => {
  const category = String(form.value.product_category || "");
  return category
    ? "/api/subcategories?category=" + encodeURIComponent(category)
    : "";
});
const editableImages = computed<string[]>({
  get: () => productImages.value,
  set: (images) => {
    form.value = { ...form.value, image_url: images };
  },
});

const modalTitle = computed(() => {
  if (props.isDeleted) return "รายละเอียดสินค้า";
  return method.value === "put" ? "แก้ไขสินค้า" : "เพิ่มสินค้า";
});

const modalDescription = computed(() => {
  if (props.isDeleted) {
    return "รายการนี้อยู่ในรายการที่กู้คืนได้ ข้อมูลทั้งหมดจึงแสดงในโหมดดูอย่างเดียว";
  }

  return method.value === "put"
    ? "แก้ไขข้อมูลสินค้าและจัดการโปรโมชั่นที่เกี่ยวข้อง"
    : "กรอกข้อมูลสำหรับเพิ่มสินค้าใหม่";
});

const promotionPrice = (row: PromotionRow) => {
  const value = Number(row.promotion_discounted_price)
    ? row.promotion_discounted_price
    : row.promotion_bundle_price;

  return value === undefined || value === null || value === "" ? "-" : value;
};

const syncDialog = (open: boolean) => {
  if (!dialog.value) return;

  if (open && !dialog.value.open) {
    dialog.value.showModal();
  }

  if (!open && dialog.value.open) {
    dialog.value.close();
  }
};

const close = () => {
  if (saving.value) return;

  promotionRequestId += 1;
  loadingPromotions.value = false;
  isOpen.value = false;
  emit("close");
};

const onDialogClose = () => {
  if (isOpen.value) {
    isOpen.value = false;
    emit("close");
  }
};

const loadPromotions = async () => {
  const uuid = form.value.uuid;
  const requestId = ++promotionRequestId;

  promotions.value = [];
  if (uuid === undefined || uuid === null || uuid === "") return;

  loadingPromotions.value = true;

  try {
    const response = await $fetch<{ rows?: PromotionRow[] }>(
      `/api/promotion/${encodeURIComponent(String(uuid))}`,
    );

    if (requestId === promotionRequestId) {
      promotions.value = response.rows ?? [];
    }
  } catch (error) {
    if (requestId === promotionRequestId) {
      errorMessage.value =
        "ไม่สามารถโหลดโปรโมชั่นของสินค้านี้ได้ กรุณาลองใหม่อีกครั้ง";
    }
  } finally {
    if (requestId === promotionRequestId) {
      loadingPromotions.value = false;
    }
  }
};

const onCreate = async () => {
  promotionRequestId += 1;
  form.value = { product_subcategories: [] };
  method.value = "post";
  promotions.value = [];
  errorMessage.value = "";
  loadingPromotions.value = false;
  isOpen.value = true;
};

const onEdit = async (row: ProductForm) => {
  const selectedSubcategories = Array.isArray(row.product_subcategories)
    ? row.product_subcategories
        .map((item) =>
          typeof item === "object" && item && "uuid" in item
            ? String(item.uuid || "")
            : String(item || ""),
        )
        .filter(Boolean)
    : [];
  form.value = { ...row, product_subcategories: selectedSubcategories };
  method.value = "put";
  errorMessage.value = "";
  isOpen.value = true;

  await loadPromotions();
};

const onSubmit = async () => {
  if (props.isDeleted || saving.value) return;

  errorMessage.value = "";
  const row = { ...form.value };

  if (
    method.value === "put" &&
    (row.uuid === undefined || row.uuid === null || row.uuid === "")
  ) {
    errorMessage.value = "ไม่พบ uuid ของสินค้าที่ต้องการแก้ไข";
    return;
  }

  saving.value = true;

  const path =
    method.value === "post"
      ? "/api/products"
      : `/api/products/${encodeURIComponent(String(row.uuid ?? ""))}`;

  try {
    const response = await $fetch(path, {
      method: method.value,
      body: { ...row },
    });

    emit("saved", row, response);
    isOpen.value = false;
  } catch (error: unknown) {
    const fetchError = error as { data?: { statusMessage?: string } };
    errorMessage.value =
      fetchError.data?.statusMessage ||
      "ไม่สามารถบันทึกสินค้าได้ กรุณาลองใหม่อีกครั้ง";
    emit("save-error", error, row);
  } finally {
    saving.value = false;
  }
};

const onCreatePromotion = () => {
  promotionFormModal.value?.onCreate({ ...form.value });
};
const onCategorySelect = () => {
  form.value.product_subcategories = [];
};

const onCreateCategory = (query: string) => {
  categoryFormModal.value?.onCreate({ category_name: query });
};

const onCategoryCreated = (row: OptionRow) => {
  categoryComboBox.value?.selectOption(row);
};

const onCreateSupplier = (query: string) => {
  supplierFormModal.value?.onCreate({ supplier_name: query });
};

const onSupplierCreated = (row: OptionRow) => {
  supplierComboBox.value?.selectOption(row);
};

const onCreateSubcategory = (query: string) => {
  if (!form.value.product_category) {
    errorMessage.value = "กรุณาเลือกหมวดหมู่หลักก่อนเพิ่มหมวดหมู่ย่อย";
    return;
  }
  subcategoryFormModal.value?.onCreate({
    subcategory_category: form.value.product_category,
    subcategory_name: query,
  });
};

const onSubcategoryCreated = (row: SubcategoryRow) => {
  subcategoryComboBox.value?.addOption(row, true);
};

const onEditPromotion = (row: PromotionRow) => {
  promotionFormModal.value?.onEdit(row, { ...form.value });
};

const onRemovePromotion = (row: PromotionRow) => {
  promotionFormModal.value?.onRemove(row);
};

defineExpose({
  onCreate,
  onEdit,
  onSubmit,
  refreshPromotions: loadPromotions,
});

onMounted(() => syncDialog(isOpen.value));
watch(isOpen, syncDialog);
</script>
