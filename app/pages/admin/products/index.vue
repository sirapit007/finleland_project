<template>
  <ModalConfirm
    v-model="isRemoveConfirmOpen"
    title="ยืนยันการลบรายการนี้"
    confirm-text="ยืนยัน"
    @confirm="fnRemove.onSubmit()"
  />

  <dialog ref="baseModal" class="modal">
    <div class="modal-box max-w-7xl">
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
          ✕
        </button>
      </form>
      <h3 class="text-lg font-bold">Create Product</h3>

      <div :class="`mt-2 grid sm:grid-cols-2 grid-cols-1 gap-4`">
        <MultiImageUpload v-model="base.form.image_url" />
        <div class="space-y-2">
          <!-- {{ base.form }} -->
          <fieldset class="fieldset">
            <legend class="fieldset-legend">รหัสสินค้า</legend>
            <input
              type="text"
              class="input input-sm w-full"
              placeholder="สูงสุด 50 ตัวอักษร..."
              v-model="base.form.product_code"
            />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">ชื่อสินค้า</legend>
            <input
              type="text"
              class="input input-sm w-full"
              placeholder="สูงสุด 150 ตัวอักษร..."
              v-model="base.form.product_name"
            />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">รายละเอียดสินค้า</legend>
            <textarea
              v-model="base.form.product_description"
              class="textarea textarea-sm min-h-24 w-full"
              placeholder="กรอกรายละเอียดสินค้า..."
            ></textarea>
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">หมวดหมู่สินค้า</legend>
            <ComboBox
              v-model="base.form.product_category"
              fetchUrl="/api/categories"
              placeholder="เลือกหมวดหมู่สินค้า..."
              label="category_name"
              value="uuid"
            />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">ผู้จัดจำหน่าย</legend>
            <ComboBox
              v-model="base.form.product_supplier"
              fetchUrl="/api/suppliers"
              placeholder="เลือกหมวดหมู่ผู้จัดจำหน่าย..."
              label="supplier_name"
              value="uuid"
            />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">ราคาทุน</legend>
            <input
              type="number"
              min="0"
              class="input input-sm w-full"
              placeholder="ตัวเลข มากกว่า 0 เท่านั้น..."
              v-model="base.form.product_cost_price"
            />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">ราคาขาย</legend>
            <input
              type="number"
              min="0"
              class="input input-sm w-full"
              placeholder="ตัวเลข มากกว่า 0 เท่านั้น..."
              v-model="base.form.product_selling_price"
            />
          </fieldset>
        </div>
      </div>
      <p
        v-if="base.errorMessage"
        class="mt-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error"
        role="alert"
      >
        {{ base.errorMessage }}
      </p>
      <div class="max-h-[40vh]" v-if="base.method === 'put'">
        <button
          class="btn btn-xs btn-secondary m-2"
          v-on:click="fnDetail.onCreate()"
        >
          เพิ่มโปรโมชั่น
        </button>
        <div class="max-h-[90%] overflow-auto">
          <table
            class="mt-2 table table-zebra table-xs table-pin-rows table-pin-cols"
          >
            <thead class="text-xs">
              <tr>
                <td>#</td>
                <td>ชื่อโปรโมชั่น</td>
                <td>รายละเอียด</td>
                <td>ราคา</td>
                <td>วันที่เริ่มต้น</td>
                <td>วันที่สิ้นสุด</td>
                <td>สร้างโดย / เมื่อ</td>
                <td>แก้ไขโดย / เมื่อ</td>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in detail?.rows"
                :key="row.id"
                class="hover:bg-primary/10"
              >
                <th>{{ row.id }}</th>
                <td>{{ row.promotion_name }}</td>
                <td>{{ row.promotion_description }}</td>
                <td>
                  {{
                    Number(row.promotion_discounted_price)
                      ? row.promotion_discounted_price
                      : row.promotion_bundle_price
                  }}
                </td>
                <td>{{ row.promotion_start_date }}</td>
                <td>{{ row.promotion_end_date }}</td>
                <td>
                  <div>{{ row.created_username ?? row.created_by }}</div>
                  <div>{{ row.created_at }}</div>
                </td>
                <td>
                  <div>{{ row.updated_username ?? row.updated_by }}</div>
                  <div>{{ row.updated_at }}</div>
                </td>
                <td class="text-end">
                  <button
                    class="btn btn-xs btn-link"
                    v-on:click="fnDetail.onEdit(row)"
                  >
                    แก้ไข
                  </button>
                  <button
                    class="btn btn-xs btn-link btn-error no-underline"
                    v-on:click="fnRemove.onRemove(row, '/api/promotions')"
                  >
                    ลบ
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="modal-action">
        <button class="flex-1 btn sm:btn-sm btn-xs" @click="baseModal?.close()">
          ปิด
        </button>
        <button
          class="flex-1 btn sm:btn-sm btn-xs btn-primary"
          type="button"
          @click="fnBase.onSubmit()"
        >
          บันทึก
        </button>
      </div>
    </div>
  </dialog>

  <dialog ref="detailModal" class="modal">
    <div class="modal-box max-w-5xl">
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
          ✕
        </button>
      </form>
      <h3 class="text-lg font-bold">Create Promotion</h3>
      <div class="mt-2 grid sm:grid-cols-3 grid-cols-1 gap-4">
        <!-- {{ detail.form.promotion_type }} -->
        <ImageUpload v-model="detail.form.image_url" />
        <div>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">ประเภทโปรโมชั่น</legend>
            <ComboBox
              v-model="detail.form.promotion_type"
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
              v-model="detail.form.promotion_name"
            />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">รายละเอียดโปรโมชั่น</legend>
            <textarea
              class="textarea textarea-sm w-full"
              placeholder="กี่ตัวตัวอักษรก็ได้..."
              v-model="detail.form.promotion_description"
            ></textarea>
          </fieldset>
          <div class="grid grid-cols-2 gap-2">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">วันที่เริ่มโปรโมชั่น</legend>
              <input
                type="date"
                class="input input-sm w-full"
                placeholder="..."
                v-model="detail.form.promotion_start_date"
              />
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">วันที่สิ้นสุดโปรโมชั่น</legend>
              <input
                type="date"
                class="input input-sm w-full"
                placeholder="..."
                v-model="detail.form.promotion_end_date"
              />
            </fieldset>
          </div>
        </div>
        <div>
          <div
            v-if="
              detail.form.promotion_type !==
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
                v-model="detail.form.promotion_discounted_price"
              />
            </fieldset>
          </div>
          <div
            v-if="
              detail.form.promotion_type ===
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
                v-model="detail.form.promotion_min_quantity"
              />
            </fieldset>
          </div>
          <div
            v-if="
              detail.form.promotion_type ===
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
                v-model="detail.form.promotion_min_purchase_amount"
              />
            </fieldset>
          </div>
          <div
            v-if="
              detail.form.promotion_type ===
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
                v-model="detail.form.promotion_bundle_price"
              />
            </fieldset>
            <div
              v-for="(v, i) in item.rows"
              class="border border-base-content/20 rounded-lg p-2 relative"
            >
              <button
                v-if="(i as number) > 1"
                class="btn btn-xs btn-square btn-ghost btn-error absolute right-1 top-1"
                v-on:click="fnItem.onRemoveRow(i as number)"
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
                  v-model="item.rows[i].bundle_item_product"
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
                    v-model="item.rows[i].bundle_item_quantity"
                  />
                </fieldset>
                <fieldset class="fieldset">
                  <legend class="fieldset-legend">ราคาต่อหน่วยในชุด</legend>
                  <input
                    type="number"
                    min="1"
                    class="input input-xs w-full"
                    placeholder="ตัวเลข มากกว่า 1 เท่านั้น..."
                    v-model="item.rows[i].bundle_item_unit_price"
                  />
                </fieldset>
              </div>
            </div>

            <button
              class="w-full btn btn-xs btn-soft btn-secondary"
              type="button"
              v-on:click="fnItem.onAddRow()"
            >
              เพิ่มรายการ
            </button>
          </div>
        </div>
      </div>

      <div class="modal-action">
        <button
          class="flex-1 btn sm:btn-sm btn-xs"
          @click="detailModal?.close()"
        >
          ปิด
        </button>
        <button
          class="flex-1 btn sm:btn-sm btn-xs btn-secondary"
          type="button"
          @click="fnDetail.onSubmit()"
        >
          บันทึก
        </button>
      </div>
    </div>
  </dialog>

  <ModalImagePreview v-model="isImagePreviewOpen" :src="imageSrc" />

  <div class="min-h-full p-4 pb-6">
    <div class="rounded-2xl border border-base-300 bg-base-100 shadow-sm">
      <div class="flex justify-between gap-3 md:flex-row md:items-center m-3">
        <div class="space-x-3 flex flex-col items-start">
          <span class="font-bold sm:text-xl text-lg text-primary"
            >Manage Products</span
          ><span class="font-semibold sm:text-base text-sm text-secondary"
            >จัดการรายการสินค้า</span
          >
        </div>
        <button
          class="flex-none btn btn-xs shadow-sm sm:btn-sm btn-primary"
          v-on:click="fnBase.onCreate()"
        >
          <Icon name="lucide:plus" size="16" />
          เพิ่มสินค้า
        </button>
      </div>
  
      <div class="flex flex-wrap items-center lg:p-3 sm:p-2 p-1">
        <TableResultSummary :page="page" :page-size="pageSize" :data="data" />
        <TableSearch
          v-model="q"
          placeholder="ค้นหาชื่อสินค้า หรือคำค้นหาอื่นๆ..."
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
              <td>รหัสสินค้า</td>
              <td>ชื่อสินค้า</td>
              <td>หมวดหมู่</td>
              <td>ผู้จัดจำหน่าย</td>
              <td class="text-right">ราคาทุน</td>
              <td class="text-right">ราคาขาย</td>
              <td>สร้างโดย / เมื่อ</td>
              <td>แก้ไขโดย / เมื่อ</td>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <SkeletonTableRows v-if="pending" :columns="11" :image-column="1" />
            <tr
              v-else
              v-for="row in data?.rows"
              :key="row.id"
              class="hover:bg-primary/5"
            >
              <td>{{ row.id }}</td>
              <td>
                <div
                  v-if="firstProductImageUrl(row.image_url)"
                  class="h-12 w-12 cursor-pointer"
                  v-on:click="
                    fnImage.onOpen(firstProductImageUrl(row.image_url))
                  "
                >
                  <img
                    :src="firstProductImageUrl(row.image_url)"
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
              <td>{{ row.product_code }}</td>
              <td>{{ row.product_name }}</td>
              <td>{{ row.product_category_name }}</td>
              <td>{{ row.product_supplier_name || "-" }}</td>
              <td class="text-right">{{ row.product_cost_price }}</td>
              <td class="text-right">{{ row.product_selling_price }}</td>
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
                  v-on:click="fnRemove.onRemove(row, '/api/products')"
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
import {
  firstProductImageUrl,
  normalizeProductImageUrls,
} from "~/utils/productImages";
const dayjs = useDayjs();

