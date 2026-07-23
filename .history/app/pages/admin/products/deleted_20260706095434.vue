<template>
  <dialog ref="baseModal" class="modal">
    <div
      class="modal-box"
      :class="base.method === 'post' ? 'max-w-xl' : 'max-w-7xl'"
    >
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
          ✕
        </button>
      </form>
      <h3 class="text-lg font-bold">Create Product</h3>

      <div :class="`mt-2 gap-4`">
        <div class="space-y-2">
          <!-- {{ base.form }} -->
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Product Code</legend>
            <input
              type="text"
              class="input input-sm w-full"
              placeholder="สูงสุด 50 ตัวอักษร..."
              v-model="base.form.product_code"
              disabled
            />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Product Name</legend>
            <input
              type="text"
              class="input input-sm w-full"
              placeholder="สูงสุด 150 ตัวอักษร..."
              v-model="base.form.product_name"
              disabled
            />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Product Category</legend>
            <ComboBox
              v-model="base.form.product_category"
              fetchUrl="/api/products"
              placeholder="เลือกหมวดหมู่สินค้า..."
              label="category_name"
              value="uuid"
              disabled
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
              disabled
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
              disabled
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
              disabled
            />
          </fieldset>
        </div>
      </div>
      <div class="max-h-[40vh]" v-if="base.method === 'put'">
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
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </dialog>

  <dialog ref="restoreModal" class="modal">
    <div class="modal-box max-w-xs">
      <h3 class="text-lg font-bold">ยืนยันที่จะกู้คืนรายการนี้</h3>
      <div class="text-center mt-5">
        <Icon
          name="lucide:message-circle-question-mark"
          class="text-success"
          size="60"
        />
      </div>
      <div class="modal-action">
        <button
          class="flex-1 btn btn-sm"
          @click="restoreModal?.close()"
        >
          ปิด
        </button>
        <button
          class="flex-1 btn btn-sm btn-success"
          type="button"
          @click="fnRestore.onSubmit()"
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
          class="btn btn-xs btn-circle btn-neutral absolute right-2 top-2"
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
        <span class="font-bold text-xl text-primary">Restore Products</span
        ><span class="font-semibold text-base text-secondary"
          >กู้คืนรายการสินค้า</span
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
            <td>Cost Price</td>
            <td>Selling Price</td>
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
            <td>{{ row.product_cost_price }}</td>
            <td>{{ row.product_selling_price }}</td>
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
                class="btn btn-xs btn-link no-underline"
                v-on:click="fnBase.onEdit(row)"
              >
                ดู
              </button>
              <button
                class="btn btn-xs btn-success btn-link"
                v-on:click="fnBase.onRestore(row)"
              >
                กู้คืน
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
const restoreModal = ref<HTMLDialogElement | null>(null);
const imageModal = ref<HTMLDialogElement | null>(null);

const page = ref(1);
const pageSize = ref(10);
const q = ref("");
const base = ref<any>({
  form: {},
  method: "",
});
const detail = ref<any>({
  rows: [],
  form: {},
  method: "",
});
const imageSrc = ref("");

const { data, pending, error, refresh } = await useFetch("/api/products", {
  server: false,
  query: {
    page,
    pageSize,
    q,
    deleted: true,
  },
  watch: [page, pageSize, q],
});

const fnBase = {
  onEdit: async (row: any) => {
    base.value.form = { ...row };
    base.value.method = "put";

    detail.value.rows = await fnDetail.onGet();

    baseModal.value?.showModal();
  },
  onRestore: async (row: any) => {
    base.value.form = { ...row };
    restoreModal.value?.showModal();
  },
};

const fnDetail = {
  onGet: async () => {
    const res: any = await $fetch(`/api/promotion/${base.value.form.uuid}`);
    return res.rows;
  },
};

const fnRestore = {
  onSubmit: async () => {
    const res = await $fetch(`/api/products/${base.value.form.uuid}`, {
      method: "put",
      body: {
        ...base.value.form,
        user: JSON.parse(localStorage.getItem("web-user") || "null"),
      },
    });

    if (res) {
      refresh();

      restoreModal.value?.close();
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
