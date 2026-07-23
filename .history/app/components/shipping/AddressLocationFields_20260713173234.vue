<template>
  <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    <label class="form-control">
      <span class="label-text mb-1 text-sm">จังหวัด</span>
      <select
        :value="form.shipping_province"
        class="select select-bordered w-full"
        required
        @change="onProvinceChange"
      >
        <option value="" disabled>เลือกจังหวัด</option>
        <option v-for="province in provinces" :key="province.provinceCode" :value="province.provinceNameTh">
          {{ province.provinceNameTh }}
        </option>
      </select>
    </label>

    <label class="form-control">
      <span class="label-text mb-1 text-sm">อำเภอ / เขต</span>
      <select
        :value="form.shipping_district"
        class="select select-bordered w-full"
        :disabled="!selectedProvince"
        required
        @change="onDistrictChange"
      >
        <option value="" disabled>{{ selectedProvince ? "เลือกอำเภอ / เขต" : "เลือกจังหวัดก่อน" }}</option>
        <option v-for="district in districtOptions" :key="district.districtCode" :value="district.districtNameTh">
          {{ district.districtNameTh }}
        </option>
      </select>
    </label>

    <label class="form-control">
      <span class="label-text mb-1 text-sm">ตำบล / แขวง</span>
      <select
        :value="form.shipping_subdistrict"
        class="select select-bordered w-full"
        :disabled="!selectedDistrict"
        required
        @change="onSubdistrictChange"
      >
        <option value="" disabled>{{ selectedDistrict ? "เลือกตำบล / แขวง" : "เลือกอำเภอ / เขต ก่อน" }}</option>
        <option
          v-for="subdistrict in subdistrictOptions"
          :key="subdistrict.subdistrictCode"
          :value="subdistrict.subdistrictNameTh"
        >
          {{ subdistrict.subdistrictNameTh }}
        </option>
      </select>
    </label>
  </div>
</template>

<script setup lang="ts">
import provincesData from "thailand-geography-json/src/provinces.json";
import districtsData from "thailand-geography-json/src/districts.json";
import subdistrictsData from "thailand-geography-json/src/subdistricts.json";
// import type { ShippingAddressForm } from "~~/composables/useShippingAddresses";

type Province = {
  provinceCode: number;
  provinceNameTh: string;
};

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

const props = defineProps<{ form: ShippingAddressForm }>();

const provinces = provincesData as Province[];
const districts = districtsData as District[];
const subdistricts = subdistrictsData as Subdistrict[];

const selectedProvince = computed(() =>
  provinces.find((province) => province.provinceNameTh === props.form.shipping_province),
);

const districtOptions = computed(() =>
  selectedProvince.value
    ? districts.filter((district) => district.provinceCode === selectedProvince.value?.provinceCode)
    : [],
);

const selectedDistrict = computed(() =>
  districtOptions.value.find((district) => district.districtNameTh === props.form.shipping_district),
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

const onProvinceChange = (event: Event) => {
  props.form.shipping_province = (event.target as HTMLSelectElement).value;
  props.form.shipping_district = "";
  props.form.shipping_subdistrict = "";
  props.form.shipping_postcode = "";
};

const onDistrictChange = (event: Event) => {
  props.form.shipping_district = (event.target as HTMLSelectElement).value;
  props.form.shipping_subdistrict = "";
  props.form.shipping_postcode = "";
};

const onSubdistrictChange = (event: Event) => {
  props.form.shipping_subdistrict = (event.target as HTMLSelectElement).value;
  const selectedSubdistrict = subdistrictOptions.value.find(
    (subdistrict) => subdistrict.subdistrictNameTh === props.form.shipping_subdistrict,
  );
  props.form.shipping_postcode = String(selectedSubdistrict?.postalCode || "");
};
</script>
