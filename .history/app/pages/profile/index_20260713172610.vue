<template>
  <div class="w-full bg-base-100">
    <div class="mx-auto w-full max-w-7xl px-0 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div class="space-y-4 p-4 sm:p-6 lg:p-8">
        <div class="badge badge-sm badge-soft badge-primary py-3">
          <NuxtLink to="/">หน้าแรก</NuxtLink>
          <Icon name="lucide:chevron-right" size="15" />
          <span class="text-base-content">โปรไฟล์</span>
        </div>

        <div
          class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <h1 class="text-3xl font-bold tracking-tight sm:text-4xl">
              โปรไฟล์ของฉัน
            </h1>
            <p class="mt-1 text-sm text-base-content/60">
              แก้ไขข้อมูลผู้ใช้ เปลี่ยนรหัสผ่าน และจัดการที่อยู่จัดส่ง
            </p>
          </div>
        </div>

        <p
          v-if="profileError"
          class="rounded-lg bg-error/10 px-4 py-3 text-sm text-error"
        >
          {{ profileError }}
        </p>
        <p
          v-if="shippingError"
          class="rounded-lg bg-warning/10 px-4 py-3 text-sm text-warning-content"
        >
          {{ shippingError }}
        </p>

        <div class="grid gap-6 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
          <section class="rounded-2xl border border-base-300 bg-base-100 p-5">
            <div class="flex items-center justify-between gap-3">
              <div>
                <h2 class="text-xl font-bold">ข้อมูลผู้ใช้</h2>
                <p class="mt-1 text-sm text-base-content/55">
                  ข้อมูลนี้ดึงจากตารางผู้ใช้งาน
                </p>
              </div>
              <span class="badge badge-primary badge-outline">
                {{ profileForm.role }}
              </span>
            </div>

            <form class="mt-5 space-y-4" @submit.prevent="saveProfile">
              <div class="grid gap-3 sm:grid-cols-2">
                <label class="form-control">
                  <span class="label-text mb-1 text-sm">ชื่อ</span>
                  <input
                    v-model.trim="profileForm.firstname"
                    class="input input-bordered w-full"
                    placeholder="ชื่อ"
                  />
                </label>
                <label class="form-control">
                  <span class="label-text mb-1 text-sm">นามสกุล</span>
                  <input
                    v-model.trim="profileForm.lastname"
                    class="input input-bordered w-full"
                    placeholder="นามสกุล"
                  />
                </label>
              </div>

              <div class="grid gap-3 sm:grid-cols-2">
                <label class="form-control">
                  <span class="label-text mb-1 text-sm">เบอร์โทรศัพท์</span>
                  <input
                    v-model.trim="profileForm.phone"
                    class="input input-bordered w-full"
                    inputmode="tel"
                    placeholder="08x-xxx-xxxx"
                  />
                </label>
                <label class="form-control">
                  <span class="label-text mb-1 text-sm">อีเมล</span>
                  <input
                    v-model.trim="profileForm.email"
                    class="input input-bordered w-full"
                    type="email"
                    placeholder="name@example.com"
                  />
                </label>
              </div>

              <label class="form-control">
                <span class="label-text mb-1 text-sm">รหัสผ่านใหม่</span>
                <input
                  v-model.trim="profileForm.password"
                  class="input input-bordered w-full"
                  type="password"
                  placeholder="เว้นว่างถ้าไม่เปลี่ยนรหัสผ่าน"
                />
              </label>

              <label class="form-control">
                <span class="label-text mb-1 text-sm">สิทธิ์การใช้งาน</span>
                <input
                  :value="profileForm.role"
                  class="input input-bordered w-full"
                  disabled
                />
              </label>

              <button
                class="btn btn-primary w-full"
                type="submit"
                :disabled="isSavingProfile"
              >
                <span
                  v-if="isSavingProfile"
                  class="loading loading-spinner loading-xs"
                />
                <template v-else>บันทึกข้อมูลผู้ใช้</template>
              </button>
            </form>
          </section>

          <section class="rounded-2xl border border-base-300 bg-base-100 p-5">
            <div
              class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <h2 class="text-xl font-bold">ที่อยู่จัดส่ง</h2>
                <p class="mt-1 text-sm text-base-content/55">
                  เพิ่ม แก้ไข หรือลบที่อยู่ที่ใช้ในการสั่งซื้อ
                </p>
              </div>
              <button
                class="btn btn-primary btn-sm"
                @click="openCreateAddressModal"
              >
                <Icon name="lucide:map-pin-plus" size="16" /> เพิ่มที่อยู่
              </button>
            </div>

            <div class="mt-5">
              <div v-if="isShippingLoading" class="py-12 text-center">
                <span class="loading loading-spinner loading-md text-primary" />
              </div>

              <div
                v-else-if="!shippingAddresses.length"
                class="py-10 text-center"
              >
                <Icon
                  name="lucide:map-pin-off"
                  size="34"
                  class="mx-auto mb-3 text-base-content/30"
                />
                <p class="font-semibold">ยังไม่มีที่อยู่จัดส่ง</p>
                <p class="mt-1 text-sm text-base-content/55">
                  กดเพิ่มที่อยู่เพื่อสร้างข้อมูลรายการแรก
                </p>
              </div>

              <div v-else class="grid gap-3 md:grid-cols-2">
                <article
                  v-for="address in shippingAddresses"
                  :key="address.uuid"
                  class="rounded-2xl border border-base-300 bg-base-100 p-4 transition hover:border-primary/50"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <div class="flex flex-wrap items-center gap-2">
                        <h3 class="truncate font-bold">
                          {{ address.shipping_label }}
                        </h3>
                        <span
                          v-if="address.shipping_is_default"
                          class="badge badge-success badge-outline badge-sm"
                        >
                          Default
                        </span>
                      </div>
                      <p class="mt-1 text-sm font-semibold">
                        {{ address.shipping_recipient }}
                      </p>
                      <p class="mt-1 text-sm text-base-content/65">
                        {{ address.shipping_phone }}
                      </p>
                    </div>

                    <div class="flex shrink-0 flex-col gap-2">
                      <button
                        class="btn btn-outline btn-xs"
                        @click="openEditAddressModal(address)"
                      >
                        แก้ไข
                      </button>
                      <button
                        class="btn btn-outline btn-error btn-xs"
                        @click="openRemoveAddressModal(address)"
                      >
                        ลบ
                      </button>
                    </div>
                  </div>

                  <p class="mt-3 text-sm leading-6 text-base-content/65">
                    {{ formatShippingAddress(address) }}
                  </p>
                  <p
                    v-if="address.shipping_note"
                    class="mt-2 text-xs text-base-content/55"
                  >
                    หมายเหตุ: {{ address.shipping_note }}
                  </p>
                </article>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>

  <dialog ref="createAddressModal" class="modal">
    <div class="modal-box max-w-3xl p-0">
      <div
        class="flex items-center justify-between border-b border-base-300 px-5 py-4 sm:px-6"
      >
        <div>
          <h2 class="text-xl font-bold">เพิ่มที่อยู่จัดส่ง</h2>
          <p class="mt-1 text-sm text-base-content/60">
            กรอกรายละเอียดที่อยู่สำหรับผู้สั่งซื้อ
          </p>
        </div>
        <button
          class="btn btn-circle btn-ghost btn-sm"
          @click="createAddressModal?.close()"
        >
          <Icon name="lucide:x" size="18" />
        </button>
      </div>

      <form
        class="max-h-[78vh] space-y-4 overflow-y-auto p-5 sm:p-6"
        @submit.prevent="requestCreateAddress"
      >
        <div class="grid gap-3 sm:grid-cols-2">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">ชื่อผู้รับ</legend>
            <input
              type="text"
              v-model.trim="createAddressForm.shipping_recipient"
              class="input w-full"
              placeholder="ชื่อ-นามสกุล ผู้รับ"
            />
          </fieldset>

          <label class="form-control">
            <span class="label-text mb-1 text-sm">ชื่อที่อยู่</span>
            <input
              v-model.trim="createAddressForm.shipping_label"
              class="input input-bordered w-full"
              placeholder="บ้าน / ที่ทำงาน / คอนโด"
            />
          </label>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <label class="form-control">
            <span class="label-text mb-1 text-sm">เบอร์โทรศัพท์</span>
            <input
              v-model.trim="createAddressForm.shipping_phone"
              class="input input-bordered w-full"
              inputmode="tel"
              placeholder="08x-xxx-xxxx"
            />
          </label>
          <label class="form-control">
            <span class="label-text mb-1 text-sm">รหัสไปรษณีย์</span>
            <input
              v-model.trim="createAddressForm.shipping_postcode"
              class="input input-bordered w-full bg-base-200"
              inputmode="numeric"
              readonly
              placeholder="10110"
            />
          </label>
        </div>

        <label class="form-control">
          <span class="label-text mb-1 text-sm">ที่อยู่จัดส่ง</span>
          <textarea
            v-model.trim="createAddressForm.shipping_address"
            class="textarea textarea-bordered min-h-24 w-full"
            placeholder="บ้านเลขที่ ถนน แขวง/ตำบล เขต/อำเภอ"
          />
        </label>

        <ShippingAddressLocationFields :form="createAddressForm" />

        <label class="form-control">
          <span class="label-text mb-1 text-sm">หมายเหตุ</span>
          <textarea
            v-model.trim="createAddressForm.shipping_note"
            class="textarea textarea-bordered min-h-20 w-full"
            placeholder="เช่น ฝากรปภ. / โทรก่อนเข้ามา"
          />
        </label>

        <label
          class="flex cursor-pointer items-center gap-3 rounded-xl border border-base-300 p-4"
        >
          <input
            v-model="createAddressForm.shipping_is_default"
            type="checkbox"
            class="checkbox checkbox-primary"
          />
          <div>
            <p class="font-semibold">ตั้งเป็นที่อยู่หลัก</p>
            <p class="text-sm text-base-content/55">
              ระบบจะเลือกที่อยู่นี้เป็นค่าเริ่มต้น
            </p>
          </div>
        </label>

        <div class="modal-action">
          <button
            class="btn flex-1"
            type="button"
            @click="createAddressModal?.close()"
          >
            ปิด
          </button>
          <button
            class="btn btn-primary flex-1"
            type="submit"
            :disabled="isSavingAddress"
          >
            <span
              v-if="isSavingAddress"
              class="loading loading-spinner loading-xs"
            />
            <template v-else>บันทึกที่อยู่</template>
          </button>
        </div>
      </form>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>ปิด</button>
    </form>
  </dialog>

  <dialog ref="editAddressModal" class="modal">
    <div class="modal-box max-w-3xl p-0">
      <div
        class="flex items-center justify-between border-b border-base-300 px-5 py-4 sm:px-6"
      >
        <div>
          <h2 class="text-xl font-bold">แก้ไขที่อยู่จัดส่ง</h2>
          <p class="mt-1 text-sm text-base-content/60">
            อัปเดตรายละเอียดที่อยู่จัดส่ง
          </p>
        </div>
        <button
          class="btn btn-circle btn-ghost btn-sm"
          @click="editAddressModal?.close()"
        >
          <Icon name="lucide:x" size="18" />
        </button>
      </div>

      <form
        class="max-h-[78vh] space-y-4 overflow-y-auto p-5 sm:p-6"
        @submit.prevent="requestEditAddress"
      >
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="form-control">
            <span class="label-text mb-1 text-sm">ชื่อที่อยู่</span>
            <input
              v-model.trim="editAddressForm.shipping_label"
              class="input input-bordered w-full"
            />
          </label>
          <label class="form-control">
            <span class="label-text mb-1 text-sm">ชื่อผู้รับ</span>
            <input
              v-model.trim="editAddressForm.shipping_recipient"
              class="input input-bordered w-full"
            />
          </label>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <label class="form-control">
            <span class="label-text mb-1 text-sm">เบอร์โทรศัพท์</span>
            <input
              v-model.trim="editAddressForm.shipping_phone"
              class="input input-bordered w-full"
              inputmode="tel"
            />
          </label>
          <label class="form-control">
            <span class="label-text mb-1 text-sm">รหัสไปรษณีย์</span>
            <input
              v-model.trim="editAddressForm.shipping_postcode"
              class="input input-bordered w-full bg-base-200"
              inputmode="numeric"
              readonly
            />
          </label>
        </div>

        <label class="form-control">
          <span class="label-text mb-1 text-sm">ที่อยู่จัดส่ง</span>
          <textarea
            v-model.trim="editAddressForm.shipping_address"
            class="textarea textarea-bordered min-h-24 w-full"
          />
        </label>

        <ShippingAddressLocationFields :form="editAddressForm" />

        <label class="form-control">
          <span class="label-text mb-1 text-sm">หมายเหตุ</span>
          <textarea
            v-model.trim="editAddressForm.shipping_note"
            class="textarea textarea-bordered min-h-20 w-full"
          />
        </label>

        <label
          class="flex cursor-pointer items-center gap-3 rounded-xl border border-base-300 p-4"
        >
          <input
            v-model="editAddressForm.shipping_is_default"
            type="checkbox"
            class="checkbox checkbox-primary"
          />
          <div>
            <p class="font-semibold">ตั้งเป็นที่อยู่หลัก</p>
            <p class="text-sm text-base-content/55">
              ถ้าเปิดไว้ ระบบจะใช้รายการนี้เป็นที่อยู่หลัก
            </p>
          </div>
        </label>

        <div class="modal-action">
          <button
            class="btn flex-1"
            type="button"
            @click="editAddressModal?.close()"
          >
            ปิด
          </button>
          <button
            class="btn btn-primary flex-1"
            type="submit"
            :disabled="isSavingAddress"
          >
            <span
              v-if="isSavingAddress"
              class="loading loading-spinner loading-xs"
            />
            <template v-else>บันทึกการแก้ไข</template>
          </button>
        </div>
      </form>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>ปิด</button>
    </form>
  </dialog>

  <ModalConfirm
    v-model="isConfirmModalOpen"
    :title="confirmTitle"
    :message="confirmMessage"
    :confirm-text="confirmButtonText"
    :variant="confirmVariant"
    :loading="isSavingAddress || isRemovingAddress"
    @confirm="confirmAddressAction"
  />
