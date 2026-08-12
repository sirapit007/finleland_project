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
      class="modal-box flex max-h-[92dvh] w-11/12 max-w-5xl flex-col overflow-hidden p-0"
    >
      <header
        class="flex shrink-0 items-start justify-between gap-4 border-b border-base-300 px-5 py-4 sm:px-6"
      >
        <div class="min-w-0">
          <h3 :id="titleId" class="text-lg font-bold">
            {{ method === "put" ? "แก้ไขโปรโมชั่น" : "เพิ่มโปรโมชั่น" }}
          </h3>
          <p
            :id="descriptionId"
            class="mt-1 text-xs text-base-content/55 sm:text-sm"
          >
            {{ promotionContextDescription }}
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
          class="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(18rem,0.8fr)_1.2fr]"
        >
          <section>
            <p class="mb-2 text-sm font-semibold">รูปภาพโปรโมชั่น</p>
            <ImageUpload v-model="form.image_url" />
          </section>

          <section
            class="grid content-start grid-cols-1 gap-x-4 sm:grid-cols-2"
          >
            <fieldset v-if="canSelectProduct" class="fieldset sm:col-span-2">
              <legend class="fieldset-legend">สินค้าที่ร่วมโปรโมชั่น</legend>
              <ComboBox
                v-model="form.promotion_product"
                fetch-url="/api/products"
                placeholder="เลือกสินค้า..."
                label="product_name"
                value="uuid"
                :disabled="saving"
                @select="onProductSelect"
              />
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">ประเภทโปรโมชั่น</legend>
              <ComboBox
                v-model="form.promotion_type"
                fetch-url="/api/promotion/types"
                placeholder="เลือกประเภทโปรโมชั่น..."
                label="promotion_type_name"
                value="uuid"
                :disabled="saving"
              />
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">ชื่อโปรโมชั่น</legend>
              <input
                v-model="form.promotion_name"
                type="text"
                class="input input-sm w-full"
                placeholder="สูงสุด 100 ตัวอักษร..."
                :disabled="saving"
              />
            </fieldset>

            <fieldset class="fieldset sm:col-span-2">
              <legend class="fieldset-legend">รายละเอียดโปรโมชั่น</legend>
              <textarea
                v-model="form.promotion_description"
                class="textarea textarea-sm min-h-20 w-full"
                placeholder="กรอกรายละเอียดโปรโมชั่น..."
                :disabled="saving"
              />
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">วันที่เริ่มโปรโมชั่น</legend>
              <input
                v-model="form.promotion_start_date"
                type="date"
                class="input input-sm w-full"
                :disabled="saving"
              />
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">วันที่สิ้นสุดโปรโมชั่น</legend>
              <input
                v-model="form.promotion_end_date"
                type="date"
                class="input input-sm w-full"
                :disabled="saving"
              />
            </fieldset>

            <fieldset v-if="!isBundlePromotion" class="fieldset">
              <legend class="fieldset-legend">ราคาหลังส่วนลด</legend>
              <input
                v-model="form.promotion_discounted_price"
                type="number"
                min="1"
                class="input input-sm w-full"
                placeholder="ตัวเลขมากกว่า 0..."
                :disabled="saving"
              />
            </fieldset>

            <fieldset v-if="isMinQuantityPromotion" class="fieldset">
              <legend class="fieldset-legend">จำนวนขั้นต่ำ</legend>
              <input
                v-model="form.promotion_min_quantity"
                type="number"
                min="1"
                class="input input-sm w-full"
                placeholder="ตัวเลขมากกว่า 0..."
                :disabled="saving"
              />
            </fieldset>

            <fieldset v-if="isMinPurchasePromotion" class="fieldset">
              <legend class="fieldset-legend">ยอดซื้อขั้นต่ำ</legend>
              <input
                v-model="form.promotion_min_purchase_amount"
                type="number"
                min="1"
                class="input input-sm w-full"
                placeholder="ตัวเลขมากกว่า 0..."
                :disabled="saving"
              />
            </fieldset>

            <fieldset v-if="isBundlePromotion" class="fieldset sm:col-span-2">
              <legend class="fieldset-legend">ราคาชุดโปรโมชั่น</legend>
              <input
                v-model="form.promotion_bundle_price"
                type="number"
                min="1"
                class="input input-sm w-full"
                placeholder="ตัวเลขมากกว่า 0..."
                :disabled="saving"
              />
            </fieldset>
          </section>
        </div>

        <section
          v-if="isBundlePromotion"
          class="mt-6 border-t border-base-300 pt-5"
        >
          <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 class="font-semibold">สินค้าในชุดโปรโมชั่น</h4>
              <p class="text-xs text-base-content/50">
                กำหนดสินค้า จำนวน และราคาต่อหน่วยภายในชุด
              </p>
            </div>
            <button
              class="btn btn-neutral btn-sm"
              type="button"
              :disabled="saving || loadingBundleItems"
              @click="addBundleItem"
            >
              <Icon name="lucide:plus" size="16" />
              เพิ่มรายการ
            </button>
          </div>

          <div
            v-if="loadingBundleItems"
            class="flex min-h-32 items-center justify-center rounded-xl border border-base-300"
          >
            <span class="loading loading-spinner loading-sm text-secondary" />
            <span class="ml-2 text-sm text-base-content/55">
              กำลังโหลดสินค้าในชุด...
            </span>
          </div>

          <div v-else class="grid gap-3 md:grid-cols-2">
            <article
              v-for="(item, index) in bundleItems"
              :key="item.uuid ?? item._key"
              class="relative rounded-xl border border-base-300 bg-base-200/35 p-4"
            >
              <span
                class="badge badge-neutral badge-sm absolute left-3 top-3 rounded-full text-[10px]"
              >
                {{ index + 1 }}
              </span>
              <button
                v-if="index > 1"
                class="btn btn-error btn-xs btn-circle btn-ghost absolute right-2 top-2"
                type="button"
                :disabled="saving"
                aria-label="ลบสินค้าออกจากชุด"
                @click="removeBundleItem(index)"
              >
                <Icon name="lucide:x" size="14" />
              </button>

              <fieldset class="fieldset mt-5">
                <legend class="fieldset-legend">สินค้าในชุด</legend>
                <ComboBox
                  v-model="item.bundle_item_product"
                  fetch-url="/api/products"
                  placeholder="เลือกสินค้า..."
                  label="product_name"
                  value="uuid"
                  :disabled="saving || index === 0"
                />
              </fieldset>

              <div class="grid grid-cols-2 gap-3">
                <fieldset class="fieldset">
                  <legend class="fieldset-legend">จำนวน</legend>
                  <input
                    v-model="item.bundle_item_quantity"
                    type="number"
                    min="1"
                    class="input input-sm w-full"
                    placeholder="จำนวน..."
                    :disabled="saving"
                  />
                </fieldset>
                <fieldset class="fieldset">
                  <legend class="fieldset-legend">ราคาต่อหน่วย</legend>
                  <input
                    v-model="item.bundle_item_unit_price"
                    type="number"
                    min="1"
                    class="input input-sm w-full"
                    placeholder="ราคา..."
                    :disabled="saving"
                  />
                </fieldset>
              </div>
            </article>
          </div>
        </section>

        <div
          v-if="errorMessage"
          role="alert"
          class="alert alert-error alert-soft mt-5 text-sm"
        >
          <Icon name="lucide:circle-alert" class="shrink-0" size="18" />
          <span>{{ errorMessage }}</span>
        </div>
      </div>

      <footer
        class="grid shrink-0 grid-cols-2 gap-3 border-t border-base-300 bg-base-200/35 p-4"
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
          class="btn btn-secondary btn-sm"
          type="button"
          :disabled="saving || loadingBundleItems"
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

  <ModalRemoveConfirm
    ref="removeConfirmModal"
    @removed="onPromotionRemoved"
    @remove-error="onPromotionRemoveError"
  />
