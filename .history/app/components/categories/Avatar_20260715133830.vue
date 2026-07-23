<template>
  <div class="w-full flex">
    <div
      v-for="item in items"
      :key="item.demo_name"
      class="flex-1 my-2.5 text-center"
    >
      <NuxtLink
        :to="{
          path: '/products',
          query: { category: item.category_name },
        }"
      >
        <div
          class="avatar flex justify-center transition-transform duration-100 ease-in-out hover:scale-105"
          :style="{
            transform: `translateX(-${currentSlide * 100}%)`,
          }"
        >
          <div class="w-24 rounded-full border ring-2 ring-primary">
            <img
              v-if="item.image_url"
              :src="item.image_url"
              class="rounded-2xl bg-base-100 object-contain"
            />
            <img
              v-else
              src="@/assets/images/blank.png"
              class="rounded-2xl bg-base-200 object-contain"
            />
          </div>
        </div>
      </NuxtLink>
      <p class="text-accent text-sm font-extrabold mt-4">
        {{ item.category_name }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  items: any[];
}>();

const currentSlide = ref(0);
</script>
