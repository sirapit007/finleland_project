<template>
  <div class="admin-table-page">
    <TablePanel
      title="กู้คืนรายการสินค้า"
      v-model:q="q"
      v-model:page="page"
      v-model:page-size="pageSize"
      :data="data"
      :pending="pending"
      search-placeholder="ค้นหาชื่อสินค้า หรือคำค้นหาอื่นๆ..."
      @refresh="refresh"
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
            <th scope="col">ราคาทุน</th>
            <th scope="col">ราคาขาย</th>
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
            <td>{{ row.product_cost_price }}</td>
            <td>{{ row.product_selling_price }}</td>
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
                label="ดู"
                icon="lucide:eye"
                tone="primary"
                v-on:click="productFormModal?.onEdit(row)"
              />
              <TableAction
                label="กู้คืน"
                icon="lucide:rotate-ccw"
                tone="success"
                @click="restoreConfirmModal?.onRestore(row)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </TablePanel>
  </div>

  <ModalImagePreview ref="imagePreviewModal" />

  <ProductFormModal ref="productFormModal" is-deleted />

  <ModalRestoreConfirm
    ref="restoreConfirmModal"
    endpoint="/api/products"
    identifier-key="uuid"
    item-name-key="product_name"
    @restored="onRestored"
  />
</template>

<script setup lang="ts">
definePageMeta({
  layout: "admin",
});

import { useDayjs } from "~~/composables/useDayjs";
import { firstProductImageUrl } from "~/utils/productImages";
const dayjs = useDayjs();

// ข้อมูล page นี้
const page = ref(1);
const pageSize = ref(10);
const q = ref("");
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

type productFormExpose = {
  onEdit: (row: Record<string, unknown>) => Promise<void>;
};

type ImagePreviewExpose = {
  onOpen: (src: string) => void;
};

const productFormModal = ref<productFormExpose | null>(null);
const imagePreviewModal = ref<ImagePreviewExpose | null>(null);

type RestoreConfirmExpose = {
  onRestore: (row: Record<string, unknown>) => void;
};

const restoreConfirmModal = ref<RestoreConfirmExpose | null>(null);

const onRestored = async () => {
  await refresh();
};
</script>
