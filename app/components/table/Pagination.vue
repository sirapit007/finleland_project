<template>
  <div
    class="flex min-w-0 justify-end sm:flex-1"
  >
    <div class="flex max-w-full items-center gap-1 overflow-x-auto px-1 py-1">
      <button
        class="btn btn-square btn-xs border-base-content/10 bg-base-100 shadow-sm transition-transform hover:-translate-y-0.5 sm:btn-sm"
        :disabled="props.disabled || pageModel <= 1"
        aria-label="หน้าก่อนหน้า"
        @click="goToPage(pageModel - 1)"
      >
        <Icon name="lucide:chevron-left" size="12" />
      </button>

      <template
        v-for="(value, index) in paginationItems"
        :key="`${value}-${index}`"
      >
        <button
          v-if="value !== '...'"
          class="btn btn-square btn-xs border-base-content/10 bg-base-100 shadow-sm transition-transform hover:-translate-y-0.5 sm:btn-sm"
          :class="{
            'pointer-events-none bg-primary text-primary-content shadow-primary/20':
              pageModel === value,
            'btn-outline': pageModel !== value,
          }"
          :aria-current="pageModel === value ? 'page' : undefined"
          :disabled="props.disabled"
          @click="goToPage(value)"
        >
          {{ value }}
        </button>
        <span
          v-else
          class="btn btn-square btn-xs btn-ghost pointer-events-none sm:btn-sm"
          aria-hidden="true"
        >
          <Icon name="lucide:ellipsis" size="15" />
        </span>
      </template>

      <button
        class="btn btn-square btn-xs border-base-content/10 bg-base-100 shadow-sm transition-transform hover:-translate-y-0.5 sm:btn-sm"
        :disabled="
          props.disabled || pageModel >= totalPages || totalPages === 0
        "
        aria-label="หน้าถัดไป"
        @click="goToPage(pageModel + 1)"
      >
        <Icon name="lucide:chevron-right" size="12" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    page: number;
    data?: {
      totalPages?: number;
    } | null;
    disabled?: boolean;
  }>(),
  {
    data: null,
    disabled: false,
  },
);

const emit = defineEmits<{
  "update:page": [value: number];
}>();

const totalPages = computed(() =>
  Math.max(Number(props.data?.totalPages || 0), 0),
);
const pageModel = computed({
  get: () => props.page,
  set: (value: number) => emit("update:page", value),
});
const paginationItems = computed<(number | "...")[]>(() => {
  if (totalPages.value <= 0) return [];
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

function goToPage(value: number) {
  if (props.disabled || value < 1 || value > totalPages.value) return;
  pageModel.value = value;
}
</script>
