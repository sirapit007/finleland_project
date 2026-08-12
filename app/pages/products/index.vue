<template>
  <div class="flex justify-center px-4 sm:px-6 lg:px-8">
    <div
      class="w-full max-w-4xl space-y-3 py-7 text-center sm:space-y-4 sm:py-10 lg:py-12"
    >
      <div class="font-bold text-primary sm:text-5xl text-4xl">
        {{ selectedCategory ? selectedCategory : "สินค้าทั้งหมด" }}
      </div>
      <div class="badge badge-xs badge-soft badge-primary py-3 sm:badge-sm">
        <NuxtLink to="/">หน้าแรก</NuxtLink>
        <Icon name="lucide:chevron-right" size="15" />
        <span class="text-base-content">{{
          selectedCategory ? selectedCategory : "สินค้าทั้งหมด"
        }}</span>
      </div>
      <div>
        <label class="input input-xs shadow-sm sm:input-sm w-80">
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
    <div class="flex flex-row gap-5 p-4 sm:p-6 lg:gap-4 lg:p-8">
      <div
        class="flex flex-col gap-1 pt-2 lg:w-52 w-36 lg:space-y-1"
      >
        <div class="col-span-full text-sm sm:text-base">หมวดหมู่สินค้า</div>
        <template v-if="isCategoriesLoading">
          <div
            v-for="item in 7"
            :key="item"
            class="flex items-center justify-between p-2"
            aria-hidden="true"
          >
            <div class="skeleton h-3 w-24" />
            <div class="skeleton h-6 w-9 rounded-full" />
          </div>
        </template>
        <template v-else>
          <NuxtLink
            to="/products"
            class="group flex cursor-pointer items-center justify-between rounded-lg sm:p-2 p-1 text-xs sm:text-sm"
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
            class="group flex cursor-pointer items-center justify-between rounded-lg sm:p-2 p-1 text-xs sm:text-sm gap-2"
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
        </template>
      </div>
      <div class="min-w-0 flex-1">
        <div
          class="mb-3 flex flex-col gap-3 sm:mb-2 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="text-sm sm:text-base">
            <span class="text-base-content/50"
              ><NuxtLink to="/">หน้าแรก</NuxtLink> /
            </span>
            <span class="font-semibold">สินค้าทั้งหมด</span>
          </div>
          <div
            class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs sm:justify-end sm:text-sm lg:text-base"
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
            <div>
              <select
                class="select select-xs w-full cursor-pointer bg-base-100 sm:select-sm sm:w-fit lg:select-base"
                v-model="orderBy"
              >
                <option value="base.id DESC" selected>
                  เรียงตามลำดับ: หลังไปก่อน
                </option>
                <option value="base.id ASC">เรียงตามลำดับ: ก่อนไปหลัง</option>
                <option value="base.product_selling_price DESC">
                  เรียงตามลำดับ: แพงไปถูก
                </option>
                <option value="base.product_selling_price ASC">
                  เรียงตามลำดับ: ถูกไปแพง
                </option>
              </select>
            </div>
          </div>
        </div>
        <p v-if="error" class="text-error">{{ error.message }}</p>

        <TablePagination v-model:page="page" :disabled="pending" :data="data" />
        <div
          v-if="pending"
          class="my-4 grid lg:grid-cols-4 sm:grid-cols-3 grid-cols-2 gap-4"
        >
          <SkeletonProductCards :count="pageSize" />
        </div>
        <div
          v-else-if="data?.rows.length"
          class="grid lg:grid-cols-4 sm:grid-cols-3 grid-cols-2 gap-4 my-4"
        >
          <template v-for="row in data?.rows">
            <ProductCard :object="row" />
          </template>
        </div>
        <div v-else class="text-center my-4 text-base-content/50">
          ไม่พบข้อมูล
        </div>
        <TablePagination v-model:page="page" :disabled="pending" :data="data" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const pageSizeData = ref([9, 12, 18, 24]);
const page = ref(1);
const pageSize = ref(12);
const q = ref("");
const orderBy = ref("base.id DESC");
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
const isCategoriesLoading = ref(true);

const { data, pending, error } = await useFetch("/api/products", {
  server: false,
  query: productQuery,
  watch: [productQuery],
});

watch(selectedCategory, () => {
  page.value = 1;
});

onMounted(async () => {
  try {
    base.value = await $fetch("/api/categories", {
      params: { pageSize: 999 },
    });
  } finally {
    isCategoriesLoading.value = false;
  }
});
</script>
