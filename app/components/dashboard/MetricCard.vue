<template>
  <article
    class="dashboard-metric"
    :class="{ 'dashboard-metric--tinted': tinted }"
    :aria-busy="loading"
  >
    <div class="dashboard-metric-heading">
      <h3>{{ label }}</h3>
      <Icon :name="icon" size="23" aria-hidden="true" />
    </div>
    <template v-if="loading">
      <div class="dashboard-metric-value">
        <span
          class="skeleton dashboard-value-skeleton"
          aria-hidden="true"
        /><span class="sr-only">กำลังโหลดข้อมูล</span>
      </div>
      <span class="skeleton dashboard-detail-skeleton" aria-hidden="true" />
    </template>
    <template v-else>
      <p class="dashboard-metric-value">{{ value }}</p>
      <p v-if="detail" class="dashboard-metric-detail">{{ detail }}</p>
    </template>
  </article>
</template>
<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string;
    value: string | number;
    icon: string;
    detail?: string;
    tinted?: boolean;
    loading?: boolean;
  }>(),
  { detail: "", tinted: false, loading: false },
);
</script>
