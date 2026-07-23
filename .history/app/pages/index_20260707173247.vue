<template>
  <div
    class="flex flex-col justify-center items-center bg-[url(@/assets/images/content.png)] w-full min-h-screen bg-contain bg-center bg-no-repeat relative"
  >
    <div class="w-[60%] text-center py-20 space-y-3">
      <div class="text-primary text-6xl font-bold">ฟินลี่แลนด์ พลาซ่า</div>
      <div class="text-primary text-4xl font-bold">
        อาณาจักรสินค้าราคาประหยัด
      </div>
      <div class="text-secondary text-3xl font-bold">
        ครบทุกความต้องการเรื่องของใช้ในบ้านและไลฟ์สไตล์
      </div>
      <div class="text-error text-5xl font-bold">
        ไว้วางใจโดยลูกค้ามากว่า 15 ปี
      </div>
      <div class="font-semibold">
        ฟินลี่แลนด์ พลาซ่า
        อาณาจักรสินค้าราคาถูกที่ลูกค้าชาวน่านและพื้นที่ใกล้เคียงไว้วางใจมากว่า
        15 ปี เรารวบรวมสินค้าเครื่องครัว ของใช้ในบ้าน สินค้าไลฟ์สไตล์
        และสินค้าอุปโภคบริโภคหลากหลายหมวดหมู่ ให้เลือกครบในที่เดียว
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
    <!-- <div
      class="w-[80%] stats shadow-sm shadow-primary bg-base-100 absolute -bottom-11 rounded-4xl p-0"
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
    </div> -->
  </div>
  <div class="w-full flex flex-col justify-center items-center mt-10">
    <div class="w-[80%] space-y-3">
      <div class="text-primary text-3xl font-bold">หมวดหมู่สินค้า</div>
      <div class="flex-1 relative overflow-hidden">
        <CardCarouselCategories :data="rows.categories" :gridValue="6" />
      </div>
    </div>
  </div>
  <div class="w-full flex flex-col justify-center items-center mt-10">
    <div class="w-[80%] space-y-3">
      <div class="flex justify-between items-center">
        <div class="text-primary text-3xl font-bold">สินค้า</div>
        <NuxtLink to="/products" class="btn lg:btn-md btn-sm btn-primary"
          >ดูเพิ่มเติม <Icon name="lucide:circle-arrow-right" size="18"
        /></NuxtLink>
      </div>
      <div class="relative overflow-hidden">
        <CardCarouselProducts :data="rows.products" />
      </div>
    </div>
  </div>
  <div class="w-full flex flex-col justify-center items-center mt-10">
    <div class="w-[80%] space-y-3">
      <div class="flex justify-between items-center">
        <div class="text-error text-3xl font-bold">ดีลพิเศษ</div>
      </div>
      <div class="relative overflow-hidden">
        <CardCarouselProducts
          :data="rows.promotion"
          :gridValue="4"
          :deals="true"
        />
      </div>
    </div>
  </div>
  <div class="w-full flex flex-col justify-center items-center mt-10">
    <div class="w-[80%] space-y-3">
      <div class="flex justify-between items-center">
        <div class="text-primary text-3xl font-semibold">สินค้ายอดนิยม</div>
        <NuxtLink to="/products" class="btn lg:btn-md btn-sm btn-primary"
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
            :aria-label="category.category_name"
            :value="category.uuid"
            v-model="tabs"
          />
          <div class="tab-content p-0">
            <div :class="`grid grid-cols-4 gap-4 my-4`">
              <template v-for="row in rows.related_products">
                <CardTemplate :object="row" />
              </template>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
  <div class="w-full flex flex-col justify-center items-center mt-10">
    <div
      class="w-[80%] space-y-3 shadow-sm grid grid-cols-2 p-12 rounded-xl shadow-sm border border-base-content/10 gap-8"
    >
      <div>
        <img src="@/assets/images/logo_2.png" alt="..." class="max-h-50" />
        <div class="space-y-4">
          <div class="text-primary text-[28px] font-bold">
            ถูกครบจบดี คุ้มค่าทุกชิ้น ฟินทุกการช้อป
          </div>
          <div class="text-primary text-4xl font-bold">
            ต้อง "ฟินลี่แลนด์ พลาซ่า"
          </div>
        </div>
      </div>
      <div>
        <img
          src="@/assets/images/content.png"
          alt="..."
          class="rounded-lg border border-base-300 shadow-sm w-full"
        />
      </div>
      <div class="col-span-2 space-y-4">
        <div class="text-base-content/75 text-lg">
          ฟินลี่แลนด์ พลาซ่า อาณาจักรสินค้าราคาถูกที่ลูกค้าไว้วางใจมากว่า 15 ปี
          เรารวบรวมสินค้าเครื่องครัว ของใช้ในบ้าน สินค้าไลฟ์สไตล์
          และสินค้าอุปโภคบริโภคหลากหลายประเภท ให้เลือกมากกว่า 10,000 รายการ
          ครบครันในที่เดียว
        </div>
        <div class="text-base-content/75 text-lg">
          ด้วยประสบการณ์ด้านค้าปลีกที่ยาวนาน เราคัดสรรสินค้าคุณภาพดี ราคาคุ้มค่า
          เพื่อตอบโจทย์ทั้งลูกค้าทั่วไป ร้านค้า และผู้ประกอบการ
          หน้าร้านจัดเรียงสินค้าเป็นหมวดหมู่ เดินเลือกสะดวก
          พร้อมพนักงานคอยให้คำแนะนำอย่างเป็นกันเอง
        </div>
        <div class="text-base-content/75 text-lg">
          ฟินลี่แลนด์ พลาซ่า พร้อมเป็นจุดหมายของทุกความคุ้มค่า
        </div>
        <!-- <div class="space-x-2">
          <button class="btn btn-primary" @click="openMap">
            แผนที่ร้าน <Icon name="lucide:circle-arrow-right" size="18" />
          </button>
          <button class="btn btn-outline btn-error">
            โทรสอบถาม xx-xxx-xxxx
            <Icon name="lucide:circle-arrow-right" size="18" />
          </button>
        </div> -->
      </div>
    </div>
  </div>

  <div class="fab">
    <!-- a focusable div with tabindex is necessary to work on all browsers. role="button" is necessary for accessibility -->
    <div tabindex="0" role="button" class="btn btn-lg btn-circle btn-primary">
      F
    </div>
    <!-- buttons that show up when FAB is open -->
    <button class="btn btn-lg btn-circle">A</button>
    <button class="btn btn-lg btn-circle">B</button>
    <button class="btn btn-lg btn-circle">C</button>
  </div>
