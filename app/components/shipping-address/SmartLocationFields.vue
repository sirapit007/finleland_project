<template>
  <section class="overflow-hidden rounded-2xl border border-base-300 bg-base-100">
    <div class="border-b border-base-300 bg-base-200/45 px-4 py-4 sm:px-5">
      <div class="flex items-start justify-between gap-3">
        <div class="flex min-w-0 items-start gap-3">
          <span class="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-content">1</span>
          <div>
            <h3 class="font-bold">เลือกจุดจัดส่งบนแผนที่</h3>
            <p class="mt-0.5 text-xs leading-5 text-base-content/55">ค้นหาเขตพื้นที่ ใช้ตำแหน่งปัจจุบัน หรือแตะแผนที่เพื่อปักหมุด</p>
          </div>
        </div>
      </div>

      <div class="relative mt-4">
        <div class="flex gap-2">
          <label class="input input-sm min-w-0 flex-1 gap-2">
            <Icon name="lucide:search" size="16" class="shrink-0 opacity-45" />
            <input v-model.trim="searchQuery" type="search" class="min-w-0 grow" placeholder="ค้นหาตำบล อำเภอ จังหวัด หรือรหัสไปรษณีย์" @keydown.enter.prevent="searchLocation" />
          </label>
          <button type="button" class="btn btn-primary btn-sm" :disabled="searchQuery.length < 2" @click="searchLocation">
            <span class="hidden sm:inline">ค้นหา</span><Icon name="lucide:arrow-right" size="16" />
          </button>
        </div>
        <div v-if="searchQuery.length >= 2 && areaSearchResults.length" class="absolute inset-x-0 top-10 z-[600] overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-xl">
          <button v-for="result in areaSearchResults" :key="result.subdistrict.subdistrictCode" type="button" class="flex w-full items-start gap-2 border-b border-base-200 px-3 py-2.5 text-left text-xs transition last:border-0 hover:bg-primary/5" @click="selectArea(result)">
            <Icon name="lucide:map-pin" size="15" class="mt-0.5 shrink-0 text-primary" />
            <span><strong>{{ result.subdistrict.subdistrictNameTh }}</strong><span class="block text-base-content/50">{{ result.district.districtNameTh }}, {{ result.province.provinceNameTh }} {{ result.subdistrict.postalCode }}</span></span>
          </button>
        </div>
      </div>
    </div>

    <div class="relative h-72 bg-base-200 sm:h-80">
      <ClientOnly>
        <div ref="mapContainer" class="size-full" aria-label="แผนที่เลือกจุดจัดส่ง" />
        <template #fallback><div class="flex size-full items-center justify-center gap-2 text-sm text-base-content/50"><span class="loading loading-spinner loading-sm" /> กำลังโหลดแผนที่</div></template>
      </ClientOnly>
      <div class="absolute left-3 top-3 z-[500]">
        <button type="button" class="btn btn-sm border-base-300 bg-base-100 shadow-md" :disabled="isLocating" @click="useCurrentLocation">
          <span v-if="isLocating" class="loading loading-spinner loading-xs" />
          <Icon v-else name="lucide:locate-fixed" size="16" />
          <span class="hidden sm:inline">ตำแหน่งปัจจุบัน</span>
        </button>
      </div>
      <div v-if="!coordinates" class="pointer-events-none absolute inset-x-3 bottom-3 z-[500] rounded-xl bg-neutral/85 px-4 py-2.5 text-center text-xs text-neutral-content shadow-lg backdrop-blur">
        แตะแผนที่เพื่อวางหมุด แล้วลากหมุดให้ตรงทางเข้าหรือหน้าบ้าน
      </div>
    </div>

    <div class="space-y-4 p-4 sm:p-5">
      <div v-if="locationMessage" class="flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs leading-5" :class="locationError ? 'bg-warning/10 text-warning-content' : isResolvingArea ? 'bg-info/10 text-info' : 'bg-success/10 text-success'">
        <span v-if="isResolvingArea" class="loading loading-spinner loading-xs mt-0.5 shrink-0" />
        <Icon v-else :name="locationError ? 'lucide:triangle-alert' : 'lucide:map-pin-check'" size="16" class="mt-0.5 shrink-0" /><span>{{ locationMessage }}</span>
      </div>

      <div class="mb-2 flex items-center justify-between gap-3">
        <div><p class="text-sm font-bold">ตรวจสอบเขตพื้นที่</p><p class="text-xs text-base-content/50">ระบบเติมจากหมุดให้อัตโนมัติ และยังแก้ไขเองได้</p></div>
        <span v-if="coordinates" class="text-[11px] text-base-content/45">{{ coordinates.latitude.toFixed(6) }}, {{ coordinates.longitude.toFixed(6) }}</span>
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <fieldset class="fieldset">
          <legend class="fieldset-legend">จังหวัด</legend>
          <select :value="form.shipping_province" class="select select-sm w-full" required @change="onProvinceChange">
            <option value="" disabled>เลือกจังหวัด</option>
            <option v-for="province in provinces" :key="province.provinceCode" :value="province.provinceNameTh">{{ province.provinceNameTh }}</option>
          </select>
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">อำเภอ / เขต</legend>
          <select :value="form.shipping_district" class="select select-sm w-full" :disabled="!selectedProvince" required @change="onDistrictChange">
            <option value="" disabled>{{ selectedProvince ? "เลือกอำเภอ / เขต" : "เลือกจังหวัดก่อน" }}</option>
            <option v-for="district in districtOptions" :key="district.districtCode" :value="district.districtNameTh">{{ district.districtNameTh }}</option>
          </select>
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">ตำบล / แขวง</legend>
          <select :value="form.shipping_subdistrict" class="select select-sm w-full" :disabled="!selectedDistrict" required @change="onSubdistrictChange">
            <option value="" disabled>{{ selectedDistrict ? "เลือกตำบล / แขวง" : "เลือกอำเภอก่อน" }}</option>
            <option v-for="subdistrict in subdistrictOptions" :key="subdistrict.subdistrictCode" :value="subdistrict.subdistrictNameTh">{{ subdistrict.subdistrictNameTh }}</option>
          </select>
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">รหัสไปรษณีย์</legend>
          <input v-model.trim="form.shipping_postcode" class="input input-sm w-full bg-base-200" inputmode="numeric" placeholder="ระบบเติมให้อัตโนมัติ" readonly />
        </fieldset>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";
