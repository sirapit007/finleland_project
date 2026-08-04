<template>
  <article class="invoice-sheet">
    <div v-if="isDemo" class="demo-watermark" aria-hidden="true">
      เอกสารตัวอย่าง
    </div>

    <header class="invoice-header">
      <div class="seller-heading">
        <img src="~/assets/images/logo.png" alt="ฟินส์แลนด์ พลาซ่า" />
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
        <p class="document-title">ใบเสร็จรับเงิน / ใบกำกับภาษี</p>
        <p class="document-subtitle">RECEIPT / TAX INVOICE</p>
        <span class="document-badge" :class="{ valid: !isDemo }">
          {{ isDemo ? "เอกสารตัวอย่าง" : "ต้นฉบับ" }}
        </span>
      </div>
    </header>

    <section class="document-meta">
      <dl>
        <div>
          <dt>เลขที่เอกสาร</dt>
          <dd>{{ documentNumber }}</dd>
        </div>
        <div>
          <dt>เลขที่คำสั่งซื้อ</dt>
          <dd>{{ text(order.order_number) }}</dd>
        </div>
      </dl>
      <dl>
        <div>
          <dt>วันที่ออกเอกสาร</dt>
          <dd>{{ formatDate(documentDate) }}</dd>
        </div>
        <div>
          <dt>สถานะชำระเงิน</dt>
          <dd>{{ paymentStatusLabel }}</dd>
        </div>
      </dl>
    </section>

    <section class="party-grid">
      <div class="party-box">
        <p class="section-label">ข้อมูลผู้ซื้อ / ผู้เสียภาษี</p>
        <p class="party-name">{{ buyer.name }}</p>
        <p v-if="buyer.taxId">
          เลขประจำตัวผู้เสียภาษี {{ buyer.taxId }}
          <span v-if="buyer.branch"> · {{ buyer.branch }}</span>
        </p>
        <p>{{ buyer.address || "ไม่ได้ระบุที่อยู่ผู้เสียภาษี" }}</p>
        <p v-if="buyer.phone || buyer.email">
          {{ [buyer.phone, buyer.email].filter(Boolean).join(" · ") }}
        </p>
      </div>

      <div class="party-box">
        <p class="section-label">
          {{ isPickup ? "ข้อมูลการรับสินค้า" : "ข้อมูลจัดส่ง" }}
        </p>
        <p class="party-name">{{ deliveryLabel }}</p>
        <template v-if="!isPickup">
          <p>{{ shippingRecipient }}</p>
          <p>{{ shippingAddress || "ไม่ได้ระบุที่อยู่จัดส่ง" }}</p>
          <p v-if="order.order_shipping_phone">
            {{ order.order_shipping_phone }}
          </p>
        </template>
        <p v-else>{{ text(order.order_delivery_description) }}</p>
      </div>
    </section>

    <table class="item-table">
      <thead>
        <tr>
          <th class="center number-column">ลำดับ</th>
          <th>รายการสินค้า</th>
          <th class="center quantity-column">จำนวน</th>
          <th class="right money-column">ราคา/หน่วย</th>
          <th class="right money-column">ส่วนลด</th>
          <th class="right total-column">จำนวนเงิน</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in items" :key="item.uuid || index">
          <td class="center">{{ index + 1 }}</td>
          <td>
            <strong>{{ text(item.order_item_product_name) }}</strong>
            <small v-if="item.order_item_product_code">
              รหัส {{ item.order_item_product_code }}
            </small>
          </td>
          <td class="center">{{ formatQuantity(item.order_item_quantity) }}</td>
          <td class="right">{{ formatMoney(item.order_item_unit_price) }}</td>
          <td class="right">{{ formatMoney(item.order_item_discount) }}</td>
          <td class="right strong">{{ formatMoney(item.order_item_total) }}</td>
        </tr>
        <tr v-if="items.length === 0">
          <td colspan="6" class="empty-row">ไม่พบรายการสินค้า</td>
        </tr>
      </tbody>
    </table>

    <section class="totals-section">
      <div class="amount-words">
        <p class="section-label">จำนวนเงินรวมทั้งสิ้น (ตัวอักษร)</p>
        <p>{{ amountInWords }}</p>
        <div class="order-note">
          <p><strong>สถานะคำสั่งซื้อ:</strong> {{ orderStatusLabel }}</p>
          <p><strong>วิธีรับสินค้า:</strong> {{ deliveryLabel }}</p>
          <p v-if="order.order_customer_note">
            <strong>หมายเหตุลูกค้า:</strong> {{ order.order_customer_note }}
          </p>
          <p v-if="order.order_shipping_note">
            <strong>หมายเหตุจัดส่ง:</strong> {{ order.order_shipping_note }}
          </p>
        </div>
      </div>

      <dl class="totals-list">
        <div>
          <dt>รวมราคาสินค้า</dt>
          <dd>{{ formatMoney(subtotal) }}</dd>
        </div>
        <div>
          <dt>ส่วนลด</dt>
          <dd>-{{ formatMoney(discount) }}</dd>
        </div>
        <div>
          <dt>ยอดหลังหักส่วนลด</dt>
          <dd>{{ formatMoney(merchandiseTotal) }}</dd>
        </div>
        <div>
          <dt>ค่าจัดส่ง</dt>
          <dd>{{ formatMoney(shippingFee) }}</dd>
        </div>
        <div>
          <dt>มูลค่าก่อนภาษี</dt>
          <dd>{{ formatMoney(preVatTotal) }}</dd>
        </div>
        <div>
          <dt>ภาษีมูลค่าเพิ่ม 7%</dt>
          <dd>{{ formatMoney(vatAmount) }}</dd>
        </div>
        <div class="grand-total-row">
          <dt>ยอดสุทธิ</dt>
          <dd>฿{{ formatMoney(grandTotal) }}</dd>
        </div>
      </dl>
    </section>

    <section class="signature-grid">
      <div>
        <span class="signature-line" />
        <p>ผู้รับเงิน / ผู้มีอำนาจลงนาม</p>
        <p>วันที่ ______ / ______ / ______</p>
      </div>
      <div>
        <span class="signature-line" />
        <p>ผู้รับสินค้า / ผู้รับเอกสาร</p>
        <p>วันที่ ______ / ______ / ______</p>
      </div>
    </section>

    <footer class="invoice-footer">
      <p v-if="isDemo" class="demo-notice">
        เอกสารนี้เป็นตัวอย่างจากข้อมูลคำสั่งซื้อ ไม่ใช่ใบกำกับภาษีที่สมบูรณ์
        จนกว่าจะตั้งค่าข้อมูลผู้ขาย ยืนยันการชำระเงิน
        และออกเลขที่เอกสารเรียบร้อย
      </p>
      <p v-else>
        เอกสารฉบับนี้จัดทำจากระบบอิเล็กทรอนิกส์ กรุณาเก็บไว้เป็นหลักฐาน
      </p>
    </footer>
  </article>
