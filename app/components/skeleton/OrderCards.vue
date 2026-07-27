<script setup lang="ts">
withDefaults(defineProps<{ count?: number }>(), { count: 3 });
</script>

<template>
  <article
    v-for="item in count"
    :key="item"
    class="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm"
    aria-hidden="true"
  >
    <div class="flex items-start justify-between gap-4">
      <div class="space-y-3">
        <div class="skeleton h-5 w-36" />
        <div class="skeleton h-3 w-52" />
      </div>
      <div class="skeleton h-6 w-24 rounded-full" />
    </div>
    <div class="my-5 h-px bg-base-300" />
    <div class="grid gap-4 sm:grid-cols-3">
      <div v-for="cell in 3" :key="cell" class="space-y-2">
        <div class="skeleton h-3 w-20" />
        <div class="skeleton h-5 w-28" />
      </div>
    </div>
    <div class="mt-5 flex justify-end">
      <div class="skeleton h-9 w-28" />
    </div>
  </article>
</template>
