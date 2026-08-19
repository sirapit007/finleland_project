<template>
  <div class="min-h-full p-4 pb-6">
    <div class="rounded-2xl border border-base-300 bg-base-100 shadow-sm">
      <div class="flex justify-between gap-3 md:flex-row md:items-center m-3">
        <div class="space-x-3 flex flex-col items-start">
          <span class="font-bold sm:text-lg text-base text-primary"
            >Restore Categories</span
          ><span class="font-semibold sm:text-base text-sm text-secondary"
            >กู้คืนรายการหมวดหมู่</span
          >
        </div>
      </div>

      <div class="flex flex-wrap items-center lg:p-3 sm:p-2 p-1">
        <TableResultSummary :page="page" :page-size="pageSize" :data="data" />
        <TableSearch
          v-model="q"
          placeholder="ค้นหาชื่อหมวดหมู่ หรือคำค้นหา..."
        />
        <TablePagination v-model:page="page" :disabled="pending" :data="data" />
      </div>

      <div class="relative my-1" :class="pending ? 'overflow-hidden' : 'overflow-auto'">
        <p v-if="error" class="text-error">{{ error.message }}</p>

        <table
          class="table min-w-max table-zebra bg-base-100 text-xs sm:table-sm table-xs table-pin-rows table-pin-cols"
        >
          <thead class="text-xs">
            <tr>
              <td>#</td>
              <td>ชื่อหมวดหมู่</td>
              <td>สร้างโดย / เมื่อ</td>
              <td>แก้ไขโดย / เมื่อ</td>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <SkeletonTableRows v-if="pending" :columns="5" />
            <tr
              v-else
              v-for="row in data?.rows"
              :key="row.id"
              class="hover:bg-primary/5"
            >
              <td>{{ row.id }}</td>
              <td>{{ row.category_name }}</td>
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
              <td class="text-end">
                <button
                  class="btn btn-xs btn-success btn-link"
                  @click="restoreConfirmModal?.onRestore(row)"
                >
                  กู้คืน
                </button>
              </td>
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

  <ModalRestoreConfirm
    ref="restoreConfirmModal"
    endpoint="/api/categories"
    identifier-key="uuid"
    item-name-key="category_name"
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

const { data, pending, error, refresh } = await useFetch("/api/categories", {
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
