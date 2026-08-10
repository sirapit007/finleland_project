<template>
  <div
    v-if="items.length"
    class="w-full grid lg:grid-cols-10 sm:grid-cols-5 grid-cols-4"
  >
    <div
      v-for="item in items"
      :key="item.demo_name"
      class="flex-1 my-2.5 text-center"
    >
      <NuxtLink
        :to="{
          path: '/products',
          query: { category: item.category_name },
        }"
      >
        <div
          class="avatar flex justify-center transition-transform duration-100 ease-in-out hover:scale-105"
        >
          <div class="lg:w-28 sm:w-26 w-24 rounded-full border ring-2 ring-accent">
            <img
              v-if="item.image_url"
              :src="item.image_url"
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
      <p class="text-accent sm:text-[13.5px]! text-[11.5px] font-extrabold mt-2">
        {{ item.category_name }}
      </p>
    </div>
  </div>
  <SkeletonHomeSections v-if="loading" type="categories" />
</template>

<script setup lang="ts">
const fetchedCategories = ref<Record<string, any>[]>([]);
const items = computed(() => fetchedCategories.value);
const loading = ref(true);

const loadCategories = async () => {
  if (fetchedCategories.value.length) return;

  try {
    const response = await $fetch<{ rows?: Record<string, any>[] }>(
      "/api/categories",
      {
        params: {
          pageSize: 999,
        },
      },
    );
    fetchedCategories.value = response.rows || [];
  } catch (error) {
    console.error("Unable to load categories", error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  void loadCategories();
});
</script>
