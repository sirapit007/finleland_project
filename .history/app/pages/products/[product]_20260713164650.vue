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
          <div>
            <div>ราคาต่อหน่วย</div>
            <div class="font-bold text-2xl text-error">
              ฿{{ base.object.product_selling_price }}
            </div>
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
    <div class="max-w-7xl text-xl text-start font-semibold">
      หมวดหมู่ที่เกี่ยวข้อง
    </div>

    <div class="max-w-7xl relative overflow-hidden">
      <CardCarouselProducts :data="rows.related_categories" :gridValue="4" />
    </div>
  </div>
  <div
    class="w-full flex flex-col justify-center items-center pt-5 border border-b border-base-content/10"
  >
    <div class="max-w-7xl text-xl text-start font-semibold">สินค้ามาใหม่</div>

    <div class="max-w-7xl relative overflow-hidden">
      <CardCarouselProducts :data="rows.new_products" :gridValue="4" />
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

const onAddToCart = async () => {
  if (isAdding.value || quantity.value <= 0) {
    return;
  }

  isAdding.value = true;

  try {
    await addToBasket(base.value.object, quantity.value);
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
