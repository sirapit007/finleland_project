<template>
  <div class="admin-table-page">
    <TablePanel
      title="กู้คืนรายการผู้จัดจำหน่าย"
      v-model:q="q"
      v-model:page="page"
      v-model:page-size="pageSize"
      :data="data"
      :pending="pending"
      search-placeholder="ค้นหาชื่อผู้จัดจำหน่าย หรือคำค้นหา..."
      @refresh="refresh"
    >
      <table class="admin-data-table">
        <thead class="text-xs">
          <tr>
            <th scope="col">#</th>
            <th scope="col">รหัส</th>
            <th scope="col">ชื่อผู้จัดจำหน่าย</th>
            <th scope="col">ที่อยู่</th>
            <th scope="col">สร้างโดย / เมื่อ</th>
            <th scope="col">แก้ไขโดย / เมื่อ</th>
            <th scope="col" class="admin-table-actions">ดำเนินการ</th>
          </tr>
        </thead>
        <tbody>
          <SkeletonTableRows v-if="pending" :columns="7" />
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
            <td>{{ row.supplier_code }}</td>
            <td>{{ row.supplier_name }}</td>
            <td>{{ row.supplier_address || "-" }}</td>
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
    endpoint="/api/suppliers"
    identifier-key="uuid"
    item-name-key="supplier_name"
    @restored="onRestored"
  />
</template>

<script setup lang="ts">
import { useDayjs } from "~~/composables/useDayjs";

definePageMeta({
  layout: "admin",
});

type RestoreConfirmExpose = {
  onRestore: (row: Record<string, unknown>) => void;
};

const restoreConfirmModal = ref<RestoreConfirmExpose | null>(null);

const dayjs = useDayjs();

const page = ref(1);
const pageSize = ref(10);
const q = ref("");

const { data, pending, error, refresh } = await useFetch("/api/suppliers", {
  server: false,
  query: {
    page,
    pageSize,
    q,
    deleted: true,
  },
  watch: [page, pageSize, q],
});

const onRestored = async () => {
  await refresh();
};
</script>
