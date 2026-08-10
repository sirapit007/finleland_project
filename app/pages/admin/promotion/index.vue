<template>
  <ModalConfirm
    v-model="isRemoveConfirmOpen"
    title="ยืนยันการลบรายการนี้"
    confirm-text="ยืนยัน"
    @confirm="fnRemove.onSubmit()"
  />

  <ModalImagePreview v-model="isImagePreviewOpen" :src="imageSrc" />

  <dialog ref="baseModal" class="modal">
    <div class="modal-box max-w-2xl">
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
          ✕
        </button>
      </form>
      <h3 class="text-lg font-bold">Create Promotion</h3>

      <div class="mt-2 grid sm:grid-cols-2 grid-cols-1 gap-4">
        <!-- {{ base.form.promotion_type }} -->
        <div>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">สินค้าที่ร่วมโปรโมชั่น</legend>
            <ComboBox
              v-model="base.form.promotion_product"
              fetchUrl="/api/products"
              placeholder="เลือกสินค้า..."
              label="product_name"
              value="uuid"
            />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">ประเภทโปรโมชั่น</legend>
            <ComboBox
              v-model="base.form.promotion_type"
              fetchUrl="/api/promotion/types"
              placeholder="เลือกประเภทโปรโมชั่น..."
              label="promotion_type_name"
              value="uuid"
            />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">ชื่อโปรโมชั่น</legend>
            <input
              type="text"
              class="input input-sm w-full"
              placeholder="สูงสุด 100 ตัวอักษร..."
              v-model="base.form.promotion_name"
            />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">รายละเอียดโปรโมชั่น</legend>
            <textarea
              class="textarea textarea-sm w-full"
              placeholder="กี่ตัวตัวอักษรก็ได้..."
              v-model="base.form.promotion_description"
            ></textarea>
          </fieldset>
          <div class="grid grid-cols-2 gap-2">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">วันที่เริ่มโปรโมชั่น</legend>
              <input
                type="date"
                class="input input-sm w-full"
                placeholder="..."
                v-model="base.form.promotion_start_date"
              />
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">วันที่สิ้นสุดโปรโมชั่น</legend>
              <input
                type="date"
                class="input input-sm w-full"
                placeholder="..."
                v-model="base.form.promotion_end_date"
              />
            </fieldset>
          </div>
        </div>
        <div>
          <div
            v-if="
              base.form.promotion_type !==
              '70977b66-e3d8-45f2-bdfb-b9776f959027'
            "
          >
            <fieldset class="fieldset">
              <legend class="fieldset-legend">ราคาหลังส่วนลด</legend>
              <input
                type="number"
                min="1"
                class="input input-sm w-full"
                placeholder="ตัวเลข มากกว่า 1 เท่านั้น..."
                v-model="base.form.promotion_discounted_price"
              />
            </fieldset>
          </div>
          <div
            v-if="
              base.form.promotion_type ===
              '3d13b772-9442-48d8-90a0-f35d825d390a'
            "
          >
            <fieldset class="fieldset">
              <legend class="fieldset-legend">จำนวนขั้นต่ำ</legend>
              <input
                type="number"
                min="1"
                class="input input-sm w-full"
                placeholder="ตัวเลข มากกว่า 1 เท่านั้น..."
                v-model="base.form.promotion_min_quantity"
              />
            </fieldset>
          </div>
          <div
            v-if="
              base.form.promotion_type ===
              'be08aae7-30ef-46d1-a415-e581cd71a903'
            "
          >
            <fieldset class="fieldset">
              <legend class="fieldset-legend">ยอดซื้อขั้นต่ำ</legend>
              <input
                type="number"
                min="1"
                class="input input-sm w-full"
                placeholder="ตัวเลข มากกว่า 1 เท่านั้น..."
                v-model="base.form.promotion_min_purchase_amount"
              />
            </fieldset>
          </div>
          <div
            v-if="
              base.form.promotion_type ===
              '70977b66-e3d8-45f2-bdfb-b9776f959027'
            "
            class="space-y-2"
          >
            <fieldset class="fieldset">
              <legend class="fieldset-legend">ราคาชุดโปรโมชั่น</legend>
              <input
                type="number"
                min="1"
                class="input input-sm w-full"
                placeholder="ตัวเลข มากกว่า 1 เท่านั้น..."
                v-model="base.form.promotion_bundle_price"
              />
            </fieldset>
            <div
              v-for="(v, i) in detail.rows"
              class="border border-base-content/20 rounded-lg p-2 relative"
            >
              <button
                v-if="(i as number) > 1"
                class="btn btn-xs btn-square btn-ghost btn-error absolute right-1 top-1"
                v-on:click="fnDetail.onRemoveRow(i as number)"
              >
                ✕
              </button>
              <div
                class="w-4 h-4 bg-warning rounded-full text-[10px] font-semibold flex justify-center items-center absolute left-1 top-1"
              >
                {{ (i as number) + 1 }}
              </div>
              <fieldset class="fieldset mt-3">
                <legend class="fieldset-legend">สินค้าในชุด</legend>
                <ComboBox
                  v-model="detail.rows[i].bundle_item_product"
                  fetchUrl="/api/products"
                  placeholder="เลือกสินค้า..."
                  label="product_name"
                  value="uuid"
                  :disabled="!i"
                />
              </fieldset>
              <div class="grid grid-cols-2 gap-2">
                <fieldset class="fieldset">
                  <legend class="fieldset-legend">จำนวนสินค้าในชุด</legend>
                  <input
                    type="number"
                    min="1"
                    class="input input-xs w-full"
                    placeholder="ตัวเลข มากกว่า 1 เท่านั้น..."
                    v-model="detail.rows[i].bundle_item_quantity"
                  />
                </fieldset>
                <fieldset class="fieldset">
                  <legend class="fieldset-legend">ราคาต่อหน่วยในชุด</legend>
                  <input
                    type="number"
                    min="1"
                    class="input input-xs w-full"
                    placeholder="ตัวเลข มากกว่า 1 เท่านั้น..."
                    v-model="detail.rows[i].bundle_item_unit_price"
                  />
                </fieldset>
              </div>
            </div>

            <button
              class="w-full btn btn-xs btn-soft btn-secondary"
              type="button"
              v-on:click="fnDetail.onAddRow()"
            >
              เพิ่มรายการ
            </button>
          </div>
        </div>
      </div>

      <div class="modal-action">
        <button class="flex-1 btn sm:btn-sm btn-xs" @click="baseModal?.close()">
          ปิด
        </button>
        <button
          class="flex-1 btn sm:btn-sm btn-xs btn-secondary"
          type="button"
          @click="fnBase.onSubmit()"
        >
          บันทึก
        </button>
      </div>
    </div>
  </dialog>

  <div class="min-h-full p-4 pb-6">
    <div class="rounded-2xl border border-base-300 bg-base-100 shadow-sm">
      <div class="flex justify-between gap-3 md:flex-row md:items-center m-3">
        <div class="space-x-3 flex flex-col items-start">
          <span class="font-bold sm:text-xl text-lg text-primary"
            >Event Promotion</span
          ><span class="font-semibold sm:text-base text-sm text-secondary"
            >โปรโมชั่นสินค้า</span
          >
        </div>
        <button
          class="flex-none btn btn-xs shadow-sm sm:btn-sm btn-primary"
          v-on:click="fnBase.onCreate()"
        >
          <Icon name="lucide:plus" size="16" />
          เพิ่มโปรโมชั่น
        </button>
      </div>
  
      <div class="flex flex-wrap items-center lg:p-3 sm:p-2 p-1">
        <TableResultSummary :page="page" :page-size="pageSize" :data="data" />
        <TableSearch
          v-model="q"
          placeholder="ค้นหาชื่อโปรโมชั่น หรือคำค้นหาอื่นๆ..."
        />
      </div>
      <div class="relative my-1 overflow-auto">
        <p v-if="error" class="text-error">{{ error.message }}</p>

        <table
          class="table min-w-max table-zebra bg-base-100 text-xs sm:table-sm table-xs table-pin-rows table-pin-cols"
        >
          <thead class="text-xs">
            <tr>
              <td>#</td>
              <td>รูปภาพ</td>
              <td>ชื่อโปรโมชั่น</td>
              <td>รายละเอียด</td>
              <td>วันที่เริ่มต้น</td>
              <td>วันที่สิ้นสุด</td>
              <td>ราคาหลังส่วนลด</td>
              <td>จำนวนขั้นต่ำ</td>
              <td>ยอดซื้อขั้นต่ำ</td>
              <td>ราคาชุดโปรโมชั่น</td>
              <td>เปิดใช้งาน</td>
              <td>สร้างโดย / เมื่อ</td>
              <td>แก้ไขโดย / เมื่อ</td>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <SkeletonTableRows v-if="pending" :columns="14" :image-column="1" />
            <tr
              v-else
              v-for="row in data?.rows"
              :key="row.id"
              class="hover:bg-primary/5"
              :class="!row.promotion_is_active ? 'opacity-50' : ''"
            >
              <td>{{ row.id }}</td>
              <td>
                <div
                  v-if="row.image_url"
                  class="h-12 w-12 cursor-pointer"
                  v-on:click="fnImage.onOpen(row.image_url)"
                >
                  <img
                    :src="row.image_url"
                    class="h-full w-full object-cover"
                  />
                </div>
                <div v-else class="h-12 w-12 cursor-not-allowed">
                  <img
                    src="@/assets/images/blank.png"
                    class="h-full w-full object-cover"
                  />
                </div>
              </td>
              <td>{{ row.promotion_name }}</td>
              <td>{{ row.promotion_description }}</td>
              <td>
                {{ dayjs(row.promotion_start_date).format("YYYY-MM-DD") }}
              </td>
              <td>{{ dayjs(row.promotion_end_date).format("YYYY-MM-DD") }}</td>
              <td>{{ row.promotion_discounted_price }}</td>
              <td>{{ row.promotion_min_quantity }}</td>
              <td>{{ row.promotion_min_purchase_amount }}</td>
              <td>{{ row.promotion_bundle_price }}</td>
              <td>
                <input
                  type="checkbox"
                  class="checkbox checkbox-accent"
                  v-model="row.promotion_is_active"
                  v-on:click="fnBase.onUseActive(row)"
                />
              </td>
              <td>
                <div>{{ row.created_username ?? row.created_by }}</div>
                <div>
                  {{ dayjs(row.created_at).format("YYYY-MM-DD HH:mm:ss") }}
                </div>
              </td>
              <td>
                <div>{{ row.updated_username ?? row.updated_by }}</div>
                <div>
                  {{
                    row.updated_at
                      ? dayjs(row.updated_at).format("YYYY-MM-DD HH:mm:ss")
                      : ""
                  }}
                </div>
              </td>
              <th class="text-end">
                <button
                  class="btn btn-xs btn-link"
                  v-on:click="fnBase.onEdit(row)"
                >
                  แก้ไข
                </button>
                <button
                  class="btn btn-xs btn-link btn-error no-underline"
                  v-on:click="fnBase.onRemove(row)"
                >
                  ลบ
                </button>
              </th>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="flex flex-wrap items-center lg:p-3 sm:p-2 p-1">
        <TablePageSize
          v-model:page-size="pageSize"
          :disabled="pending"
          @update:page-size="page = 1"
        />
        <TablePagination v-model:page="page" :disabled="pending" :data="data" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "admin",
});

