<template>
  <div class="flex justify-between">
    <div class="join">
      <button class="join-item btn sm:btn-sm btn-xs pointer-events-none">Page Size</button>
      <select
        class="join-item select sm:select-sm select-xs w-fit"
        v-model.number="pageSizeModel"
      >
        <option :value="10">10</option>
        <option :value="20">20</option>
        <option :value="50">50</option>
      </select>
    </div>

    <div class="join">
      <button
        class="join-item btn sm:btn-sm btn-xs"
        :disabled="pageModel === 1"
        @click="goToPage(pageModel - 1)"
      >
        Prev
      </button>

      <template v-for="(value, index) in paginationItems" :key="`${value}-${index}`">
        <button
          v-if="value !== '...'"
          class="join-item btn sm:btn-sm btn-xs"
          :class="{ 'btn-primary pointer-events-none': pageModel === value }"
          :aria-disabled="pageModel === value"
          @click="goToPage(value)"
        >
          {{ value }}
        </button>
        <button v-else class="join-item btn sm:btn-sm btn-xs pointer-events-none">
          ...
        </button>
      </template>

      <button
        class="join-item btn sm:btn-sm btn-xs"
        :disabled="pageModel === totalPages"
        @click="goToPage(pageModel + 1)"
      >
        Next
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  page: number;
  pageSize: number;
  data?: {
    totalPages?: number;
  } | null;
}>();

const emit = defineEmits<{
  "update:page": [value: number];
  "update:pageSize": [value: number];
}>();

const totalPages = computed(() => props.data?.totalPages ?? 0);
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