import "leaflet/dist/leaflet.css";
import provincesData from "thailand-geography-json/src/provinces.json";
import districtsData from "thailand-geography-json/src/districts.json";
import subdistrictsData from "thailand-geography-json/src/subdistricts.json";

type Province = { provinceCode: number; provinceNameTh: string };
type District = { provinceCode: number; districtCode: number; districtNameTh: string };
type Subdistrict = { provinceCode: number; districtCode: number; subdistrictCode: number; subdistrictNameTh: string; postalCode: number };
type LocationSource = "map_pin" | "current_location" | "address_search" | "manual";
type Coordinates = {
  latitude: number;
  longitude: number;
  provider?: string;
  placeId?: string | null;
  source?: LocationSource;
};
type AreaSearchResult = { province: Province; district: District; subdistrict: Subdistrict; searchText: string };
type ReverseGeocodeResponse = {
  provider: string;
  placeId: string | null;
  displayName: string;
  postcode: string;
  provinceCandidates: string[];
  districtCandidates: string[];
  subdistrictCandidates: string[];
};

const props = defineProps<{ form: ShippingAddressForm; active?: boolean }>();
const emit = defineEmits<{ "coordinates-change": [coordinates: Coordinates | null] }>();
const provinces = provincesData as Province[];
const districts = districtsData as District[];
const subdistricts = subdistrictsData as Subdistrict[];
const mapContainer = ref<HTMLElement | null>(null);
const searchQuery = ref("");
const coordinates = ref<Coordinates | null>(null);
const locationMessage = ref("");
const locationError = ref(false);
const isLocating = ref(false);
const isResolvingArea = ref(false);
let leaflet: typeof import("leaflet") | null = null;
let map: LeafletMap | null = null;
let marker: LeafletMarker | null = null;
let reverseDebounceTimer: ReturnType<any> | null = null;
let reverseRequestId = 0;

const selectedProvince = computed(() => provinces.find((province) => province.provinceNameTh === props.form.shipping_province));
const districtOptions = computed(() => selectedProvince.value ? districts.filter((district) => district.provinceCode === selectedProvince.value?.provinceCode) : []);
const selectedDistrict = computed(() => districtOptions.value.find((district) => district.districtNameTh === props.form.shipping_district));
const subdistrictOptions = computed(() => selectedProvince.value && selectedDistrict.value ? subdistricts.filter((subdistrict) => subdistrict.provinceCode === selectedProvince.value?.provinceCode && subdistrict.districtCode === selectedDistrict.value?.districtCode) : []);

