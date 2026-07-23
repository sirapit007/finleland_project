<template>
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
            <legend class="fieldset-legend">Product Code</legend>
            <input
              type="text"
              class="input input-sm w-full"
              placeholder="สูงสุด 50 ตัวอักษร..."
              v-model="base.form.product_code"
            />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Product Name</legend>
            <input
              type="text"
              class="input input-sm w-full"
              placeholder="สูงสุด 150 ตัวอักษร..."
              v-model="base.form.product_name"
            />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Product Category</legend>
            <ComboBox
              v-model="base.form.product_category"
              fetchUrl="/api/categories"
              placeholder="เลือกหมวดหมู่สินค้า..."
              label="category_name"
              value="uuid"
            />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Product Supplier</legend>
            <ComboBox
              v-model="base.form.product_supplier"
              fetchUrl="/api/suppliers"
              placeholder="เลือกหมวดหมู่ผู้จัดจำหน่าย..."
              label="supplier_name"
              value="uuid"
            />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Product Cost Price</legend>
            <input
              type="number"
              min="0"
              class="input input-sm w-full"
              placeholder="ตัวเลข มากกว่า 0 เท่านั้น..."
              v-model="base.form.product_cost_price"
            />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Product Selling Price</legend>
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
                <th>#</th>
                <td>Name</td>
                <td>Description</td>
                <td>Price</td>
                <td>Start</td>
                <td>End</td>
                <td>Created</td>
                <td>Updated</td>
                <td></td>
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
            <legend class="fieldset-legend">Promotion Type</legend>
            <ComboBox
              v-model="detail.form.promotion_type"
              fetchUrl="/api/promotion/types"
              placeholder="เลือกประเภทโปรโมชั่น..."
              label="promotion_type_name"
              value="uuid"
            />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Promotion Name</legend>
            <input
              type="text"
              class="input input-sm w-full"
              placeholder="สูงสุด 100 ตัวอักษร..."
              v-model="detail.form.promotion_name"
            />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Promotion Description</legend>
            <textarea
              class="textarea textarea-sm w-full"
              placeholder="กี่ตัวตัวอักษรก็ได้..."
              v-model="detail.form.promotion_description"
            ></textarea>
          </fieldset>
          <div class="grid grid-cols-2 gap-2">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">Promotion Start Date</legend>
              <input
                type="date"
                class="input input-sm w-full"
                placeholder="..."
                v-model="detail.form.promotion_start_date"
              />
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">Promotion End Date</legend>
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
              <legend class="fieldset-legend">
                Promotion Discounted Price
              </legend>
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
              <legend class="fieldset-legend">Promotion Min Quantity</legend>
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
              <legend class="fieldset-legend">
                Promotion Min Purchase Amount
              </legend>
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
              <legend class="fieldset-legend">Promotion Bundle Price</legend>
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
                <legend class="fieldset-legend">Bundle Product</legend>
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
                  <legend class="fieldset-legend">Bundle Quantity</legend>
                  <input
                    type="number"
                    min="1"
                    class="input input-xs w-full"
                    placeholder="ตัวเลข มากกว่า 1 เท่านั้น..."
                    v-model="item.rows[i].bundle_item_quantity"
                  />
                </fieldset>
                <fieldset class="fieldset">
                  <legend class="fieldset-legend">Bundle Unit Price</legend>
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

  <dialog ref="removeModal" class="modal">
    <div class="modal-box max-w-xs">
      <h3 class="text-lg font-bold">ยืนยันการลบรายการนี้</h3>
      <div class="text-center mt-5">
        <Icon
          name="lucide:message-circle-warning"
          class="text-error"
          size="60"
        />
      </div>
      <div class="modal-action">
        <button class="flex-1 btn btn-sm" @click="removeModal?.close()">
          ปิด
        </button>
        <button
          class="flex-1 btn btn-sm btn-error"
          type="button"
          @click="fnRemove.onSubmit()"
        >
          ยืนยัน
        </button>
      </div>
    </div>
  </dialog>

  <dialog ref="imageModal" class="modal">
    <div class="modal-box max-w-lg">
      <form method="dialog">
        <button
          class="btn btn-sm btn-circle btn-neutral absolute right-2 top-2"
        >
          ✕
        </button>
      </form>

      <div class="h-100">
        <img :src="imageSrc" class="h-full w-full object-contain" />
      </div>
    </div>
  </dialog>

  <div class="p-4 bg-base-100">
    <div class="flex md:flex-row flex-col justify-between">
      <div class="space-x-3">
        <span class="font-bold text-xl text-primary">Manage Products</span
        ><span class="font-semibold text-base text-secondary"
          >จัดการรายการสินค้า</span
        >
      </div>
      <div class="flex items-center gap-4">
        <label class="input sm:input-sm input-xs shadow-sm w-60">
          <span class="label"><Icon name="lucide:search" size="16" /></span>
          <input
            type="text"
            placeholder="ค้นหาชื่อสินค้า หรือคำค้นหาอื่นๆ..."
            v-model="q"
          />
        </label>
        <button
          class="btn sm:btn-sm btn-xs btn-primary shadow-sm"
          v-on:click="fnBase.onCreate()"
        >
          <Icon name="lucide:plus" size="16" />
          เพิ่มสินค้า
        </button>
      </div>
    </div>
    <div
      class="min-h-[calc(100dvh-12.5rem)] max-h-[calc(100dvh-12.5rem)] overflow-auto my-4 relative"
      :class="pending ? 'backdrop-blur-sm' : ''"
    >
      <p
        v-if="pending"
        class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary/75 text-4xl font-bold z-20"
      >
        Loading...
      </p>
      <p v-if="error" class="text-error">{{ error.message }}</p>

      <table
        class="table table-zebra sm:table-sm table-xs table-pin-rows table-pin-cols"
      >
        <thead class="text-xs">
          <tr>
            <td>#</td>
            <td>Image</td>
            <td>Code</td>
            <td>Name</td>
            <td>Category Name</td>
            <td>Supplier Name</td>
            <td class="text-right">Cost Price</td>
            <td class="text-right">Selling Price</td>
            <td>Created</td>
            <td>Updated</td>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in data?.rows"
            :key="row.id"
            class="hover:bg-primary/5"
          >
            <td>{{ row.id }}</td>
            <td>
              <div
                v-if="row.image_url"
                class="h-12 w-12 cursor-pointer"
                v-on:click="fnImage.onOpen(row.image_url)"
              >
                <img :src="row.image_url" class="h-full w-full object-cover" />
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
    <TablePagination
      v-model:page="page"
      v-model:page-size="pageSize"
      :disabled="pending"
      :data="data"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "admin",
});

