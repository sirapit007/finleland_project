<script setup lang="ts">
withDefaults(
  defineProps<{ type?: "promotion" | "categories" | "products" }>(),
  { type: "products" },
);
</script>

<template>
  <div v-if="type === 'promotion'" class="skeleton h-44 w-full rounded-2xl sm:h-64" aria-hidden="true" />
  <div v-else-if="type === 'categories'" class="flex gap-5 overflow-hidden py-2" aria-hidden="true">
    <div v-for="item in 8" :key="item" class="w-24 shrink-0 space-y-3 text-center">
      <div class="skeleton mx-auto size-20 rounded-full" />
      <div class="skeleton mx-auto h-3 w-20" />
    </div>
  </div>
  <div v-else class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" aria-hidden="true">
    <SkeletonProductCards :count="4" />
  </div>
</template>