</template>

<script setup lang="ts">
type InvoiceRow = Record<string, any>;

const props = withDefaults(
  defineProps<{
    order: InvoiceRow;
    items?: InvoiceRow[];
  }>(),
  {
    items: () => [],
  },
);

const runtimeConfig = useRuntimeConfig();
const publicConfig = runtimeConfig.public as Record<string, unknown>;

const text = (value: unknown, fallback = "-") =>
  String(value ?? "").trim() || fallback;
const money = (value: unknown) => {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
};
const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const order = computed(() => props.order || {});
const items = computed(() => props.items || []);
const taxDetail = computed<InvoiceRow | null>(() =>
  order.value.order_tax_detail &&
  typeof order.value.order_tax_detail === "object"
    ? order.value.order_tax_detail
    : null,
);

const seller = computed(() => ({
  name: text(publicConfig.taxInvoiceSellerName, "ฟินส์แลนด์ พลาซ่า"),
  taxId: text(publicConfig.taxInvoiceSellerTaxId, "").replace(/\D/g, ""),
  branch: text(publicConfig.taxInvoiceSellerBranch, "สำนักงานใหญ่"),
  address: text(publicConfig.taxInvoiceSellerAddress, ""),
  phone: text(publicConfig.taxInvoiceSellerPhone, ""),
  email: text(publicConfig.taxInvoiceSellerEmail, ""),
}));

