<template>
  <div class="product-list-document">
    <article
      v-for="(pageItems, pageIndex) in itemPages"
      :key="pageIndex"
      class="product-list-sheet"
    >
      <header class="document-header">
        <div class="seller-heading">
          <img src="~/assets/images/logo.png" alt="ฟินลี่แลนด์ พลาซ่า" />
          <div>
            <p class="seller-name">{{ seller.name }}</p>
            <p>{{ seller.address || "ยังไม่ได้ตั้งค่าที่อยู่ร้านค้า" }}</p>
            <p v-if="seller.phone || seller.email">
              {{ [seller.phone, seller.email].filter(Boolean).join(" · ") }}
            </p>
            <p>
              เลขประจำตัวผู้เสียภาษี
              <strong>{{ seller.taxId || "ยังไม่ได้ตั้งค่า" }}</strong>
              <span v-if="seller.branch"> · {{ seller.branch }}</span>
            </p>
          </div>
        </div>

        <div class="document-heading">
          <p class="document-title">ใบรายการสินค้า</p>
          <p class="document-subtitle">PRODUCT PICKING LIST</p>
          <span class="document-badge">
            หน้า {{ pageIndex + 1 }} / {{ itemPages.length }}
          </span>
        </div>
      </header>

      <section class="document-meta">
        <dl>
          <div>
            <dt>เลขที่คำสั่งซื้อ</dt>
            <dd>{{ text(order.order_number) }}</dd>
          </div>
          <div>
            <dt>ชื่อลูกค้า</dt>
            <dd>{{ text(order.order_customer_name) }}</dd>
          </div>
        </dl>
        <dl>
          <div>
            <dt>วันที่พิมพ์</dt>
            <dd>{{ formattedPrintedDate }}</dd>
          </div>
          <div>
            <dt>จัดทำโดย</dt>
            <dd>{{ printedBy || "ผู้ดูแลระบบ" }}</dd>
          </div>
        </dl>
      </section>

      <section class="list-heading">
        <div>
          <p class="section-label">รายการสินค้าสำหรับจัดเตรียม</p>
          <p>ตรวจสอบรหัสสินค้า รูปสินค้า และจำนวนก่อนนำส่ง</p>
        </div>
        <div class="order-status">
          <span>สถานะคำสั่งซื้อ</span>
          <strong>{{ orderStatusLabel }}</strong>
        </div>
      </section>

      <table class="product-table">
        <colgroup>
          <col class="number-column" />
          <col class="image-column" />
          <col />
          <col class="price-column" />
          <col class="quantity-column" />
          <col class="unit-column" />
        </colgroup>
        <thead>
          <tr>
            <th class="center">ลำดับ</th>
            <th class="center">รูปสินค้า</th>
            <th>รายการสินค้า</th>
            <th class="right">ราคาขายปัจจุบัน</th>
            <th class="center">จำนวน</th>
            <th class="center">หน่วย</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, itemIndex) in pageItems" :key="item.uuid">
            <td class="center row-number">
              {{ pageIndex * itemsPerPage + itemIndex + 1 }}
            </td>
            <td class="product-image-cell">
              <img
                v-if="productImage(item)"
                :src="productImage(item)"
                :alt="item.order_item_product_name || 'รูปสินค้า'"
              />
              <span v-else class="image-placeholder">ไม่มีรูป</span>
            </td>
            <td class="product-detail">
              <strong>{{ text(item.order_item_product_name) }}</strong>
              <small>รหัส {{ text(item.order_item_product_code) }}</small>
            </td>
            <td class="right money-cell">
              {{ formatMoney(item.product_selling_price) }}
            </td>
            <td class="center quantity-cell">
              {{ formatQuantity(item.order_item_quantity) }}
            </td>
            <td class="center">{{ item.order_item_unit || "ชิ้น" }}</td>
          </tr>
          <tr v-if="pageItems.length === 0">
            <td colspan="6" class="empty-row">ไม่พบรายการสินค้า</td>
          </tr>
        </tbody>
      </table>

      <section class="summary-section">
        <div class="summary-note">
          <p class="section-label">หมายเหตุสำหรับผู้จัดสินค้า</p>
          <p>
            ราคาที่แสดงเป็นราคาขายปัจจุบัน ณ เวลาที่พิมพ์เอกสาร
            กรุณายึดจำนวนสินค้าตามรายการนี้และตรวจสภาพสินค้าก่อนส่งมอบ
          </p>
        </div>
        <dl class="summary-list">
          <div>
            <dt>จำนวนรายการทั้งหมด</dt>
            <dd>{{ items.length }} รายการ</dd>
          </div>
          <div>
            <dt>จำนวนสินค้ารวม</dt>
            <dd>{{ formatQuantity(totalQuantity) }} ชิ้น</dd>
          </div>
          <div class="summary-total">
            <dt>มูลค่าตามราคาปัจจุบัน</dt>
            <dd>฿{{ formatMoney(totalCurrentValue) }}</dd>
          </div>
        </dl>
      </section>

      <section class="signature-grid">
        <div>
          <span class="signature-line" />
          <p>ผู้จัดเตรียมสินค้า</p>
          <p>วันที่ ______ / ______ / ______</p>
        </div>
        <div>
          <span class="signature-line" />
          <p>ผู้ตรวจสอบสินค้า</p>
          <p>วันที่ ______ / ______ / ______</p>
        </div>
      </section>

      <footer class="document-footer">
        <span>เอกสารสำหรับใช้ภายในระบบจัดการคำสั่งซื้อ</span>
        <span>
          หน้านี้ {{ pageItems.length }} รายการ ·
          {{ formatQuantity(pageQuantity(pageItems)) }} ชิ้น
        </span>
      </footer>
    </article>
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
const publicConfig = runtimeConfig.public as Record<string, unknown>;
const itemsPerPage = 8;

