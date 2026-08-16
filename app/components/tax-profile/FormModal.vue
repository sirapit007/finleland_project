<template>
  <dialog
    ref="dialog"
    class="modal"
    @cancel.prevent="close"
    @close="onDialogClose"
  >
    <div class="modal-box max-w-3xl p-0">
      <div
        class="flex items-center justify-between border-b border-base-300 px-5 py-6 sm:px-6"
      >
        <div>
          <h2 class="text-xl font-bold">
            {{
              mode === "create"
                ? "เพิ่มข้อมูลผู้เสียภาษี"
                : "แก้ไขข้อมูลผู้เสียภาษี"
            }}
          </h2>
          <p class="mt-1 text-sm text-base-content/60">
            ข้อมูลนี้จะใช้สำหรับออกใบกำกับภาษีของคำสั่งซื้อ
          </p>
        </div>
        <button
          class="btn btn-circle btn-ghost btn-sm"
          type="button"
          @click="close"
        >
          <Icon name="lucide:x" size="18" />
        </button>
      </div>
      <p
        v-if="taxError"
        class="mx-5 mt-4 rounded-lg bg-warning/10 px-4 py-3 text-sm text-warning-content sm:mx-6"
      >
        {{ taxError }}
      </p>

      <form @submit.prevent="requestSave">
        <div class="max-h-[76vh] space-y-2.5 overflow-y-auto p-5 sm:p-6">
          <div class="grid gap-4 sm:grid-cols-2">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">ชื่อรายการ</legend>
              <input
                v-model.trim="form.tax_profile_label"
                class="input input-sm w-full"
                placeholder="ส่วนตัว / บริษัท"
                maxlength="100"
                required
              />
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">ประเภทผู้เสียภาษี</legend>
              <select
                v-model="form.taxpayer_type"
                class="select select-sm w-full"
                @change="onTaxpayerTypeChange"
              >
                <option value="individual">บุคคลธรรมดา</option>
                <option value="company">นิติบุคคล</option>
              </select>
            </fieldset>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                ชื่อผู้เสียภาษี / ชื่อบริษัท
              </legend>
              <input
                v-model.trim="form.taxpayer_name"
                class="input input-sm w-full"
                placeholder="ชื่อที่ใช้ในใบกำกับภาษี"
                maxlength="200"
                required
              />
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">เลขประจำตัวผู้เสียภาษี</legend>
              <input
                v-model.trim="form.taxpayer_id"
                inputmode="numeric"
                pattern="[0-9]{13}"
                minlength="13"
                maxlength="13"
                class="input input-sm w-full"
                placeholder="ตัวเลข 13 หลัก"
                required
              />
            </fieldset>
          </div>

          <div
            v-if="form.taxpayer_type === 'company'"
            class="grid gap-4 sm:grid-cols-2"
          >
            <fieldset class="fieldset">
              <legend class="fieldset-legend">ประเภทสาขา</legend>
              <select
                v-model="form.taxpayer_branch_type"
                class="select select-sm w-full"
                @change="onBranchTypeChange"
              >
                <option value="head_office">สำนักงานใหญ่</option>
                <option value="branch">สาขา</option>
              </select>
            </fieldset>
            <fieldset
              v-if="form.taxpayer_branch_type === 'branch'"
              class="fieldset"
            >
              <legend class="fieldset-legend">รหัสสาขา</legend>
              <input
                v-model.trim="form.taxpayer_branch_code"
                inputmode="numeric"
                pattern="[0-9]{5}"
                minlength="5"
                maxlength="5"
                class="input input-sm w-full"
                placeholder="ตัวเลข 5 หลัก"
                required
              />
            </fieldset>
          </div>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">ที่อยู่ผู้เสียภาษี</legend>
            <textarea
              v-model.trim="form.taxpayer_address"
              class="textarea textarea-sm min-h-24 w-full"
              placeholder="บ้านเลขที่ อาคาร ถนน ซอย"
              required
            />
          </fieldset>

          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">จังหวัด</legend>
              <select
                :value="form.taxpayer_province"
                class="select select-sm w-full"
                required
                @change="onProvinceChange"
              >
                <option value="" disabled>เลือกจังหวัด</option>
                <option
                  v-for="province in provinces"
                  :key="province.provinceCode"
                  :value="province.provinceNameTh"
                >
                  {{ province.provinceNameTh }}
                </option>
              </select>
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">อำเภอ / เขต</legend>
              <select
                :value="form.taxpayer_district"
                class="select select-sm w-full"
                :disabled="!selectedProvince"
                required
                @change="onDistrictChange"
              >
                <option value="" disabled>
                  {{
                    selectedProvince ? "เลือกอำเภอ / เขต" : "เลือกจังหวัดก่อน"
                  }}
                </option>
                <option
                  v-for="district in districtOptions"
                  :key="district.districtCode"
                  :value="district.districtNameTh"
                >
                  {{ district.districtNameTh }}
                </option>
              </select>
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">ตำบล / แขวง</legend>
              <select
                :value="form.taxpayer_subdistrict"
                class="select select-sm w-full"
                :disabled="!selectedDistrict"
                required
                @change="onSubdistrictChange"
              >
                <option value="" disabled>
                  {{
                    selectedDistrict
                      ? "เลือกตำบล / แขวง"
                      : "เลือกอำเภอ / เขตก่อน"
                  }}
                </option>
                <option
                  v-for="subdistrict in subdistrictOptions"
                  :key="subdistrict.subdistrictCode"
                  :value="subdistrict.subdistrictNameTh"
                >
                  {{ subdistrict.subdistrictNameTh }}
                </option>
              </select>
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">รหัสไปรษณีย์</legend>
              <input
                v-model.trim="form.taxpayer_postcode"
                class="input input-sm w-full"
                inputmode="numeric"
                placeholder="10110"
                disabled
              />
            </fieldset>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">เบอร์โทรศัพท์ (ไม่บังคับ)</legend>
              <input
                v-model.trim="form.taxpayer_phone"
                type="tel"
                inputmode="numeric"
                pattern="[0-9]{10}"
                minlength="10"
                maxlength="10"
                class="input input-sm w-full"
                placeholder="กรอกเบอร์โทรศัพท์ 10 หลัก"
              />
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">อีเมล (ไม่บังคับ)</legend>
              <input
                v-model.trim="form.taxpayer_email"
                type="email"
                maxlength="254"
                class="input input-sm w-full"
                placeholder="tax@example.com"
              />
            </fieldset>
          </div>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">ข้อมูลหลัก</legend>
            <label
              class="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-base-300 p-4"
            >
              <input
                v-model="form.tax_profile_is_default"
                type="checkbox"
                class="checkbox checkbox-primary"
              />
              <div>
                <p class="text-sm font-semibold">
                  ตั้งเป็นข้อมูลผู้เสียภาษีหลัก
                </p>
                <p class="text-xs text-base-content/55">
                  ระบบจะเลือกรายการนี้เป็นค่าเริ่มต้นในตะกร้า
                </p>
              </div>
            </label>
          </fieldset>
        </div>

        <div class="modal-action gap-3 p-5 sm:p-6">
          <button
            class="btn flex-1"
            type="button"
            :disabled="isSaving"
            @click="close"
          >
            ปิด
          </button>
          <button
            class="btn btn-primary flex-1"
            type="submit"
            :disabled="isSaving"
          >
            <span v-if="isSaving" class="loading loading-spinner loading-xs" />
            <template v-else>บันทึกข้อมูล</template>
          </button>
        </div>
      </form>
    </div>
    <form method="dialog" class="modal-backdrop"><button>ปิด</button></form>
  </dialog>

  <ModalRemoveConfirm
    v-model="isSaveConfirmOpen"
    :title="confirmTitle"
    message="กรุณาตรวจสอบชื่อ เลขประจำตัวผู้เสียภาษี และที่อยู่ก่อนบันทึก"
    confirm-text="บันทึก"
    variant="primary"
    :loading="isSaving"
    @confirm="saveTaxProfile"
    @cancel="reopenTaxFormAfterCancel"
  />
