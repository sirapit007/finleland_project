<template>
  <div class="overflow-x-hidden">
    <section class="bg-base-300">
      <div
        class="space-y-2 mx-auto w-full max-w-3xl px-4 py-14 text-center sm:px-6 sm:py-18 lg:px-8 lg:py-20"
      >
        <p class="sm:text-6xl text-5xl font-bold text-primary">
          ฟินลี่แลนด์ พลาซ่า
        </p>
        <h1
          class="lg:text-4xl sm:text-3xl text-2xl font-bold leading-tight text-primary"
        >
          อาณาจักรสินค้าราคาประหยัด
        </h1>
        <p
          class="lg:text-3xl sm:text-2xl text-xl font-bold leading-relaxed text-secondary"
        >
          ครบทุกความต้องการเรื่องของใช้ในบ้านและไลฟ์สไตล์
        </p>
        <p class="lg:text-5xl sm:text-4xl text-3xl font-bold text-error">
          ไว้วางใจโดยลูกค้ามากว่า 15 ปี
        </p>
        <p
          class="mx-auto max-w-3xl text-sm font-medium leading-7 sm:text-base"
        >
          ฟินลี่แลนด์ พลาซ่า
          อาณาจักรสินค้าราคาถูกที่ลูกค้าชาวน่านและพื้นที่ใกล้เคียงไว้วางใจมากว่า
          15 ปี เรารวบรวมสินค้าเครื่องครัว ของใช้ในบ้าน สินค้าไลฟ์สไตล์
          และสินค้าอุปโภคบริโภคหลากหลายหมวดหมู่ ให้เลือกครบในที่เดียว
        </p>
        <div class="flex flex-col justify-center gap-3 sm:flex-row">
          <NuxtLink to="/products" class="btn btn-primary w-full sm:w-auto">
            สินค้าของเรา
            <Icon name="lucide:shopping-basket" size="18" />
          </NuxtLink>
          <NuxtLink
            to="/how-to-order"
            class="btn btn-outline btn-secondary w-full sm:w-auto"
          >
            วิธีการสั่งซื้อ
            <Icon name="lucide:circle-arrow-right" size="18" />
          </NuxtLink>
        </div>
      </div>
    </section>

    <section
      class="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8"
    >
      <div class="space-y-4">
        <h2 class="text-xl font-bold text-primary sm:text-2xl">
          หมวดหมู่สินค้า
        </h2>
        <div class="relative overflow-hidden">
          <CategoriesAvatar :items="rows.categories" />
        </div>
      </div>
    </section>

    <section class="bg-base-200">
      <div
        class="mx-auto flex w-full max-w-7xl flex-col items-center gap-5 px-4 py-10 text-center sm:px-6 md:flex-row md:text-left lg:px-8 lg:py-14"
      >
        <img
          src="@/assets/images/logo_2.png"
          alt="Finleland Plaza"
          class="w-52 shrink-0 object-contain sm:w-64 lg:w-76"
        />
        <div class="space-y-3">
          <p class="text-xl font-bold text-secondary sm:text-2xl lg:text-3xl">
            ถูกครบจบดี คุ้มค่าทุกชิ้น ฟินทุกการช้อป
          </p>
          <p class="text-2xl font-bold text-secondary sm:text-3xl lg:text-4xl">
            ต้อง <span class="text-primary">“ฟินลี่แลนด์ พลาซ่า”</span>
          </p>
        </div>
      </div>
    </section>

    <section
      class="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8"
    >
      <div class="space-y-4">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-xl font-bold text-primary sm:text-2xl">
            สินค้าแนะนำ
          </h2>
          <NuxtLink
            to="/products"
            class="btn btn-ghost btn-primary btn-sm sm:btn-md"
          >
            ดูเพิ่มเติม
            <Icon name="lucide:chevrons-right" size="18" />
          </NuxtLink>
        </div>
        <div class="relative overflow-hidden">
          <CardCarouselProducts :data="rows.products" />
        </div>
      </div>
    </section>

    <section class="bg-base-200">
      <div class="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div
          class="relative space-y-4 text-sm italic leading-7 text-base-content/75 sm:text-base sm:leading-8"
        >
          <p class="indent-6 sm:indent-8">
            “ฟินลี่แลนด์ พลาซ่า อาณาจักรสินค้าราคาถูกที่ลูกค้าไว้วางใจมากว่า 15
            ปี เรารวบรวมสินค้าเครื่องครัว ของใช้ในบ้าน สินค้าไลฟ์สไตล์
            และสินค้าอุปโภคบริโภคหลากหลายประเภท ให้เลือกมากกว่า 10,000
            รายการครบครันในที่เดียว”
          </p>
          <p class="indent-6 sm:indent-8">
            “ด้วยประสบการณ์ด้านค้าปลีกที่ยาวนาน เราคัดสรรสินค้าคุณภาพดี
            ราคาคุ้มค่า เพื่อตอบโจทย์ทั้งลูกค้าทั่วไป ร้านค้า และผู้ประกอบการ
            พร้อมพนักงานคอยให้คำแนะนำอย่างเป็นกันเอง”
          </p>
          <p class="indent-6 sm:indent-8">
            “ฟินลี่แลนด์ พลาซ่า พร้อมเป็นจุดหมายของทุกความคุ้มค่า”
          </p>
          <div class="pt-2 text-center sm:text-right">
            <button
              class="btn btn-link btn-primary no-underline"
              @click="openMap"
            >
              <Icon name="lucide:map-pinned" size="18" /> แผนที่ร้าน
            </button>
          </div>
        </div>
      </div>
    </section>
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

  const promotion: any = await $fetch("/api/promotion", {
    params: { now: true },
  });
  rows.value.promotion = promotion.rows;

  const relatedProducts: any = await $fetch("/api/products", {
    params: { pageSize: 12, category: tabs.value },
  });
  rows.value.related_products = relatedProducts.rows;

  const products: any = await $fetch("/api/products", {
    params: { pageSize: 12, orderBy: "product.created_at DESC" },
  });
  products.rows = products.rows.map((item: any) => ({
    ...item,
    image_url: item.image_url ? JSON.parse(item.image_url) : [],
  }));
  rows.value.products = products.rows;
});

watch(tabs, async (newValue) => {
  const relatedProducts: any = await $fetch("/api/products", {
    params: { pageSize: 12, category: newValue },
  });
  rows.value.related_products = relatedProducts.rows;
});
</script>
