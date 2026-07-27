<template>
  <AuthBothModal ref="signModal" />

  <div
    v-if="isProductLoading"
    class="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 lg:grid-cols-2 lg:px-8 lg:py-12"
    aria-hidden="true"
  >
    <div class="skeleton h-72 w-full rounded-2xl" />
    <div class="space-y-5 py-4">
      <div class="skeleton h-4 w-2/3" />
      <div class="skeleton h-6 w-28 rounded-full" />
      <div class="skeleton h-10 w-4/5" />
      <div class="skeleton h-7 w-36" />
      <div class="skeleton h-10 w-full" />
      <div class="skeleton h-4 w-44" />
    </div>
  </div>
  <div v-else class="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
    <div class="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <div
          v-if="selectedProductImage"
          class="flex w-full flex-1 flex-col items-center gap-3 lg:items-end"
        >
          <img
            :src="selectedProductImage"
            class="h-56 max-w-full rounded-lg border border-base-300 object-contain sm:h-64 lg:h-75"
          />
          <div
            v-if="productImages.length > 1"
            class="flex max-w-full gap-2 overflow-x-auto pb-1"
          >
            <button
              v-for="image in productImages"
              :key="image"
              type="button"
              class="shrink-0 rounded-lg border bg-base-100 p-1 transition"
              :class="
                selectedProductImage === image
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-base-300 hover:border-primary/50'
              "
              @click="activeProductImage = image"
            >
              <img :src="image" class="size-14 object-contain sm:size-16" />
            </button>
          </div>
        </div>
        <div v-else class="flex w-full flex-1 justify-center lg:justify-end">
          <img
            src="@/assets/images/blank.png"
            class="h-56 max-w-full rounded-lg border border-base-300 object-contain sm:h-64 lg:h-75"
          />
        </div>

        <div class="min-w-0 flex-1 space-y-4 sm:space-y-5 lg:space-y-6">
          <div class="text-xs sm:text-sm lg:text-lg">
            <span class="text-base-content/50"
              ><NuxtLink to="/">หน้าแรก</NuxtLink> /
            </span>
            <span class="text-base-content/50"
              ><NuxtLink to="/products">สินค้าทั้งหมด</NuxtLink> /
            </span>
            {{ base.object.product_name }}
          </div>
          <span class="badge badge-sm font-semibold badge-warning sm:badge-md lg:badge-lg">{{
            base.object.product_category_name
          }}</span>
          <div class="text-2xl font-semibold sm:text-3xl lg:text-4xl">
            {{ base.object.product_name }}
          </div>
          <div v-if="user" class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div class="min-w-0">
              <div class="text-xs sm:text-sm lg:text-base">ราคาต่อหน่วย</div>
              <p
                v-if="hasDiscount"
                class="text-xs text-base-content/45 line-through sm:text-sm"
              >
                ฿{{ formatPrice(originalPrice) }}
              </p>
              <div
                class="text-xl font-bold sm:text-2xl lg:text-2xl"
                :class="hasDiscount ? 'text-error' : 'text-primary'"
              >
                ฿{{ formatPrice(displayPrice) }}
              </div>
              <p
                v-if="hasDiscount && promotionRequirement"
                class="mt-1 flex max-w-xs items-start gap-1 text-[11px] leading-5 text-warning sm:text-xs"
              >
                <Icon
                  name="lucide:circle-info"
                  class="mt-0.5 shrink-0"
                  size="13"
                />
                {{ promotionRequirement }}
              </p>
            </div>
            <div class="flex flex-col gap-2 self-start sm:self-auto">
              <div class="join">
                <button
                  class="btn btn-xs btn-outline btn-primary join-item sm:btn-sm"
                  v-on:click="onReduceQuantity"
                >
                  <Icon name="lucide:minus" />
                </button>
                <input
                  type="number"
                  min="0"
                  class="input input-xs w-11 join-item sm:input-sm sm:w-12"
                  v-model="quantity"
                />
                <button
                  class="btn btn-xs btn-outline btn-primary join-item sm:btn-sm"
                  v-on:click="onIncreaseQuantity"
                >
                  <Icon name="lucide:plus" />
                </button>
              </div>
              <button
                class="btn btn-xs btn-primary sm:btn-sm"
                :disabled="quantity <= 0 || isAdding"
                v-on:click="onAddToCart"
              >
                <Icon
                  :name="
                    isAdding ? 'lucide:loader-circle' : 'lucide:shopping-cart'
                  "
                  :class="isAdding ? 'animate-spin' : ''"
                />
                เพิ่มลงตะกล้า
              </button>
            </div>
          </div>
          <div v-else class="text-sm font-semibold text-primary sm:text-base lg:text-lg cursor-pointer" @click="onSignIn">
            เข้าสู่ระบบเพื่อดูราคา
          </div>
          <hr class="text-base-content/10" />
          <div class="text-sm lg:text-base">
            <span class="font-semibold">รหัสสินค้า: </span
            >{{ base.object.product_code }}
          </div>
        </div>
      </div>
  </div>
  <div
    class="w-full flex flex-col justify-center items-center pt-5 border border-b border-base-content/10"
  >
    <div
      class="mx-auto w-full max-w-7xl px-4 text-base font-semibold text-start sm:px-6 sm:text-lg lg:px-8 lg:text-xl"
    >
      หมวดหมู่ที่เกี่ยวข้อง
    </div>

    <div
      class="relative mx-auto w-full max-w-7xl overflow-hidden px-4 sm:px-6 lg:px-8"
    >
      <div v-if="isRelatedLoading" class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <SkeletonProductCards :count="4" />
      </div>
      <CarouselProducts v-else :data="rows.related_categories" />
    </div>
  </div>
  <div
    class="w-full flex flex-col justify-center items-center pt-5 border border-b border-base-content/10"
  >
    <div
      class="mx-auto w-full max-w-7xl px-4 text-base font-semibold text-start sm:px-6 sm:text-lg lg:px-8 lg:text-xl"
    >
      สินค้ามาใหม่
    </div>

    <div
      class="relative mx-auto w-full max-w-7xl overflow-hidden px-4 sm:px-6 lg:px-8"
    >
      <div v-if="isNewProductsLoading" class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <SkeletonProductCards :count="4" />
      </div>
      <CarouselProducts v-else :data="rows.new_products" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { normalizeProductImageUrls } from "~/utils/productImages";
