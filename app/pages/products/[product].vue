<template>
  <div class="w-full flex justify-center border-b border-base-content/10">
    <div class="w-[75%] py-10 space-y-4 flex gap-8">
      <div class="flex-1 space-y-4 flex justify-end">
        <img
          src="@/assets/images/blank.png"
          alt="..."
          class="rounded-lg border border-base-300 h-75"
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
          {{ base.object.demo_name }}
        </div>
        <div class="text-4xl">
          {{ base.object.demo_name }}
        </div>
        <div class="text-lg text-primary font-semibold">
          เข้าสู่ระบบเพื่อดูราคา
        </div>
        <hr class="text-base-content/10" />
        <div class="text-base">
          <span class="font-semibold">รหัสสินค้า: </span
          >{{ base.object.demo_code }}
        </div>
        <div class="text-base">
          <span class="font-semibold">หมวดหมู่: </span
          >{{ base.object.demo_owner }}
        </div>
      </div>
    </div>
  </div>
  <div
    class="w-full flex flex-col justify-center items-center border-b border-base-content/10 pt-5"
  >
    <div class="font-semibold w-full text-center">รายละเอียดเพิ่มเติม</div>
    <div class="w-[75%] pt-3 pb-15 space-y-1 gap-8">
      <div>
        {{ base.object.demo_name }}
      </div>
      <div>ราคาต่อโหล ... บาท</div>
    </div>
  </div>
  <div
    class="w-full flex flex-col justify-center items-center border border-base-content/10 pt-5 border-b border-base-content/10"
  >
    <div class="w-[75%] text-xl text-start font-semibold">หมวดหมู่ที่เกี่ยวข้อง</div>

    <div class="w-[82.5%] relative overflow-hidden">
      <CardCarouselProducts :data="rows.related_categories" :gridValue="4"/>
    </div>
  </div>
  <div
    class="w-full flex flex-col justify-center items-center border border-base-content/10 pt-5 border-b border-base-content/10"
  >
    <div class="w-[75%] text-xl text-start font-semibold">สินค้ามาใหม่</div>

    <div class="w-[82.5%] relative overflow-hidden">
      <CardCarouselProducts :data="rows.new_products" :gridValue="4"/>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const base = ref<any>({
  object: {},
});

const rows = ref<any>({
  related_categories: [],
  new_products: [],
});

onMounted(async () => {
  const object: any = await $fetch(
    `/api/products/name/${route.params.product}`,
  );
  base.value.object = object.rows[0];

  const relatedCategories: any = await $fetch(
    `/api/products/category/${base.value.object.demo_owner}`,
    { params: { pageSize: 12 } },
  );
  rows.value.related_categories = relatedCategories.rows;

  const newProducts: any = await $fetch(
    `/api/products`,
    { params: { pageSize: 12, orderBy: 'product.created_at DESC' } },
  );
  rows.value.new_products = newProducts.rows;
});
</script>
