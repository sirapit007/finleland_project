<template>
  <div class="admin-dashboard">
    <section aria-labelledby="overview-heading">
      <header class="dashboard-section-header">
        <div>
          <h1 id="overview-heading">ภาพรวมประจำวัน</h1>
          <p>{{ formatOverviewDate(overviewDate) }}</p>
        </div>
        <form class="dashboard-filters" @submit.prevent="refreshOverview()">
          <label class="dashboard-date-field">
            <span>เลือกวันที่</span>
            <input
              v-model="overviewDate"
              type="date"
              required
              aria-label="วันที่ภาพรวม"
            />
          </label>
          <button
            type="submit"
            class="dashboard-filter-button"
            :disabled="isOverviewLoading"
          >
            <Icon
              :name="
                isOverviewLoading ? 'lucide:loader-circle' : 'lucide:refresh-cw'
              "
              size="16"
              :class="{ 'animate-spin': isOverviewLoading }"
              aria-hidden="true"
            />
            อัปเดตภาพรวม
          </button>
        </form>
      </header>

      <div
        class="dashboard-metric-group dashboard-metric-group--cyan"
        :aria-busy="isOverviewLoading"
      >
        <div class="dashboard-group-heading">
          <h2>ภาพรวมยอดขาย</h2>
          <span>ข้อมูลประจำวันที่เลือก</span>
        </div>
        <div v-if="overviewError" class="dashboard-error" role="alert">
          <Icon name="lucide:cloud-alert" size="22" aria-hidden="true" />
          <p>โหลดภาพรวมไม่สำเร็จ กรุณาลองอัปเดตภาพรวมอีกครั้ง</p>
        </div>
        <div v-else class="dashboard-metric-grid">
          <DashboardMetricCard
            v-for="card in overviewCards"
            :key="card.label"
            v-bind="card"
            :loading="isOverviewLoading"
          />
        </div>
      </div>

      <div v-if="!overviewError" class="dashboard-chart-grid">
        <article class="dashboard-chart-card h-full">
          <header class="dashboard-card-heading">
            <div>
              <h2>ยอดขาย 7 วันล่าสุด</h2>
              <p>สิ้นสุด ณ วันที่ที่เลือก</p>
            </div>
            <span class="dashboard-chart-total"
              >รวม ฿{{ formatMoney(overviewSevenDayTotal) }}</span
            >
          </header>
          <div
            v-if="isOverviewLoading"
            class="dashboard-week-chart"
            aria-hidden="true"
          >
            <div
              v-for="height in [45, 70, 52, 86, 62, 78, 58]"
              :key="height"
              class="skeleton dashboard-chart-skeleton"
              :style="{ height: height + '%' }"
            />
          </div>
          <div v-else class="dashboard-week-chart">
            <div
              v-for="day in overview?.last7Days || []"
              :key="day.sale_date"
              class="dashboard-day-column"
            >
              <p
                class="dashboard-day-value"
                :title="'฿' + formatMoney(day.net_sales)"
              >
                {{ formatCompactMoney(day.net_sales) }}
              </p>
              <div class="dashboard-day-track">
                <div
                  class="dashboard-day-bar"
                  :style="{ height: overviewBarHeight(day.net_sales) + '%' }"
                />
              </div>
              <p class="dashboard-day-label">
                {{ formatDayLabel(day.sale_date) }}
              </p>
            </div>
          </div>
        </article>

        <article class="dashboard-chart-card">
          <header class="dashboard-card-heading">
            <div>
              <h2>สินค้าขายดีประจำวัน</h2>
              <p>เรียงตามยอดขายสุทธิ</p>
            </div>
            <Icon name="lucide:trophy" size="22" aria-hidden="true" />
          </header>
          <div
            v-if="isOverviewLoading"
            class="dashboard-list-skeleton"
            aria-hidden="true"
          >
            <div v-for="item in 4" :key="item" class="skeleton h-10 w-full" />
          </div>
          <ol
            v-else-if="overview?.topProducts?.length"
            class="dashboard-ranking"
          >
            <li
              v-for="(product, index) in overview.topProducts"
              :key="product.order_item_transaction_product_code + '-' + index"
            >
              <span class="dashboard-rank">{{ Number(index) + 1 }}</span>
              <div class="dashboard-product-name">
                <p :title="product.order_item_transaction_product_name">
                  {{ product.order_item_transaction_product_name }}
                </p>
                <span>ขาย {{ product.quantity }} ชิ้น</span>
              </div>
              <span class="dashboard-product-sales"
                >฿{{ formatMoney(product.net_sales) }}</span
              >
            </li>
          </ol>
          <TableEmptyState v-else />
        </article>
      </div>
    </section>

    <section aria-labelledby="report-heading">
      <header class="dashboard-section-header">
        <div>
          <h2 id="report-heading">รายงานกำไรจากการขาย</h2>
          <p>คำสั่งซื้อที่ปิดงานแล้ว คำนวณจากต้นทุน ณ วันที่ปิดงาน</p>
        </div>
        <form class="dashboard-filters" @submit.prevent="refreshReport()">
          <label class="dashboard-date-field">
            <span>ตั้งแต่วันที่</span>
            <input
              v-model="dateFrom"
              type="date"
              required
              :max="dateTo || undefined"
              aria-label="รายงานตั้งแต่วันที่"
            />
          </label>
          <label class="dashboard-date-field">
            <span>ถึงวันที่</span>
            <input
              v-model="dateTo"
              type="date"
              required
              :min="dateFrom || undefined"
              aria-label="รายงานถึงวันที่"
            />
          </label>
          <button
            type="submit"
            class="dashboard-filter-button"
            :disabled="isReportLoading"
          >
            <Icon
              :name="isReportLoading ? 'lucide:loader-circle' : 'lucide:filter'"
              size="16"
              :class="{ 'animate-spin': isReportLoading }"
              aria-hidden="true"
            />
            กรองรายงาน
          </button>
        </form>
      </header>

      <div
        class="dashboard-metric-group dashboard-metric-group--blue"
        :aria-busy="isReportLoading"
      >
        <div class="dashboard-group-heading">
          <h2>ผลประกอบการ</h2>
          <span>สรุปตามช่วงวันที่เลือก</span>
        </div>
        <div v-if="reportError" class="dashboard-error" role="alert">
          <Icon name="lucide:cloud-alert" size="22" aria-hidden="true" />
          <p>โหลดรายงานไม่สำเร็จ กรุณาลองกรองรายงานอีกครั้ง</p>
        </div>
        <div v-else class="dashboard-metric-grid">
          <DashboardMetricCard
            v-for="card in reportCards"
            :key="card.label"
            v-bind="card"
            :loading="isReportLoading"
          />
        </div>
      </div>

      <div v-if="!reportError" class="dashboard-chart-grid">
        <article class="dashboard-chart-card">
          <header class="dashboard-card-heading">
            <div>
              <h2>ยอดขายรายวัน</h2>
              <p>สูงสุด 31 วันล่าสุดในช่วงที่เลือก</p>
            </div>
            <Icon
              name="lucide:chart-no-axes-combined"
              size="22"
              aria-hidden="true"
            />
          </header>
          <div
            v-if="isReportLoading"
            class="dashboard-list-skeleton"
            aria-hidden="true"
          >
            <div v-for="item in 7" :key="item" class="skeleton h-5 w-full" />
          </div>
          <div v-else-if="report?.byDay?.length" class="dashboard-sales-list">
            <div
              v-for="day in report.byDay"
              :key="day.sale_date"
              class="dashboard-sales-row"
            >
              <span>{{ formatShortDate(day.sale_date) }}</span>
              <div class="dashboard-sales-track">
                <div :style="{ width: salesBarWidth(day.net_sales) + '%' }" />
              </div>
              <span class="dashboard-product-sales"
                >฿{{ formatMoney(day.net_sales) }}</span
              >
            </div>
          </div>
          <TableEmptyState v-else />
        </article>

        <article class="dashboard-chart-card">
          <header class="dashboard-card-heading">
            <div>
              <h2>สินค้าขายดี</h2>
              <p>จัดอันดับตามยอดขายสุทธิ</p>
            </div>
            <Icon name="lucide:trophy" size="22" aria-hidden="true" />
          </header>
          <div
            v-if="isReportLoading"
            class="dashboard-list-skeleton"
            aria-hidden="true"
          >
            <div v-for="item in 4" :key="item" class="skeleton h-10 w-full" />
          </div>
          <ol v-else-if="report?.topProducts?.length" class="dashboard-ranking">
            <li
              v-for="(product, index) in report.topProducts"
              :key="product.order_item_transaction_product_code + '-' + index"
            >
              <span class="dashboard-rank">{{ Number(index) + 1 }}</span>
              <div class="dashboard-product-name">
                <p :title="product.order_item_transaction_product_name">
                  {{ product.order_item_transaction_product_name }}
                </p>
                <span
                  >{{ product.quantity }} ชิ้น · กำไร ฿{{
                    formatMoney(product.gross_profit)
                  }}</span
                >
              </div>
              <span class="dashboard-product-sales"
                >฿{{ formatMoney(product.net_sales) }}</span
              >
            </li>
          </ol>
          <TableEmptyState v-else />
        </article>
      </div>
    </section>

    <section class="dashboard-system-section" aria-labelledby="system-heading">
      <header class="dashboard-section-header">
        <div>
          <h2 id="system-heading">ข้อมูลระบบ</h2>
          <p>จำนวนรายการทั้งหมดในระบบของคุณ</p>
        </div>
      </header>
      <div
        v-if="totalsError"
        class="dashboard-error dashboard-error--plain"
        role="alert"
      >
        <Icon name="lucide:cloud-alert" size="22" aria-hidden="true" />
        <p>{{ totalsError }}</p>
        <button
          type="button"
          class="dashboard-filter-button"
          @click="loadTotals()"
        >
          ลองใหม่
        </button>
      </div>
      <div v-else class="dashboard-system-grid">
        <DashboardMetricCard
          v-for="card in systemCards"
          :key="card.label"
          v-bind="card"
          :loading="isTotalsLoading"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import "~/assets/css/admin-dashboard.css";