const provinceByCode = new Map(provinces.map((province) => [province.provinceCode, province]));
const districtByCode = new Map(districts.map((district) => [`${district.provinceCode}:${district.districtCode}`, district]));
const areaSearchIndex: AreaSearchResult[] = subdistricts.flatMap((subdistrict) => {
  const province = provinceByCode.get(subdistrict.provinceCode);
  const district = districtByCode.get(`${subdistrict.provinceCode}:${subdistrict.districtCode}`);
  if (!province || !district) return [];
  return [{ province, district, subdistrict, searchText: `${subdistrict.subdistrictNameTh} ${district.districtNameTh} ${province.provinceNameTh} ${subdistrict.postalCode}`.toLocaleLowerCase("th-TH") }];
});
const areaSearchResults = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase("th-TH");
  if (query.length < 2) return [];
  return areaSearchIndex.filter((result) => result.searchText.includes(query)).slice(0, 6);
});

const normalizeAreaName = (value: string) =>
  String(value || "")
    .normalize("NFKC")
    .toLocaleLowerCase("th-TH")
    .replace(/^(จังหวัด|จ\.?|อำเภอ|อ\.?|เขต|ตำบล|ต\.?|แขวง)\s*/u, "")
    .replace(/[\s.,\-_/()]/g, "");

const matchesAnyAreaName = (localName: string, candidates: string[]) => {
  const normalizedLocal = normalizeAreaName(localName);
  return candidates.some((candidate) => {
    const normalizedCandidate = normalizeAreaName(candidate);
    return (
      normalizedCandidate === normalizedLocal ||
      (Math.min(normalizedCandidate.length, normalizedLocal.length) >= 4 &&
        (normalizedCandidate.includes(normalizedLocal) ||
          normalizedLocal.includes(normalizedCandidate)))
    );
  });
};

const cancelPendingReverse = () => {
  reverseRequestId += 1;
  if (reverseDebounceTimer) {
    window.clearTimeout(reverseDebounceTimer);
    reverseDebounceTimer = null;
  }
  isResolvingArea.value = false;
};

const applyReverseArea = (result: ReverseGeocodeResponse) => {
  const postcodeAreas = result.postcode
    ? areaSearchIndex.filter(
        (area) => String(area.subdistrict.postalCode) === result.postcode,
      )
    : [];

  const provinceFromName = provinces.find((province) =>
    matchesAnyAreaName(province.provinceNameTh, result.provinceCandidates),
  );
  const postcodeProvinceCodes = [
    ...new Set(postcodeAreas.map((area) => area.province.provinceCode)),
  ];
  const province =
    provinceFromName ||
    (postcodeProvinceCodes.length === 1
      ? provinceByCode.get(postcodeProvinceCodes[0]!)
      : undefined);

  if (!province) {
    locationError.value = true;
    locationMessage.value =
      "ปักหมุดแล้ว แต่ยังจับคู่จังหวัดไม่ได้ กรุณาเลือกเขตพื้นที่ด้านล่าง";
    return false;
  }

  props.form.shipping_province = province.provinceNameTh;
  const availableDistricts = districts.filter(
    (district) => district.provinceCode === province.provinceCode,
  );
  const districtFromName = availableDistricts.find((district) =>
    matchesAnyAreaName(district.districtNameTh, result.districtCandidates),
  );
  const postcodeDistrictCodes = [
    ...new Set(
      postcodeAreas
        .filter((area) => area.province.provinceCode === province.provinceCode)
        .map((area) => area.district.districtCode),
    ),
  ];
  const district =
    districtFromName ||
    (postcodeDistrictCodes.length === 1
      ? districtByCode.get(
          `${province.provinceCode}:${postcodeDistrictCodes[0]}`,
        )
      : undefined);

  props.form.shipping_district = district?.districtNameTh || "";
  props.form.shipping_subdistrict = "";

  if (!district) {
    props.form.shipping_postcode = result.postcode;
    locationError.value = true;
    locationMessage.value =
      "พบจังหวัดแล้ว แต่ยังจับคู่อำเภอไม่ได้ กรุณาตรวจสอบข้อมูลด้านล่าง";
    return false;
  }

  const availableSubdistricts = subdistricts.filter(
    (subdistrict) =>
      subdistrict.provinceCode === province.provinceCode &&
      subdistrict.districtCode === district.districtCode,
  );
  const subdistrictFromName = availableSubdistricts.find((subdistrict) =>
    matchesAnyAreaName(
      subdistrict.subdistrictNameTh,
      result.subdistrictCandidates,
    ),
  );
  const postcodeSubdistricts = availableSubdistricts.filter(
    (subdistrict) => String(subdistrict.postalCode) === result.postcode,
  );
  const subdistrict =
    subdistrictFromName ||
    (postcodeSubdistricts.length === 1 ? postcodeSubdistricts[0] : undefined);

  props.form.shipping_subdistrict = subdistrict?.subdistrictNameTh || "";
  props.form.shipping_postcode = subdistrict
    ? String(subdistrict.postalCode)
    : result.postcode;

  if (!subdistrict) {
    locationError.value = true;
    locationMessage.value =
      "พบจังหวัด อำเภอ และรหัสไปรษณีย์แล้ว กรุณาตรวจสอบตำบลอีกครั้ง";
    return false;
  }

  searchQuery.value = `${subdistrict.subdistrictNameTh}, ${district.districtNameTh}, ${province.provinceNameTh}`;
  locationError.value = false;
  locationMessage.value =
    "เติมจังหวัด อำเภอ ตำบล และรหัสไปรษณีย์จากหมุดให้แล้ว";
  return true;
};