import { useDayjs } from "~~/composables/useDayjs";
const dayjs = useDayjs();

const baseModal = ref<HTMLDialogElement | null>(null);
const isRemoveConfirmOpen = ref(false);
const isImagePreviewOpen = ref(false);

const page = ref(1);
const pageSize = ref(10);
const q = ref("");
const base = ref<any>({
  form: {},
  method: "",
});
const detail = ref<any>({
  rows: [],
});
const remove = ref<any>({
  form: {},
  path: "",
});
const imageSrc = ref("");

const { data, pending, error, refresh } = await useFetch("/api/promotion", {
  server: false,
  query: {
    page,
    pageSize,
    q,
  },
  watch: [page, pageSize, q],
});

const fnBase = {
  onCreate: async () => {
    base.value.form = {};
    base.value.method = "post";

    baseModal.value?.showModal();
  },
  onEdit: async (row: any) => {
    base.value.form = { ...row };
    base.value.method = "put";

    detail.value.rows = [];
    detail.value.rows = await fnDetail.onGet();

    baseModal.value?.showModal();
  },
  onSubmit: async () => {
    const path =
      base.value.method === "post"
        ? `/api/promotion`
        : `/api/promotion/${base.value.form.uuid}`;

    const res: any = await $fetch(path, {
      method: base.value.method,
      body: {
        ...base.value.form,
      },
    });

    if (res) {
      if (
        base.value.form.promotion_type ===
        "70977b66-e3d8-45f2-bdfb-b9776f959027"
      ) {
        detail.value.rows = detail.value.rows.map((v: any) => {
          return { ...v, bundle_item_promotion: res.row.uuid };
        });
        await fnDetail.onSubmit();
      }

      baseModal.value?.close();
      refresh();
    }
  },
  onUseActive: async (row: any) => {
    const path = `/api/promotion/${row.uuid}`;

    const res = await $fetch(path, {
      method: "put",
      body: {
        ...row,
        promotion_is_active: row.promotion_is_active ? false : true,
      },
    });

    if (res) {
      refresh();
    }
  },
  onRemove: async (row: any) => {
    remove.value.path = "/api/promotion";
    remove.value.form = { ...row };
    isRemoveConfirmOpen.value = true;
  },
};