const baseModal = ref<HTMLDialogElement | null>(null);
const detailModal = ref<HTMLDialogElement | null>(null);
const isRemoveConfirmOpen = ref(false);
const isImagePreviewOpen = ref(false);

const page = ref(1);
const pageSize = ref(10);
const q = ref("");
const base = ref<any>({
  form: {},
  method: "",
  modal: false,
  errorMessage: "",
});
const detail = ref<any>({
  rows: [],
  form: {},
  method: "",
  modal: false,
});
const item = ref<any>({
  rows: [],
});
const remove = ref<any>({
  form: {},
  path: "",
});
const imageSrc = ref("");

const { data, pending, error, refresh } = await useFetch("/api/products", {
  server: false,
  query: {
    page,
    pageSize,
    q,
  },
  watch: [page, pageSize, q],
  transform: (data) => {
    return {
      ...data,
      rows: data.rows.map((item) => ({
        ...item,
        image_url: normalizeProductImageUrls(item.image_url),
      })),
    };
  },
});

const fnBase = {
  onCreate: async () => {
    base.value.form = {};
    base.value.method = "post";
    base.value.errorMessage = "";
    baseModal.value?.showModal();
  },
  onEdit: async (row: any) => {
    base.value.form = { ...row };
    base.value.method = "put";
    base.value.errorMessage = "";
    detail.value.rows = await fnDetail.onGet();

    baseModal.value?.showModal();
  },
  onSubmit: async () => {
    base.value.errorMessage = "";

    const path =
      base.value.method === "post"
        ? "/api/products"
        : `/api/products/${base.value.form.uuid}`;

    try {
      const res = await $fetch(path, {
        method: base.value.method,
        body: {
          ...base.value.form,
        },
      });

      if (res) {
        baseModal.value?.close();
        refresh();
      }
    } catch (error: any) {
      base.value.errorMessage =
        error?.data?.statusMessage ||
        "ไม่สามารถบันทึกสินค้าได้ กรุณาลองใหม่อีกครั้ง";
    }
  },
};

