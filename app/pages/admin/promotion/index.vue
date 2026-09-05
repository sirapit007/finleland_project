<template>
  <div class="admin-table-page">
    <TablePanel
      :notice="statusError"
      title="โปรโมชั่นสินค้า"
      v-model:q="q"
      v-model:page="page"
      v-model:page-size="pageSize"
      :data="data"
      :pending="pending"
      search-placeholder="ค้นหาชื่อโปรโมชั่น หรือคำค้นหาอื่นๆ..."
      @refresh="refresh"
    >
      <template #actions
        ><button
          class="admin-table-create"
          type="button"
          @click="promotionFormModal?.onCreate()"
        >
          <Icon name="lucide:circle-plus" size="16" />
          เพิ่มโปรโมชั่น
        </button></template
      >

      <table class="admin-data-table">
        <thead class="text-xs">
          <tr>
            <th scope="col">#</th>
            <th scope="col">รูปภาพ</th>
            <th scope="col">ชื่อโปรโมชั่น</th>
            <th scope="col">รายละเอียด</th>
            <th scope="col">วันที่เริ่มต้น</th>
            <th scope="col">วันที่สิ้นสุด</th>
            <th scope="col">ราคาหลังส่วนลด</th>
            <th scope="col">จำนวนขั้นต่ำ</th>
            <th scope="col">ยอดซื้อขั้นต่ำ</th>
            <th scope="col">ราคาชุดโปรโมชั่น</th>
            <th scope="col">เปิดใช้งาน</th>
            <th scope="col">สร้างโดย / เมื่อ</th>
            <th scope="col">แก้ไขโดย / เมื่อ</th>
            <th scope="col" class="admin-table-actions">ดำเนินการ</th>
          </tr>
        </thead>
        <tbody>
          <SkeletonTableRows v-if="pending" :columns="14" :image-column="1" />
          <TableStateRow
            v-else-if="error || !data?.rows?.length"
            :columns="14"
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
            <td>
              <div
                v-if="row.image_url"
                class="h-12 w-12 cursor-pointer"
                @click="imagePreviewModal?.onOpen(row.image_url)"
              >
                <img :src="row.image_url" class="h-full w-full object-cover" />
              </div>
              <div v-else class="h-12 w-12 cursor-not-allowed">
                <img
                  src="@/assets/images/blank.png"
                  class="h-full w-full object-cover"
                />
              </div>
            </td>
            <td>{{ row.promotion_name }}</td>
            <td>{{ row.promotion_description }}</td>
            <td>
              {{ dayjs(row.promotion_start_date).format("YYYY-MM-DD") }}
            </td>
            <td>{{ dayjs(row.promotion_end_date).format("YYYY-MM-DD") }}</td>
            <td>{{ row.promotion_discounted_price }}</td>
            <td>{{ row.promotion_min_quantity }}</td>
            <td>{{ row.promotion_min_purchase_amount }}</td>
            <td>{{ row.promotion_bundle_price }}</td>
            <td>
              <TableToggle
                :model-value="!!row.promotion_is_active"
                :label="'สถานะ ' + row.promotion_name"
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
            <td class="admin-table-actions">
              <TableAction
                label="แก้ไข"
                icon="lucide:square-pen"
                tone="primary"
                @click="promotionFormModal?.onEdit(row)"
              />
              <TableAction
                label="ลบ"
                icon="lucide:trash-2"
                tone="danger"
                @click="removeConfirmModal?.onRemove(row, '/api/promotion')"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </TablePanel>
  </div>

  <ModalImagePreview ref="imagePreviewModal" />

  <PromotionFormModal ref="promotionFormModal" @changed="onRefresh" />

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

type ImagePreviewExpose = {
  onOpen: (src: string) => void;
};

type PromotionRow = {
  [key: string]: unknown;
  uuid?: string;
  promotion_is_active?: boolean;
};

type PromotionFormModalExpose = {
  onCreate: () => Promise<void>;
  onEdit: (row: PromotionRow) => Promise<void>;
};

const promotionFormModal = ref<PromotionFormModalExpose | null>(null);

const removeConfirmModal = ref<RemoveConfirmExpose | null>(null);
const imagePreviewModal = ref<ImagePreviewExpose | null>(null);

const dayjs = useDayjs();

const page = ref(1);
const pageSize = ref(10);
const q = ref("");

const { data, pending, error, refresh } = await useFetch("/api/promotion", {
  server: false,
  query: {
    page,
    pageSize,
    q,
  },
  watch: [page, pageSize, q],
});

const savingStatus = ref(new Set<string>());
const statusError = ref("");
const onUseActive = async (row: PromotionRow, active: boolean) => {
  if (!row.uuid || savingStatus.value.has(row.uuid)) return;
  const uuid = row.uuid;
  savingStatus.value.add(uuid);
  statusError.value = "";
  try {
    await $fetch("/api/promotion/" + uuid, {
      method: "put",
      body: { ...row, promotion_is_active: active },
    });
    row.promotion_is_active = active;
    await refresh();
  } catch {
    statusError.value = "บันทึกสถานะไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
  } finally {
    savingStatus.value.delete(uuid);
  }
};

const onRefresh = async () => {
  await refresh();
};
</script>
