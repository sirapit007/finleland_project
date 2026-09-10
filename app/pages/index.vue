<template>
  <div class="overflow-x-hidden">
    <section class="md:block hidden mx-auto w-full max-w-7xl pt-2 lg:pb-4 pb-24 px-2">
      <div class="relative">
        <img
          src="/images/content.png"
          alt=""
          class="block h-auto w-full rounded-4xl"
        />

        <div class="absolute inset-y-0 xl:p-12 p-8 xl:space-y-8 lg:space-y-4 space-y-2">
          <p class="lg:text-6xl sm:text-5xl text-4xl font-bold text-primary">
            ฟินลี่แลนด์ พลาซ่า
          </p>
          <p
            class="lg:text-4xl sm:text-3xl text-2xl font-bold leading-tight text-base-content/80"
          >
            อาณาจักรสินค้าราคาประหยัด
          </p>
          <p
            class="lg:text-xl sm:text-lg text-base font-semibold leading-relaxed text-base-content/60"
          >
            ครบทุกความต้องการเรื่องของใช้ในบ้านและไลฟ์สไตล์<br />
            สินค้าคุณภาพดี ราคาคุ้มค่า ใกล้บ้านคุณ
          </p>
          <div class="grid grid-cols-4 gap-1">
            <div class="flex flex-col items-center text-xs space-y-1.5">
              <div
                class="lg:bg-primary/5 bg-base-300 text-primary w-12 h-12 p-3 rounded-full w-fit"
              >
                <Icon name="lucide:tag" size="24" />
              </div>
              <div class="text-base-content/80 text-center">
                <p class="font-bold">ราคาประหยัด</p>
                <p>คุ้มค่าทุกการซื้อ</p>
              </div>
            </div>
            <div class="flex flex-col items-center text-xs space-y-1.5">
              <div
                class="lg:bg-primary/5 bg-base-300 text-primary w-12 h-12 p-3 rounded-full w-fit"
              >
                <Icon name="lucide:shopping-bag" size="24" />
              </div>
              <div class="text-base-content/80 text-center">
                <p class="font-bold">สินค้าครบครัน</p>
                <p>หลายหมวดหมู่</p>
              </div>
            </div>
            <div class="flex flex-col items-center text-xs space-y-1.5">
              <div
                class="lg:bg-primary/5 bg-base-300 text-primary w-12 h-12 p-3 rounded-full w-fit"
              >
                <Icon name="lucide:shield-check" size="24" />
              </div>
              <div class="text-base-content/80 text-center">
                <p class="font-bold">คุณภาพ</p>
                <p>มั่นใจทุกชิ้น</p>
              </div>
            </div>
            <div class="flex flex-col items-center text-xs space-y-1.5">
              <div
                class="lg:bg-primary/5 bg-base-300 text-primary w-12 h-12 p-3 rounded-full w-fit"
              >
                <Icon name="lucide:heart" size="24" />
              </div>
              <div class="text-base-content/80 text-center">
                <p class="font-bold">บริการด้วยใจ</p>
                <p>ใกล้บ้าน ใกล้คุณ</p>
              </div>
            </div>
          </div>
          <div class="flex justify-center gap-3">
            <NuxtLink
              to="/products"
              class="flex-1 btn btn-primary lg:text-base sm:text-sm text-xs lg:btn-lg sm:btn-md btn-sm w-fit"
            >
              <Icon
                name="material-symbols:shopping-cart-outline-rounded"
                size="22"
              />
              ดูสินค้าทั้งหมด
              <Icon name="lucide:chevron-right" size="22" />
            </NuxtLink>
            <NuxtLink
              to="/how-to-order"
              class="flex-1 btn btn-soft btn-primary lg:text-base sm:text-sm text-xs lg:btn-lg sm:btn-md btn-sm w-fit"
            >
              <Icon name="material-symbols:help-outline-rounded" size="22" />
              วิธีการสั่งซื้อ
            </NuxtLink>
          </div>
        </div>

        <div class="absolute lg:-bottom-10 -bottom-28 w-full flex justify-center">
          <div
            class="grid grid-cols-4 rounded-2xl bg-base-100 border border-base-300 xl:w-6xl lg:w-4xl w-2xl p-4"
          >
            <div class="flex items-center gap-3">
              <div
                class="bg-primary text-primary-content w-12 h-12 p-3 rounded-full"
              >
                <Icon name="lucide:store" size="24" />
              </div>
              <div>
                <p class="text-sm font-semibold">ร้านค้าท้องถิ่น</p>
                <p class="text-xs text-base-content/60">อยู่เคียงข้างชุมชน</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div
                class="bg-secondary text-secondary-content w-12 h-12 p-3 rounded-full"
              >
                <Icon name="lucide:users-round" size="24" />
              </div>
              <div>
                <p class="text-sm font-semibold">ลูกค้าไว้วางใจ</p>
                <p class="text-xs text-base-content/60">มากกว่า 100,000 คน</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div
                class="bg-primary text-primary-content w-12 h-12 p-3 rounded-full"
              >
                <Icon name="lucide:truck" size="24" />
              </div>
              <div>
                <p class="text-sm font-semibold">จัดส่งรวดเร็ว</p>
                <p class="text-xs text-base-content/60">บริการทั่วประเทศ</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div
                class="bg-secondary text-secondary-content w-12 h-12 p-3 rounded-full"
              >
                <Icon name="lucide:thumbs-up" size="24" />
              </div>
              <div>
                <p class="text-sm font-semibold">รับประกันความพึงพอใจ</p>
                <p class="text-xs text-base-content/60">
                  คืนสินค้าได้ตามเงื่อนไข
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="md:hidden block mx-auto w-full max-w-7xl pt-2 sm:pb-6 pb-22 px-2">
      <div class="relative flex justify-center">
        <img
          src="/images/content-mobile.png"
          alt=""
          class="block h-auto w-full rounded-4xl"
        />

        <div class="absolute inset-x-0 top-[2.5%] sm:space-y-4 space-y-2 px-4 text-center">
          <p
            class="text-[clamp(2rem,9vw,3rem)] font-bold leading-tight text-primary"
          >
            ฟินลี่แลนด์ พลาซ่า
          </p>
          <p
            class="text-[clamp(1.125rem,4.5vw,1.5rem)] font-semibold leading-tight text-base-content/80"
          >
            อาณาจักรสินค้าราคาประหยัด
          </p>
        </div>

        <div
          class="absolute inset-x-0 top-[22%] mx-auto w-[calc(100%-2rem)] max-w-[25rem] sm:space-y-6.5 space-y-0.5 text-center"
        >
          <p class="text-lg leading-relaxed text-base-content/60">
            ครบทุกความต้องการเรื่องของใช้<br />ในบ้านและไลฟ์สไตล์
          </p>
          <p class="text-sm leading-relaxed text-base-content/60">
            สินค้าคุณภาพดี ราคาคุ้มค่า ใกล้บ้านคุณ<br />
            คัดสรรสินค้าหลากหลายหมวดหมู่ ให้เลือกครบในที่เดียว
          </p>
          <div class="bg-base-100 p-1 grid grid-cols-4 gap-2 rounded-2xl">
            <div class="flex flex-col items-center text-[11px] space-y-1.5">
              <div
                class="bg-primary/5 text-primary w-12 h-12 p-3 rounded-full w-fit"
              >
                <Icon name="lucide:tag" size="24" />
              </div>
              <div class="text-base-content/80 text-center text-[9.5px]">
                <p class="font-bold">ราคาประหยัด</p>
                <p>คุ้มค่าทุกการซื้อ</p>
              </div>
            </div>
            <div class="flex flex-col items-center text-[11px] space-y-1.5">
              <div
                class="bg-primary/5 text-primary w-12 h-12 p-3 rounded-full w-fit"
              >
                <Icon name="lucide:shopping-bag" size="24" />
              </div>
              <div class="text-base-content/80 text-center text-[9.5px]">
                <p class="font-bold">สินค้าครบครัน</p>
                <p>หลายหมวดหมู่</p>
              </div>
            </div>
            <div class="flex flex-col items-center text-[11px] space-y-1.5">
              <div
                class="bg-primary/5 text-primary w-12 h-12 p-3 rounded-full w-fit"
              >
                <Icon name="lucide:shield-check" size="24" />
              </div>
              <div class="text-base-content/80 text-center text-[9.5px]">
                <p class="font-bold">คุณภาพ</p>
                <p>มั่นใจทุกชิ้น</p>
              </div>
            </div>
            <div class="flex flex-col items-center text-[11px] space-y-1.5">
              <div
                class="bg-primary/5 text-primary w-12 h-12 p-3 rounded-full w-fit"
              >
                <Icon name="lucide:heart" size="24" />
              </div>
              <div class="text-base-content/80 text-center text-[9.5px]">
                <p class="font-bold">บริการด้วยใจ</p>
                <p>ใกล้บ้าน ใกล้คุณ</p>
              </div>
            </div>
          </div>
          <div class="divider text-sm text-base-content/60 gap-2">
            <Icon name="lucide:store" size="18" class="shrink-0" />
            <span class="mt-1">ร้านค้าท้องถิ่น อยู่เคียงข้างชุมชน</span>
          </div>
        </div>

        <div
          class="absolute -bottom-24 w-full flex flex-col items-center justify-center max-w-xs"
        >
          <p class="font-semibold">สะดวก ครบ จบในที่เดียว</p>
          <div class="grid grid-cols-2 gap-4 mt-2">
            <NuxtLink
              to="/products"
              class="flex-1 flex flex-col btn btn-ghost bg-base-100 text-xs h-full w-full py-2"
            >
              <div
                class="bg-primary/5 text-primary w-14 h-14 p-3 rounded-full w-fit"
              >
                <Icon name="lucide:shopping-bag" size="32" />
              </div>
              <p class="text-primary text-sm">สินค้าของเรา</p>
              <p class="text-base-content/60 text-[8.5px]">
                เลือกซื้อสินค้าหลากหลายหมวดหมู่<br />
                ครบครัน คุณภาพดี ราคาประหยัด
              </p>
              <Icon
                name="lucide:chevron-right"
                size="22"
                class="text-primary"
              />
            </NuxtLink>
            <NuxtLink
              to="/how-to-order"
              class="flex-1 flex flex-col btn btn-ghost bg-base-100 text-xs h-full w-full py-2"
            >
              <div
                class="bg-primary/5 text-primary w-14 h-14 p-3 rounded-full w-fit"
              >
                <Icon name="lucide:clipboard-list" size="32" />
              </div>
              <p class="text-primary text-sm">วิธีการสั่งซื้อ</p>
              <p class="text-base-content/60 text-[8.5px]">
                ขั้นตอนง่าย สะดวก รวดเร็ว<br />
                สั่งซื้อได้ทุกที่ทุกเวลา
              </p>
              <Icon
                name="lucide:chevron-right"
                size="22"
                class="text-primary"
              />
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- <section class="bg-base-300 border-b border-base-content/10">
      <div
        class="space-y-3 mx-auto w-full max-w-3xl px-4 py-12 text-center sm:px-6 sm:py-16 lg:px-8 lg:py-20"
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
        <p class="mx-auto sm:text-base text-sm">
          ฟินลี่แลนด์ พลาซ่า
          อาณาจักรสินค้าราคาถูกที่ลูกค้าชาวน่านและพื้นที่ใกล้เคียงไว้วางใจมากว่า
          15 ปี เรารวบรวมสินค้าเครื่องครัว ของใช้ในบ้าน สินค้าไลฟ์สไตล์
          และสินค้าอุปโภคบริโภคหลากหลายหมวดหมู่ ให้เลือกครบในที่เดียว
        </p>
        <div class="flex justify-center gap-3">
          <NuxtLink
            to="/products"
            class="btn btn-primary sm:btn-md btn-sm w-fit"
          >
            สินค้าของเรา
            <Icon name="lucide:shopping-basket" size="18" />
          </NuxtLink>
          <NuxtLink
            to="/how-to-order"
            class="btn btn-outline btn-secondary btn-soft sm:btn-md btn-sm w-fit"
          >
            วิธีการสั่งซื้อ
            <Icon name="lucide:circle-arrow-right" size="18" />
          </NuxtLink>
        </div>
      </div>
    </section> -->

    <section
      class="mx-auto w-full max-w-7xl px-4 sm:px-2 lg:px-1 py-6 sm:py-8 lg:py-10"
    >
      <div class="relative overflow-hidden">
        <PromotionsCarousel />
      </div>
    </section>

    <section
      class="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10"
    >
      <div class="space-y-4">
        <h2 class="text-xl font-bold text-primary sm:text-2xl">
          หมวดหมู่สินค้า
        </h2>
        <div class="relative overflow-hidden">
          <CategoriesCarousel />
        </div>
      </div>
    </section>

    <section class="bg-base-200 border border-base-300">
      <div
        class="mx-auto flex w-full max-w-7xl flex-col items-center gap-5 px-4 py-10 text-center sm:px-6 md:flex-row md:text-left lg:px-8 lg:py-14"
      >
        <img
          src="@/assets/images/logo_2.png"
          alt="Finlyland Plaza"
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
      class="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10"
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
          <ProductsCarousel />
        </div>
      </div>
    </section>

    <section
      class="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10"
    >
      <div class="space-y-4">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-xl font-bold text-primary sm:text-2xl">
            สินค้าขายดี
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
          <ProductsCarousel ranking="best-selling" />
        </div>
      </div>
    </section>

    <section class="bg-base-200 border-t border-base-300">
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
const openMap = () => {
  window.open("https://maps.app.goo.gl/QLdLX6w2srqyPVzM8", "_blank");
};
</script>
