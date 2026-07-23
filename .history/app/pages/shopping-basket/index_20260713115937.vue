<template>
  <div class="w-full bg-base-100">
    <div class="mx-auto w-full max-w-[80%] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div class="p-4 sm:p-6 lg:p-8">
              <div class="badge badge-soft badge-primary py-3">
        <NuxtLink to="/">หน้าแรก</NuxtLink>
        <Icon name="lucide:chevron-right" size="15" />
          <span class="text-base-content">ตะกร้าสินค้า</span>
      </div>

        <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 class="text-3xl font-bold tracking-tight sm:text-4xl">ตะกร้าสินค้า</h1>
            <p class="mt-1 text-sm text-base-content/60">{{ basketRows.length }} รายการ, {{ totalQuantity }} ชิ้น</p>
          </div>
          <NuxtLink to="/products" class="btn btn-ghost btn-sm self-start text-primary sm:self-auto">
            เลือกซื้อสินค้าต่อ <Icon name="lucide:arrow-right" size="16" />
          </NuxtLink>
        </div>

        <div v-if="basketRows.length" class="mb-5 flex items-center justify-between gap-3 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success-content">
          <div class="flex items-center gap-2">
            <Icon name="lucide:circle-check-big" size="19" class="text-success" />
            <span>สินค้าอยู่ในตะกร้าเรียบร้อยแล้ว</span>
          </div>
          <span class="hidden text-xs text-base-content/60 sm:inline">ปรับจำนวนหรือลบรายการได้ด้านล่าง</span>
        </div>

        <section class="mb-6 rounded-xl border border-base-300 bg-base-200/40 p-4 sm:p-5">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div class="flex gap-3">
              <div class="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon name="lucide:map-pin" size="21" />
              </div>
              <div>
                <div class="mb-1 flex items-center gap-2">
                  <h2 class="font-bold">จัดส่งไปยัง</h2>
                  <span class="badge badge-sm badge-primary badge-outline">Mockup</span>
                </div>
                <template v-if="selectedLocation">
                  <p class="text-sm font-semibold">{{ selectedLocation.label }}: {{ selectedLocation.recipient }}</p>
                  <p class="mt-1 max-w-2xl text-sm leading-6 text-base-content/65">{{ selectedLocation.address }}</p>
                  <p class="text-sm text-base-content/65">{{ selectedLocation.phone }}</p>
                </template>
              </div>
            </div>
            <div class="flex shrink-0 flex-wrap gap-2">
              <button class="btn btn-outline btn-sm" @click="openLocationModal">
                <Icon name="lucide:map-pinned" size="16" /> เปลี่ยนที่อยู่
              </button>
              <button class="btn btn-primary btn-sm" @click="openLocationModal">
                <Icon name="lucide:plus" size="16" /> เพิ่มที่อยู่
              </button>
            </div>
          </div>
        </section>

        <p v-if="errorMessage" class="mb-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error">{{ errorMessage }}</p>

        <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <section class="min-w-0 space-y-4">
            <div class="overflow-x-auto rounded-xl border border-base-300">
              <table class="table min-w-190 border-separate border-spacing-0">
                <thead>
                  <tr class="bg-base-200/70 text-xs text-base-content/70">
                    <th class="w-[52%] px-5 py-4">สินค้า</th>
                    <th class="px-4 py-4 text-right">ราคา</th>
                    <th class="px-4 py-4 text-center">จำนวน</th>
                    <th class="px-5 py-4 text-right">รวม</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="isLoading && !basketRows.length">
                    <td colspan="4" class="py-14 text-center"><span class="loading loading-spinner loading-md text-primary" /></td>
                  </tr>
                  <tr v-else-if="!basketRows.length">
                    <td colspan="4" class="py-14 text-center">
                      <Icon name="lucide:shopping-basket" size="34" class="mx-auto mb-3 text-base-content/30" />
                      <p class="font-semibold">ยังไม่มีสินค้าในตะกร้า</p>
                      <p class="mt-1 text-sm text-base-content/55">เลือกสินค้าที่ต้องการ แล้วกลับมาดำเนินการสั่งซื้อได้ที่นี่</p>
                    </td>
                  </tr>
                  <tr v-for="basket in basketRows" :key="basket.uuid" class="border-base-300 last:border-0">
                    <td class="border-t border-base-300 px-5 py-4">
                      <div class="flex min-w-90 items-center gap-4">
                        <div class="flex size-20 shrink-0 items-center justify-center rounded-xl border border-base-300 bg-primary/5 text-primary">
                          <Icon name="lucide:package" size="30" />
                        </div>
                        <div class="min-w-0">
                          <p class="truncate font-bold text-base-content">{{ basket.product_name || basket.basket_product }}</p>
                          <p v-if="basket.product_code" class="mt-1 text-xs text-base-content/55">รหัสสินค้า {{ basket.product_code }}</p>
                          <p v-else class="mt-1 text-xs text-base-content/55">สินค้าในตะกร้า</p>
                          <button
                            class="btn btn-ghost btn-xs mt-2 -ml-2 text-base-content/55 hover:text-error"
                            :disabled="isItemUpdating(basket.uuid)"
                            @click="onRemoveBasketItem(basket)"
                          >
                            <Icon name="lucide:trash-2" size="14" /> ลบรายการ
                          </button>
                        </div>
                      </div>
                    </td>
                    <td class="border-t border-base-300 px-4 py-4 text-right font-bold text-primary">฿{{ formatPrice(unitPrice(basket)) }}</td>
                    <td class="border-t border-base-300 px-4 py-4 text-center">
                      <div class="join">
                        <button class="btn btn-sm join-item" :disabled="isItemUpdating(basket.uuid)" @click="onChangeQuantity(basket, -1)">
                          <Icon name="lucide:minus" size="16" />
                        </button>
                        <span class="btn btn-sm join-item pointer-events-none w-12 bg-base-100 font-semibold">
                          <Icon v-if="isItemUpdating(basket.uuid)" name="lucide:loader-circle" size="15" class="animate-spin" />
                          <template v-else>{{ basket.basket_quantity }}</template>
                        </span>
                        <button class="btn btn-sm join-item" :disabled="isItemUpdating(basket.uuid)" @click="onChangeQuantity(basket, 1)">
                          <Icon name="lucide:plus" size="16" />
                        </button>
                      </div>
                    </td>
                    <td class="border-t border-base-300 px-5 py-4 text-right text-lg font-bold text-primary">฿{{ formatPrice(basket.basket_total) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <button class="btn btn-outline btn-error btn-sm" :disabled="!basketRows.length || isClearing" @click="onClearBasket">
                <Icon name="lucide:trash-2" size="16" /> ลบสินค้าทั้งหมด
              </button>
              <button class="btn btn-outline btn-primary btn-sm" :disabled="isLoading" @click="onRefreshBasket">
                <Icon name="lucide:refresh-cw" size="16" :class="isLoading ? 'animate-spin' : ''" /> อัปเดตตะกร้า
              </button>
            </div>
          </section>

          <aside class="rounded-xl border border-base-300 bg-base-100 p-5 lg:sticky lg:top-6">
            <h2 class="text-xl font-bold">สรุปคำสั่งซื้อ</h2>
            <div class="mt-5 space-y-3 text-sm">
              <div class="flex justify-between gap-4 text-base-content/70">
                <span>ราคารวมสินค้า ({{ totalQuantity }} ชิ้น)</span>
                <span class="font-semibold text-base-content">฿{{ formatPrice(subtotal) }}</span>
              </div>
              <div class="flex justify-between gap-4 text-base-content/70">
                <span>ค่าจัดส่ง</span>
                <span class="font-semibold text-base-content">฿{{ formatPrice(shippingFee) }}</span>
              </div>
              <div class="flex justify-between gap-4 text-base-content/70">
                <span>ส่วนลด</span>
                <span class="font-semibold text-base-content">-฿0.00</span>
              </div>
            </div>
            <div class="my-5 border-t border-base-300" />
            <div class="flex items-end justify-between gap-4">
              <div><p class="font-bold">รวมเป็นเงิน</p><p class="mt-1 text-xs text-base-content/55">รวมภาษีมูลค่าเพิ่มแล้ว</p></div>
              <p class="text-3xl font-bold text-primary">฿{{ formatPrice(grandTotal) }}</p>
            </div>

            <div class="my-5 border-t border-base-300" />
            <h3 class="mb-3 text-sm font-bold">ตัวเลือกการจัดส่ง</h3>
            <div class="space-y-2">
              <label v-for="option in deliveryOptions" :key="option.id" class="block cursor-pointer">
                <input v-model="delivery" type="radio" :value="option.id" class="peer sr-only" />
                <div class="flex items-center gap-3 rounded-lg border border-base-300 p-3 transition peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:ring-1 peer-checked:ring-primary">
                  <Icon :name="option.icon" size="23" :class="option.id === 'express' ? 'text-warning' : 'text-primary'" />
                  <div class="min-w-0 flex-1"><p class="text-sm font-bold">{{ option.label }}</p><p class="text-xs text-base-content/55">{{ option.description }}</p></div>
                  <p class="text-right text-sm font-bold">{{ option.price === 0 ? 'ฟรี' : `฿${option.price}` }}</p>
                </div>
              </label>
            </div>

            <button class="btn btn-primary mt-5 w-full" :disabled="subtotal < 1500">
              ดำเนินการสั่งซื้อ <Icon name="lucide:arrow-right" size="18" />
            </button>
            <p v-if="subtotal < 1500" class="mt-2 text-center text-xs text-base-content/55">ยอดสั่งซื้อขั้นต่ำ ฿1,500.00</p>
            <button class="btn btn-outline btn-primary btn-sm mt-3 w-full"><Icon name="lucide:tag" size="14" /> ใส่โค้ดส่วนลด</button>
          </aside>
        </div>

        <div class="mt-8 grid gap-3 border-t border-base-300 pt-6 sm:grid-cols-2 lg:grid-cols-4">
          <div v-for="benefit in benefits" :key="benefit.title" class="flex items-center gap-3 rounded-xl bg-base-200/60 p-3">
            <Icon :name="benefit.icon" size="27" class="text-primary" />
            <div><p class="text-sm font-bold">{{ benefit.title }}</p><p class="text-xs text-base-content/55">{{ benefit.description }}</p></div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <dialog ref="locationModal" class="modal">
    <div class="modal-box max-w-2xl p-0">
      <div class="flex items-center justify-between border-b border-base-300 px-5 py-4 sm:px-6">
        <div><h2 class="text-xl font-bold">เลือกที่อยู่จัดส่ง</h2><p class="mt-1 text-sm text-base-content/60">ข้อมูลส่วนนี้เป็น mockup และยังไม่บันทึกลงฐานข้อมูล</p></div>
        <button class="btn btn-circle btn-ghost btn-sm" @click="locationModal?.close()"><Icon name="lucide:x" size="18" /></button>
      </div>
      <div class="max-h-[78vh] space-y-5 overflow-y-auto p-5 sm:p-6">
        <div class="space-y-3">
          <button
            v-for="location in locations"
            :key="location.id"
            class="w-full rounded-xl border p-4 text-left transition"
            :class="selectedLocationId === location.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-base-300 hover:border-primary/50'"
            @click="selectLocation(location.id)"
          >
            <div class="flex items-start gap-3"><Icon name="lucide:map-pin" size="18" class="mt-0.5 text-primary" /><div><p class="font-bold">{{ location.label }}: {{ location.recipient }}</p><p class="mt-1 text-sm text-base-content/65">{{ location.address }}</p><p class="mt-1 text-sm text-base-content/65">{{ location.phone }}</p></div></div>
          </button>
        </div>

        <div class="border-t border-base-300 pt-5">
          <h3 class="font-bold">เพิ่มที่อยู่ใหม่</h3>
          <form class="mt-4 space-y-3" @submit.prevent="addMockLocation">
            <div class="grid gap-3 sm:grid-cols-2">
              <label class="form-control"><span class="label-text mb-1 text-sm">ชื่อเรียกที่อยู่</span><input v-model.trim="locationForm.label" required class="input input-bordered w-full" placeholder="เช่น บ้าน, ที่ทำงาน" /></label>
              <label class="form-control"><span class="label-text mb-1 text-sm">ผู้รับสินค้า</span><input v-model.trim="locationForm.recipient" required class="input input-bordered w-full" placeholder="ชื่อ-นามสกุล" /></label>
            </div>
            <label class="form-control"><span class="label-text mb-1 text-sm">เบอร์โทรศัพท์</span><input v-model.trim="locationForm.phone" required class="input input-bordered w-full" inputmode="tel" placeholder="08x-xxx-xxxx" /></label>
            <label class="form-control"><span class="label-text mb-1 text-sm">ที่อยู่จัดส่ง</span><textarea v-model.trim="locationForm.address" required class="textarea textarea-bordered min-h-24 w-full" placeholder="บ้านเลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์" /></label>
            <button class="btn btn-primary w-full" type="submit"><Icon name="lucide:plus" size="17" /> เพิ่มที่อยู่ (Mockup)</button>
          </form>
        </div>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop"><button>ปิด</button></form>
  </dialog>
</template>

<script setup lang="ts">
type BasketRow = {
  uuid: string;
  basket_product: string;
  basket_quantity: number | string;
  basket_total: number | string;
  basket_expire: string;
  product_code?: string | null;
  product_name?: string | null;
};

type Location = {
  id: string;
  label: string;
  recipient: string;
  phone: string;
  address: string;
};

const delivery = ref("normal");
const errorMessage = ref("");
const isClearing = ref(false);
const locationModal = ref<HTMLDialogElement | null>(null);
const locations = ref<Location[]>([
  { id: "home", label: "บ้าน", recipient: "สิรภัทร ลิ้มรังษี", phone: "081-234-5678", address: "99/99 ถนนตัวอย่าง แขวงคลองตันเหนือ เขตวัฒนา กรุงเทพมหานคร 10110" },
  { id: "office", label: "ที่ทำงาน", recipient: "สิรภัทร ลิ้มรังษี", phone: "081-234-5678", address: "อาคารฟินแลนด์ พลาซ่า ชั้น 5 ถนนสุขุมวิท แขวงคลองตัน เขตวัฒนา กรุงเทพมหานคร 10110" },
]);
const selectedLocationId = ref("home");
const locationForm = ref({ label: "", recipient: "", phone: "", address: "" });
const deliveryOptions = [
  { id: "normal", label: "จัดส่งทั่วประเทศ", description: "2 - 4 วันทำการ", price: 35, icon: "lucide:truck" },
  { id: "express", label: "ส่งด่วนใกล้บ้าน", description: "ภายใน 1 - 2 ชม.", price: 39, icon: "lucide:bike" },
];
const benefits = [
  { icon: "lucide:shield-check", title: "รับประกันสินค้า", description: "เปลี่ยนคืนภายใน 7 วัน" },
  { icon: "lucide:wallet-cards", title: "ชำระเงินปลอดภัย", description: "รองรับหลายช่องทาง" },
  { icon: "lucide:headphones", title: "บริการลูกค้า", description: "ทุกวัน 08:00 - 20:00" },
  { icon: "lucide:package-check", title: "แพ็กสินค้าอย่างดี", description: "ดูแลทุกกล่องให้ปลอดภัย" },
];
const { activeItems, clearBasket, isItemUpdating, isLoading, refreshBasket, removeBasketItem, updateBasketQuantity } = useBasket();

const basketRows = activeItems;
const selectedLocation = computed(() => locations.value.find((location) => location.id === selectedLocationId.value));
const totalQuantity = computed(() => basketRows.value.reduce((total, basket) => total + Number(basket.basket_quantity || 0), 0));
const subtotal = computed(() => basketRows.value.reduce((total, basket) => total + Number(basket.basket_total || 0), 0));
const shippingFee = computed(() => basketRows.value.length ? deliveryOptions.find((option) => option.id === delivery.value)?.price ?? 0 : 0);
const grandTotal = computed(() => subtotal.value + shippingFee.value);

const unitPrice = (basket: BasketRow) => {
  const quantity = Number(basket.basket_quantity || 0);
  return quantity > 0 ? Number(basket.basket_total || 0) / quantity : 0;
};

const formatPrice = (value: number | string) => new Intl.NumberFormat("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value || 0));

const openLocationModal = () => locationModal.value?.showModal();

const selectLocation = (locationId: string) => {
  selectedLocationId.value = locationId;
  locationModal.value?.close();
};

const addMockLocation = () => {
  const location: Location = { id: `mock-${Date.now()}`, ...locationForm.value };
  locations.value.push(location);
  selectedLocationId.value = location.id;
  locationForm.value = { label: "", recipient: "", phone: "", address: "" };
  locationModal.value?.close();
};

const onRefreshBasket = async () => {
  errorMessage.value = "";
  try { await refreshBasket(); } catch { errorMessage.value = "ไม่สามารถโหลดตะกร้าสินค้าได้"; }
};

const onChangeQuantity = async (basket: BasketRow, amount: number) => {
  errorMessage.value = "";
  try { await updateBasketQuantity(basket, Number(basket.basket_quantity) + amount); } catch { errorMessage.value = "ไม่สามารถอัปเดตจำนวนสินค้าได้"; }
};

const onRemoveBasketItem = async (basket: BasketRow) => {
  errorMessage.value = "";
  try { await removeBasketItem(basket); } catch { errorMessage.value = "ไม่สามารถลบสินค้าออกจากตะกร้าได้"; }
};

const onClearBasket = async () => {
  errorMessage.value = "";
  isClearing.value = true;
  try { await clearBasket(); } catch { errorMessage.value = "ไม่สามารถลบสินค้าในตะกร้าได้"; } finally { isClearing.value = false; }
};

onMounted(() => { void onRefreshBasket(); });
</script>
