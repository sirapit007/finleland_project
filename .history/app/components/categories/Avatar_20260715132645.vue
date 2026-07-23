<template>
  <div
    class="flex transition-transform duration-500 ease-in-out"
    :style="{
      transform: `translateX(-${currentSlide * 100}%)`,
    }"
  >
    <div
      v-for="(slide, slideIndex) in data"
      :key="slideIndex"
      class="w-full shrink-0"
    >
      <div class="mx-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <div
          v-for="item in slide"
          :key="item.demo_name"
          class="my-2.5 text-center space-y-1.5"
        >
          <div
            class="card border border-base-content/20 shadow-sm bg-base-300 hover:scale-105 hover:bg-base-200 hover:shodow-lg transition cursor-pointer"
          >
            <NuxtLink
              :to="{
                path: '/products',
                query: { category: item.category_name },
              }"
            >
              <div class="avatar">
                <div class="w-24 rounded-full">
                  <img
                    src="https://img.daisyui.com/images/profile/demo/yellingcat@192.webp"
                  />
                </div>
              </div>
              <!-- <div class="card-body p-0">
                <img
                  v-if="item.image_url"
                  :src="item.image_url"
                  class="rounded-2xl bg-base-300 border border-base-300 object-cover min-h-[20vh] max-h-[20vh]"
                />
                <img
                  v-else
                  src="@/assets/images/blank.png"
                  class="rounded-2xl border border-base-300 object-contain min-h-[20vh] max-h-[20vh]"
                />
              </div> -->
            </NuxtLink>
          </div>
          <p class="text-accent lg:text-lg text-xs font-extrabold">
            {{ item.category_name }}
          </p>
        </div>
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
