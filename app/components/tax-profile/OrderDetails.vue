<template>
  <section v-if="detail" class="rounded-xl border border-primary/20 bg-primary/5 p-4">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <Icon name="lucide:receipt-text" size="18" class="text-primary" />
        <h3 class="font-semibold">ข้อมูลสำหรับออกใบกำกับภาษี</h3>
      </div>
      <span class="badge badge-sm" :class="statusMeta.badge">{{ statusMeta.label }}</span>
    </div>
    <p class="mt-3 text-sm font-semibold">{{ detail.order_taxpayer_name }}</p>
    <p class="mt-1 text-sm text-base-content/65">
      เลขประจำตัวผู้เสียภาษี {{ detail.order_taxpayer_id }}
      <template v-if="branchLabel"> · {{ branchLabel }}</template>
    </p>
    <p class="mt-1 text-sm leading-6 text-base-content/65">{{ addressLine }}</p>
    <p v-if="detail.order_taxpayer_phone" class="mt-1 text-sm text-base-content/65">{{ detail.order_taxpayer_phone }}</p>
    <p v-if="detail.order_taxpayer_email" class="mt-1 text-sm text-base-content/65">{{ detail.order_taxpayer_email }}</p>
    <p v-if="detail.order_tax_invoice_number" class="mt-2 text-xs font-semibold text-primary">เลขที่เอกสาร {{ detail.order_tax_invoice_number }}</p>
    <a v-if="detail.order_tax_document_url" :href="detail.order_tax_document_url" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-primary btn-xs mt-3">
      <Icon name="lucide:file-down" size="14" /> เปิดเอกสาร
    </a>
  </section>
</template>

<script setup lang="ts">
const props = defineProps<{ detail?: Record<string, any> | null }>();
const addressLine = computed(() => [props.detail?.order_taxpayer_address, props.detail?.order_taxpayer_subdistrict, props.detail?.order_taxpayer_district, props.detail?.order_taxpayer_province, props.detail?.order_taxpayer_postcode].map((value) => String(value || "").trim()).filter(Boolean).join(", "));
const branchLabel = computed(() => {
  if (props.detail?.order_taxpayer_type !== "company") return "";
  if (props.detail?.order_taxpayer_branch_type === "head_office") return "สำนักงานใหญ่";
  if (props.detail?.order_taxpayer_branch_type === "branch") return `สาขา ${props.detail?.order_taxpayer_branch_code || "-"}`;
  return "";
});
const statusMeta = computed(() => ({
  requested: { badge: "badge-warning", label: "ร้องขอแล้ว" },
  processing: { badge: "badge-info", label: "กำลังดำเนินการ" },
  issued: { badge: "badge-success", label: "ออกเอกสารแล้ว" },
  cancelled: { badge: "badge-error", label: "ยกเลิก" },
}[String(props.detail?.order_tax_status || "requested")] || { badge: "badge-ghost", label: "ไม่ระบุสถานะ" }));
</script>
