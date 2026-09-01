<template>
  <div
    v-if="currentUser?.uuid && !isShippingLoading && !shippingAddresses.length"
    role="alert"
    class="alert alert-warning text-sm"
  >
    <Icon name="lucide:triangle-alert" size="18" />
    <span>ต้องเพิ่มที่อยู่ก่อนจึงจะบันทึกคำสั่งซื้อได้</span>
  </div>

  <div class="rounded-xl border border-base-300 bg-base-200 p-4 sm:p-5">
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
            <h2 class="font-bold sm:text-base text-sm">ที่อยู่จัดส่ง</h2>
            <span class="text-xs text-primary font-semibold">
              ( {{ shippingAddresses.length }} ที่อยู่ )
            </span>
            <span
              v-if="selectedShippingAddress"
              class="badge badge-sm badge-success"
            >
              กำลังใช้งาน
            </span>
          </div>

          <template v-if="selectedShippingAddress">
            <p class="text-sm font-semibold">
              {{ selectedShippingAddress.shipping_label }}:
              {{ selectedShippingAddress.shipping_recipient }}
            </p>
            <p class="mt-1 max-w-3xl text-sm leading-6 text-base-content/65">
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
          class="btn btn-outline sm:btn-sm btn-xs btn-neutral sm:w-fit w-full"
          :disabled="isShippingLoading"
          @click="openSelectAddressModal"
        >
          <Icon name="lucide:map-pinned" size="16" /> เลือกที่อยู่
        </button>
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
          type="button"
          @click="selectAddressModal?.close()"
        >
          <Icon name="lucide:x" size="18" />
        </button>
      </div>

      <div class="max-h-[78vh] space-y-5 overflow-y-auto p-5 sm:p-6">
        <div class="flex flex-wrap justify-between gap-2">
          <button
            class="btn btn-primary btn-sm"
            type="button"
            @click="openCreateAddressModal"
          >
            <Icon name="lucide:plus" size="16" /> เพิ่มที่อยู่ใหม่
          </button>
          <button
            class="btn btn-outline btn-sm"
            type="button"
            @click="loadShippingAddresses"
          >
            <Icon name="lucide:refresh-cw" size="16" /> โหลดข้อมูลใหม่
          </button>
        </div>

        <div v-if="isShippingLoading" class="space-y-3">
          <SkeletonAddressCards />
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

        <div v-else class="space-y-3">
          <ShippingAddressCard
            v-for="address in shippingAddresses"
            :key="address.uuid"
            :shipping-address="address"
            :selected="selectedShippingAddressId === address.uuid"
            selectable
            @select="selectShippingAddress($event.uuid)"
          />
        </div>
      </div>
    </div>
  </dialog>

  <ShippingAddressFormModal
    ref="shippingAddressFormModal"
    @saved="handleShippingAddressSaved"
  />
</template>

<script setup lang="ts">
const { showToast } = useToast();

const selectAddressModal = ref<HTMLDialogElement | null>(null);
const shippingAddressFormModal = ref<{
  onCreate: (initial?: Partial<ShippingAddressForm>) => void;
  onEdit: (address: ShippingAddress) => void;
} | null>(null);

const shippingAddresses = defineModel<ShippingAddress[]>("shippingAddresses", {
  default: [],
});

const selectedShippingAddressId = defineModel<string | null>(
  "selectedShippingAddressId",
  {
    default: null,
  },
);

const shippingError = defineModel<string | null>("shippingError", {
  default: null,
});

const props = defineProps<{
  currentUser: any | null;
  selectedShippingAddress: ShippingAddress | null;
  isShippingLoading: boolean;
  formatShippingAddress: (address: ShippingAddress) => string;
  loadShippingAddresses: () => Promise<void>;
}>();

const selectShippingAddress = (addressUuid: string) => {
  selectedShippingAddressId.value = addressUuid;
  selectAddressModal.value?.close();
  showToast("เลือกที่อยู่จัดส่งเรียบร้อยแล้ว");
};

const openSelectAddressModal = async () => {
  await props.loadShippingAddresses();
  if (!selectAddressModal.value?.open) {
    selectAddressModal.value?.showModal();
  }
};

const openCreateAddressModal = async () => {
  if (!props.currentUser?.uuid) {
    shippingError.value = "กรุณาเข้าสู่ระบบก่อนเพิ่มที่อยู่จัดส่ง";
    return;
  }

  shippingError.value = "";
  await nextTick();
  shippingAddressFormModal.value?.onCreate({
    shipping_user: props.currentUser?.uuid,
    shipping_recipient:
      `${props.currentUser?.firstname || ""} ${props.currentUser?.lastname || ""}`.trim(),
    shipping_phone: props.currentUser?.phone || "",
    shipping_is_default:
      shippingAddresses.value.length === 0 ||
      !shippingAddresses.value.some((address) => address.shipping_is_default),
  });
};

const handleShippingAddressSaved = async (
  mode: "create" | "edit",
  address: ShippingAddress,
) => {
  await props.loadShippingAddresses();
  selectedShippingAddressId.value = address.uuid;
  showToast(
    mode === "create"
      ? "เพิ่มที่อยู่จัดส่งเรียบร้อยแล้ว"
      : "บันทึกการแก้ไขที่อยู่เรียบร้อยแล้ว",
  );
};
</script>
