<template>
  <ModalConfirm
    v-model="isRemoveConfirmOpen"
    title="ยืนยันการลบรายการสินค้า"
    :message="`ต้องการลบ ${removeTarget?.order_item_product_name || 'รายการนี้'} ออกจากคำสั่งซื้อใช่หรือไม่`"
    confirm-text="ลบรายการ"
    :loading="isActionLoading"
    @confirm="removeItem"
  />

  <dialog ref="addItemModal" class="modal">
    <div class="modal-box max-w-md">
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-3 top-3">
          ×
        </button>
      </form>
      <h3 class="text-lg font-bold">เพิ่มสินค้าในคำสั่งซื้อ</h3>
      <div class="mt-4 space-y-3">
        <fieldset class="fieldset">
          <legend class="fieldset-legend">สินค้า</legend>
          <ComboBox
            v-model="addItemForm.productUuid"
            fetch-url="/api/products"
            label="product_name"
            value="uuid"
            placeholder="ค้นหาและเลือกสินค้า"
            @select="selectProduct"
          />
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">จำนวน</legend>
          <input
            v-model.number="addItemForm.quantity"
            type="number"
            min="1"
            class="input input-sm w-full"
            placeholder="จำนวนสินค้า"
          />
        </fieldset>
        <div
          v-if="addItemForm.productName"
          class="rounded-xl bg-base-200 p-3 text-sm"
        >
          <p class="font-semibold">{{ addItemForm.productName }}</p>
          <p class="mt-1 text-base-content/60">
            ราคาปกติ ฿{{ formatMoney(addItemForm.unitPrice) }}
          </p>
        </div>
      </div>
      <div class="modal-action">
        <button
          class="btn btn-sm flex-1"
          type="button"
          :disabled="isActionLoading"
          @click="addItemModal?.close()"
        >
          ปิด
        </button>
        <button
          class="btn btn-primary btn-sm flex-1"
          type="button"
          :disabled="
            !addItemForm.productUuid ||
            addItemForm.quantity < 1 ||
            isActionLoading
          "
          @click="addItem"
        >
          <span
            v-if="isActionLoading"
            class="loading loading-spinner loading-xs"
          />
          <template v-else>เพิ่มสินค้า</template>
        </button>
      </div>
    </div>
  </dialog>

  <dialog ref="statusModal" class="modal">
    <div class="modal-box max-w-md">
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-3 top-3">
          ×
        </button>
      </form>
      <h3 class="text-lg font-bold">เปลี่ยนสถานะคำสั่งซื้อ</h3>
      <div class="mt-4 space-y-3">
        <fieldset class="fieldset">
          <legend class="fieldset-legend">สถานะใหม่</legend>
          <select v-model="statusForm.status" class="select select-sm w-full">
            <option
              v-for="status in statusOptions"
              :key="status.value"
              :value="status.value"
            >
              {{ status.label }}
            </option>
          </select>
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">หมายเหตุ</legend>
          <textarea
            v-model.trim="statusForm.note"
            class="textarea textarea-sm w-full"
            placeholder="ข้อความนี้จะแสดงในประวัติและแจ้งลูกค้าผ่าน LINE"
          ></textarea>
        </fieldset>
      </div>
      <div class="modal-action">
        <button
          class="btn btn-sm flex-1"
          type="button"
          :disabled="isActionLoading"
          @click="statusModal?.close()"
        >
          ปิด
        </button>
        <button
          class="btn btn-primary btn-sm flex-1"
          type="button"
          :disabled="!statusForm.status || isActionLoading"
          @click="changeStatus"
        >
          <span
            v-if="isActionLoading"
            class="loading loading-spinner loading-xs"
          />
          <template v-else>บันทึกสถานะ</template>
        </button>
      </div>
    </div>
  </dialog>

  <div class="bg-base-100 p-4">
    <div
      class="flex md:flex-row flex-col justify-between gap-3 md:items-center"
    >
      <div
        class="space-x-3 flex md:flex-col flex-rows md:items-start items-center"
      >
        <div class="text-xl font-bold text-primary">Order Management</div>
        <div class="text-base font-semibold text-secondary">
          จัดการคำสั่งซื้อและการจัดส่ง
        </div>
      </div>
      <label class="input input-xs w-full shadow-sm sm:input-sm md:w-80">
        <span class="label"><Icon name="lucide:search" size="16" /></span>
        <input
          v-model="q"
          type="text"
          placeholder="ค้นหาเลขที่คำสั่งซื้อ ชื่อ หรือเบอร์โทร"
        />
      </label>
    </div>

    <div
      class="relative md:min-h-[calc(100dvh-16rem)] md:max-h-[calc(100dvh-16rem)] min-h-[calc(100dvh-16.5rem)] max-h-[calc(100dvh-16.5rem)] overflow-auto rounded-2xl border border-base-300 bg-base-100 shadow-sm md:my-4 sm:my-2 my-1"
      :class="pending ? 'backdrop-blur-sm' : ''"
    >
      <p
        v-if="pending"
        class="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 text-4xl font-bold text-primary/75"
      >
        Loading...
      </p>
      <p v-if="error" class="p-4 text-error">{{ error.message }}</p>
      <table
        class="table min-w-max table-zebra bg-base-100 text-xs table-pin-rows table-pin-cols sm:table-sm"
      >
        <thead class="text-xs">
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th class="sm:block hidden">Delivery</th>
            <th class="text-center md:block hidden">Items</th>
            <th class="md:block hidden">Total</th>
            <th class="md:block hidden">Payment</th>
            <th>Status</th>
            <th class="md:block hidden">Completed</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <template v-for="order in data?.rows || []" :key="order.uuid">
            <tr class="hover:bg-primary/5">
              <td>
                <p class="font-mono font-bold text-primary">
                  {{ order.order_number }}
                </p>
                <p class="mt-1 text-[11px] text-base-content/50">
                  Placed at: {{ formatDate(order.order_placed_at || order.created_at) }}
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
              <td class="sm:block hidden">
                <p>{{ order.order_delivery_label || "-" }}</p>
                <p
                  v-if="order.order_tracking_number"
                  class="mt-1 text-xs text-base-content/50"
                >
                  {{ order.order_tracking_number }}
                </p>
              </td>
              <td class="text-center md:block hidden">{{ order.order_item_count || 0 }}</td>
              <td class="font-bold text-primary md:block hidden">
                ฿{{ formatMoney(order.order_grand_total) }}
              </td>
              <td class="md:block hidden">
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
              <td class="md:block hidden">
                {{ formatDate(order.order_completed_at) }}
              </td>
              <th class="text-right">
                <button class="btn btn-xs btn-link" @click="toggleOrder(order)">
                  {{ expandedOrderUuid === order.uuid ? "ซ่อน" : "จัดการ" }}
                </button>
              </th>
            </tr>
            <tr v-if="expandedOrderUuid === order.uuid">
              <td colspan="9" class="bg-base-200/40 p-0">
                <div
                  v-if="detailLoadingOrderUuid === order.uuid"
                  class="flex justify-center py-10"
                >
                  <span
                    class="loading loading-spinner loading-md text-primary"
                  />
                </div>
                <div
                  v-else
                  class="grid gap-5 p-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]"
                >
                  <section
                    class="rounded-xl border border-base-300 bg-base-100 p-4"
                  >
                    <div
                      class="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <h2 class="font-bold">รายการสินค้า</h2>
                        <p class="text-xs text-base-content/55">
                          การแก้ไขทุกครั้งจะถูกบันทึกในประวัติด้านขวา
                        </p>
                      </div>
                      <button
                        v-if="!isTerminal(order)"
                        class="btn btn-primary btn-xs"
                        :disabled="isTerminal(order)"
                        @click="openAddItem(order)"
                      >
                        <Icon name="lucide:plus" size="15" /> เพิ่มสินค้า
                      </button>
                    </div>
                    <div class="overflow-x-auto">
                      <table class="table sm:table-sm table-xs">
                        <thead>
                          <tr>
                            <th>สินค้า</th>
                            <th>ราคา</th>
                            <th class="text-center">จำนวน</th>
                            <th class="text-right">รวม</th>
                            <th v-if="!isTerminal(order)"></th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="item in detailByOrder[order.uuid]?.items ||
                            []"
                            :key="item.uuid"
                          >
                            <td>
                              <p class="font-semibold">
                                {{ item.order_item_product_name }}
                              </p>
                              <p class="text-xs text-base-content/50">
                                {{ item.order_item_product_code }}
                              </p>
                            </td>
                            <td>
                              ฿{{ formatMoney(item.order_item_unit_price) }}
                              <p
                                v-if="Number(item.order_item_discount) > 0"
                                class="text-xs text-success"
                              >
                                ลด ฿{{ formatMoney(item.order_item_discount) }}
                              </p>
                            </td>
                            <td class="text-center">
                              <div class="join" v-if="!isTerminal(order)">
                                <button
                                  class="btn btn-xs join-item"
                                  :disabled="
                                    Number(item.order_item_quantity) <= 1 ||
                                    isActionLoading
                                  "
                                  @click="changeQuantity(order, item, -1)"
                                >
                                  <Icon name="lucide:minus" size="13" /></button
                                ><span
                                  class="btn btn-xs join-item pointer-events-none w-9 bg-base-100"
                                  >{{ item.order_item_quantity }}</span
                                ><button
                                  class="btn btn-xs join-item"
                                  :disabled="isActionLoading"
                                  @click="changeQuantity(order, item, 1)"
                                >
                                  <Icon name="lucide:plus" size="13" />
                                </button>
                              </div>
                              <div v-else>
                                {{ item.order_item_quantity }}
                              </div>
                            </td>
                            <td class="text-right font-bold">
                              ฿{{ formatMoney(item.order_item_total) }}
                            </td>
                            <td class="text-right" v-if="!isTerminal(order)">
                              <button
                                class="btn btn-ghost btn-xs text-error"
                                :disabled="isActionLoading"
                                @click="askRemoveItem(item)"
                              >
                                <Icon name="lucide:trash-2" size="15" />
                              </button>
                            </td>
                          </tr>
                          <tr
                            v-if="
                              !(detailByOrder[order.uuid]?.items || []).length
                            "
                          >
                            <td
                              colspan="5"
                              class="py-6 text-center text-sm text-base-content/50"
                            >
                              ไม่มีรายการสินค้า
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div
                      class="mt-4 flex justify-end gap-5 border-t border-base-300 pt-3 text-sm"
                    >
                      <span
                        >ส่วนลด ฿{{ formatMoney(order.order_discount) }}</span
                      ><span class="font-bold text-primary"
                        >ยอดรวม ฿{{
                          formatMoney(order.order_grand_total)
                        }}</span
                      >
                    </div>
                  </section>
                  <div class="space-y-5">
                    <section
                      class="rounded-xl border border-base-300 bg-base-100 p-4"
                    >
                      <div class="mb-3 flex items-center gap-2">
                        <Icon name="lucide:map-pinned" size="18" class="text-primary" />
                        <h2 class="font-bold">ที่อยู่จัดส่ง</h2>
                      </div>
                      <div
                        v-if="order.order_delivery_method === 'pickup'"
                        class="rounded-lg bg-base-200 p-3 text-sm"
                      >
                        <p class="font-semibold">
                          {{ order.order_delivery_label || "รับสินค้าด้วยตัวเอง" }}
                        </p>
                        <p class="mt-1 text-xs text-base-content/60">
                          {{ order.order_delivery_description || "ลูกค้าจะรับสินค้าที่จุดรับสินค้า" }}
                        </p>
                      </div>
                      <div v-else class="space-y-2 text-sm">
                        <div class="flex flex-wrap items-center justify-between gap-2">
                          <p class="font-semibold">
                            {{ order.order_shipping_recipient || "-" }}
                          </p>
                          <span
                            v-if="order.order_shipping_label"
                            class="badge badge-outline badge-sm"
                          >
                            {{ order.order_shipping_label }}
                          </span>
                        </div>
                        <p v-if="order.order_shipping_phone" class="text-base-content/65">
                          {{ order.order_shipping_phone }}
                        </p>
                        <p class="leading-6 text-xs text-base-content/75">
                          {{ shippingAddressLine(order) || "-" }}
                        </p>
                        <p
                          v-if="order.order_shipping_postcode"
                          class="text-xs text-base-content/55"
                        >
                          รหัสไปรษณีย์ {{ order.order_shipping_postcode }}
                        </p>
                        <p
                          v-if="order.order_shipping_note"
                          class="rounded-lg bg-warning/10 p-2 text-xs text-base-content/70"
                        >
                          หมายเหตุ: {{ order.order_shipping_note }}
                        </p>
                      </div>
                    </section>
                    <section
                      class="rounded-xl border border-base-300 bg-base-100 p-4"
                    >
                      <div class="mb-3 flex items-center justify-between">
                        <h2 class="font-bold">สถานะคำสั่งซื้อ</h2>
                        <button
                          v-if="!isTerminal(order)"
                          class="btn btn-outline btn-primary btn-xs"
                          @click="openStatus(order)"
                        >
                          เปลี่ยนสถานะ
                        </button>
                      </div>
                      <ul class="steps steps-vertical steps-sm w-full">
                        <li
                          v-for="history in detailByOrder[order.uuid]
                            ?.histories || []"
                          :key="history.uuid"
                          class="step  text-left [&>p]:w-full"
                          :class="historyStepClass(history)"
                        >
                          <p class="text-sm font-semibold">
                            {{
                              statusMeta(history.order_status_history_status)
                                .label
                            }}
                            <p
                              v-if="history.order_status_history_note"
                              class="text-xs text-base-content/60"
                            >
                              {{ history.order_status_history_note }}
                            </p>
                            <p class="text-xs text-base-content/45">
                              {{ formatDate(history.created_at) }} ·
                              {{ history.created_username || "ระบบ" }}
                            </p>
                          </p>
                        </li>
                      </ul>
                    </section>
                    <section
                      class="rounded-xl border border-base-300 bg-base-100 p-4"
                    >
                      <h2 class="mb-3 font-bold">ประวัติการปรับสินค้า</h2>
                      <ol class="space-y-3">
                        <li
                          v-for="adjustment in detailByOrder[order.uuid]
                            ?.adjustments || []"
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
                        <li
                          v-if="
                            !(detailByOrder[order.uuid]?.adjustments || [])
                              .length
                          "
                          class="text-sm text-base-content/50"
                        >
                          ยังไม่มีการปรับรายการโดยแอดมิน
                        </li>
                      </ol>
                    </section>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
    <TablePagination
      v-model:page="page"
      v-model:page-size="pageSize"
      :disabled="pending"
      :data="data"
    />
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
  Record<string, { items: Row[]; histories: Row[]; adjustments: Row[] }>