import { useDayjs } from "~~/composables/useDayjs";

definePageMeta({ layout: "admin" });

const dayjs = useDayjs();
const today = dayjs().format("YYYY-MM-DD");
const overviewDate = ref(today);
const dateFrom = ref(dayjs().startOf("month").format("YYYY-MM-DD"));
const dateTo = ref(today);
const isTotalsLoading = ref(true);
const totalsError = ref("");
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
} = useFetch<any>("/api/admin/dashboard", {
  server: false,
  immediate: false,
  query: { date: overviewDate },
  watch: false,
});

const {
  data: report,
  pending: reportPending,
  error: reportError,
  refresh: refreshReport,
} = useFetch<any>("/api/order/item-transactions", {
  server: false,
  immediate: false,
  query: { dateFrom, dateTo },
  watch: false,
});

const isOverviewLoading = computed(
  () => overviewPending.value || (!overview.value && !overviewError.value),
);
const isReportLoading = computed(
  () => reportPending.value || (!report.value && !reportError.value),
);

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
const formatOverviewDate = (value: string) => {
  const date = asLocalDate(value);
  return Number.isNaN(date.getTime())
    ? "เลือกวันที่เพื่อดูภาพรวม"
    : new Intl.DateTimeFormat("th-TH", { dateStyle: "full" }).format(date);
};
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

