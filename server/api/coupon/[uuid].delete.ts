import { assertCouponUuid, couponError } from "@@/server/utils/couponRules";
import { requireCurrentAdmin } from "@@/server/utils/session";
import { couponTransaction } from "@@/server/utils/couponApi";
import { lockCoupon } from "@@/server/utils/coupons";
export default defineEventHandler(async (event) => {
  const admin = await requireCurrentAdmin(event),
    uuid = assertCouponUuid(getRouterParam(event, "uuid"));
  return couponTransaction(async (client) => {
    const coupon = await lockCoupon(client, uuid);
    if (coupon.coupon_status !== "draft")
      couponError("ลบได้เฉพาะคูปองฉบับร่างที่ยังไม่แจก", 409);
    if (Number(coupon.coupon_issued_count) > 0)
      couponError("คูปองที่แจกแล้วไม่สามารถลบได้ กรุณาหยุดแจกเพิ่มแทน", 409);
    const result = await client.query(
      "UPDATE tb_event_coupons SET deleted_by=$2,deleted_at=NOW(),updated_by=$2,updated_at=NOW() WHERE uuid=$1 RETURNING *",
      [uuid, admin.uuid],
    );
    return { row: result.rows[0] };
  });
});
