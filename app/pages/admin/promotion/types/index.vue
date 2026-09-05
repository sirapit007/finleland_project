<template>
  <div class="admin-table-page">
    <TablePanel
      :notice="statusError"
      title="จัดการประเภทโปรโมชั่น"
      v-model:q="q"
      v-model:page="page"
      v-model:page-size="pageSize"
      :data="data"
      :pending="pending"
      search-placeholder="ค้นหาชื่อประเภทโปรโมชั่น หรือคำค้นหา..."
      @refresh="refresh"
    >
      <table class="admin-data-table">
        <thead class="text-xs">
          <tr>
            <th scope="col">#</th>
            <th scope="col">รหัส</th>
            <th scope="col">ชื่อประเภทโปรโมชั่น</th>
            <th scope="col">รายละเอียด</th>
            <th scope="col">เปิดใช้งาน</th>
            <th scope="col">สร้างโดย / เมื่อ</th>
            <th scope="col">แก้ไขโดย / เมื่อ</th>
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
            <td>{{ row.promotion_type_code }}</td>
            <td>{{ row.promotion_type_name }}</td>
            <td>{{ row.promotion_type_description }}</td>
            <td>
              <TableToggle
                :model-value="!!row.promotion_type_is_active"
                :label="'สถานะ ' + row.promotion_type_name"
                :pending="savingStatus.has(row.uuid)"
                @update:model-value="onUseActive(row, $event)"
              />
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
          </tr>
        </tbody>
      </table>
    </TablePanel>
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

const savingStatus = ref(new Set<string>());
const statusError = ref("");
const onUseActive = async (row: any, active: boolean) => {
  if (!row.uuid || savingStatus.value.has(row.uuid)) return;
  const uuid = row.uuid;
  savingStatus.value.add(uuid);
  statusError.value = "";
  try {
    await $fetch("/api/promotion/types/" + uuid, {
      method: "put",
      body: { ...row, promotion_type_is_active: active },
    });
    row.promotion_type_is_active = active;
    await refresh();
  } catch {
    statusError.value = "บันทึกสถานะไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
  } finally {
    savingStatus.value.delete(uuid);
  }
};
</script>
