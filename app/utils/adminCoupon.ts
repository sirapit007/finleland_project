export type AdminCouponRow = {
  [key: string]: unknown;
  id?: number;
  uuid?: string;
  coupon_name: string;
  coupon_description: string | null;
  coupon_discount_type: "amount" | "percent";
  coupon_discount_value: number | string;
  coupon_max_discount: number | string | null;
  coupon_min_purchase_amount: number | string;
  coupon_min_quantity: number | string;
  coupon_min_items: number | string;
  coupon_usage_limit: number | string;
  coupon_recipient_limit: number | string;
  coupon_distribution_method: "signup" | "random" | "manual" | "claim";
  coupon_status: "draft" | "active" | "paused";
  coupon_expires_at: string | null;
  coupon_issued_count?: number | string;
  coupon_usage_count?: number | string;
  created_by?: string | null;
  created_username?: string | null;
  created_at?: string | null;
  updated_by?: string | null;
  updated_username?: string | null;
  updated_at?: string | null;
};

export const couponDistributionLabels = {
  signup: "สมาชิกใหม่",
  random: "สุ่มแจกโดยผู้ดูแล",
  manual: "ผู้ดูแลเลือกผู้รับ",
  claim: "ผู้ใช้กดรับเอง",
};

export const couponStatusLabels = {
  draft: "ฉบับร่าง",
  active: "เปิดแจก",
  paused: "หยุดแจก",
};

export function couponMoney(value: unknown) {
  return new Intl.NumberFormat("th-TH", {
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

export function couponDiscountLabel(row: AdminCouponRow) {
  return row.coupon_discount_type === "percent"
    ? `${couponMoney(row.coupon_discount_value)}%`
    : `${couponMoney(row.coupon_discount_value)} บาท`;
}

export function couponDate(value: unknown) {
  if (!value) return "—";
  const date = new Date(String(value));
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(date);
}

export function couponError(error: unknown, fallback: string) {
  const fetchError = error as {
    data?: {
      statusMessage?: string;
      message?: string;
      data?: { message?: string };
    };
  };
  return (
    fetchError.data?.data?.message ||
    fetchError.data?.message ||
    fetchError.data?.statusMessage ||
    fallback
  );
}
