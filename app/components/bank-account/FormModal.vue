<template>
  <dialog ref="dialog" class="modal" @close="onDialogClose">
    <div class="modal-box max-w-xl p-0">
      <div
        class="flex items-start justify-between border-b border-base-300 px-5 py-5 sm:px-6"
      >
        <div class="flex items-center gap-3">
          <div
            class="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"
          >
            <Icon name="lucide:landmark" size="22" />
          </div>
          <div>
            <h2 class="text-xl font-bold">
              {{ mode === "create" ? "เพิ่มบัญชีธนาคาร" : "แก้ไขบัญชีธนาคาร" }}
            </h2>
            <p class="mt-1 text-sm text-base-content/60">
              ข้อมูลบัญชีสำหรับรับเงินหรือทำรายการกับระบบ
            </p>
          </div>
        </div>
        <button
          class="btn btn-circle btn-ghost btn-sm"
          type="button"
          aria-label="ปิด"
          @click="close"
        >
          <Icon name="lucide:x" size="18" />
        </button>
      </div>
      <p
        v-if="bankError"
        class="mx-5 mt-4 rounded-lg bg-warning/10 px-4 py-3 text-sm text-warning-content sm:mx-6"
      >
        {{ bankError }}
      </p>
      <form class="space-y-4 p-5 sm:p-6" @submit.prevent="requestSave">
        <div
          v-if="selectedBank"
          class="flex items-center gap-3 rounded-2xl border border-primary/15 bg-primary/5 p-3"
        >
          <img
            :src="selectedBank.icon"
            :alt="selectedBank.fullname"
            class="size-11 rounded-xl bg-base-100 object-contain p-1.5 shadow-sm"
          />
          <div class="min-w-0">
            <p class="truncate font-semibold">{{ selectedBank.fullname }}</p>
            <p class="text-xs text-base-content/55">
              {{ selectedBank.nameEN }} · {{ selectedBank.symbol }}
            </p>
          </div>
        </div>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">
            ธนาคาร <span class="text-error">*</span>
          </legend>
          <select
            v-model="form.bank_account_bank_code"
            class="select select-sm w-full"
            required
          >
            <option value="" disabled>เลือกธนาคาร</option>
            <option
              v-for="bank in thaiBankOptions"
              :key="bank.symbol"
              :value="bank.symbol"
            >
              {{ bank.fullname }} ({{ bank.symbol }})
            </option>
          </select>
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">
            ชื่อเจ้าของบัญชี <span class="text-error">*</span>
          </legend>
          <input
            v-model.trim="form.bank_account_holder_name"
            type="text"
            class="input input-sm w-full"
            maxlength="255"
            autocomplete="name"
            placeholder="ชื่อและนามสกุลตามบัญชีธนาคาร"
            required
          />
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">
            หมายเลขบัญชีธนาคาร
            <span v-if="mode === 'create'" class="text-error">*</span>
          </legend>
          <input
            v-model.trim="form.bank_account_number"
            type="text"
            inputmode="numeric"
            autocomplete="off"
            class="input input-sm w-full font-mono tracking-wide"
            minlength="10"
            maxlength="20"
            pattern="[0-9 -]{10,20}"
            :required="mode === 'create'"
            :placeholder="
              mode === 'create'
                ? 'กรอกหมายเลขบัญชี 10–15 หลัก'
                : `เลขปัจจุบัน ${maskedNumber || 'ถูกบันทึกแล้ว'} — เว้นว่างหากไม่เปลี่ยน`
            "
          />
          <p class="mt-1 text-xs text-base-content/55">
            {{
              mode === "edit"
                ? "กรอกเลขบัญชีใหม่เฉพาะเมื่อต้องการเปลี่ยนหมายเลข"
                : "ระบบจะเข้ารหัสหมายเลขบัญชีก่อนบันทึก"
            }}
          </p>
        </fieldset>

        <div class="modal-action gap-3">
          <button
            class="btn flex-1"
            type="button"
            :disabled="isSaving"
            @click="close"
          >
            ยกเลิก
          </button>
          <button
            class="btn btn-primary flex-1"
            type="submit"
            :disabled="isSaving"
          >
            <span v-if="isSaving" class="loading loading-spinner loading-xs" />
            <template v-else>
              {{ mode === "create" ? "เพิ่มบัญชี" : "บันทึกการแก้ไข" }}
            </template>
          </button>
        </div>
      </form>
    </div>
    <form method="dialog" class="modal-backdrop"><button>ปิด</button></form>
  </dialog>

  <ModalRemoveConfirm
    v-model="isSaveConfirmOpen"
    :title="confirmTitle"
    message="กรุณาตรวจสอบชื่อเจ้าของบัญชี ธนาคาร และหมายเลขบัญชีก่อนบันทึก"
    confirm-text="บันทึก"
    variant="primary"
    :loading="isSaving"
    @confirm="saveBankAccount"
    @cancel="reopenBankFormAfterCancel"
  />
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    defaultHolderName?: string;
  }>(),
  {
    defaultHolderName: "",
  },
);

