<template>
  <div class="space-y-5 p-4 md:p-6">
    <section
      class="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm"
    >
      <div
        class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
      >
        <div>
          <h1 class="mt-1 text-xl font-bold md:text-2xl">
            รายงานกำไรจากการขาย
          </h1>
          <p class="mt-1 text-sm text-base-content/60">
            แสดงเฉพาะคำสั่งซื้อที่ปิดงานแล้ว และยึดต้นทุน ณ วันที่ปิดงาน
          </p>
        </div>
        <div class="flex gap-3 items-center">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">ตั้งแต่วันที่</legend>
            <input
              v-model="dateFrom"
              type="date"
              class="input input-sm w-full"
            />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">ถึงวันที่</legend>
            <input v-model="dateTo" type="date" class="input input-sm w-full" />
          </fieldset>
          <button
            class="btn btn-primary btn-sm"
            :disabled="reportPending"
            @click="refreshReport()"
          >
            <span
              v-if="reportPending"
              class="loading loading-spinner loading-xs"
            />
            <Icon v-else name="lucide:filter" size="15" />
            กรองรายงาน
          </button>
        </div>
      </div>

      <p v-if="reportError" class="mt-4 text-sm text-error">
        {{ reportError.message }}
      </p>
      <div v-else class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article class="rounded-xl bg-primary p-4 text-primary-content">
          <p class="text-sm opacity-80">ยอดขายสุทธิ</p>
          <p class="mt-2 text-2xl font-bold">
            ฿{{ formatMoney(reportSummary.net_sales) }}
          </p>
          <p class="mt-2 text-xs opacity-75">ก่อนหักต้นทุน</p>
        </article>
        <article class="rounded-xl bg-base-200 p-4">
          <p class="text-sm text-base-content/60">ต้นทุนสินค้า</p>
          <p class="mt-2 text-2xl font-bold">
            ฿{{ formatMoney(reportSummary.total_cost) }}
          </p>
          <p class="mt-2 text-xs text-base-content/50">
            จากต้นทุนที่ snapshot ไว้
          </p>
        </article>
        <article class="rounded-xl bg-success p-4 text-success-content">
          <p class="text-sm opacity-80">กำไรขั้นต้น</p>
          <p class="mt-2 text-2xl font-bold">
            ฿{{ formatMoney(reportSummary.gross_profit) }}
          </p>
          <p class="mt-2 text-xs opacity-75">
            {{ profitMargin }}% ของยอดขายสุทธิ
          </p>
        </article>
        <article class="rounded-xl bg-base-200 p-4">
          <p class="text-sm text-base-content/60">คำสั่งซื้อที่ปิดงาน</p>
          <p class="mt-2 text-2xl font-bold">
            {{ Number(reportSummary.order_count || 0) }}
          </p>
          <p class="mt-2 text-xs text-base-content/50">
            {{ Number(reportSummary.quantity || 0) }} ชิ้น /
            {{ Number(reportSummary.item_line_count || 0) }} รายการ
          </p>
        </article>
      </div>
    </section>

    <section class="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
      <article
        class="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm"
      >
        <div class="flex items-center justify-between gap-3">
          <div>
            <h2 class="font-bold">ยอดขายและกำไรรายวัน</h2>
            <p class="text-sm text-base-content/55">
              สูงสุด 31 วันล่าสุดในช่วงที่เลือก
            </p>
          </div>
          <Icon
            name="lucide:chart-no-axes-combined"
            size="20"
            class="text-primary"
          />
        </div>
        <div class="mt-4 space-y-3">
          <div
            v-for="day in report?.byDay || []"
            :key="day.sale_date"
            class="grid grid-cols-[5.5rem_1fr_auto] items-center gap-3 text-sm"
          >
            <span class="text-base-content/60">{{
              formatShortDate(day.sale_date)
            }}</span>
            <div class="h-2 overflow-hidden rounded-full bg-base-200">
              <div
                class="h-full rounded-full bg-primary transition-all"
                :style="{ width: `${salesBarWidth(day.net_sales)}%` }"
              />
            </div>
            <span class="font-semibold text-primary"
              >฿{{ formatMoney(day.net_sales) }}</span
            >
          </div>
          <p
            v-if="!(report?.byDay || []).length"
            class="py-8 text-center text-sm text-base-content/50"
          >
            ยังไม่มีรายการขายในช่วงวันที่เลือก
          </p>
        </div>
      </article>

      <article
        class="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm"
      >
        <div class="flex items-center justify-between gap-3">
          <div>
            <h2 class="font-bold">สินค้าขายดี</h2>
            <p class="text-sm text-base-content/55">จัดอันดับตามยอดขายสุทธิ</p>
          </div>
          <Icon name="lucide:trophy" size="20" class="text-warning" />
        </div>
        <ol class="mt-3 divide-y divide-base-200">
          <li
            v-for="(product, index) in report?.topProducts || []"
            :key="`${product.order_item_transaction_product_code}-${index}`"
            class="flex items-center gap-3 py-3"
          >
            <span
              class="grid h-7 w-7 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary"
              >{{ (index as number) + 1 }}</span
            >
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold">
                {{ product.order_item_transaction_product_name }}
              </p>
              <p class="text-xs text-base-content/50">
                {{ product.quantity }} ชิ้น · กำไร ฿{{
                  formatMoney(product.gross_profit)
                }}
              </p>
            </div>
            <p class="text-sm font-bold text-primary">
              ฿{{ formatMoney(product.net_sales) }}
            </p>
          </li>
          <li
            v-if="!(report?.topProducts || []).length"
            class="py-8 text-center text-sm text-base-content/50"
          >
            ยังไม่มีข้อมูลสินค้า
          </li>
        </ol>
      </article>
    </section>

    <section>
      <h2 class="mb-3 text-lg font-bold">ข้อมูลระบบ</h2>
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <div
          role="alert"
          class="alert bg-base-100 shadow-sm flex justify-between items-center"
        >
          <div class="flex items-center gap-2">
            <Icon name="lucide:users-round" size="20" class="text-info" /><span
              class="font-semibold"
              >จำนวนผู้ใช้งานระบบ</span
            >
          </div>
          <div class="badge badge-info badge-md text-xs font-bold rounded-lg">
            {{ total.users }}
          </div>
        </div>
        <div
          role="alert"
          class="alert bg-base-100 shadow-sm flex justify-between items-center"
        >
          <div class="flex items-center gap-2">
            <Icon name="lucide:package" size="20" class="text-success" /><span
              class="font-semibold"
              >จำนวนรายการสินค้า</span
            >
          </div>
          <div
            class="badge badge-success badge-md text-xs font-bold rounded-lg"
          >
            {{ total.products }}
          </div>
        </div>
        <div
          role="alert"
          class="alert bg-base-100 shadow-sm flex justify-between items-center"
        >
          <div class="flex items-center gap-2">
            <Icon name="lucide:tags" size="20" class="text-success" /><span
              class="font-semibold"
              >จำนวนรายการหมวดหมู่</span
            >
          </div>
          <div
            class="badge badge-success badge-md text-xs font-bold rounded-lg"
          >
            {{ total.categories }}
          </div>
        </div>
        <div
          role="alert"
          class="alert bg-base-100 shadow-sm flex justify-between items-center"
        >
          <div class="flex items-center gap-2">
            <Icon name="lucide:truck" size="20" class="text-success" /><span
              class="font-semibold"
              >จำนวนรายการผู้จัดจำหน่าย</span
            >
          </div>
          <div
            class="badge badge-success badge-md text-xs font-bold rounded-lg"
          >
            {{ total.suppliers }}
          </div>
        </div>
        <div
          role="alert"
          class="alert bg-base-100 shadow-sm flex justify-between items-center"
        >
          <div class="flex items-center gap-2">
            <Icon name="lucide:tags" size="20" class="text-success" /><span
              class="font-semibold"
              >จำนวนประเภทโปรโมชั่น</span
            >
          </div>
          <div
            class="badge badge-success badge-md text-xs font-bold rounded-lg"
          >
            {{ total.types }}
          </div>
        </div>
        <div
          role="alert"
          class="alert bg-base-100 shadow-sm flex justify-between items-center"
        >
          <div class="flex items-center gap-2">
            <Icon name="lucide:gift" size="20" class="text-warning" /><span
              class="font-semibold"
              >จำนวนโปรโมชั่นที่ใช้งานอยู่</span
            >
          </div>
          <div
            class="badge badge-warning badge-md text-xs font-bold rounded-lg"
          >
            {{ total.promotion }}
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useDayjs } from "~~/composables/useDayjs";