</template>

<script setup lang="ts">
definePageMeta({
  layout: "default",
});

const profileForm = ref({
  firstname: "",
  lastname: "",
  phone: "",
  email: "",
  password: "",
  role: "User",
});

const profileError = ref("");
const shippingError = ref("");
const isSavingProfile = ref(false);
const isShippingLoading = ref(false);
const isSavingAddress = ref(false);
const isRemovingAddress = ref(false);

const currentUser = ref<any>(null);
const shippingAddresses = ref<ShippingAddress[]>([]);
const createAddressModal = ref<HTMLDialogElement | null>(null);
const editAddressModal = ref<HTMLDialogElement | null>(null);
const removeAddressTarget = ref<ShippingAddress | null>(null);
const editingAddressUuid = ref("");
const isConfirmModalOpen = ref(false);
const confirmAction = ref<"create" | "edit" | "remove" | "">("");

const createAddressForm = ref(createShippingAddressForm());
const editAddressForm = ref(createShippingAddressForm());

const { setCurrentUser, syncFromStorage, user } = useCurrentUser();
const { showToast } = useToast();

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

const confirmTitle = computed(() => {
  if (confirmAction.value === "remove") return "ยืนยันการลบที่อยู่";
  if (confirmAction.value === "create") return "ยืนยันการบันทึกที่อยู่";
  return "ยืนยันการแก้ไขที่อยู่";
});

