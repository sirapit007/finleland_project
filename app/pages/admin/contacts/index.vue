<template>
  <div class="admin-table-page">
    <TablePanel
      title="ความคิดเห็นจากผู้ใช้งาน"
      v-model:q="q"
      v-model:page="page"
      v-model:page-size="pageSize"
      :data="data"
      :pending="pending"
      search-placeholder="ค้นหาชื่อ อีเมล หรือข้อความ..."
      @refresh="refresh"
    >
      <table class="admin-data-table">
        <thead>
          <tr class="text-xs">
            <th scope="col">#</th>
            <th scope="col">ผู้ใช้งาน</th>
            <th scope="col">ข้อความ</th>
            <th scope="col">สถานะ</th>
            <th scope="col">วันที่ส่ง</th>
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
        </tbody>
      </table>
    </TablePanel>
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
