<template>
  <dialog ref="dialog" class="modal" @cancel.prevent="close">
    <div class="modal-box max-h-[92dvh] max-w-5xl overflow-y-auto">
      <header class="flex shrink-0 justify-between">
        <h3 class="text-lg font-bold ml-1">
          {{
            adminContext.mode === "create"
              ? "เพิ่มผู้ใช้งานระบบ"
              : "แก้ไขผู้ใช้งานระบบ"
          }}
        </h3>

        <button
          class="btn btn-sm btn-circle btn-ghost shrink-0"
          type="button"
          :disabled="isSaving"
          aria-label="ปิดหน้าต่าง"
          @click="close"
        >
          <Icon name="lucide:x" size="18" />
        </button>
      </header>

      <div class="tabs tabs-box mt-3">
        <input
          v-model="activeTab"
          type="radio"
          name="user_form_tabs"
          value="profile"
          class="tab checked:bg-primary checked:text-primary-content"
          aria-label="แก้ไขข้อมูลผู้ใช้"
        />
        <div class="tab-content bg-base-100 border-base-300 px-4 pb-4">
          <UserProfileForm
            ref="userProfileForm"
            :admin-context="adminContext"
            @saved="handleSaved"
            @save-error="handleSaveError"
            @saving="isSaving = $event"
          />
        </div>

        <input
          v-if="adminContext.mode === 'edit'"
          v-model="activeTab"
          type="radio"
          name="user_form_tabs"
          value="line"
          class="tab checked:bg-primary checked:text-primary-content"
          aria-label="LINE"
        />
        <div
          v-if="adminContext.mode === 'edit'"
          class="tab-content bg-base-100 border-base-300 px-4 pb-4"
        >
          <LineAccountCard admin-context :user-uuid="selectedUserUuid" />
        </div>

        <input
          v-if="adminContext.mode === 'edit'"
          v-model="activeTab"
          type="radio"
          name="user_form_tabs"
          value="shipping"
          class="tab checked:bg-primary checked:text-primary-content"
          aria-label="ที่อยู่"
        />
        <div
          v-if="adminContext.mode === 'edit'"
          class="tab-content bg-base-100 border-base-300 p-4"
        >
          <p
            v-if="shippingError"
            class="rounded-lg bg-warning/10 px-4 py-3 text-sm text-warning-content"
          >
            {{ shippingError }}
          </p>
          <div
            v-if="isShippingLoading"
            class="grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            <SkeletonAddressCards :count="2" />
          </div>
          <div v-else-if="!shippingAddresses.length" class="py-10 text-center">
            <Icon
              name="lucide:map-pin-off"
              size="34"
              class="mx-auto mb-3 text-base-content/30"
            />
            <p class="font-semibold">ยังไม่มีที่อยู่จัดส่ง</p>
          </div>
          <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ShippingAddressCard
              v-for="shippingAddress in shippingAddresses"
              :key="shippingAddress.uuid"
              :shipping-address="shippingAddress"
              readonly
            />
          </div>
        </div>

        <input
          v-if="adminContext.mode === 'edit'"
          v-model="activeTab"
          type="radio"
          name="user_form_tabs"
          value="tax"
          class="tab checked:bg-primary checked:text-primary-content"
          aria-label="ข้อมูลผู้เสียภาษี"
        />
        <div
          v-if="adminContext.mode === 'edit'"
          class="tab-content bg-base-100 border-base-300 p-4"
        >
          <p
            v-if="taxError"
            class="rounded-lg bg-warning/10 px-4 py-3 text-sm text-warning-content"
          >
            {{ taxError }}
          </p>
          <div
            v-if="isTaxLoading"
            class="grid grid-cols-1 gap-3 sm:grid-cols-2"
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
          </div>
          <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TaxProfileCard
              v-for="taxProfile in taxProfiles"
              :key="taxProfile.uuid"
              :tax-profile="taxProfile"
              readonly
            />
          </div>
        </div>

        <input
          v-if="adminContext.mode === 'edit'"
          v-model="activeTab"
          type="radio"
          name="user_form_tabs"
          value="bank"
          class="tab checked:bg-primary checked:text-primary-content"
          aria-label="บัญชีธนาคาร"
        />
        <div
          v-if="adminContext.mode === 'edit'"
          class="tab-content bg-base-100 border-base-300 p-4"
        >
          <p
            v-if="bankListError"
            class="rounded-lg bg-warning/10 px-4 py-3 text-sm text-warning-content"
          >
            {{ bankListError }}
          </p>
          <div
            v-if="isBankLoading"
            class="grid grid-cols-1 gap-3 sm:grid-cols-2"
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
          </div>
          <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <BankAccountCard
              v-for="bankAccount in bankAccounts"
              :key="bankAccount.uuid"
              :bank-account="bankAccount"
              readonly
              show-full-account-number
            />
          </div>
        </div>
      </div>
    </div>
  </dialog>
</template>

<script setup lang="ts">
import type { AdminUserContext, UserRecord } from "~/composables/useUsers";

type UserProfileFormExpose = {
  onSubmit: () => Promise<void>;
};

type RowsResponse<T> = {
  rows: T[];
};

