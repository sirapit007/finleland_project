<template>
  <div class="flex justify-center">
    <div class="flex flex-rows gap-8 space-y-4 py-12">
      <div
        v-if="base.object.image_url"
        class="flex flex-1 justify-center space-y-4 lg:justify-end"
      >
        <img
          :src="base.object.image_url"
          class="h-75 max-w-full rounded-lg border border-base-300 object-contain"
        />
      </div>
      <div v-else class="flex flex-1 justify-center space-y-4 lg:justify-end">
        <img
          src="@/assets/images/blank.png"
          class="h-75 max-w-full rounded-lg border border-base-300 object-contain"
        />
      </div>

      <div class="flex-1 space-y-6">
        <div class="text-lg">
          <span class="text-base-content/50"
            ><NuxtLink to="/">หน้าแรก</NuxtLink> /
          </span>
          <span class="text-base-content/50"
            ><NuxtLink to="/products">สินค้าทั้งหมด</NuxtLink> /
          </span>
          {{ base.object.product_name }}
        </div>
        <span class="badge badge-lg font-semibold badge-warning">{{
          base.object.product_category_name
        }}</span>
        <div class="text-4xl">
          {{ base.object.product_name }}
        </div>
        <div v-if="user" class="flex gap-2 items-center justify-between">
          <div class="min-w-0">
            <div>ราคาต่อหน่วย</div>
            <p v-if="hasDiscount" class="text-sm text-base-content/45 line-through">
              ฿{{ formatPrice(originalPrice) }}
            </p>
            <div
              class="font-bold text-2xl"
              :class="hasDiscount ? 'text-error' : 'text-primary'"
            >
              ฿{{ formatPrice(displayPrice) }}
            </div>
            <p
              v-if="hasDiscount && promotionRequirement"
              class="mt-1 flex max-w-xs items-start gap-1 text-xs leading-5 text-warning"
            >
              <Icon name="lucide:circle-info" class="mt-0.5 shrink-0" size="13" />
              {{ promotionRequirement }}
            </p>
          </div>
          <div class="join">
            <button
              class="btn btn-sm btn-outline btn-primary join-item"
              v-on:click="onReduceQuantity"
            >
              <Icon name="lucide:minus" />
            </button>
            <input
              type="number"
              min="0"
              class="input input-sm w-12 join-item"
              v-model="quantity"
            />
            <button
              class="btn btn-sm btn-outline btn-primary join-item"
              v-on:click="onIncreaseQuantity"
            >
              <Icon name="lucide:plus" />
            </button>
          </div>
          <button
            class="btn btn-sm btn-primary"
            :disabled="quantity <= 0 || isAdding"
            v-on:click="onAddToCart"
          >
            <Icon
              :name="isAdding ? 'lucide:loader-circle' : 'lucide:shopping-cart'"
              :class="isAdding ? 'animate-spin' : ''"
            /> เพิ่มลงตะกล้า
          </button>
        </div>
        <div v-else class="text-lg text-primary font-semibold">
          เข้าสู่ระบบเพื่อดูราคา
        </div>
        <hr class="text-base-content/10" />
        <div class="text-base">
          <span class="font-semibold">รหัสสินค้า: </span
          >{{ base.object.product_code }}
        </div>
      </div>
    </div>
  </div>
  <div
    class="w-full flex flex-col justify-center items-center pt-5 border border-b border-base-content/10"
  >
    <div class="mx-auto w-full max-w-7xl px-0 sm:px-6 lg:px-8 text-xl text-start font-semibold">
      หมวดหมู่ที่เกี่ยวข้อง
    </div>

    <div class="mx-auto w-full max-w-7xl px-0 sm:px-6 lg:px-8 relative overflow-hidden">
      <CardCarouselProducts :data="rows.related_categories" />
    </div>
  </div>
  <div
    class="w-full flex flex-col justify-center items-center pt-5 border border-b border-base-content/10"
  >
    <div class="mx-auto w-full max-w-7xl px-0 sm:px-6 lg:px-8 text-xl text-start font-semibold">สินค้ามาใหม่</div>

    <div class="mx-auto w-full max-w-7xl px-0 sm:px-6 lg:px-8 relative overflow-hidden">
      <CardCarouselProducts :data="rows.new_products" />
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const base = ref<any>({
  rows: [],
  object: {},
});

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

const originalPrice = computed(() => Number(base.value.object.product_selling_price || 0));
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
    requirements.push(`ซื้อขั้นต่ำ ${minQuantity.toLocaleString("th-TH")} ชิ้น`);
  }
  if (minPurchaseAmount > 0) {
    requirements.push(`ยอดซื้อขั้นต่ำ ฿${formatPrice(minPurchaseAmount)}`);
  }

  return requirements.length ? `${requirements.join(" หรือ ")} เพื่อรับราคาพิเศษ` : "";
});

const onAddToCart = async () => {
  if (isAdding.value || quantity.value <= 0) {
    return;
  }

  isAdding.value = true;

  try {
    await addToBasket(
      { ...base.value.object, product_selling_price: displayPrice.value },
      quantity.value,
    );
    showToast(`เพิ่ม ${base.value.object.product_name} ลงตะกร้าแล้ว`);
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

  const object: any = await $fetch(`/api/products`, {
    params: { product_name: route.params.product },
  });
  object.rows = object.rows.map((item: any) => ({
    ...item,
    image_url: item.image_url ? JSON.parse(item.image_url) : [],
  }));
  base.value.object = object.rows[0];

  const relatedCategories: any = await $fetch(`/api/products/`, {
    params: { category: base.value.object.product_category },
  });
  relatedCategories.rows = relatedCategories.rows.map((item: any) => ({
    ...item,
    image_url: item.image_url ? JSON.parse(item.image_url) : [],
  }));
  rows.value.related_categories = relatedCategories.rows;

  const newProducts: any = await $fetch(`/api/products`, {
    params: { pageSize: 12, orderBy: "product.created_at DESC" },
  });
  newProducts.rows = newProducts.rows.map((item: any) => ({
    ...item,
    image_url: item.image_url ? JSON.parse(item.image_url) : [],
  }));
  rows.value.new_products = newProducts.rows;
});
</script>
