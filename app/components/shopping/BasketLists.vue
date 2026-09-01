<template>
  <div class="overflow-x-auto rounded-xl border border-base-300">
    <table
      class="table border-separate border-spacing-0"
      :class="basketRows.length ? 'min-w-200' : 'min-w-full'"
    >
      <thead>
        <tr class="bg-base-200 text-xs text-base-content/70">
          <th class="w-[52%] px-5 py-4">สินค้า</th>
          <th class="px-4 py-4 text-right">ราคา</th>
          <th class="px-4 py-4 text-center">จำนวน</th>
          <th class="px-5 py-4 text-right">รวม</th>
        </tr>
      </thead>
      <tbody>
        <SkeletonTableRows
          v-if="isLoading && !basketRows.length"
          :columns="4"
          :rows="4"
          :image-column="0"
        />
        <tr v-else-if="!basketRows.length">
          <td colspan="4" class="py-14 text-center">
            <Icon
              name="lucide:shopping-basket"
              size="34"
              class="mx-auto mb-3 text-base-content/30"
            />
            <p class="font-semibold">ยังไม่มีสินค้าในตะกร้า</p>
            <p class="mt-1 text-sm text-base-content/55">
              เลือกสินค้าที่ต้องการ แล้วกลับมาดำเนินการสั่งซื้อได้ที่นี่
            </p>
          </td>
        </tr>
        <tr
          v-for="basket in basketRows"
          :key="basket.uuid"
          class="border-base-300 last:border-0"
        >
          <td class="border-t border-base-300 px-5 py-4">
            <div class="flex min-w-90 items-center gap-4">
              <img
                v-if="productImage(basket)"
                :src="productImage(basket)"
                class="size-20 shrink-0 rounded-xl border border-base-300 bg-base-100 object-contain"
              />
              <img
                v-else
                src="@/assets/images/blank.png"
                class="size-20 shrink-0 rounded-xl border border-base-300 bg-base-100 object-contain"
              />
              <div class="min-w-0">
                <p class="truncate font-bold text-base-content">
                  {{ basket.product_name || basket.basket_product }}
                </p>
                <p
                  v-if="basket.product_code"
                  class="mt-1 text-xs text-base-content/55"
                >
                  รหัสสินค้า {{ basket.product_code }}
                </p>
                <p v-else class="mt-1 text-xs text-base-content/55">
                  สินค้าในตะกร้า
                </p>
                <div
                  v-if="pricingFor(basket).hasPromotion"
                  class="mt-2 rounded-lg border px-2.5 py-2 text-xs"
                  :class="
                    pricingFor(basket).isEligible
                      ? 'border-success/30 bg-success/10 text-success-content'
                      : 'border-warning/30 bg-warning/10 text-warning-content'
                  "
                >
                  <p class="flex items-center gap-1 font-semibold">
                    <Icon
                      :name="
                        pricingFor(basket).isEligible
                          ? 'lucide:badge-check'
                          : 'lucide:circle-alert'
                      "
                      size="14"
                    />
                    {{
                      pricingFor(basket).isEligible
                        ? "ใช้ราคาพิเศษแล้ว"
                        : "ยังไม่ถึงเงื่อนไขส่วนลด"
                    }}
                  </p>
                  <p class="mt-1 leading-5">
                    {{ pricingFor(basket).message }}
                  </p>
                </div>
                <button
                  class="btn btn-ghost btn-xs mt-2 -ml-2 text-base-content/55 hover:text-error"
                  :disabled="isItemUpdating(basket.uuid)"
                  @click="requestRemoveBasketItem(basket)"
                >
                  <Icon name="lucide:trash-2" size="14" /> ลบรายการ
                </button>
              </div>
            </div>
          </td>
          <td class="border-t border-base-300 px-4 py-4 text-right">
            <p
              v-if="pricingFor(basket).isEligible"
              class="text-xs text-base-content/45 line-through"
            >
              ฿{{ formatPrice(pricingFor(basket).normalUnitPrice) }}
            </p>
            <p
              class="font-bold"
              :class="
                pricingFor(basket).isEligible ? 'text-error' : 'text-primary'
              "
            >
              ฿{{ formatPrice(pricingFor(basket).unitPrice) }}
            </p>
            <span
              v-if="pricingFor(basket).isEligible"
              class="badge badge-xs badge-error badge-soft mt-1"
            >
              ราคาพิเศษ
            </span>
          </td>
          <td class="border-t border-base-300 px-4 py-4 text-center">
            <div class="join">
              <button
                class="btn btn-sm join-item"
                :disabled="isItemUpdating(basket.uuid)"
                @click="onChangeQuantity(basket, -1)"
              >
                <Icon name="lucide:minus" size="16" />
              </button>
              <span
                class="btn btn-sm join-item pointer-events-none w-12 bg-base-100 font-semibold"
              >
                <Icon
                  v-if="isItemUpdating(basket.uuid)"
                  name="lucide:loader-circle"
                  size="15"
                  class="animate-spin"
                />
                <template v-else>{{ basket.basket_quantity }}</template>
              </span>
              <button
                class="btn btn-sm join-item"
                :disabled="isItemUpdating(basket.uuid)"
                @click="onChangeQuantity(basket, 1)"
              >
                <Icon name="lucide:plus" size="16" />
              </button>
            </div>
          </td>
          <td class="border-t border-base-300 px-5 py-4 text-right">
            <p
              v-if="pricingFor(basket).discount > 0"
              class="text-xs text-base-content/45 line-through"
            >
              ฿{{ formatPrice(pricingFor(basket).originalTotal) }}
            </p>
            <p
              class="text-lg font-bold"
              :class="
                pricingFor(basket).discount > 0 ? 'text-error' : 'text-primary'
              "
            >
              ฿{{ formatPrice(pricingFor(basket).total) }}
            </p>
            <p
              v-if="pricingFor(basket).discount > 0"
              class="mt-1 text-xs font-semibold text-success"
            >
              ประหยัด ฿{{ formatPrice(pricingFor(basket).discount) }}
            </p>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
    <button
      class="btn btn-outline btn-error btn-sm"
      :disabled="!basketRows.length || isClearing"
      @click="requestClearBasket"
    >
      <Icon name="lucide:trash-2" size="16" /> ลบสินค้าทั้งหมด
    </button>
    <button
      class="btn btn-outline btn-primary btn-sm"
      :disabled="isLoading"
      @click="onRefreshBasket"
    >
      <Icon
        name="lucide:refresh-cw"
        size="16"
        :class="isLoading ? 'animate-spin' : ''"
      />
      อัปเดตตะกร้า
    </button>
  </div>
