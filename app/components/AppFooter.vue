<template>
  <footer>
    <div class="flex justify-center">
      <div class="w-[82.5%] grid grid-cols-4 gap-8 py-16">
        <div class="space-y-3 text-sm text-base-content/75">
          <div class="font-bold text-base text-primary">เมนู</div>
          <div class="flex flex-col space-y-2">
            <div class="flex items-center gap-2" v-for="menu in menus">
              <Icon name="lucide:folder-open" size="15" />
              <NuxtLink :to="menu.path">{{ menu.title }}</NuxtLink>
            </div>
          </div>
        </div>
        <div class="space-y-4 text-sm text-base-content/75">
          <div class="font-semibold">สาขาเวียงสา</div>
          <div>เวียง 728 ม.4 ต.กลาง ตำบล กลางเวียง อำเภอเวียงสา น่าน 55110</div>
          <div>เปิดทุกวัน: 8:00 - 20:00 น.</div>
          <div class="flex items-center gap-2">
            <Icon name="lucide:phone-call" size="15" /> 0955979995
          </div>
        </div>
        <div class="space-y-4 text-sm text-base-content/75">
          <div class="font-semibold">สาขาเมืองน่าน</div>
          <div>37 21 22 ตำบล ในเวียง อ.เมือง น่าน 55000</div>
          <div>เปิดทุกวัน: 7:50 - 20:30 น.</div>
          <div class="flex items-center gap-2">
            <Icon name="lucide:phone-call" size="15" /> 0955979995
          </div>
        </div>
        <div class="space-y-4 text-sm text-base-content/75">
          <div class="font-semibold">สาขาพิษณุโลก</div>
          <div>ท่าโพธิ์ ตำบล ท่าโพธิ์ อำเภอเมืองพิษณุโลก พิษณุโลก 65000</div>
          <div>เปิดทุกวัน: 8:00 - 22:00 น.</div>
          <div class="flex items-center gap-2">
            <Icon name="lucide:phone-call" size="15" /> 055332111
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
</script>
