<template>
  <div class="admin-table-page">
    <TablePanel
      title="กู้คืนรายการหมวดหมู่ย่อย"
      v-model:q="q"
      v-model:page="page"
      v-model:page-size="pageSize"
      :data="data"
      :pending="pending"
      search-placeholder="ค้นหาหมวดหมู่หลักหรือหมวดหมู่ย่อย..."
      @refresh="refresh"
    >
      <table class="admin-data-table">
        <thead class="text-xs">
          <tr>
            <th scope="col">#</th>
            <th scope="col">หมวดหมู่หลัก</th>
            <th scope="col">ชื่อหมวดหมู่ย่อย</th>
            <th scope="col">ลบโดย / เมื่อ</th>
            <th scope="col" class="admin-table-actions">ดำเนินการ</th>
          </tr>
        </thead>
        <tbody>
          <SkeletonTableRows v-if="pending" :columns="5" />
          <TableStateRow
            v-else-if="error || !data?.rows?.length"
            :columns="5"
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
            <td>{{ row.category_name || "-" }}</td>
            <td>{{ row.subcategory_name }}</td>
            <td>
              <div>{{ row.deleted_username || row.deleted_by || "-" }}</div>
              <div class="admin-cell-meta">
                {{ formatDate(row.deleted_at) }}
              </div>
            </td>
            <td class="admin-table-actions">
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

  <ModalRestoreConfirm
    ref="restoreConfirmModal"
    endpoint="/api/subcategories"
    identifier-key="uuid"
    item-name-key="subcategory_name"
    @restored="refresh"
  />
</template>

<script setup lang="ts">
import { useDayjs } from "~~/composables/useDayjs";

definePageMeta({ layout: "admin" });

type RestoreConfirmExpose = {
  onRestore: (row: Record<string, unknown>) => void;
};

const restoreConfirmModal = ref<RestoreConfirmExpose | null>(null);
const dayjs = useDayjs();
const page = ref(1);
const pageSize = ref(10);
const q = ref("");
const formatDate = (value?: string) =>
  value ? dayjs(value).format("YYYY-MM-DD HH:mm:ss") : "";

const { data, pending, error, refresh } = await useFetch("/api/subcategories", {
  server: false,
  query: { page, pageSize, q, deleted: true },
  watch: [page, pageSize, q],
});
</script>
