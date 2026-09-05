<template>
  <div class="admin-table-page">
    <TablePanel
      title="จัดการรายการผู้จัดจำหน่าย"
      v-model:q="q"
      v-model:page="page"
      v-model:page-size="pageSize"
      :data="data"
      :pending="pending"
      search-placeholder="ค้นหาชื่อผู้จัดจำหน่าย หรือคำค้นหาอื่นๆ..."
      @refresh="refresh"
    >
      <template #actions
        ><button
          class="admin-table-create"
          type="button"
          @click="supplierFormModal?.onCreate()"
        >
          <Icon name="lucide:circle-plus" size="16" />
          เพิ่มผู้จัดจำหน่าย
        </button></template
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
                label="แก้ไข"
                icon="lucide:square-pen"
                tone="primary"
                @click="supplierFormModal?.onEdit(row)"
              />
              <TableAction
                label="ลบ"
                icon="lucide:trash-2"
                tone="danger"
                @click="removeConfirmModal?.onRemove(row, '/api/suppliers')"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </TablePanel>
  </div>

  <SupplierFormModal ref="supplierFormModal" @changed="onRefresh" />

  <ModalRemoveConfirm ref="removeConfirmModal" @removed="onRefresh" />
</template>

<script setup lang="ts">
definePageMeta({
  layout: "admin",
});

import { useDayjs } from "~~/composables/useDayjs";

type RemoveConfirmExpose = {
  onRemove: (row: Record<string, unknown>, path: string) => Promise<void>;
};

const removeConfirmModal = ref<RemoveConfirmExpose | null>(null);

type SupplierRow = {
  [key: string]: unknown;
  uuid?: string;
  supplier_code?: string;
  supplier_name?: string;
  supplier_address?: string;
};

type SupplierFormModalExpose = {
  onCreate: () => Promise<void>;
  onEdit: (row: SupplierRow) => Promise<void>;
  onSubmit: () => Promise<void>;
};

const supplierFormModal = ref<SupplierFormModalExpose | null>(null);

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
  },
  watch: [page, pageSize, q],
});

const onRefresh = async () => {
  await refresh();
};
</script>