const emit = defineEmits<{
  saved: [mode: "create" | "edit"];
}>();

const dialog = ref<HTMLDialogElement | null>(null);
const form = ref<BankAccountForm>(createBankAccountForm());
const bankError = ref("");
const isOpen = ref(false);
const isSaving = ref(false);
const isSaveConfirmOpen = ref(false);
const account = ref<BankAccount | null>(null);

const mode = computed<"create" | "edit">(() =>
  account.value ? "edit" : "create",
);
const maskedNumber = computed(
  () => account.value?.bank_account_number_masked || "",
);
const selectedBank = computed(() =>
  getThaiBank(form.value.bank_account_bank_code),
);
const confirmTitle = computed(() =>
  mode.value === "create"
    ? "ยืนยันการเพิ่มบัญชีธนาคาร"
    : "ยืนยันการแก้ไขบัญชีธนาคาร",
);

const resetForm = () => {
  bankError.value = "";
  form.value = account.value
    ? toBankAccountForm(account.value)
    : createBankAccountForm({
        bank_account_holder_name: props.defaultHolderName,
      });
};

const open = (targetAccount: BankAccount | null = null) => {
  account.value = targetAccount;
  resetForm();
  isOpen.value = true;
};

const close = () => {
  isOpen.value = false;
};

const onDialogClose = () => {
  isOpen.value = false;
};

const validateForm = () => {
  bankError.value = "";
  const accountNumber = String(form.value.bank_account_number || "").replace(
    /[^0-9]/g,
    "",
  );
  const holderName = String(form.value.bank_account_holder_name || "").trim();

  if (!form.value.bank_account_bank_code) {
    bankError.value = "กรุณาเลือกธนาคาร";
    return false;
  }

  if (!holderName) {
    bankError.value = "กรุณากรอกชื่อเจ้าของบัญชี";
    return false;
  }

  if (
    (mode.value === "create" || accountNumber) &&
    !/^[0-9]{10,15}$/.test(accountNumber)
  ) {
    bankError.value = "หมายเลขบัญชีธนาคารต้องเป็นตัวเลข 10–15 หลัก";
    return false;
  }

  form.value.bank_account_holder_name = holderName;
  form.value.bank_account_number = accountNumber;
  return true;
};

const requestSave = async () => {
  if (!validateForm()) return;

  close();
  await nextTick();
  isSaveConfirmOpen.value = true;
};

const reopenBankFormAfterCancel = async () => {
  await nextTick();
  isOpen.value = true;
};

const saveBankAccount = async () => {
  const action = mode.value;
  isSaving.value = true;
  bankError.value = "";

  try {
    if (action === "edit" && account.value) {
      await updateBankAccount(account.value.uuid, form.value);
    } else {
      await createBankAccount(form.value);
    }

    isSaveConfirmOpen.value = false;
    emit("saved", action);
  } catch (error: any) {
    bankError.value =
      error?.data?.statusMessage ||
      (action === "create"
        ? "ไม่สามารถเพิ่มบัญชีธนาคารได้"
        : "ไม่สามารถแก้ไขบัญชีธนาคารได้");
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

defineExpose({ open, close });
</script>
