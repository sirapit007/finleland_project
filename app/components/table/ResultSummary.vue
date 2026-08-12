<template>
  <div
    class="min-w-0 flex-1 whitespace-nowrap text-[10px] font-semibold text-base-content/65 sm:text-xs"
    aria-live="polite"
  >
    แสดง {{ rangeStart }} - {{ rangeEnd }} จากทั้งหมด
    <br class="md:hidden block" />
    <span class="text-sm text-primary sm:text-base">{{ total }}</span> รายการ
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    page: number;
    pageSize: number;
    data?: any;
  }>(),
  { data: null },
);

const total = computed(() => Math.max(Number(props.data?.total || 0), 0));
const rangeStart = computed(() =>
  total.value ? (Math.max(props.page, 1) - 1) * props.pageSize + 1 : 0,
);
const rangeEnd = computed(() =>
  Math.min(Math.max(props.page, 1) * props.pageSize, total.value),
);
</script>
