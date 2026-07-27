<script setup lang="ts">
withDefaults(defineProps<{ count?: number }>(), { count: 8 });
</script>

<template>
  <article
    v-for="item in count"
    :key="item"
    class="overflow-hidden rounded-2xl border border-base-300 bg-base-100"
    aria-hidden="true"
  >
    <div class="skeleton aspect-square w-full rounded-none" />
    <div class="space-y-3 p-4">
      <div class="skeleton h-4 w-20" />
      <div class="skeleton h-4 w-full" />
      <div class="skeleton h-4 w-3/4" />
      <div class="skeleton h-7 w-28" />
      <div class="skeleton h-8 w-full" />
    </div>
  </article>
</template>