import { useDayjs } from "~~/composables/useDayjs";
const dayjs = useDayjs();

const baseModal = ref<HTMLDialogElement | null>(null);
const detailModal = ref<HTMLDialogElement | null>(null);
const removeModal = ref<HTMLDialogElement | null>(null);
const imageModal = ref<HTMLDialogElement | null>(null);

const page = ref(1);
const pageSize = ref(10);
const q = ref("");
const base = ref<any>({
  form: {},
  method: "",
  modal: false,
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
        image_url: item.image_url ? JSON.parse(item.image_url) : [],
      })),
    };
  },
});

const fnBase = {
  onCreate: async () => {
    base.value.form = {};
    base.value.method = "post";
    console.log(baseModal.value)
    baseModal.value?.showModal();
  },
  onEdit: async (row: any) => {
    base.value.form = { ...row };
    base.value.method = "put";
    detail.value.rows = await fnDetail.onGet();

    baseModal.value?.showModal();
  },
  onSubmit: async () => {
    const path =
      base.value.method === "post"
        ? "/api/products"
        : `/api/products/${base.value.form.uuid}`;

    const res = await $fetch(path, {
      method: base.value.method,
      body: {
        ...base.value.form
      },
    });

    if (res) {
      baseModal.value?.close();
      refresh();
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
        ...detail.value.form
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
          ...v
        },
      });
    });
  },
};

const fnRemove = {
  onRemove: async (row: any, path: string) => {
    remove.value.path = path;
    remove.value.form = { ...row };
    removeModal.value?.showModal();
  },
  onSubmit: async () => {
    const res = await $fetch(`${remove.value.path}/${remove.value.form.uuid}`, {
      method: "delete",
      body: {
        ...remove.value.form
      },
    });

    if (res) {
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
    imageModal.value?.showModal();
  },
};
</script>
