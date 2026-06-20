<template>
  <div
    class="card border border-base-content/20 shadow-sm hover:scale-105 hover:bg-base-200 hover:shodow-lg transition cursor-pointer min-h-[300px]"
  >
    <NuxtLink class="h-full" :to="`/products/${props.object.product_name}`">
      <div class="card-body p-0 pb-6 relative">
        <img
          v-if="props.object.image_url"
          :src="props.object.image_url"
          class="rounded-t-2xl bg-base-300 border border-base-300 min-h-[150px] max-h-[150px] object-contain"
        />
        <img
          v-else
          src="@/assets/images/blank.png"
          class="rounded-t-2xl bg-base-300 border border-base-300 min-h-[150px] max-h-[150px] object-contain"
        />
        <div class="p-4 space-y-1">
          <h2 class="card-title text-base">{{ props.object.promotion_name }}</h2>
          <p class="text-base-content/50 text-sm">
            {{ props.object.promotion_product_name }}
          </p>
        </div>
      </div>
      <div
        class="absolute left-4 bottom-2 font-semibold text-error lg:text-base text-sm"
      >
        เข้าสู่ระบบเพื่อดูราคา
      </div>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  object: any;
}>();
</script>
