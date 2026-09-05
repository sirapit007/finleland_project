<template>
  <div class="admin-table-page">
    <TablePanel
      title="จัดการรายการหมวดหมู่ย่อย"
      v-model:q="q"
      v-model:page="page"
      v-model:page-size="pageSize"
      :data="data"
      :pending="pending"
      search-placeholder="ค้นหาหมวดหมู่หลักหรือหมวดหมู่ย่อย..."
      @refresh="refresh"
    >
      <template #actions
        ><button
          class="admin-table-create"
          type="button"
          @click="subcategoryFormModal?.onCreate()"
        >
          <Icon name="lucide:circle-plus" size="16" />
          เพิ่มหมวดหมู่ย่อย
        </button></template
      >

      <table class="admin-data-table">
        <thead class="text-xs">
          <tr>
            <th scope="col">#</th>
            <th scope="col">รูปภาพ</th>
            <th scope="col">หมวดหมู่หลัก</th>
            <th scope="col">ชื่อหมวดหมู่ย่อย</th>
            <th scope="col">ใช้อยู่</th>
            <th scope="col">สร้างโดย / เมื่อ</th>
            <th scope="col">แก้ไขโดย / เมื่อ</th>
            <th scope="col" class="admin-table-actions">ดำเนินการ</th>
          </tr>
        </thead>
        <tbody>
          <SkeletonTableRows v-if="pending" :columns="8" :image-column="1" />
          <TableStateRow
            v-else-if="error || !data?.rows?.length"
            :columns="8"
            :error="!!error"
            :filtered="!!q"
            @retry="refresh"
          />
          <tr
            v-for="row in data?.rows"
            v-else
            :key="row.id"
            class="hover:bg-primary/5"
          >
            <td>{{ row.id }}</td>
            <td>
              <div
                v-if="row.image_url"
                class="size-12 cursor-pointer"
                @click="imagePreviewModal?.onOpen(row.image_url)"
              >
                <img :src="row.image_url" class="size-full object-cover" />
              </div>
              <img
                v-else
                src="@/assets/images/blank.png"
                class="size-12 object-cover"
              />
            </td>
            <td>{{ row.category_name || "-" }}</td>
            <td>{{ row.subcategory_name }}</td>
            <td>{{ row.qty_count }}</td>
            <td>
              <div>{{ row.created_username || row.created_by || "-" }}</div>
              <div class="admin-cell-meta">
                {{ formatDate(row.created_at) }}
              </div>
            </td>
            <td>
              <div>{{ row.updated_username || row.updated_by || "-" }}</div>
              <div class="admin-cell-meta">
                {{ formatDate(row.updated_at) }}
              </div>
            </td>
            <td class="admin-table-actions">
              <TableAction
                label="แก้ไข"
                icon="lucide:square-pen"
                tone="primary"
                @click="subcategoryFormModal?.onEdit(row)"
              />
              <TableAction
                label="ลบ"
                icon="lucide:trash-2"
                tone="danger"
                :disabled="Number(row.qty_count) > 0"
                @click="removeConfirmModal?.onRemove(row, '/api/subcategories')"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </TablePanel>
  </div>

  <ModalImagePreview ref="imagePreviewModal" />
  <SubcategoryFormModal ref="subcategoryFormModal" @changed="refresh" />
  <ModalRemoveConfirm ref="removeConfirmModal" @removed="refresh" />
</template>

<script setup lang="ts">
import { useDayjs } from "~~/composables/useDayjs";

definePageMeta({ layout: "admin" });

type SubcategoryRow = Record<string, any>;
type SubcategoryFormModalExpose = {
  onCreate: (defaults?: Partial<SubcategoryRow>) => Promise<void>;
  onEdit: (row: SubcategoryRow) => Promise<void>;
};
type RemoveConfirmExpose = {
  onRemove: (row: SubcategoryRow, path: string) => Promise<void>;
};
type ImagePreviewExpose = { onOpen: (src: string) => void };

const subcategoryFormModal = ref<SubcategoryFormModalExpose | null>(null);
const removeConfirmModal = ref<RemoveConfirmExpose | null>(null);
const imagePreviewModal = ref<ImagePreviewExpose | null>(null);
const dayjs = useDayjs();
const page = ref(1);
const pageSize = ref(10);
const q = ref("");
const formatDate = (value?: string) =>
  value ? dayjs(value).format("YYYY-MM-DD HH:mm:ss") : "";

const { data, pending, error, refresh } = await useFetch("/api/subcategories", {
  server: false,
  query: { page, pageSize, q },
  watch: [page, pageSize, q],
});
</script>
