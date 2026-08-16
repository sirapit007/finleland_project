<template>
  <div class="flex flex-col justify-center items-center mx-1">
    <NuxtLink
      :to="{
        path: '/products',
        query: { category: props.object.category_name },
      }"
    >
      <div
        class="avatar flex justify-center transition-transform duration-100 ease-in-out hover:scale-105"
      >
        <div
          class="rounded-full border border-none"
        >
          <img
            v-if="props.object.image_url"
            :src="props.object.image_url"
            class="rounded-2xl bg-base-100 object-contain"
          />
          <img
            v-else
            src="@/assets/images/blank.png"
            class="rounded-2xl bg-base-200 object-contain"
          />
        </div>
      </div>
    </NuxtLink>
    <p class="text-center sm:text-sm! text-xs font-bold mt-2">
      {{ props.object.category_name }}
    </p>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ object: Record<string, any> }>();
</script>
