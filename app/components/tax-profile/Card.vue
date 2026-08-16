<template>
  <article
    class="rounded-2xl border border-base-300 bg-base-100 p-4 transition hover:translate-y-[-1px] hover:shadow-md"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <h3 class="truncate font-bold">
            {{ taxProfile.tax_profile_label }}
          </h3>
          <span
            v-if="taxProfile.tax_profile_is_default"
            class="badge badge-success sm:py-2 py-1.5 badge-xs"
            >Default</span
          >
          <span class="badge badge-outline badge-primary sm:py-2 py-1.5 badge-xs">{{
            taxProfile.taxpayer_type === "company" ? "นิติบุคคล" : "บุคคลธรรมดา"
          }}</span>
        </div>
        <p class="mt-1 text-sm font-semibold">
          {{ taxProfile.taxpayer_name }}
        </p>
        <p class="mt-1 text-sm text-base-content/65">
          เลขประจำตัวผู้เสียภาษี {{ taxProfile.taxpayer_id }}
        </p>
        <p
          v-if="taxProfile.taxpayer_type === 'company'"
          class="mt-1 text-xs text-base-content/55"
        >
          {{
            taxProfile.taxpayer_branch_type === "head_office"
              ? "สำนักงานใหญ่"
              : `สาขา ${taxProfile.taxpayer_branch_code}`
          }}
        </p>
      </div>
      <div v-if="!readonly" class="flex shrink-0 gap-1">
        <button
          class="btn btn-ghost btn-square btn-sm text-secondary"
          aria-label="แก้ไขข้อมูลผู้เสียภาษี"
          @click="taxProfileFormModal?.onEdit(taxProfile)"
        >
          <Icon name="lucide:pencil" size="16" />
        </button>
        <button
          class="btn btn-ghost btn-square btn-sm text-error"
          aria-label="ลบข้อมูลผู้เสียภาษี"
          @click="openRemoveTaxProfileModal(taxProfile)"
        >
          <Icon name="lucide:trash-2" size="16" />
        </button>
      </div>
    </div>

    <div
      :class="`mt-3 rounded-xl ${taxProfile.tax_profile_is_default ? 'bg-success/20' : 'bg-base-200'} p-4 space-y-2`"
    >
      <p class="text-sm leading-6 text-base-content/65">
        {{ formatTaxProfileAddress(taxProfile) }}
      </p>
      <p
        v-if="taxProfile.taxpayer_phone"
        class="mt-1 text-sm text-base-content/65"
      >
        {{ taxProfile.taxpayer_phone }}
      </p>
      <p
        v-if="taxProfile.taxpayer_email"
        class="mt-1 text-sm text-base-content/65"
      >
        {{ taxProfile.taxpayer_email }}
      </p>
    </div>
  </article>

  <TaxProfileFormModal
    ref="taxProfileFormModal"
    @saved="handleTaxProfileSaved"
  />

  <ModalRemoveConfirm
    v-model="isTaxConfirmOpen"
    title="ยืนยันการลบข้อมูลผู้เสียภาษี"
    :message="taxRemoveConfirmMessage"
    confirm-text="ลบข้อมูล"
    variant="error"
    :loading="isRemovingTaxProfile"
    @confirm="saveRemoveTaxProfile"
  />
</template>

<script setup lang="ts">
const { showToast } = useToast();

defineProps<{
  taxProfile: TaxProfile;
  readonly?: boolean;
}>();

const taxProfileFormModal = ref<{
  onEdit: (profile: TaxProfile) => void;
} | null>(null);
const removeTaxProfileTarget = ref<TaxProfile | null>(null);
const isTaxConfirmOpen = ref(false);
const isRemovingTaxProfile = ref(false);

const emit = defineEmits<{
  saved: [mode: "edit" | "remove"];
}>();

const taxRemoveConfirmMessage = computed(
  () =>
    `คุณต้องการลบ ${removeTaxProfileTarget.value?.tax_profile_label || "รายการนี้"} ใช่หรือไม่`,
);

const handleTaxProfileSaved = (mode: "create" | "edit") => {
  if (mode === "edit") emit("saved", "edit");
};

const openRemoveTaxProfileModal = (profile: TaxProfile) => {
  removeTaxProfileTarget.value = profile;
  isTaxConfirmOpen.value = true;
};

const saveRemoveTaxProfile = async () => {
  if (!removeTaxProfileTarget.value || isRemovingTaxProfile.value) return;
  isRemovingTaxProfile.value = true;

  try {
    await deleteTaxProfile(removeTaxProfileTarget.value.uuid);
    removeTaxProfileTarget.value = null;
    isTaxConfirmOpen.value = false;
    showToast("ลบข้อมูลผู้เสียภาษีเรียบร้อยแล้ว");
    emit("saved", "remove");
  } catch (error: any) {
    showToast(error?.data?.statusMessage || "ไม่สามารถลบข้อมูลผู้เสียภาษีได้");
  } finally {
    isRemovingTaxProfile.value = false;
  }
};
</script>
