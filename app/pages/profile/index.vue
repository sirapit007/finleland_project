<template>
  <div
    class="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10"
  >
    <div class="space-y-3 px-1.25">
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
            จัดการข้อมูลผู้ใช้ รหัสผ่าน ที่อยู่จัดส่ง และการแจ้งเตือนผ่าน LINE
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
        v-if="passwordError"
        class="rounded-lg bg-error/10 px-4 py-3 text-sm text-error"
      >
        {{ passwordError }}
      </p>
      <p
        v-if="shippingError"
        class="rounded-lg bg-warning/10 px-4 py-3 text-sm text-warning-content"
      >
        {{ shippingError }}
      </p>
      <p
        v-if="lineError"
        class="rounded-lg bg-warning/10 px-4 py-3 text-sm text-warning-content"
      >
        {{ lineError }}
      </p>

      <div class="grid gap-6 lg:grid-cols-3 grid-cols-1">
        <section class="rounded-2xl border border-base-300 bg-base-100 p-5">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h2 class="text-xl font-bold">ข้อมูลผู้ใช้</h2>
              <p class="mt-1 text-sm text-base-content/55">
                ข้อมูลสำหรับติดต่อและจัดส่งสินค้า
              </p>
            </div>
            <div
              :class="`badge font-semibold ${profileForm.role === 'User' ? 'badge-info' : profileForm.role === 'Superuser' ? 'badge-warning' : 'badge-success'}`"
            >
              {{ profileForm.role }}
            </div>
          </div>

          <form class="mt-4 space-y-4" @submit.prevent="saveProfile">
            <div class="grid gap-4 grid-cols-2">
              <fieldset class="fieldset">
                <legend class="fieldset-legend">ชื่อ</legend>
                <input
                  v-model.trim="profileForm.firstname"
                  type="text"
                  class="input input-sm w-full"
                  placeholder="ชื่อ"
                />
              </fieldset>
              <fieldset class="fieldset">
                <legend class="fieldset-legend">นามสกุล</legend>
                <input
                  v-model.trim="profileForm.lastname"
                  type="text"
                  class="input input-sm w-full"
                  placeholder="นามสกุล"
                />
              </fieldset>
            </div>

            <div class="grid gap-4 grid-cols-2">
              <fieldset class="fieldset">
                <legend class="fieldset-legend">เบอร์โทรศัพท์</legend>
                <input
                  v-model.trim="profileForm.phone"
                  type="tel"
                  inputmode="numeric"
                  autocomplete="tel"
                  pattern="[0-9]{10}"
                  minlength="10"
                  maxlength="10"
                  class="input input-sm w-full"
                  placeholder="กรอกเบอร์โทรศัพท์ 10 หลัก"
                />
              </fieldset>
              <fieldset class="fieldset">
                <legend class="fieldset-legend">อีเมล</legend>
                <input
                  v-model.trim="profileForm.email"
                  type="email"
                  class="input input-sm w-full"
                  placeholder="name@example.com"
                />
              </fieldset>
            </div>

            <button
              class="btn btn-primary mt-2 w-full"
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
          <div>
            <h2 class="text-xl font-bold">เปลี่ยนรหัสผ่าน</h2>
            <p class="mt-1 text-sm text-base-content/55">
              ตั้งรหัสผ่านใหม่อย่างน้อย 6 ตัวอักษร
            </p>
          </div>

          <form class="mt-4 space-y-4" @submit.prevent="savePassword">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">รหัสผ่านใหม่</legend>
              <div class="relative">
                <input
                  v-model="passwordForm.password"
                  :type="show.password ? 'text' : 'password'"
                  class="input input-sm w-full pr-10"
                  autocomplete="new-password"
                  minlength="6"
                  placeholder="ตั้งรหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
                />
                <button
                  type="button"
                  class="btn btn-ghost btn-xs absolute right-1 top-1/2 -translate-y-1/2"
                  aria-label="แสดงหรือซ่อนรหัสผ่าน"
                  @click="show.password = !show.password"
                >
                  <Icon
                    :name="show.password ? 'lucide:eye' : 'lucide:eye-off'"
                    size="15"
                  />
                </button>
              </div>
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">ยืนยันรหัสผ่านใหม่</legend>
              <div class="relative">
                <input
                  v-model="passwordForm.confirmPassword"
                  :type="show.confirmPassword ? 'text' : 'password'"
                  class="input input-sm w-full pr-10"
                  autocomplete="new-password"
                  minlength="6"
                  placeholder="ยืนยันรหัสผ่านใหม่"
                />
                <button
                  type="button"
                  class="btn btn-ghost btn-xs absolute right-1 top-1/2 -translate-y-1/2"
                  aria-label="แสดงหรือซ่อนการยืนยันรหัสผ่าน"
                  @click="show.confirmPassword = !show.confirmPassword"
                >
                  <Icon
                    :name="
                      show.confirmPassword ? 'lucide:eye' : 'lucide:eye-off'
                    "
                    size="15"
                  />
                </button>
              </div>
            </fieldset>

            <button
              class="btn btn-outline btn-primary mt-2 w-full"
              type="submit"
              :disabled="isSavingPassword"
            >
              <span
                v-if="isSavingPassword"
                class="loading loading-spinner loading-xs"
              />
              <template v-else>บันทึกรหัสผ่านใหม่</template>
            </button>
          </form>
        </section>

        <section class="rounded-2xl border border-base-300 bg-base-100 p-5">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-xl font-bold">เชื่อมต่อ LINE</h2>
              <p class="mt-1 text-sm text-base-content/55">
                เชื่อมบัญชีเพื่อรับการแจ้งเตือนสถานะคำสั่งซื้อผ่าน LINE OA
              </p>
            </div>
            <div class="rounded-xl bg-success/10 p-2 pb-1 text-success">
              <Icon name="lucide:message-circle" size="22" />
            </div>
          </div>

          <div v-if="isLineLoading" class="mt-5 space-y-3">
            <SkeletonLineAccounts :count="1" />
          </div>

          <div
            v-else-if="activeLineAccount"
            class="mt-5 rounded-2xl border border-success/25 bg-success/5 p-4"
          >
            <div class="flex items-center gap-3">
              <img
                v-if="activeLineAccount.line_picture_url"
                :src="activeLineAccount.line_picture_url"
                class="size-12 rounded-full border border-base-300 bg-base-100 object-cover"
                alt="LINE profile"
              />
              <div
                v-else
                class="flex size-12 items-center justify-center rounded-full bg-success text-success-content"
              >
                <Icon name="lucide:message-circle" size="23" />
              </div>
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <p class="truncate font-bold">
                    {{ activeLineAccount.line_display_name || "LINE account" }}
                  </p>
                  <span class="badge badge-success badge-sm">เชื่อมแล้ว</span>
                </div>
                <p class="mt-1 text-xs text-base-content/55">
                  LINE ID:
                  {{ maskLineUserId(activeLineAccount.line_user_id) }}
                </p>
              </div>
            </div>

            <div class="mt-4 flex gap-2">
              <button
                class="btn btn-outline btn-primary btn-sm flex-1"
                @click="connectLine"
              >
                เชื่อมบัญชีอื่น
              </button>
              <button
                class="btn btn-outline btn-error btn-sm flex-1"
                @click="isLineDisconnectConfirmOpen = true"
              >
                ยกเลิกการเชื่อมต่อ
              </button>
            </div>
          </div>

          <div
            v-else
            class="mt-5 rounded-2xl border border-dashed border-base-300 bg-base-200/40 p-5 text-center"
          >
            <Icon
              name="lucide:bell-ring"
              size="34"
              class="mx-auto mb-3 text-base-content/35"
            />
            <p class="font-semibold">ยังไม่ได้เชื่อมต่อ LINE</p>
            <p class="mx-auto mt-1 max-w-sm text-sm text-base-content/55">
              เชื่อมบัญชี LINE ของคุณเพื่อให้ระบบส่งการแจ้งเตือนคำสั่งซื้อได้
            </p>
            <button
              class="btn btn-success btn-sm mt-4"
              :disabled="!isLineConfigured || isLineConnectStarting"
              @click="connectLine"
            >
              <span
                v-if="isLineConnectStarting"
                class="loading loading-spinner loading-xs"
              />
              <Icon v-else name="lucide:link" size="16" />
              {{
                isLineConfigured ? "เชื่อมต่อ LINE" : "กำลังรอการตั้งค่า LINE"
              }}
            </button>
            <p v-if="!isLineConfigured" class="mt-3 text-xs text-warning">
              ผู้ดูแลระบบต้องตั้งค่า LINE Login ก่อนเริ่มเชื่อมต่อ
            </p>
          </div>
        </section>
      </div>
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
          <div v-if="isShippingLoading" class="grid gap-3 md:grid-cols-2">
            <SkeletonAddressCards :count="2" />
          </div>

          <div v-else-if="!shippingAddresses.length" class="py-10 text-center">
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
              class="rounded-2xl border border-base-300 bg-base-100 p-4 shadow transition hover:ring-4 hover:ring-primary/20"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <h3 class="truncate font-bold">
                      {{ address.shipping_label }}
                    </h3>
                    <span
                      v-if="address.shipping_is_default"
                      class="badge badge-accent badge-xs"
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
    @cancel="reopenAddressFormAfterCancel"
  />

  <ModalConfirm
    v-model="isLineDisconnectConfirmOpen"
    title="ยืนยันการยกเลิก LINE"
    message="คุณจะไม่ได้รับการแจ้งเตือนคำสั่งซื้อผ่านบัญชี LINE นี้อีกต่อไป"
    confirm-text="ยกเลิกการเชื่อมต่อ"
    variant="error"
    :loading="isLineDisconnecting"
    @confirm="disconnectLine"
  />
