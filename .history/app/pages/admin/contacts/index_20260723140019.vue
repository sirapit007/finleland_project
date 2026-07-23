<template>
  <div class="p-4 bg-base-100">
    <div
      class="flex flex-col justify-between gap-3 md:flex-row md:items-center"
    >
      <div
        class="space-x-3 flex md:flex-col flex-rows md:items-start items-center"
      >
        <span class="font-bold text-xl text-primary">User feedback</span
        ><span class="font-semibold text-base text-secondary"
          >ความคิดเห็นจากผู้ใช้งาน</span
        >
      </div>

      <div class="flex w-full gap-2 sm:items-center md:w-auto">
        <label
          class="flex-1 input input-xs w-full shadow-sm sm:input-sm md:w-80"
        >
          <span class="label"><Icon name="lucide:search" size="16" /></span>
          <input
            type="text"
            placeholder="ค้นหาชื่อ อีเมล หรือข้อความ..."
            v-model="q"
          />
        </label>
      </div>
    </div>

    <div
      class="relative my-1 min-h-[calc(100dvh-16.5rem)] max-h-[calc(100dvh-16.5rem)] overflow-auto rounded-2xl border border-base-300 bg-base-100 shadow-sm sm:my-2 md:my-4 md:min-h-[calc(100dvh-16rem)] md:max-h-[calc(100dvh-16rem)]"
    >
      <p
        v-if="pending"
        class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary/75 text-4xl font-bold z-20"
      >
        Loading...
      </p>
      <p v-if="error" class="text-error">{{ error.message }}</p>

      <table class="table table-zebra table-pin-rows text-sm">
        <thead>
          <tr>
            <th class="w-16">#</th>
            <th class="w-56">ผู้ใช้งาน</th>
            <th>ข้อความ</th>
            <th class="w-28">สถานะ</th>
            <th class="w-44">วันที่ส่ง</th>
          </tr>
        </thead>
        <tbody>
          <tr
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

definePageMeta({ layout: "admin" });

const dayjs = useDayjs();
const page = ref(1);
const pageSize = ref(20);
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
