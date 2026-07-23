<template>
  <div class="w-full flex justify-center">
    <div class="w-[80%] py-8 space-y-4">
      <div class="badge badge-sm badge-soft badge-primary py-3">
        <NuxtLink to="/">หน้าแรก</NuxtLink>/ ตะกร้าสินค้า
      </div>
      <div class="text-3xl text-base-content font-bold">
        ตะกร้าสินค้า
        <span class="text-xl text-base-content/70">(0 รายการ)</span>
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
              <div class="text-base-content/70">ราคารวมสินค้า (0 ชิ้น)</div>
              <div>939</div>
            </div>
            <div class="flex justify-between text-sm gap-4">
              <div class="text-base-content/70">ส่วนลด</div>
              <div>40</div>
            </div>
            <hr class="text-base-300" />
            <div class="flex justify-between text-sm gap-4">
              <div>รวมเป็นเงิน</div>
              <div class="text-xl text-primary">899</div>
            </div>
            <hr class="text-base-300" />
            <div class="text-sm">ตัวเลือกการจัดส่ง</div>
            <div class="space-y-3">
              <label class="block cursor-pointer">
                <input
                  type="radio"
                  v-model="delivery"
                  value="normal"
                  class="peer sr-only"
                />

                <div
                  class="flex items-start gap-3 rounded-lg border border-base-300 p-4 transition-all peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:ring peer-checked:ring-primary"
                >
                  <div
                    class="flex-1 flex justify-between gap-8 text-base-content/70 text-sm font-semibold"
                  >
                    <div class="flex items-center gap-2">
                      <Icon name="lucide:truck" size="24" />
                      <div>
                        <p class="text-primary font-bold">จัดส่งทั่วประเทศ</p>
                        <p>โดยขนส่งเอกชน</p>
                      </div>
                    </div>

                    <div class="gap-2 text-right">
                      <p>
                        เริ่มต้น
                        <span class="text-base text-base-content">35.-</span>
                      </p>
                      <p class="text-xs">2 - 4 วันทำการ</p>
                    </div>
                  </div>
                </div>
              </label>

              <label class="block cursor-pointer">
                <input
                  type="radio"
                  v-model="delivery"
                  value="express"
                  class="peer sr-only"
                />

                <div
                  class="flex items-start gap-3 rounded-lg border border-base-300 p-4 transition-all peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:ring peer-checked:ring-primary"
                >
                  <div
                    class="flex-1 flex justify-between gap-8 text-base-content/70 text-sm font-semibold"
                  >
                    <div class="flex items-center gap-4">
                      <Icon name="lucide:motorbike" size="24" />
                      <div>
                        <p class="text-base-content font-bold">ส่งด่วนใกล้บ้าน</p>
                        <p class="text-secondary">ภายใน 1-2 ชม.</p>
                      </div>
                    </div>

                    <div class="gap-2 text-right">
                      <p>
                        เริ่มต้น
                        <span class="text-base text-base-content">39.-</span>
                      </p>
                      <p class="text-xs">(เฉพาะพื้นที่ให้บริการ)</p>
                    </div>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const delivery = ref("normal");
</script>