</template>

<script setup lang="ts">
import provincesData from "thailand-geography-json/src/provinces.json";
import districtsData from "thailand-geography-json/src/districts.json";
import subdistrictsData from "thailand-geography-json/src/subdistricts.json";

type Province = { provinceCode: number; provinceNameTh: string };
type District = {
  provinceCode: number;
  districtCode: number;
  districtNameTh: string;
};
type Subdistrict = {
  provinceCode: number;
  districtCode: number;
  subdistrictCode: number;
  subdistrictNameTh: string;
  postalCode: number;
};

const emit = defineEmits<{
  saved: [mode: "create" | "edit", profile: TaxProfile];
}>();

const dialog = ref<HTMLDialogElement | null>(null);
const form = ref<TaxProfileForm>(createTaxProfileForm());
const profile = ref<TaxProfile | null>(null);
const isOpen = ref(false);
const isSaving = ref(false);
const isSaveConfirmOpen = ref(false);
const taxError = ref("");

const provinces = provincesData as Province[];
const districts = districtsData as District[];
const subdistricts = subdistrictsData as Subdistrict[];

const mode = computed<"create" | "edit">(() =>
  profile.value ? "edit" : "create",
);
const confirmTitle = computed(() =>
  mode.value === "create"
    ? "ยืนยันการบันทึกข้อมูลผู้เสียภาษี"
    : "ยืนยันการแก้ไขข้อมูลผู้เสียภาษี",
);
const selectedProvince = computed(() =>
  provinces.find(
    (province) => province.provinceNameTh === form.value.taxpayer_province,
  ),
);
const districtOptions = computed(() =>
  selectedProvince.value
    ? districts.filter(
        (district) =>
          district.provinceCode === selectedProvince.value?.provinceCode,
      )
    : [],
);
const selectedDistrict = computed(() =>
  districtOptions.value.find(
    (district) => district.districtNameTh === form.value.taxpayer_district,
  ),
);
const subdistrictOptions = computed(() =>
  selectedProvince.value && selectedDistrict.value
    ? subdistricts.filter(
        (subdistrict) =>
          subdistrict.provinceCode === selectedProvince.value?.provinceCode &&
          subdistrict.districtCode === selectedDistrict.value?.districtCode,
      )
    : [],
);