</template>

<script setup lang="ts">
definePageMeta({
  layout: "default",
});

const route = useRoute();
const router = useRouter();
const { setCurrentUser, syncFromStorage, user } = useCurrentUser();
const { showToast } = useToast();

const show = ref({
  password: false,
  confirmPassword: false,
});

const profileForm = ref({
  firstname: "",
  lastname: "",
  phone: "",
  email: "",
  role: "User",
});
const passwordForm = ref({
  password: "",
  confirmPassword: "",
});

const profileError = ref("");
const passwordError = ref("");
const shippingError = ref("");
const lineError = ref("");
const isSavingProfile = ref(false);
const isSavingPassword = ref(false);
const isShippingLoading = ref(false);
const isSavingAddress = ref(false);
const isRemovingAddress = ref(false);
const isLineLoading = ref(false);
const isLineConnectStarting = ref(false);
const isLineDisconnecting = ref(false);
const isLineConfigured = ref(false);

const currentUser = ref<any>(null);
const shippingAddresses = ref<ShippingAddress[]>([]);
const lineAccounts = ref<LineAccount[]>([]);
const removeAddressTarget = ref<ShippingAddress | null>(null);
const editingAddressUuid = ref("");
const isConfirmModalOpen = ref(false);
const isLineDisconnectConfirmOpen = ref(false);
const confirmAction = ref<"create" | "edit" | "remove" | "">("");
const isAddressFormOpen = ref(false);
const addressFormMode = ref<"create" | "edit">("create");
const addressForm = ref(createShippingAddressForm());

