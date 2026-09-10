import { requireCurrentAdmin } from "@@/server/utils/session";
import { couponTransaction } from "@@/server/utils/couponApi";
import { lockCoupon } from "@@/server/utils/coupons";
import {
  assertCouponUuid,
  couponEditableFields,
  normalizeCouponInput,
} from "@@/server/utils/couponRules";
export default defineEventHandler(async (event) => {
  const admin = await requireCurrentAdmin(event),
    uuid = assertCouponUuid(getRouterParam(event, "uuid"));
  const body = await readBody(event);
  return couponTransaction(async (client) => {
    const current = await lockCoupon(client, uuid),
      input = normalizeCouponInput(body, current);
    const values = couponEditableFields.map((key) => input[key]);
    values.push(admin.uuid, uuid);
    const result = await client.query(
      `UPDATE tb_event_coupons SET ${couponEditableFields.map((field, i) => `${field}=$${i + 1}`).join(",")},
      coupon_activated_at=CASE WHEN $12::varchar <> 'draft' THEN COALESCE(coupon_activated_at,clock_timestamp()) ELSE coupon_activated_at END,
      updated_by=$${values.length - 1},updated_at=NOW() WHERE uuid=$${values.length} RETURNING *`,
      values,
    );
    return { row: result.rows[0] };
  });
});
