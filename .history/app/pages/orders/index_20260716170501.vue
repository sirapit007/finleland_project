<template>
  <div class="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
    <div class="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div class="badge badge-sm badge-soft badge-primary mb-3 py-3">
          <NuxtLink to="/">หน้าหลัก</NuxtLink>
          <Icon name="lucide:chevron-right" size="15" />
          <span class="text-base-content">ติดตามคำสั่งซื้อ</span>
        </div>
        <h1 class="text-3xl font-bold tracking-tight sm:text-4xl">คำสั่งซื้อของฉัน</h1>
        <p class="mt-1 text-sm text-base-content/60">
          ตรวจสอบสถานะและรายการสินค้าที่สั่งซื้อได้ที่นี่
        </p>
      </div>
      <NuxtLink to="/products" class="btn btn-outline btn-primary btn-sm self-start sm:self-auto">
        <Icon name="lucide:shopping-bag" size="16" /> เลือกซื้อสินค้า
      </NuxtLink>
    </div>

    <div v-if="errorMessage" role="alert" class="alert alert-error mb-5 text-sm">
      <Icon name="lucide:circle-alert" size="18" />
      <span>{{ errorMessage }}</span>
    </div>

    <div v-if="isLoading" class="flex min-h-64 items-center justify-center">
      <span class="loading loading-spinner loading-lg text-primary" />
    </div>

    <section v-else-if="!orders.length" class="rounded-2xl border border-dashed border-base-300 bg-base-200/30 px-6 py-16 text-center">
      <div class="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon name="lucide:package-search" size="28" />
      </div>
      <h2 class="mt-4 text-xl font-bold">ยังไม่มีคำสั่งซื้อ</h2>
      <p class="mt-2 text-sm text-base-content/60">เมื่อสั่งซื้อสินค้าแล้ว รายการจะปรากฏในหน้านี้</p>
      <NuxtLink to="/products" class="btn btn-primary btn-sm mt-5">เลือกซื้อสินค้า</NuxtLink>
    </section>

    <div v-else class="space-y-4">
      <article
        v-for="order in orders"
        :key="order.uuid"
        class="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm"
      >
        <div class="flex flex-col gap-4 p-4 sm:p-5">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <p class="font-mono text-sm font-bold text-primary sm:text-base">{{ order.order_number }}</p>
                <span class="badge badge-sm font-semibold" :class="statusMeta(order.order_status).badge">
                  <Icon :name="statusMeta(order.order_status).icon" size="13" />
                  {{ statusMeta(order.order_status).label }}
                </span>
              </div>
              <p class="mt-2 text-sm text-base-content/60">สั่งซื้อเมื่อ {{ formatDate(order.order_placed_at || order.created_at) }}</p>
              <p class="mt-1 text-sm text-base-content/60">
                {{ order.order_delivery_label || "-" }}
                <template v-if="order.order_tracking_number"> · เลขพัสดุ {{ order.order_tracking_number }}</template>
              </p>
            </div>
            <div class="sm:text-right">
              <p class="text-xs text-base-content/55">ยอดชำระทั้งหมด</p>
              <p class="text-2xl font-bold text-primary">฿{{ formatMoney(order.order_grand_total) }}</p>
              <p class="mt-1 text-xs text-base-content/55">{{ order.order_item_count || 0 }} รายการสินค้า</p>
            </div>
          </div>

          <div class="flex flex-col-reverse gap-2 border-t border-base-300 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p class="text-sm text-base-content/65">{{ statusMeta(order.order_status).description }}</p>
            <button class="btn btn-outline btn-primary btn-sm" :disabled="isDetailLoading(order.uuid)" @click="toggleOrder(order)">
              <Icon :name="expandedOrderUuid === order.uuid ? 'lucide:chevron-up' : 'lucide:chevron-down'" size="16" />
              {{ expandedOrderUuid === order.uuid ? "ซ่อนรายละเอียด" : "ดูรายการและสถานะ" }}
            </button>
          </div>
        </div>

        <div v-if="expandedOrderUuid === order.uuid" class="border-t border-base-300 bg-base-200/35 p-4 sm:p-5">
          <div v-if="detailLoadingOrderUuid === order.uuid" class="flex justify-center py-8">
            <span class="loading loading-spinner loading-md text-primary" />
          </div>
          <div v-else class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <section>
              <h2 class="mb-3 text-base font-bold">รายการสินค้า</h2>
              <div class="space-y-3">
                <div v-for="item in itemsByOrder[order.uuid] || []" :key="item.uuid" class="flex gap-3 rounded-xl border border-base-300 bg-base-100 p-3">
                  <img v-if="itemImage(item)" :src="itemImage(item)" :alt="item.order_item_product_name" class="size-16 shrink-0 rounded-lg border border-base-300 object-contain" />
                  <img v-else src="@/assets/images/blank.png" alt="ไม่มีรูปสินค้า" class="size-16 shrink-0 rounded-lg border border-base-300 object-contain p-2 opacity-70" />
                  <div class="min-w-0 flex-1">
                    <p class="font-semibold">{{ item.order_item_product_name }}</p>
                    <p class="mt-1 text-xs text-base-content/55">{{ item.order_item_product_code }} · {{ item.order_item_quantity }} ชิ้น</p>
                    <p v-if="Number(item.order_item_discount) > 0" class="mt-1 text-xs text-success">ส่วนลด {{ item.order_item_promotion_name || "โปรโมชั่น" }} -฿{{ formatMoney(item.order_item_discount) }}</p>
                  </div>
                  <div class="shrink-0 text-right">
                    <p v-if="Number(item.order_item_discount) > 0" class="text-xs text-base-content/45 line-through">฿{{ formatMoney(item.order_item_subtotal) }}</p>
                    <p class="font-bold text-primary">฿{{ formatMoney(item.order_item_total) }}</p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 class="mb-3 text-base font-bold">สถานะคำสั่งซื้อ</h2>
              <ol class="space-y-0">
                <li v-for="(history, index) in historiesByOrder[order.uuid] || []" :key="history.uuid" class="relative flex gap-3 pb-5 last:pb-0">
                  <span v-if="index < (historiesByOrder[order.uuid] || []).length - 1" class="absolute left-2.75 top-6 h-[calc(100%-0.5rem)] w-px bg-base-300" />
                  <span class="relative z-10 mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-content">
                    <Icon :name="statusMeta(history.order_status_history_status).icon" size="13" />
                  </span>
                  <div class="min-w-0 pb-1">
                    <p class="text-sm font-semibold">{{ statusMeta(history.order_status_history_status).label }}</p>
                    <p v-if="history.order_status_history_note" class="mt-0.5 text-xs leading-5 text-base-content/60">{{ history.order_status_history_note }}</p>
                    <p class="mt-1 text-xs text-base-content/45">{{ formatDate(history.created_at) }}</p>
                  </div>
                </li>
              </ol>
            </section>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
