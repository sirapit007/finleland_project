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
      <div
        class="grid gap-4 sm:mx-12 lg:grid-cols-4 md:grid-cols-4 sm:grid-cols-2 grid-cols-2"
      >
        <div v-for="item in slide" :key="item.product_name" class="my-2.5">
          <CardTemplate :object="item" />
        </div>
      </div>
    </div>
  </div>

  <!-- Prev -->
  <button
    @click="prevSlide"
    class="btn btn-circle btn-sm btn-ghost absolute left-0 top-1/2 -translate-y-1/2 sm:btn-md"
  >
    ❮
  </button>

  <!-- Next -->
  <button
    @click="nextSlide"
    class="btn btn-circle btn-sm btn-ghost absolute right-0 top-1/2 -translate-y-1/2 sm:btn-md"
  >
    ❯
  </button>

  <div class="flex gap-3 justify-center">
    <button
      v-for="(_, index) in slides"
      :key="index"
      @click="currentSlide = index"
      class="w-2 h-2 rounded-full transition"
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
  // gridValue: number;
  deals?: true;
}>();

const currentSlide = ref(0);

const slides = computed(() => {
  const result = [];

  for (let i = 0; i < props.data.length; i += 4) {
    result.push(props.data.slice(i, i + 4));
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
