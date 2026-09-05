<template>
  <section class="admin-table-panel" :aria-labelledby="headingId">
    <header class="admin-table-header">
      <h1 :id="headingId">{{ title }}</h1>
      <div v-if="$slots.actions" class="admin-table-header-actions">
        <slot name="actions" />
      </div>
    </header>
    <div class="admin-table-toolbar">
      <TableSearch
        :model-value="q"
        :placeholder="searchPlaceholder"
        :disabled="pending"
        @search="applySearch"
      />
      <div v-if="$slots.filters" class="admin-table-filters">
        <slot name="filters" />
      </div>
    </div>
    <p v-if="notice" role="alert" class="admin-table-notice">{{ notice }}</p>
    <div
      class="admin-table-viewport"
      :aria-busy="pending"
      tabindex="0"
      role="region"
      :aria-label="title"
    >
      <slot />
    </div>
    <footer class="admin-table-footer">
      <TablePageSize
        :page-size="pageSize"
        :disabled="pending"
        @update:page-size="changePageSize"
      />
      <TableResultSummary :page="page" :page-size="pageSize" :data="data" />
      <TablePagination
        class="admin-pagination"
        :page="page"
        :data="data"
        :disabled="pending"
        @update:page="emit('update:page', $event)"
      />
    </footer>
  </section>
</template>
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    title: string;
    q: string;
    page: number;
    pageSize: number;
    data?: { total?: number; totalPages?: number } | null;
    pending?: boolean;
    searchPlaceholder?: string;
    notice?: string;
  }>(),
  { data: null, pending: false, searchPlaceholder: "ค้นหา...", notice: "" },
);
const emit = defineEmits<{
  "update:q": [value: string];
  "update:page": [value: number];
  "update:pageSize": [value: number];
  refresh: [];
}>();
const headingId = useId();
function applySearch(value: string) {
  if (value === props.q && props.page === 1) {
    emit("refresh");
    return;
  }
  emit("update:page", 1);
  emit("update:q", value);
}
function changePageSize(value: number) {
  emit("update:page", 1);
  emit("update:pageSize", value);
}
</script>
