<template>
  <button
    type="button"
    class="admin-table-action"
    :class="'admin-table-action--' + tone"
    :aria-label="label"
    :title="label"
  >
    <Icon :name="icon" size="16" aria-hidden="true" />
  </button>
</template>
<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string;
    icon: string;
    tone?: "primary" | "danger" | "success";
  }>(),
  { tone: "primary" },
);
</script>