const fnDetail = {
  onGet: async () => {
    const res: any = await $fetch(`/api/promotion/${base.value.form.uuid}`);
    return res.rows;
  },
  onCreate: async () => {
    detail.value.form = { promotion_product: base.value.form.uuid };
    detail.value.method = "post";
    item.value.rows = [
      {
        bundle_item_product: base.value.form.uuid,
        bundle_item_quantity: 0,
        bundle_item_unit_price: 0,
      },
      {
        bundle_item_product: "",
        bundle_item_quantity: 0,
        bundle_item_unit_price: 0,
      },
    ];

    detailModal.value?.showModal();
  },
  onEdit: async (row: any) => {
    detail.value.form = { ...row };
    detail.value.method = "put";
    item.value.rows = await fnItem.onGet();

    detailModal.value?.showModal();
  },
  onSubmit: async () => {
    const path =
      detail.value.method === "post"
        ? `/api/promotion`
        : `/api/promotion/${detail.value.form.uuid}`;

    const res: any = await $fetch(path, {
      method: detail.value.method,
      body: {
        ...detail.value.form,
      },
    });

    if (res) {
      if (
        detail.value.form.promotion_type ===
        "70977b66-e3d8-45f2-bdfb-b9776f959027"
      ) {
        item.value.rows = item.value.rows.map((v: any) => {
          return { ...v, bundle_item_promotion: res.row.uuid };
        });
        await fnItem.onSubmit();
      }

      detailModal.value?.close();
      detail.value.rows = await fnDetail.onGet();
    }
  },
};

