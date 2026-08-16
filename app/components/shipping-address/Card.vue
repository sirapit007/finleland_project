<template>
  <article
    :key="shippingAddress.uuid"
    class="rounded-2xl border border-base-300 bg-base-100 p-4 transition hover:translate-y-[-1px] hover:shadow-md"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <h3 class="truncate font-bold">
            {{ shippingAddress.shipping_label }}
          </h3>
          <span
            v-if="shippingAddress.shipping_is_default"
            class="badge badge-success sm:py-2 py-1.5 badge-xs"
          >
            Default
          </span>
        </div>
        <p class="mt-1 text-sm font-semibold">
          {{ shippingAddress.shipping_recipient }}
        </p>
        <p class="mt-1 text-sm text-base-content/65">
          {{ shippingAddress.shipping_phone }}
        </p>
      </div>
      <div v-if="!readonly" class="flex shrink-0 gap-1">
        <button
          class="btn btn-ghost btn-square btn-sm text-secondary"
          aria-label="แก้ไขที่อยู่จัดส่ง"
          @click="shippingAddressFormModal?.onEdit(shippingAddress)"
        >
          <Icon name="lucide:pencil" size="16" />
        </button>
        <button
          class="btn btn-ghost btn-square btn-sm text-error"
          aria-label="ลบที่ิยู่จัเส่ง"
          @click="openRemoveAddressModal(shippingAddress)"
        >
          <Icon name="lucide:trash-2" size="16" />
        </button>
      </div>
    </div>

    <div
      :class="`mt-3 rounded-xl ${shippingAddress.shipping_is_default ? 'bg-success/20' : 'bg-base-200'} p-4 space-y-2`"
    >
      <p class="text-sm leading-6 text-base-content/65">
        {{ formatShippingAddress(shippingAddress) }}
      </p>
      <p
        v-if="shippingAddress.shipping_note"
        class="text-xs text-base-content/55"
      >
        หมายเหตุ: {{ shippingAddress.shipping_note }}
      </p>
    </div>
  </article>

  <ShippingAddressFormModal
    ref="shippingAddressFormModal"
    @saved="handleShippingAddressSaved"
  />

  <ModalRemoveConfirm
    v-model="isConfirmModalOpen"
    title="ยืนยันการลบที่อยู่"
    :message="addressRemoveConfirmMessage"
    confirm-text="ลบที่อยู่"
    variant="error"
    :loading="isRemovingAddress"
    @confirm="saveRemoveAddress"
  />
</template>

<script setup lang="ts">
const { showToast } = useToast();

defineProps<{
  shippingAddress: ShippingAddress;
  readonly?: boolean;
}>();

const shippingAddressFormModal = ref<{
  onEdit: (address: ShippingAddress) => void;
} | null>(null);
const removeAddressTarget = ref<ShippingAddress | null>(null);
const isConfirmModalOpen = ref(false);
const isRemovingAddress = ref(false);

const emit = defineEmits<{
  saved: [mode: "edit" | "remove"];
}>();

const addressRemoveConfirmMessage = computed(
  () =>
    `คุณต้องการลบที่อยู่ ${removeAddressTarget.value?.shipping_label || "รายการนี้"} ใช่หรือไม่`,
);

const handleShippingAddressSaved = async (mode: "create" | "edit") => {
  if (mode === "edit") emit("saved", "edit");
};

const openRemoveAddressModal = (address: ShippingAddress) => {
  removeAddressTarget.value = address;
  isConfirmModalOpen.value = true;
};

const saveRemoveAddress = async () => {
  if (isRemovingAddress.value) return;
  if (!removeAddressTarget.value) {
    showToast("ไม่พบรายการที่อยู่จัดส่ง");
    isConfirmModalOpen.value = false;
    return;
  }
  isRemovingAddress.value = true;

  try {
    await deleteShippingAddress(removeAddressTarget.value.uuid);
    isConfirmModalOpen.value = false;
    removeAddressTarget.value = null;
    showToast("ลบที่อยู่จัดส่งเรียบร้อยแล้ว");
    emit("saved", "remove");
  } catch (error: any) {
    showToast(error?.data?.statusMessage || "ไม่สามารถลบที่อยู่จัดส่งได้");
  } finally {
    isRemovingAddress.value = false;
  }
};

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
</script>
