<template>
  <div class="min-h-full p-4 pb-6">
    <div class="rounded-2xl border border-base-300 bg-base-100 shadow-sm">
      <div class="flex justify-between gap-3 md:flex-row md:items-center m-3">
        <div class="space-x-3 flex flex-col items-start">
          <span class="font-bold sm:text-lg text-base text-primary"
            >Event Promotion</span
          ><span class="font-semibold sm:text-base text-sm text-secondary"
            >โปรโมชั่นสินค้า</span
          >
        </div>
        <button
          class="flex-none btn btn-xs shadow-sm sm:btn-sm btn-primary"
          @click="promotionFormModal?.onCreate()"
        >
          <Icon name="lucide:plus" size="16" />
          เพิ่มโปรโมชั่น
        </button>
      </div>

      <div class="flex flex-wrap items-center lg:p-3 sm:p-2 p-1">
        <TableResultSummary :page="page" :page-size="pageSize" :data="data" />
        <TableSearch
          v-model="q"
          placeholder="ค้นหาชื่อโปรโมชั่น หรือคำค้นหาอื่นๆ..."
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
              <td>รูปภาพ</td>
              <td>ชื่อโปรโมชั่น</td>
              <td>รายละเอียด</td>
              <td>วันที่เริ่มต้น</td>
              <td>วันที่สิ้นสุด</td>
              <td>ราคาหลังส่วนลด</td>
              <td>จำนวนขั้นต่ำ</td>
              <td>ยอดซื้อขั้นต่ำ</td>
              <td>ราคาชุดโปรโมชั่น</td>
              <td>เปิดใช้งาน</td>
              <td>สร้างโดย / เมื่อ</td>
              <td>แก้ไขโดย / เมื่อ</td>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <SkeletonTableRows v-if="pending" :columns="14" :image-column="1" />
            <tr
              v-else
              v-for="row in data?.rows"
              :key="row.id"
              class="hover:bg-primary/5"
              :class="!row.promotion_is_active ? 'opacity-50' : ''"
            >
              <td>{{ row.id }}</td>
              <td>
                <div
                  v-if="row.image_url"
                  class="h-12 w-12 cursor-pointer"
                  @click="imagePreviewModal?.onOpen(row.image_url)"
                >
                  <img
                    :src="row.image_url"
                    class="h-full w-full object-cover"
                  />
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
                <input
                  type="checkbox"
                  class="checkbox checkbox-accent"
                  v-model="row.promotion_is_active"
                  @click="onUseActive(row)"
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
              <th class="text-end">
                <button
                  class="btn btn-xs btn-link"
                  @click="promotionFormModal?.onEdit(row)"
                >
                  แก้ไข
                </button>
                <button
                  class="btn btn-xs btn-link btn-error no-underline"
                  @click="removeConfirmModal?.onRemove(row, '/api/promotion')"
                >
                  ลบ
                </button>
              </th>
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

const onUseActive = async (row: PromotionRow) => {
  const path = `/api/promotion/${row.uuid}`;

  const response = await $fetch(path, {
    method: "put",
    body: {
      ...row,
      promotion_is_active: row.promotion_is_active ? false : true,
    },
  });

  if (response) {
    onRefresh();
  }
};

const onRefresh = async () => {
  await refresh();
};
</script>