</template>

<script setup lang="ts">
const rows = ref<any>({
  categories: [],
  promotion: [],
  products: [],
  related_products: [],
});
const tabs = ref("af285599-4943-4786-b140-f2b9cd2aaf0e");

const openMap = () => {
  window.open("https://maps.app.goo.gl/QLdLX6w2srqyPVzM8", "_blank");
};

onMounted(async () => {
  const categories: any = await $fetch("/api/categories", {
    params: { pageSize: 999 },
  });
  rows.value.categories = categories.rows;

  const promotion: any = await $fetch(`/api/promotion`, {
    params: { now: true },
  });
  rows.value.promotion = promotion.rows;

  const relatedProducts: any = await $fetch(`/api/products`, {
    params: { pageSize: 12, category: tabs.value },
  });
  rows.value.related_products = relatedProducts.rows;

  const products: any = await $fetch(`/api/products`, {
    params: { pageSize: 12, orderBy: "product.created_at DESC" },
  });
  products.rows = products.rows.map((item: any) => ({
    ...item,
    image_url: item.image_url ? JSON.parse(item.image_url) : [],
  }));
  rows.value.products = products.rows;
});

watch(tabs, async (newValue) => {
  const relatedProducts: any = await $fetch(`/api/products`, {
    params: { pageSize: 12, category: newValue },
  });
  rows.value.related_products = relatedProducts.rows;
});
</script>
