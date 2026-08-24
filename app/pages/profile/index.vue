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
          <p class="mt-1 sm:text-sm text-xs text-base-content/60">
            จัดการข้อมูลผู้ใช้ รหัสผ่าน ที่อยู่จัดส่ง และการแจ้งเตือนผ่าน LINE
          </p>
        </div>
      </div>

      <div class="tabs tabs-box">
        <input
          type="radio"
          name="my_tabs_6"
          class="tab checked:bg-primary checked:text-primary-content"
          aria-label="ข้อมูลผู้ใช้"
          checked
        />
        <div class="tab-content bg-base-100 border-base-300 p-6">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h2 class="text-xl font-bold">ข้อมูลผู้ใช้</h2>
              <p class="mt-1 text-sm text-base-content/55">
                ข้อมูลสำหรับติดต่อและจัดส่งสินค้า
              </p>
            </div>
          </div>

          <UserProfileForm />
        </div>

        <input
          type="radio"
          name="my_tabs_6"
          class="tab checked:bg-primary checked:text-primary-content"
          aria-label="เปลี่ยนรหัสผ่าน"
        />
        <div class="tab-content bg-base-100 border-base-300 p-6">
          <div>
            <h2 class="text-xl font-bold">เปลี่ยนรหัสผ่าน</h2>
            <p class="mt-1 text-sm text-base-content/55">
              ตั้งรหัสผ่านใหม่อย่างน้อย 6 ตัวอักษร
            </p>
          </div>

          <UserPasswordForm />
        </div>

        <input
          type="radio"
          name="my_tabs_6"
          class="tab checked:bg-primary checked:text-primary-content"
          aria-label="เชื่อมต่อ LINE"
        />
        <div class="tab-content bg-base-100 border-base-300 p-6">
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

          <LineAccountCard />
        </div>

        <input
          type="radio"
          name="my_tabs_6"
          class="tab checked:bg-primary checked:text-primary-content"
          aria-label="ที่อยู่จัดส่ง"
        />
        <div class="tab-content bg-base-100 border-base-300 p-6">
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
              class="btn btn-primary btn-soft btn-sm"
              @click="shippingAddressFormModal?.onCreate()"
            >
              <Icon name="lucide:map-pin-plus" size="16" /> เพิ่มที่อยู่
            </button>
          </div>

          <div class="mt-5">
            <p
              v-if="shippingError"
              class="rounded-lg bg-warning/10 px-4 py-3 text-sm text-warning-content"
            >
              {{ shippingError }}
            </p>
            <div
              v-if="isShippingLoading"
              class="grid gap-3 sm:grid-cols-2 grid-cols-1"
            >
              <SkeletonAddressCards :count="2" />
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

            <div v-else class="grid gap-3 sm:grid-cols-2 grid-cols-1">
              <ShippingAddressCard
                v-for="shippingAddress in shippingAddresses"
                :key="shippingAddress.uuid"
                :shipping-address="shippingAddress"
                @saved="handleShippingAddressSaved"
              />
            </div>
          </div>
        </div>

        <input
          type="radio"
          name="my_tabs_6"
          class="tab checked:bg-primary checked:text-primary-content"
          aria-label="ข้อมูลผู้เสียภาษี"
        />
        <div class="tab-content bg-base-100 border-base-300 p-6">
          <div
            class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h2 class="text-xl font-bold">ข้อมูลผู้เสียภาษี</h2>
              <p class="mt-1 text-sm text-base-content/55">
                เพิ่ม แก้ไข หรือลบข้อมูลสำหรับใช้ขอใบกำกับภาษี
              </p>
            </div>
            <button
              class="btn btn-primary btn-soft btn-sm"
              @click="taxProfileFormModal?.onCreate()"
            >
              <Icon name="lucide:receipt-text" size="16" /> เพิ่มข้อมูลภาษี
            </button>
          </div>

          <div class="mt-5">
            <p
              v-if="taxError"
              class="rounded-lg bg-warning/10 px-4 py-3 text-sm text-warning-content"
            >
              {{ taxError }}
            </p>
            <div
              v-if="isTaxLoading"
              class="grid gap-3 sm:grid-cols-2 grid-cols-1"
            >
              <SkeletonAddressCards :count="2" />
            </div>
            <div v-else-if="!taxProfiles.length" class="py-10 text-center">
              <Icon
                name="lucide:receipt"
                size="34"
                class="mx-auto mb-3 text-base-content/30"
              />
              <p class="font-semibold">ยังไม่มีข้อมูลผู้เสียภาษี</p>
              <p class="mt-1 text-sm text-base-content/55">
                กดเพิ่มข้อมูลเพื่อสร้างรายการแรก
              </p>
            </div>
            <div v-else class="grid gap-3 sm:grid-cols-2 grid-cols-1">
              <TaxProfileCard
                v-for="taxProfile in taxProfiles"
                :key="taxProfile.uuid"
                :tax-profile="taxProfile"
                @saved="handleTaxProfileSaved"
              />
            </div>
          </div>
        </div>

        <input
          type="radio"
          name="my_tabs_6"
          class="tab checked:bg-primary checked:text-primary-content"
          aria-label="บัญชีธนาคาร"
        />
        <div class="tab-content bg-base-100 border-base-300 p-6">
          <div
            class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h2 class="text-xl font-bold">บัญชีธนาคาร</h2>
              <p class="mt-1 text-sm text-base-content/55">
                เพิ่ม แก้ไข หรือลบข้อมูลบัญชีธนาคาร
              </p>
            </div>
            <button
              class="btn btn-primary btn-soft btn-sm"
              @click="bankAccountFormModal?.open()"
            >
              <Icon name="lucide:badge-plus" size="16" /> เพิ่มข้อมูลบัญชีธนาคาร
            </button>
          </div>

          <div class="mt-5">
            <p
              v-if="bankListError"
              class="rounded-lg bg-warning/10 px-4 py-3 text-sm text-warning-content"
            >
              {{ bankListError }}
            </p>
            <div
              v-else-if="isBankLoading"
              class="grid gap-3 sm:grid-cols-2 grid-cols-1"
            >
              <SkeletonAddressCards :count="2" />
            </div>
            <div v-else-if="!bankAccounts.length" class="py-10 text-center">
              <Icon
                name="lucide:landmark"
                size="34"
                class="mx-auto mb-3 text-base-content/30"
              />
              <p class="font-semibold">ยังไม่มีข้อมูลบัญชีธนาคาร</p>
              <p class="mt-1 text-sm text-base-content/55">
                กดเพิ่มข้อมูลเพื่อบันทึกบัญชีธนาคารของคุณ
              </p>
            </div>
            <div v-else class="grid gap-3 sm:grid-cols-2 grid-cols-1">
              <BankAccountCard
                v-for="bankAccount in bankAccounts"
                :key="bankAccount.uuid"
                :bank-account="bankAccount"
                :default-holder-name="bankAccountDefaultHolderName"
                @saved="handleBankAccountSaved"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <ShippingAddressFormModal
    ref="shippingAddressFormModal"
    @saved="handleShippingAddressSaved"
  />

  <TaxProfileFormModal
    ref="taxProfileFormModal"
    @saved="handleTaxProfileSaved"
  />

  <BankAccountFormModal
    ref="bankAccountFormModal"
    :default-holder-name="bankAccountDefaultHolderName"
    @saved="handleBankAccountSaved"
  />
