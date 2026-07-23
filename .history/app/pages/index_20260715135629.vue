<template>
  <div class="flex justify-center bg-base-300">
    <div class="max-w-2xl text-center space-y-3 py-20">
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
  </div>
  <div class="mx-auto w-full max-w-7xl px-0 py-6 sm:px-6 sm:py-8 lg:px-8">
    <div class="space-y-3">
      <div class="text-primary text-2xl font-bold">หมวดหมู่สินค้า</div>
      <div class="flex-1 relative overflow-hidden">
        <CategoriesAvatar :items="rows.categories" />
      </div>
    </div>
  </div>
  <div class="flex justify-center bg-base-200">
    <div class="max-w-7xl text-center space-y-3 py-10">
      <div class="flex items-center">
        <img src="@/assets/images/logo_2.png" alt="..." class="max-h-50" />
        <div class="space-y-4 text-left">
          <div class="text-secondary text-[28px] font-bold">
            ถูกครบจบดี คุ้มค่าทุกชิ้น ฟินทุกการช้อป
          </div>
          <div class="text-secondary text-4xl font-bold">
            ต้อง <span class="text-primary">"ฟินลี่แลนด์ พลาซ่า"</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="mx-auto w-full max-w-7xl px-0 py-6 sm:px-6 sm:py-8 lg:px-8">
    <div class="space-y-3">
      <div class="flex justify-between items-center">
        <div class="text-primary text-2xl font-bold">สินค้าแนะนำ</div>
        <NuxtLink
          to="/products"
          class="btn lg:btn-md btn-sm btn-ghost btn-primary"
          >ดูเพิ่มเติม <Icon name="lucide:circle-arrow-right" size="18"
        /></NuxtLink>
      </div>
      <div class="relative overflow-hidden">
        <CardCarouselProducts :data="rows.products" />
      </div>
    </div>
  </div>
  <div class="flex justify-center bg-base-200">
    <div class="max-w-6xl text-center space-y-3 py-10">
      <div class="text-left space-y-4">
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
        <div class="space-x-2">
          <button class="btn btn-primary btn-ghost" @click="openMap">
            <Icon name="lucide:map-pinned" size="18" /> แผนที่ร้าน
          </button>
          <!-- <button class="btn btn-outline btn-error">
            โทรสอบถาม xx-xxx-xxxx
            <Icon name="lucide:circle-arrow-right" size="18" />
          </button> -->
        </div>
      </div>
    </div>
  </div>

  <div class="fab">
    <div tabindex="0" role="button" class="btn btn-lg btn-circle btn-primary">
      F
    </div>
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