const onCreate = (initial: Partial<TaxProfileForm> = {}) => {
  profile.value = null;
  form.value = createTaxProfileForm(initial);
  taxError.value = "";
  isOpen.value = true;
};

const onEdit = (targetProfile: TaxProfile) => {
  profile.value = targetProfile;
  form.value = toTaxProfileForm(targetProfile);
  taxError.value = "";
  isOpen.value = true;
};

const close = () => {
  if (isSaving.value) return;
  isOpen.value = false;
};

const onDialogClose = () => {
  isOpen.value = false;
};

const onTaxpayerTypeChange = () => {
  if (form.value.taxpayer_type === "individual") {
    form.value.taxpayer_branch_type = "none";
    form.value.taxpayer_branch_code = "";
  } else if (form.value.taxpayer_branch_type === "none") {
    form.value.taxpayer_branch_type = "head_office";
    form.value.taxpayer_branch_code = "00000";
  }
};

const onBranchTypeChange = () => {
  form.value.taxpayer_branch_code =
    form.value.taxpayer_branch_type === "head_office" ? "00000" : "";
};

const onProvinceChange = (event: Event) => {
  form.value.taxpayer_province = (event.target as HTMLSelectElement).value;
  form.value.taxpayer_district = "";
  form.value.taxpayer_subdistrict = "";
  form.value.taxpayer_postcode = "";
};

const onDistrictChange = (event: Event) => {
  form.value.taxpayer_district = (event.target as HTMLSelectElement).value;
  form.value.taxpayer_subdistrict = "";
  form.value.taxpayer_postcode = "";
};

const onSubdistrictChange = (event: Event) => {
  form.value.taxpayer_subdistrict = (event.target as HTMLSelectElement).value;
  const selected = subdistrictOptions.value.find(
    (item) => item.subdistrictNameTh === form.value.taxpayer_subdistrict,
  );
  form.value.taxpayer_postcode = String(selected?.postalCode || "");
};

const validateForm = () => {
  taxError.value = "";
  form.value.taxpayer_id = String(form.value.taxpayer_id || "").trim();
  form.value.taxpayer_phone = String(form.value.taxpayer_phone || "").trim();

  if (!/^[0-9]{13}$/.test(form.value.taxpayer_id)) {
    taxError.value = "กรุณากรอกเลขประจำตัวผู้เสียภาษีให้ครบ 13 หลัก";
    return false;
  }

  if (
    form.value.taxpayer_phone &&
    !/^[0-9]{10}$/.test(form.value.taxpayer_phone)
  ) {
    taxError.value = "เบอร์โทรศัพท์ผู้เสียภาษีต้องเป็นตัวเลข 10 หลัก";
    return false;
  }

  return true;
};

const requestSave = async () => {
  if (!validateForm()) return;

  close();
  await nextTick();
  isSaveConfirmOpen.value = true;
};

const reopenTaxFormAfterCancel = async () => {
  await nextTick();
  isOpen.value = true;
};

const saveTaxProfile = async () => {
  if (isSaving.value) return;

  const action = mode.value;
  isSaving.value = true;
  taxError.value = "";

  try {
    const response =
      action === "edit" && profile.value
        ? await updateTaxProfile(profile.value.uuid, form.value)
        : await createTaxProfile(form.value);

    isSaveConfirmOpen.value = false;
    emit("saved", action, response.row);
  } catch (error: any) {
    taxError.value =
      error?.data?.statusMessage ||
      (action === "create"
        ? "ไม่สามารถเพิ่มข้อมูลผู้เสียภาษีได้"
        : "ไม่สามารถแก้ไขข้อมูลผู้เสียภาษีได้");
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

defineExpose({ onCreate, onEdit, close });
</script>
