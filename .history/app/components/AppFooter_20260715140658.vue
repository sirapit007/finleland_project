<template>
  <footer>
    <div class="flex justify-center">
      <div class="w-[80%] grid grid-cols-5 gap-8 py-16">
        <div class="space-y-3 text-sm text-base-content/75">
          <div class="font-bold text-base text-primary">เมนู</div>
          <div class="flex flex-col space-y-2">
            <div
              class="flex items-center gap-2 hover:underline"
              v-for="menu in menus"
            >
              <Icon name="lucide:folder-open" size="15" />
              <NuxtLink :to="menu.path">{{ menu.title }}</NuxtLink>
            </div>
          </div>
        </div>
        <div class="space-y-4 text-sm text-base-content/75">
          <div class="font-semibold">สาขา ท่าวังผา</div>
          <div>30 ม.2 ต.ท่าวังผา อ.ท่าวังผา จ.น่าน 55110</div>
          <div>เปิดทุกวัน เวลา 08.00-20.00 น.</div>
          <div>
            <button
              class="btn btn-xs text-base-content/75 btn-link no-underline"
              @click="openMap"
            >
              <Icon name="lucide:map-pinned" size="18" /> แผนที่ร้าน
            </button>
          </div>
        </div>
        <div class="space-y-4 text-sm text-base-content/75">
          <div class="font-semibold">สาขา เมืองน่าน</div>
          <div>37/21-22 ต.ในเวียง อ.เมือง จ.น่าน 55000</div>
          <div>เปิดทุกวัน เวลา 08.00-20.30 น.</div>
          <div>
            <button
              class="btn btn-xs text-base-content/75 btn-link no-underline"
              @click="openMap"
            >
              <Icon name="lucide:map-pinned" size="18" /> แผนที่ร้าน
            </button>
          </div>
        </div>
        <div class="space-y-4 text-sm text-base-content/75">
          <div class="font-semibold">สาขา เวียงสา</div>
          <div>728 ม.4 ต.กลางเวียง อ.เวียงสา จ.น่าน 55110</div>
          <div>เปิดทุกวัน: 8:00 - 20:00 น.</div>
          <div>
            <button
              class="btn btn-xs text-base-content/75 btn-link no-underline"
              @click="openMap"
            >
              <Icon name="lucide:map-pinned" size="18" /> แผนที่ร้าน
            </button>
          </div>
        </div>
        <div class="space-y-4 text-sm text-base-content/75">
          <div class="font-semibold">ช่องทางติดต่อ</div>
          <div
            class="flex items-center gap-2 cursor-pointer hover:underline"
            v-on:click="openFacebook"
          >
            <Icon name="ri:facebook-fill" size="16" /> ฟินลี่แลนด์ พลาซ่า
            เวียงสา
          </div>
          <div
            class="flex items-center gap-2 cursor-pointer hover:underline"
            v-on:click="openTiktok"
          >
            <Icon name="ri:tiktok-fill" size="16" /> ฟินลี่แลนด์พลาซ่าน่าน
          </div>
          <div class="flex items-center gap-2">
            <Icon name="lucide:phone-call" size="14" /> 093-0166996
          </div>
          <div class="flex items-center gap-2">
            <Icon name="lucide:phone-call" size="14" /> 095-5979995
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const menus = ref([
  {
    path: "/",
    title: "หน้าแรก",
  },
  {
    path: "/products",
    title: "สินค้าทั้งหมด",
  },
  {
    path: "/how-to-order",
    title: "วิธีการสั่งซื้อ",
  },
]);
const route = useRoute();

const openFacebook = () => {
  window.open("https://www.facebook.com/Fillyland.Sa", "_blank");
};

const openTiktok = () => {
  window.open(
    "https://www.tiktok.com/@finlyland_nan?_r=1&_t=ZS-96vKCTNeshl",
    "_blank",
  );
};
</script>
