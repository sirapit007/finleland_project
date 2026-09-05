<template>
  <div class="admin-table-page">
    <TablePanel
      title="จัดการรายการสินค้า"
      v-model:q="q"
      v-model:page="page"
      v-model:page-size="pageSize"
      :data="data"
      :pending="pending"
      search-placeholder="ค้นหาชื่อสินค้า หรือคำค้นหาอื่นๆ..."
      @refresh="refresh"
    >
      <template #actions
        ><button
          class="admin-table-create"
          type="button"
          v-on:click="productFormModal?.onCreate()"
        >
          <Icon name="lucide:circle-plus" size="16" />
          เพิ่มสินค้า
        </button></template
      >
      <template #filters
        ><select
          class="admin-table-select"
          aria-label="เรียงลำดับสินค้า"
          v-model="orderBy"
        >
          <option value="base.id DESC">เรียงตามลำดับ: หลังไปก่อน</option>
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
        </select></template
      >
      <table class="admin-data-table">
        <thead class="text-xs">
          <tr>
            <th scope="col">#</th>
            <th scope="col">รูปภาพ</th>
            <th scope="col">รหัสสินค้า</th>
            <th scope="col">ชื่อสินค้า</th>
            <th scope="col">หมวดหมู่</th>
            <th scope="col">ผู้จัดจำหน่าย</th>
            <th scope="col" class="text-right">ราคาทุน</th>
            <th scope="col" class="text-right">ราคาขาย</th>
            <th scope="col">สร้างโดย / เมื่อ</th>
            <th scope="col">แก้ไขโดย / เมื่อ</th>
            <th scope="col" class="admin-table-actions">ดำเนินการ</th>
          </tr>
        </thead>
        <tbody>
          <SkeletonTableRows v-if="pending" :columns="11" :image-column="1" />
          <TableStateRow
            v-else-if="error || !data?.rows?.length"
            :columns="11"
            :error="!!error"
            :filtered="!!q"
            @retry="refresh"
          />
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
                  imagePreviewModal?.onOpen(firstProductImageUrl(row.image_url))
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
              <div class="admin-cell-meta">
                {{ dayjs(row.created_at).format("YYYY-MM-DD HH:mm:ss") }}
              </div>
            </td>
            <td>
              <div>{{ row.updated_username ?? row.updated_by }}</div>
              <div class="admin-cell-meta">
                {{
                  row.updated_at
                    ? dayjs(row.updated_at).format("YYYY-MM-DD HH:mm:ss")
                    : ""
                }}
              </div>
            </td>
            <td class="admin-table-actions">
              <TableAction
                label="แก้ไข"
                icon="lucide:square-pen"
                tone="primary"
                v-on:click="productFormModal?.onEdit(row)"
              />
              <TableAction
                label="ลบ"
                icon="lucide:trash-2"
                tone="danger"
                @click="removeConfirmModal?.onRemove(row, '/api/products')"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </TablePanel>
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
    orderBy,
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
