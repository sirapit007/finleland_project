<template>
  <div class="product-list-document">
    <section
      v-for="(pageItems, pageIndex) in itemPages"
      :key="pageIndex"
      class="product-list-sheet"
    >
      <header class="document-header">
        <h1>{{ sellerName }}</h1>
        <div class="document-meta">
          <div class="meta-row">
            <span class="meta-label">Title</span>
            <span class="meta-separator">:</span>
            <strong>ใบสั่งซื้อสินค้า</strong>
          </div>
          <div class="meta-row page-number">
            <span class="meta-label">Page No.</span>
            <span class="meta-separator">:</span>
            <strong>{{ pageIndex + 1 }}/{{ itemPages.length }}</strong>
          </div>
          <div class="meta-row">
            <span class="meta-label">Printed By</span>
            <span class="meta-separator">:</span>
            <span>{{ printedBy || "ผู้ดูแลระบบ" }}</span>
          </div>
          <div class="meta-row page-number">
            <span class="meta-label">Printed Date</span>
            <span class="meta-separator">:</span>
            <span>{{ formattedPrintedDate }}</span>
          </div>
          <div class="meta-row description-row">
            <span class="meta-label">Description</span>
            <span class="meta-separator">:</span>
            <span>คำสั่งซื้อ {{ order.order_number || "-" }}</span>
          </div>
        </div>
      </header>

      <table class="product-table">
        <colgroup>
          <col class="code-column" />
          <col class="image-column" />
          <col class="name-column" />
          <col class="cost-column" />
          <col class="quantity-column" />
          <col class="unit-column" />
        </colgroup>
        <thead>
          <tr>
            <th>รหัสสินค้า</th>
            <th>รูป</th>
            <th>ชื่อสินค้า</th>
            <th>ราคาทุน (หลัง VAT)</th>
            <th>จำนวน</th>
            <th>หน่วยนับ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in pageItems" :key="item.uuid">
            <td class="product-code">
              {{ item.order_item_product_code || "-" }}
            </td>
            <td class="product-image-cell">
              <img
                v-if="productImage(item)"
                :src="productImage(item)"
                :alt="item.order_item_product_name || 'รูปสินค้า'"
              />
              <span v-else class="image-placeholder">ไม่มีรูป</span>
            </td>
            <td class="product-name">
              {{ item.order_item_product_name || "-" }}
            </td>
            <td class="number-cell">
              {{ formatMoney(item.order_item_unit_cost) }}
            </td>
            <td class="number-cell">
              {{ formatQuantity(item.order_item_quantity) }}
            </td>
            <td class="center-cell">{{ item.order_item_unit || "ชิ้น" }}</td>
          </tr>
          <tr v-if="!pageItems.length">
            <td colspan="6" class="empty-row">ไม่มีรายการสินค้า</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script setup lang="ts">
import { firstProductImageUrl } from "~/utils/productImages";

type ProductListRow = Record<string, any>;

const props = defineProps<{
  order: ProductListRow;
  items: ProductListRow[];
  printedBy: string;
  printedAt: string;
}>();

const runtimeConfig = useRuntimeConfig();
const itemsPerPage = 10;

const sellerName = computed(
  () =>
    String(runtimeConfig.public.taxInvoiceSellerName || "").trim() ||
    "ฟินลี่แลนด์ พลาซ่า",
);

const itemPages = computed(() => {
  if (!props.items.length) return [[]] as ProductListRow[][];

  const pages: ProductListRow[][] = [];
  for (let index = 0; index < props.items.length; index += itemsPerPage) {
    pages.push(props.items.slice(index, index + itemsPerPage));
  }
  return pages;
});

const formattedPrintedDate = computed(() => {
  const date = new Date(props.printedAt);
  if (Number.isNaN(date.getTime())) return "-";

  const parts = new Intl.DateTimeFormat("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value || "";

  return `${value("day")}/${value("month")}/${value("year")}`;
});

const productImage = (item: ProductListRow) =>
  firstProductImageUrl(item.order_item_product_image);

const formatMoney = (value: unknown) =>
  new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatQuantity = (value: unknown) =>
  new Intl.NumberFormat("th-TH", {
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
</script>

<style scoped>
.product-list-document {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.product-list-sheet {
  width: 210mm;
  min-height: 297mm;
  margin: 0 auto;
  padding: 7mm 6mm 8mm;
  overflow: hidden;
  background: #fff;
  color: #000;
  font-family: Tahoma, "Noto Sans Thai", sans-serif;
  font-size: 10px;
  line-height: 1.4;
  box-shadow: 0 18px 55px rgba(15, 23, 42, 0.14);
}

.document-header h1 {
  margin: 0 0 4mm;
  font-size: 13px;
  font-weight: 700;
  text-align: center;
}

.document-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2.5mm 8mm;
  padding: 0 2.5mm 2.5mm;
}

.meta-row {
  display: grid;
  grid-template-columns: 23mm 4mm minmax(0, 1fr);
  align-items: baseline;
}

.meta-label {
  font-weight: 700;
}

.meta-separator {
  color: #0b4aac;
  font-weight: 700;
}

.page-number {
  grid-template-columns: 27mm 4mm minmax(0, 1fr);
  justify-self: end;
}

.page-number strong,
.page-number span:last-child {
  text-align: right;
}

.description-row {
  grid-column: 1 / -1;
}

.product-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.product-table thead {
  border-top: 1.2px solid #111;
  border-bottom: 1.2px solid #111;
}

.product-table th {
  padding: 2mm 1.5mm;
  font-size: 9.5px;
  font-weight: 700;
  text-align: center;
}

.product-table td {
  height: 18.2mm;
  padding: 1.8mm 2mm;
  border-bottom: 1px solid #d4d4d4;
  vertical-align: middle;
}

.code-column {
  width: 18%;
}

.image-column {
  width: 12%;
}

.name-column {
  width: 34%;
}

.cost-column {
  width: 15%;
}

.quantity-column {
  width: 10%;
}

.unit-column {
  width: 11%;
}

.product-code,
.product-name {
  font-weight: 600;
}

.product-image-cell {
  text-align: center;
}

.product-image-cell img,
.image-placeholder {
  display: inline-flex;
  width: 15mm;
  height: 15mm;
  align-items: center;
  justify-content: center;
  object-fit: contain;
}

.image-placeholder {
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #94a3b8;
  font-size: 7.5px;
}

.number-cell {
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.center-cell {
  text-align: center;
}

.empty-row {
  height: 40mm !important;
  color: #64748b;
  text-align: center;
}

@media print {
  .product-list-document {
    display: block;
  }

  .product-list-sheet {
    width: 210mm;
    min-height: 297mm;
    margin: 0;
    box-shadow: none;
    break-after: page;
    page-break-after: always;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  .product-list-sheet:last-child {
    break-after: auto;
    page-break-after: auto;
  }

  .product-table tr {
    break-inside: avoid;
    page-break-inside: avoid;
  }
}
</style>