async function loadTotals() {
  isTotalsLoading.value = true;
  totalsError.value = "";
  try {
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
  } catch {
    totalsError.value = "โหลดข้อมูลระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
  } finally {
    isTotalsLoading.value = false;
  }
}

onMounted(() => {
  void refreshOverview();
  void refreshReport();
  void loadTotals();
});

const overviewCards = computed(() => [
  {
    label: "ยอดขายประจำวัน",
    value: "฿" + formatMoney(overviewSummary.value.daily_net_sales),
    icon: "lucide:badge-dollar-sign",
    detail:
      "จาก " +
      Number(overviewSummary.value.daily_completed_order_count || 0) +
      " ออเดอร์ที่ปิดงาน",
    tinted: true,
  },
  {
    label: "ยอดขายเดือนนี้",
    value: "฿" + formatMoney(overviewSummary.value.monthly_net_sales),
    icon: "lucide:calendar-range",
    detail: "ยอดรวมของเดือนที่เลือก",
    tinted: true,
  },
  {
    label: "ออเดอร์ประจำวัน",
    value: Number(overviewSummary.value.order_count || 0),
    icon: "lucide:package-check",
    detail:
      "รอดำเนินการ " +
      Number(overviewSummary.value.active_order_count || 0) +
      " รายการ",
    tinted: true,
  },
  {
    label: "กำไรโดยประมาณ",
    value: "฿" + formatMoney(overviewSummary.value.daily_gross_profit),
    icon: "lucide:trending-up",
    detail: "อัตรากำไร " + overviewProfitMargin.value + "%",
  },
]);
const reportCards = computed(() => [
  {
    label: "ยอดขายสุทธิ",
    value: "฿" + formatMoney(reportSummary.value.net_sales),
    icon: "lucide:wallet",
    detail: "ก่อนหักต้นทุน",
  },
  {
    label: "ต้นทุนสินค้า",
    value: "฿" + formatMoney(reportSummary.value.total_cost),
    icon: "lucide:package",
    detail: "ต้นทุน ณ วันที่ปิดคำสั่งซื้อ",
  },
  {
    label: "กำไรขั้นต้น",
    value: "฿" + formatMoney(reportSummary.value.gross_profit),
    icon: "lucide:chart-no-axes-combined",
    detail: profitMargin.value + "% ของยอดขายสุทธิ",
    tinted: true,
  },
  {
    label: "คำสั่งซื้อที่ปิดงาน",
    value: Number(reportSummary.value.order_count || 0),
    icon: "lucide:clipboard-check",
    detail:
      Number(reportSummary.value.quantity || 0) +
      " ชิ้น / " +
      Number(reportSummary.value.item_line_count || 0) +
      " รายการ",
    tinted: true,
  },
]);
const systemCards = computed(() => [
  {
    label: "ผู้ใช้งานระบบ",
    value: total.value.users,
    icon: "lucide:users-round",
  },
  {
    label: "รายการสินค้า",
    value: total.value.products,
    icon: "lucide:package",
  },
  { label: "หมวดหมู่", value: total.value.categories, icon: "lucide:tags" },
  {
    label: "ผู้จัดจำหน่าย",
    value: total.value.suppliers,
    icon: "lucide:truck",
  },
  {
    label: "ประเภทโปรโมชั่น",
    value: total.value.types,
    icon: "lucide:badge-percent",
  },
  {
    label: "โปรโมชั่นที่ใช้งาน",
    value: total.value.promotion,
    icon: "lucide:gift",
  },
]);
</script>
