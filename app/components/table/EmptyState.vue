<template>
  <div class="admin-table-empty" role="status">
    <svg
      width="72"
      height="56"
      viewBox="0 0 72 56"
      fill="none"
      aria-hidden="true"
    >
      <ellipse
        cx="36"
        cy="48"
        rx="30"
        ry="5"
        fill="currentColor"
        opacity=".13"
      />
      <path
        d="M14 26 23 13h26l9 13v19a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4V26Z"
        fill="var(--admin-surface, #fff)"
        stroke="currentColor"
      />
      <path
        d="M14 26h13l3 6h12l3-6h13"
        stroke="currentColor"
        stroke-linejoin="round"
      />
      <path d="M26 19h20" stroke="currentColor" opacity=".4" />
    </svg>
    <span>No data</span>
    <span v-if="filtered" class="admin-table-empty-hint"
      >ไม่พบข้อมูลที่ตรงกับการค้นหา</span
    >
  </div>
</template>
<script setup lang="ts">
withDefaults(defineProps<{ filtered?: boolean }>(), { filtered: false });
</script>
