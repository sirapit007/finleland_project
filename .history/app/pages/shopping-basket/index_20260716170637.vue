<template>
  <div
    class="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10"
  >
    <div class="space-y-4">
      <div class="badge badge-sm badge-soft badge-primary py-3">
        <NuxtLink to="/">หน้าแรก</NuxtLink>
        <Icon name="lucide:chevron-right" size="15" />
        <span class="text-base-content">ตะกร้าสินค้า</span>
      </div>

      <div
        class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <h1 class="text-3xl font-bold tracking-tight sm:text-4xl">
            ตะกร้าสินค้า
          </h1>
          <p class="mt-1 text-sm text-base-content/60">
            {{ basketRows.length }} รายการ, {{ totalQuantity }} ชิ้น
          </p>
        </div>
        <NuxtLink
          to="/products"
          class="btn btn-ghost btn-sm self-start text-primary sm:self-auto"
        >
          เลือกซื้อสินค้าต่อ <Icon name="lucide:arrow-right" size="16" />
        </NuxtLink>
      </div>

      <section
        class="rounded-xl border border-base-300 bg-base-200/40 p-4 sm:p-5"
      >
        <div
          class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
        >
          <div class="flex gap-3">
            <div
              class="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
            >
              <Icon name="lucide:map-pin" size="21" />
            </div>
            <div>
              <div class="mb-1 flex flex-wrap items-center gap-2">
                <h2 class="font-bold">ที่อยู่จัดส่ง</h2>
                <span class="text-xs text-primary font-semibold">
                  ( {{ shippingAddresses.length }} ที่อยู่ )
                </span>
                <span
                  v-if="selectedShippingAddress"
                  class="badge badge-sm badge-soft badge-success"
                >
                  กำลังใช้งาน
                </span>
              </div>

              <template v-if="selectedShippingAddress">
                <p class="text-sm font-semibold">
                  {{ selectedShippingAddress.shipping_label }}:
                  {{ selectedShippingAddress.shipping_recipient }}
                </p>
                <p
                  class="mt-1 max-w-3xl text-sm leading-6 text-base-content/65"
                >
                  {{ formatShippingAddress(selectedShippingAddress) }}
                </p>
                <p class="text-sm text-base-content/65">
                  {{ selectedShippingAddress.shipping_phone }}
                </p>
                <p
                  v-if="selectedShippingAddress.shipping_note"
                  class="mt-1 text-xs text-base-content/55"
                >
                  หมายเหตุ: {{ selectedShippingAddress.shipping_note }}
                </p>
              </template>
              <template v-else>
                <p class="text-sm font-semibold text-base-content/70">
                  ยังไม่มีที่อยู่จัดส่ง
                </p>
                <p class="mt-1 text-sm text-base-content/55">
                  เพิ่มที่อยู่ไว้ก่อนเพื่อใช้ตอนสั่งซื้อ
                </p>
              </template>
            </div>
          </div>

          <div class="flex shrink-0 flex-wrap gap-2">
            <button
              class="btn btn-outline btn-sm"
              :disabled="isShippingLoading"
              @click="openSelectAddressModal"
            >
              <Icon name="lucide:map-pinned" size="16" /> เลือกที่อยู่
            </button>
          </div>
        </div>
      </section>

      <p
        v-if="errorMessage"
        class="rounded-lg bg-error/10 px-4 py-3 text-sm text-error"
      >
        {{ errorMessage }}
      </p>
      <p
        v-if="shippingError"
        class="rounded-lg bg-warning/10 px-4 py-3 text-sm text-warning-content"
      >
        {{ shippingError }}
      </p>
      <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section class="min-w-0 space-y-4">
          <div class="overflow-x-auto rounded-xl border border-base-300">
            <table class="table min-w-200 border-separate border-spacing-0">
              <thead>
                <tr class="bg-base-200/80 text-xs text-base-content/70">
                  <th class="w-[52%] px-5 py-4">สินค้า</th>
                  <th class="px-4 py-4 text-right">ราคา</th>
                  <th class="px-4 py-4 text-center">จำนวน</th>
                  <th class="px-5 py-4 text-right">รวม</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="isLoading && !basketRows.length">
                  <td colspan="4" class="py-14 text-center">
                    <span
                      class="loading loading-spinner loading-md text-primary"
                    />
                  </td>
                </tr>
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
                        pricingFor(basket).isEligible
                          ? 'text-error'
                          : 'text-primary'
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
                        pricingFor(basket).discount > 0
                          ? 'text-error'
                          : 'text-primary'
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

          <div
            class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between"
          >
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
        </section>

        <aside
          class="rounded-xl border border-base-300 bg-base-100 p-5 lg:sticky lg:top-6"
        >
          <h2 class="text-xl font-bold">สรุปคำสั่งซื้อ</h2>

          <div class="mt-5 rounded-xl bg-base-200/80 p-4">
            <div class="flex items-center gap-2">
              <Icon name="lucide:map-pin" size="18" class="text-primary" />
              <p class="font-semibold">ที่อยู่จัดส่ง</p>
            </div>
            <template v-if="selectedShippingAddress">
              <p class="mt-3 text-sm font-semibold">
                {{ selectedShippingAddress.shipping_label }}:
                {{ selectedShippingAddress.shipping_recipient }}
              </p>
              <p class="mt-1 text-sm text-base-content/65">
                {{ formatShippingAddress(selectedShippingAddress) }}
              </p>
              <p class="mt-1 text-sm text-base-content/65">
                {{ selectedShippingAddress.shipping_phone }}
              </p>
            </template>
            <template v-else>
              <p class="mt-3 text-sm text-base-content/55">
                ยังไม่ได้เลือกที่อยู่จัดส่ง
              </p>
            </template>
          </div>

          <div class="mt-5 space-y-3 text-sm">
            <div class="flex justify-between gap-4 text-base-content/70">
              <span>ราคารวมสินค้า ({{ totalQuantity }} ชิ้น)</span>
              <span class="font-semibold text-base-content"
                >฿{{ formatPrice(originalSubtotal) }}</span
              >
            </div>
            <div class="flex justify-between gap-4 text-success">
              <span class="flex items-center gap-1">
                <Icon name="lucide:badge-percent" size="15" /> ส่วนลดโปรโมชั่น
              </span>
              <span class="font-semibold"
                >-฿{{ formatPrice(totalDiscount) }}</span
              >
            </div>
            <div class="flex justify-between gap-4 text-base-content/70">
              <span>ค่าจัดส่ง</span>
              <span class="font-semibold text-base-content"
                >฿{{ formatPrice(shippingFee) }}</span
              >
            </div>
            <div class="flex justify-between gap-4 text-base-content/70">
              <span>ส่วนลด</span>
              <span class="font-semibold text-base-content">-฿0.00</span>
            </div>
          </div>

          <div class="my-5 border-t border-base-300" />

          <div class="flex items-end justify-between gap-4">
            <div>
              <p class="font-bold">รวมเป็นเงิน</p>
              <p class="mt-1 text-xs text-base-content/55">
                รวมภาษีมูลค่าเพิ่มแล้ว
              </p>
            </div>
            <p class="text-3xl font-bold text-primary">
              ฿{{ formatPrice(grandTotal) }}
            </p>
          </div>

          <div class="my-5 border-t border-base-300" />

          <h3 class="mb-3 text-sm font-bold">ตัวเลือกการจัดส่ง</h3>
          <div class="space-y-2">
            <label
              v-for="option in deliveryOptions"
              :key="option.id"
              class="block cursor-pointer"
            >
              <input
                v-model="delivery"
                type="radio"
                :value="option.id"
                class="peer sr-only"
              />
              <div
                class="flex items-center gap-3 rounded-lg border border-base-300 p-3 transition peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:ring-1 peer-checked:ring-primary"
              >
                <Icon
                  :name="option.icon"
                  size="23"
                  :class="
                    option.id === 'express'
                      ? 'text-secondary'
                      : option.id === 'normal'
                        ? 'text-primary'
                        : 'text-accent'
                  "
                />
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-bold">{{ option.label }}</p>
                  <p class="text-xs text-base-content/55">
                    {{ option.description }}
                  </p>
                </div>
                <p class="text-right text-sm font-bold">
                  {{ option.price === 0 ? "ฟรี" : `฿${option.price}` }}
                </p>
              </div>
            </label>
          </div>

          <button
            class="btn btn-primary mt-5 w-full"
            :disabled="
              subtotal < 1500 ||
              (delivery !== 'pickup' && !selectedShippingAddress) ||
              isCheckingOut
            "
            @click="requestCheckout"
          >
            ดำเนินการสั่งซื้อ
            <Icon name="lucide:arrow-right" size="18" />
          </button>
          <p
            v-if="subtotal < 1500"
            class="mt-2 text-center text-xs text-base-content/55"
          >
            ยอดสั่งซื้อขั้นต่ำ ฿1,500.00
          </p>
          <p
            v-else-if="delivery !== 'pickup' && !selectedShippingAddress"
            class="mt-2 text-center text-xs text-base-content/55"
          >
            กรุณาเลือกที่อยู่จัดส่งก่อน
          </p>
          <button class="btn btn-outline btn-primary btn-sm mt-3 w-full">
            <Icon name="lucide:tag" size="14" /> ใส่โค้ดส่วนลด
          </button>
        </aside>
      </div>

      <div
        class="mt-8 grid gap-3 border-t border-base-300 pt-6 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div
          v-for="benefit in benefits"
          :key="benefit.title"
          class="flex items-center gap-3 rounded-xl bg-base-200/80 p-3"
        >
          <Icon :name="benefit.icon" size="27" class="text-primary" />
          <div>
            <p class="text-sm font-bold">{{ benefit.title }}</p>
            <p class="text-xs text-base-content/55">
              {{ benefit.description }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <dialog ref="selectAddressModal" class="modal">
    <div class="modal-box max-w-3xl p-0">
      <div
        class="flex items-center justify-between border-b border-base-300 px-5 py-4 sm:px-6"
      >
        <div>
          <h2 class="text-xl font-bold">เลือกที่อยู่จัดส่ง</h2>
          <p class="mt-1 text-sm text-base-content/60">
            เลือกที่อยู่ที่ต้องการใช้สำหรับการสั่งซื้อครั้งนี้
          </p>
        </div>
        <button
          class="btn btn-circle btn-ghost btn-sm"
          @click="selectAddressModal?.close()"
        >
          <Icon name="lucide:x" size="18" />
        </button>
      </div>

      <div class="max-h-[78vh] space-y-5 overflow-y-auto p-5 sm:p-6">
        <div class="flex flex-wrap justify-between gap-2">
          <button
            class="btn btn-primary btn-sm"
            @click="openCreateAddressModal"
          >
            <Icon name="lucide:plus" size="16" /> เพิ่มที่อยู่ใหม่
          </button>
          <button class="btn btn-outline btn-sm" @click="loadShippingAddresses">
            <Icon name="lucide:refresh-cw" size="16" /> โหลดข้อมูลใหม่
          </button>
        </div>

        <div v-if="isShippingLoading" class="py-10 text-center">
          <span class="loading loading-spinner loading-md text-primary" />
        </div>

        <div v-else-if="!shippingAddresses.length" class="py-8 text-center">
          <Icon
            name="lucide:map-pin-off"
            size="32"
            class="mx-auto mb-3 text-base-content/30"
          />
          <p class="font-semibold">ยังไม่มีที่อยู่จัดส่ง</p>
          <p class="mt-1 text-sm text-base-content/55">
            กดเพิ่มที่อยู่ใหม่เพื่อสร้างรายการแรก
          </p>
        </div>

        <div class="space-y-3">
          <button
            v-for="address in shippingAddresses"
            :key="address.uuid"
            class="w-full rounded-xl border p-4 text-left transition"
            :class="
              selectedShippingAddressId === address.uuid
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-base-300 hover:border-primary/50'
            "
            @click="selectShippingAddress(address.uuid)"
          >
            <div class="flex items-start gap-3">
              <Icon
                name="lucide:map-pin"
                size="18"
                class="mt-0.5 text-primary"
              />
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <p class="font-bold">
                    {{ address.shipping_label }}:
                    {{ address.shipping_recipient }}
                  </p>
                  <span
                    v-if="address.shipping_is_default"
                    class="badge badge-sm badge-accent"
                  >
                    Default
                  </span>
                </div>
                <p class="mt-1 text-sm text-base-content/65">
                  {{ formatShippingAddress(address) }}
                </p>
                <p class="mt-1 text-sm text-base-content/65">
                  {{ address.shipping_phone }}
                </p>
                <p
                  v-if="address.shipping_note"
                  class="mt-1 text-xs text-base-content/55"
                >
                  หมายเหตุ: {{ address.shipping_note }}
                </p>
              </div>
              <button
                class="btn btn-ghost btn-xs"
                @click.stop="openEditAddressModal(address)"
              >
                แก้ไข
              </button>
            </div>
          </button>
        </div>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>ปิด</button>
    </form>
  </dialog>

  <ShippingAddressFormModal
    v-model="isAddressFormOpen"
    :mode="addressFormMode"
    :form="addressForm"
    :loading="isSavingAddress"
    @submit="requestSaveAddress"
  />

  <ModalConfirm
    v-model="isConfirmModalOpen"
    :title="confirmTitle"
    :message="confirmMessage"
    :confirm-text="confirmButtonText"
    :variant="confirmVariant"
    :loading="isConfirmLoading"
    @confirm="confirmBasketAction"
  />
</template>

<script setup lang="ts">
const delivery = ref("normal");
const errorMessage = ref("");
const shippingError = ref("");
const isClearing = ref(false);
const isCheckingOut = ref(false);
const currentUser = ref<any>(null);
const shippingAddresses = ref<ShippingAddress[]>([]);
const selectedShippingAddressId = ref("");
const isShippingLoading = ref(false);
const isSavingAddress = ref(false);
const editingAddressUuid = ref("");
const isConfirmModalOpen = ref(false);
const confirmAction = ref<
  "remove" | "clear" | "checkout" | "create-address" | "edit-address" | ""
>("");
const confirmBasketTarget = ref<any>(null);

const selectAddressModal = ref<HTMLDialogElement | null>(null);
const isAddressFormOpen = ref(false);
const addressFormMode = ref<"create" | "edit">("create");
const addressForm = ref(
  createShippingAddressForm({ shipping_is_default: false }),
);

const benefits = [
  {
    icon: "lucide:shield-check",
    title: "รับประกันสินค้า",
    description: "เปลี่ยนคืนภายใน 7 วัน",
  },
  {
    icon: "lucide:wallet-cards",
    title: "ชำระเงินปลอดภัย",
    description: "รองรับหลายช่องทาง",
  },
  {
    icon: "lucide:headphones",
    title: "บริการลูกค้า",
    description: "ทุกวัน 08:00 - 20:00",
  },
  {
    icon: "lucide:package-check",
    title: "แพ็กสินค้าอย่างดี",
    description: "ดูแลทุกกล่องให้ปลอดภัย",
  },
];

const deliveryOptions = [
  {
    id: "pickup",
    label: "รับสินค้าด้วยตัวเอง",
    description: "รับสินค้าได้ที่หน้าร้านหรือจุดรับสินค้า",
    price: 0,
    icon: "lucide:store",
  },
  {
    id: "normal",
    label: "จัดส่งทั่วประเทศ",
    description: "2 - 4 วันทำการ",
    price: 35,
    icon: "lucide:truck",
  },
  {
    id: "express",
    label: "ส่งด่วนใกล้บ้าน",
    description: "ภายใน 1 - 2 ชม.",
    price: 39,
    icon: "lucide:bike",
  },
];

const confirmTitle = computed(() => {
  if (confirmAction.value === "remove") return "ยืนยันการลบรายการนี้";
  if (confirmAction.value === "clear") return "ยืนยันการลบสินค้าในตะกร้า";
  if (confirmAction.value === "checkout") return "ยืนยันการสั่งซื้อ";
  if (confirmAction.value === "create-address") return "ยืนยันการบันทึกที่อยู่";
  return "ยืนยันการแก้ไขที่อยู่";
});

const confirmMessage = computed(() => {
  if (confirmAction.value === "remove") {
    return `คุณต้องการลบ ${confirmBasketTarget.value?.product_name || "สินค้ารายการนี้"} ออกจากตะกร้าใช่หรือไม่`;
  }
  if (confirmAction.value === "clear")
    return "สินค้าทุกรายการจะถูกลบออกจากตะกร้า";
  if (confirmAction.value === "checkout")
    return `ยอดสั่งซื้อ ฿${formatPrice(grandTotal.value)} จะถูกส่งให้ร้านตรวจสอบ`;
  if (confirmAction.value === "create-address")
    return "ตรวจสอบข้อมูลแล้วบันทึกที่อยู่จัดส่งนี้";
  return "ยืนยันการบันทึกการแก้ไขที่อยู่จัดส่งนี้";
});

const confirmButtonText = computed(() => {
  if (confirmAction.value === "remove" || confirmAction.value === "clear")
    return "ลบ";
  if (confirmAction.value === "checkout") return "ยืนยันการสั่งซื้อ";
  return "บันทึก";
});

const confirmVariant = computed<"error" | "primary">(() =>
  confirmAction.value === "remove" || confirmAction.value === "clear"
    ? "error"
    : "primary",
);

const isConfirmLoading = computed(
  () =>
    isClearing.value ||
    isCheckingOut.value ||
    isSavingAddress.value ||
    Boolean(
      confirmBasketTarget.value &&
      isItemUpdating(confirmBasketTarget.value.uuid),
    ),
);

const {
  activeItems,
  clearBasket,
  isItemUpdating,
  isLoading,
  refreshBasket,
  removeBasketItem,
  updateBasketQuantity,
} = useBasket();
const { showToast } = useToast();

const basketRows = activeItems;

type BasketPromotionPricing = {
  discount: number;
  hasPromotion: boolean;
  isEligible: boolean;
  message: string;
  normalUnitPrice: number;
  originalTotal: number;
  total: number;
  unitPrice: number;
};

const pricingFor = (basket: any): BasketPromotionPricing => {
  const quantity = Math.max(Math.floor(Number(basket.basket_quantity || 0)), 0);
  const storedUnitPrice = quantity
    ? Number(basket.basket_total || 0) / quantity
    : 0;
  const normalUnitPrice = Number(
    basket.product_selling_price || storedUnitPrice,
  );
  const promotionUnitPrice = Number(
    basket.promotion_discounted_price || basket.promotion_bundle_price || 0,
  );
  const minQuantity = Number(basket.promotion_min_quantity || 0);
  const minPurchaseAmount = Number(basket.promotion_min_purchase_amount || 0);
  const hasPromotion =
    promotionUnitPrice > 0 && promotionUnitPrice < normalUnitPrice;
  const originalTotal = normalUnitPrice * quantity;
  const meetsQuantity = !minQuantity || quantity >= minQuantity;
  const meetsPurchaseAmount =
    !minPurchaseAmount || originalTotal >= minPurchaseAmount;
  const isEligible = hasPromotion && meetsQuantity && meetsPurchaseAmount;
  const unitPrice = isEligible ? promotionUnitPrice : normalUnitPrice;
  const total = unitPrice * quantity;
  const discount = Math.max(originalTotal - total, 0);
  const requirements: string[] = [];
  const missingRequirements: string[] = [];

  if (minQuantity) {
    requirements.push(
      `ซื้อขั้นต่ำ ${minQuantity.toLocaleString("th-TH")} ชิ้น`,
    );
    if (quantity < minQuantity) {
      missingRequirements.push(
        `ซื้อเพิ่มอีก ${(minQuantity - quantity).toLocaleString("th-TH")} ชิ้น`,
      );
    }
  }
  if (minPurchaseAmount) {
    requirements.push(`ยอดซื้อขั้นต่ำ ฿${formatPrice(minPurchaseAmount)}`);
    if (originalTotal < minPurchaseAmount) {
      missingRequirements.push(
        `เพิ่มยอดอีก ฿${formatPrice(minPurchaseAmount - originalTotal)}`,
      );
    }
  }

  return {
    discount,
    hasPromotion,
    isEligible,
    message: isEligible
      ? `${requirements.join(" และ ") || "รับราคาพิเศษ"} ได้แล้ว`
      : `${missingRequirements.join(" และ ")} เพื่อรับราคาพิเศษ ฿${formatPrice(promotionUnitPrice)}`,
    normalUnitPrice,
    originalTotal,
    total,
    unitPrice,
  };
};

const selectedShippingAddress = computed(() => {
  if (!shippingAddresses.value.length) {
    return null;
  }

  return (
    shippingAddresses.value.find(
      (address) => address.uuid === selectedShippingAddressId.value,
    ) ||
    shippingAddresses.value.find((address) => address.shipping_is_default) ||
    shippingAddresses.value[0] ||
    null
  );
});

const totalQuantity = computed(() =>
  basketRows.value.reduce(
    (total, basket) => total + Number(basket.basket_quantity || 0),
    0,
  ),
);

const originalSubtotal = computed(() =>
  basketRows.value.reduce(
    (total, basket) => total + pricingFor(basket).originalTotal,
    0,
  ),
);

const totalDiscount = computed(() =>
  basketRows.value.reduce(
    (total, basket) => total + pricingFor(basket).discount,
    0,
  ),
);

const subtotal = computed(() =>
  basketRows.value.reduce(
    (total, basket) => total + pricingFor(basket).total,
    0,
  ),
);

const shippingFee = computed(() =>
  basketRows.value.length
    ? (deliveryOptions.find((option) => option.id === delivery.value)?.price ??
      0)
    : 0,
);

const grandTotal = computed(() => subtotal.value + shippingFee.value);

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

const formatPrice = (value: number | string) =>
  new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatShippingAddress = (address: ShippingAddress) =>
  [
    address.shipping_address,
    address.shipping_subdistrict,
    address.shipping_district,
    address.shipping_province,
    address.shipping_postcode,
  ]
    .filter(Boolean)
    .join(", ");

const pickSelectedShippingAddress = () => {
  if (!shippingAddresses.value.length) {
    selectedShippingAddressId.value = "";
    return;
  }

  if (
    selectedShippingAddressId.value &&
    shippingAddresses.value.some(
      (address) => address.uuid === selectedShippingAddressId.value,
    )
  ) {
    return;
  }

  selectedShippingAddressId.value =
    shippingAddresses.value.find((address) => address.shipping_is_default)
      ?.uuid ||
    shippingAddresses.value[0]?.uuid ||
    "";
};

const loadCurrentUser = () => {
  if (!import.meta.client) {
    return;
  }

  const stored = localStorage.getItem("web-user");
  currentUser.value = stored ? JSON.parse(stored) : null;
};

const loadShippingAddresses = async () => {
  shippingError.value = "";

  if (!currentUser.value?.uuid) {
    shippingAddresses.value = [];
    selectedShippingAddressId.value = "";
    shippingError.value = "กรุณาเข้าสู่ระบบเพื่อจัดการที่อยู่จัดส่ง";
    return;
  }

  isShippingLoading.value = true;

  try {
    shippingAddresses.value = await fetchShippingAddresses(
      currentUser.value.uuid,
    );
    pickSelectedShippingAddress();
  } catch {
    shippingError.value = "ไม่สามารถโหลดข้อมูลที่อยู่จัดส่งได้";
  } finally {
    isShippingLoading.value = false;
  }
};

const openSelectAddressModal = async () => {
  await loadShippingAddresses();
  selectAddressModal.value?.showModal();
};

const openCreateAddressModal = () => {
  if (!currentUser.value?.uuid) {
    shippingError.value = "กรุณาเข้าสู่ระบบก่อนเพิ่มที่อยู่จัดส่ง";
    return;
  }

  confirmAction.value = "create-address";
  addressFormMode.value = "create";
  addressForm.value = createShippingAddressForm({
    shipping_user: currentUser.value.uuid,
    shipping_recipient:
      `${currentUser.value.firstname || ""} ${currentUser.value.lastname || ""}`.trim(),
    shipping_phone: currentUser.value.phone || "",
    shipping_is_default:
      shippingAddresses.value.length === 0 ||
      !shippingAddresses.value.some((address) => address.shipping_is_default),
  });
  isAddressFormOpen.value = true;
};

const openEditAddressModal = (address: ShippingAddress) => {
  confirmAction.value = "edit-address";
  addressFormMode.value = "edit";
  editingAddressUuid.value = address.uuid;
  addressForm.value = toShippingAddressForm(address);
  isAddressFormOpen.value = true;
};

const selectShippingAddress = (addressUuid: string) => {
  selectedShippingAddressId.value = addressUuid;
  selectAddressModal.value?.close();
  showToast("เลือกที่อยู่จัดส่งเรียบร้อยแล้ว");
};

const requestSaveAddress = () => {
  isConfirmModalOpen.value = true;
};

const saveCreateAddress = async () => {
  shippingError.value = "";

  if (!currentUser.value?.uuid) {
    shippingError.value = "กรุณาเข้าสู่ระบบก่อนเพิ่มที่อยู่จัดส่ง";
    return;
  }

  isSavingAddress.value = true;

  try {
    const res: any = await createShippingAddress(
      createShippingAddressForm({
        ...addressForm.value,
        shipping_user: currentUser.value.uuid,
      }),
      currentUser.value,
    );

    isAddressFormOpen.value = false;
    showToast("เพิ่มที่อยู่จัดส่งเรียบร้อยแล้ว");
    await loadShippingAddresses();

    if (res?.row?.uuid) {
      selectedShippingAddressId.value = res.row.uuid;
    }
  } catch {
    shippingError.value = "ไม่สามารถเพิ่มที่อยู่จัดส่งได้";
  } finally {
    isSavingAddress.value = false;
  }
};

const saveEditAddress = async () => {
  shippingError.value = "";

  if (!editingAddressUuid.value) {
    shippingError.value = "ไม่พบรายการที่อยู่จัดส่ง";
    return;
  }

  if (!currentUser.value?.uuid) {
    shippingError.value = "กรุณาเข้าสู่ระบบก่อนแก้ไขที่อยู่จัดส่ง";
    return;
  }

  isSavingAddress.value = true;

  try {
    const res: any = await updateShippingAddress(
      editingAddressUuid.value,
      addressForm.value,
      currentUser.value,
    );

    isAddressFormOpen.value = false;
    showToast("บันทึกการแก้ไขที่อยู่เรียบร้อยแล้ว");
    await loadShippingAddresses();

    if (res?.row?.uuid) {
      selectedShippingAddressId.value = res.row.uuid;
    }
  } catch {
    shippingError.value = "ไม่สามารถแก้ไขที่อยู่จัดส่งได้";
  } finally {
    isSavingAddress.value = false;
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

const onChangeQuantity = async (basket: any, amount: number) => {
  errorMessage.value = "";
  try {
    await updateBasketQuantity(basket, Number(basket.basket_quantity) + amount);
  } catch {
    errorMessage.value = "ไม่สามารถอัปเดตจำนวนสินค้าได้";
  }
};

const onRemoveBasketItem = async (basket: any) => {
  errorMessage.value = "";
  try {
    await removeBasketItem(basket);
  } catch {
    errorMessage.value = "ไม่สามารถลบสินค้าออกจากตะกร้าได้";
  }
};

const requestRemoveBasketItem = (basket: any) => {
  confirmBasketTarget.value = basket;
  confirmAction.value = "remove";
  isConfirmModalOpen.value = true;
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

const requestClearBasket = () => {
  confirmAction.value = "clear";
  isConfirmModalOpen.value = true;
};

const requestCheckout = () => {
  confirmAction.value = "checkout";
  isConfirmModalOpen.value = true;
};

const onCheckout = async () => {
  errorMessage.value = "";
  shippingError.value = "";

  if (!currentUser.value?.uuid) {
    errorMessage.value = "กรุณาเข้าสู่ระบบก่อนดำเนินการสั่งซื้อ";
    return;
  }

  if (!basketRows.value.length) {
    errorMessage.value = "ไม่พบสินค้าในตะกร้า";
    return;
  }

  if (delivery.value !== "pickup" && !selectedShippingAddress.value) {
    shippingError.value = "กรุณาเลือกที่อยู่จัดส่งก่อนดำเนินการสั่งซื้อ";
    return;
  }

  isCheckingOut.value = true;

  try {
    const response: any = await $fetch("/api/order", {
      method: "POST",
      body: {
        order_delivery_method: delivery.value,
        order_shipping_address_uuid:
          delivery.value === "pickup"
            ? undefined
            : selectedShippingAddress.value?.uuid,
      },
    });

    await refreshBasket();
    showToast(
      `สร้างคำสั่งซื้อ ${response?.row?.order_number || ""} เรียบร้อยแล้ว`,
    );
    if (response?.lineNotification?.sent) {
      showToast("แจ้งเตือนคำสั่งซื้อไปยัง LINE กลุ่มแอดมินแล้ว");
    } else if (response?.lineNotification?.reason) {
      showToast(
        `สร้างคำสั่งซื้อสำเร็จ แต่ยังไม่ส่ง LINE: ${response.lineNotification.reason}`,
        "warning",
      );
    }
  } catch (error: any) {
    console.error("Unable to create order", error);
    errorMessage.value =
      error?.data?.statusMessage ||
      "ไม่สามารถสร้างคำสั่งซื้อได้ กรุณาลองใหม่อีกครั้ง";
  } finally {
    isCheckingOut.value = false;
  }
};

const confirmBasketAction = async () => {
  if (confirmAction.value === "remove" && confirmBasketTarget.value) {
    await onRemoveBasketItem(confirmBasketTarget.value);
  } else if (confirmAction.value === "clear") {
    await onClearBasket();
  } else if (confirmAction.value === "create-address") {
    await saveCreateAddress();
  } else if (confirmAction.value === "edit-address") {
    await saveEditAddress();
  } else if (confirmAction.value === "checkout") {
    await onCheckout();
  }

  if (!errorMessage.value && !shippingError.value) {
    isConfirmModalOpen.value = false;
  }
  confirmBasketTarget.value = null;
};

onMounted(async () => {
  loadCurrentUser();
  await Promise.all([onRefreshBasket(), loadShippingAddresses()]);
});
</script>