type OrderRow = Record<string, any>;

const orders = ref<OrderRow[]>([]);
const itemsByOrder = ref<Record<string, OrderRow[]>>({});
const historiesByOrder = ref<Record<string, OrderRow[]>>({});
const isLoading = ref(true);
const detailLoadingOrderUuid = ref("");
const expandedOrderUuid = ref("");
const errorMessage = ref("");

const statusOptions: Record<string, { badge: string; description: string; icon: string; label: string }> = {
  pending: { badge: "badge-warning", description: "ร้านค้าได้รับคำสั่งซื้อและกำลังตรวจสอบ", icon: "lucide:clock-3", label: "รอตรวจสอบ" },
  confirmed: { badge: "badge-info", description: "ยืนยันคำสั่งซื้อเรียบร้อยแล้ว", icon: "lucide:badge-check", label: "ยืนยันคำสั่งซื้อ" },
  processing: { badge: "badge-primary", description: "ร้านค้ากำลังเตรียมสินค้า", icon: "lucide:package-open", label: "กำลังเตรียมสินค้า" },
  ready_for_pickup: { badge: "badge-accent", description: "สินค้าพร้อมให้รับที่จุดรับสินค้า", icon: "lucide:store", label: "พร้อมรับสินค้า" },
  shipped: { badge: "badge-secondary", description: "สินค้าอยู่ระหว่างการจัดส่ง", icon: "lucide:truck", label: "กำลังจัดส่ง" },
  completed: { badge: "badge-success", description: "คำสั่งซื้อเสร็จสมบูรณ์", icon: "lucide:circle-check-big", label: "สำเร็จ" },
  canceled: { badge: "badge-error", description: "คำสั่งซื้อนี้ถูกยกเลิก", icon: "lucide:circle-x", label: "ยกเลิก" },
};

const statusMeta = (status: string) => statusOptions[status] || {
  badge: "badge-ghost",
  description: "กำลังอัปเดตสถานะคำสั่งซื้อ",
  icon: "lucide:circle-help",
  label: status || "ไม่ระบุสถานะ",
};

const formatMoney = (value: number | string) => new Intl.NumberFormat("th-TH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format(Number(value || 0));

const formatDate = (value: string) => value ? new Intl.DateTimeFormat("th-TH", {
  dateStyle: "medium",
  timeStyle: "short",
}).format(new Date(value)) : "-";

const itemImage = (item: OrderRow) => {
  const image = item.order_item_product_image;
  if (Array.isArray(image)) return image[0] || "";
  if (typeof image !== "string" || !image) return "";
  try {
    const parsed = JSON.parse(image);
    return Array.isArray(parsed) ? parsed[0] || "" : image;
  } catch {
    return image;
  }
};

const isDetailLoading = (orderUuid: string) => detailLoadingOrderUuid.value === orderUuid;

const loadOrders = async () => {
  isLoading.value = true;
  errorMessage.value = "";
  try {
    const response: any = await $fetch("/api/order", { params: { pageSize: 100 } });
    orders.value = response.rows || [];
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || "ไม่สามารถโหลดคำสั่งซื้อได้ กรุณาเข้าสู่ระบบแล้วลองใหม่อีกครั้ง";
  } finally {
    isLoading.value = false;
  }
};

const toggleOrder = async (order: OrderRow) => {
  if (expandedOrderUuid.value === order.uuid) {
    expandedOrderUuid.value = "";
    return;
  }

  expandedOrderUuid.value = order.uuid;
  if (itemsByOrder.value[order.uuid] && historiesByOrder.value[order.uuid]) return;

  detailLoadingOrderUuid.value = order.uuid;
  try {
    const [itemsResponse, historiesResponse]: any = await Promise.all([
      $fetch("/api/order/items", { params: { order_item_order: order.uuid, pageSize: 100 } }),
      $fetch("/api/order/status-histories", { params: { order_status_history_order: order.uuid, pageSize: 100 } }),
    ]);
    itemsByOrder.value = { ...itemsByOrder.value, [order.uuid]: itemsResponse.rows || [] };
    historiesByOrder.value = { ...historiesByOrder.value, [order.uuid]: historiesResponse.rows || [] };
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || "ไม่สามารถโหลดรายละเอียดคำสั่งซื้อได้";
    expandedOrderUuid.value = "";
  } finally {
    detailLoadingOrderUuid.value = "";
  }
};

onMounted(loadOrders);
</script>