const confirmMessage = computed(() => {
  if (confirmAction.value === "remove") {
    return `คุณต้องการลบที่อยู่ ${removeAddressTarget.value?.shipping_label || "รายการนี้"} ใช่หรือไม่`;
  }
  if (confirmAction.value === "create")
    return "ตรวจสอบข้อมูลแล้วบันทึกที่อยู่จัดส่งนี้";
  return "ยืนยันการบันทึกการแก้ไขที่อยู่จัดส่งนี้";
});

const confirmButtonText = computed(() =>
  confirmAction.value === "remove" ? "ลบที่อยู่" : "บันทึก",
);
const confirmVariant = computed<"error" | "primary">(() =>
  confirmAction.value === "remove" ? "error" : "primary",
);

const loadCurrentUser = () => {
  syncFromStorage();
  currentUser.value = user.value;

  if (!currentUser.value?.uuid) {
    return false;
  }

  profileForm.value = {
    firstname: currentUser.value.firstname || "",
    lastname: currentUser.value.lastname || "",
    phone: currentUser.value.phone || "",
    email: currentUser.value.email || "",
    password: "",
    role: currentUser.value.role || "User",
  };

  return true;
};

const loadShippingAddresses = async () => {
  shippingError.value = "";

  if (!currentUser.value?.uuid) {
    shippingAddresses.value = [];
    return;
  }

  isShippingLoading.value = true;

  try {
    shippingAddresses.value = await fetchShippingAddresses(
      currentUser.value.uuid,
    );
  } catch {
    shippingError.value = "ไม่สามารถโหลดข้อมูลที่อยู่จัดส่งได้";
  } finally {
    isShippingLoading.value = false;
  }
};

