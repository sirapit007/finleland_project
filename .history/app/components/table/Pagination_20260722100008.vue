<template>
  <div
    class="grid gap-3 rounded-2xl border border-base-300 bg-base-100 p-3 shadow-sm sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center sm:p-4"
  >
    <div class="order-2 text-xs font-semibold text-base-content/65 sm:order-1">
      แสดง {{ rangeStart }} - {{ rangeEnd }} จากทั้งหมด
      <span class="text-sm text-primary">{{ dataTotal }}</span> รายการ
    </div>

    <div class="order-1 flex min-w-0 justify-center sm:order-2">
      <div class="flex max-w-full items-center gap-1 overflow-x-auto px-1 py-1">
        <button
          class="btn btn-square btn-xs border-base-content/10 bg-base-100 shadow-sm transition-transform hover:-translate-y-0.5 sm:btn-sm"
          :disabled="props.disabled || pageModel === 1"
          aria-label="Previous page"
          @click="goToPage(pageModel - 1)"
        >
          <Icon name="lucide:chevron-left" size="12" />
        </button>

        <template v-for="(value, index) in paginationItems" :key="`${value}-${index}`">
          <button
            v-if="value !== '...'"
            class="btn btn-square btn-xs border-base-content/10 bg-base-100 shadow-sm transition-transform hover:-translate-y-0.5 sm:btn-sm"
            :class="{
              'btn-outline': pageModel !== value,
            }"
            :aria-disabled="pageModel === value"
            :disabled="props.disabled"
            @click="goToPage(value)"
          >
            {{ value }}
          </button>
          <button
            v-else
            class="btn btn-square btn-xs btn-ghost pointer-events-none sm:btn-sm"
            aria-label="More pages"
          >
            <Icon name="lucide:ellipsis" size="15" />
          </button>
        </template>

        <button
          class="btn btn-square btn-xs border-base-content/10 bg-base-100 shadow-sm transition-transform hover:-translate-y-0.5 sm:btn-sm"
          :disabled="props.disabled || pageModel === totalPages || totalPages === 0"
          aria-label="Next page"
          @click="goToPage(pageModel + 1)"
        >
          <Icon name="lucide:chevron-right" size="12" />
        </button>
      </div>
    </div>

    <div class="order-3 flex items-center justify-between gap-2 sm:justify-end">
      <label class="text-xs font-semibold text-base-content/65" for="table-page-size">
        แสดงต่อหน้า:
      </label>
      <select
        id="table-page-size"
        v-model.number="pageSizeModel"
        class="select select-xs w-20 border-base-content/10 bg-base-200 font-semibold shadow-sm sm:select-sm"
        :disabled="props.disabled"
      >
        <option :value="10">10</option>
        <option :value="20">20</option>
        <option :value="50">50</option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  page: number;
  pageSize: number;
  data?: {
    total?: number;
    totalPages?: number;
  } | null;
  disabled: boolean;
}>();

const emit = defineEmits<{
  "update:page": [value: number];
  "update:pageSize": [value: number];
}>();

const dataTotal = computed(() => props.data?.total ?? 0);
const totalPages = computed(() => props.data?.totalPages ?? 0);
const rangeStart = computed(() =>
  dataTotal.value ? (pageModel.value - 1) * pageSizeModel.value + 1 : 0,
);
const rangeEnd = computed(() =>
  Math.min(pageModel.value * pageSizeModel.value, dataTotal.value),
);
const paginationItems = computed<(number | "...")[]>(() => {
  if (totalPages.value <= 0) {
    return [];
  }

  if (totalPages.value <= 7) {
    return Array.from({ length: totalPages.value }, (_, index) => index + 1);
  }

  if (pageModel.value <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages.value];
  }

  if (pageModel.value >= totalPages.value - 3) {
    return [
      1,
      "...",
      totalPages.value - 4,
      totalPages.value - 3,
      totalPages.value - 2,
      totalPages.value - 1,
      totalPages.value,
    ];
  }

  return [
    1,
    "...",
    pageModel.value - 1,
    pageModel.value,
    pageModel.value + 1,
    "...",
    totalPages.value,
  ];
});

const pageModel = computed({
  get: () => props.page,
  set: (value: number) => emit("update:page", value),
});

const pageSizeModel = computed({
  get: () => props.pageSize,
  set: (value: number) => {
    emit("update:pageSize", value);
    emit("update:page", 1);
  },
});

function goToPage(value: number) {
  if (value < 1 || value > totalPages.value) {
    return;
  }

  emit("update:page", value);
}
</script>
