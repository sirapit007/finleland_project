<template>
  <div class="min-h-full p-4 pb-6">
    <div class="rounded-2xl border border-base-300 bg-base-100 shadow-sm">
      <div class="flex justify-between gap-3 md:flex-row md:items-center m-3">
        <div class="space-x-3 flex flex-col items-start">
          <span class="font-bold sm:text-lg text-base text-primary"
            >Order Management</span
          ><span class="font-semibold sm:text-base text-sm text-secondary"
            >จัดการคำสั่งซื้อและการจัดส่ง</span
          >
        </div>
      </div>

      <div class="flex flex-wrap items-center lg:p-3 sm:p-2 p-1">
        <TableResultSummary :page="page" :page-size="pageSize" :data="data" />
        <TableSearch
          v-model="q"
          placeholder="ค้นหาเลขที่คำสั่งซื้อ ชื่อ หรือเบอร์โทร"
        />
        <TablePagination v-model:page="page" :disabled="pending" :data="data" />
      </div>
      <div class="relative my-1" :class="pending ? 'overflow-hidden' : 'overflow-auto'">
        <p v-if="error" class="p-4 text-error">{{ error.message }}</p>
        <table
          class="table min-w-max table-zebra bg-base-100 text-xs sm:table-sm table-xs table-pin-rows table-pin-cols"
        >
          <thead class="text-xs">
            <tr>
              <th>คำสั่งซื้อ</th>
              <th>ลูกค้า</th>
              <th class="sm:table-cell hidden">การจัดส่ง</th>
              <th class="text-center md:table-cell hidden">รายการสินค้า</th>
              <th class="md:table-cell hidden">ยอดรวม</th>
              <th class="md:table-cell hidden">การชำระเงิน</th>
              <th>สถานะ</th>
              <th class="md:table-cell hidden">ปิดงานเมื่อ</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <SkeletonTableRows v-if="pending" :columns="9" />
            <template
              v-else
              v-for="order in data?.rows || []"
              :key="order.uuid"
            >
              <tr class="hover:bg-primary/5">
                <td>
                  <p class="font-mono font-bold text-primary">
                    {{ order.order_number }}
                  </p>
                  <p class="mt-1 text-[11px] text-base-content/50">
                    Placed at:
                    {{ formatDate(order.order_placed_at || order.created_at) }}
                  </p>
                </td>
                <td>
                  <p class="">
                    {{
                      order.order_customer_name ||
                      order.order_customer_current_name ||
                      "-"
                    }}
                  </p>
                  <p class="mt-1 text-xs text-base-content/50">
                    {{ order.order_customer_phone || "-" }}
                  </p>
                </td>
                <td class="sm:table-cell hidden">
                  <p class="flex items-center gap-2">
                    <Icon
                      v-if="order.order_delivery_method === 'pickup'"
                      name="lucide:store"
                      size="14"
                      class="text-accent"
                    />
                    <Icon
                      v-if="order.order_delivery_method === 'normal'"
                      name="lucide:truck"
                      size="14"
                      class="text-primary"
                    />
                    <Icon
                      v-if="order.order_delivery_method === 'express'"
                      name="lucide:bike"
                      size="14"
                      class="text-secondary"
                    />
                    {{ order.order_delivery_label || "-" }}
                  </p>
                  <p
                    v-if="order.order_tracking_number"
                    class="mt-1 text-xs text-base-content/50"
                  >
                    {{ order.order_tracking_number }}
                  </p>
                </td>
                <td class="text-center md:table-cell hidden">
                  {{ order.order_item_count || 0 }}
                </td>
                <td class="font-bold text-primary md:table-cell hidden">
                  ฿{{ formatMoney(order.order_grand_total) }}
                </td>
                <td class="md:table-cell hidden">
                  <span
                    class="badge badge-xs font-semibold"
                    :class="paymentMeta(order.order_payment_status).badge"
                  >
                    {{ paymentMeta(order.order_payment_status).label }}
                  </span>
                  <p
                    v-if="order.order_payment_method"
                    class="mt-1 text-xs text-base-content/50"
                  >
                    {{ order.order_payment_method }}
                  </p>
                </td>
                <td>
                  <span
                    class="badge badge-xs font-semibold"
                    :class="statusMeta(order.order_status).badge"
                    >{{ statusMeta(order.order_status).label }}</span
                  >
                </td>
                <td class="md:table-cell hidden">
                  {{ formatDate(order.order_completed_at) }}
                </td>
                <th class="text-right">
                  <button
                    class="btn btn-xs btn-link"
                    @click="toggleOrder(order)"
                  >
                    {{ expandedOrderUuid === order.uuid ? "ซ่อน" : "จัดการ" }}
                  </button>
                </th>
              </tr>
              <tr v-if="expandedOrderUuid === order.uuid">
                <td colspan="9" class="bg-base-200/40 p-0">
                  <SkeletonOrderDetail
                    v-if="detailLoadingOrderUuid === order.uuid"
                  />
                  <div v-else class="space-y-5 p-4">
                    <OrderItemsSection
                      :order="order"
                      :detail="detailByOrder[order.uuid]"
                    />

                    <div
                      class="grid gap-5 lg:grid-cols-4 sm:grid-cols-2 grid-cols-1 space-y-5"
                    >
                      <OrderSummarySection
                        :order="order"
                        :total-quantity="orderTotalQuantity(order)"
                      />
                      <OrderPaymentDetailsSection
                        admin
                        :payment="
                          detailByOrder[order.uuid]?.payments?.[0] || null
                        "
                        @refreshed="reloadOrder(order.uuid)"
                      />
                      <OrderStatusSection
                        :order="order"
                        :detail="detailByOrder[order.uuid]"
                        editable
                        show-actor
                      />
                      <OrderAdjustmentHistorySection
                        :adjustments="
                          detailByOrder[order.uuid]?.adjustments || []
                        "
                      />
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
      <div class="flex flex-wrap items-center lg:p-3 sm:p-2 p-1">
        <TablePageSize
          v-model:page-size="pageSize"
          :disabled="pending"
          @update:page-size="page = 1"
        />
        <TablePagination v-model:page="page" :disabled="pending" :data="data" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "admin" });

