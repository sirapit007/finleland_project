import { requireCurrentAdmin } from "@@/server/utils/session";
import { couponTransaction } from "@@/server/utils/couponApi";
import {
  couponEditableFields,
  normalizeCouponInput,
} from "@@/server/utils/couponRules";
export default defineEventHandler(async (event) => {
  const admin = await requireCurrentAdmin(event);
  const input = normalizeCouponInput(await readBody(event));
  return couponTransaction(async (client) => {
    const fields = [
      ...couponEditableFields,
      "coupon_activated_at",
      "created_by",
    ];
    const values = [
      ...couponEditableFields.map((key) => input[key]),
      input.coupon_status === "draft" ? null : new Date().toISOString(),
      admin.uuid,
    ];
    const result = await client.query(
      `INSERT INTO tb_event_coupons (${fields.join(",")}) VALUES (${values.map((_, i) => `$${i + 1}`).join(",")}) RETURNING *`,
      values,
    );
    return { row: result.rows[0] };
  });
});
