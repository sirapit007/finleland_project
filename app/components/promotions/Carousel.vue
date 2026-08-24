<template>
  <div
    v-if="slides.length"
    class="relative overflow-hidden"
    @mouseenter="stopAutoPlay"
    @mouseleave="startAutoPlay"
    @focusin="stopAutoPlay"
    @focusout="startAutoPlay"
  >
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
          class="grid items-stretch gap-4"
          :class="
            promotion.product
              ? 'lg:grid-cols-[minmax(0,1fr)_minmax(10rem,13rem)] sm:grid-cols-[minmax(0,1fr)_minmax(8rem,11rem)] grid-cols-1'
              : ''
          "
        >
          <div
            class="relative flex min-w-0 items-center justify-center overflow-hidden rounded-2xl border border-base-300 bg-base-100"
            :class="
              promotion.product
                ? 'h-[200px] sm:h-[300px] md:h-auto md:min-h-[30rem]'
                : 'h-[200px] sm:h-[300px] lg:h-[500px]'
            "
          >
            <img
              v-if="promotionImage(promotion)"
              :src="promotionImage(promotion)"
              :alt="promotion.promotion_name || 'โปรโมชั่น'"
              class="block h-auto max-h-full w-auto max-w-full object-contain"
            />
            <img
              v-else
              src="@/assets/images/blank.png"
              alt="ยังไม่มีรูปโปรโมชั่น"
              class="size-full object-contain p-8 opacity-70"
            />

            <button
              v-if="slides.length > 1"
              class="btn btn-circle btn-sm btn-ghost absolute left-2 top-1/2 -translate-y-1/2 bg-base-100/75 sm:btn-md"
              type="button"
              aria-label="โปรโมชั่นก่อนหน้า"
              @click="prevSlide"
            >
              ❮
            </button>
            <button
              v-if="slides.length > 1"
              class="btn btn-circle btn-sm btn-ghost absolute right-2 top-1/2 -translate-y-1/2 bg-base-100/75 sm:btn-md"
              type="button"
              aria-label="โปรโมชั่นถัดไป"
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
                :class="
                  currentSlide === index ? 'bg-base-content' : 'bg-base-100/75'
                "
                :aria-label="`ดูโปรโมชั่นที่ ${index + 1}`"
                @click="goToSlide(index)"
              />
            </div>
          </div>

          <div class="sm:w-full w-40">
            <ProductCard
            v-if="promotion.product"
            :object="promotion.product"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
  <SkeletonHomeSections v-if="loading" type="promotion" />
</template>
<script setup lang="ts">
const currentSlide = ref(0);
let autoPlayTimer: ReturnType<typeof setInterval> | null = null;

type PromotionSlide = Record<string, any> & {
  product: Record<string, any> | null;
};

const fetchedPromotions = ref<PromotionSlide[]>([]);
const slides = computed(() => fetchedPromotions.value);
const loading = ref(true);

const loadPromotionProduct = async (promotion: Record<string, any>) => {
  const productUuid = String(promotion.promotion_product || "").trim();
  if (!productUuid) return null;

  try {
    const response = await $fetch<{ rows?: Record<string, any>[] }>(
      "/api/products",
      {
        params: {
          uuid: productUuid,
          pageSize: 1,
        },
      },
    );
    const product = response.rows?.[0];
    if (!product) return null;

    return {
      ...product,
      promotion_uuid: promotion.uuid,
      promotion_name: promotion.promotion_name,
      promotion_discounted_price: promotion.promotion_discounted_price,
      promotion_bundle_price: promotion.promotion_bundle_price,
      promotion_min_quantity: promotion.promotion_min_quantity,
      promotion_min_purchase_amount: promotion.promotion_min_purchase_amount,
    };
  } catch (error) {
    console.error(
      `Unable to load product for promotion ${promotion.uuid || ""}`,
      error,
    );
    return null;
  }
};

const loadPromotions = async () => {
  if (fetchedPromotions.value.length) return;
  try {
    const response = await $fetch<{ rows?: Record<string, any>[] }>(
      "/api/promotion",
      {
        params: {
          now: true,
        },
      },
    );
    const promotions = response.rows || [];

    fetchedPromotions.value = await Promise.all(
      promotions.map(async (promotion) => ({
        ...promotion,
        product: await loadPromotionProduct(promotion),
      })),
    );
  } catch (error) {
    console.error("Unable to load promotions", error);
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
