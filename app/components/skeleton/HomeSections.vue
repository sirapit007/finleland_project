<script setup lang="ts">
withDefaults(
  defineProps<{ type?: "promotion" | "categories" | "products" }>(),
  { type: "products" },
);
</script>

<template>
  <div
    v-if="type === 'promotion'"
    class="skeleton h-44 w-full rounded-2xl sm:h-64"
    aria-hidden="true"
  />
  <div
    v-else-if="type === 'categories'"
    class="grid grid-cols-4 gap-1 px-1 pb-7 sm:grid-cols-5 sm:gap-2 sm:px-12 md:grid-cols-6 lg:grid-cols-7 lg:gap-4 xl:grid-cols-8"
    aria-hidden="true"
  >
    <div
      v-for="item in 8"
      :key="item"
      class="my-2.5 min-w-0 px-1 text-center"
      :class="{
        'hidden sm:block': item === 5,
        'hidden md:block': item === 6,
        'hidden lg:block': item === 7,
        'hidden xl:block': item === 8,
      }"
    >
      <div class="skeleton aspect-square w-full rounded-full" />
      <div class="skeleton mx-auto mt-2 h-3 w-3/4" />
    </div>
  </div>
  <div
    v-else
    class="grid grid-cols-3 gap-1 px-1 pb-7 sm:grid-cols-4 sm:gap-2 sm:px-12 md:grid-cols-5 lg:grid-cols-6 lg:gap-4"
    aria-hidden="true"
  >
    <SkeletonProductCards :count="6" carousel />
  </div>
</template>
