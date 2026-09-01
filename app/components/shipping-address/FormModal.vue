<template>
  <dialog ref="dialog" class="modal" @cancel.prevent="close" @close="onDialogClose">
    <div class="modal-box w-[min(1180px,calc(100vw-1rem))] max-w-none overflow-hidden p-0">
      <header class="border-b border-base-300 px-5 py-5 sm:px-6">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="mt-2 text-xl font-bold sm:text-2xl">{{ mode === "create" ? "เพิ่มจุดจัดส่ง" : "แก้ไขจุดจัดส่ง" }}</h2>
            <p class="mt-1 text-sm text-base-content/55">ปักหมุดให้ตรงจุดรับสินค้า แล้วตรวจสอบข้อมูลก่อนบันทึก</p>
          </div>
          <button class="btn btn-circle btn-ghost btn-sm shrink-0" type="button" aria-label="ปิดหน้าต่าง" @click="close"><Icon name="lucide:x" size="19" /></button>
        </div>
        <div class="mt-4 flex items-center gap-2 text-xs">
          <span class="flex items-center gap-1.5 font-semibold text-primary"><span class="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-content">1</span>จุดจัดส่ง</span>
          <span class="h-px w-8 bg-base-300" />
          <span class="flex items-center gap-1.5 text-base-content/55"><span class="flex size-5 items-center justify-center rounded-full bg-base-200 text-[10px]">2</span>ผู้รับและรายละเอียด</span>
          <span class="h-px w-8 bg-base-300" />
          <span class="flex items-center gap-1.5 text-base-content/55"><span class="flex size-5 items-center justify-center rounded-full bg-base-200 text-[10px]">3</span>ตรวจสอบ</span>
        </div>
      </header>

      <p v-if="addressError" class="mx-5 mt-4 flex items-start gap-2 rounded-xl bg-warning/10 px-4 py-3 text-sm text-warning-content sm:mx-6">
        <Icon name="lucide:triangle-alert" size="17" class="mt-0.5 shrink-0" /> {{ addressError }}
      </p>

      <form @submit.prevent="requestSave">
        <div class="max-h-[70vh] overflow-y-auto p-4 sm:p-6">
          <div class="grid items-start gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(350px,0.92fr)]">
            <ShippingAddressSmartLocationFields :form="form" :active="isOpen" @coordinates-change="onCoordinatesChange" />

            <section class="rounded-2xl border border-base-300 bg-base-100">
              <div class="flex items-start gap-3 border-b border-base-300 bg-base-200/45 px-4 py-4 sm:px-5">
                <span class="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary font-bold text-secondary-content">2</span>
                <div><h3 class="font-bold">ผู้รับและรายละเอียดหน้าบ้าน</h3><p class="mt-0.5 text-xs leading-5 text-base-content/55">ข้อมูลส่วนนี้ช่วยให้พนักงานติดต่อและหาจุดส่งได้เร็วขึ้น</p></div>
              </div>

              <div class="space-y-4 p-4 sm:p-5">
                <div>
                  <label class="mb-2 block text-sm font-semibold">บันทึกเป็น</label>
                  <div class="flex flex-wrap gap-2">
                    <button v-for="option in labelOptions" :key="option.value" type="button" class="btn btn-sm" :class="form.shipping_label === option.value ? 'btn-primary' : 'btn-outline border-base-300'" @click="form.shipping_label = option.value"><Icon :name="option.icon" size="15" /> {{ option.value }}</button>
                  </div>
                  <input v-if="!labelOptions.some((option) => option.value === form.shipping_label)" v-model.trim="form.shipping_label" type="text" class="input input-sm mt-2 w-full" placeholder="ตั้งชื่อที่อยู่นี้ เช่น บ้านคุณแม่" required />
                  <button v-else type="button" class="btn btn-link btn-xs mt-1 px-0 text-base-content/55" @click="form.shipping_label = ''">ใช้ชื่ออื่น</button>
                </div>

                <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <fieldset class="fieldset">
                    <legend class="fieldset-legend">ชื่อผู้รับ</legend>
                    <label class="input input-sm w-full gap-2"><Icon name="lucide:user" size="15" class="opacity-45" /><input v-model.trim="form.shipping_recipient" type="text" class="min-w-0 grow" placeholder="ชื่อ-นามสกุล" autocomplete="name" required /></label>
                  </fieldset>
                  <fieldset class="fieldset">
                    <legend class="fieldset-legend">เบอร์โทรศัพท์</legend>
                    <label class="input input-sm w-full gap-2"><Icon name="lucide:phone" size="15" class="opacity-45" /><input v-model.trim="form.shipping_phone" type="tel" class="min-w-0 grow" inputmode="numeric" autocomplete="tel" pattern="[0-9]{10}" minlength="10" maxlength="10" placeholder="0xx-xxx-xxxx" required /></label>
                  </fieldset>
                </div>

                <fieldset class="fieldset">
                  <legend class="fieldset-legend">บ้านเลขที่ อาคาร ถนน ซอย</legend>
                  <textarea v-model.trim="form.shipping_address" class="textarea textarea-xs min-h-24 w-full" placeholder="เช่น 99/12 หมู่ 4 อาคาร A ชั้น 2 ซอยสุขใจ" required />
                  <p class="label text-xs text-base-content/45">แผนที่อาจไม่รู้เลขห้องหรือทางเข้า กรุณากรอกส่วนนี้เพิ่มเสมอ</p>
                </fieldset>

                <fieldset class="fieldset">
                  <legend class="fieldset-legend">คำแนะนำสำหรับคนส่ง (ไม่บังคับ)</legend>
                  <textarea v-model.trim="form.shipping_note" class="textarea textarea-xs min-h-20 w-full" placeholder="เช่น ประตูสีขาว โทรก่อนถึง หรือฝาก รปภ." />
                </fieldset>

                <label class="flex cursor-pointer items-start gap-3 rounded-xl border border-dashed border-base-300 bg-base-200/35 p-3.5">
                  <input v-model="form.shipping_is_default" type="checkbox" class="checkbox checkbox-primary checkbox-sm mt-0.5" />
                  <span><span class="block text-sm font-semibold">ตั้งเป็นที่อยู่หลัก</span><span class="block text-xs text-base-content/50">เลือกให้อัตโนมัติเมื่อสั่งซื้อครั้งถัดไป</span></span>
                </label>
              </div>
            </section>
          </div>
        </div>

        <footer class="flex flex-col-reverse gap-3 border-t border-base-300 bg-base-100 p-4 sm:flex-row sm:justify-end sm:px-6 sm:py-5">
          <button class="btn sm:btn-sm btn-xs sm:min-w-32" type="button" :disabled="isSaving" @click="close">ปิด</button>
          <button class="btn sm:btn-sm btn-xs btn-primary sm:min-w-48" type="submit" :disabled="isSaving"><span v-if="isSaving" class="loading loading-spinner loading-xs" /><Icon v-else name="lucide:map-pin-check" size="18" /> บันทึกจุดจัดส่ง</button>
        </footer>
      </form>
    </div>
  </dialog>

  <ModalRemoveConfirm v-model="isSaveConfirmOpen" :title="confirmTitle" message="กรุณาตรวจสอบชื่อผู้รับ รายละเอียดหน้าบ้าน และเขตพื้นที่ก่อนบันทึก" confirm-text="ยืนยันและบันทึก" variant="primary" :loading="isSaving" @confirm="saveAddress" @cancel="reopenAddressFormAfterCancel" />
