<template>
  <div class="flex justify-center px-4 sm:px-6 lg:px-8">
    <div
      class="w-full max-w-4xl space-y-3 py-7 text-center sm:space-y-4 sm:py-10 lg:py-12"
    >
      <div class="font-bold text-primary sm:text-5xl text-4xl">
        {{ pageTitle }}
      </div>
      <div class="badge badge-xs badge-soft badge-primary py-3 sm:badge-sm">
        <NuxtLink to="/">หน้าแรก</NuxtLink>
        <template v-if="pageTitle === selectedSubcategory?.subcategory_name">
          <Icon name="lucide:chevron-right" size="15" />
          <NuxtLink
            :to="{
              path: '/products',
              query: { category: selectedCategory },
            }"
            >{{ selectedCategory }}</NuxtLink
          >
          <Icon name="lucide:chevron-right" size="15" />
          <span class="text-base-content">{{
            selectedSubcategory?.subcategory_name
          }}</span>
        </template>
        <template v-else>
          <Icon name="lucide:chevron-right" size="15" />
          <span class="text-base-content">{{ pageTitle }}</span>
        </template>
      </div>
      <div class="flex w-full flex-col items-center justify-center gap-2.5">
        <label class="input input-xs w-full max-w-80 shadow-sm sm:input-sm">
          <span class="label"><Icon name="lucide:search" size="16" /></span>
          <input
            type="search"
            placeholder="ค้นหาชื่อสินค้า หรือคำค้นหาอื่นๆ..."
            v-model="q"
          />
        </label>
        <select
          :value="selectedCategory"
          class="select select-xs w-full max-w-80 cursor-pointer shadow-sm sm:select-sm md:hidden"
          :disabled="isCategoriesLoading"
          aria-label="เลือกหมวดหมู่สินค้า"
          @change="handleCategoryChange"
        >
          <option value="">
            {{ isCategoriesLoading ? "กำลังโหลดหมวดหมู่..." : "ทุกหมวดหมู่" }}
          </option>

          <option
            v-for="value in base?.rows"
            :key="value.uuid"
            :value="value.category_name"
          >
            {{ value.category_name }} ({{ value.qty_count }})
          </option>
        </select>
        <div class="relative w-full max-w-80 md:hidden">
          <Icon
            name="lucide:corner-down-right"
            size="14"
            class="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-base-content/40"
          />
          <select
            :value="selectedSubcategoryId"
            class="select select-xs w-full cursor-pointer pl-9 shadow-sm sm:select-sm"
            :disabled="!selectedCategory || isSubcategoriesLoading"
            aria-label="เลือกหมวดหมู่ย่อย"
            @change="handleSubcategoryChange"
          >
            <option value="">{{ subcategorySelectLabel }}</option>
            <option
              v-for="subcategory in subcategories"
              :key="subcategory.uuid"
              :value="subcategory.uuid"
            >
              {{ subcategory.subcategory_name }} ({{ subcategory.qty_count }})
            </option>
          </select>
        </div>
      </div>
    </div>
  </div>
  <div
    class="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10"
  >
    <div class="flex flex-row gap-5 p-4 sm:p-6 lg:gap-4 lg:p-8">
      <div
        class="md:flex hidden flex-col gap-1 pt-2 xl:w-60 lg:w-48 w-40 lg:space-y-1"
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
          <div
            class="mt-3 rounded-xl border border-primary/10 bg-primary/5 p-2"
          >
            <NuxtLink
              to="/products"
              class="group flex cursor-pointer items-center justify-between rounded-lg sm:p-2 p-1 text-xs sm:text-sm gap-2"
              :class="
                !selectedCategory
                  ? 'text-base-content font-semibold bg-primary/20'
                  : 'text-base-content/50 hover:text-base-content'
              "
            >
              <span class="text-xs lg:text-sm">ทั้งหมด</span>
              <div
                class="badge lg:badge-sm badge-xs group-hover:bg-primary group-hover:text-primary-content border-base-content/50 lg:text-xs text-[10px] py-2"
                :class="
                  !selectedCategory
                    ? 'badge-primary'
                    : 'badge-soft text-base-content/50'
                "
              >
                {{ totalOwnerCount }}
              </div>
            </NuxtLink>
            <NuxtLink
              class="group flex cursor-pointer items-center justify-between rounded-lg sm:p-2 p-1 text-xs sm:text-sm gap-2"
              v-for="value in base?.rows"
              :key="value.uuid"
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
                class="badge lg:badge-sm badge-xs group-hover:bg-primary group-hover:text-primary-content border-base-content/50 lg:text-xs text-[10px] py-2"
                :class="
                  selectedCategory === value.category_name
                    ? 'badge-primary'
                    : 'badge-soft text-base-content/50'
                "
              >
                {{ value.qty_count }}
              </div>
            </NuxtLink>
          </div>
          <div
            v-if="selectedCategory"
            class="mt-3 rounded-xl border border-secondary/10 bg-secondary/5 p-2"
          >
            <div
              class="flex items-center gap-1.5 px-1.5 pb-2 text-xs font-medium"
            >
              <Icon name="lucide:corner-down-right" size="14" />
              <span class="truncate"
                >หมวดหมู่ย่อยใน<br />{{ selectedCategory }}</span
              >
            </div>
            <template v-if="isSubcategoriesLoading">
              <div
                v-for="item in 3"
                :key="item"
                class="flex items-center justify-between px-2 py-1.5"
                aria-hidden="true"
              >
                <div class="skeleton h-3 w-20" />
                <div class="skeleton h-4 w-7 rounded-full" />
              </div>
            </template>
            <template v-else>
              <NuxtLink
                :to="{
                  path: '/products',
                  query: { category: selectedCategory },
                }"
                class="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 sm:text-xs text-[10px]"
                :class="
                  !selectedSubcategoryId
                    ? 'bg-secondary/15 font-medium text-secondary'
                    : 'text-base-content/55 hover:bg-base-100 hover:text-base-content'
                "
              >
                <span>ทั้งหมดในหมวดนี้</span>
                <span>
                  {{ selectedCategoryRecord?.qty_count || 0 }}
                </span>
              </NuxtLink>
              <NuxtLink
                v-for="subcategory in subcategories"
                :key="subcategory.uuid"
                :to="{
                  path: '/products',
                  query: {
                    category: selectedCategory,
                    subcategory: subcategory.uuid,
                  },
                }"
                class="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 sm:text-xs text-[10px]"
                :class="
                  selectedSubcategoryId === subcategory.uuid
                    ? 'bg-secondary/15 font-medium text-secondary'
                    : 'text-base-content/55 hover:bg-base-100 hover:text-base-content'
                "
              >
                <span>{{ subcategory.subcategory_name }}</span>
                <span>
                  {{ subcategory.qty_count }}
                </span>
              </NuxtLink>
              <div
                v-if="!subcategories.length"
                class="px-2 py-1.5 sm:text-xs text-[12px] text-base-content/40"
              >
                ยังไม่มีหมวดหมู่ย่อย
              </div>
            </template>
          </div>
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
            <template
              v-if="pageTitle === selectedSubcategory?.subcategory_name"
            >
              <NuxtLink
                :to="{
                  path: '/products',
                  query: { category: selectedCategory },
                }"
                >{{ selectedCategory }}</NuxtLink
              >
              <span class="text-base-content/50"> / </span>
              <span class="text-base-content">{{
                selectedSubcategory?.subcategory_name
              }}</span>
            </template>
            <template v-else>
              <span class="text-base-content">{{ pageTitle }}</span>
            </template>
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
                <option value="base.product_name ASC">เรียงตามชื่อ: A-Z</option>
                <option value="base.product_name DESC">
                  เรียงตามชื่อ: Z-A
                </option>
                <option value="base.product_category_name ASC">เรียงตามหมวดหมู่: A-Z</option>
                <option value="base.product_category_name DESC">
                  เรียงตามหมวดหมู่: Z-A
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
const selectedSubcategoryId = computed(() =>
  String(route.query.subcategory || ""),
);
const productQuery = computed(() => ({
  page: page.value,
  pageSize: pageSize.value,
  orderBy: orderBy.value,
  q: q.value,
  ...(selectedCategory.value ? { category_name: selectedCategory.value } : {}),
  ...(selectedSubcategoryId.value
    ? { subcategory_uuid: selectedSubcategoryId.value }
    : {}),
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
const subcategories = ref<any[]>([]);
const isSubcategoriesLoading = ref(false);
let latestSubcategoryRequest = 0;

const selectedCategoryRecord = computed(() =>
  base.value.rows.find(
    (category: any) => category.category_name === selectedCategory.value,
  ),
);
const selectedCategoryUuid = computed(
  () => selectedCategoryRecord.value?.uuid || "",
);
const selectedSubcategory = computed(() =>
  subcategories.value.find(
    (subcategory) => subcategory.uuid === selectedSubcategoryId.value,
  ),
);
const pageTitle = computed(
  () =>
    selectedSubcategory.value?.subcategory_name ||
    selectedCategory.value ||
    "สินค้าทั้งหมด",
);
const subcategorySelectLabel = computed(() => {
  if (!selectedCategory.value) return "เลือกหมวดหมู่หลักก่อน";
  if (isSubcategoriesLoading.value) return "กำลังโหลดหมวดหมู่ย่อย...";
  if (!subcategories.value.length) return "ไม่มีหมวดหมู่ย่อย";
  return "ทุกหมวดหมู่ย่อย";
});

function handleCategoryChange(event: Event) {
  const category = (event.currentTarget as HTMLSelectElement).value;
  return navigateTo({
    path: "/products",
    query: category ? { category } : {},
  });
}

function handleSubcategoryChange(event: Event) {
  const subcategory = (event.currentTarget as HTMLSelectElement).value;
  return navigateTo({
    path: "/products",
    query: {
      category: selectedCategory.value,
      ...(subcategory ? { subcategory } : {}),
    },
  });
}

watch(
  selectedCategoryUuid,
  async (categoryUuid) => {
    const requestId = ++latestSubcategoryRequest;
    subcategories.value = [];

    if (!categoryUuid) {
      isSubcategoriesLoading.value = false;
      return;
    }

    isSubcategoriesLoading.value = true;

    try {
      const response = await $fetch<any>("/api/subcategories", {
        params: {
          category: categoryUuid,
          pageSize: 1000,
          orderBy: "base.subcategory_name ASC",
        },
      });

      if (requestId !== latestSubcategoryRequest) return;

      subcategories.value = response?.rows || [];

      if (
        selectedSubcategoryId.value &&
        !subcategories.value.some(
          (subcategory) => subcategory.uuid === selectedSubcategoryId.value,
        )
      ) {
        await navigateTo(
          {
            path: "/products",
            query: { category: selectedCategory.value },
          },
          { replace: true },
        );
      }
    } catch {
      if (requestId === latestSubcategoryRequest) subcategories.value = [];
    } finally {
      if (requestId === latestSubcategoryRequest) {
        isSubcategoriesLoading.value = false;
      }
    }
  },
  { immediate: true },
);

const { data, pending, error } = await useFetch("/api/products", {
  server: false,
  query: productQuery,
  watch: [productQuery],
});

watch([selectedCategory, selectedSubcategoryId], () => {
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
