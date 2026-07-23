<template>
  <div class="space-y-5 p-4 md:p-6">
    <section
      class="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm md:p-5"
    >
      <div
        class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
      >
        <div>
          <h1 class="mt-1 text-xl font-bold md:text-2xl">ภาพรวมประจำวัน</h1>
          <p class="mt-1 text-sm text-base-content/60">
            {{ formatOverviewDate(overviewDate) }}
          </p>
        </div>
        <div class="flex flex-wrap items-end gap-2">
          <div class="join">
            <button
              class="join-item btn btn-sm rounded-l-s, cursor-not-allowed disabled:text-primary"
              disabled
            >
              เลือกวันที่
            </button>
            <input
              v-model="overviewDate"
              type="date"
              class="join-item input input-sm"
            />
          </div>
          <button
            type="button"
            class="btn btn-primary btn-sm"
            :disabled="overviewPending"
            @click="refreshOverview()"
          >
            <span
              v-if="overviewPending"
              class="loading loading-spinner loading-xs"
            />
            <Icon v-else name="lucide:refresh-cw" size="15" />
            อัปเดตภาพรวม
          </button>
        </div>
      </div>

      <p v-if="overviewError" class="mt-4 text-sm text-error">
        {{ overviewError.message }}
      </p>

      <div v-else class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article class="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-sm text-base-content/60">ยอดขายประจำวัน</p>
              <p class="mt-2 text-2xl font-bold text-primary">
                ฿{{ formatMoney(overviewSummary.daily_net_sales) }}
              </p>
            </div>
            <Icon
              name="lucide:badge-dollar-sign"
              size="22"
              class="text-primary"
            />
          </div>
          <p class="mt-2 text-xs text-base-content/50">
            จาก {{ Number(overviewSummary.daily_completed_order_count || 0) }}
            ออเดอร์ที่ปิดงาน
          </p>
        </article>

        <article class="rounded-xl border border-base-300 bg-base-100 p-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-sm text-base-content/60">ยอดขายเดือนนี้</p>
              <p class="mt-2 text-2xl font-bold">
                ฿{{ formatMoney(overviewSummary.monthly_net_sales) }}
              </p>
            </div>
            <Icon name="lucide:calendar-range" size="22" class="text-info" />
          </div>
          <p class="mt-2 text-xs text-base-content/50">
            ยอดรวมของเดือนที่เลือก
          </p>
        </article>

        <article class="rounded-xl border border-base-300 bg-base-100 p-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-sm text-base-content/60">ออเดอร์ประจำวัน</p>
              <p class="mt-2 text-2xl font-bold">
                {{ Number(overviewSummary.order_count || 0) }}
              </p>
            </div>
            <Icon name="lucide:package-check" size="22" class="text-warning" />
          </div>
          <p class="mt-2 text-xs text-base-content/50">
            รอดำเนินการ {{ Number(overviewSummary.active_order_count || 0) }}
            รายการ
          </p>
        </article>

        <article class="rounded-xl border border-success/25 bg-success/5 p-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-sm text-base-content/60">กำไรโดยประมาณ</p>
              <p class="mt-2 text-2xl font-bold text-success">
                ฿{{ formatMoney(overviewSummary.daily_gross_profit) }}
              </p>
            </div>
            <Icon name="lucide:trending-up" size="22" class="text-success" />
          </div>
          <p class="mt-2 text-xs text-base-content/50">
            Margin {{ overviewProfitMargin }}%
          </p>
        </article>
      </div>

      <div class="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <article class="rounded-xl border border-base-300 p-4">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h2 class="font-bold">ยอดขาย 7 วันล่าสุด</h2>
              <p class="text-sm text-base-content/55">
                สิ้นสุด ณ วันที่ที่เลือก
              </p>
            </div>
            <p class="text-sm font-semibold text-primary">
              รวม ฿{{ formatMoney(overviewSevenDayTotal) }}
            </p>
          </div>

          <div
            v-if="overviewPending"
            class="grid h-56 place-items-center text-base-content/50"
          >
            <span class="loading loading-spinner loading-md" />
          </div>
          <div
            v-else
            class="mt-5 grid h-56 grid-cols-7 items-end gap-2 sm:gap-3"
          >
            <div
              v-for="day in overview?.last7Days || []"
              :key="day.sale_date"
              class="flex h-full min-w-0 flex-col justify-end"
            >
              <p
                class="mb-2 truncate text-center text-[10px] font-semibold text-base-content/55 sm:text-xs"
                :title="`฿${formatMoney(day.net_sales)}`"
              >
                {{ formatCompactMoney(day.net_sales) }}
              </p>
              <div
                class="flex min-h-0 flex-1 items-end overflow-hidden rounded-t-lg bg-base-200"
              >
                <div
                  class="w-full rounded-t-lg bg-primary/75 transition-all duration-500"
                  :style="{ height: `${overviewBarHeight(day.net_sales)}%` }"
                />
              </div>
              <p
                class="mt-2 text-center text-[10px] text-base-content/60 sm:text-xs"
              >
                {{ formatDayLabel(day.sale_date) }}
              </p>
            </div>
          </div>
        </article>

        <article class="rounded-xl border border-base-300 p-4">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h2 class="font-bold">สินค้าขายดีประจำวัน</h2>
              <p class="text-sm text-base-content/55">เรียงตามยอดขายสุทธิ</p>
            </div>
            <Icon name="lucide:trophy" size="20" class="text-warning" />
          </div>
          <ol class="mt-3 divide-y divide-base-200">
            <li
              v-for="(product, index) in overview?.topProducts || []"
              :key="`${product.order_item_transaction_product_code}-${index}`"
              class="flex items-center gap-3 py-3"
            >
              <span
                class="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-xs font-bold text-primary"
              >
                {{ (index as number) + 1 }}
              </span>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold">
                  {{ product.order_item_transaction_product_name }}
                </p>
                <p class="text-xs text-base-content/50">
                  ขาย {{ product.quantity }} ชิ้น
                </p>
              </div>
              <p class="text-sm font-bold text-primary">
                ฿{{ formatMoney(product.net_sales) }}
              </p>
            </li>
            <li
              v-if="!(overview?.topProducts || []).length"
              class="grid min-h-48 place-items-center text-sm text-base-content/50"
            >
              ยังไม่มีข้อมูลสินค้าสำหรับวันนี้
            </li>
          </ol>
        </article>
      </div>
    </section>

    <section
      class="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm"
    >
      <div
        class="flex flex-col gap-4 sm:flex-row lg:items-end lg:justify-between"
      >
        <div>
          <h1 class="mt-1 text-xl font-bold md:text-2xl">
            รายงานกำไรจากการขาย
          </h1>
          <p class="mt-1 text-sm text-base-content/60">
            แสดงเฉพาะคำสั่งซื้อที่ปิดงานแล้ว และยึดต้นทุน ณ วันที่ปิดงาน
          </p>
        </div>
        <div class="flex sm:flex-row flex-col gap-3 items-center">
          <div class="join">
            <button
              class="join-item btn btn-sm rounded-l-s, cursor-not-allowed disabled:text-primary"
              disabled
            >
              ตั้งแต่วันที่
            </button>
            <input
              v-model="dateFrom"
              type="date"
              class="join-item input input-sm w-full"
            />
          </div>
          <div class="join">
            <button
              class="join-item btn btn-sm rounded-l-s, cursor-not-allowed disabled:text-primary"
              disabled
            >
              ถึงวันที่
            </button>
            <input
              v-model="dateTo"
              type="date"
              class="join-item input input-sm w-full"
            />
          </div>
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
const overviewDate = ref(today);
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
  data: overview,
  pending: overviewPending,
  error: overviewError,
  refresh: refreshOverview,
} = await useFetch<any>("/api/admin/dashboard", {
  server: false,
  query: { date: overviewDate },
  watch: false,
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

const overviewSummary = computed(() => overview.value?.summary || {});
const overviewProfitMargin = computed(() => {
  const netSales = Number(overviewSummary.value.daily_net_sales || 0);
  const grossProfit = Number(overviewSummary.value.daily_gross_profit || 0);
  return netSales > 0 ? ((grossProfit / netSales) * 100).toFixed(1) : "0.0";
});
const overviewMaxDailySales = computed(() =>
  Math.max(
    1,
    ...(overview.value?.last7Days || []).map((row: any) =>
      Number(row.net_sales || 0),
    ),
  ),
);
const overviewSevenDayTotal = computed(() =>
  (overview.value?.last7Days || []).reduce(
    (sum: number, row: any) => sum + Number(row.net_sales || 0),
    0,
  ),
);

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
const asLocalDate = (value: string) =>
  new Date(`${String(value).slice(0, 10)}T12:00:00+07:00`);
const formatOverviewDate = (value: string) =>
  new Intl.DateTimeFormat("th-TH", {
    dateStyle: "full",
  }).format(asLocalDate(value));
const formatDayLabel = (value: string) =>
  new Intl.DateTimeFormat("th-TH", {
    weekday: "short",
  }).format(asLocalDate(value));
const formatCompactMoney = (value: number | string) =>
  new Intl.NumberFormat("th-TH", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value || 0));
const overviewBarHeight = (value: number | string) =>
  Math.max(3, (Number(value || 0) / overviewMaxDailySales.value) * 100);
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