const activeLineAccount = computed(
  () => lineAccounts.value.find((account) => account.line_is_connected) || null,
);

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

const maskLineUserId = (lineUserId: string) => {
  if (lineUserId.length < 12) {
    return lineUserId;
  }

  return `${lineUserId.slice(0, 5)}...${lineUserId.slice(-4)}`;
};

const confirmTitle = computed(() => {
  if (confirmAction.value === "remove") return "ยืนยันการลบที่อยู่";
  if (confirmAction.value === "create") return "ยืนยันการบันทึกที่อยู่";
  return "ยืนยันการแก้ไขที่อยู่";
});

const confirmMessage = computed(() => {
  if (confirmAction.value === "remove") {
    return `คุณต้องการลบที่อยู่ ${removeAddressTarget.value?.shipping_label || "รายการนี้"} ใช่หรือไม่`;
  }
  if (confirmAction.value === "create") {
    return "ตรวจสอบข้อมูลแล้วบันทึกที่อยู่จัดส่งนี้";
  }
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

const loadLineAccounts = async () => {
  lineError.value = "";
  isLineLoading.value = true;

  try {
    lineAccounts.value = await fetchLineAccounts();
  } catch {
    lineError.value = "ไม่สามารถโหลดข้อมูลการเชื่อมต่อ LINE ได้";
  } finally {
    isLineLoading.value = false;
  }
};

const loadLineStatus = async () => {
  try {
    const response = await $fetch<{ configured: boolean }>(
      "/api/user/line-accounts/status",
    );
    isLineConfigured.value = response.configured;
  } catch {
    isLineConfigured.value = false;
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

const requestSaveAddress = async () => {
  shippingError.value = "";
  const shippingPhone = String(addressForm.value.shipping_phone || "").trim();

  if (!/^[0-9]{10}$/.test(shippingPhone)) {
    shippingError.value = "กรุณากรอกเบอร์โทรศัพท์เป็นตัวเลขให้ครบ 10 หลัก";
    return;
  }

  addressForm.value.shipping_phone = shippingPhone;
  isAddressFormOpen.value = false;
  await nextTick();
  isConfirmModalOpen.value = true;
};

const reopenAddressFormAfterCancel = async () => {
  if (confirmAction.value !== "create" && confirmAction.value !== "edit") {
    return;
  }

  await nextTick();
  isAddressFormOpen.value = true;
};

const saveCreateAddress = async () => {
  shippingError.value = "";

  if (!currentUser.value?.uuid) {
    shippingError.value = "กรุณาเข้าสู่ระบบก่อนเพิ่มที่อยู่จัดส่ง";
    return false;
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
    return true;
  } catch {
    shippingError.value = "ไม่สามารถเพิ่มที่อยู่จัดส่งได้";
    return false;
  } finally {
    isSavingAddress.value = false;
  }
};

const saveEditAddress = async () => {
  shippingError.value = "";

  if (!editingAddressUuid.value || !currentUser.value?.uuid) {
    shippingError.value = "ไม่พบรายการที่อยู่จัดส่ง";
    return false;
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
    return true;
  } catch {
    shippingError.value = "ไม่สามารถแก้ไขที่อยู่จัดส่งได้";
    return false;
  } finally {
    isSavingAddress.value = false;
  }
};

const saveRemoveAddress = async () => {
  shippingError.value = "";

  if (!removeAddressTarget.value || !currentUser.value?.uuid) {
    shippingError.value = "ไม่พบรายการที่อยู่จัดส่ง";
    return false;
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
    return true;
  } catch {
    shippingError.value = "ไม่สามารถลบที่อยู่จัดส่งได้";
    return false;
  } finally {
    isRemovingAddress.value = false;
  }
};

const confirmAddressAction = async () => {
  let actionSucceeded = false;

  if (confirmAction.value === "create") {
    actionSucceeded = await saveCreateAddress();
  } else if (confirmAction.value === "edit") {
    actionSucceeded = await saveEditAddress();
  } else if (confirmAction.value === "remove") {
    actionSucceeded = await saveRemoveAddress();
  }

  if (actionSucceeded) {
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
    !profileForm.value.firstname ||
    !profileForm.value.lastname ||
    !profileForm.value.phone ||
    !profileForm.value.email
  ) {
    profileError.value = "กรุณากรอกข้อมูลผู้ใช้ให้ครบถ้วน";
    return;
  }

  const phone = String(profileForm.value.phone || "").trim();

  if (!/^[0-9]{10}$/.test(phone)) {
    profileError.value = "กรุณากรอกเบอร์โทรศัพท์เป็นตัวเลขให้ครบ 10 หลัก";
    return;
  }

  profileForm.value.phone = phone;
  isSavingProfile.value = true;

  try {
    const res: any = await $fetch(`/api/user/${currentUser.value.uuid}`, {
      method: "PUT",
      body: {
        ...profileForm.value,
        user: currentUser.value,
      },
    });

    if (res?.row) {
      const nextUser = { ...currentUser.value, ...res.row };
      currentUser.value = nextUser;
      setCurrentUser(nextUser);
      showToast("บันทึกข้อมูลผู้ใช้เรียบร้อยแล้ว");
    }
  } catch {
    profileError.value = "ไม่สามารถบันทึกข้อมูลผู้ใช้ได้";
  } finally {
    isSavingProfile.value = false;
  }
};

const savePassword = async () => {
  passwordError.value = "";

  if (!currentUser.value?.uuid) {
    passwordError.value = "ไม่พบข้อมูลผู้ใช้งาน";
    return;
  }

  if (passwordForm.value.password.length < 6) {
    passwordError.value = "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
    return;
  }

  if (passwordForm.value.password !== passwordForm.value.confirmPassword) {
    passwordError.value = "รหัสผ่านและการยืนยันรหัสผ่านต้องตรงกัน";
    return;
  }

  isSavingPassword.value = true;

  try {
    await $fetch(`/api/user/${currentUser.value.uuid}/password`, {
      method: "PUT",
      body: passwordForm.value,
    });
    passwordForm.value = { password: "", confirmPassword: "" };
    showToast("เปลี่ยนรหัสผ่านเรียบร้อยแล้ว");
  } catch {
    passwordError.value = "ไม่สามารถเปลี่ยนรหัสผ่านได้";
  } finally {
    isSavingPassword.value = false;
  }
};

const connectLine = () => {
  lineError.value = "";

  if (!isLineConfigured.value) {
    lineError.value = "LINE Login ยังไม่ได้รับการตั้งค่า";
    return;
  }

  isLineConnectStarting.value = true;
  window.location.assign("/api/user/line-accounts/connect");
};

const disconnectLine = async () => {
  if (!activeLineAccount.value) {
    return;
  }

  lineError.value = "";
  isLineDisconnecting.value = true;

  try {
    await disconnectLineAccount(activeLineAccount.value.uuid);
    isLineDisconnectConfirmOpen.value = false;
    showToast("ยกเลิกการเชื่อมต่อ LINE เรียบร้อยแล้ว");
    await loadLineAccounts();
  } catch {
    lineError.value = "ไม่สามารถยกเลิกการเชื่อมต่อ LINE ได้";
  } finally {
    isLineDisconnecting.value = false;
  }
};

const handleLineResult = async () => {
  const status = String(route.query.line || "");

  if (!status) {
    return;
  }

  if (status === "connected") {
    showToast("เชื่อมต่อ LINE เรียบร้อยแล้ว");
  } else if (status === "cancelled") {
    lineError.value = "คุณยกเลิกการเชื่อมต่อ LINE";
  } else {
    lineError.value = "ไม่สามารถเชื่อมต่อ LINE ได้ กรุณาลองใหม่อีกครั้ง";
  }

  const query = { ...route.query };
  delete query.line;
  await router.replace({ path: route.path, query });
};

onMounted(async () => {
  if (!loadCurrentUser()) {
    await navigateTo("/");
    return;
  }

  await Promise.all([
    loadShippingAddresses(),
    loadLineAccounts(),
    loadLineStatus(),
  ]);
  await handleLineResult();
});
</script>
