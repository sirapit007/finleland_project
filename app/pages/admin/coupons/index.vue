<template>
  <div class="admin-table-page">
    <TablePanel
      title="คูปองส่วนลด"
      v-model:q="q"
      v-model:page="page"
      v-model:page-size="pageSize"
      :data="data"
      :pending="pending"
      search-placeholder="ค้นหาชื่อหรือรายละเอียดคูปอง..."
      @refresh="refresh"
    >
      <template #actions
        ><button
          type="button"
          class="admin-table-create"
          @click="formModal?.onCreate()"
        >
          <Icon name="lucide:circle-plus" size="16" />เพิ่มคูปอง
        </button></template
      >
      <template #filters
        ><select
          v-model="status"
          class="admin-table-select"
          aria-label="กรองสถานะคูปอง"
          :disabled="pending"
        >
          <option value="">ทุกสถานะ</option>
          <option
            v-for="(label, value) in couponStatusLabels"
            :key="value"
            :value="value"
          >
            {{ label }}
          </option>
        </select></template
      >
      <table class="admin-data-table">
        <thead class="text-xs">
          <tr>
            <th scope="col">#</th>
            <th scope="col">คูปอง</th>
            <th scope="col">ส่วนลด / เงื่อนไข</th>
            <th scope="col">วิธีรับ / สถานะ</th>
            <th scope="col">ผู้รับ / การใช้</th>
            <th scope="col">วันหมดอายุ</th>
            <th scope="col">สร้างโดย / เมื่อ</th>
            <th scope="col">แก้ไขโดย / เมื่อ</th>
            <th scope="col" class="admin-table-actions">ดำเนินการ</th>
          </tr>
        </thead>
        <tbody>
          <SkeletonTableRows v-if="pending" :columns="9" />
          <TableStateRow
            v-else-if="error || !data?.rows?.length"
            :columns="9"
            :error="!!error"
            :filtered="!!q || !!status"
            @retry="refresh"
          />
          <tr
            v-for="row in pending || error ? [] : data?.rows || []"
            :key="row.uuid"
            class="hover:bg-primary/5"
          >
            <td>{{ row.id }}</td>
            <td>
              <button
                type="button"
                class="text-left font-semibold text-primary hover:underline"
                @click="detailModal?.onOpen(row)"
              >
                {{ row.coupon_name }}
              </button>
              <p
                v-if="row.coupon_description"
                class="admin-cell-meta mt-1 max-w-64 truncate"
                :title="row.coupon_description"
              >
                {{ row.coupon_description }}
              </p>
            </td>
            <td>
              <p class="font-semibold">
                {{ couponDiscountLabel(row)
                }}<span
                  v-if="row.coupon_max_discount"
                  class="ml-1 text-xs font-normal"
                  >(สูงสุด {{ couponMoney(row.coupon_max_discount) }} บาท)</span
                >
              </p>
              <p class="admin-cell-meta mt-1">
                ยอดซื้อขั้นต่ำ
                {{ couponMoney(row.coupon_min_purchase_amount) }} บาท
              </p>
              <p
                v-if="
                  Number(row.coupon_min_quantity) ||
                  Number(row.coupon_min_items)
                "
                class="admin-cell-meta"
              >
                ขั้นต่ำ {{ row.coupon_min_quantity }} ชิ้น /
                {{ row.coupon_min_items }} รายการ
              </p>
            </td>
            <td>
              <p class="text-xs">
                {{ couponDistributionLabels[row.coupon_distribution_method] }}
              </p>
              <span
                class="badge badge-sm badge-soft mt-2"
                :class="
                  row.coupon_status === 'active'
                    ? 'badge-success'
                    : row.coupon_status === 'paused'
                      ? 'badge-warning'
                      : 'badge-neutral'
                "
                >{{ couponStatusLabels[row.coupon_status] }}</span
              >
            </td>
            <td>
              <button
                type="button"
                class="text-left text-primary hover:underline"
                @click="detailModal?.onOpen(row)"
              >
                {{ couponMoney(row.coupon_issued_count) }} /
                {{ couponMoney(row.coupon_recipient_limit) }} คน
              </button>
              <p class="admin-cell-meta mt-1">
                ใช้แล้ว {{ couponMoney(row.coupon_usage_count) }} ครั้ง
              </p>
              <p class="admin-cell-meta">
                คนละ {{ row.coupon_usage_limit }} ครั้ง
              </p>
            </td>
            <td>
              <span :class="isExpired(row) ? 'text-error' : ''">{{
                row.coupon_expires_at
                  ? couponDate(row.coupon_expires_at)
                  : "ไม่มีวันหมดอายุ"
              }}</span>
              <p v-if="isExpired(row)" class="mt-1 text-xs text-error">
                หมดอายุแล้ว
              </p>
            </td>
            <td>
              <p>{{ row.created_username || row.created_by || "ระบบ" }}</p>
              <p class="admin-cell-meta">{{ couponDate(row.created_at) }}</p>
            </td>
            <td>
              <p>{{ row.updated_username || row.updated_by || "—" }}</p>
              <p class="admin-cell-meta">{{ couponDate(row.updated_at) }}</p>
            </td>
            <td class="admin-table-actions">
              <TableAction
                label="ผู้รับ ประวัติ และแจกคูปอง"
                icon="lucide:users-round"
                tone="success"
                @click="detailModal?.onOpen(row)"
              />
              <TableAction
                label="แก้ไขคูปอง"
                icon="lucide:square-pen"
                @click="formModal?.onEdit(row)"
              />
              <TableAction
                :label="
                  canDelete(row)
                    ? 'ลบคูปองฉบับร่าง'
                    : 'ลบได้เฉพาะฉบับร่างที่ยังไม่มีผู้รับ หากต้องการหยุดแจกให้แก้ไขสถานะ'
                "
                icon="lucide:trash-2"
                tone="danger"
                :disabled="!canDelete(row)"
                @click="requestRemove(row)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </TablePanel>
    <p class="mt-3 text-xs leading-5 text-base-content/55">
      “หยุดแจก” จะหยุดรับคูปองเพิ่ม
      ผู้ที่ได้รับแล้วใช้สิทธิ์เดิมได้จนกว่าจะหมดอายุหรือใช้ครบจำนวนครั้ง
    </p>
  </div>
  <CouponAdminFormModal ref="formModal" @changed="refresh" />
  <CouponAdminDetailModal ref="detailModal" @changed="refresh" />
  <ModalRemoveConfirm ref="removeModal" @removed="afterRemove" />