const fnDetail = {
  onGet: async () => {
    const res: any = await $fetch(`/api/bundle-items/${base.value.form.uuid}`);
    return res.rows;
  },
  onAddRow: () => {
    detail.value.rows.push({
      bundle_item_product: "",
      bundle_item_quantity: 0,
      bundle_item_unit_price: 0,
    });
  },
  onRemoveRow: (index: number) => {
    detail.value.rows = detail.value.rows.filter(
      (v: any, i: number) => i !== index,
    );
  },
  onSubmit: async () => {
    detail.value.rows.forEach(async (v: any) => {
      const path =
        base.value.method === "post"
          ? `/api/bundle-items`
          : `/api/bundle-items/${v.uuid}`;

      const res = await $fetch(path, {
        method: base.value.method,
        body: {
          ...v,
        },
      });
    });
  },
};

const fnRemove = {
  onSubmit: async () => {
    const res = await $fetch(`${remove.value.path}/${remove.value.form.uuid}`, {
      method: "delete",
      body: {
        ...remove.value.form,
      },
    });

    if (res) {
      isRemoveConfirmOpen.value = false;
      refresh();
    }
  },
};

const fnImage = {
  onOpen: (src: string) => {
    imageSrc.value = src;
    isImagePreviewOpen.value = true;
  },
};

watch(
  () => base.value.form.promotion_type,
  (v) => {
    if (
      v === "70977b66-e3d8-45f2-bdfb-b9776f959027" &&
      base.value.method === "post"
    ) {
      detail.value.rows = [
        {
          bundle_item_product: base.value.form.promotion_product,
          bundle_item_quantity: 0,
          bundle_item_unit_price: 0,
        },
        {
          bundle_item_product: "",
          bundle_item_quantity: 0,
          bundle_item_unit_price: 0,
        },
      ];
    }
  },
);
</script>
