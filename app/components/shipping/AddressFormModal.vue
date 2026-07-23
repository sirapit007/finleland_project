<template>
  <dialog ref="dialog" class="modal" @close="onDialogClose">
    <div class="modal-box max-w-3xl p-0">
      <div class="flex items-center justify-between border-b border-base-300 px-5 py-6 sm:px-6">
        <div>
          <h2 class="text-xl font-bold">{{ mode === "create" ? "เพิ่มที่อยู่จัดส่ง" : "แก้ไขที่อยู่จัดส่ง" }}</h2>
          <p class="mt-1 text-sm text-base-content/60">
            {{ mode === "create" ? "กรอกรายละเอียดสำหรับใช้จัดส่งสินค้า" : "อัปเดตรายละเอียดที่อยู่จัดส่งให้เป็นปัจจุบัน" }}
          </p>
        </div>
        <button class="btn btn-circle btn-ghost btn-sm" type="button" @click="close">
          <Icon name="lucide:x" size="18" />
        </button>
      </div>

      <form class="max-h-[78vh] space-y-2.5 overflow-y-auto p-5 sm:p-6" @submit.prevent="$emit('submit')">
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
              inputmode="tel"
              class="input input-sm w-full"
              placeholder="08x-xxx-xxxx"
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
          <label class="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-base-300 p-4">
            <input v-model="form.shipping_is_default" type="checkbox" class="checkbox checkbox-primary" />
            <div>
              <p class="text-sm font-semibold">ตั้งเป็นที่อยู่หลัก</p>
              <p class="text-xs text-base-content/55">ระบบจะเลือกที่อยู่นี้เป็นค่าเริ่มต้น</p>
            </div>
          </label>
        </fieldset>

        <div class="modal-action gap-3">
          <button class="btn flex-1" type="button" :disabled="loading" @click="close">ปิด</button>
          <button class="btn btn-primary flex-1" type="submit" :disabled="loading">
            <span v-if="loading" class="loading loading-spinner loading-xs" />
            <template v-else>บันทึกที่อยู่</template>
          </button>
        </div>
      </form>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>ปิด</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    mode?: "create" | "edit";
    form: ShippingAddressForm;
    loading?: boolean;
  }>(),
  {
    mode: "create",
    loading: false,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  submit: [];
}>();

const dialog = ref<HTMLDialogElement | null>(null);

const close = () => emit("update:modelValue", false);

const onDialogClose = () => {
  if (props.modelValue) {
    emit("update:modelValue", false);
  }
};

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen && !dialog.value?.open) {
      dialog.value?.showModal();
    } else if (!isOpen && dialog.value?.open) {
      dialog.value.close();
    }
  },
);
</script>
