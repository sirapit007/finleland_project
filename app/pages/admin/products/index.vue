<template>
  <div class="min-h-full p-4 pb-6">
    <div class="rounded-2xl border border-base-300 bg-base-100 shadow-sm">
      <div class="flex justify-between gap-3 md:flex-row md:items-center m-3">
        <div class="space-x-3 flex flex-col items-start">
          <span class="font-bold sm:text-lg text-base text-primary"
            >Manage Products</span
          ><span class="font-semibold sm:text-base text-sm text-secondary"
            >จัดการรายการสินค้า</span
          >
        </div>
        <div class="space-x-4">
          <select
            class="select select-xs w-full cursor-pointer bg-base-100 sm:select-sm sm:w-fit lg:select-base"
            v-model="orderBy"
          >
            <option value="base.id DESC" selected>
              เรียงตามลำดับ: หลังไปก่อน
            </option>
            <option value="base.id ASC">เรียงตามลำดับ: ก่อนไปหลัง</option>
            <option value="base.product_selling_price DESC">
              เรียงตามลำดับ: แพงไปถูก
            </option>
            <option value="base.product_selling_price ASC">
              เรียงตามลำดับ: ถูกไปแพง
            </option>
            <option value="base.product_name ASC">เรียงตามชื่อ: A-Z</option>
            <option value="base.product_name DESC">เรียงตามชื่อ: Z-A</option>
            <option value="base.product_category_name ASC">
              เรียงตามหมวดหมู่: A-Z
            </option>
            <option value="base.product_category_name DESC">
              เรียงตามหมวดหมู่: Z-A
            </option>
          </select>
          <button
            class="flex-none btn btn-xs shadow-sm sm:btn-sm btn-primary"
            v-on:click="productFormModal?.onCreate()"
          >
            <Icon name="lucide:plus" size="16" />
            เพิ่มสินค้า
          </button>
        </div>
      </div>

      <div class="flex flex-wrap items-center lg:p-3 sm:p-2 p-1">
        <TableResultSummary :page="page" :page-size="pageSize" :data="data" />
        <TableSearch
          v-model="q"
          placeholder="ค้นหาชื่อสินค้า หรือคำค้นหาอื่นๆ..."
        />
        <TablePagination v-model:page="page" :disabled="pending" :data="data" />
      </div>
      <div
        class="relative my-1"
        :class="pending ? 'overflow-hidden' : 'overflow-auto'"
      >
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
                  @click="
                    imagePreviewModal?.onOpen(
                      firstProductImageUrl(row.image_url),
                    )
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
                  v-on:click="productFormModal?.onEdit(row)"
                >
                  แก้ไข
                </button>
                <button
                  class="btn btn-xs btn-link btn-error no-underline"
                  @click="removeConfirmModal?.onRemove(row, '/api/products')"
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

  <ModalImagePreview ref="imagePreviewModal" />

  <ProductFormModal ref="productFormModal" @saved="onRefresh" />

  <ModalRemoveConfirm ref="removeConfirmModal" @removed="onRefresh" />
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

const orderBy = ref("base.id DESC");

type ImagePreviewExpose = {
  onOpen: (src: string) => void;
};

type ProductFormModalExpose = {
  onCreate: () => Promise<void>;
  onEdit: (row: Record<string, unknown>) => Promise<void>;
  onSubmit: () => Promise<void>;
  refreshPromotions: () => Promise<void>;
};

type RemoveConfirmExpose = {
  onRemove: (row: Record<string, unknown>, path: string) => Promise<void>;
};

const imagePreviewModal = ref<ImagePreviewExpose | null>(null);
const productFormModal = ref<ProductFormModalExpose | null>(null);
const removeConfirmModal = ref<RemoveConfirmExpose | null>(null);

const onRefresh = async () => {
  await refresh();
};

const page = ref(1);
const pageSize = ref(10);
const q = ref("");

const { data, pending, error, refresh } = await useFetch("/api/products", {
  server: false,
  query: {
    page,
    pageSize,
    q,
    orderBy
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
</script>