</template>

<script setup lang="ts">
import {
  couponMoney,
  couponDate,
  couponDiscountLabel,
  couponDistributionLabels,
  couponStatusLabels,
  type AdminCouponRow,
} from "~/utils/adminCoupon";
definePageMeta({ layout: "admin" });
type CouponList = {
  rows: AdminCouponRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
const formModal = ref<{
  onCreate: () => void;
  onEdit: (row: AdminCouponRow) => Promise<void>;
} | null>(null);
const detailModal = ref<{
  onOpen: (row: AdminCouponRow) => Promise<void>;
} | null>(null);
const removeModal = ref<{
  onRemove: (row: Record<string, unknown>, path: string) => Promise<void>;
} | null>(null);
const page = ref(1);
const pageSize = ref(10);
const q = ref("");
const status = ref("");
const { data, pending, error, refresh } = await useFetch<CouponList>(
  "/api/coupon",
  {
    server: false,
    query: { page, pageSize, q, status },
    watch: [page, pageSize, q, status],
  },
);
const isExpired = (row: AdminCouponRow) =>
  Boolean(
    row.coupon_expires_at &&
    new Date(row.coupon_expires_at).getTime() <= Date.now(),
  );
const canDelete = (row: AdminCouponRow) =>
  row.coupon_status === "draft" && Number(row.coupon_issued_count || 0) === 0;
function requestRemove(row: AdminCouponRow) {
  if (!canDelete(row)) return;
  void removeModal.value?.onRemove(
    { ...row, promotion_name: row.coupon_name },
    "/api/coupon",
  );
}
async function afterRemove() {
  if (data.value?.rows.length === 1 && page.value > 1) page.value -= 1;
  else await refresh();
}
watch(status, () => {
  page.value = 1;
});
</script>