const emit = defineEmits<{
  changed: [row: UserRecord];
  "save-error": [error: unknown, row: UserRecord];
  close: [];
}>();

const dialog = ref<HTMLDialogElement | null>(null);
const userProfileForm = ref<UserProfileFormExpose | null>(null);
const adminContext = ref<AdminUserContext>({ mode: "create" });
const activeTab = ref("profile");
const isSaving = ref(false);
const selectedUserUuid = computed(() =>
  adminContext.value.mode === "edit"
    ? String(adminContext.value.user.uuid || "")
    : "",
);

const shippingError = ref("");
const taxError = ref("");
const bankListError = ref("");

const isShippingLoading = ref(false);
const isTaxLoading = ref(false);
const isBankLoading = ref(false);

const shippingAddresses = ref<ShippingAddress[]>([]);
const taxProfiles = ref<TaxProfile[]>([]);
const bankAccounts = ref<BankAccount[]>([]);

let relatedRequestId = 0;

const open = () => {
  if (!dialog.value?.open) dialog.value?.showModal();
};

const close = () => {
  if (isSaving.value) return;

  dialog.value?.close();
  emit("close");
};

const resetRelatedData = () => {
  shippingError.value = "";
  taxError.value = "";
  bankListError.value = "";
  isShippingLoading.value = false;
  isTaxLoading.value = false;
  isBankLoading.value = false;
  shippingAddresses.value = [];
  taxProfiles.value = [];
  bankAccounts.value = [];
};

const onCreate = async () => {
  relatedRequestId += 1;
  adminContext.value = { mode: "create" };
  activeTab.value = "profile";
  resetRelatedData();

  await nextTick();
  open();
};

const onEdit = async (row: UserRecord) => {
  const userUuid = String(row.uuid || "").trim();
  const requestId = ++relatedRequestId;

  adminContext.value = {
    mode: "edit",
    user: { ...row },
  };
  activeTab.value = "profile";
  resetRelatedData();

  await nextTick();
  open();

  if (!userUuid) {
    const message = "ไม่พบ UUID ของผู้ใช้งาน";
    shippingError.value = message;
    taxError.value = message;
    bankListError.value = message;
    return;
  }

  await Promise.all([
    loadShippingAddresses(userUuid, requestId),
    loadTaxProfiles(userUuid, requestId),
    loadBankAccounts(userUuid, requestId),
  ]);
};

const onSubmit = async () => {
  await userProfileForm.value?.onSubmit();
};

const handleSaved = (row: UserRecord) => {
  dialog.value?.close();
  emit("changed", row);
};

const handleSaveError = (error: unknown, row: UserRecord) => {
  emit("save-error", error, row);
};

const getErrorMessage = (error: any, fallback: string) =>
  error?.data?.statusMessage || error?.statusMessage || fallback;

const loadShippingAddresses = async (userUuid: string, requestId: number) => {
  shippingError.value = "";
  isShippingLoading.value = true;

  try {
    const response = await $fetch<RowsResponse<ShippingAddress>>(
      "/api/user/shipping-addresses",
      {
        query: { user_uuid: userUuid, page: 1, pageSize: 100 },
      },
    );

    if (requestId === relatedRequestId) {
      shippingAddresses.value = response.rows;
    }
  } catch (error: any) {
    if (requestId === relatedRequestId) {
      shippingError.value = getErrorMessage(
        error,
        "ไม่สามารถโหลดข้อมูลที่อยู่จัดส่งได้",
      );
    }
  } finally {
    if (requestId === relatedRequestId) {
      isShippingLoading.value = false;
    }
  }
};

const loadTaxProfiles = async (userUuid: string, requestId: number) => {
  taxError.value = "";
  isTaxLoading.value = true;

  try {
    const response = await $fetch<RowsResponse<TaxProfile>>(
      "/api/user/tax-profiles",
      {
        query: { user_uuid: userUuid, page: 1, pageSize: 100 },
      },
    );

    if (requestId === relatedRequestId) {
      taxProfiles.value = response.rows;
    }
  } catch (error: any) {
    if (requestId === relatedRequestId) {
      taxError.value = getErrorMessage(
        error,
        "ไม่สามารถโหลดข้อมูลผู้เสียภาษีได้",
      );
    }
  } finally {
    if (requestId === relatedRequestId) {
      isTaxLoading.value = false;
    }
  }
};

const loadBankAccounts = async (userUuid: string, requestId: number) => {
  bankListError.value = "";
  isBankLoading.value = true;

  try {
    const response = await $fetch<RowsResponse<BankAccount>>(
      "/api/user/bank-accounts",
      {
        query: {
          user_uuid: userUuid,
          include_account_number: true,
          page: 1,
          pageSize: 100,
        },
      },
    );

    if (requestId === relatedRequestId) {
      bankAccounts.value = response.rows;
    }
  } catch (error: any) {
    if (requestId === relatedRequestId) {
      bankListError.value = getErrorMessage(
        error,
        "ไม่สามารถโหลดข้อมูลบัญชีธนาคารได้",
      );
    }
  } finally {
    if (requestId === relatedRequestId) {
      isBankLoading.value = false;
    }
  }
};

defineExpose({ onCreate, onEdit, onSubmit });
</script>
