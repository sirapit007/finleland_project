<template>
  <div class="admin-table-page">
    <TablePanel
      title="ดูแลผู้ใช้งานระบบ"
      v-model:q="q"
      v-model:page="page"
      v-model:page-size="pageSize"
      :data="data"
      :pending="pending"
      search-placeholder="ค้นหาชื่อผู้ใช้งานระบบ หรือคำค้นหาอื่นๆ..."
      @refresh="refresh"
    >
      <template #actions
        ><button
          class="admin-table-create"
          type="button"
          @click="userFormModal?.onCreate()"
        >
          <Icon name="lucide:circle-plus" size="16" />
          เพิ่มผู้ใช้งานระบบ
        </button></template
      >

      <table class="admin-data-table">
        <thead class="text-xs">
          <tr>
            <th scope="col">#</th>
            <th scope="col">ชื่อ</th>
            <th scope="col">นามสกุล</th>
            <th scope="col">เบอร์โทรศัพท์</th>
            <th scope="col">อีเมล</th>
            <th scope="col">บทบาท</th>
            <th scope="col">สร้างโดย / เมื่อ</th>
            <th scope="col">แก้ไขโดย / เมื่อ</th>
            <th scope="col" class="admin-table-actions">ดำเนินการ</th>
          </tr>
        </thead>
        <tbody>
          <SkeletonTableRows v-if="pending" :columns="9" />
          <TableStateRow
            v-else-if="error || !data?.rows?.length"
            :columns="9"
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
            <td>{{ row.firstname }}</td>
            <td>{{ row.lastname }}</td>
            <td>{{ row.phone }}</td>
            <td>{{ row.email }}</td>
            <td>
              <div
                :class="`badge badge-xs font-semibold ${row.role === 'User' ? 'badge-info' : row.role === 'Superuser' ? 'badge-warning' : 'badge-success'}`"
              >
                {{ row.role }}
              </div>
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
                @click="userFormModal?.onEdit(row)"
              />
              <TableAction
                label="ลบ"
                icon="lucide:trash-2"
                tone="danger"
                @click="removeConfirmModal?.onRemove(row, '/api/user')"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </TablePanel>
  </div>

  <UserFormModal ref="userFormModal" @changed="onRefresh" />

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

type UserRow = {
  [key: string]: unknown;
  uuid?: string;
  firstname?: string;
  lastname?: string;
  phone?: string;
  email?: string;
  role?: string;
};

type UserFormModalExpose = {
  onCreate: () => Promise<void>;
  onEdit: (row: UserRow) => Promise<void>;
  onSubmit: () => Promise<void>;
};

const userFormModal = ref<UserFormModalExpose | null>(null);
const removeConfirmModal = ref<RemoveConfirmExpose | null>(null);

const dayjs = useDayjs();

const page = ref(1);
const pageSize = ref(10);
const q = ref("");

const { data, pending, error, refresh } = await useFetch("/api/user", {
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
