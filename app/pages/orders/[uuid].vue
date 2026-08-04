<template>
  <div
    class="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10"
  >
    <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <div class="badge badge-sm badge-soft badge-primary mb-3 py-3">
          <NuxtLink to="/">หน้าแรก</NuxtLink>
          <Icon name="lucide:chevron-right" size="15" />
          <NuxtLink to="/orders">คำสั่งซื้อของฉัน</NuxtLink>
          <Icon name="lucide:chevron-right" size="15" />
          <span class="text-base-content">{{
            order?.order_number || "ชำระเงิน"
          }}</span>
        </div>
        <h1 class="text-3xl font-bold sm:text-4xl">ชำระเงินคำสั่งซื้อ</h1>
      </div>
      <NuxtLink
        v-if="order?.uuid"
        :to="`/orders/${order.uuid}/invoice`"
        target="_blank"
        class="btn btn-outline btn-sm"
      >
        <Icon name="lucide:receipt-text" size="16" /> พิมพ์เอกสาร
      </NuxtLink>
    </div>

    <div v-if="status === 'pending'" class="space-y-5">
      <SkeletonOrderDetail />
      <SkeletonOrderDetail />
    </div>

    <div v-else-if="error || !order" class="alert alert-error">
      <Icon name="lucide:circle-alert" size="20" />
      <span>{{ loadErrorMessage }}</span>
    </div>

    <template v-else>
      <div
        class="mb-5 flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <p class="font-mono font-bold text-primary">
            {{ order.order_number }}
          </p>
          <p class="mt-1 text-xs text-base-content/55">
            สร้างเมื่อ
            {{ formatDate(order.order_placed_at || order.created_at) }}
          </p>
        </div>
        <div class="flex items-center gap-3 sm:text-right">
          <div>
            <p class="text-xs text-base-content/55">สถานะการชำระเงิน</p>
            <span
              class="badge badge-sm mt-1 font-semibold"
              :class="paymentStatusMeta?.badge"
            >
              {{ paymentStatusMeta?.label }}
            </span>
          </div>
          <div>
            <p class="text-xs text-base-content/55">ยอดชำระ</p>
            <p class="text-2xl font-bold text-primary">
              ฿{{ formatMoney(order.order_grand_total) }}
            </p>
          </div>
        </div>
      </div>

      <div
        v-if="resultMessage"
        role="alert"
        class="alert mb-5 text-sm"
        :class="
          resultType === 'success'
            ? 'alert-success'
            : resultType === 'warning'
              ? 'alert-warning'
              : 'alert-error'
        "
      >
        <Icon
          :name="
            resultType === 'success'
              ? 'lucide:circle-check'
              : 'lucide:circle-alert'
          "
          size="18"
        />
        <span>{{ resultMessage }}</span>
      </div>

      <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div class="space-y-6">
          <section
            v-if="order.order_payment_status !== 'paid'"
            class="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm sm:p-6"
          >
            <div class="flex items-start gap-3">
              <div
                class="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
              >
                <Icon name="lucide:scan-qr-code" size="21" />
              </div>
              <div>
                <h2 class="text-lg font-bold">1. สแกน QR เพื่อชำระเงิน</h2>
                <p class="mt-1 text-sm text-base-content/60">
                  กรุณาตรวจชื่อผู้รับและโอนให้ตรงกับยอดของคำสั่งซื้อนี้
                </p>
              </div>
            </div>

            <div
              v-if="merchant.qrUrl"
              class="mx-auto mt-5 max-w-sm rounded-2xl border border-base-300 bg-white p-5 text-center text-slate-900"
            >
              <img
                :src="merchant.qrUrl"
                alt="Merchant QR สำหรับชำระเงิน"
                class="mx-auto aspect-square w-full max-w-72 object-contain"
              />
              <p class="mt-4 font-bold">{{ merchant.name }}</p>
              <p v-if="merchant.bank" class="mt-1 text-sm text-slate-600">
                {{ merchant.bank }}
              </p>
              <p v-if="merchant.account" class="mt-1 text-sm text-slate-600">
                {{ merchant.account }}
              </p>
              <div class="mt-4 rounded-xl bg-blue-50 px-4 py-3">
                <p class="text-xs text-slate-500">ยอดที่ต้องโอน</p>
                <p class="text-3xl font-bold text-blue-700">
                  ฿{{ formatMoney(order.order_grand_total) }}
                </p>
              </div>
              <button
                type="button"
                class="btn btn-ghost btn-xs mt-2"
                @click="copyAmount"
              >
                <Icon name="lucide:copy" size="13" /> คัดลอกยอดเงิน
              </button>
            </div>

            <div v-else role="alert" class="alert alert-warning mt-5 text-sm">
              <Icon name="lucide:triangle-alert" size="18" />
              <span>
                ร้านค้ายังไม่ได้ตั้งค่า Merchant QR
                กรุณาติดต่อร้านค้าก่อนชำระเงิน
              </span>
            </div>
          </section>

          <section
            v-if="canUploadSlip"
            class="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm sm:p-6"
          >
            <div class="flex items-start gap-3">
              <div
                class="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-secondary"
              >
                <Icon name="lucide:image-up" size="21" />
              </div>
              <div>
                <h2 class="text-lg font-bold">2. แนบสลิปเพื่อยืนยัน</h2>
                <p class="mt-1 text-sm text-base-content/60">
                  ระบบจะตรวจยอด บัญชีผู้รับ และเลขอ้างอิงผ่าน SlipOK
                </p>
              </div>
            </div>

            <label
              class="group mt-5 block cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-primary/30 bg-base-200/40 transition hover:border-primary"
              :class="{ 'pointer-events-none opacity-60': isUploading }"
            >
              <input
                ref="fileInput"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                class="hidden"
                @change="selectSlip"
              />
              <div
                v-if="!previewUrl"
                class="flex min-h-52 flex-col items-center justify-center p-6 text-center"
              >
                <Icon
                  name="lucide:upload-cloud"
                  size="38"
                  class="text-primary"
                />
                <p class="mt-3 font-semibold">คลิกเพื่อเลือกไฟล์สลิป</p>
                <p class="mt-1 text-xs text-base-content/50">
                  JPG, PNG หรือ WEBP ขนาดไม่เกิน {{ merchant.maxSlipMb }} MB
                </p>
              </div>
              <img
                v-else
                :src="previewUrl"
                alt="ตัวอย่างสลิปที่เลือก"
                class="mx-auto max-h-96 w-full object-contain p-3"
              />
            </label>

            <p v-if="uploadError" class="mt-3 text-sm text-error">
              {{ uploadError }}
            </p>
            <div class="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                class="btn btn-ghost btn-sm"
                :disabled="!selectedFile || isUploading"
                @click="clearSelectedSlip"
              >
                ล้างไฟล์
              </button>
              <button
                type="button"
                class="btn btn-primary btn-sm"
                :disabled="!selectedFile || isUploading"
                @click="uploadSlip"
              >
                <span
                  v-if="isUploading"
                  class="loading loading-spinner loading-xs"
                />
                <template v-else>
                  <Icon name="lucide:shield-check" size="16" /> ตรวจสอบสลิป
                </template>
              </button>
            </div>
          </section>

          <section
            v-if="order.order_payment_status === 'paid'"
            class="rounded-2xl border border-success/30 bg-success/10 p-8 text-center"
          >
            <Icon
              name="lucide:badge-check"
              size="54"
              class="mx-auto text-success"
            />
            <h2 class="mt-4 text-xl font-bold">ชำระเงินเรียบร้อยแล้ว</h2>
            <p class="mt-2 text-sm text-base-content/65">
              ร้านค้าได้รับข้อมูลการชำระเงินและจะดำเนินการคำสั่งซื้อต่อไป
            </p>
          </section>

          <section class="rounded-2xl border border-base-300 bg-base-100 p-4">
            <h2 class="mb-3 font-bold">รายการสินค้า</h2>
            <div class="divide-y divide-base-300">
              <div
                v-for="item in items"
                :key="item.uuid"
                class="flex items-center justify-between gap-4 py-3 text-sm"
              >
                <div class="min-w-0">
                  <p class="font-semibold">
                    {{ item.order_item_product_name }}
                  </p>
                  <p class="mt-1 text-xs text-base-content/50">
                    {{ item.order_item_product_code }} ·
                    {{ item.order_item_quantity }} ชิ้น
                  </p>
                </div>
                <p class="shrink-0 font-bold text-primary">
                  ฿{{ formatMoney(item.order_item_total) }}
                </p>
              </div>
            </div>
          </section>
        </div>

        <div class="space-y-5 lg:sticky lg:top-24">
          <OrderSummary
            :order="order"
            :total-quantity="totalQuantity"
            :tax-detail="order.order_tax_detail"
          />
          <OrderPaymentDetails :payment="latestPayment" />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