</template>

<script setup lang="ts">
const BUNDLE_PROMOTION_TYPE = "70977b66-e3d8-45f2-bdfb-b9776f959027";
const MIN_QUANTITY_PROMOTION_TYPE = "3d13b772-9442-48d8-90a0-f35d825d390a";
const MIN_PURCHASE_PROMOTION_TYPE = "be08aae7-30ef-46d1-a415-e581cd71a903";

type ProductContext = {
  [key: string]: unknown;
  uuid?: string;
  product_name?: string;
};

type PromotionForm = {
  [key: string]: unknown;
  id?: number | string;
  uuid?: string;
  promotion_product?: string;
  promotion_type?: string;
  promotion_name?: string;
  promotion_description?: string;
  promotion_start_date?: string;
  promotion_end_date?: string;
  promotion_discounted_price?: number | string;
  promotion_min_quantity?: number | string;
  promotion_min_purchase_amount?: number | string;
  promotion_bundle_price?: number | string;
  image_url?: string;
};

type BundleItem = {
  [key: string]: unknown;
  _key: string;
  uuid?: string;
  bundle_item_promotion?: string;
  bundle_item_product?: string;
  bundle_item_quantity?: number | string;
  bundle_item_unit_price?: number | string;
};

type RemoveConfirmExpose = {
  onRemove: (row: Record<string, unknown>, path: string) => Promise<void>;
  onSubmit: () => Promise<void>;
};

