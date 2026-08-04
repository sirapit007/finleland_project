<template>
  <div class="min-h-full p-4 pb-6">
    <div class="flex justify-between gap-3 md:flex-row md:items-center">
      <div class="space-x-3 flex flex-col items-start">
        <span class="font-bold sm:text-xl text-lg text-primary"
          >Manage Promotion Types</span
        ><span class="font-semibold sm:text-base text-sm text-secondary"
          >จัดการประเภทโปรโมชั่น</span
        >
      </div>
    </div>

    <div class="rounded-2xl border border-base-300 bg-base-100 shadow-sm mt-2">
      <div class="flex flex-wrap items-center lg:p-3 sm:p-2 p-1">
        <TableResultSummary :page="page" :page-size="pageSize" :data="data" />
        <TableSearch
          v-model="q"
          placeholder="ค้นหาชื่อประเภทโปรโมชั่น หรือคำค้นหา..."
        />
      </div>

      <div class="relative my-1 overflow-auto">
        <p v-if="error" class="text-error">{{ error.message }}</p>

        <table
          class="table min-w-max table-zebra bg-base-100 text-xs sm:table-sm table-xs table-pin-rows table-pin-cols"
        >
          <thead class="text-xs">
            <tr>
              <td>#</td>
              <td>รหัส</td>
              <td>ชื่อประเภทโปรโมชั่น</td>
              <td>รายละเอียด</td>
              <td>เปิดใช้งาน</td>
              <td>สร้างโดย / เมื่อ</td>
              <td>แก้ไขโดย / เมื่อ</td>
            </tr>
          </thead>
          <tbody>
            <SkeletonTableRows v-if="pending" :columns="7" />
            <tr
              v-else
              v-for="row in data?.rows"
              :key="row.id"
              class="hover:bg-primary/5"
              :class="!row.promotion_type_is_active ? 'opacity-50' : ''"
            >
              <td>{{ row.id }}</td>
              <td>{{ row.promotion_type_code }}</td>
              <td>{{ row.promotion_type_name }}</td>
              <td>{{ row.promotion_type_description }}</td>
              <td>
                <input
                  type="checkbox"
                  class="checkbox checkbox-accent"
                  v-model="row.promotion_type_is_active"
                  v-on:click="fnBase.onSubmit(row)"
                />
              </td>
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
</template>

<script setup lang="ts">
import { useDayjs } from "~~/composables/useDayjs";

definePageMeta({
  layout: "admin",
});

const dayjs = useDayjs();

const page = ref(1);
const pageSize = ref(10);
const q = ref("");

const { data, pending, error, refresh } = await useFetch(
  "/api/promotion/types",
  {
    server: false,
    query: {
      page,
      pageSize,
      q,
    },
    watch: [page, pageSize, q],
  },
);

const fnBase = {
  onSubmit: async (row: any) => {
    const path = `/api/promotion/types/${row.uuid}`;

    const res = await $fetch(path, {
      method: "put",
      body: {
        ...row,
        promotion_type_is_active: row.promotion_type_is_active ? false : true,
      },
    });

    if (res) {
      refresh();
    }
  },
};
</script>