const text = (value: unknown, fallback = "-") =>
  String(value ?? "").trim() || fallback;
const number = (value: unknown) => {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const seller = computed(() => ({
  name: text(publicConfig.taxInvoiceSellerName, "ฟินลี่แลนด์ พลาซ่า"),
  taxId: text(publicConfig.taxInvoiceSellerTaxId, "").replace(/\D/g, ""),
  branch: text(publicConfig.taxInvoiceSellerBranch, "สำนักงานใหญ่"),
  address: text(publicConfig.taxInvoiceSellerAddress, ""),
  phone: text(publicConfig.taxInvoiceSellerPhone, ""),
  email: text(publicConfig.taxInvoiceSellerEmail, ""),
}));

const itemPages = computed(() => {
  if (!props.items.length) return [[]] as ProductListRow[][];

  const pages: ProductListRow[][] = [];
  for (let index = 0; index < props.items.length; index += itemsPerPage) {
    pages.push(props.items.slice(index, index + itemsPerPage));
  }
  return pages;
});

const totalQuantity = computed(() =>
  props.items.reduce(
    (total, item) => total + number(item.order_item_quantity),
    0,
  ),
);
const totalCurrentValue = computed(() =>
  props.items.reduce(
    (total, item) =>
      total +
      number(item.product_selling_price) * number(item.order_item_quantity),
    0,
  ),
);

const orderStatusMap: Record<string, string> = {
  pending: "รอตรวจสอบ",
  confirmed: "ยืนยันคำสั่งซื้อแล้ว",
  processing: "กำลังเตรียมสินค้า",
  ready_for_pickup: "พร้อมรับสินค้า",
  shipped: "กำลังจัดส่ง",
  completed: "สำเร็จ",
  canceled: "ยกเลิก",
};
const orderStatusLabel = computed(
  () =>
    orderStatusMap[text(props.order.order_status, "pending")] ||
    text(props.order.order_status),
);

const formattedPrintedDate = computed(() => {
  const date = new Date(props.printedAt);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(date);
});

const productImage = (item: ProductListRow) =>
  firstProductImageUrl(item.order_item_product_image);
const pageQuantity = (pageItems: ProductListRow[]) =>
  pageItems.reduce(
    (total, item) => total + number(item.order_item_quantity),
    0,
  );
const formatMoney = (value: unknown) =>
  new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number(value));
const formatQuantity = (value: unknown) =>
  new Intl.NumberFormat("th-TH", { maximumFractionDigits: 2 }).format(
    number(value),
  );
</script>

