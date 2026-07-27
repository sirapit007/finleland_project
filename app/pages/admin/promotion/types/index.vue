<template>
  <div class="p-4 bg-base-100">
    <div
      class="flex flex-col justify-between gap-3 md:flex-row md:items-center"
    >
      <div
        class="flex flex-row items-center gap-3 md:flex-col md:items-start md:gap-0"
      >
        <span class="font-bold text-xl text-primary"
          >Manage Promotion Types</span
        ><span class="font-semibold text-base text-secondary"
          >จัดการประเภทโปรโมชั่น</span
        >
      </div>
      <div class="flex w-full gap-2 sm:items-center md:w-auto">
        <label
          class="flex-1 input input-xs w-full shadow-sm sm:input-sm md:w-80"
        >
          <span class="label"><Icon name="lucide:search" size="16" /></span>
          <input
            type="text"
            placeholder="ค้นหาชื่อประเภทโปรโมชั่น หรือคำค้นหา..."
            v-model="q"
          />
        </label>
      </div>
    </div>
    <div
      class="relative my-1 min-h-[calc(100dvh-16.5rem)] max-h-[calc(100dvh-16.5rem)] overflow-auto rounded-2xl border border-base-300 bg-base-100 shadow-sm sm:my-2 md:my-4 md:min-h-[calc(100dvh-16rem)] md:max-h-[calc(100dvh-16rem)]"
    >
      <p v-if="error" class="text-error">{{ error.message }}</p>

      <table
        class="table min-w-max table-zebra bg-base-100 text-xs sm:table-sm table-pin-rows table-pin-cols"
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
    <TablePagination
      v-model:page="page"
      v-model:page-size="pageSize"
      :disabled="pending"
      :data="data"
    />
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
