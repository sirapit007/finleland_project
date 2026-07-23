<template>
  <article
    class="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
  >
    <NuxtLink :to="`/products/${props.object.product_name}`" class="block">
      <div class="relative aspect-square overflow-hidden bg-base-200">
        <img
          v-if="imageSrc"
          :src="imageSrc"
          :alt="props.object.product_name || 'สินค้า'"
          class="size-full object-contain p-3 transition duration-300 group-hover:scale-105"
        />
        <img
          v-else
          src="@/assets/images/blank.png"
          alt="ยังไม่มีรูปสินค้า"
          class="size-full object-contain p-5 opacity-70"
        />
        <span
          v-if="hasDiscount"
          class="badge badge-error absolute left-3 top-3 border-0 font-bold text-error-content"
        >
          ลด {{ discountLabel }}
        </span>
      </div>

      <div class="space-y-2 p-4 pb-3">
        <span
          v-if="props.object.product_category_name"
          class="badge badge-sm badge-warning badge-outline max-w-full truncate"
        >
          {{ props.object.product_category_name }}
        </span>
        <h2 class="min-h-12 line-clamp-2 text-sm font-semibold leading-6 text-base-content sm:text-base">
          {{ props.object.product_name }}
        </h2>
        <p v-if="props.object.product_code" class="truncate text-xs text-base-content/50">
          รหัสสินค้า {{ props.object.product_code }}
        </p>
      </div>
    </NuxtLink>

    <div v-if="user" class="mt-auto space-y-3 border-t border-base-300 px-4 pb-4 pt-3">
      <div class="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p v-if="hasDiscount" class="text-xs text-base-content/45 line-through">
            ฿{{ formatPrice(originalPrice) }}
          </p>
          <p class="text-xl font-bold" :class="hasDiscount ? 'text-error' : 'text-primary'">
            ฿{{ formatPrice(displayPrice) }}
          </p>
          <p
            v-if="hasDiscount && promotionRequirement"
            class="mt-1 flex items-start gap-1 text-xs leading-5 text-warning"
          >
            <Icon name="lucide:circle-info" class="mt-0.5 shrink-0" size="13" />
            {{ promotionRequirement }}
          </p>
        </div>
        <div class="join">
          <button class="btn btn-xs join-item" type="button" @click="onReduceQuantity">
            <Icon name="lucide:minus" size="14" />
          </button>
          <input
            v-model.number="quantity"
            type="number"
            min="0"
            class="input input-xs join-item w-11 text-center"
            aria-label="จำนวนสินค้า"
          />
          <button class="btn btn-xs join-item" type="button" @click="onIncreaseQuantity">
            <Icon name="lucide:plus" size="14" />
          </button>
        </div>
      </div>
      <button
        class="btn btn-primary btn-sm w-full"
        type="button"
        :disabled="quantity <= 0 || isAdding"
        @click="onAddToCart"
      >
        <Icon :name="isAdding ? 'lucide:loader-circle' : 'lucide:shopping-cart'" :class="isAdding ? 'animate-spin' : ''" size="16" />
        เพิ่มลงตะกร้า
      </button>
    </div>

    <div v-else class="mt-auto border-t border-base-300 px-4 py-4">
      <p class="text-sm font-semibold text-primary">เข้าสู่ระบบเพื่อดูราคา</p>
    </div>
  </article>
</template>

<script setup lang="ts">
const props = defineProps<{ object: Record<string, any> }>();

const quantity = ref(0);
const isAdding = ref(false);
const user = ref<any>(null);
const { addToBasket } = useBasket();
const { showToast } = useToast();

const imageSrc = computed(() => {
  const image = props.object.image_url;
  if (Array.isArray(image)) return image[0] || "";
  if (typeof image !== "string" || !image) return "";

  try {
    const parsed = JSON.parse(image);
    return Array.isArray(parsed) ? parsed[0] || "" : image;
  } catch {
    return image;
  }
});

const originalPrice = computed(() => Number(props.object.product_selling_price || 0));
const promotionPrice = computed(() =>
  Number(
    props.object.promotion_discounted_price ||
      props.object.promotion_bundle_price ||
      props.object.product_discounted_price ||
      props.object.sale_price ||
      0,
  ),
);
const hasDiscount = computed(() => promotionPrice.value > 0 && promotionPrice.value < originalPrice.value);
const displayPrice = computed(() => (hasDiscount.value ? promotionPrice.value : originalPrice.value));
const discountLabel = computed(() => {
  if (!originalPrice.value || !promotionPrice.value) return "";
  const percent = Math.round(((originalPrice.value - promotionPrice.value) / originalPrice.value) * 100);
  return percent > 0 ? `${percent}%` : "พิเศษ";
});
const promotionRequirement = computed(() => {
  const requirements: string[] = [];
  const minQuantity = Number(props.object.promotion_min_quantity || 0);
  const minPurchaseAmount = Number(props.object.promotion_min_purchase_amount || 0);

  if (minQuantity > 0) {
    requirements.push(`ซื้อขั้นต่ำ ${minQuantity.toLocaleString("th-TH")} ชิ้น`);
  }
  if (minPurchaseAmount > 0) {
    requirements.push(`ยอดซื้อขั้นต่ำ ฿${formatPrice(minPurchaseAmount)}`);
  }

  return requirements.length ? `${requirements.join(" หรือ ")} เพื่อรับราคาพิเศษ` : "";
});

const formatPrice = (price: number) =>
  new Intl.NumberFormat("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price);

const onReduceQuantity = () => {
  quantity.value = Math.max(0, Number(quantity.value || 0) - 1);
};

const onIncreaseQuantity = () => {
  quantity.value = Number(quantity.value || 0) + 1;
};

const onAddToCart = async () => {
  if (isAdding.value || quantity.value <= 0) return;

  isAdding.value = true;
  try {
    await addToBasket({ ...props.object, product_selling_price: originalPrice.value }, quantity.value);
    showToast(`เพิ่ม ${props.object.product_name} ลงตะกร้าแล้ว`, "success", 3500, {
      label: "ดูตะกร้า",
      to: "/shopping-basket",
    });
    quantity.value = 0;
  } catch (error) {
    console.error("Unable to add product to basket", error);
    showToast("ไม่สามารถเพิ่มสินค้าในตะกร้าได้", "error");
  } finally {
    isAdding.value = false;
  }
};

onMounted(() => {
  const stored = localStorage.getItem("web-user");
  user.value = stored ? JSON.parse(stored) : null;
});
</script>