type Row = Record<string, any>;
type OrderPaymentPageData = {
  order: Row;
  items: Row[];
  payments: Row[];
};

const route = useRoute();
const requestFetch = useRequestFetch();
const runtimeConfig = useRuntimeConfig();
const orderUuid = computed(() => String(route.params.uuid || "").trim());

const { data, status, error, refresh } =
  await useAsyncData<OrderPaymentPageData>(
    () => `order-payment-page-${orderUuid.value}`,
    async () => {
      const [orderResponse, itemResponse, paymentResponse] = await Promise.all([
        requestFetch<{ row: Row | null }>(`/api/order/${orderUuid.value}`),
        requestFetch<{ rows: Row[] }>("/api/order/items", {
          query: {
            order_item_order: orderUuid.value,
            pageSize: 100,
            orderBy: "base.id ASC",
          },
        }),
        requestFetch<{ rows: Row[] }>("/api/order/payments", {
          query: {
            order_payment_order: orderUuid.value,
            pageSize: 100,
          },
        }),
      ]);
      if (!orderResponse.row) {
        throw createError({
          statusCode: 404,
          statusMessage: "ไม่พบคำสั่งซื้อ หรือคุณไม่มีสิทธิ์เข้าถึง",
        });
      }
      return {
        order: orderResponse.row,
        items: itemResponse.rows || [],
        payments: paymentResponse.rows || [],
      };
    },
  );

