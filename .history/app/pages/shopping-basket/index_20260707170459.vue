<template>
  <div class="w-full flex justify-center">
    <div class="w-[80%] py-8 space-y-4">
      <div class="badge badge-sm badge-soft badge-primary py-3">
        <NuxtLink to="/">หน้าแรก</NuxtLink>/ ตะกร้าสินค้า
      </div>
      <div class="text-3xl text-base-content font-bold">
        ตะกร้าสินค้า
        <span class="text-xl text-base-content/60">(0 รายการ)</span>
      </div>
      <div class="flex gap-4">
        <div class="flex-1 space-y-4">
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
          <div class="flex justify-between">
            <button class="btn btn-sm btn-ghost btn-error">
              <Icon name="lucide:trash-2" size="16" /> ลบสินค้าทั้งหมด
            </button>
            <button class="btn btn-sm btn-ghost btn-primary">
              <Icon name="lucide:refresh-ccw" size="16" /> อัปเดตตะกร้า
            </button>
          </div>
        </div>
        <div class="flex-none">
          <div
            class="border border-base-300 rounded-xl space-y-4 p-4 font-semibold"
          >
            <div class="font-bold">สรุปคำสั่งซื้อ</div>
            <div class="flex justify-between text-sm gap-8">
              <div class="text-base-content/60">ราคารวมสินค้า (0 ชิ้น)</div>
              <div>939</div>
            </div>
            <div class="flex justify-between text-sm gap-4">
              <div class="text-base-content/60">ส่วนลด</div>
              <div>40</div>
            </div>
            <hr class="text-base-300" />
            <div class="flex justify-between text-sm gap-4">
              <div>รวมเป็นเงิน</div>
              <div class="text-xl text-primary">899</div>
            </div>
            <hr class="text-base-300" />
            <div class="text-sm">ตัวเลือกการจัดส่ง</div>
            <div class="border border-base-300">
              <input type="radio" name="radio-1" class="radio" checked="true" />
              <div><Icon name="lucide:truck" size="16" /> จัดส่งทั่วประเทศ</div>
            </div>
            <div>
              <input type="radio" name="radio-1" class="radio" />
              <div><Icon name="lucide:motorbike" size="16" /> ส่งด่วนใกล้บ้าน</div>
            </div>
          </div>
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