const joinAddress = (...parts: unknown[]) =>
  parts
    .map((part) => String(part ?? "").trim())
    .filter(Boolean)
    .join(", ");

const buyerBranch = computed(() => {
  const detail = taxDetail.value;
  if (!detail || detail.order_taxpayer_type !== "company") return "";
  if (detail.order_taxpayer_branch_type === "head_office")
    return "สำนักงานใหญ่";
  if (detail.order_taxpayer_branch_type === "branch") {
    return `สาขา ${text(detail.order_taxpayer_branch_code)}`;
  }
  return "";
});

const buyer = computed(() => {
  const detail = taxDetail.value;
  return {
    name: text(detail?.order_taxpayer_name || order.value.order_customer_name),
    taxId: text(detail?.order_taxpayer_id, ""),
    branch: buyerBranch.value,
    address: detail
      ? joinAddress(
          detail.order_taxpayer_address,
          detail.order_taxpayer_subdistrict,
          detail.order_taxpayer_district,
          detail.order_taxpayer_province,
          detail.order_taxpayer_postcode,
        )
      : joinAddress(
          order.value.order_shipping_address,
          order.value.order_shipping_subdistrict,
          order.value.order_shipping_district,
          order.value.order_shipping_province,
          order.value.order_shipping_postcode,
        ),
    phone: text(
      detail?.order_taxpayer_phone || order.value.order_customer_phone,
      "",
    ),
    email: text(
      detail?.order_taxpayer_email || order.value.order_customer_email,
      "",
    ),
  };
});

const isPickup = computed(() => order.value.order_delivery_method === "pickup");
const deliveryLabel = computed(() =>
  text(
    order.value.order_delivery_label,
    isPickup.value ? "รับสินค้าด้วยตัวเอง" : "จัดส่งสินค้า",
  ),
);
const shippingRecipient = computed(
  () =>
    [order.value.order_shipping_label, order.value.order_shipping_recipient]
      .map((value) => String(value ?? "").trim())
      .filter(Boolean)
      .join(" · ") || "-",
);
const shippingAddress = computed(() =>
  joinAddress(
    order.value.order_shipping_address,
    order.value.order_shipping_subdistrict,
    order.value.order_shipping_district,
    order.value.order_shipping_province,
    order.value.order_shipping_postcode,
  ),
);

const subtotal = computed(() => money(order.value.order_subtotal));
const discount = computed(() => Math.abs(money(order.value.order_discount)));
const merchandiseTotal = computed(() =>
  Math.max(roundMoney(subtotal.value - discount.value), 0),
);
const shippingFee = computed(() => money(order.value.order_shipping_fee));
const grandTotal = computed(() => money(order.value.order_grand_total));
const vatAmount = computed(() => {
  const storedTax = money(order.value.order_tax_amount);
  return storedTax > 0 ? storedTax : roundMoney((grandTotal.value * 7) / 107);
});
const preVatTotal = computed(() =>
  Math.max(roundMoney(grandTotal.value - vatAmount.value), 0),
);