</template>

<script setup lang="ts">
type Coordinates = {
  latitude: number;
  longitude: number;
  provider?: string;
  placeId?: string | null;
  source?: "map_pin" | "current_location" | "address_search" | "manual";
};

const emit = defineEmits<{ saved: [mode: "create" | "edit", address: ShippingAddress] }>();
const dialog = ref<HTMLDialogElement | null>(null);
const form = ref<ShippingAddressForm>(createShippingAddressForm());
const address = ref<ShippingAddress | null>(null);
const selectedCoordinates = ref<Coordinates | null>(null);
const isOpen = ref(false);
const isSaving = ref(false);
const isSaveConfirmOpen = ref(false);
const addressError = ref("");
const labelOptions = [
  { value: "บ้าน", icon: "lucide:house" },
  { value: "ที่ทำงาน", icon: "lucide:briefcase-business" },
  { value: "คอนโด", icon: "lucide:building-2" },
];

const mode = computed<"create" | "edit">(() => (address.value ? "edit" : "create"));
const confirmTitle = computed(() => mode.value === "create" ? "ยืนยันการบันทึกจุดจัดส่ง" : "ยืนยันการแก้ไขจุดจัดส่ง");
const formattedAddress = computed(() => [form.value.shipping_address, form.value.shipping_subdistrict, form.value.shipping_district, form.value.shipping_province, form.value.shipping_postcode].filter(Boolean).join(" "));

