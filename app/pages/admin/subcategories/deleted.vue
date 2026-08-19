<template>
  <div class="min-h-full p-4 pb-6">
    <div class="rounded-2xl border border-base-300 bg-base-100 shadow-sm">
      <div class="m-3 flex justify-between gap-3 md:flex-row md:items-center">
        <div class="flex flex-col items-start">
          <span class="text-lg font-bold text-primary sm:text-xl">
            Restore Subcategories
          </span>
          <span class="text-sm font-semibold text-secondary sm:text-base">
            กู้คืนรายการหมวดหมู่ย่อย
          </span>
        </div>
      </div>

      <div class="flex flex-wrap items-center p-1 sm:p-2 lg:p-3">
        <TableResultSummary :page="page" :page-size="pageSize" :data="data" />
        <TableSearch
          v-model="q"
          placeholder="ค้นหาหมวดหมู่หลักหรือหมวดหมู่ย่อย..."
        />
        <TablePagination v-model:page="page" :disabled="pending" :data="data" />
      </div>

      <div class="relative my-1" :class="pending ? 'overflow-hidden' : 'overflow-auto'">
        <p v-if="error" class="px-3 text-error">{{ error.message }}</p>
        <table
          class="table table-xs table-pin-cols table-pin-rows table-zebra min-w-max bg-base-100 text-xs sm:table-sm"
        >
          <thead class="text-xs">
            <tr>
              <td>#</td>
              <td>หมวดหมู่หลัก</td>
              <td>ชื่อหมวดหมู่ย่อย</td>
              <td>ลบโดย / เมื่อ</td>
              <th />
            </tr>
          </thead>
          <tbody>
            <SkeletonTableRows v-if="pending" :columns="5" />
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
                <div>{{ formatDate(row.deleted_at) }}</div>
              </td>
              <td class="text-end">
                <button
                  class="btn btn-link btn-success btn-xs"
                  @click="restoreConfirmModal?.onRestore(row)"
                >
                  กู้คืน
                </button>
              </td>
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
