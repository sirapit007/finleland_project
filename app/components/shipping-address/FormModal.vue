<template>
  <dialog
    ref="dialog"
    class="modal"
    @cancel.prevent="close"
    @close="onDialogClose"
  >
    <div class="modal-box max-w-3xl p-0">
      <div
        class="flex items-center justify-between border-b border-base-300 px-5 py-6 sm:px-6"
      >
        <div>
          <h2 class="text-xl font-bold">
            {{
              mode === "create" ? "เพิ่มที่อยู่จัดส่ง" : "แก้ไขที่อยู่จัดส่ง"
            }}
          </h2>
          <p class="mt-1 text-sm text-base-content/60">
            {{
              mode === "create"
                ? "กรอกรายละเอียดสำหรับใช้จัดส่งสินค้า"
                : "อัปเดตรายละเอียดที่อยู่จัดส่งให้เป็นปัจจุบัน"
            }}
          </p>
        </div>
        <button
          class="btn btn-circle btn-ghost btn-sm"
          type="button"
          @click="close"
        >
          <Icon name="lucide:x" size="18" />
        </button>
      </div>
      <p
        v-if="addressError"
        class="mx-5 mt-4 rounded-lg bg-warning/10 px-4 py-3 text-sm text-warning-content sm:mx-6"
      >
        {{ addressError }}
      </p>

      <form @submit.prevent="requestSave">
        <div class="max-h-[76vh] space-y-2.5 overflow-y-auto p-5 sm:p-6">
          <div class="grid gap-4 sm:grid-cols-2">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">ชื่อผู้รับ</legend>
              <input
                v-model.trim="form.shipping_recipient"
                type="text"
                class="input input-sm w-full"
                placeholder="ชื่อ-นามสกุล ผู้รับ"
                required
              />
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">เบอร์โทรศัพท์</legend>
              <input
                v-model.trim="form.shipping_phone"
                type="tel"
                inputmode="numeric"
                autocomplete="tel"
                pattern="[0-9]{10}"
                minlength="10"
                maxlength="10"
                class="input input-sm w-full"
                placeholder="กรอกเบอร์โทรศัพท์ 10 หลัก"
                required
              />
            </fieldset>
          </div>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">ชื่อที่อยู่</legend>
            <input
              v-model.trim="form.shipping_label"
              type="text"
              class="input input-sm w-full"
              placeholder="บ้าน / ที่ทำงาน / คอนโด"
              required
            />
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">ที่อยู่จัดส่ง</legend>
            <textarea
              v-model.trim="form.shipping_address"
              class="textarea textarea-sm min-h-24 w-full"
              placeholder="บ้านเลขที่ ถนน ซอย"
              required
            />
          </fieldset>

          <ShippingAddressLocationFields :form="form" />

          <fieldset class="fieldset">
            <legend class="fieldset-legend">หมายเหตุ</legend>
            <textarea
              v-model.trim="form.shipping_note"
              class="textarea textarea-sm min-h-20 w-full"
              placeholder="เช่น ฝาก รปภ. / โทรก่อนเข้ามา"
            />
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">ที่อยู่หลัก</legend>
            <label
              class="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-base-300 p-4"
            >
              <input
                v-model="form.shipping_is_default"
                type="checkbox"
                class="checkbox checkbox-primary"
              />
              <div>
                <p class="text-sm font-semibold">ตั้งเป็นที่อยู่หลัก</p>
                <p class="text-xs text-base-content/55">
                  ระบบจะเลือกที่อยู่นี้เป็นค่าเริ่มต้น
                </p>
              </div>
            </label>
          </fieldset>
        </div>

        <div class="modal-action gap-3 p-5 sm:p-6">
          <button
            class="btn flex-1"
            type="button"
            :disabled="isSaving"
            @click="close"
          >
            ปิด
          </button>
          <button
            class="btn btn-primary flex-1"
            type="submit"
            :disabled="isSaving"
          >
            <span v-if="isSaving" class="loading loading-spinner loading-xs" />
            <template v-else>บันทึกที่อยู่</template>
          </button>
        </div>
      </form>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>ปิด</button>
    </form>
  </dialog>

  <ModalRemoveConfirm
    v-model="isSaveConfirmOpen"
    :title="confirmTitle"
    message="กรุณาตรวจสอบชื่อผู้รับ เบอร์โทรศัพท์ และที่อยู่จัดส่งก่อนบันทึก"
    confirm-text="บันทึก"
    variant="primary"
    :loading="isSaving"
    @confirm="saveAddress"
    @cancel="reopenAddressFormAfterCancel"
  />
</template>

<script setup lang="ts">
const emit = defineEmits<{
  saved: [mode: "create" | "edit", address: ShippingAddress];
}>();

const dialog = ref<HTMLDialogElement | null>(null);
const form = ref<ShippingAddressForm>(createShippingAddressForm());
const address = ref<ShippingAddress | null>(null);
const isOpen = ref(false);
const isSaving = ref(false);
const isSaveConfirmOpen = ref(false);
const addressError = ref("");

const mode = computed<"create" | "edit">(() =>
  address.value ? "edit" : "create",
);
const confirmTitle = computed(() =>
  mode.value === "create" ? "ยืนยันการบันทึกที่อยู่" : "ยืนยันการแก้ไขที่อยู่",
);

const onCreate = (initial: Partial<ShippingAddressForm> = {}) => {
  address.value = null;
  form.value = createShippingAddressForm(initial);
  addressError.value = "";
  isOpen.value = true;
};

const onEdit = (targetAddress: ShippingAddress) => {
  address.value = targetAddress;
  form.value = toShippingAddressForm(targetAddress);
  addressError.value = "";
  isOpen.value = true;
};

const close = () => {
  if (isSaving.value) return;
  isOpen.value = false;
};

const onDialogClose = () => {
  isOpen.value = false;
};

const validateForm = () => {
  addressError.value = "";
  const shippingPhone = String(form.value.shipping_phone || "").trim();

  if (!/^[0-9]{10}$/.test(shippingPhone)) {
    addressError.value = "กรุณากรอกเบอร์โทรศัพท์เป็นตัวเลขให้ครบ 10 หลัก";
    return false;
  }

  form.value.shipping_phone = shippingPhone;
  return true;
};

const requestSave = async () => {
  if (!validateForm()) return;

  close();
  await nextTick();
  isSaveConfirmOpen.value = true;
};

const reopenAddressFormAfterCancel = async () => {
  await nextTick();
  isOpen.value = true;
};

const saveAddress = async () => {
  if (isSaving.value) return;

  const action = mode.value;
  isSaving.value = true;
  addressError.value = "";

  try {
    const response =
      action === "edit" && address.value
        ? await updateShippingAddress(address.value.uuid, form.value)
        : await createShippingAddress(form.value);

    isSaveConfirmOpen.value = false;
    emit("saved", action, response.row);
  } catch (error: any) {
    addressError.value =
      error?.data?.statusMessage ||
      (action === "create"
        ? "ไม่สามารถเพิ่มที่อยู่จัดส่งได้"
        : "ไม่สามารถแก้ไขที่อยู่จัดส่งได้");
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
  } else if (dialog.value?.open) {
    dialog.value.close();
  }
});

defineExpose({ onCreate, onEdit, close });
</script>
