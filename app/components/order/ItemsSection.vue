<template>
  <section
    class="admin-table-surface rounded-xl border border-base-300 bg-base-100 p-4"
  >
    <div
      class="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <div class="flex items-center gap-2 mb-3">
          <Icon name="lucide:package" size="20" class="text-primary" />
          <h2 class="text-sm font-bold sm:text-base lg:text-lg">
            รายการสินค้า
          </h2>
        </div>
        <p class="text-xs text-base-content/55">
          การแก้ไขทุกครั้งจะถูกบันทึกในประวัติด้านขวา
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <NuxtLink
          v-if="order.uuid"
          :to="{
            path: `/admin/orders/${order.uuid}/quotation`,
            query: { print: '1' },
          }"
          target="_blank"
          rel="noopener"
          class="btn btn-outline btn-xs"
          aria-label="เปิดและพิมพ์ใบเสนอราคา"
        >
          <Icon name="lucide:file-text" size="15" />
          ใบเสนอราคา
        </NuxtLink>

        <NuxtLink
          v-if="order.uuid"
          :to="{
            path: `/admin/orders/${order.uuid}/product-list`,
            query: { print: '1' },
          }"
          target="_blank"
          rel="noopener"
          class="btn btn-outline btn-xs"
          aria-label="พิมพ์รายการสินค้าในคำสั่งซื้อ"
        >
          <Icon name="lucide:printer" size="15" />
          พิมพ์รายการสินค้า
        </NuxtLink>

        <button
          v-if="!isTerminal"
          type="button"
          class="admin-table-create"
          :disabled="actionLoading"
          @click="addItemModal?.open()"
        >
          <Icon name="lucide:circle-plus" size="15" />
          เพิ่มสินค้า
        </button>
      </div>
    </div>

    <div class="admin-table-viewport">
      <table class="admin-data-table">
        <thead>
          <tr class="text-xs sm:text-sm">
            <th>สินค้า</th>
            <th class="hidden sm:table-cell">ราคา</th>
            <th class="text-center">จำนวน</th>
            <th class="hidden text-right sm:table-cell">รวม</th>
            <th v-if="!isTerminal" scope="col" class="admin-table-actions">
              ดำเนินการ
            </th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="item in items" :key="item.uuid">
            <td>
              <p class="font-semibold">{{ item.order_item_product_name }}</p>
              <p class="text-xs text-base-content/50">
                {{ item.order_item_product_code }}
              </p>

              <div class="mt-1 block sm:hidden">
                ฿{{ formatMoney(item.order_item_unit_price) }}
                <p
                  v-if="Number(item.order_item_discount) > 0"
                  class="text-xs text-success"
                >
                  ลด ฿{{ formatMoney(item.order_item_discount) }}
                </p>
              </div>

              <div class="mt-1 block text-[11.5px] font-bold sm:hidden">
                ฿{{ formatMoney(item.order_item_total) }}
              </div>
            </td>

            <td class="hidden sm:table-cell">
              ฿{{ formatMoney(item.order_item_unit_price) }}
              <p
                v-if="Number(item.order_item_discount) > 0"
                class="text-xs text-success"
              >
                ลด ฿{{ formatMoney(item.order_item_discount) }}
              </p>
            </td>

            <td class="text-center">
              <div v-if="!isTerminal" class="join">
                <button
                  type="button"
                  class="btn btn-xs join-item"
                  aria-label="ลดจำนวนสินค้า"
                  :disabled="
                    Number(item.order_item_quantity) <= 1 || actionLoading
                  "
                  @click="changeQuantity(item, -1)"
                >
                  <Icon name="lucide:minus" size="13" />
                </button>
                <span
                  class="btn btn-xs join-item pointer-events-none w-9 bg-base-100"
                >
                  {{ item.order_item_quantity }}
                </span>
                <button
                  type="button"
                  class="btn btn-xs join-item"
                  aria-label="เพิ่มจำนวนสินค้า"
                  :disabled="actionLoading"
                  @click="changeQuantity(item, 1)"
                >
                  <Icon name="lucide:plus" size="13" />
                </button>
              </div>
              <div v-else>{{ item.order_item_quantity }}</div>
            </td>

            <td class="hidden text-right font-bold sm:table-cell">
              ฿{{ formatMoney(item.order_item_total) }}
            </td>

            <td v-if="!isTerminal" class="text-right">
              <TableAction
                label="ลบสินค้าออกจากคำสั่งซื้อ"
                icon="lucide:trash-2"
                tone="danger"
                :disabled="actionLoading"
                @click="askRemoveItem(item)"
              />
            </td>
          </tr>

          <TableStateRow v-if="!items.length" :columns="isTerminal ? 4 : 5" />
        </tbody>
      </table>
    </div>
  </section>

  <OrderAddItemModal ref="addItemModal" :order="order" :detail="detail" />

  <ModalRemoveConfirm
    v-model="isRemoveConfirmOpen"
    title="ยืนยันการลบรายการสินค้า"
    :message="removeMessage"
    confirm-text="ลบรายการ"
    :loading="actionLoading"
    @confirm="removeItem"
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

const props = defineProps<{
  order: Row;
  detail?: OrderDetail;
}>();

const addItemModal = ref<{ open: () => void } | null>(null);
const removeTarget = ref<Row | null>(null);
const isRemoveConfirmOpen = ref(false);
const actionLoading = ref(false);
const { showToast } = useToast();

const items = computed(() => props.detail?.items || []);
const isTerminal = computed(() =>
  ["completed", "canceled"].includes(props.order.order_status),
);
const removeMessage = computed(
  () =>
    "ต้องการลบ " +
    (removeTarget.value?.order_item_product_name || "รายการนี้") +
    " ออกจากคำสั่งซื้อใช่หรือไม่",
);

const formatMoney = (value: number | string) =>
  new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const reloadDetails = async () => {
  const orderUuid = String(props.order.uuid || "");
  if (!orderUuid) return;

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

  if (props.detail) {
    Object.assign(props.detail, {
      items: items.rows || [],
      histories: histories.rows || [],
      adjustments: adjustments.rows || [],
      payments: payments.rows || [],
    });
  }

  await refreshNuxtData();
};

const changeQuantity = async (item: Row, amount: number) => {
  const quantity = Number(item.order_item_quantity) + amount;
  if (quantity < 1 || actionLoading.value) return;
  actionLoading.value = true;

  try {
    await $fetch("/api/order/items/" + item.uuid, {
      method: "PUT",
      body: { order_item_quantity: quantity },
    });
    showToast("ปรับจำนวนสินค้าแล้ว");
    await reloadDetails();
  } catch (error: any) {
    showToast(
      error?.data?.statusMessage || "ไม่สามารถปรับจำนวนสินค้าได้",
      "error",
    );
  } finally {
    actionLoading.value = false;
  }
};

const askRemoveItem = (item: Row) => {
  removeTarget.value = item;
  isRemoveConfirmOpen.value = true;
};

const removeItem = async () => {
  if (!removeTarget.value || actionLoading.value) return;
  actionLoading.value = true;

  try {
    await $fetch("/api/order/items/" + removeTarget.value.uuid, {
      method: "DELETE",
    });
    isRemoveConfirmOpen.value = false;
    showToast("ลบรายการสินค้าแล้ว");
    await reloadDetails();
  } catch (error: any) {
    showToast(error?.data?.statusMessage || "ไม่สามารถลบสินค้าได้", "error");
  } finally {
    actionLoading.value = false;
    removeTarget.value = null;
  }
};
</script>