const openCreateAddressModal = () => {
  if (!currentUser.value?.uuid) {
    shippingError.value = "กรุณาเข้าสู่ระบบก่อนเพิ่มที่อยู่จัดส่ง";
    return;
  }

  createAddressForm.value = createShippingAddressForm({
    shipping_user: currentUser.value.uuid,
    shipping_is_default:
      shippingAddresses.value.length === 0 ||
      !shippingAddresses.value.some((address) => address.shipping_is_default),
  });
  createAddressModal.value?.showModal();
};

const openEditAddressModal = (address: ShippingAddress) => {
  editingAddressUuid.value = address.uuid;
  editAddressForm.value = toShippingAddressForm(address);
  editAddressModal.value?.showModal();
};

const openRemoveAddressModal = (address: ShippingAddress) => {
  removeAddressTarget.value = address;
  confirmAction.value = "remove";
  isConfirmModalOpen.value = true;
};

const requestCreateAddress = () => {
  confirmAction.value = "create";
  isConfirmModalOpen.value = true;
};

const requestEditAddress = () => {
  confirmAction.value = "edit";
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
    await createShippingAddress(
      createShippingAddressForm({
        ...createAddressForm.value,
        shipping_user: currentUser.value.uuid,
      }),
      currentUser.value,
    );

    createAddressModal.value?.close();
    showToast("เพิ่มที่อยู่จัดส่งเรียบร้อยแล้ว");
    await loadShippingAddresses();
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
    await updateShippingAddress(
      editingAddressUuid.value,
      editAddressForm.value,
      currentUser.value,
    );

    editAddressModal.value?.close();
    showToast("บันทึกการแก้ไขที่อยู่เรียบร้อยแล้ว");
    await loadShippingAddresses();
  } catch {
    shippingError.value = "ไม่สามารถแก้ไขที่อยู่จัดส่งได้";
  } finally {
    isSavingAddress.value = false;
  }
};

