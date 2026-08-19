<template>
  <section class="rounded-xl border border-base-300 bg-base-100 p-4">
    <div class="flex items-center gap-2 mb-3">
      <Icon name="lucide:history" size="18" class="text-primary" />
      <h2 class="text-sm font-bold sm:text-base">ประวัติการปรับสินค้า</h2>
    </div>

    <ol class="overflow-y-auto max-h-[400px] space-y-3 pr-1">
      <li
        v-for="adjustment in adjustments"
        :key="adjustment.uuid"
        class="border-l-2 border-warning/40 pl-3"
      >
        <p class="text-sm font-semibold">
          {{ adjustmentLabel(adjustment) }}
        </p>
        <p class="mt-1 text-xs text-base-content/60">
          {{ adjustmentSummary(adjustment) }}
        </p>
        <p class="mt-1 text-xs text-base-content/45">
          {{ formatDate(adjustment.created_at) }} ·
          {{ adjustment.created_username || "-" }}
        </p>
      </li>
      <li v-if="!adjustments.length" class="text-sm text-base-content/50">
        ยังไม่มีการปรับรายการโดยแอดมิน
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
type Row = Record<string, any>;

withDefaults(
  defineProps<{
    adjustments?: Row[];
  }>(),
  {
    adjustments: () => [],
  },
);

const adjustmentLabelMap: Record<string, string> = {
  added: "เพิ่มสินค้า",
  updated: "ปรับรายการสินค้า",
  removed: "ลบสินค้า",
};

const adjustmentLabel = (row: Row) =>
  adjustmentLabelMap[String(row.order_item_adjustment_action || "")] ||
  "ปรับรายการ";

const adjustmentSummary = (row: Row) => {
  const before = row.order_item_adjustment_before || {};
  const after = row.order_item_adjustment_after || {};
  const name =
    after.order_item_product_name || before.order_item_product_name || "สินค้า";

  if (row.order_item_adjustment_action === "updated") {
    return `${name}: ${before.order_item_quantity || 0} ชิ้น → ${after.order_item_quantity || 0} ชิ้น`;
  }

  const quantity =
    row.order_item_adjustment_action === "added"
      ? after.order_item_quantity || 0
      : before.order_item_quantity || 0;
  return `${name} ${quantity} ชิ้น`;
};

const formatDate = (value: string) =>
  value
    ? new Intl.DateTimeFormat("th-TH", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "-";
</script>
