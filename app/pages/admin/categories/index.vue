<template>
  <div class="admin-table-page">
    <TablePanel
      title="จัดการรายการหมวดหมู่"
      v-model:q="q"
      v-model:page="page"
      v-model:page-size="pageSize"
      :data="data"
      :pending="pending"
      search-placeholder="ค้นหาชื่อหมวดหมู่ หรือคำค้นหา..."
      @refresh="refresh"
    >
      <template #actions
        ><button
          class="admin-table-create"
          type="button"
          @click="categoryFormModal?.onCreate()"
        >
          <Icon name="lucide:circle-plus" size="16" />
          เพิ่มหมวดหมู่
        </button></template
      >

      <table class="admin-data-table">
        <thead class="text-xs">
          <tr>
            <th scope="col">#</th>
            <th scope="col">รูปภาพ</th>
            <th scope="col">ชื่อหมวดหมู่</th>
            <th scope="col">ใช้อยู่</th>
            <th scope="col">สร้างโดย / เมื่อ</th>
            <th scope="col">แก้ไขโดย / เมื่อ</th>
            <th scope="col" class="admin-table-actions">ดำเนินการ</th>
          </tr>
        </thead>
        <tbody>
          <SkeletonTableRows v-if="pending" :columns="7" :image-column="1" />
          <TableStateRow
            v-else-if="error || !data?.rows?.length"
            :columns="7"
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
                v-if="row.image_url"
                class="h-12 w-12 cursor-pointer"
                @click="imagePreviewModal?.onOpen(row.image_url)"
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
            <td>{{ row.category_name }}</td>
            <td>
              {{ row.qty_count }} สินค้า /
              {{ row.subcategory_count }} หมวดหมู่ย่อย
            </td>
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
                @click="categoryFormModal?.onEdit(row)"
              />
              <TableAction
                label="ลบ"
                icon="lucide:trash-2"
                tone="danger"
                :disabled="row.qty_count > 0 || row.subcategory_count > 0"
                @click="removeConfirmModal?.onRemove(row, '/api/categories')"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </TablePanel>
  </div>

  <ModalImagePreview ref="imagePreviewModal" />

  <CategoryFormModal ref="categoryFormModal" @changed="onRefresh" />

  <ModalRemoveConfirm ref="removeConfirmModal" @removed="onRefresh" />
</template>

<script setup lang="ts">
import { useDayjs } from "~~/composables/useDayjs";

definePageMeta({
  layout: "admin",
});

type RemoveConfirmExpose = {
  onRemove: (row: Record<string, unknown>, path: string) => Promise<void>;
};

type ImagePreviewExpose = {
  onOpen: (src: string) => void;
};

type CategoryRow = {
  [key: string]: unknown;
  uuid?: string;
  category_name?: string;
  image_url?: string;
};

type CategoryFormModalExpose = {
  onCreate: () => Promise<void>;
  onEdit: (row: CategoryRow) => Promise<void>;
  onSubmit: () => Promise<void>;
};

const categoryFormModal = ref<CategoryFormModalExpose | null>(null);
const removeConfirmModal = ref<RemoveConfirmExpose | null>(null);
const imagePreviewModal = ref<ImagePreviewExpose | null>(null);

const dayjs = useDayjs();

const page = ref(1);
const pageSize = ref(10);
const q = ref("");

const { data, pending, error, refresh } = await useFetch("/api/categories", {
  server: false,
  query: {
    page,
    pageSize,
    q,
  },
  watch: [page, pageSize, q],
});

const onRefresh = async () => {
  await refresh();
};
</script>
