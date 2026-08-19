<template>
  <section class="rounded-xl border border-base-300 bg-base-100 p-4 h-full">
    <div class="mb-3 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Icon name="lucide:package-check" size="18" class="text-primary" />
        <h2 class="text-sm font-bold sm:text-base">
          สถานะคำสั่งซื้อ
        </h2>
      </div>
      <button
        v-if="editable && !isTerminal"
        class="btn btn-outline btn-primary btn-xs"
        type="button"
        @click="statusModal?.open()"
      >
        เปลี่ยนสถานะ
      </button>
    </div>

    <ol class="space-y-0">
      <li
        v-for="(history, index) in resolvedHistories"
        :key="history.uuid || `${history.order_status_history_status}-${index}`"
        class="relative flex gap-3 pb-5 last:pb-0"
      >
        <span
          v-if="index < resolvedHistories.length - 1"
          class="absolute left-2.75 top-6 h-[calc(100%-0.5rem)] w-px bg-base-300"
        />
        <span
          class="relative z-10 mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-content"
        >
          <Icon
            :name="statusMeta(history.order_status_history_status).icon"
            size="13"
          />
        </span>
        <div class="min-w-0 pb-1">
          <p class="text-sm font-semibold">
            {{ statusMeta(history.order_status_history_status).label }}
          </p>
          <p
            v-if="history.order_status_history_note"
            class="mt-0.5 text-xs leading-5 text-base-content/60"
          >
            {{ history.order_status_history_note }}
          </p>
          <p class="mt-1 text-xs text-base-content/45">
            {{ formatDate(history.created_at) }}
            <template v-if="showActor">
              · {{ history.created_username || "ระบบ" }}
            </template>
          </p>
        </div>
      </li>
    </ol>
  </section>

  <OrderStatusModal
    v-if="editable"
    ref="statusModal"
    :order="order"
    :detail="detail"
  />
</template>

<script setup lang="ts">
type Row = Record<string, any>;

type OrderDetail = {
  items: Row[];
  histories: Row[];
  adjustments: Row[];
  payments: Row[];
};

const props = withDefaults(
  defineProps<{
    order: Row;
    detail?: OrderDetail;
    histories?: Row[];
    editable?: boolean;
    showActor?: boolean;
  }>(),
  {
    editable: false,
    showActor: false,
  },
);

const statusModal = ref<{ open: () => void } | null>(null);
const resolvedHistories = computed(
  () => props.histories ?? props.detail?.histories ?? [],
);
const isTerminal = computed(() =>
  ["completed", "canceled"].includes(props.order.order_status),
);

const statusOptions: Record<string, { icon: string; label: string }> = {
  pending: { icon: "lucide:clock-3", label: "รอตรวจสอบ" },
  confirmed: { icon: "lucide:badge-check", label: "ยืนยันคำสั่งซื้อ" },
  processing: { icon: "lucide:package-open", label: "กำลังเตรียมสินค้า" },
  ready_for_pickup: { icon: "lucide:store", label: "พร้อมรับสินค้า" },
  shipped: { icon: "lucide:truck", label: "กำลังจัดส่ง" },
  completed: { icon: "lucide:circle-check-big", label: "สำเร็จ" },
  canceled: { icon: "lucide:circle-x", label: "ยกเลิก" },
};

const statusMeta = (status: string) =>
  statusOptions[status] || {
    icon: "lucide:circle-help",
    label: status || "ไม่ระบุสถานะ",
  };

const formatDate = (value: string) =>
  value
    ? new Intl.DateTimeFormat("th-TH", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "-";
</script>
