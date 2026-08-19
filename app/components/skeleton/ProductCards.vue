<script setup lang="ts">
const props = withDefaults(
  defineProps<{ count?: number; carousel?: boolean }>(),
  { count: 8, carousel: false },
);

const carouselItemClass = (item: number) => {
  if (!props.carousel) return "";
  if (item === 4) return "max-sm:hidden";
  if (item === 5) return "max-md:hidden";
  if (item === 6) return "max-lg:hidden";
  return item > 6 ? "hidden" : "";
};
</script>

<template>
  <article
    v-for="item in count"
    :key="item"
    class="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm"
    :class="carouselItemClass(item)"
    aria-hidden="true"
  >
    <div class="skeleton aspect-square w-full rounded-none bg-base-200" />

    <div class="space-y-2 p-3 sm:p-4 sm:pb-3">
      <div class="skeleton h-5 w-16 rounded-full sm:h-6 sm:w-20" />
      <div class="skeleton h-4 w-20 rounded-full" />
      <div class="min-h-10 space-y-2 sm:min-h-12">
        <div class="skeleton h-3.5 w-full sm:h-4" />
        <div class="skeleton h-3.5 w-3/4 sm:h-4" />
      </div>
      <div class="skeleton hidden h-3 w-24 sm:block" />
      <div class="skeleton h-5 w-20 sm:hidden" />
    </div>

    <div
      class="mt-auto hidden space-y-3 border-t border-base-300 px-4 pb-4 pt-3 sm:block"
    >
      <div class="skeleton h-6 w-24" />
      <div class="skeleton hidden h-8 w-full md:block" />
    </div>
  </article>
</template>