<style scoped>
.product-list-document {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.product-list-sheet {
  position: relative;
  width: 210mm;
  min-height: 297mm;
  margin: 0 auto;
  padding: 13mm 14mm 11mm;
  overflow: hidden;
  background: #fff;
  color: #172033;
  font-family: "Noto Sans Thai", sans-serif;
  font-size: 10.5px;
  line-height: 1.55;
  box-shadow: 0 18px 55px rgba(15, 23, 42, 0.14);
}

.document-header {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  padding-bottom: 12px;
  border-bottom: 3px solid #0b4aac;
}

.seller-heading {
  display: flex;
  max-width: 56%;
  gap: 12px;
}

.seller-heading img {
  width: 68px;
  height: 68px;
  flex: 0 0 auto;
  object-fit: contain;
}

.seller-heading p,
.list-heading p,
.summary-note p,
.signature-grid p {
  margin: 0;
}

.seller-name {
  margin-bottom: 2px !important;
  color: #0b3f8f;
  font-size: 17px;
  font-weight: 700;
}

.document-heading {
  min-width: 245px;
  text-align: right;
}

.document-title {
  margin: 0;
  color: #0b3f8f;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.3;
}

.document-subtitle {
  margin: 2px 0 7px;
  color: #526173;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 1.1px;
}

.document-badge {
  display: inline-block;
  border: 1px solid #0b4aac;
  border-radius: 999px;
  padding: 2px 10px;
  color: #0b4aac;
  font-weight: 700;
}

.document-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 10px;
  padding: 8px 10px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
}

.document-meta dl,
.summary-list {
  margin: 0;
}

.document-meta dl > div {
  display: grid;
  grid-template-columns: 105px 1fr;
  gap: 8px;
}

.document-meta dt,
.summary-list dt {
  color: #586679;
}

.document-meta dd,
.summary-list dd {
  margin: 0;
  font-weight: 600;
}

.list-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-top: 10px;
  padding: 8px 10px;
  border: 1px solid #bfdbfe;
  background: #eff6ff;
}

.section-label {
  margin: 0 0 2px !important;
  color: #0b4aac;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.15px;
}

.list-heading > div:first-child > p:last-child {
  color: #526173;
  font-size: 9.5px;
}

.order-status {
  flex: 0 0 auto;
  text-align: right;
}

.order-status span {
  display: block;
  color: #64748b;
  font-size: 8.5px;
}

.order-status strong {
  color: #0b3f8f;
}

.product-table {
  width: 100%;
  margin-top: 10px;
  border-collapse: collapse;
  table-layout: fixed;
}

.product-table th,
.product-table td {
  padding: 7px 6px;
  border: 1px solid #b8c4d3;
  vertical-align: middle;
}

.product-table th {
  background: #0b4aac;
  color: #fff;
  font-weight: 600;
}

.product-table tbody tr:nth-child(even) {
  background: #f8fafc;
}

.product-table tbody td {
  height: 58px;
}

.number-column {
  width: 42px;
}

.image-column {
  width: 66px;
}

.price-column {
  width: 105px;
}

.quantity-column {
  width: 62px;
}

.unit-column {
  width: 55px;
}

.center {
  text-align: center;
}

.right {
  text-align: right;
}

.row-number {
  color: #475569;
}

.product-image-cell {
  padding: 4px !important;
  text-align: center;
}

.product-image-cell img,
.image-placeholder {
  display: inline-flex;
  width: 48px;
  height: 48px;
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

.product-detail strong {
  display: block;
  font-size: 11px;
}

.product-detail small {
  display: block;
  margin-top: 1px;
  color: #64748b;
}

.money-cell,
.quantity-cell {
  font-variant-numeric: tabular-nums;
}

.money-cell {
  font-weight: 600;
}

.quantity-cell {
  color: #0b3f8f;
  font-size: 12px;
  font-weight: 700;
}

.empty-row {
  height: 80px !important;
  color: #64748b;
  text-align: center;
}

.summary-section {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 285px;
  gap: 14px;
  margin-top: 10px;
}

.summary-note {
  padding: 9px 10px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  color: #475569;
  font-size: 9px;
}

.summary-list > div {
  display: grid;
  grid-template-columns: 1fr 105px;
  gap: 8px;
  padding: 2px 7px;
}

.summary-list dd {
  text-align: right;
}

.summary-total {
  margin-top: 3px;
  padding: 6px 7px !important;
  background: #0b4aac;
  color: #fff;
}

.summary-total dt,
.summary-total dd {
  color: #fff;
  font-weight: 700;
}

.signature-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 55px;
  margin: 36px 36px 0;
  color: #475569;
  text-align: center;
}

.signature-line {
  display: block;
  margin-bottom: 6px;
  border-top: 1px solid #64748b;
}

.document-footer {
  position: absolute;
  right: 14mm;
  bottom: 7mm;
  left: 14mm;
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding-top: 6px;
  border-top: 1px solid #cbd5e1;
  color: #64748b;
  font-size: 8.5px;
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

  .product-table thead {
    display: table-header-group;
  }

  .product-table tr,
  .summary-section,
  .signature-grid {
    break-inside: avoid;
    page-break-inside: avoid;
  }
}
</style>