const reverseGeocode = async (
  selectedCoordinates: Coordinates,
  requestId: number,
) => {
  try {
    const result = await $fetch<ReverseGeocodeResponse>(
      "/api/user/smart-shipping-addresses/reverse-geocode",
      {
        query: {
          latitude: selectedCoordinates.latitude,
          longitude: selectedCoordinates.longitude,
        },
      },
    );

    if (requestId !== reverseRequestId) return;
    applyReverseArea(result);
    emit("coordinates-change", {
      ...selectedCoordinates,
      provider: result.provider,
      placeId: result.placeId,
    });
  } catch (error: any) {
    if (requestId !== reverseRequestId) return;
    locationError.value = true;
    locationMessage.value =
      error?.data?.statusMessage === "Selected location is outside Thailand"
        ? "จุดที่เลือกอยู่นอกประเทศไทย กรุณาเลือกตำแหน่งใหม่"
        : "ปักหมุดแล้ว แต่ดึงเขตพื้นที่อัตโนมัติไม่สำเร็จ กรุณาเลือกเองด้านล่าง";
  } finally {
    if (requestId === reverseRequestId) isResolvingArea.value = false;
  }
};

const scheduleReverseGeocode = (selectedCoordinates: Coordinates) => {
  const requestId = ++reverseRequestId;
  if (reverseDebounceTimer) window.clearTimeout(reverseDebounceTimer);
  isResolvingArea.value = true;
  locationError.value = false;
  locationMessage.value = "กำลังตรวจสอบจังหวัด อำเภอ ตำบล และรหัสไปรษณีย์...";
  reverseDebounceTimer = window.setTimeout(() => {
    reverseDebounceTimer = null;
    void reverseGeocode(selectedCoordinates, requestId);
  }, 350);
};

const selectArea = (result: AreaSearchResult) => {
  cancelPendingReverse();
  props.form.shipping_province = result.province.provinceNameTh;
  props.form.shipping_district = result.district.districtNameTh;
  props.form.shipping_subdistrict = result.subdistrict.subdistrictNameTh;
  props.form.shipping_postcode = String(result.subdistrict.postalCode || "");
  searchQuery.value = `${result.subdistrict.subdistrictNameTh}, ${result.district.districtNameTh}, ${result.province.provinceNameTh}`;
  locationError.value = false;
  locationMessage.value = "เลือกเขตพื้นที่แล้ว กรุณาปักหมุดให้ตรงทางเข้าหรือหน้าบ้าน";
};
const searchLocation = () => {
  const result = areaSearchResults.value[0];
  if (result) selectArea(result);
  else {
    locationError.value = true;
    locationMessage.value = "ไม่พบเขตพื้นที่ ลองค้นด้วยชื่อตำบล อำเภอ จังหวัด หรือรหัสไปรษณีย์";
  }
};

const updatePin = (
  latitude: number,
  longitude: number,
  zoom = 18,
  source: LocationSource = "map_pin",
  resolveArea = true,
  notifyParent = true,
) => {
  if (!leaflet || !map) return;
  const selectedCoordinates: Coordinates = { latitude, longitude, source };
  coordinates.value = selectedCoordinates;
  if (notifyParent) emit("coordinates-change", selectedCoordinates);
  if (!marker) {
    const icon = leaflet.divIcon({ className: "shipping-map-marker-wrapper", html: '<span class="shipping-map-marker"><span></span></span>', iconSize: [36, 44], iconAnchor: [18, 42] });
    marker = leaflet.marker([latitude, longitude], { draggable: true, icon }).addTo(map);
    marker.on("dragend", () => {
      const position = marker?.getLatLng();
      if (position) updatePin(position.lat, position.lng);
    });
  } else marker.setLatLng([latitude, longitude]);
  map.setView([latitude, longitude], zoom, { animate: true });
  if (resolveArea) scheduleReverseGeocode(selectedCoordinates);
};

