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
              <div
                :class="`badge badge-sm font-semibold ${profileForm.role === 'User' ? 'badge-info' : profileForm.role === 'Superuser' ? 'badge-warning' : 'badge-success'}`"
              >
                {{ profileForm.role }}
              </div>
            </div>

            <form class="mt-4 space-y-4" @submit.prevent="saveProfile">
              <div class="grid gap-4 sm:grid-cols-2">
                <fieldset class="fieldset">
                  <legend class="fieldset-legend">ชื่อ</legend>
                  <label
                    class="input input-sm space-x-2 w-full validator shadow-xs"
                  >
                    <Icon name="lucide:user-round" size="16" />
                    <input
                      type="text"
                      v-model.trim="profileForm.firstname"
                      placeholder="ชื่อ"
                    />
                  </label>
                </fieldset>
                <fieldset class="fieldset">
                  <legend class="fieldset-legend">นามสกุล</legend>
                  <label
                    class="input input-sm space-x-2 w-full validator shadow-xs"
                  >
                    <Icon name="lucide:user-round" size="16" />
                    <input
                      type="text"
                      v-model.trim="profileForm.lastname"
                      placeholder="นามสกุล"
                    />
                  </label>
                </fieldset>
              </div>

              <div class="grid gap-4 sm:grid-cols-2">
                <fieldset class="fieldset">
                  <legend class="fieldset-legend">เบอร์โทรศัพท์</legend>
                  <label
                    class="input input-sm space-x-2 w-full validator shadow-xs"
                  >
                    <Icon name="lucide:phone" size="16" />
                    <input
                      type="tel"
                      v-model.trim="profileForm.phone"
                      inputmode="tel"
                      placeholder="08x-xxx-xxxx"
                      pattern="[0-9]*"
                      maxlength="10"
                    />
                  </label>
                </fieldset>
                <fieldset class="fieldset">
                  <legend class="fieldset-legend">อีเมล</legend>
                  <label
                    class="input input-sm space-x-2 w-full validator shadow-xs"
                  >
                    <Icon name="lucide:mail" size="16" />
                    <input
                      type="email"
                      v-model.trim="profileForm.email"
                      placeholder="name@example.com"
                    />
                  </label>
                </fieldset>
              </div>

              <!-- <label class="form-control">
                <span class="label-text mb-1 text-sm">รหัสผ่านใหม่</span>
                <input
                  v-model.trim="profileForm.password"
                  class="input input-bordered w-full"
                  type="password"
                  placeholder="เว้นว่างถ้าไม่เปลี่ยนรหัสผ่าน"
                />
              </label> -->

              <fieldset class="fieldset">
                <legend class="fieldset-legend">รหัสผ่าน</legend>
                <label
                  class="input input-sm space-x-2 w-full validator shadow-xs"
                >
                  <Icon name="lucide:lock-keyhole" size="16" />
                  <input
                    :type="show.password ? 'text' : 'password'"
                    name="password"
                    v-model="profileForm.password"
                    placeholder="ตั้งรหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
                  />
                  <button
                    type="button"
                    class="btn btn-xs btn-link"
                    v-on:click="show.password = !show.password"
                  >
                    <Icon
                      v-if="!show.password"
                      name="lucide:eye-off"
                      size="14"
                    />
                    <Icon v-else name="lucide:eye" size="14" />
                  </button>
                </label>
              </fieldset>
              <fieldset class="fieldset">
                <legend class="fieldset-legend">ยืนยันรหัสผ่าน</legend>
                <label
                  class="input input-sm space-x-2 w-full validator shadow-xs"
                >
                  <Icon name="lucide:lock-keyhole" size="16" />
                  <input
                    :type="show.confirmPassword ? 'text' : 'password'"
                    name="confirmPassword"
                    v-model="profileForm.confirmPassword"
                    placeholder="ยืนยันรหัสผ่าน"
                  />
                  <button
                    type="button"
                    class="btn btn-xs btn-link"
                    v-on:click="show.confirmPassword = !show.confirmPassword"
                  >
                    <Icon
                      v-if="!show.confirmPassword"
                      name="lucide:eye-off"
                      size="14"
                    />
                    <Icon v-else name="lucide:eye" size="14" />
                  </button>
                </label>
              </fieldset>

              <button
                class="btn btn-primary w-full mt-6"
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
                  class="rounded-2xl border border-base-300 bg-base-100 p-4 transition hover:ring-4 hover:ring-primary/50 shadow"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <div class="flex flex-wrap items-center gap-2">
                        <h3 class="truncate font-bold">
                          {{ address.shipping_label }}
                        </h3>
                        <span
                          v-if="address.shipping_is_default"
                          class="badge badge-success badge-soft badge-sm"
                        >
                          กำลังใช้งาน
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
                        class="btn btn-outline btn-secondary btn-xs"
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
    :loading="isSavingAddress || isRemovingAddress"
    @confirm="confirmAddressAction"
  />
</template>

<script setup lang="ts">
definePageMeta({
  layout: "default",
});

const show = ref<any>({
  password: false,
  confirmPassword: false,
});

const profileForm = ref({
  firstname: "",
  lastname: "",
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",
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
const removeAddressTarget = ref<ShippingAddress | null>(null);
const editingAddressUuid = ref("");
const isConfirmModalOpen = ref(false);
const confirmAction = ref<"create" | "edit" | "remove" | "">("");
const isAddressFormOpen = ref(false);
const addressFormMode = ref<"create" | "edit">("create");
const addressForm = ref(createShippingAddressForm());

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
    confirmPassword: "",
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

  confirmAction.value = "create";
  addressFormMode.value = "create";

  addressForm.value = createShippingAddressForm({
    shipping_user: currentUser.value.uuid,
    shipping_recipient: `${currentUser.value.firstname} ${currentUser.value.lastname}`,
    shipping_phone: currentUser.value.phone,
    shipping_is_default:
      shippingAddresses.value.length === 0 ||
      !shippingAddresses.value.some((address) => address.shipping_is_default),
  });
  isAddressFormOpen.value = true;
};

const openEditAddressModal = (address: ShippingAddress) => {
  confirmAction.value = "edit";
  addressFormMode.value = "edit";

  editingAddressUuid.value = address.uuid;
  addressForm.value = toShippingAddressForm(address);
  isAddressFormOpen.value = true;
};

const openRemoveAddressModal = (address: ShippingAddress) => {
  removeAddressTarget.value = address;
  confirmAction.value = "remove";
  isConfirmModalOpen.value = true;
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
    await createShippingAddress(
      createShippingAddressForm({
        ...addressForm.value,
        shipping_user: currentUser.value.uuid,
      }),
      currentUser.value,
    );

    isAddressFormOpen.value = false;
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
      addressForm.value,
      currentUser.value,
    );

    isAddressFormOpen.value = false;
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

  if (
    !profileForm.value.password ||
    !profileForm.value.confirmPassword ||
    profileForm.value.password !== profileForm.value.confirmPassword
  ) {
    profileError.value = "รหัสผ่านและการยืนยืนยันรหัสผ่านของคุณไม่ตรงกัน!";
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
