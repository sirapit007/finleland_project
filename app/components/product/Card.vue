<template>
  <article
    class="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
  >
    <button
      type="button"
      class="block w-full text-left sm:hidden"
      :aria-label="`ดูรายละเอียด ${props.object.product_name || 'สินค้า'}`"
      @click="openMobileSheet"
    >
      <div class="relative aspect-square overflow-hidden bg-base-200">
        <img
          v-if="imageSrc"
          :src="imageSrc"
          :alt="props.object.product_name || 'สินค้า'"
          class="size-full object-contain transition duration-300"
        />
        <img
          v-else
          src="@/assets/images/blank.png"
          alt="ยังไม่มีรูปสินค้า"
          class="size-full object-contain opacity-70"
        />
        <span
          v-if="user && hasDiscount"
          class="badge badge-error absolute left-2 top-2 border-0 text-xs font-bold text-error-content"
        >
          ลด {{ discountLabel }}
        </span>
        <span
          v-if="ranking"
          class="badge badge-success absolute right-2 top-2 border-0 text-xs font-bold text-error-content"
        >
          #{{ ranking }}
        </span>
      </div>

      <div class="space-y-2 p-3">
        <span
          v-if="props.object.product_category_name"
          class="badge sm:badge-md badge-sm badge-warning max-w-full truncate"
        >
          {{ props.object.product_category_name }}
        </span>
        <div class="flex flex-wrap flex-row gap-2">
          <span
            v-for="subcategory in props.object.product_subcategories"
            :key="subcategory.uuid"
            class="badge sm:badge-sm badge-xs badge-info"
          >
            {{ subcategory.subcategory_name }}
          </span>
        </div>
        <h2
          class="line-clamp-2 min-h-10 sm:text-base text-sm font-semibold leading-5"
        >
          {{ props.object.product_name }}
        </h2>
        <p
          v-if="props.object.product_code"
          class="truncate text-[11px] text-base-content/50"
        >
          รหัสสินค้า {{ props.object.product_code }}
        </p>
        <div v-if="user" class="pt-1">
          <p
            v-if="hasDiscount"
            class="text-[11px] text-base-content/45 line-through"
          >
            ฿{{ formatPrice(originalPrice) }}
          </p>
          <p
            class="text-base font-bold"
            :class="hasDiscount ? 'text-error' : 'text-primary'"
          >
            ฿{{ formatPrice(displayPrice) }}
          </p>
        </div>
        <p v-else class="pt-1 text-xs font-semibold text-primary">
          แตะเพื่อดูรายละเอียดสินค้า
        </p>
      </div>
    </button>

    <NuxtLink
      :to="`/products/${props.object.product_name}`"
      class="sm:block hidden"
    >
      <div class="relative aspect-square overflow-hidden bg-base-200">
        <img
          v-if="imageSrc"
          :src="imageSrc"
          :alt="props.object.product_name || 'สินค้า'"
          class="size-full object-contain p-0 transition duration-300 group-hover:scale-105"
        />
        <img
          v-else
          src="@/assets/images/blank.png"
          alt="ยังไม่มีรูปสินค้า"
          class="size-full object-contain opacity-70"
        />
        <span
          v-if="user && hasDiscount"
          class="badge badge-error absolute left-3 top-3 border-0 font-bold text-error-content"
        >
          ลด {{ discountLabel }}
        </span>
      </div>

      <div class="space-y-2 p-4 pb-3">
        <span
          v-if="props.object.product_category_name"
          class="badge sm:badge-md badge-sm badge-warning max-w-full truncate"
        >
          {{ props.object.product_category_name }}
        </span>
        <div class="flex flex-wrap flex-row gap-2">
          <span
            v-for="subcategory in props.object.product_subcategories"
            :key="subcategory.uuid"
            class="badge sm:badge-sm badge-xs badge-info max-w-full truncate"
          >
            {{ subcategory.subcategory_name }}
          </span>
        </div>
        <h2
          class="min-h-12 line-clamp-2 sm:text-sm text-xs font-semibold leading-6 text-base-content sm:text-base"
        >
          {{ props.object.product_name }}
        </h2>
        <p
          v-if="props.object.product_code"
          class="truncate text-xs text-base-content/50 sm:block hidden"
        >
          รหัสสินค้า {{ props.object.product_code }}
        </p>
      </div>
    </NuxtLink>

    <div
      v-if="user"
      class="mt-auto hidden space-y-3 border-t border-base-300 px-4 pb-4 pt-3 sm:block"
    >
      <div class="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p
            v-if="hasDiscount"
            class="text-xs text-base-content/45 line-through"
          >
            ฿{{ formatPrice(originalPrice) }}
          </p>
          <p
            class="lg:text-xl sm:text-lg text-base font-bold"
            :class="hasDiscount ? 'text-error' : 'text-primary'"
          >
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
        <div class="md:join hidden">
          <button
            class="btn btn-xs join-item"
            type="button"
            @click="onReduceQuantity"
          >
            <Icon name="lucide:minus" size="14" />
          </button>
          <input
            v-model.number="quantity"
            type="number"
            min="0"
            class="input input-xs join-item w-11 text-center"
            aria-label="จำนวนสินค้า"
          />
          <button
            class="btn btn-xs join-item"
            type="button"
            @click="onIncreaseQuantity"
          >
            <Icon name="lucide:plus" size="14" />
          </button>
        </div>
      </div>
      <button
        class="btn btn-primary btn-sm w-full md:block hidden"
        type="button"
        :disabled="quantity <= 0 || isAdding"
        @click="onAddToCart"
      >
        <Icon
          :name="isAdding ? 'lucide:loader-circle' : 'lucide:shopping-cart'"
          :class="isAdding ? 'animate-spin' : ''"
          size="16"
        />
        เพิ่มลงตะกร้า
      </button>
    </div>

    <div
      v-else
      class="mt-auto hidden border-t border-base-300 px-4 py-4 sm:block"
    >
      <p
        class="sm:text-sm text-xs font-semibold text-primary cursor-pointer"
        @click="onSignIn"
      >
        เข้าสู่ระบบเพื่อดูราคา
      </p>
    </div>
    <dialog ref="mobileSheet" class="modal modal-bottom sm:hidden">
      <div class="modal-box max-h-[92dvh] rounded-t-3xl p-0">
        <div
          class="sticky top-0 z-20 flex items-center justify-between border-b border-base-300 bg-base-100 px-4 pb-3 pt-5"
        >
          <span
            class="absolute left-1/2 top-2 h-1 w-12 -translate-x-1/2 rounded-full bg-base-content/20"
          />
          <h2 class="font-semibold text-xl">รายละเอียดสินค้า</h2>
          <button
            type="button"
            class="btn btn-circle btn-ghost btn-sm"
            aria-label="ปิดรายละเอียดสินค้า"
            @click="closeMobileSheet"
          >
            <Icon name="lucide:x" size="18" />
          </button>
        </div>

        <div class="space-y-5 overflow-y-auto p-4 pb-6 bg-base-200">
          <div class="space-y-3">
            <img
              v-if="selectedProductImage"
              :src="selectedProductImage"
              :alt="props.object.product_name || 'สินค้า'"
              class="h-64 w-full rounded-xl bg-base-100 border border-base-300 object-contain"
            />
            <img
              v-else
              src="@/assets/images/blank.png"
              alt="ยังไม่มีรูปสินค้า"
              class="h-64 w-full rounded-xl bg-base-100 border border-base-300 object-contain opacity-70"
            />
            <div
              v-if="productImages.length > 1"
              class="flex gap-2 overflow-x-auto pb-1"
            >
              <button
                v-for="image in productImages"
                :key="image"
                type="button"
                class="shrink-0 rounded-lg border bg-base-100 p-1 transition"
                :class="
                  selectedProductImage === image
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-base-300'
                "
                @click="activeProductImage = image"
              >
                <img :src="image" class="size-14 object-contain" />
              </button>
            </div>
          </div>

          <div class="space-y-3">
            <div class="flex flex-col flex-wrap items-start gap-2">
              <NuxtLink
                class="badge badge-md badge-warning hover:translate-y-[-1px] hover:shadow-sm transition"
                v-if="props.object.product_category_name"
                :to="{
                  path: '/products',
                  query: { category: props.object.product_category_name },
                }"
                @click="closeMobileSheet"
              >
                {{ props.object.product_category_name }}
              </NuxtLink>
              <div class="flex flex-wrap flex-row gap-2">
                <NuxtLink
                  v-for="subcategory in props.object.product_subcategories ||
                  []"
                  :key="subcategory.uuid"
                  class="badge badge-sm badge-info hover:translate-y-[-1px] hover:shadow-sm transition"
                  :to="{
                    path: '/products',
                    query: {
                      category: props.object.product_category_name,
                      subcategory: subcategory.uuid,
                    },
                  }"
                >
                  {{ subcategory.subcategory_name }}
                </NuxtLink>
              </div>
            </div>
            <h2 class="text-lg font-semibold leading-7">
              {{ props.object.product_name }}
            </h2>
          </div>

          <div v-if="user" class="space-y-4">
            <div>
              <p class="text-xs text-base-content/60">ราคาต่อหน่วย</p>
              <p
                v-if="hasDiscount"
                class="text-xs text-base-content/45 line-through"
              >
                ฿{{ formatPrice(originalPrice) }}
              </p>
              <p
                class="text-2xl font-bold"
                :class="hasDiscount ? 'text-error' : 'text-primary'"
              >
                ฿{{ formatPrice(displayPrice) }}
              </p>
              <p
                v-if="hasDiscount && promotionRequirement"
                class="mt-1 flex items-start gap-1 text-xs leading-5 text-warning"
              >
                <Icon
                  name="lucide:circle-info"
                  class="mt-0.5 shrink-0"
                  size="13"
                />
                {{ promotionRequirement }}
              </p>
            </div>

            <div class="grid grid-cols-[auto_1fr] gap-3">
              <div class="join">
                <button
                  type="button"
                  class="btn btn-sm btn-outline btn-primary join-item"
                  aria-label="ลดจำนวนสินค้า"
                  @click="onReduceQuantity"
                >
                  <Icon name="lucide:minus" size="16" />
                </button>
                <input
                  v-model.number="quantity"
                  type="number"
                  min="0"
                  class="input input-sm join-item w-12 text-center"
                  aria-label="จำนวนสินค้า"
                />
                <button
                  type="button"
                  class="btn btn-sm btn-outline btn-primary join-item"
                  aria-label="เพิ่มจำนวนสินค้า"
                  @click="onIncreaseQuantity"
                >
                  <Icon name="lucide:plus" size="16" />
                </button>
              </div>
              <button
                type="button"
                class="btn btn-primary btn-sm"
                :disabled="quantity <= 0 || isAdding"
                @click="onAddToCart"
              >
                <Icon
                  :name="
                    isAdding ? 'lucide:loader-circle' : 'lucide:shopping-cart'
                  "
                  :class="isAdding ? 'animate-spin' : ''"
                  size="16"
                />
                เพิ่มลงตะกร้า
              </button>
            </div>
          </div>
          <button
            v-else
            type="button"
            class="btn btn-primary btn-sm w-full"
            @click="onMobileSignIn"
          >
            เข้าสู่ระบบเพื่อดูราคา
          </button>

          <div class="space-y-3 border-t border-base-300 pt-4 text-sm">
            <div>
              <span class="font-semibold">รหัสสินค้า: </span>
              {{ props.object.product_code || "-" }}
            </div>
            <div>
              <span class="font-semibold">รายละเอียดสินค้า:</span>
              <p
                v-if="props.object.product_description"
                class="mt-1 whitespace-pre-line leading-6 text-base-content/80"
              >
                {{ props.object.product_description }}
              </p>
              <p v-else class="mt-1 text-base-content/50">-</p>
            </div>
          </div>

          <NuxtLink
            :to="`/products/${props.object.product_name}`"
            class="btn btn-ghost btn-sm w-full"
          >
            เปิดหน้ารายละเอียดสินค้า
            <Icon name="lucide:arrow-right" size="16" />
          </NuxtLink>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button aria-label="ปิดรายละเอียดสินค้า">ปิด</button>
      </form>
    </dialog>
  </article>

  <AuthBothModal ref="signModal" />
