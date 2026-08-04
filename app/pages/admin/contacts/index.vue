<template>
  <div class="min-h-full p-4 pb-6">
    <div class="flex justify-between gap-3 md:flex-row md:items-center">
      <div class="space-x-3 flex flex-col items-start">
        <span class="font-bold sm:text-xl text-lg text-primary"
          >User feedback</span
        ><span class="font-semibold sm:text-base text-sm text-secondary"
          >ความคิดเห็นจากผู้ใช้งาน</span
        >
      </div>
    </div>

    <div class="rounded-2xl border border-base-300 bg-base-100 shadow-sm mt-2">
      <div class="flex flex-wrap items-center lg:p-3 sm:p-2 p-1">
        <TableResultSummary :page="page" :page-size="pageSize" :data="data" />
        <TableSearch v-model="q" placeholder="ค้นหาชื่อ อีเมล หรือข้อความ..." />
      </div>

      <div class="relative my-1 overflow-auto">
        <p v-if="error" class="text-error">{{ error.message }}</p>

        <table
          class="table min-w-max table-zebra bg-base-100 text-xs sm:table-sm table-xs table-pin-rows table-pin-cols"
        >
          <thead>
            <tr class="text-xs">
              <th>#</th>
              <th>ผู้ใช้งาน</th>
              <th>ข้อความ</th>
              <th>สถานะ</th>
              <th>วันที่ส่ง</th>
            </tr>
          </thead>
          <tbody>
            <SkeletonTableRows v-if="pending" :columns="5" />
            <tr
              v-else
              v-for="(row, index) in data?.rows || []"
              :key="row.uuid"
              class="align-top hover:bg-primary/5"
            >
              <td class="text-base-content/55">
                {{ (page - 1) * pageSize + (index as number) + 1 }}
              </td>
              <td>
                <p class="font-semibold">{{ contactName(row) }}</p>
                <p class="mt-1 text-xs text-base-content/50">
                  {{ row.email || "-" }}
                </p>
              </td>
              <td>
                <p
                  class="min-w-80 max-w-3xl whitespace-pre-wrap break-words leading-6"
                >
                  {{ row.contact_message }}
                </p>
              </td>
              <td>
                <span
                  class="badge badge-sm whitespace-nowrap"
                  :class="statusMeta(row.contact_status).badge"
                >
                  {{ statusMeta(row.contact_status).label }}
                </span>
              </td>
              <td class="whitespace-nowrap text-xs text-base-content/65">
                {{ formatDate(row.created_at) }}
              </td>
            </tr>
            <tr v-if="!pending && !(data?.rows || []).length">
              <td colspan="5" class="py-16 text-center text-base-content/50">
                ยังไม่มีความคิดเห็นจากผู้ใช้งาน
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

definePageMeta({ layout: "admin" });

const dayjs = useDayjs();
const page = ref(1);
const pageSize = ref(10);
const q = ref("");

const { data, pending, error } = await useFetch<any>("/api/user/contacts", {
  server: false,
  query: { page, pageSize, q },
  watch: [page, pageSize, q],
});

const statusMap: Record<string, { label: string; badge: string }> = {
  new: { label: "ใหม่", badge: "badge-info" },
  reviewed: { label: "อ่านแล้ว", badge: "badge-warning" },
  resolved: { label: "ดำเนินการแล้ว", badge: "badge-success" },
};

const statusMeta = (status: string) =>
  statusMap[status] || { label: status || "-", badge: "badge-ghost" };
const contactName = (row: any) =>
  [row.firstname, row.lastname].filter(Boolean).join(" ").trim() ||
  row.email ||
  row.contact_user ||
  "-";
const formatDate = (value: string) =>
  value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "-";
</script>
