<script setup lang="ts">
withDefaults(defineProps<{ count?: number }>(), { count: 2 });
</script>

<template>
  <div
    v-for="item in count"
    :key="item"
    class="flex items-center gap-4 rounded-2xl border border-base-300 bg-base-100 p-5"
    aria-hidden="true"
  >
    <div class="skeleton size-14 shrink-0 rounded-full" />
    <div class="min-w-0 flex-1 space-y-2">
      <div class="skeleton h-4 w-36" />
      <div class="skeleton h-3 w-52 max-w-full" />
    </div>
    <div class="skeleton h-8 w-20" />
  </div>
</template>
