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
            <legend class="fieldset-legend">รหัสสินค้า</legend>
            <input
              type="text"
              class="input input-sm w-full"
              placeholder="สูงสุด 50 ตัวอักษร..."
              v-model="base.form.product_code"
              disabled
            />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">ชื่อสินค้า</legend>
            <input
              type="text"
              class="input input-sm w-full"
              placeholder="สูงสุด 150 ตัวอักษร..."
              v-model="base.form.product_name"
              disabled
            />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">หมวดหมู่สินค้า</legend>
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
            <legend class="fieldset-legend">ผู้จัดจำหน่าย</legend>
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
            <legend class="fieldset-legend">ราคาทุน</legend>
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
            <legend class="fieldset-legend">ราคาขาย</legend>
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
                <td>#</td>
                <td>ชื่อโปรโมชั่น</td>
                <td>รายละเอียด</td>
                <td>ราคา</td>
                <td>วันที่เริ่มต้น</td>
                <td>วันที่สิ้นสุด</td>
                <td>สร้างโดย / เมื่อ</td>
                <td>แก้ไขโดย / เมื่อ</td>
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
        <button class="flex-1 btn btn-sm" @click="restoreModal?.close()">
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

  <ModalImagePreview v-model="isImagePreviewOpen" :src="imageSrc" />

  <div class="p-4 bg-base-100">
    <div
      class="flex flex-col justify-between gap-3 md:flex-row md:items-center"
    >
      <div
        class="flex flex-row items-center gap-3 md:flex-col md:items-start md:gap-0"
      >
        <span class="font-bold text-xl text-primary">Restore Products</span
        ><span class="font-semibold text-base text-secondary"
          >กู้คืนรายการสินค้า</span
        >
      </div>
      <div class="flex w-full gap-2 sm:items-center md:w-auto">
        <label
          class="flex-1 input input-xs w-full shadow-sm sm:input-sm md:w-80"
        >
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
      class="relative my-1 min-h-[calc(100dvh-16.5rem)] max-h-[calc(100dvh-16.5rem)] overflow-auto rounded-2xl border border-base-300 bg-base-100 shadow-sm sm:my-2 md:my-4 md:min-h-[calc(100dvh-16rem)] md:max-h-[calc(100dvh-16rem)]"
    >
      <p v-if="error" class="text-error">{{ error.message }}</p>

      <table
        class="table min-w-max table-zebra bg-base-100 text-xs sm:table-sm table-pin-rows table-pin-cols"
      >
        <thead class="text-xs">
          <tr>
            <td>#</td>
            <td>รูปภาพ</td>
            <td>รหัสสินค้า</td>
            <td>ชื่อสินค้า</td>
            <td>หมวดหมู่</td>
            <td>ผู้จัดจำหน่าย</td>
            <td>ราคาทุน</td>
            <td>ราคาขาย</td>
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
                v-on:click="fnImage.onOpen(firstProductImageUrl(row.image_url))"
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
import { firstProductImageUrl } from "~/utils/productImages";
const dayjs = useDayjs();

const baseModal = ref<HTMLDialogElement | null>(null);
const restoreModal = ref<HTMLDialogElement | null>(null);
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
    isImagePreviewOpen.value = true;
  },
};
</script>
