<template>
  <dialog ref="baseModal" class="modal">
    <div class="modal-box max-w-md">
      <form method="dialog">
        <button
          class="btn btn-circle btn-ghost btn-sm absolute right-3 top-3"
          :disabled="isSaving"
          aria-label="ปิดหน้าต่างเปลี่ยนสถานะ"
        >
          ×
        </button>
      </form>

      <h3 class="text-lg font-bold">เปลี่ยนสถานะคำสั่งซื้อ</h3>
      <div class="mt-4 space-y-3">
        <fieldset class="fieldset">
          <legend class="fieldset-legend">สถานะใหม่</legend>
          <select
            v-model="form.status"
            class="select select-sm w-full"
            :disabled="isSaving"
          >
            <option
              v-for="status in statusOptions"
              :key="status.value"
              :value="status.value"
            >
              {{ status.label }}
            </option>
          </select>
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">หมายเหตุ</legend>
          <textarea
            v-model.trim="form.note"
            class="textarea textarea-sm w-full"
            placeholder="ข้อความนี้จะแสดงในประวัติและแจ้งลูกค้าผ่าน LINE"
            :disabled="isSaving"
          />
        </fieldset>
      </div>

      <div class="modal-action">
        <button
          class="btn btn-sm flex-1"
          type="button"
          :disabled="isSaving"
          @click="baseModal?.close()"
        >
          ปิด
        </button>
        <button
          class="btn btn-primary btn-sm flex-1"
          type="button"
          :disabled="!form.status || isSaving"
          @click="changeStatus"
        >
          <span v-if="isSaving" class="loading loading-spinner loading-xs" />
          <template v-else>บันทึกสถานะ</template>
        </button>
      </div>
    </div>
  </dialog>
</template>

<script setup lang="ts">
type Row = Record<string, any>;

type OrderDetail = {
  items: Row[];
  histories: Row[];
  adjustments: Row[];
  payments: Row[];
};

const props = defineProps<{
  order: Row;
  detail?: OrderDetail;
}>();

const baseModal = ref<HTMLDialogElement | null>(null);
const isSaving = ref(false);
const { showToast } = useToast();
const form = reactive({ status: "", note: "" });

const statusOptions = [
  { value: "confirmed", label: "ยืนยันคำสั่งซื้อ" },
  { value: "processing", label: "กำลังเตรียมสินค้า" },
  { value: "ready_for_pickup", label: "พร้อมรับสินค้า" },
  { value: "shipped", label: "กำลังจัดส่ง" },
  { value: "completed", label: "ปิดงานสำเร็จ" },
  { value: "canceled", label: "ยกเลิก" },
];

const reloadOrder = async () => {
  const orderUuid = String(props.order.uuid || "");
  if (!orderUuid) return;

  const [items, histories, adjustments, payments]: any = await Promise.all([
    $fetch("/api/order/items", {
      params: { order_item_order: orderUuid, pageSize: 100 },
    }),
    $fetch("/api/order/status-histories", {
      params: { order_status_history_order: orderUuid, pageSize: 100 },
    }),
    $fetch("/api/order/item-adjustments", {
      params: { order_item_adjustment_order: orderUuid },
    }),
    $fetch("/api/order/payments", {
      params: { order_payment_order: orderUuid, pageSize: 100 },
    }),
  ]);

  if (props.detail) {
    Object.assign(props.detail, {
      items: items.rows || [],
      histories: histories.rows || [],
      adjustments: adjustments.rows || [],
      payments: payments.rows || [],
    });
  }

  await refreshNuxtData();
};

const open = () => {
  form.status =
    props.order.order_status === "pending"
      ? "confirmed"
      : props.order.order_status;
  form.note = "";
  baseModal.value?.showModal();
};

const changeStatus = async () => {
  if (!props.order.uuid || !form.status || isSaving.value) return;
  isSaving.value = true;

  try {
    const nextStatus = form.status;
    const response: any = await $fetch("/api/order/status-histories", {
      method: "POST",
      body: {
        order_status_history_order: props.order.uuid,
        order_status_history_status: nextStatus,
        order_status_history_note: form.note,
      },
    });

    props.order.order_status = nextStatus;
    baseModal.value?.close();
    showToast("เปลี่ยนสถานะคำสั่งซื้อแล้ว");

    if (response.lineNotification?.sent) {
      showToast("แจ้งสถานะให้ลูกค้าผ่าน LINE แล้ว");
    } else if (response.lineNotification?.reason) {
      showToast(
        `เปลี่ยนสถานะสำเร็จ แต่ไม่ส่ง LINE: ${response.lineNotification.reason}`,
        "warning",
      );
    }

    await reloadOrder();
  } catch (error: any) {
    showToast(
      error?.data?.statusMessage || "ไม่สามารถเปลี่ยนสถานะได้",
      "error",
    );
  } finally {
    isSaving.value = false;
  }
};

defineExpose({ open });
</script>