</template>

<script setup lang="ts">
definePageMeta({
  layout: "default",
});

const { showToast } = useToast();
const { syncFromStorage, user: currentUser } = useCurrentUser();

const shippingError = ref("");
const taxError = ref("");
const bankListError = ref("");

const isShippingLoading = ref(false);
const isTaxLoading = ref(false);
const isBankLoading = ref(false);

const shippingAddresses = ref<ShippingAddress[]>([]);
const taxProfiles = ref<TaxProfile[]>([]);
const bankAccounts = ref<BankAccount[]>([]);

const shippingAddressFormModal = ref<{
  onCreate: (initial?: Partial<ShippingAddressForm>) => void;
  onEdit: (address: ShippingAddress) => void;
} | null>(null);
const taxProfileFormModal = ref<{
  onCreate: (initial?: Partial<TaxProfileForm>) => void;
  onEdit: (profile: TaxProfile) => void;
} | null>(null);
const bankAccountFormModal = ref<{
  open: (account?: BankAccount | null) => void;
} | null>(null);

const bankAccountDefaultHolderName = computed(() =>
  `${currentUser.value?.firstname || ""} ${currentUser.value?.lastname || ""}`.trim(),
);

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

const loadTaxProfiles = async () => {
  taxError.value = "";
  if (!currentUser.value?.uuid) {
    taxProfiles.value = [];
    return;
  }
  isTaxLoading.value = true;
  try {
    taxProfiles.value = await fetchTaxProfiles(currentUser.value.uuid);
  } catch {
    taxError.value = "ไม่สามารถโหลดข้อมูลผู้เสียภาษีได้";
  } finally {
    isTaxLoading.value = false;
  }
};

const loadBankAccounts = async () => {
  bankListError.value = "";
  if (!currentUser.value?.uuid) {
    bankAccounts.value = [];
    return;
  }

  isBankLoading.value = true;
  try {
    bankAccounts.value = await fetchBankAccounts();
  } catch (error: any) {
    bankListError.value =
      error?.data?.statusMessage || "ไม่สามารถโหลดข้อมูลบัญชีธนาคารได้";
  } finally {
    isBankLoading.value = false;
  }
};

const handleTaxProfileSaved = async (mode: "create" | "edit" | "remove") => {
  if (mode === "remove") {
    await loadTaxProfiles();
    return;
  }
  showToast(
    mode === "create"
      ? "เพิ่มข้อมูลผู้เสียภาษีเรียบร้อยแล้ว"
      : "บันทึกข้อมูลผู้เสียภาษีเรียบร้อยแล้ว",
  );
  await loadTaxProfiles();
};

const handleBankAccountSaved = async (mode: "create" | "edit" | "remove") => {
  if (mode === "remove") {
    await loadBankAccounts();
    return;
  }
  showToast(
    mode === "create"
      ? "เพิ่มบัญชีธนาคารเรียบร้อยแล้ว"
      : "บันทึกการแก้ไขบัญชีธนาคารเรียบร้อยแล้ว",
  );
  await loadBankAccounts();
};

const handleShippingAddressSaved = async (
  action: "create" | "edit" | "remove",
) => {
  if (action === "remove") {
    await loadShippingAddresses();
    return;
  }

  showToast(
    action === "create"
      ? "เพิ่มที่อยู่จัดส่งเรียบร้อยแล้ว"
      : "บันทึกการแก้ไขที่อยู่เรียบร้อยแล้ว",
  );
  await loadShippingAddresses();
};

onMounted(async () => {
  syncFromStorage();
  await Promise.all([
    loadShippingAddresses(),
    loadTaxProfiles(),
    loadBankAccounts(),
  ]);
});
</script>
