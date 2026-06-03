<template>
  <div
    class="w-full flex flex-col justify-center items-center bg-base-300 relative"
  >
    <div class="w-[50%] text-center py-28 space-y-3">
      <div class="text-primary text-6xl font-bold">ขายส่งเครื่องครัว</div>
      <div class="text-primary text-4xl font-bold">
        ร้านย่งกิมเชียงขายส่งตัวจริง ครบ จบในที่เดียว
      </div>
      <div class="text-secondary text-5xl font-bold">ประสบการณ์กว่า 40 ปี</div>
      <div class="font-semibold">
        ย่งกิมเชียง คือ
        <span class="text-error">ขายส่งเครื่องครัว</span>
        ที่พ่อค้าแม่ค้าไว้วางใจ ให้บริการจัดจำหน่ายสินค้าแบบครบวงจร
        ทั้งในประเทศไทยและต่างประเทศ เราคัดสรรสินค้าคุณภาพ ครอบคลุมทุกหมวดหมู่
        ไม่ว่าจะเป็น เครื่องครัว เครื่องมือช่าง หรือสินค้าเบ็ดเตล็ด รวมกว่า
        3,000 รายการ พร้อมให้คุณเลือกครบจบในที่เดียว
      </div>
      <div class="space-x-2">
        <NuxtLink to="/products" class="btn btn-primary"
          >สินค้าของเรา <Icon name="lucide:shopping-basket" size="18"
        /></NuxtLink>
        <NuxtLink to="/how-to-order" class="btn btn-outline btn-secondary"
          >วิธีการสั่งซื้อ <Icon name="lucide:circle-arrow-right" size="18"
        /></NuxtLink>
      </div>
    </div>
    <div
      class="w-[82.5%] stats shadow-sm shadow-primary bg-base-100 absolute -bottom-11 rounded-4xl p-0"
    >
      <div class="stat">
        <div class="stat-figure text-primary">
          <Icon name="lucide:shield-check" size="56" />
        </div>
        <div class="stat-value text-lg text-primary">ราคาดี คุณภาพดี</div>
        <div class="stat-desc text-sm">ซื้อไปขายมีกำไร</div>
      </div>

      <div class="stat">
        <div class="stat-figure text-primary">
          <Icon name="lucide:truck" size="56" />
        </div>
        <div class="stat-value text-lg text-primary">ราคาดี คุณภาพดี</div>
        <div class="stat-desc text-sm">ซื้อไปขายมีกำไร</div>
      </div>

      <div class="stat">
        <div class="stat-figure text-primary">
          <Icon name="lucide:globe" size="56" />
        </div>
        <div class="stat-value text-lg text-primary">ส่งออกทั่วโลก</div>
        <div class="stat-desc text-sm">สินค้าได้มาตรฐานทุกชิ้น</div>
      </div>

      <div class="stat bg-linear-to-br from-primary to-secondary">
        <div class="stat-figure text-primary-content">
          <Icon name="lucide:ribbon" size="56" />
        </div>
        <div class="stat-value text-lg text-primary-content">บริการด้วยใจ</div>
        <div class="stat-desc text-sm text-primary-content">
          คิดถึงกำไรของลูกค้าเป็นหลัก
        </div>
      </div>
    </div>
  </div>
  <div class="w-full flex flex-col justify-center items-center mt-20">
    <div class="w-[82.5%] flex">
      <div class="w-[200px] flex flex-col justify-center space-y-2">
        <div class="text-primary text-3xl font-semibold">สินค้า</div>
        <NuxtLink to="/products" class="btn btn-primary w-fit"
          >ดูเพิ่มเติม <Icon name="lucide:circle-arrow-right" size="18"
        /></NuxtLink>
      </div>
      <div class="flex-1 relative overflow-hidden">
        <CardCarouselProducts :data="rows.products" :gridValue="3" />
      </div>
    </div>
  </div>
  <div class="w-full flex flex-col justify-center items-center mt-10">
    <div class="w-[82.5%] space-y-3">
      <div class="text-primary text-3xl font-semibold">หมวดหมู่สินค้า</div>
      <div class="flex-1 relative overflow-hidden">
        <CardCarouselCategories :data="rows.categories" :gridValue="4" />
      </div>
    </div>
  </div>
  <div class="w-full flex flex-col justify-center items-center mt-10">
    <div class="w-[82.5%] space-y-3">
      <div class="flex justify-between items-center">
        <div class="text-primary text-3xl font-semibold">สินค้ายอดนิยม</div>
        <NuxtLink to="/products" class="btn btn-primary"
          >ดูทั้งหมด <Icon name="lucide:circle-arrow-right" size="18"
        /></NuxtLink>
      </div>
      <!-- name of each tab group should be unique -->
      <div class="tabs tabs-border">
        <template
          v-for="(category, index) in rows.categories"
          :key="category.demo_owner"
        >
          <input
            type="radio"
            name="my_tabs"
            class="tab checked:text-primary checked:font-semibold"
            :aria-label="category.demo_owner"
            :value="category.demo_owner"
            v-model="tabs"
          />
          <div class="tab-content p-0">
            <div :class="`grid grid-cols-4 gap-4 my-4`">
              <template v-for="row in rows.related_products">
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
          </div>
        </template>
      </div>
    </div>
  </div>
  <div class="w-full flex flex-col justify-center items-center mt-10">
    <div
      class="w-[82.5%] space-y-3 shadow-sm grid grid-cols-2 p-12 rounded-lg border border-base-content/10 gap-8"
    >
      <div class="space-y-4">
        <img src="@/assets/images/logo.png" alt="..." class="max-h-15" />
        <div class="text-primary text-[28px] font-bold">
          ครบเครื่องเรื่องค้าส่ง
        </div>
        <div class="text-primary text-4xl font-bold">ต้อง "ย่งกิมเชียง"</div>
        <div class="text-base-content/75 text-lg">
          ย่งกิมเชียง ร้านเก่าแก่ใจกลางย่านสำเพ็ง
          ที่พ่อค้าแม่ค้าไว้วางใจมานานเรามีสินค้าคุณภาพดี ราคาคุ้มค่า
          ให้เลือกมากกว่า 3,000 รายการ หน้าร้านจัดแสดงสินค้าตัวอย่างอย่างครบครัน
          เดินเลือกง่าย สะดวกสบาย
          พร้อมพนักงานที่ให้บริการอย่างมืออาชีพไม่ว่าคุณจะเปิดร้านใหม่
          ขายออนไลน์ หรือต้องการหาสินค้าครบจบในที่เดียว
        </div>
        <div class="text-base-content/75 text-lg">
          หาสินค้าใหม่ เติมสินค้าเก่า แวะมาที่ ร้านย่งกิมเชียง ได้เลย
        </div>
      <div class="space-x-2">
        <button class="btn btn-primary" @click="openMap"
          >แผนที่ร้าน <Icon name="lucide:circle-arrow-right" size="18"
        /></button>
        <button class="btn btn-outline btn-error"
          >โทรสอบถาม xx-xxx-xxxx <Icon name="lucide:circle-arrow-right" size="18"
        /></button>
      </div>
      </div>
      <div>
        <img
          src="@/assets/images/blank.png"
          alt="..."
          class="rounded-lg border border-base-300 w-full"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const rows = ref<any>({
  products: [],
  categories: [],
  related_products: [],
});
const tabs = ref("a");

const openMap = () => {
  window.open("https://maps.app.goo.gl/QLdLX6w2srqyPVzM8", "_blank");
};

onMounted(async () => {
  const products: any = await $fetch(`/api/products`, {
    params: { pageSize: 12, orderBy: "product.created_at DESC" },
  });
  rows.value.products = products.rows;

  const categories: any = await $fetch("/api/products/group-by-owner");
  rows.value.categories = categories.rows;

  const relatedProducts: any = await $fetch(
    `/api/products/category/${tabs.value}`,
    { params: { pageSize: 12 } },
  );
  rows.value.related_products = relatedProducts.rows;
});

watch(tabs, async (newValue) => {
  const relatedProducts: any = await $fetch(
    `/api/products/category/${newValue}`,
    { params: { pageSize: 12 } },
  );
  rows.value.related_products = relatedProducts.rows;
});
</script>