>({});
const addItemModal = ref<HTMLDialogElement | null>(null);
const statusModal = ref<HTMLDialogElement | null>(null);
const activeOrder = ref<Row | null>(null);
const removeTarget = ref<Row | null>(null);
const isRemoveConfirmOpen = ref(false);
const isActionLoading = ref(false);
const { showToast } = useToast();

const addItemForm = reactive({
  productUuid: "",
  productCode: "",
  productName: "",
  productImage: "",
  quantity: 1,
  unitPrice: 0,
});

const statusForm = reactive({ status: "", note: "" });

const statusOptions = [
  { value: "confirmed", label: "ยืนยันคำสั่งซื้อ" },
  { value: "processing", label: "กำลังเตรียมสินค้า" },
  { value: "ready_for_pickup", label: "พร้อมรับสินค้า" },
  { value: "shipped", label: "กำลังจัดส่ง" },
  { value: "completed", label: "ปิดงานสำเร็จ" },
  { value: "canceled", label: "ยกเลิก" },
];

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
const historyStepClass = (history: Row) =>
  ({
    pending: "step-warning",
    confirmed: "step-info",
    processing: "step-primary",
    ready_for_pickup: "step-accent",
    shipped: "step-secondary",
    completed: "step-success",
    canceled: "step-error",
  })[history.order_status_history_status] || "step-neutral";
