<template>
  <div v-if="slides.length" class="relative overflow-hidden">
    <div
      class="flex transition-transform duration-500 ease-in-out"
      :style="{ transform: `translateX(-${currentSlide * 100}%)` }"
    >
      <div
        v-for="promotion in slides"
        :key="promotion.uuid || promotion.id"
        class="w-full shrink-0"
      >
        <div
          class="aspect-[16/6] overflow-hidden rounded-2xl border border-base-300 bg-base-200"
        >
          <img
            v-if="promotionImage(promotion)"
            :src="promotionImage(promotion)"
            :alt="promotion.promotion_name || 'โปรโมชั่น'"
            class="size-full object-cover"
          />
          <img
            v-else
            src="@/assets/images/blank.png"
            alt="ยังไม่มีรูปโปรโมชั่น"
            class="size-full object-contain p-8 opacity-70"
          />
        </div>
      </div>
    </div>

    <button
      class="btn btn-circle btn-sm btn-ghost absolute left-2 top-1/2 -translate-y-1/2 bg-base-100/75 sm:btn-md"
      type="button"
      aria-label="โปรโมชั่นก่อนหน้า"
      :disabled="slides.length <= 1"
      @click="prevSlide"
    >
      ❮
    </button>
    <button
      class="btn btn-circle btn-sm btn-ghost absolute right-2 top-1/2 -translate-y-1/2 bg-base-100/75 sm:btn-md"
      type="button"
      aria-label="โปรโมชั่นถัดไป"
      :disabled="slides.length <= 1"
      @click="nextSlide"
    >
      ❯
    </button>

    <div
      v-if="slides.length > 1"
      class="absolute inset-x-0 bottom-3 flex justify-center gap-2"
    >
      <button
        v-for="(_, index) in slides"
        :key="index"
        type="button"
        class="size-2.5 rounded-full border border-base-content/50 transition"
        :class="currentSlide === index ? 'bg-base-content' : 'bg-base-100/75'"
        :aria-label="`ดูโปรโมชั่นที่ ${index + 1}`"
        @click="goToSlide(index)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    data?: Record<string, any>[];
  }>(),
  {
    data: () => [],
  },
);

const currentSlide = ref(0);
const fetchedPromotions = ref<Record<string, any>[]>([]);
let autoPlayTimer: ReturnType<typeof setInterval> | null = null;

const slides = computed(() =>
  props.data.length ? props.data : fetchedPromotions.value,
);

const loadPromotions = async () => {
  if (props.data.length) return;

  try {
    const response = await $fetch<{ rows?: Record<string, any>[] }>(
      "/api/promotion",
      {
        params: {
          now: true,
          pageSize: 100,
        },
      },
    );
    fetchedPromotions.value = response.rows || [];
  } catch (error) {
    console.error("Unable to load promotions", error);
  }
};

const promotionImage = (promotion: Record<string, any>) => {
  const image = promotion.image_url;
  if (Array.isArray(image)) return image[0] || "";
  if (typeof image !== "string" || !image) return "";

  try {
    const parsed = JSON.parse(image);
    return Array.isArray(parsed) ? parsed[0] || "" : image;
  } catch {
    return image;
  }
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
  void loadPromotions();
  startAutoPlay();
});
onBeforeUnmount(stopAutoPlay);
</script>