</template>

<script setup lang="ts">
const {
  isLoading,
  isItemUpdating,
  updateBasketQuantity,
  refreshBasket
} = useBasket();

const basketRows = defineModel<any[]>("basketRows", {
  default: [],
});

const errorMessage = defineModel<string>("errorMessage", {
  default: "",
});

const confirmBasketTarget = defineModel<string>("confirmBasketTarget", {
  default: "",
});

const confirmAction = defineModel<string>("confirmAction", {
  default: "",
});

const isConfirmModalOpen = defineModel<boolean>("isConfirmModalOpen", {
  default: false,
});

const props = defineProps<{
  isClearing: boolean;
  pricingFor: (basket: any) => {
    unitPrice: number;
    normalUnitPrice: number;
    total: number;
    originalTotal: number;
    discount: number;
    hasPromotion: boolean;
    isEligible: boolean;
    message: string;
  };
  formatPrice: (price: number) => string;
}>();

const productImage = (basket: any) => {
  if (Array.isArray(basket.image_url)) {
    return basket.image_url[0] || "";
  }

  if (typeof basket.image_url !== "string") {
    return "";
  }

  try {
    const images = JSON.parse(basket.image_url);
    return Array.isArray(images) ? images[0] || "" : basket.image_url;
  } catch {
    return basket.image_url;
  }
};

const onChangeQuantity = async (basket: any, amount: number) => {
  errorMessage.value = "";
  try {
    await updateBasketQuantity(basket, Number(basket.basket_quantity) + amount);
  } catch {
    errorMessage.value = "ไม่สามารถอัปเดตจำนวนสินค้าได้";
  }
};

const onRefreshBasket = async () => {
  errorMessage.value = "";
  try {
    await refreshBasket();
  } catch {
    errorMessage.value = "ไม่สามารถโหลดตะกร้าสินค้าได้";
  }
};

const requestRemoveBasketItem = (basket: any) => {
  confirmBasketTarget.value = basket;
  confirmAction.value = "remove";
  isConfirmModalOpen.value = true;
};

const requestClearBasket = () => {
  confirmAction.value = "clear";
  isConfirmModalOpen.value = true;
};
</script>