const syncSelectedCoordinates = () => {
  selectedCoordinates.value =
    form.value.shipping_latitude !== null && form.value.shipping_longitude !== null
      ? { latitude: form.value.shipping_latitude, longitude: form.value.shipping_longitude }
      : null;
};

const onCoordinatesChange = (coordinates: Coordinates | null) => {
  selectedCoordinates.value = coordinates;
  form.value.shipping_latitude = coordinates?.latitude ?? null;
  form.value.shipping_longitude = coordinates?.longitude ?? null;
  form.value.shipping_location_provider = coordinates
    ? coordinates.provider || "openstreetmap"
    : null;
  form.value.shipping_place_id = coordinates?.placeId ?? null;
  form.value.shipping_location_source = coordinates
    ? coordinates.source || "map_pin"
    : null;
  form.value.shipping_location_accuracy = coordinates ? "exact" : null;
  form.value.shipping_location_confirmed_at = coordinates ? new Date().toISOString() : null;
};

const onCreate = (initial: Partial<ShippingAddressForm> = {}) => {
  address.value = null;
  form.value = createShippingAddressForm(initial);
  if (!form.value.shipping_label) form.value.shipping_label = "บ้าน";
  syncSelectedCoordinates();
  addressError.value = "";
  isOpen.value = true;
};
const onEdit = (targetAddress: ShippingAddress) => {
  address.value = targetAddress;
  form.value = toShippingAddressForm(targetAddress);
  syncSelectedCoordinates();
  addressError.value = "";
  isOpen.value = true;
};
const close = () => { if (!isSaving.value) isOpen.value = false; };
const onDialogClose = () => { isOpen.value = false; };

const validateForm = () => {
  addressError.value = "";
  const phone = String(form.value.shipping_phone || "").replace(/\D/g, "");
  if (!/^[0-9]{10}$/.test(phone)) {
    addressError.value = "กรุณากรอกเบอร์โทรศัพท์เป็นตัวเลขให้ครบ 10 หลัก";
    return false;
  }
  if (!form.value.shipping_label || !form.value.shipping_recipient || !form.value.shipping_address || !form.value.shipping_province || !form.value.shipping_district || !form.value.shipping_subdistrict || !form.value.shipping_postcode) {
    addressError.value = "กรุณาตรวจสอบข้อมูลผู้รับและเขตพื้นที่ให้ครบถ้วน";
    return false;
  }
  form.value.shipping_phone = phone;
  return true;
};

const requestSave = async () => {
  if (!validateForm()) return;
  close();
  await nextTick();
  isSaveConfirmOpen.value = true;
};
const reopenAddressFormAfterCancel = async () => { await nextTick(); isOpen.value = true; };
const saveAddress = async () => {
  if (isSaving.value) return;
  const action = mode.value;
  isSaving.value = true;
  addressError.value = "";
  try {
    const response = action === "edit" && address.value ? await updateShippingAddress(address.value.uuid, form.value) : await createShippingAddress(form.value);
    isSaveConfirmOpen.value = false;
    emit("saved", action, response.row);
  } catch (error: any) {
    addressError.value = error?.data?.statusMessage || (action === "create" ? "ไม่สามารถเพิ่มที่อยู่จัดส่งได้" : "ไม่สามารถแก้ไขที่อยู่จัดส่งได้");
    isSaveConfirmOpen.value = false;
    await nextTick();
    isOpen.value = true;
  } finally {
    isSaving.value = false;
  }
};

watch(isOpen, async (value) => {
  if (value) {
    await nextTick();
    if (!dialog.value?.open) dialog.value?.showModal();
  } else if (dialog.value?.open) dialog.value.close();
});

defineExpose({ onCreate, onEdit, close });
</script>

