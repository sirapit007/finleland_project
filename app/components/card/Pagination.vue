<template>
  <div class="flex justify-center">
    <div class="join">
      <button
        v-if="pageModel !== 1"
        class="join-item btn btn-sm btn-ghost rounded-none"
        @click="goToPage(pageModel - 1)"
        :disabled="props.disabled"
      >
        <Icon name="lucide:chevron-left" size="18" />
      </button>

      <template
        v-for="(value, index) in paginationItems"
        :key="`${value}-${index}`"
      >
        <button
          v-if="value !== '...'"
          class="join-item btn btn-sm rounded-none"
          :class="{
            'btn-primary pointer-events-none': pageModel === value,
            'btn-ghost': pageModel !== value,
          }"
          :aria-disabled="pageModel === value"
          @click="goToPage(value)"
          :disabled="props.disabled"
        >
          {{ value }}
        </button>
        <button
          v-else
          class="join-item btn btn-sm btn-ghost pointer-events-none"
        >
          ...
        </button>
      </template>

      <button
        v-if="pageModel !== totalPages"
        class="join-item btn btn-sm btn-ghost rounded-none"
        @click="goToPage(pageModel + 1)"
        :disabled="props.disabled"
      >
        <Icon name="lucide:chevron-right" size="18" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  page: number;
  data?: {
    totalPages?: number;
  } | null;
  disabled: boolean;
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

function goToPage(value: number) {
  if (value < 1 || value > totalPages.value) {
    return;
  }

  emit("update:page", value);
}
</script>
