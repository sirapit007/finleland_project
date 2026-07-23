<template>
  <div class="w-full flex justify-center">
    <div class="w-[80%] py-8 space-y-4">
      <div class="badge badge-sm badge-soft badge-primary py-3">
        <NuxtLink to="/">หน้าแรก</NuxtLink>/ ตะกร้าสินค้า
      </div>
      <div class="text-3xl text-base-content font-bold">
        ตะกร้าสินค้า
        <span class="text-xl text-base-content/50">(0 รายการ)</span>
      </div>
      <div class="flex">
        <div class="flex-1 space-y-2">
          <div class="overflow-x-auto border border-base-300 rounded-xl">
            <table class="table table-sm">
              <!-- head -->
              <thead>
                <tr class="bg-base-300 text-xs">
                  <th>สินค้า</th>
                  <th>ราคา</th>
                  <th>จำนวน</th>
                  <th>รวม</th>
                </tr>
              </thead>
              <tbody>
                <!-- row 1 -->
                <tr>
                  <th>1</th>
                  <td>Cy Ganderton</td>
                  <td>Quality Control Specialist</td>
                  <td>Blue</td>
                </tr>
                <!-- row 2 -->
                <tr>
                  <th>2</th>
                  <td>Hart Hagerty</td>
                  <td>Desktop Support Technician</td>
                  <td>Purple</td>
                </tr>
                <!-- row 3 -->
                <tr>
                  <th>3</th>
                  <td>Brice Swyre</td>
                  <td>Tax Accountant</td>
                  <td>Red</td>
                </tr>
              </tbody>
            </table>
          </div>
          <button class="btn">Default</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const openMap = () => {
  window.open("https://maps.app.goo.gl/QLdLX6w2srqyPVzM8", "_blank");
};
</script>
