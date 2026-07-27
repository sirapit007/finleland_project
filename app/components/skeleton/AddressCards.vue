<script setup lang="ts">
withDefaults(defineProps<{ count?: number }>(), { count: 3 });
</script>

<template>
  <div
    v-for="item in count"
    :key="item"
    class="rounded-2xl border border-base-300 bg-base-100 p-5"
    aria-hidden="true"
  >
    <div class="flex gap-3">
      <div class="skeleton size-10 shrink-0 rounded-full" />
      <div class="min-w-0 flex-1 space-y-3">
        <div class="skeleton h-4 w-36" />
        <div class="skeleton h-3 w-full" />
        <div class="skeleton h-3 w-4/5" />
        <div class="skeleton h-3 w-28" />
      </div>
    </div>
  </div>
</template>
