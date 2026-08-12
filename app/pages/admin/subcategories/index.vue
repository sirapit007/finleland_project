<template>
  <div class="min-h-full p-4 pb-6">
    <div class="rounded-2xl border border-base-300 bg-base-100 shadow-sm">
      <div class="m-3 flex justify-between gap-3 md:flex-row md:items-center">
        <div class="flex flex-col items-start space-x-3">
          <span class="text-lg font-bold text-primary sm:text-xl">
            Manage Subcategories
          </span>
          <span class="text-sm font-semibold text-secondary sm:text-base">
            จัดการรายการหมวดหมู่ย่อย
          </span>
        </div>
        <button
          class="btn btn-primary btn-xs flex-none shadow-sm sm:btn-sm"
          @click="subcategoryFormModal?.onCreate()"
        >
          <Icon name="lucide:plus" size="16" />
          เพิ่มหมวดหมู่ย่อย
        </button>
      </div>

      <div class="flex flex-wrap items-center p-1 sm:p-2 lg:p-3">
        <TableResultSummary :page="page" :page-size="pageSize" :data="data" />
        <TableSearch
          v-model="q"
          placeholder="ค้นหาหมวดหมู่หลักหรือหมวดหมู่ย่อย..."
        />
      </div>

      <div class="relative my-1 overflow-auto">
        <p v-if="error" class="px-3 text-error">{{ error.message }}</p>
        <table
          class="table table-xs table-pin-cols table-pin-rows table-zebra min-w-max bg-base-100 text-xs sm:table-sm"
        >
          <thead class="text-xs">
            <tr>
              <td>#</td>
              <td>รูปภาพ</td>
              <td>หมวดหมู่หลัก</td>
              <td>ชื่อหมวดหมู่ย่อย</td>
              <td>ใช้อยู่</td>
              <td>สร้างโดย / เมื่อ</td>
              <td>แก้ไขโดย / เมื่อ</td>
              <th />
            </tr>
          </thead>
          <tbody>
            <SkeletonTableRows v-if="pending" :columns="8" :image-column="1" />
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
                <div>{{ formatDate(row.created_at) }}</div>
              </td>
              <td>
                <div>{{ row.updated_username || row.updated_by || "-" }}</div>
                <div>{{ formatDate(row.updated_at) }}</div>
              </td>
              <th class="text-end">
                <button
                  class="btn btn-link btn-xs"
                  @click="subcategoryFormModal?.onEdit(row)"
                >
                  แก้ไข
                </button>
                <button
                  class="btn btn-error btn-link btn-xs no-underline"
                  :disabled="Number(row.qty_count) > 0"
                  @click="
                    removeConfirmModal?.onRemove(row, '/api/subcategories')
                  "
                >
                  ลบ
                </button>
              </th>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex flex-wrap items-center p-1 sm:p-2 lg:p-3">
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