type SignModalHandle = {
  onSignIn: () => void;
};

const signModal = ref<SignModalHandle | null>(null);
const isProductLoading = ref(true);
const isRelatedLoading = ref(true);
const isNewProductsLoading = ref(true);

const route = useRoute();
const base = ref<any>({
  rows: [],
  object: {},
});
const activeProductImage = ref("");
const productImages = computed(() =>
  normalizeProductImageUrls(base.value.object?.image_url),
);
const selectedProductImage = computed(() =>
  productImages.value.includes(activeProductImage.value)
    ? activeProductImage.value
    : productImages.value[0] || "",
);

const rows = ref<any>({
  related_categories: [],
  new_products: [],
});

const quantity = ref<number>(0);

const onReduceQuantity = () => {
  if (quantity.value > 0) {
    quantity.value--;
  }
};

const onIncreaseQuantity = () => {
  quantity.value++;
};

const { addToBasket } = useBasket();
const { showToast } = useToast();
const isAdding = ref(false);

const originalPrice = computed(() =>
  Number(base.value.object.product_selling_price || 0),
);
const promotionPrice = computed(() =>
  Number(
    base.value.object.promotion_discounted_price ||
      base.value.object.promotion_bundle_price ||
      base.value.object.product_discounted_price ||
      base.value.object.sale_price ||
      0,
  ),
);
const hasDiscount = computed(
  () => promotionPrice.value > 0 && promotionPrice.value < originalPrice.value,
);
const displayPrice = computed(() =>
  hasDiscount.value ? promotionPrice.value : originalPrice.value,
);
const formatPrice = (price: number) =>
  new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
const promotionRequirement = computed(() => {
  const requirements: string[] = [];
  const minQuantity = Number(base.value.object.promotion_min_quantity || 0);
  const minPurchaseAmount = Number(
    base.value.object.promotion_min_purchase_amount || 0,
  );

  if (minQuantity > 0) {
    requirements.push(
      `ซื้อขั้นต่ำ ${minQuantity.toLocaleString("th-TH")} ชิ้น`,
    );
  }
  if (minPurchaseAmount > 0) {
    requirements.push(`ยอดซื้อขั้นต่ำ ฿${formatPrice(minPurchaseAmount)}`);
  }

  return requirements.length
    ? `${requirements.join(" หรือ ")} เพื่อรับราคาพิเศษ`
    : "";
});

const onAddToCart = async () => {
  if (isAdding.value || quantity.value <= 0) {
    return;
  }

  isAdding.value = true;

  try {
    await addToBasket(
      { ...base.value.object, product_selling_price: originalPrice.value },
      quantity.value,
    );
    showToast(
      `เพิ่ม ${base.value.object.product_name} ลงตะกร้าแล้ว`,
      "success",
      3500,
      { label: "ดูตะกร้า", to: "/shopping-basket" },
    );
    quantity.value = 0;
  } catch (error) {
    console.error("Unable to add product to basket", error);
    showToast("ไม่สามารถเพิ่มสินค้าในตะกร้าได้", "error");
  } finally {
    isAdding.value = false;
  }
};

const user = ref<any>(null);

onMounted(async () => {
  const stored = localStorage.getItem("web-user");
  user.value = stored ? JSON.parse(stored) : null;

  try {
    const object: any = await $fetch(`/api/products`, {
      params: { product_name: route.params.product },
    });
    base.value.object = object.rows?.[0] || {};
  } finally {
    isProductLoading.value = false;
  }

  await Promise.all([
    (async () => {
      try {
        if (!base.value.object.product_category) return;
        const relatedCategories: any = await $fetch(`/api/products/`, {
          params: { category: base.value.object.product_category },
        });
        rows.value.related_categories = relatedCategories.rows || [];
      } finally {
        isRelatedLoading.value = false;
      }
    })(),
    (async () => {
      try {
        const newProducts: any = await $fetch(`/api/products`, {
          params: { pageSize: 12, orderBy: "base.id DESC" },
        });
        rows.value.new_products = newProducts.rows || [];
      } finally {
        isNewProductsLoading.value = false;
      }
    })(),
  ]);
});

const onSignIn = () => {
  signModal.value?.onSignIn();
};
</script>
