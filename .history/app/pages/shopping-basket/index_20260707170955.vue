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
            <div class="space-y-3">
              <label class="block cursor-pointer">
                <input
                  type="radio"
                  v-model="delivery"
                  value="normal"
                  class="peer sr-only"
                />

                <div
                  class="flex items-start gap-3 rounded-lg border border-base-300 p-4 transition-all peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:ring-2 peer-checked:ring-primary"
                >
                  <div class="mt-1">
                    <div
                      class="flex h-5 w-5 items-center justify-center rounded-full border-2 border-base-300 peer-checked:border-primary"
                    >
                      <div
                        class="h-2.5 w-2.5 rounded-full bg-primary opacity-0 transition peer-checked:opacity-100"
                      />
                    </div>
                  </div>

                  <div class="flex-1">
                    <div class="flex items-center gap-2 font-semibold">
                      <Icon name="lucide:truck" size="18" />
                      จัดส่งทั่วประเทศ
                    </div>

                    <p class="text-sm text-base-content/70">โดยขนส่งเอกชน</p>

                    <div class="mt-2 flex items-center gap-4 text-sm">
                      <span class="font-semibold text-primary">
                        เริ่มต้น 35.-
                      </span>

                      <span class="text-base-content/70"> 2 - 4 วันทำการ </span>
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
                  class="flex items-start gap-3 rounded-lg border border-base-300 p-4 transition-all peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:ring-2 peer-checked:ring-primary"
                >
                  <div class="mt-1">
                    <div
                      class="flex h-5 w-5 items-center justify-center rounded-full border-2 border-base-300 peer-checked:border-primary"
                    >
                      <div
                        class="h-2.5 w-2.5 rounded-full bg-primary opacity-0 transition peer-checked:opacity-100"
                      />
                    </div>
                  </div>

                  <div class="flex-1">
                    <div class="flex items-center gap-2 font-semibold">
                      <Icon name="lucide:motorbike" size="18" />
                      ส่งด่วนใกล้บ้าน
                    </div>

                    <p class="text-sm text-base-content/70">ภายใน 1-2 ชม.</p>

                    <div class="mt-2 flex items-center gap-4 text-sm">
                      <span class="font-semibold text-primary">
                        เริ่มต้น 39.-
                      </span>

                      <span class="text-base-content/70">
                        เฉพาะพื้นที่ให้บริการ
                      </span>
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
