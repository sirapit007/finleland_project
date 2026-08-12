<template>
  <section class="rounded-xl border border-base-300 bg-base-100 p-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="lg:text-lg sm:text-base text-sm font-bold">สรุปคำสั่งซื้อ</h2>
      <NuxtLink
        v-if="order.uuid"
        :to="{
          path: '/orders/' + order.uuid + '/invoice',
          query: { print: '1' },
        }"
        target="_blank"
        rel="noopener"
        class="btn btn-outline btn-xs"
        aria-label="พิมพ์เอกสารคำสั่งซื้อ"
      >
        <Icon name="lucide:printer" size="14" />
        พิมพ์เอกสาร
      </NuxtLink>
    </div>

    <div class="mt-4 rounded-xl bg-base-200/80 p-4">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <p class="font-semibold sm:text-sm text-xs">
            {{ isPickup ? "วิธีรับสินค้า" : "ที่อยู่จัดส่ง" }}
          </p>
        </div>
        <span
          v-if="!isPickup && deliveryLabel"
          class="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-base-content/70"
        >
          <Icon
            :name="deliveryMeta.icon"
            size="18"
            :class="deliveryMeta.iconClass"
          />
          {{ deliveryLabel }}
        </span>
      </div>

      <template v-if="isPickup">
        <p class="mt-3 sm:text-sm text:xs font-semibold flex gap-1.5">
          <Icon
            :name="deliveryMeta.icon"
            size="18"
            :class="deliveryMeta.iconClass"
          />
          {{ deliveryLabel }}
        </p>
        <p
          v-if="order.order_delivery_description"
          class="mt-1 sm:text-xs text:xs leading-5 text-base-content/60"
        >
          {{ order.order_delivery_description }}
        </p>
      </template>

      <template v-else>
        <p
          v-if="order.order_delivery_description"
          class="mt-2 sm:text-sm text:xs text-base-content/55"
        >
          {{ order.order_delivery_description }}
        </p>
        <p class="mt-3 sm:text-sm text:xs font-semibold">{{ recipientLine }}</p>
        <p class="mt-1 sm:text-sm text:xs leading-6 text-base-content/65">
          {{ shippingAddressLine || "ไม่มีข้อมูลที่อยู่จัดส่ง" }}
        </p>
        <p
          v-if="order.order_shipping_phone"
          class="mt-1 sm:text-sm text:xs text-base-content/65"
        >
          {{ order.order_shipping_phone }}
        </p>
        <p
          v-if="order.order_shipping_note"
          class="mt-2 rounded-lg bg-warning/10 px-2.5 py-2 text-xs leading-5 text-base-content/70"
        >
          หมายเหตุ: {{ order.order_shipping_note }}
        </p>
      </template>
    </div>

    <TaxOrderDetails v-if="taxDetail" class="mt-4" :detail="taxDetail" />

    <div class="mt-5 space-y-3 text-sm">
      <div class="flex justify-between gap-4 text-base-content/70">
        <span>ราคารวมสินค้า ({{ formattedQuantity }} ชิ้น)</span>
        <span class="font-semibold text-base-content">
          ฿{{ formatMoney(subtotal) }}
        </span>
      </div>
      <div class="flex justify-between gap-4 text-success">
        <span class="flex items-center gap-1">
          <Icon name="lucide:badge-percent" size="15" /> ส่วนลดโปรโมชั่น
        </span>
        <span class="font-semibold">
          -฿{{ formatMoney(promotionDiscount) }}
        </span>
      </div>
      <div class="flex justify-between gap-4 text-base-content/70">
        <span>ค่าจัดส่ง</span>
        <span class="font-semibold text-base-content">
          ฿{{ formatMoney(shippingFee) }}
        </span>
      </div>
    </div>

    <div class="my-5 border-t border-base-300" />

    <div class="flex items-end justify-between gap-4">
      <div>
        <p class="font-bold">รวมเป็นเงิน</p>
        <p class="mt-1 text-xs text-base-content/55">รวมภาษีมูลค่าเพิ่มแล้ว</p>
      </div>
      <p class="sm:text-2xl text-xl font-bold text-primary">
        ฿{{ formatMoney(grandTotal) }}
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
type OrderSummaryRow = Record<string, any>;

const props = withDefaults(
  defineProps<{
    order: OrderSummaryRow;
    totalQuantity?: number;
    taxDetail?: OrderSummaryRow | null;
  }>(),
  {
    totalQuantity: 0,
    taxDetail: null,
  },
);

const taxDetail = computed(
  () => props.taxDetail || props.order.order_tax_detail || null,
);

const isPickup = computed(
  () => String(props.order.order_delivery_method || "") === "pickup",
);

const deliveryLabel = computed(() =>
  String(
    props.order.order_delivery_label ||
      (isPickup.value ? "รับสินค้าด้วยตัวเอง" : "จัดส่งสินค้า"),
  ),
);

const deliveryMeta = computed(() => {
  const method = String(props.order.order_delivery_method || "");
  if (method === "pickup") {
    return { icon: "lucide:store", iconClass: "text-accent" };
  }
  if (method === "express") {
    return { icon: "lucide:bike", iconClass: "text-secondary" };
  }
  return { icon: "lucide:map-pin", iconClass: "text-primary" };
});

const recipientLine = computed(() => {
  const label = String(props.order.order_shipping_label || "").trim();
  const recipient = String(props.order.order_shipping_recipient || "").trim();
  return [label ? `${label}:` : "", recipient].filter(Boolean).join(" ") || "-";
});

const shippingAddressLine = computed(() =>
  [
    props.order.order_shipping_address,
    props.order.order_shipping_subdistrict,
    props.order.order_shipping_district,
    props.order.order_shipping_province,
    props.order.order_shipping_postcode,
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(", "),
);

const promotionDiscount = computed(() =>
  Math.abs(Number(props.order.order_discount || 0)),
);
const shippingFee = computed(() => Number(props.order.order_shipping_fee || 0));
const grandTotal = computed(() => Number(props.order.order_grand_total || 0));
const subtotal = computed(() => {
  const value = props.order.order_subtotal;
  if (value !== null && value !== undefined && value !== "") {
    return Number(value || 0);
  }

  return Math.max(
    grandTotal.value - shippingFee.value + promotionDiscount.value,
    0,
  );
});

const formattedQuantity = computed(() =>
  Math.max(Math.floor(Number(props.totalQuantity || 0)), 0).toLocaleString(
    "th-TH",
  ),
);

const formatMoney = (value: number | string) =>
  new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
</script>