const saveRemoveAddress = async () => {
  shippingError.value = "";

  if (!removeAddressTarget.value) {
    shippingError.value = "ไม่พบรายการที่อยู่จัดส่ง";
    return;
  }

  if (!currentUser.value?.uuid) {
    shippingError.value = "กรุณาเข้าสู่ระบบก่อนลบที่อยู่จัดส่ง";
    return;
  }

  isRemovingAddress.value = true;

  try {
    await deleteShippingAddress(
      removeAddressTarget.value.uuid,
      currentUser.value,
    );
    removeAddressTarget.value = null;
    showToast("ลบที่อยู่จัดส่งเรียบร้อยแล้ว");
    await loadShippingAddresses();
  } catch {
    shippingError.value = "ไม่สามารถลบที่อยู่จัดส่งได้";
  } finally {
    isRemovingAddress.value = false;
  }
};

const confirmAddressAction = async () => {
  if (confirmAction.value === "create") {
    await saveCreateAddress();
  } else if (confirmAction.value === "edit") {
    await saveEditAddress();
  } else if (confirmAction.value === "remove") {
    await saveRemoveAddress();
  }

  if (!shippingError.value) {
    isConfirmModalOpen.value = false;
  }
};

const saveProfile = async () => {
  profileError.value = "";

  if (!currentUser.value?.uuid) {
    profileError.value = "ไม่พบข้อมูลผู้ใช้งาน";
    return;
  }

  isSavingProfile.value = true;

  try {
    const res: any = await $fetch(`/api/users/${currentUser.value.uuid}`, {
      method: "PUT",
      body: {
        ...profileForm.value,
        user: currentUser.value,
      },
    });

    if (res?.row) {
      const nextUser = {
        ...currentUser.value,
        ...res.row,
      };
      currentUser.value = nextUser;
      setCurrentUser(nextUser);
      profileForm.value.password = "";
      showToast("บันทึกข้อมูลผู้ใช้เรียบร้อยแล้ว");
    }
  } catch {
    profileError.value = "ไม่สามารถบันทึกข้อมูลผู้ใช้ได้";
  } finally {
    isSavingProfile.value = false;
  }
};

onMounted(async () => {
  const hasUser = loadCurrentUser();

  if (!hasUser) {
    await navigateTo("/");
    return;
  }

  await loadShippingAddresses();
});
</script>
