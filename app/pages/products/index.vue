<template>
  <div class="w-full flex justify-center">
    <div class="w-[50%] text-center py-10 space-y-4">
      <div class="text-primary text-5xl font-bold">
        {{ selectedOwner ? selectedOwner : "สินค้าทั้งหมด" }}
      </div>
      <div class="badge badge-sm badge-soft badge-primary py-3">
        <NuxtLink to="/">หน้าแรก</NuxtLink>/
        {{ selectedOwner ? selectedOwner : "สินค้าทั้งหมด" }}
      </div>
    </div>
  </div>
  <div class="w-full flex justify-center">
    <div class="w-[75%] py-10 space-y-4 flex gap-8">
      <div class="w-40 space-y-4">
        <div class="text-base">หมวดหมู่สินค้า</div>
        <NuxtLink
          to="/products"
          class="group flex justify-between items-center text-base cursor-pointer"
          :class="
            !selectedOwner
              ? 'text-base-content font-semibold'
              : 'text-base-content/50 hover:text-base-content'
          "
        >
          ทั้งหมด
          <div
            class="badge group-hover:bg-primary group-hover:text-primary-content border-base-content/50 text-xs"
            :class="
              !selectedOwner
                ? 'badge-primary'
                : 'badge-outline text-base-content/50'
            "
          >
            {{ totalOwnerCount }}
          </div>
        </NuxtLink>
        <NuxtLink
          class="group flex justify-between items-center text-base cursor-pointer"
          v-for="value in base?.rows"
          :key="value.demo_owner"
          :to="{ path: '/products', query: { owner: value.demo_owner } }"
          :class="
            selectedOwner === value.demo_owner
              ? 'text-base-content font-semibold'
              : 'text-base-content/50 hover:text-base-content'
          "
        >
          {{ value.demo_owner }}
          <div
            class="badge group-hover:bg-primary group-hover:text-primary-content border-base-content/50 text-xs"
            :class="
              selectedOwner === value.demo_owner
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
          <div class="flex-1 flex items-center justify-end gap-4">
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
            <div class="flex gap-1">
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
            <select
              class="select select-base select-ghost w-fit cursor-pointer"
              v-model="orderBy"
            >
              <option value="product.id DESC" selected>
                เรียงตามลำดับ: หลังไปก่อน
              </option>
              <option value="product.id ASC">เรียงตามลำดับ: ก่อนไปหลัง</option>
              <!-- <option value="product.demo_price DESC">เรียงตามราคา: สูงไปต่ำ</option>
              <option value="product.demo_price ASC">เรียงตามราคา: ต่ำไปสูง</option> -->
            </select>
          </div>
        </div>
        <p v-if="error" class="text-error">{{ error.message }}</p>

        <div v-if="pending" class="text-center my-4">
          <span class="loading loading-spinner loading-xl"></span>
        </div>
        <div v-else :class="`grid grid-cols-${gridValue} gap-4 my-4`">
          <template v-for="row in data?.rows">
            <div
              class="card card-border bg-base-300 hover:scale-105 hover:bg-base-200 hover:shodow-lg transition cursor-pointer"
            >
              <NuxtLink :to="`/products/${row.demo_name}`">
                <div class="card-body p-4">
                  <img
                    src="@/assets/images/blank.png"
                    alt="..."
                    class="rounded-lg border border-base-300"
                  />
                  <h2 class="card-title text-base">{{ row.demo_code }}</h2>
                  <p class="text-base-content/50 text-base">
                    {{ row.demo_owner }}<br />
                    {{ row.demo_name }}
                  </p>
                  <p class="font-semibold text-primary text-base">
                    เข้าสู่ระบบเพื่อดูราคา
                  </p>
                </div>
              </NuxtLink>
            </div>
          </template>
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
const orderBy = ref("product.id DESC");
const selectedOwner = computed(() => String(route.query.owner || ""));
const productQuery = computed(() => ({
  page: page.value,
  pageSize: pageSize.value,
  orderBy: orderBy.value,
  ...(selectedOwner.value ? { owner: selectedOwner.value } : {}),
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
});

watch(selectedOwner, () => {
  page.value = 1;
});

onMounted(async () => {
  base.value = await $fetch("/api/products/group-by-owner");
});
</script>