definePageMeta({ layout: "admin" });

const dayjs = useDayjs();
const today = dayjs().format("YYYY-MM-DD");
const dateFrom = ref(dayjs().startOf("month").format("YYYY-MM-DD"));
const dateTo = ref(today);
const total = ref({
  users: 0,
  products: 0,
  categories: 0,
  suppliers: 0,
  types: 0,
  promotion: 0,
});

const {
  data: report,
  pending: reportPending,
  error: reportError,
  refresh: refreshReport,
} = await useFetch<any>("/api/order/item-transactions", {
  server: false,
  query: { dateFrom, dateTo },
  watch: false,
});

const reportSummary = computed(() => report.value?.summary || {});
const profitMargin = computed(() => {
  const netSales = Number(reportSummary.value.net_sales || 0);
  const grossProfit = Number(reportSummary.value.gross_profit || 0);
  return netSales > 0 ? ((grossProfit / netSales) * 100).toFixed(1) : "0.0";
});
const maxDailySales = computed(() =>
  Math.max(
    1,
    ...(report.value?.byDay || []).map((row: any) =>
      Number(row.net_sales || 0),
    ),
  ),
);

const formatMoney = (value: number | string | undefined) =>
  new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
const formatShortDate = (value: string) => dayjs(value).format("DD MMM");
const salesBarWidth = (value: number | string) =>
  Math.max(4, (Number(value || 0) / maxDailySales.value) * 100);

onMounted(async () => {
  const [users, products, categories, suppliers, types, promotion] =
    await Promise.all([
      $fetch<any>("/api/user", { params: { pageSize: 1 } }),
      $fetch<any>("/api/products", { params: { pageSize: 1 } }),
      $fetch<any>("/api/categories", { params: { pageSize: 1 } }),
      $fetch<any>("/api/suppliers", { params: { pageSize: 1 } }),
      $fetch<any>("/api/promotion/types", { params: { pageSize: 1 } }),
      $fetch<any>("/api/promotion", { params: { now: true } }),
    ]);

  total.value = {
    users: users.total,
    products: products.total,
    categories: categories.total,
    suppliers: suppliers.total,
    types: types.total,
    promotion: promotion.total,
  };
});
</script>
