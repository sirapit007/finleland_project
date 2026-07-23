<template>
  <div class="w-full flex justify-center">
    <div class="w-[50%] text-center py-10 space-y-4">
      <div class="text-primary text-5xl font-bold">
        {{ selectedCategory ? selectedCategory : "สินค้าทั้งหมด" }}
      </div>
      <div class="badge badge-sm badge-soft badge-primary py-3">
        <NuxtLink to="/">หน้าแรก</NuxtLink>/
                <Icon name="lucide:chevron-right" size="15" />
        <span class="text-base-content">{{ selectedCategory ? selectedCategory : "สินค้าทั้งหมด" }}</span>
      </div>
      <div>
        <label class="input sm:input-sm input-xs shadow-sm">
          <span class="label"><Icon name="lucide:search" size="16" /></span>
          <input
            type="text"
            placeholder="ค้นหาชื่อสินค้า หรือคำค้นหาอื่นๆ..."
            v-model="q"
          />
        </label>
      </div>
    </div>
  </div>
  <div class="w-full flex justify-center">
    <div class="w-[80%] py-10 space-y-4 flex gap-8">
      <div class="lg:w-50 w-40 space-y-1">
        <div class="lg:text-base text-sm">หมวดหมู่สินค้า</div>
        <NuxtLink
          to="/products"
          class="group flex justify-between items-center text-sm cursor-pointer p-2 rounded-lg"
          :class="
            !selectedCategory
              ? 'text-base-content font-semibold bg-primary/20'
              : 'text-base-content/50 hover:text-base-content'
          "
        >
          <span class="lg:text-sm text-xs">ทั้งหมด</span>
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
          class="group flex justify-between items-center text-sm cursor-pointer p-2 rounded-lg"
          v-for="value in base?.rows"
          :key="value.demo_owner"
          :to="{ path: '/products', query: { category: value.category_name } }"
          :class="
            selectedCategory === value.category_name
              ? 'text-base-content font-semibold bg-primary/20'
              : 'text-base-content/50 hover:text-base-content'
          "
        >
          <span class="lg:text-sm text-xs">{{ value.category_name }}</span>
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
      <div class="flex-1">
        <div class="flex justify-between items-center">
          <div class="text-base w-40">
            <span class="text-base-content/50"
              ><NuxtLink to="/">หน้าแรก</NuxtLink> /
            </span>
            <span class="font-semibold">สินค้าทั้งหมด</span>
          </div>
          <div
            class="flex-1 lg:grid sm:grid-cols-3 grid-cols-1 items-center text-end gap-4 space-y-1"
          >
            <div class="text-sm">
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
            <div class="space-x-1">
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
                class="select select-base select-ghost bg-base-200 w-fit cursor-pointer"
                v-model="orderBy"
              >
                <option value="product.id DESC" selected>
                  เรียงตามลำดับ: หลังไปก่อน
                </option>
                <option value="product.id ASC">
                  เรียงตามลำดับ: ก่อนไปหลัง
                </option>
                <!-- <option value="product.demo_price DESC">เรียงตามราคา: สูงไปต่ำ</option>
              <option value="product.demo_price ASC">เรียงตามราคา: ต่ำไปสูง</option> -->
              </select>
            </div>
          </div>
        </div>
        <p v-if="error" class="text-error">{{ error.message }}</p>

        <div v-if="pending" class="text-center my-4">
          <span class="loading loading-spinner loading-xl"></span>
        </div>
        <div
          v-if="data?.rows.length"
          :class="`grid grid-cols-${gridValue} gap-4 my-4`"
        >
          <template v-for="row in data?.rows">
            <CardTemplate :object="row" />
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
const gridValue = ref(3);
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