const emit = defineEmits<{
  changed: [action: "saved" | "removed", row: PromotionForm];
  "save-error": [error: unknown, row: PromotionForm];
  "remove-error": [error: unknown, row: PromotionForm];
  close: [];
}>();

const dialog = ref<HTMLDialogElement | null>(null);
const removeConfirmModal = ref<RemoveConfirmExpose | null>(null);
const isOpen = ref(false);
const method = ref<"post" | "put">("post");
const form = ref<PromotionForm>({});
const product = ref<ProductContext>({});
const productIsFixed = ref(false);
const bundleItems = ref<BundleItem[]>([]);
const removedBundleItemUuids = ref<string[]>([]);
const saving = ref(false);
const loadingBundleItems = ref(false);
const errorMessage = ref("");
const titleId = useId();
const descriptionId = useId();
let bundleItemKey = 0;
let bundleRequestId = 0;

const isBundlePromotion = computed(
  () => form.value.promotion_type === BUNDLE_PROMOTION_TYPE,
);
const isMinQuantityPromotion = computed(
  () => form.value.promotion_type === MIN_QUANTITY_PROMOTION_TYPE,
);
const isMinPurchasePromotion = computed(
  () => form.value.promotion_type === MIN_PURCHASE_PROMOTION_TYPE,
);
const canSelectProduct = computed(() => !productIsFixed.value);
const promotionContextDescription = computed(() => {
  if (productIsFixed.value) {
    return `โปรโมชั่นสำหรับสินค้า ${product.value.product_name || "ที่เลือก"}`;
  }

  return product.value.product_name
    ? `โปรโมชั่นสำหรับสินค้า ${product.value.product_name}`
    : "เลือกสินค้าและกำหนดรายละเอียดโปรโมชั่น";
});

const createBundleItem = (
  values: Partial<Omit<BundleItem, "_key">> = {},
): BundleItem => ({
  _key: `bundle-item-${++bundleItemKey}`,
  bundle_item_product: "",
  bundle_item_quantity: 0,
  bundle_item_unit_price: 0,
  ...values,
});

const resetBundleItems = () => {
  const productUuid = String(
    form.value.promotion_product || product.value.uuid || "",
  );
  bundleItems.value = [
    createBundleItem({ bundle_item_product: productUuid }),
    createBundleItem(),
  ];
  removedBundleItemUuids.value = [];
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

  bundleRequestId += 1;
  loadingBundleItems.value = false;
  isOpen.value = false;
  emit("close");
};

const onDialogClose = () => {
  if (isOpen.value) {
    isOpen.value = false;
    emit("close");
  }
};

const loadBundleItems = async (promotionUuid: string) => {
  const requestId = ++bundleRequestId;
  loadingBundleItems.value = true;

  try {
    const response = await $fetch<{ rows?: Array<Omit<BundleItem, "_key">> }>(
      `/api/bundle-items/${encodeURIComponent(promotionUuid)}`,
    );

    if (requestId !== bundleRequestId) return;

    bundleItems.value = (response.rows ?? []).map((row) =>
      createBundleItem(row),
    );

    if (!bundleItems.value.length && isBundlePromotion.value) {
      resetBundleItems();
    }
  } catch (error) {
    if (requestId === bundleRequestId) {
      errorMessage.value =
        "ไม่สามารถโหลดสินค้าในชุดโปรโมชั่นได้ กรุณาลองใหม่อีกครั้ง";
    }
  } finally {
    if (requestId === bundleRequestId) {
      loadingBundleItems.value = false;
    }
  }
};

const onCreate = async (productRow: ProductContext = {}) => {
  bundleRequestId += 1;
  product.value = { ...productRow };
  productIsFixed.value = Boolean(productRow.uuid);
  form.value = {
    promotion_product: String(productRow.uuid || ""),
  };
  method.value = "post";
  errorMessage.value = "";
  loadingBundleItems.value = false;
  resetBundleItems();
  isOpen.value = true;
};

const onEdit = async (
  promotionRow: PromotionForm,
  productRow: ProductContext = {},
) => {
  productIsFixed.value = Boolean(productRow.uuid);
  product.value = {
    ...productRow,
    uuid: String(productRow.uuid || promotionRow.promotion_product || ""),
  };
  form.value = { ...promotionRow };
  method.value = "put";
  errorMessage.value = "";
  removedBundleItemUuids.value = [];
  bundleItems.value = [];
  isOpen.value = true;

  if (promotionRow.uuid) {
    await loadBundleItems(promotionRow.uuid);
  }
};

