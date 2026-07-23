<template>
  <div class="w-full flex justify-center">
    <div class="w-[80%] py-8 space-y-4">
      <div class="badge badge-sm badge-soft badge-primary py-3">
        <NuxtLink to="/">หน้าแรก</NuxtLink>/ ตะกร้าสินค้า
      </div>
      <div class="text-3xl text-base-content font-bold">
        ตะกร้าสินค้า
        <span class="text-xl text-base-content/70">({{ basketRows.length }} รายการ)</span>
      </div>
      <p v-if="errorMessage" class="text-sm text-error">{{ errorMessage }}</p>
      <div class="flex flex-col gap-4 lg:flex-row">
        <div class="flex-1 space-y-4">
          <div class="overflow-x-auto border border-base-300 rounded-xl">
            <table class="table table-sm">
              <thead>
                <tr class="bg-base-300 text-xs">
                  <th>สินค้า</th>
                  <th class="text-right">ราคา</th>
                  <th class="text-right">จำนวน</th>
                  <th class="text-right">รวม</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="isLoading && !basketRows.length">
                  <td colspan="4" class="py-8 text-center">
                    <span class="loading loading-spinner loading-sm" />
                  </td>
                </tr>
                <tr v-else-if="!basketRows.length">
                  <td colspan="4" class="py-8 text-center text-base-content/50">
                    ยังไม่มีสินค้าในตะกร้า
                  </td>
                </tr>
                <tr v-for="(basket, index) in basketRows" :key="basket.uuid">
                  <th>{{ index + 1 }}</th>
                  <td>{{ basket.basket_product }}</td>
                  <td class="text-right">฿{{ formatPrice(unitPrice(basket)) }}</td>
                  <td class="text-right">{{ basket.basket_quantity }}</td>
                  <td class="text-right font-semibold">฿{{ formatPrice(basket.basket_total) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="flex justify-between">
            <button
              class="btn btn-sm btn-ghost btn-error"
              :disabled="!basketRows.length || isClearing"
              @click="onClearBasket"
            >
              <Icon name="lucide:trash-2" size="16" /> ลบสินค้าทั้งหมด
            </button>
            <button class="btn btn-sm btn-ghost btn-primary" :disabled="isLoading" @click="onRefreshBasket">
              <Icon name="lucide:refresh-ccw" size="16" :class="isLoading ? 'animate-spin' : ''" /> อัปเดตตะกร้า
            </button>
          </div>
        </div>
        <div class="flex-none">
          <div class="border border-base-300 rounded-xl space-y-4 p-4 font-semibold">
            <div class="font-bold">สรุปคำสั่งซื้อ</div>
            <div class="flex justify-between text-sm gap-8">
              <div class="text-base-content/70">ราคารวมสินค้า ({{ totalQuantity }} ชิ้น)</div>
              <div>฿{{ formatPrice(subtotal) }}</div>
            </div>
            <div class="flex justify-between text-sm gap-4">
              <div class="text-base-content/70">ส่วนลด</div>
              <div>฿0.00</div>
            </div>
            <hr class="text-base-300" />
            <div class="flex justify-between text-sm gap-4">
              <div>รวมเป็นเงิน</div>
              <div class="text-xl text-primary">฿{{ formatPrice(subtotal) }}</div>
            </div>
            <hr class="text-base-300" />
            <div class="text-sm">ตัวเลือกการจัดส่ง</div>
            <div class="space-y-3">
              <label class="block cursor-pointer">
                <input v-model="delivery" type="radio" value="normal" class="peer sr-only" />
                <div class="flex items-start gap-3 rounded-lg border border-base-300 p-4 transition-all peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:ring peer-checked:ring-primary">
                  <div class="flex-1 flex justify-between gap-8 text-base-content/70 text-sm font-semibold">
                    <div class="flex items-center gap-2">
                      <Icon name="lucide:truck" size="24" />
                      <div class="space-y-1">
                        <p class="text-primary font-bold">จัดส่งทั่วประเทศ</p>
                        <p>โดยขนส่งเอกชน</p>
                      </div>
                    </div>
                    <div class="gap-2 text-right">
                      <p>เริ่มต้น <span class="text-base text-base-content">35.-</span></p>
                      <p class="text-xs">2 - 4 วันทำการ</p>
                    </div>
                  </div>
                </div>
              </label>
              <label class="block cursor-pointer">
                <input v-model="delivery" type="radio" value="express" class="peer sr-only" />
                <div class="flex items-start gap-3 rounded-lg border border-base-300 p-4 transition-all peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:ring peer-checked:ring-primary">
                  <div class="flex-1 flex justify-between gap-8 text-base-content/70 text-sm font-semibold">
                    <div class="flex items-center gap-2">
                      <Icon name="lucide:motorbike" size="24" />
                      <div class="space-y-1">
                        <p class="text-base-content font-bold">ส่งด่วนใกล้บ้าน</p>
                        <p class="text-secondary">ภายใน 1-2 ชม.</p>
                      </div>
                    </div>
                    <div class="gap-2 text-right">
                      <p>เริ่มต้น <span class="text-base text-base-content">39.-</span></p>
                      <p class="text-xs">(เฉพาะพื้นที่ให้บริการ)</p>
                    </div>
                  </div>
                </div>
              </label>
            </div>
            <button class="btn btn-primary w-full" :disabled="subtotal < 1500">ดำเนินการสั่งซื้อ</button>
            <button class="btn btn-primary btn-outline btn-sm w-full">
              <Icon name="lucide:tag" size="14" /> ใส่โค้ดส่วนลด
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const delivery = ref("normal");
const errorMessage = ref("");
const isClearing = ref(false);
const { activeItems, clearBasket, isLoading, refreshBasket } = useBasket();

const basketRows = activeItems;
const totalQuantity = computed(() =>
  basketRows.value.reduce(
    (total, basket) => total + Number(basket.basket_quantity || 0),
    0,
  ),
);
const subtotal = computed(() =>
  basketRows.value.reduce(
    (total, basket) => total + Number(basket.basket_total || 0),
    0,
  ),
);

const unitPrice = (basket: any) => {
  const quantity = Number(basket.basket_quantity || 0);
  return quantity > 0 ? Number(basket.basket_total || 0) / quantity : 0;
};

const formatPrice = (value: number | string) =>
  new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const onRefreshBasket = async () => {
  errorMessage.value = "";

  try {
    await refreshBasket();
  } catch {
    errorMessage.value = "ไม่สามารถโหลดตะกร้าสินค้าได้";
  }
};

const onClearBasket = async () => {
  errorMessage.value = "";
  isClearing.value = true;

  try {
    await clearBasket();
  } catch {
    errorMessage.value = "ไม่สามารถลบสินค้าในตะกร้าได้";
  } finally {
    isClearing.value = false;
  }
};

onMounted(() => {
  void onRefreshBasket();
});
</script>