const paymentStatusMap: Record<string, string> = {
  unpaid: "ยังไม่ชำระเงิน",
  pending: "รอตรวจสอบการชำระเงิน",
  paid: "ชำระเงินแล้ว",
  failed: "ชำระเงินไม่สำเร็จ",
  refunded: "คืนเงินแล้ว",
};
const orderStatusMap: Record<string, string> = {
  pending: "รอตรวจสอบ",
  confirmed: "ยืนยันคำสั่งซื้อแล้ว",
  processing: "กำลังเตรียมสินค้า",
  ready_for_pickup: "พร้อมรับสินค้า",
  shipped: "กำลังจัดส่ง",
  completed: "สำเร็จ",
  canceled: "ยกเลิก",
};
const paymentStatusLabel = computed(
  () =>
    paymentStatusMap[text(order.value.order_payment_status, "unpaid")] ||
    text(order.value.order_payment_status),
);
const orderStatusLabel = computed(
  () =>
    orderStatusMap[text(order.value.order_status, "pending")] ||
    text(order.value.order_status),
);

const isIssued = computed(
  () =>
    taxDetail.value?.order_tax_status === "issued" &&
    Boolean(text(taxDetail.value?.order_tax_invoice_number, "")),
);
const hasValidSellerTaxId = computed(() => /^\d{13}$/.test(seller.value.taxId));
const isPaid = computed(() => order.value.order_payment_status === "paid");
const isDemo = computed(
  () => !hasValidSellerTaxId.value || !isPaid.value || !isIssued.value,
);
const documentNumber = computed(() =>
  text(
    taxDetail.value?.order_tax_invoice_number,
    `DEMO-${text(order.value.order_number, text(order.value.uuid))}`,
  ),
);
const documentDate = computed(
  () =>
    taxDetail.value?.order_tax_issued_at ||
    order.value.order_completed_at ||
    order.value.order_placed_at ||
    order.value.created_at,
);

const formatMoney = (value: unknown) =>
  new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(money(value));
const formatQuantity = (value: unknown) =>
  new Intl.NumberFormat("th-TH", { maximumFractionDigits: 2 }).format(
    money(value),
  );
const formatDate = (value: unknown) => {
  if (!value) return "-";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(date);
};

const thaiDigits = [
  "ศูนย์",
  "หนึ่ง",
  "สอง",
  "สาม",
  "สี่",
  "ห้า",
  "หก",
  "เจ็ด",
  "แปด",
  "เก้า",
];
const thaiPositions = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน"];

const readThaiUnderMillion = (value: number) => {
  const normalized = Math.floor(Math.abs(value));
  if (normalized === 0) return "";
  const digits = String(normalized).split("").map(Number);
  return digits
    .map((digit, index) => {
      if (digit === 0) return "";
      const position = digits.length - index - 1;
      if (position === 1) {
        if (digit === 1) return "สิบ";
        if (digit === 2) return "ยี่สิบ";
      }
      if (position === 0 && digit === 1 && normalized > 10) return "เอ็ด";
      return `${thaiDigits[digit]}${thaiPositions[position]}`;
    })
    .join("");
};

const readThaiInteger = (value: number): string => {
  const normalized = Math.floor(Math.abs(value));
  if (normalized === 0) return thaiDigits[0] ?? "";
  if (normalized < 1_000_000) return readThaiUnderMillion(normalized);
  const millions = Math.floor(normalized / 1_000_000);
  const remainder = normalized % 1_000_000;
  return `${readThaiInteger(millions)}ล้าน${readThaiUnderMillion(remainder)}`;
};

const toThaiBahtText = (value: number) => {
  const totalSatang = Math.round(Math.max(value, 0) * 100);
  const baht = Math.floor(totalSatang / 100);
  const satang = totalSatang % 100;
  const bahtText = `${readThaiInteger(baht)}บาท`;
  return satang === 0
    ? `${bahtText}ถ้วน`
    : `${bahtText}${readThaiInteger(satang)}สตางค์`;
};

const amountInWords = computed(() => toThaiBahtText(grandTotal.value));
</script>