const onProductSelect = (productRow: ProductContext) => {
  product.value = productRow.uuid ? { ...productRow } : {};
};

const addBundleItem = () => {
  bundleItems.value.push(createBundleItem());
};

const removeBundleItem = (index: number) => {
  if (index <= 1) return;

  const item = bundleItems.value[index];
  if (item?.uuid) {
    removedBundleItemUuids.value.push(item.uuid);
  }

  bundleItems.value.splice(index, 1);
};

const deleteBundleItems = async (uuids: string[]) => {
  await Promise.all(
    [...new Set(uuids)].map((uuid) =>
      $fetch(`/api/bundle-items/${encodeURIComponent(uuid)}`, {
        method: "delete",
      }),
    ),
  );
};

const syncBundleItems = async (promotionUuid: string) => {
  const existingUuids = bundleItems.value.flatMap((item) =>
    item.uuid ? [item.uuid] : [],
  );
  const uuidsToDelete = isBundlePromotion.value
    ? removedBundleItemUuids.value
    : [...removedBundleItemUuids.value, ...existingUuids];

  await deleteBundleItems(uuidsToDelete);

  if (!isBundlePromotion.value) {
    bundleItems.value = [];
    removedBundleItemUuids.value = [];
    return;
  }

  bundleItems.value = await Promise.all(
    bundleItems.value.map(async (item) => {
      const { _key, ...itemBody } = item;
      const path = item.uuid
        ? `/api/bundle-items/${encodeURIComponent(item.uuid)}`
        : "/api/bundle-items";
      const response = await $fetch<{ row?: Omit<BundleItem, "_key"> }>(path, {
        method: item.uuid ? "put" : "post",
        body: {
          ...itemBody,
          bundle_item_promotion: promotionUuid,
        },
      });

      return createBundleItem(response.row ?? itemBody);
    }),
  );
  removedBundleItemUuids.value = [];
};

const onSubmit = async () => {
  if (saving.value) return;

  errorMessage.value = "";
  const row = { ...form.value };

  if (!row.promotion_product) {
    errorMessage.value = "กรุณาเลือกสินค้าที่เข้าร่วมโปรโมชั่น";
    return;
  }

  if (method.value === "put" && !row.uuid) {
    errorMessage.value = "ไม่พบ uuid ของโปรโมชั่นที่ต้องการแก้ไข";
    return;
  }

  saving.value = true;

  try {
    const path = row.uuid
      ? `/api/promotion/${encodeURIComponent(row.uuid)}`
      : "/api/promotion";
    const response = await $fetch<{ row?: PromotionForm }>(path, {
      method: row.uuid ? "put" : "post",
      body: { ...row },
    });
    const savedRow = response.row;

    if (!savedRow?.uuid) {
      throw new Error("Promotion API did not return uuid");
    }

    form.value = { ...form.value, ...savedRow };
    method.value = "put";
    await syncBundleItems(savedRow.uuid);

    emit("changed", "saved", { ...form.value });
    isOpen.value = false;
  } catch (error: unknown) {
    const fetchError = error as { data?: { statusMessage?: string } };
    errorMessage.value =
      fetchError.data?.statusMessage ||
      "ไม่สามารถบันทึกโปรโมชั่นได้ กรุณาลองใหม่อีกครั้ง";
    emit("save-error", error, { ...form.value });
  } finally {
    saving.value = false;
  }
};

const onRemove = (promotionRow: PromotionForm) => {
  void removeConfirmModal.value?.onRemove(promotionRow, "/api/promotion");
};

const onPromotionRemoved = (row: Record<string, unknown>) => {
  emit("changed", "removed", row as PromotionForm);
};

const onPromotionRemoveError = (
  error: unknown,
  row: Record<string, unknown>,
) => {
  emit("remove-error", error, row as PromotionForm);
};

defineExpose({
  onCreate,
  onEdit,
  onSubmit,
  onRemove,
});

watch(
  () => form.value.promotion_type,
  (type) => {
    if (type !== BUNDLE_PROMOTION_TYPE) return;

    if (method.value === "post" && canSelectProduct.value) {
      resetBundleItems();
      return;
    }

    if (!bundleItems.value.length) {
      resetBundleItems();
    }
  },
);
watch(
  () => form.value.promotion_product,
  (productUuid) => {
    const firstBundleItem = bundleItems.value[0];
    if (firstBundleItem) {
      firstBundleItem.bundle_item_product = String(productUuid || "");
    }
  },
);
onMounted(() => syncDialog(isOpen.value));
watch(isOpen, syncDialog);
</script>