const useCurrentLocation = () => {
  if (!navigator.geolocation) {
    locationError.value = true;
    locationMessage.value = "อุปกรณ์นี้ไม่รองรับการอ่านตำแหน่งปัจจุบัน";
    return;
  }
  isLocating.value = true;
  locationError.value = false;
  locationMessage.value = "กำลังขอพิกัดจากอุปกรณ์...";
  navigator.geolocation.getCurrentPosition(
    (position) => { updatePin(position.coords.latitude, position.coords.longitude, 18, "current_location"); isLocating.value = false; },
    () => { isLocating.value = false; locationError.value = true; locationMessage.value = "ไม่สามารถใช้ตำแหน่งปัจจุบันได้ กรุณาอนุญาต Location หรือปักหมุดเอง"; },
    { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 },
  );
};

const onProvinceChange = (event: Event) => {
  cancelPendingReverse();
  props.form.shipping_province = (event.target as HTMLSelectElement).value;
  props.form.shipping_district = "";
  props.form.shipping_subdistrict = "";
  props.form.shipping_postcode = "";
};
const onDistrictChange = (event: Event) => {
  cancelPendingReverse();
  props.form.shipping_district = (event.target as HTMLSelectElement).value;
  props.form.shipping_subdistrict = "";
  props.form.shipping_postcode = "";
};
const onSubdistrictChange = (event: Event) => {
  cancelPendingReverse();
  props.form.shipping_subdistrict = (event.target as HTMLSelectElement).value;
  const subdistrict = subdistrictOptions.value.find((value) => value.subdistrictNameTh === props.form.shipping_subdistrict);
  props.form.shipping_postcode = String(subdistrict?.postalCode || "");
};

const initializeMap = async () => {
  if (!import.meta.client || map || !mapContainer.value) return;
  leaflet = await import("leaflet");
  map = leaflet.map(mapContainer.value, { zoomControl: false }).setView([18.57, 100.75], 13);
  const streetLayer = leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  });
  const satelliteLayer = leaflet.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      maxZoom: 19,
      attribution: "Tiles &copy; Esri and imagery providers",
    },
  ).addTo(map);
  leaflet.control.layers(
    { "ภาพถ่ายดาวเทียม": satelliteLayer, "แผนที่ถนน": streetLayer },
    undefined,
    { position: "topright" },
  ).addTo(map);
  leaflet.control.zoom({ position: "bottomright" }).addTo(map);
  map.on("click", (event) => updatePin(event.latlng.lat, event.latlng.lng));
};

const syncMapFromForm = () => {
  if (!map) return;
  const rawLatitude = props.form.shipping_latitude;
  const rawLongitude = props.form.shipping_longitude;
  const latitude = Number(rawLatitude);
  const longitude = Number(rawLongitude);
  if (
    rawLatitude !== null &&
    rawLongitude !== null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude)
  ) {
    updatePin(
      latitude,
      longitude,
      18,
      props.form.shipping_location_source || "map_pin",
      false,
      false,
    );
    return;
  }

  cancelPendingReverse();
  coordinates.value = null;
  if (marker) {
    map.removeLayer(marker);
    marker = null;
  }
};

watch(() => props.active, async (active) => {
  if (!active) {
    cancelPendingReverse();
    return;
  }
  await nextTick();
  await initializeMap();
  syncMapFromForm();
  window.setTimeout(() => map?.invalidateSize(), 80);
}, { immediate: true });
onBeforeUnmount(() => {
  cancelPendingReverse();
  map?.remove();
  map = null;
  marker = null;
});
</script>

<style>
.shipping-map-marker-wrapper { background: transparent; border: 0; }
.shipping-map-marker { display: block; position: relative; width: 34px; height: 34px; border: 4px solid white; border-radius: 50% 50% 50% 0; background: var(--color-primary); box-shadow: 0 8px 18px rgb(0 0 0 / 28%); transform: rotate(-45deg); }
.shipping-map-marker > span { position: absolute; inset: 8px; border-radius: 999px; background: white; }
.leaflet-control-attribution { font-size: 9px !important; }
</style>



