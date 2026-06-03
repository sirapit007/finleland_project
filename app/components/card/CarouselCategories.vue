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
      <div :class="`grid grid-cols-${props.gridValue} gap-2 mx-0`">
        <div
          v-for="item in slide"
          :key="item.demo_name"
          class="my-2.5 card card-border bg-base-300 hover:scale-102 hover:bg-base-200 hover:shadow-lg transition"
        >
          <NuxtLink :to="{ path: '/products', query: { owner: item.demo_owner } }">
            <div class="card-body p-0 relative">
              <img
                src="@/assets/images/blank.png"
                class="rounded-lg border border-base-300"
              />

              <p class="text-accent text-lg font-extrabold absolute bottom-2 left-4">
                {{ item.demo_owner }}
              </p>
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>

  <!-- Prev -->
  <button
    @click="prevSlide"
    class="btn btn-xl btn-circle bg-transparent border-transparent absolute left-0 top-1/2 -translate-y-1/2"
  >
    ❮
  </button>

  <!-- Next -->
  <button
    @click="nextSlide"
    class="btn btn-xl btn-circle bg-transparent border-transparent absolute right-0 top-1/2 -translate-y-1/2"
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