type Row = Record<string, any>;
const page = ref(1);
const pageSize = ref(10);
const q = ref("");
const expandedOrderUuid = ref("");
const detailLoadingOrderUuid = ref("");
const detailByOrder = ref<
  Record<
    string,
    {
      items: Row[];
      histories: Row[];
      adjustments: Row[];
      payments: Row[];
    }
  >
>({});
const { showToast } = useToast();

const statusMap: Record<string, { badge: string; label: string }> = {
  pending: { badge: "badge-warning", label: "รอตรวจสอบ" },
  confirmed: { badge: "badge-info", label: "ยืนยันแล้ว" },
  processing: { badge: "badge-primary", label: "กำลังเตรียม" },
  ready_for_pickup: { badge: "badge-accent", label: "พร้อมรับ" },
  shipped: { badge: "badge-secondary", label: "กำลังจัดส่ง" },
  completed: { badge: "badge-success", label: "สำเร็จ" },
  canceled: { badge: "badge-error", label: "ยกเลิก" },
};

const paymentMap: Record<string, { badge: string; label: string }> = {
  unpaid: { badge: "badge-warning", label: "ยังไม่ชำระ" },
  pending: { badge: "badge-info", label: "รอตรวจสอบ" },
  paid: { badge: "badge-success", label: "ชำระแล้ว" },
  failed: { badge: "badge-error", label: "ชำระไม่สำเร็จ" },
  refunded: { badge: "badge-neutral", label: "คืนเงินแล้ว" },
};

const { data, pending, error, refresh } = await useFetch<any>("/api/order", {
  server: false,
  query: { page, pageSize, q },
  watch: [page, pageSize, q],
});

const statusMeta = (status: string) =>
  statusMap[status] || { badge: "badge-ghost", label: status || "-" };
const paymentMeta = (status: string) =>
  paymentMap[status] || { badge: "badge-ghost", label: status || "-" };

const orderTotalQuantity = (order: Row) => {
  const items = detailByOrder.value[order.uuid]?.items;
  if (!items) return Number(order.order_item_count || 0);

  return items.reduce(
    (total, item) => total + Number(item.order_item_quantity || 0),
    0,
  );
};

const formatMoney = (value: number | string) =>
  new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatDate = (value: string) =>
  value
    ? new Intl.DateTimeFormat("th-TH", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "-";

const loadDetails = async (orderUuid: string, force = false) => {
  if (detailByOrder.value[orderUuid] && !force) return;
  detailLoadingOrderUuid.value = orderUuid;
  try {
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
    detailByOrder.value = {
      ...detailByOrder.value,
      [orderUuid]: {
        items: items.rows || [],
        histories: histories.rows || [],
        adjustments: adjustments.rows || [],
        payments: payments.rows || [],
      },
    };
  } catch (error: any) {
    showToast(
      error?.data?.statusMessage || "ไม่สามารถโหลดรายละเอียดคำสั่งซื้อได้",
      "error",
    );
  } finally {
    detailLoadingOrderUuid.value = "";
  }
};

const toggleOrder = async (order: Row) => {
  if (expandedOrderUuid.value === order.uuid) {
    expandedOrderUuid.value = "";
    return;
  }
  expandedOrderUuid.value = order.uuid;
  await loadDetails(order.uuid);
};

const reloadOrder = async (orderUuid: string) => {
  await Promise.all([refresh(), loadDetails(orderUuid, true)]);
};
</script>
