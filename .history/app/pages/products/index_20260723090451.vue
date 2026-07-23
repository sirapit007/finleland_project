<template>
  <div class="flex justify-center px-4 sm:px-6 lg:px-8">
    <div
      class="w-full max-w-4xl space-y-3 py-7 text-center sm:space-y-4 sm:py-10 lg:py-12"
    >
      <div class="font-bold text-primary text-5xl">
        {{ selectedCategory ? selectedCategory : "สินค้าทั้งหมด" }}
      </div>
      <div class="badge  badge-soft badge-primary py-3 sm:badge-sm">
        <NuxtLink to="/">หน้าแรก</NuxtLink>
        <Icon name="lucide:chevron-right" size="15" />
        <span class="text-base-content">{{
          selectedCategory ? selectedCategory : "สินค้าทั้งหมด"
        }}</span>
      </div>
      <div>
        <label class="input input-xs w-full shadow-sm sm:input-sm sm:w-80">
          <span class="label"><Icon name="lucide:search" size="16" /></span>
          <input
            type="search"
            placeholder="ค้นหาชื่อสินค้า หรือคำค้นหาอื่นๆ..."
            v-model="q"
          />
        </label>
      </div>
    </div>
  </div>
  <div
    class="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10"
  >
    <div class="flex flex-col gap-5 p-4 sm:p-6 lg:flex-row lg:gap-4 lg:p-8">
      <div
        class="grid w-full grid-cols-2 gap-1 pt-2 sm:grid-cols-3 lg:block lg:w-50 lg:space-y-1"
      >
        <div class="col-span-full text-xs sm:text-sm lg:text-base">
          หมวดหมู่สินค้า
        </div>
        <NuxtLink
          to="/products"
          class="group flex cursor-pointer items-center justify-between rounded-lg p-2 text-xs sm:text-sm"
          :class="
            !selectedCategory
              ? 'text-base-content font-semibold bg-primary/20'
              : 'text-base-content/50 hover:text-base-content'
          "
        >
          <span class="text-xs lg:text-sm">ทั้งหมด</span>
          <div
            class="badge lg:badge-md badge-sm group-hover:bg-primary group-hover:text-primary-content border-base-content/50 text-xs"
            :class="
              !selectedCategory
                ? 'badge-primary'
                : 'badge-outline text-base-content/50'
            "
          >
            {{ totalOwnerCount }}
          </div>
        </NuxtLink>
        <NuxtLink
          class="group flex cursor-pointer items-center justify-between rounded-lg p-2 text-xs sm:text-sm"
          v-for="value in base?.rows"
          :key="value.demo_owner"
          :to="{
            path: '/products',
            query: { category: value.category_name },
          }"
          :class="
            selectedCategory === value.category_name
              ? 'text-base-content font-semibold bg-primary/20'
              : 'text-base-content/50 hover:text-base-content'
          "
        >
          <span class="text-xs lg:text-sm">{{ value.category_name }}</span>
          <div
            class="badge lg:badge-md badge-sm group-hover:bg-primary group-hover:text-primary-content border-base-content/50 text-xs"
            :class="
              selectedCategory === value.category_name
                ? 'badge-primary'
                : 'badge-outline text-base-content/50'
            "
          >
            {{ value.qty_count }}
          </div>
        </NuxtLink>
      </div>
      <div class="min-w-0 flex-1">
        <div
          class="mb-3 flex flex-col gap-3 sm:mb-2 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="text-xs sm:text-sm lg:text-base">
            <span class="text-base-content/50"
              ><NuxtLink to="/">หน้าแรก</NuxtLink> /
            </span>
            <span class="font-semibold">สินค้าทั้งหมด</span>
          </div>
          <div
            class="flex flex-wrap items-center justify-start gap-x-4 gap-y-2 text-xs sm:justify-end sm:text-sm lg:text-base"
          >
            <div>
              <span class="font-semibold">Show : </span>
              <template v-for="(value, index) in pageSizeData">
                <span
                  @click="
                    () => {
                      pageSize = value;
                    }
                  "
                  class="cursor-pointer"
                  :class="
                    pageSize === value ? 'font-bold' : 'text-base-content/50'
                  "
                  >{{ value }}</span
                >
                <span
                  class="text-base-content/50"
                  v-if="index !== pageSizeData.length - 1"
                >
                  /
                </span>
              </template>
            </div>
            <div class="space-x-1 whitespace-nowrap">
              <Icon
                name="lucide:square"
                size="18"
                class="cursor-pointer"
                :class="gridValue !== 1 ? 'opacity-50' : ''"
                @click="
                  () => {
                    gridValue = 1;
                  }
                "
              />
              <Icon
                name="lucide:columns-2"
                size="18"
                class="cursor-pointer"
                :class="gridValue !== 2 ? 'opacity-50' : ''"
                @click="
                  () => {
                    gridValue = 2;
                  }
                "
              />
              <Icon
                name="lucide:columns-3"
                size="18"
                class="cursor-pointer"
                :class="gridValue !== 3 ? 'opacity-50' : ''"
                @click="
                  () => {
                    gridValue = 3;
                  }
                "
              />
              <Icon
                name="lucide:columns-4"
                size="18"
                class="cursor-pointer"
                :class="gridValue !== 4 ? 'opacity-50' : ''"
                @click="
                  () => {
                    gridValue = 4;
                  }
                "
              />
            </div>
            <div>
              <select
                class="select select-xs w-full cursor-pointer bg-base-100 sm:select-sm sm:w-fit lg:select-base"
                v-model="orderBy"
              >
                <option value="product.id DESC" selected>
                  เรียงตามลำดับ: หลังไปก่อน
                </option>
                <option value="product.id ASC">
                  เรียงตามลำดับ: ก่อนไปหลัง
                </option>
              </select>
            </div>
          </div>
        </div>
        <CardPagination v-model:page="page" :data="data" :disabled="pending" />
        <p v-if="error" class="text-error">{{ error.message }}</p>

        <div v-if="pending" class="text-center my-4">
          <span class="loading loading-spinner loading-xl"></span>
        </div>
        <div
          v-if="data?.rows.length"
          :class="[
            'grid gap-4 my-4',
            gridValue === 1 ? 'grid-cols-1' : '',
            gridValue === 2 ? 'grid-cols-2' : '',
            gridValue === 3 ? 'grid-cols-3' : '',
            gridValue === 4 ? 'grid-cols-4' : '',
          ]"
        >
          <template v-for="row in data?.rows">
            <CardProduct :object="row" />
          </template>
        </div>
        <div v-else class="text-center my-4 text-base-content/50">
          ไม่พบข้อมูล
        </div>
        <CardPagination v-model:page="page" :data="data" :disabled="pending" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const pageSizeData = ref([9, 12, 18, 24]);
const gridValue = ref(4);
const page = ref(1);
const pageSize = ref(12);
const q = ref("");
const orderBy = ref("product.id DESC");
const selectedCategory = computed(() => String(route.query.category || ""));
const productQuery = computed(() => ({
  page: page.value,
  pageSize: pageSize.value,
  orderBy: orderBy.value,
  q: q.value,
  ...(selectedCategory.value ? { category_name: selectedCategory.value } : {}),
}));
const totalOwnerCount = computed(() => {
  return (
    base.value?.rows?.reduce((sum: number, next: any) => {
      return sum + Number(next.qty_count);
    }, 0) ?? 0
  );
});
const base = ref<any>({
  rows: [],
});

const { data, pending, error } = await useFetch("/api/products", {
  server: false,
  query: productQuery,
  watch: [productQuery],
  transform: (data) => {
    return {
      ...data,
      rows: data.rows.map((item) => ({
        ...item,
        image_url: item.image_url ? JSON.parse(item.image_url) : [],
      })),
    };
  },
});

watch(selectedCategory, () => {
  page.value = 1;
});

onMounted(async () => {
  base.value = await $fetch("/api/categories", {
    params: { pageSize: 999 },
  });
});
</script>
