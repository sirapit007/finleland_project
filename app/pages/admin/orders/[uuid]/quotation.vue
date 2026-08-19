<template>
  <main class="quotation-preview">
    <div class="print-toolbar">
      <div>
        <p class="toolbar-title">ใบเสนอราคา</p>
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
          :disabled="!quotationData"
          @click="printDocument"
        >
          <Icon name="lucide:printer" size="16" /> พิมพ์ใบเสนอราคา
        </button>
      </div>
    </div>

    <div
      v-if="status === 'pending'"
      class="quotation-loading"
      aria-live="polite"
    >
      <span class="loading loading-spinner loading-lg text-primary" />
      <p>กำลังเตรียมใบเสนอราคา...</p>
    </div>

    <div
      v-else-if="error || !quotationData"
      class="quotation-error"
      role="alert"
    >
      <Icon name="lucide:file-warning" size="42" class="text-error" />
      <h1>ไม่สามารถเปิดใบเสนอราคาได้</h1>
      <p>{{ errorMessage }}</p>
      <button
        type="button"
        class="btn btn-outline btn-sm"
        @click="closePreview"
      >
        กลับไปหน้าจัดการคำสั่งซื้อ
      </button>
    </div>

    <OrderQuotationDocument
      v-else
      :order="quotationData.order"
      :items="quotationData.items"
      :prepared-by="quotationData.preparedBy"
      :printed-at="quotationData.printedAt"
    />
  </main>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
});

type QuotationRow = Record<string, any>;
type QuotationData = {
  order: QuotationRow;
  items: QuotationRow[];
  preparedBy: string;
  printedAt: string;
};

const route = useRoute();
const requestFetch = useRequestFetch();
const orderUuid = computed(() => String(route.params.uuid || "").trim());

const { data, status, error } = await useAsyncData<QuotationData>(
  () => `admin-order-quotation-${orderUuid.value}`,
  async () => {
    if (!orderUuid.value) {
      throw createError({
        statusCode: 400,
        statusMessage: "ไม่พบรหัสคำสั่งซื้อ",
      });
    }

    const [orderResponse, itemResponse] = await Promise.all([
      requestFetch<{ row: QuotationRow | null }>(
        `/api/order/${orderUuid.value}`,
      ),
      requestFetch<{ rows: QuotationRow[] }>("/api/order/items", {
        query: {
          order_item_order: orderUuid.value,
          pageSize: 100,
          orderBy: "base.id ASC",
        },
      }),
    ]);

    if (!orderResponse.row) {
      throw createError({
        statusCode: 404,
        statusMessage: "ไม่พบคำสั่งซื้อ หรือคุณไม่มีสิทธิ์ดูเอกสารนี้",
      });
    }

    return {
      order: orderResponse.row,
      items: itemResponse.rows || [],
      preparedBy:
        orderResponse.row.updated_username ||
        orderResponse.row.created_username ||
        "ผู้ดูแลระบบ",
      printedAt: new Date().toISOString(),
    };
  },
);

const quotationData = computed(() => data.value || null);
const errorMessage = computed(
  () =>
    (error.value as any)?.data?.statusMessage ||
    (error.value as any)?.statusMessage ||
    "กรุณาตรวจสอบสิทธิ์การใช้งานแล้วลองใหม่อีกครั้ง",
);

useHead(() => ({
  title: quotationData.value?.order?.order_number
    ? `ใบเสนอราคา ${quotationData.value.order.order_number}`
    : "ใบเสนอราคาคำสั่งซื้อ",
}));

const printDocument = async () => {
  if (!import.meta.client || !quotationData.value) return;
  await nextTick();
  if (document.fonts?.ready) await document.fonts.ready;
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
  if (route.query.print === "1" && quotationData.value) {
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

.quotation-preview {
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

.quotation-loading,
.quotation-error {
  display: flex;
  min-height: 65vh;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #475569;
  text-align: center;
}

.quotation-error h1,
.quotation-error p {
  margin: 0;
}

.quotation-error h1 {
  color: #172033;
  font-size: 20px;
  font-weight: 700;
}

@media (max-width: 760px) {
  .quotation-preview {
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

  .quotation-preview {
    width: 210mm;
    min-width: 210mm;
    min-height: 297mm;
    margin: 0;
    padding: 0;
  }

  .print-toolbar,
  .quotation-loading,
  .quotation-error {
    display: none !important;
  }
}
</style>
