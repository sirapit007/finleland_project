<template>
  <div
    class="flex transition-transform duration-500 ease-in-out"
    :style="{
      transform: `translateX(-${currentSlide * 100}%)`,
    }"
  >
    <div class="mx-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      <div
        v-for="item in data"
        :key="item.demo_name"
        class="my-2.5 text-center space-y-1.5"
      >
        <NuxtLink
          :to="{
            path: '/products',
            query: { category: item.category_name },
          }"
        >
          <div class="avatar">
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
        <p class="text-accent lg:text-lg text-xs font-extrabold">
          {{ item.category_name }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  data: any[];
}>();

const currentSlide = ref(0);
</script>
