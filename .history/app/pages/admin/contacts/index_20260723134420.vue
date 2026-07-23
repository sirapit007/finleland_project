<template>
  <div class="space-y-4 p-4 md:p-6">
    <header
      class="flex flex-col gap-4 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm md:flex-row md:items-center md:justify-between"
    >
      <div>
        <p class="text-xs font-semibold uppercase tracking-wider text-primary">
          User feedback
        </p>
        <h1 class="mt-1 text-xl font-bold">ความคิดเห็นจากผู้ใช้งาน</h1>
        <p class="mt-1 text-sm text-base-content/55">
          ข้อเสนอแนะและข้อความที่ผู้ใช้งานส่งผ่านหน้าติดต่อเรา
        </p>
      </div>

      <label class="input input-sm w-full shadow-sm md:w-80">
        <Icon name="lucide:search" size="16" class="text-base-content/50" />
        <input
          v-model="q"
          type="search"
          placeholder="ค้นหาชื่อ อีเมล หรือข้อความ..."
          @input="page = 1"
        />
      </label>
    </header>

    <section
      class="relative min-h-[calc(100dvh-17rem)] overflow-auto rounded-2xl border border-base-300 bg-base-100 shadow-sm"
    >
      <div
        v-if="pending"
        class="absolute inset-0 z-20 grid place-items-center bg-base-100/60 backdrop-blur-[1px]"
      >
        <span class="loading loading-spinner loading-lg text-primary" />
      </div>

      <p v-if="error" class="p-4 text-sm text-error">
        {{ error.message }}
      </p>

      <table class="table table-zebra table-pin-rows min-w-[58rem] text-sm">
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
    </section>

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
