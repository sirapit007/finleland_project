<template>
  <footer class="border-t border-base-300 bg-base-100">
    <div class="mx-auto grid w-full max-w-7xl xl:grid-cols-5 lg:grid-cols-3 grid-cols-2 lg:py-12 gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6  xl:px-8">
      <section class="space-y-3 sm:text-sm text-xs text-base-content/75">
        <h2 class="font-bold text-base text-primary">เมนู</h2>
        <div class="flex flex-col gap-2">
          <NuxtLink
            v-for="menu in menus"
            :key="menu.path"
            :to="menu.path"
            class="flex items-center gap-2 transition-colors hover:text-primary hover:underline"
          >
            <Icon name="lucide:folder-open" size="15" />
            {{ menu.title }}
          </NuxtLink>
        </div>
      </section>

      <section class="space-y-3 sm:text-sm text-xs text-base-content/75">
        <h2 class="font-semibold">สาขาท่าวังผา</h2>
        <p>30 ม.2 ต.ท่าวังผา อ.ท่าวังผา จ.น่าน 55110</p>
        <p>เปิดทุกวัน เวลา 08.00-20.00 น.</p>
        <button class="btn btn-link no-underline sm:btn-sm btn-xs px-0 text-base-content/75" @click="openMap1">
          <Icon name="lucide:map-pinned" size="17" /> แผนที่ร้าน
        </button>
      </section>

      <section class="space-y-3 sm:text-sm text-xs text-base-content/75">
        <h2 class="font-semibold">สาขาเมืองน่าน</h2>
        <p>37/21-22 ต.ในเวียง อ.เมือง จ.น่าน 55000</p>
        <p>เปิดทุกวัน เวลา 08.00-20.30 น.</p>
        <button class="btn btn-link no-underline sm:btn-sm btn-xs px-0 text-base-content/75" @click="openMap2">
          <Icon name="lucide:map-pinned" size="17" /> แผนที่ร้าน
        </button>
      </section>

      <section class="space-y-3 sm:text-sm text-xs text-base-content/75">
        <h2 class="font-semibold">สาขาเวียงสา</h2>
        <p>728 ม.4 ต.กลางเวียง อ.เวียงสา จ.น่าน 55110</p>
        <p>เปิดทุกวัน เวลา 08.00-20.00 น.</p>
        <button class="btn btn-link no-underline sm:btn-sm btn-xs px-0 text-base-content/75" @click="openMap3">
          <Icon name="lucide:map-pinned" size="17" /> แผนที่ร้าน
        </button>
      </section>

      <section class="space-y-3 sm:text-sm text-xs text-base-content/75">
        <h2 class="font-semibold">ช่องทางติดต่อ</h2>
        <button
          class="flex items-center gap-2 text-left transition-colors hover:text-primary hover:underline"
          @click="openFacebook"
        >
          <Icon name="ri:facebook-fill" size="17" />
          ฟินลี่แลนด์ พลาซ่า เวียงสา
        </button>
        <button
          class="flex items-center gap-2 text-left transition-colors hover:text-primary hover:underline"
          @click="openTiktok"
        >
          <Icon name="ri:tiktok-fill" size="17" />
          ฟินลี่แลนด์พลาซ่าน่าน
        </button>
        <p class="flex items-center gap-2">
          <Icon name="lucide:phone-call" size="15" /> 093-0166996
        </p>
        <p class="flex items-center gap-2">
          <Icon name="lucide:phone-call" size="15" /> 095-5979995
        </p>
      </section>
    </div>
  </footer>
</template>

<script setup lang="ts">
const menus = [
  { path: "/", title: "หน้าแรก" },
  { path: "/products", title: "สินค้าทั้งหมด" },
  { path: "/how-to-order", title: "วิธีการสั่งซื้อ" },
];

const openFacebook = () => {
  window.open("https://www.facebook.com/Fillyland.Sa", "_blank");
};

const openTiktok = () => {
  window.open(
    "https://www.tiktok.com/@finlyland_nan?_r=1&_t=ZS-96vKCTNeshl",
    "_blank",
  );
};

const openMap1 = () => {
  window.open("https://maps.app.goo.gl/RtinAs3tdnZxWQdX8", "_blank");
};

const openMap2 = () => {
  window.open("https://maps.app.goo.gl/F5PHY1AbGQbno5vr8", "_blank");
};

const openMap3 = () => {
  window.open("https://maps.app.goo.gl/QLdLX6w2srqyPVzM8", "_blank");
};
</script>
