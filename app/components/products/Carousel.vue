<template>
  <div v-if="slides.length" class="relative overflow-hidden pb-7">
    <div
      class="flex transition-transform duration-500 ease-in-out"
      :style="{ transform: `translateX(-${currentSlide * 100}%)` }"
    >
      <div
        v-for="(slide, slideIndex) in slides"
        :key="slideIndex"
        class="w-full shrink-0"
      >
        <div
          class="grid lg:grid-cols-6 md:grid-cols-5 sm:grid-cols-4 grid-cols-3 lg:gap-4 sm:gap-2 gap-1 px-1 sm:px-12"
        >
          <div v-for="item in slide" :key="item.product_name" class="my-2.5">
            <ProductCard :object="item" />
          </div>
        </div>
      </div>
    </div>

    <button
      type="button"
      class="btn btn-circle btn-sm absolute left-2 top-1/2 z-10 -translate-y-1/2 border-base-300 sm:bg-base-100/85 bg-transparent shadow-md backdrop-blur sm:btn-md"
      :disabled="slides.length <= 1"
      aria-label="สินค้าก่อนหน้า"
      @click="prevSlide"
    >
      <Icon name="lucide:chevron-left" size="20" />
    </button>

    <button
      type="button"
      class="btn btn-circle btn-ghost btn-sm absolute right-2 top-1/2 z-10 -translate-y-1/2 border-base-300 sm:bg-base-100/85 bg-transparent shadow-md backdrop-blur sm:btn-md"
      :disabled="slides.length <= 1"
      aria-label="สินค้าถัดไป"
      @click="nextSlide"
    >
      <Icon name="lucide:chevron-right" size="20" />
    </button>

    <div
      v-if="slides.length > 1"
      class="absolute bottom-1 left-1/2 z-10 flex -translate-x-1/2 gap-2"
    >
      <button
        v-for="(_, index) in slides"
        :key="index"
        type="button"
        class="h-2.5 w-2.5 rounded-full border border-base-content/70 transition"
        :class="currentSlide === index ? 'bg-base-content' : 'bg-base-100/70'"
        :aria-label="`ไปยังหน้าสินค้าที่ ${index + 1}`"
        @click="goToSlide(index)"
      />
    </div>
  </div>
  <SkeletonHomeSections v-if="loading" type="products" />
</template>

<script setup lang="ts">
const props = defineProps<{ category?: string }>();
const currentSlide = ref(0);
const itemsPerSlide = ref(4);
let autoPlayTimer: ReturnType<typeof setInterval> | null = null;

const fetchedProducts = ref<Record<string, any>[]>([]);
const slides = computed(() => {
  const result: Record<string, any>[][] = [];

  for (let i = 0; i < fetchedProducts.value.length; i += itemsPerSlide.value) {
    result.push(fetchedProducts.value.slice(i, i + itemsPerSlide.value));
  }

  return result;
});
const loading = ref(true);

const loadProducts = async () => {
  if (fetchedProducts.value.length) return;

  try {
    const response = await $fetch<{ rows?: Record<string, any>[] }>(
      "/api/products",
      {
        params: { pageSize: 12, orderBy: "base.id DESC", category: props.category },
      },
    );
    fetchedProducts.value = response.rows || [];
  } catch (error) {
    console.error("Unable to load products", error);
  } finally {
    loading.value = false;
  }
};

const prevSlide = () => {
  if (slides.value.length <= 1) return;
  currentSlide.value =
    (currentSlide.value - 1 + slides.value.length) % slides.value.length;
  restartAutoPlay();
};

const nextSlide = () => {
  if (slides.value.length <= 1) return;
  currentSlide.value = (currentSlide.value + 1) % slides.value.length;
  restartAutoPlay();
};

const goToSlide = (index: number) => {
  currentSlide.value = index;
  restartAutoPlay();
};

const stopAutoPlay = () => {
  if (autoPlayTimer) {
    clearInterval(autoPlayTimer);
    autoPlayTimer = null;
  }
};

const startAutoPlay = () => {
  stopAutoPlay();
  if (slides.value.length <= 1) return;

  autoPlayTimer = setInterval(() => {
    currentSlide.value = (currentSlide.value + 1) % slides.value.length;
  }, 10_000);
};

const restartAutoPlay = () => {
  startAutoPlay();
};

const updateItemsPerSlide = () => {
  const nextItemsPerSlide =
    window.innerWidth >= 1024
      ? 6
      : window.innerWidth >= 768
        ? 5
        : window.innerWidth >= 640
          ? 4
          : 3;
  if (nextItemsPerSlide === itemsPerSlide.value) return;

  const firstVisibleItemIndex = currentSlide.value * itemsPerSlide.value;
  itemsPerSlide.value = nextItemsPerSlide;
  currentSlide.value = Math.floor(firstVisibleItemIndex / nextItemsPerSlide);
};

watch(
  () => slides.value.length,
  (length) => {
    if (currentSlide.value >= length) {
      currentSlide.value = Math.max(length - 1, 0);
    }
    startAutoPlay();
  },
);

onMounted(() => {
  updateItemsPerSlide();
  window.addEventListener("resize", updateItemsPerSlide);
  void loadProducts();
  startAutoPlay();
});
onBeforeUnmount(() => {
  stopAutoPlay;
  window.removeEventListener("resize", updateItemsPerSlide);
});
</script>