<style scoped>
.invoice-sheet {
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

.demo-watermark {
  position: absolute;
  top: 47%;
  left: 50%;
  z-index: 0;
  color: rgba(185, 28, 28, 0.055);
  font-size: 58px;
  font-weight: 700;
  letter-spacing: 4px;
  white-space: nowrap;
  transform: translate(-50%, -50%) rotate(-28deg);
  pointer-events: none;
}

.invoice-sheet > :not(.demo-watermark) {
  position: relative;
  z-index: 1;
}

.invoice-header {
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
.party-box p,
.invoice-footer p,
.order-note p {
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
  border: 1px solid #dc2626;
  border-radius: 999px;
  padding: 2px 10px;
  color: #b91c1c;
  font-weight: 700;
}

.document-badge.valid {
  border-color: #15803d;
  color: #166534;
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
.totals-list {
  margin: 0;
}

.document-meta dl > div {
  display: grid;
  grid-template-columns: 105px 1fr;
  gap: 8px;
}

.document-meta dt {
  color: #586679;
}

.document-meta dd {
  margin: 0;
  font-weight: 600;
}

.party-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 10px;
}

.party-box {
  min-height: 105px;
  padding: 9px 10px;
  border: 1px solid #cbd5e1;
}

.section-label {
  margin: 0 0 5px !important;
  color: #0b4aac;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.15px;
}

.party-name {
  margin-bottom: 2px !important;
  font-size: 12px;
  font-weight: 700;
}

.item-table {
  width: 100%;
  margin-top: 12px;
  border-collapse: collapse;
  table-layout: fixed;
}

.item-table th,
.item-table td {
  padding: 7px 6px;
  border: 1px solid #b8c4d3;
  vertical-align: top;
}

.item-table th {
  background: #0b4aac;
  color: #fff;
  font-weight: 600;
}

.item-table tbody tr:nth-child(even) {
  background: #f8fafc;
}

.item-table small {
  display: block;
  margin-top: 1px;
  color: #64748b;
}

.number-column {
  width: 42px;
}

.quantity-column {
  width: 58px;
}

.money-column {
  width: 82px;
}

.total-column {
  width: 94px;
}

.center {
  text-align: center;
}

.right {
  text-align: right;
}

.strong {
  font-weight: 700;
}

.empty-row {
  height: 70px;
  color: #64748b;
  text-align: center;
  vertical-align: middle !important;
}

.totals-section {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 265px;
  gap: 18px;
  margin-top: 10px;
}

.amount-words {
  padding: 9px 10px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  font-weight: 600;
}

.amount-words > p {
  margin: 0;
}

.order-note {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px dashed #b8c4d3;
  color: #475569;
  font-size: 9.5px;
  font-weight: 400;
}

.totals-list > div {
  display: grid;
  grid-template-columns: 1fr 95px;
  gap: 10px;
  padding: 3px 7px;
}

.totals-list dt {
  color: #475569;
}

.totals-list dd {
  margin: 0;
  font-weight: 600;
  text-align: right;
}

.grand-total-row {
  margin-top: 4px;
  padding: 7px !important;
  background: #0b4aac;
  color: #fff;
  font-size: 13px;
}

.grand-total-row dt {
  color: #fff;
  font-weight: 700;
}

.signature-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 55px;
  margin: 42px 36px 0;
  color: #475569;
  text-align: center;
}

.signature-grid p {
  margin: 2px 0;
}

.signature-line {
  display: block;
  margin-bottom: 6px;
  border-top: 1px solid #64748b;
}

.invoice-footer {
  position: absolute !important;
  right: 14mm;
  bottom: 8mm;
  left: 14mm;
  padding-top: 6px;
  border-top: 1px solid #cbd5e1;
  color: #64748b;
  font-size: 8.5px;
  text-align: center;
}

.demo-notice {
  color: #9f1239;
  font-weight: 600;
}

@media print {
  .invoice-sheet {
    width: 210mm;
    min-height: 297mm;
    margin: 0;
    box-shadow: none;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  .item-table thead {
    display: table-header-group;
  }

  .item-table tr,
  .party-box,
  .totals-section,
  .signature-grid {
    break-inside: avoid;
    page-break-inside: avoid;
  }
}
</style>