const shippingAddressLine = (order: Row) =>
  [
    order.order_shipping_address,
    order.order_shipping_subdistrict,
    order.order_shipping_district,
    order.order_shipping_province,
  ]
    .filter(Boolean)
    .join(" ");

const isTerminal = (order: Row) =>
  ["completed", "canceled"].includes(order.order_status);

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
    const [items, histories, adjustments]: any = await Promise.all([
      $fetch("/api/order/items", {
        params: { order_item_order: orderUuid, pageSize: 100 },
      }),
      $fetch("/api/order/status-histories", {
        params: { order_status_history_order: orderUuid, pageSize: 100 },
      }),
      $fetch("/api/order/item-adjustments", {
        params: { order_item_adjustment_order: orderUuid },
      }),
    ]);
    detailByOrder.value = {
      ...detailByOrder.value,
      [orderUuid]: {
        items: items.rows || [],
        histories: histories.rows || [],
        adjustments: adjustments.rows || [],
      },
    };
  } catch (error: any) {
    showToast(
      error?.data?.statusMessage || "ไม่สามารถโหลดรายละเอียดคำสั่งซื้อได้",
      "error",
    );
  } finally {
    console.log(detailByOrder.value);
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

const openAddItem = (order: Row) => {
  activeOrder.value = order;
  Object.assign(addItemForm, {
    productUuid: "",
    productCode: "",
    productName: "",
    productImage: "",
    quantity: 1,
    unitPrice: 0,
  });
  addItemModal.value?.showModal();
};
const selectProduct = (product: Row) =>
  Object.assign(addItemForm, {
    productUuid: product.uuid || "",
    productCode: product.product_code || "",
    productName: product.product_name || "",
    productImage: product.image_url || "",
    unitPrice: Number(product.product_selling_price || 0),
  });

const addItem = async () => {
  if (!activeOrder.value) return;
  isActionLoading.value = true;
  try {
    await $fetch("/api/order/items", {
      method: "POST",
      body: {
        order_item_order: activeOrder.value.uuid,
        order_item_product: addItemForm.productUuid,
        order_item_product_code: addItemForm.productCode,
        order_item_product_name: addItemForm.productName,
        order_item_product_image: addItemForm.productImage,
        order_item_unit_price: addItemForm.unitPrice,
        order_item_quantity: addItemForm.quantity,
        order_item_discount: 0,
      },
    });
    addItemModal.value?.close();
    showToast("เพิ่มสินค้าในคำสั่งซื้อแล้ว");
    await reloadOrder(activeOrder.value.uuid);
  } catch (error: any) {
    showToast(error?.data?.statusMessage || "ไม่สามารถเพิ่มสินค้าได้", "error");
  } finally {
    isActionLoading.value = false;
  }
};

const changeQuantity = async (order: Row, item: Row, amount: number) => {
  const quantity = Number(item.order_item_quantity) + amount;
  if (quantity < 1) return;
  isActionLoading.value = true;
  try {
    await $fetch(`/api/order/items/${item.uuid}`, {
      method: "PUT",
      body: { order_item_quantity: quantity },
    });
    showToast("ปรับจำนวนสินค้าแล้ว");
    await reloadOrder(order.uuid);
  } catch (error: any) {
    showToast(
      error?.data?.statusMessage || "ไม่สามารถปรับจำนวนสินค้าได้",
      "error",
    );
  } finally {
    isActionLoading.value = false;
  }
};

const askRemoveItem = (item: Row) => {
  removeTarget.value = item;
  isRemoveConfirmOpen.value = true;
};

const removeItem = async () => {
  if (!removeTarget.value) return;
  isActionLoading.value = true;
  try {
    const orderUuid = String(removeTarget.value.order_item_order);
    await $fetch(`/api/order/items/${removeTarget.value.uuid}`, {
      method: "DELETE",
    });
    isRemoveConfirmOpen.value = false;
    showToast("ลบรายการสินค้าแล้ว");
    await reloadOrder(orderUuid);
  } catch (error: any) {
    showToast(error?.data?.statusMessage || "ไม่สามารถลบสินค้าได้", "error");
  } finally {
    isActionLoading.value = false;
    removeTarget.value = null;
  }
};

const openStatus = (order: Row) => {
  activeOrder.value = order;
  statusForm.status =
    order.order_status === "pending" ? "confirmed" : order.order_status;
  statusForm.note = "";
  statusModal.value?.showModal();
};

const changeStatus = async () => {
  if (!activeOrder.value) return;
  isActionLoading.value = true;
  try {
    const response: any = await $fetch("/api/order/status-histories", {
      method: "POST",
      body: {
        order_status_history_order: activeOrder.value.uuid,
        order_status_history_status: statusForm.status,
        order_status_history_note: statusForm.note,
      },
    });
    statusModal.value?.close();
    showToast("เปลี่ยนสถานะคำสั่งซื้อแล้ว");
    if (response.lineNotification?.sent)
      showToast("แจ้งสถานะให้ลูกค้าผ่าน LINE แล้ว");
    else if (response.lineNotification?.reason)
      showToast(
        `เปลี่ยนสถานะสำเร็จ แต่ไม่ส่ง LINE: ${response.lineNotification.reason}`,
        "warning",
      );
    await reloadOrder(activeOrder.value.uuid);
  } catch (error: any) {
    showToast(
      error?.data?.statusMessage || "ไม่สามารถเปลี่ยนสถานะได้",
      "error",
    );
  } finally {
    isActionLoading.value = false;
  }
};

const adjustmentLabel = (row: Row) =>
  ({ added: "เพิ่มสินค้า", updated: "ปรับรายการสินค้า", removed: "ลบสินค้า" })[
    row.order_item_adjustment_action
  ] || "ปรับรายการ";
const adjustmentSummary = (row: Row) => {
  const before = row.order_item_adjustment_before || {};
  const after = row.order_item_adjustment_after || {};
  const name =
    after.order_item_product_name || before.order_item_product_name || "สินค้า";
  if (row.order_item_adjustment_action === "updated")
    return `${name}: ${before.order_item_quantity || 0} ชิ้น → ${after.order_item_quantity || 0} ชิ้น`;
  return `${name} ${row.order_item_adjustment_action === "added" ? `${after.order_item_quantity || 0} ชิ้น` : `${before.order_item_quantity || 0} ชิ้น`}`;
};
</script>