const fnItem = {
  onGet: async () => {
    const res: any = await $fetch(
      `/api/bundle-items/${detail.value.form.uuid}`,
    );
    return res.rows;
  },
  onAddRow: () => {
    item.value.rows.push({
      bundle_item_product: "",
      bundle_item_quantity: 0,
      bundle_item_unit_price: 0,
    });
  },
  onRemoveRow: (index: number) => {
    item.value.rows = item.value.rows.filter(
      (v: any, i: number) => i !== index,
    );
  },
  onSubmit: async () => {
    item.value.rows.forEach(async (v: any) => {
      const path =
        detail.value.method === "post"
          ? `/api/bundle-items`
          : `/api/bundle-items/${v.uuid}`;

      const res = await $fetch(path, {
        method: detail.value.method,
        body: {
          ...v,
        },
      });
    });
  },
};

const fnRemove = {
  onRemove: async (row: any, path: string) => {
    remove.value.path = path;
    remove.value.form = { ...row };
    isRemoveConfirmOpen.value = true;
  },
  onSubmit: async () => {
    const res = await $fetch(`${remove.value.path}/${remove.value.form.uuid}`, {
      method: "delete",
      body: {
        ...remove.value.form,
      },
    });

    if (res) {
      isRemoveConfirmOpen.value = false;

      if (remove.value.path.startsWith("/api/products")) {
        refresh();
      }

      if (remove.value.path.startsWith("/api/promotion")) {
        detail.value.rows = await fnDetail.onGet();
      }
    }
  },
};

const fnImage = {
  onOpen: (src: string) => {
    imageSrc.value = src;
    isImagePreviewOpen.value = true;
  },
};
</script>