const order = computed(() => data.value?.order || null);
const items = computed(() => data.value?.items || []);
const payments = computed(() => data.value?.payments || []);
const latestPayment = computed(() => payments.value[0] || null);
const totalQuantity = computed(() =>
  items.value.reduce(
    (total, item) => total + Number(item.order_item_quantity || 0),
    0,
  ),
);
const publicConfig = runtimeConfig.public as Record<string, any>;
const merchant = computed(() => ({
  qrUrl: String(publicConfig.paymentMerchantQrUrl || "").trim(),
  name: String(publicConfig.paymentMerchantName || "ฟินส์แลนด์ พลาซ่า"),
  bank: String(publicConfig.paymentMerchantBank || "").trim(),
  account: String(publicConfig.paymentMerchantAccount || "").trim(),
  maxSlipMb: Math.max(Number(publicConfig.paymentSlipMaxMb || 5), 1),
}));

const paymentStatuses: Record<string, { badge: string; label: string }> = {
  unpaid: { badge: "badge-warning", label: "ยังไม่ชำระ" },
  pending: { badge: "badge-info", label: "รอตรวจสอบ" },
  paid: { badge: "badge-success", label: "ชำระแล้ว" },
  failed: { badge: "badge-error", label: "ตรวจไม่ผ่าน" },
  refunded: { badge: "badge-neutral", label: "คืนเงินแล้ว" },
};
const paymentStatusMeta = computed(
  () =>
    paymentStatuses[String(order.value?.order_payment_status || "unpaid")] ||
    paymentStatuses.unpaid,
);
const canUploadSlip = computed(
  () =>
    Boolean(merchant.value.qrUrl) &&
    !["paid", "refunded"].includes(
      String(order.value?.order_payment_status || ""),
    ) &&
    !["completed", "canceled"].includes(
      String(order.value?.order_status || ""),
    ),
);

const selectedFile = ref<File | null>(null);
const previewUrl = ref("");
const fileInput = ref<HTMLInputElement | null>(null);
const isUploading = ref(false);
const uploadError = ref("");
const resultMessage = ref("");
const resultType = ref<"success" | "warning" | "error">("success");

const revokePreview = () => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = "";
};
const clearSelectedSlip = () => {
  selectedFile.value = null;
  revokePreview();
  if (fileInput.value) fileInput.value.value = "";
};
const selectSlip = (event: Event) => {
  uploadError.value = "";
  const file = (event.target as HTMLInputElement).files?.[0] || null;
  if (!file) return;
  const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
  if (!allowedTypes.has(file.type)) {
    uploadError.value = "รองรับเฉพาะไฟล์ JPG, PNG และ WEBP";
    clearSelectedSlip();
    return;
  }
  if (file.size > merchant.value.maxSlipMb * 1_048_576) {
    uploadError.value = `ไฟล์ต้องมีขนาดไม่เกิน ${merchant.value.maxSlipMb} MB`;
    clearSelectedSlip();
    return;
  }
  revokePreview();
  selectedFile.value = file;
  previewUrl.value = URL.createObjectURL(file);
};

const uploadSlip = async () => {
  if (!selectedFile.value || !order.value?.uuid) return;
  uploadError.value = "";
  resultMessage.value = "";
  isUploading.value = true;
  try {
    const body = new FormData();
    body.append("orderUuid", order.value.uuid);
    body.append("file", selectedFile.value);
    const response: any = await $fetch("/api/order/payments", {
      method: "POST",
      body,
    });
    resultMessage.value = response.message || "รับข้อมูลการชำระเงินแล้ว";
    resultType.value =
      response.orderPaymentStatus === "paid"
        ? "success"
        : response.orderPaymentStatus === "pending"
          ? "warning"
          : "error";
    clearSelectedSlip();
    await refresh();
  } catch (uploadFailure: any) {
    uploadError.value =
      uploadFailure?.data?.statusMessage ||
      "ไม่สามารถอัปโหลดหรือตรวจสอบสลิปได้";
  } finally {
    isUploading.value = false;
  }
};

const copyAmount = async () => {
  if (!import.meta.client || !order.value) return;
  await navigator.clipboard.writeText(
    Number(order.value.order_grand_total || 0).toFixed(2),
  );
  resultType.value = "success";
  resultMessage.value = "คัดลอกยอดเงินแล้ว";
};

const loadErrorMessage = computed(
  () =>
    (error.value as any)?.data?.statusMessage ||
    (error.value as any)?.statusMessage ||
    "ไม่สามารถโหลดข้อมูลคำสั่งซื้อได้",
);
const formatMoney = (value: unknown) =>
  new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
const formatDate = (value: unknown) =>
  value
    ? new Intl.DateTimeFormat("th-TH", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(String(value)))
    : "-";

onBeforeUnmount(revokePreview);
</script>
