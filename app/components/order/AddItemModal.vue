<template>
  <dialog ref="baseModal" class="modal">
    <div class="modal-box max-w-md">
      <form method="dialog">
        <button
          class="btn btn-circle btn-ghost btn-sm absolute right-3 top-3"
          :disabled="isSaving"
          aria-label="ปิดหน้าต่างเพิ่มสินค้า"
        >
          X
        </button>
      </form>

      <h3 class="text-lg font-bold">เพิ่มสินค้าในคำสั่งซื้อ</h3>

      <div class="mt-4 space-y-3">
        <fieldset class="fieldset">
          <legend class="fieldset-legend">สินค้า</legend>
          <ComboBox
            v-model="form.productUuid"
            fetch-url="/api/products"
            label="product_name"
            value="uuid"
            placeholder="ค้นหาและเลือกสินค้า"
            :disabled="isSaving"
            @select="selectProduct"
          />
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">จำนวน</legend>
          <input
            v-model.number="form.quantity"
            type="number"
            min="1"
            class="input input-sm w-full"
            placeholder="จำนวนสินค้า"
            :disabled="isSaving"
          />
        </fieldset>

        <div v-if="form.productName" class="rounded-xl bg-base-200 p-3 text-sm">
          <p class="font-semibold">{{ form.productName }}</p>
          <p class="mt-1 text-base-content/60">
            ราคาปกติ ฿{{ formatMoney(form.unitPrice) }}
          </p>
        </div>
      </div>

      <div class="modal-action">
        <button
          class="btn btn-sm flex-1"
          type="button"
          :disabled="isSaving"
          @click="baseModal?.close()"
        >
          ปิด
        </button>
        <button
          class="btn btn-primary btn-sm flex-1"
          type="button"
          :disabled="!form.productUuid || form.quantity < 1 || isSaving"
          @click="addItem"
        >
          <span v-if="isSaving" class="loading loading-spinner loading-xs" />
          <template v-else>เพิ่มสินค้า</template>
        </button>
      </div>
    </div>
  </dialog>
</template>

<script setup lang="ts">
type Row = Record<string, any>;

type OrderDetail = {
  items: Row[];
  histories: Row[];
  adjustments: Row[];
  payments: Row[];
};

const props = defineProps<{
  order: Row;
  detail?: OrderDetail;
}>();

const baseModal = ref<HTMLDialogElement | null>(null);
const isSaving = ref(false);
const { showToast } = useToast();

const form = reactive({
  productUuid: "",
  productCode: "",
  productName: "",
  productImage: null as any,
  quantity: 1,
  unitPrice: 0,
});

const formatMoney = (value: number | string) =>
  new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const reloadDetails = async () => {
  const orderUuid = String(props.order.uuid || "");
  if (!orderUuid) return;

  const [items, histories, adjustments, payments]: any = await Promise.all([
    $fetch("/api/order/items", {
      params: { order_item_order: orderUuid, pageSize: 100 },
    }),
    $fetch("/api/order/status-histories", {
      params: { order_status_history_order: orderUuid, pageSize: 100 },
    }),
    $fetch("/api/order/item-adjustments", {
      params: { order_item_adjustment_order: orderUuid },
    }),
    $fetch("/api/order/payments", {
      params: { order_payment_order: orderUuid, pageSize: 100 },
    }),
  ]);

  if (props.detail) {
    Object.assign(props.detail, {
      items: items.rows || [],
      histories: histories.rows || [],
      adjustments: adjustments.rows || [],
      payments: payments.rows || [],
    });
  }

  await refreshNuxtData();
};

const open = () => {
  Object.assign(form, {
    productUuid: "",
    productCode: "",
    productName: "",
    productImage: null,
    quantity: 1,
    unitPrice: 0,
  });
  baseModal.value?.showModal();
};

const selectProduct = (product: Row) => {
  Object.assign(form, {
    productUuid: product.uuid || "",
    productCode: product.product_code || "",
    productName: product.product_name || "",
    productImage: product.image_url || null,
    unitPrice: Number(product.product_selling_price || 0),
  });
};

const addItem = async () => {
  if (!props.order.uuid || isSaving.value) return;
  isSaving.value = true;

  try {
    await $fetch("/api/order/items", {
      method: "POST",
      body: {
        order_item_order: props.order.uuid,
        order_item_product: form.productUuid,
        order_item_product_code: form.productCode,
        order_item_product_name: form.productName,
        order_item_product_image: form.productImage,
        order_item_unit_price: form.unitPrice,
        order_item_quantity: form.quantity,
        order_item_discount: 0,
      },
    });
    baseModal.value?.close();
    showToast("เพิ่มสินค้าในคำสั่งซื้อแล้ว");
    await reloadDetails();
  } catch (error: any) {
    showToast(error?.data?.statusMessage || "ไม่สามารถเพิ่มสินค้าได้", "error");
  } finally {
    isSaving.value = false;
  }
};

defineExpose({ open });
</script>
