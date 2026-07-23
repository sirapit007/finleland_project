<template>
  <div
    class="card border border-base-content/20 shadow-sm hover:scale-105 hover:bg-base-200 hover:shodow-lg transition cursor-pointer min-h-[350px]"
  >
    <NuxtLink class="h-full" :to="`/products/${props.object.product_name}`">
      <div class="card-body p-0 pb-6 relative">
        <img
          v-if="props.object.image_url"
          :src="props.object.image_url"
          class="rounded-t-2xl bg-base-100 border border-base-300 h-37.5 object-contain"
        />
        <img
          v-else
          src="@/assets/images/blank.png"
          class="rounded-t-2xl bg-base-100 border border-base-300 h-37.5 object-contain"
        />
        <div class="p-4 space-y-1">
          <span class="badge badge-sm badge-warning">{{
            props.object.product_category_name
          }}</span>
          <!-- <h2 class="card-title text-sm">{{ props.object.product_name }}</h2> -->
          <p class="text-base-content/50 text-sm">
            {{ props.object.product_name }}
          </p>
        </div>
      </div>
    </NuxtLink>

    <div
      v-if="user"
      class="absolute left-4 bottom-2 lg:flex grid gap-1 font-semibold text-primary text-sm flex justify-between items-center"
    > 
      <div class="text-lg font-bold">฿{{ props.object.product_selling_price }}</div>
      <div class="join">
        <button class="btn btn-xs btn-outline btn-primary join-item" v-on:click="onReduceQuantity">
          <Icon name="lucide:minus" />
        </button>
        <input type="number" min="0" class="input input-xs w-12 join-item" v-model="quantity" />
        <button class="btn btn-xs btn-outline btn-primary join-item" v-on:click="onIncreaseQuantity">
          <Icon name="lucide:plus" />
        </button>
      </div>
      <button class="btn btn-xs btn-primary" :disabled="quantity <= 0" v-on:click="onAddToCart">
        <Icon name="lucide:shopping-cart" /> เพิ่มลงตะกล้า
      </button>
    </div>
    <div
      v-else
      class="absolute left-4 bottom-2 font-semibold text-primary text-sm"
    >
      เข้าสู่ระบบเพื่อดูราคา
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  object: any;
}>();

const quantity = ref<number>(0);

const onReduceQuantity = () => {
  if (quantity.value > 0) {
    quantity.value--;
  }
};

const onIncreaseQuantity = () => {
  quantity.value++;
};

const onAddToCart = () => {
  // Implementation for adding to cart
};

const user = ref<any>(null);

onMounted(() => {
  const stored = localStorage.getItem("web-user");
  user.value = stored ? JSON.parse(stored) : null;
});
</script>
