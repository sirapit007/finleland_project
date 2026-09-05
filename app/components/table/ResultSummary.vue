<template>
  <div class="admin-table-result-summary" aria-live="polite">
    {{ rangeStart }}–{{ rangeEnd }} จาก {{ total }} รายการ
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
