<template>
  <article
    :key="bankAccount.uuid"
    class="overflow-hidden rounded-2xl border border-base-300 bg-base-100 transition hover:translate-y-[-1px] hover:shadow-md"
  >
    <div class="h-1.5 bg-primary" />
    <div class="p-4 sm:p-5">
      <div class="flex items-start justify-between gap-3">
        <div class="flex min-w-0 items-center gap-3">
          <img
            v-if="getThaiBank(bankAccount.bank_account_bank_code)"
            :src="getThaiBank(bankAccount.bank_account_bank_code)?.icon"
            :alt="getThaiBank(bankAccount.bank_account_bank_code)?.fullname"
            class="size-12 shrink-0 rounded-xl border border-base-300 bg-base-100 object-contain p-1.5"
          />
          <div
            v-else
            class="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
          >
            <Icon name="lucide:landmark" size="23" />
          </div>
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="truncate font-bold">
                {{
                  getThaiBank(bankAccount.bank_account_bank_code)?.fullname ||
                  bankAccount.bank_account_bank_code
                }}
              </h3>
              <span
                class="badge badge-soft badge-primary badge-xs sm:py-2 py-1.5 font-bold"
              >
                {{ bankAccount.bank_account_bank_code }}
              </span>
            </div>
            <p class="mt-1 truncate text-sm text-base-content/60">
              {{
                getThaiBank(bankAccount.bank_account_bank_code)?.nameEN ||
                "Bank bankAccount"
              }}
            </p>
          </div>
        </div>
        <div v-if="!props.readonly" class="flex shrink-0 gap-1">
          <button
            class="btn btn-ghost btn-square btn-sm text-secondary"
            aria-label="แก้ไขบัญชีธนาคาร"
            @click="bankAccountFormModal?.open(bankAccount)"
          >
            <Icon name="lucide:pencil" size="16" />
          </button>
          <button
            class="btn btn-ghost btn-square btn-sm text-error"
            aria-label="ลบบัญชีธนาคาร"
            @click="openRemoveBankAccountModal(bankAccount)"
          >
            <Icon name="lucide:trash-2" size="16" />
          </button>
        </div>
      </div>

      <div class="grid grid-cols-2 mt-5 rounded-xl bg-base-200/65 p-4">
        <div>
          <p class="text-xs text-base-content/50">ชื่อเจ้าของบัญชี</p>
          <p class="mt-1 font-semibold">
            {{ bankAccount.bank_account_holder_name }}
          </p>
        </div>
        <div>
          <p class="text-xs text-base-content/50">หมายเลขบัญชี</p>
          <p class="mt-1 font-mono text-lg font-bold tracking-wider">
            {{ displayedAccountNumber }}
          </p>
        </div>
      </div>
    </div>
  </article>

  <BankAccountFormModal
    ref="bankAccountFormModal"
    :default-holder-name="defaultHolderName"
    @saved="handleBankAccountSaved"
  />

  <ModalRemoveConfirm
    v-model="isBankConfirmOpen"
    title="ยืนยันการลบบัญชีธนาคาร"
    :message="bankRemoveConfirmMessage"
    confirm-text="ลบบัญชี"
    variant="error"
    :loading="isRemovingBankAccount"
    @confirm="saveRemoveBankAccount"
  />
</template>

<script setup lang="ts">
const { showToast } = useToast();

const props = defineProps<{
  bankAccount: BankAccount;
  defaultHolderName?: string;
  readonly?: boolean;
  showFullAccountNumber?: boolean;
}>();

const displayedAccountNumber = computed(() =>
  props.showFullAccountNumber && props.bankAccount.bank_account_number
    ? props.bankAccount.bank_account_number
    : props.bankAccount.bank_account_number_masked,
);

const bankAccountFormModal = ref<{
  open: (bankAccount?: BankAccount | null) => void;
} | null>(null);
const removeBankAccountTarget = ref<BankAccount | null>(null);
const isBankConfirmOpen = ref(false);
const isRemovingBankAccount = ref(false);

const emit = defineEmits<{
  saved: [mode: "edit" | "remove"];
}>();

const handleBankAccountSaved = (mode: "create" | "edit") => {
  emit("saved", mode as "edit" | "remove");
};

const openRemoveBankAccountModal = (bankAccount: BankAccount) => {
  removeBankAccountTarget.value = bankAccount;
  isBankConfirmOpen.value = true;
};

const bankRemoveConfirmMessage = computed(
  () =>
    `คุณต้องการลบบัญชี ${removeBankAccountTarget.value?.bank_account_number_masked || "รายการนี้"} ใช่หรือไม่`,
);

const saveRemoveBankAccount = async () => {
  if (!removeBankAccountTarget.value) return;
  isRemovingBankAccount.value = true;

  try {
    await deleteBankAccount(removeBankAccountTarget.value.uuid);
    removeBankAccountTarget.value = null;
    isBankConfirmOpen.value = false;
    showToast("ลบบัญชีธนาคารเรียบร้อยแล้ว");
    emit("saved", "remove");
  } catch (error: any) {
    showToast(error?.data?.statusMessage || "ไม่สามารถลบบัญชีธนาคารได้");
  } finally {
    isRemovingBankAccount.value = false;
  }
};
</script>