</template>

<script setup lang="ts">
import { normalizeProductImageUrls } from "~/utils/productImages";

const props = defineProps<{ object: Record<string, any>; ranking?: number }>();
type SignModalHandle = {
  onSignIn: () => void;
};

const signModal = ref<SignModalHandle | null>(null);
const mobileSheet = ref<HTMLDialogElement | null>(null);
const activeProductImage = ref("");

const quantity = ref(0);
const isAdding = ref(false);
const { addToBasket } = useBasket();
const { syncFromStorage, user } = useCurrentUser();
const { showToast } = useToast();

const productImages = computed(() =>
  normalizeProductImageUrls(props.object.image_url),
);
const imageSrc = computed(() => productImages.value[0] || "");
const selectedProductImage = computed(() =>
  productImages.value.includes(activeProductImage.value)
    ? activeProductImage.value
    : imageSrc.value,
);

const originalPrice = computed(() =>
  Number(props.object.product_selling_price || 0),
);
const promotionPrice = computed(() =>
  Number(
    props.object.promotion_discounted_price ||
      props.object.promotion_bundle_price ||
      props.object.product_discounted_price ||
      props.object.sale_price ||
      0,
  ),
);
const hasDiscount = computed(
  () => promotionPrice.value > 0 && promotionPrice.value < originalPrice.value,
);
const displayPrice = computed(() =>
  hasDiscount.value ? promotionPrice.value : originalPrice.value,
);
const discountLabel = computed(() => {
  if (!originalPrice.value || !promotionPrice.value) return "";
  const percent = Math.round(
    ((originalPrice.value - promotionPrice.value) / originalPrice.value) * 100,
  );
  return percent > 0 ? `${percent}%` : "พิเศษ";
});
const promotionRequirement = computed(() => {
  const requirements: string[] = [];
  const minQuantity = Number(props.object.promotion_min_quantity || 0);
  const minPurchaseAmount = Number(
    props.object.promotion_min_purchase_amount || 0,
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

const formatPrice = (price: number) =>
  new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);

const onReduceQuantity = () => {
  quantity.value = Math.max(0, Number(quantity.value || 0) - 1);
};

const onIncreaseQuantity = () => {
  quantity.value = Number(quantity.value || 0) + 1;
};

const onAddToCart = async () => {
  if (isAdding.value || quantity.value <= 0) return;
  if (!user.value) {
    showToast("กรุณาเข้าสู่ระบบก่อนเพิ่มสินค้าลงตะกร้า", "warning");
    return;
  }

  isAdding.value = true;
  try {
    await addToBasket(
      { ...props.object, product_selling_price: originalPrice.value },
      quantity.value,
    );
    showToast(
      `เพิ่ม ${props.object.product_name} ลงตะกร้าแล้ว`,
      "success",
      3500,
      {
        label: "ดูตะกร้า",
        to: "/shopping-basket",
      },
    );
    quantity.value = 0;
    mobileSheet.value?.close();
  } catch (error) {
    console.error("Unable to add product to basket", error);
    showToast("ไม่สามารถเพิ่มสินค้าในตะกร้าได้", "error");
  } finally {
    isAdding.value = false;
  }
};

const onSignIn = () => {
  signModal.value?.onSignIn();
};

const openMobileSheet = () => {
  activeProductImage.value = imageSrc.value;
  mobileSheet.value?.showModal();
};

const closeMobileSheet = () => {
  mobileSheet.value?.close();
};

const onMobileSignIn = () => {
  closeMobileSheet();
  nextTick(onSignIn);
};

onMounted(syncFromStorage);
</script>
