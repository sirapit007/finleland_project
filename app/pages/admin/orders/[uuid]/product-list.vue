<template>
  <main class="product-list-preview">
    <div class="print-toolbar">
      <div>
        <p class="toolbar-title">รายการสินค้า</p>
        <p class="toolbar-description">
          ตรวจสอบข้อมูลก่อนพิมพ์หรือบันทึกเป็น PDF
        </p>
      </div>
      <div class="toolbar-actions">
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          @click="closePreview"
        >
          <Icon name="lucide:x" size="16" /> ปิด
        </button>
        <button
          type="button"
          class="btn btn-primary btn-sm"
          :disabled="!productListData"
          @click="printDocument"
        >
          <Icon name="lucide:printer" size="16" /> พิมพ์รายการสินค้า
        </button>
      </div>
    </div>

    <div v-if="status === 'pending'" class="document-loading" aria-live="polite">
      <span class="loading loading-spinner loading-lg text-primary" />
      <p>กำลังเตรียมรายการสินค้า...</p>
    </div>

    <div
      v-else-if="error || !productListData"
      class="document-error"
      role="alert"
    >
      <Icon name="lucide:file-warning" size="42" class="text-error" />
      <h1>ไม่สามารถเปิดรายการสินค้าได้</h1>
      <p>{{ errorMessage }}</p>
      <button
        type="button"
        class="btn btn-outline btn-sm"
        @click="closePreview"
      >
        กลับไปหน้าจัดการคำสั่งซื้อ
      </button>
    </div>

    <OrderProductListDocument
      v-else
      :order="productListData.order"
      :items="productListData.items"
      :printed-by="productListData.printedBy"
      :printed-at="productListData.printedAt"
    />
  </main>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
});

type ProductListRow = Record<string, any>;
type ProductListData = {
  order: ProductListRow;
  items: ProductListRow[];
  printedBy: string;
  printedAt: string;
};

const route = useRoute();
const requestFetch = useRequestFetch();
const orderUuid = computed(() => String(route.params.uuid || "").trim());

const { data, status, error } = await useAsyncData<ProductListData>(
  () => `admin-order-product-list-${orderUuid.value}`,
  async () => {
    if (!orderUuid.value) {
      throw createError({
        statusCode: 400,
        statusMessage: "ไม่พบรหัสคำสั่งซื้อ",
      });
    }

    return requestFetch<ProductListData>("/api/admin/order-product-list", {
      query: { orderUuid: orderUuid.value },
    });
  },
);

const productListData = computed(() => data.value || null);
const errorMessage = computed(
  () =>
    (error.value as any)?.data?.statusMessage ||
    (error.value as any)?.statusMessage ||
    "กรุณาตรวจสอบสิทธิ์ผู้ดูแลระบบแล้วลองใหม่อีกครั้ง",
);

useHead(() => ({
  title: productListData.value?.order?.order_number
    ? `รายการสินค้า ${productListData.value.order.order_number}`
    : "รายการสินค้าคำสั่งซื้อ",
}));

const waitForImages = async () => {
  const images = Array.from(document.images).filter((image) => !image.complete);
  await Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve) => {
          image.addEventListener("load", () => resolve(), { once: true });
          image.addEventListener("error", () => resolve(), { once: true });
        }),
    ),
  );
};

const printDocument = async () => {
  if (!import.meta.client || !productListData.value) return;
  await nextTick();
  if (document.fonts?.ready) await document.fonts.ready;
  await waitForImages();
  window.print();
};

const closePreview = () => {
  if (!import.meta.client) return;
  window.close();
  window.setTimeout(() => {
    if (!window.closed && window.history.length > 1) window.history.back();
  }, 100);
};

onMounted(() => {
  if (route.query.print === "1" && productListData.value) {
    window.setTimeout(() => void printDocument(), 300);
  }
});
</script>

<style>
@page {
  size: A4 portrait;
  margin: 0;
}

html,
body {
  background: #e8edf4;
}

.product-list-preview {
  min-height: 100vh;
  padding: 78px 20px 36px;
}

.print-toolbar {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 50;
  display: flex;
  min-height: 60px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 24px;
  border-bottom: 1px solid #cbd5e1;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 5px 18px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(10px);
}

.toolbar-title {
  margin: 0;
  color: #172033;
  font-size: 14px;
  font-weight: 700;
}

.toolbar-description {
  margin: 1px 0 0;
  color: #64748b;
  font-size: 11px;
}

.toolbar-actions {
  display: flex;
  gap: 8px;
}

.document-loading,
.document-error {
  display: flex;
  min-height: 65vh;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #475569;
  text-align: center;
}

.document-error h1,
.document-error p {
  margin: 0;
}

.document-error h1 {
  color: #172033;
  font-size: 20px;
  font-weight: 700;
}

@media (max-width: 760px) {
  .product-list-preview {
    min-width: 210mm;
    padding-right: 0;
    padding-left: 0;
  }

  .print-toolbar {
    width: 100vw;
  }

  .toolbar-description {
    display: none;
  }
}

@media print {
  html,
  body {
    width: 210mm;
    min-width: 210mm;
    margin: 0;
    padding: 0;
    background: #fff !important;
  }

  .product-list-preview {
    width: 210mm;
    min-width: 210mm;
    min-height: 297mm;
    margin: 0;
    padding: 0;
  }

  .print-toolbar,
  .document-loading,
  .document-error {
    display: none !important;
  }
}
</style>
