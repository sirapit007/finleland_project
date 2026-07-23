<template>
  <div
    class="flex transition-transform duration-500 ease-in-out"
    :style="{
      transform: `translateX(-${currentSlide * 100}%)`,
    }"
  >
    <div
      v-for="(slide, slideIndex) in slides"
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
              <div class="card-body p-0">
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
              </div>
            </NuxtLink>
          </div>
          <p class="text-accent lg:text-lg text-xs font-extrabold">
            {{ item.category_name }}
          </p>
        </div>
      </div>
    </div>
  </div>

  <!-- Prev -->
  <button
    @click="prevSlide"
    class="btn btn-circle lg:btn-lg btn-xs absolute left-0 top-2/5 -translate-y-1/2"
  >
    ❮
  </button>

  <!-- Next -->
  <button
    @click="nextSlide"
    class="btn btn-circle lg:btn-lg btn-xs absolute right-0 top-2/5 -translate-y-1/2"
  >
    ❯
  </button>

  <div class="flex gap-3 justify-center mb-6 mt-3">
    <button
      v-for="(_, index) in slides"
      :key="index"
      @click="currentSlide = index"
      class="w-2.5 h-2.5 rounded-full transition"
      :class="
        currentSlide === index
          ? 'bg-base-content'
          : 'border border-base-content'
      "
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  data: any[];
  gridValue: number;
}>();

const currentSlide = ref(0);

const slides = computed(() => {
  const result = [];

  for (let i = 0; i < props.data.length; i += props.gridValue) {
    result.push(props.data.slice(i, i + props.gridValue));
  }

  return result;
});

const prevSlide = () => {
  currentSlide.value =
    (currentSlide.value - 1 + slides.value.length) % slides.value.length;
};

const nextSlide = () => {
  currentSlide.value = (currentSlide.value + 1) % slides.value.length;
};
</script>
