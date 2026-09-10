import { assertCouponUuid, couponError } from "@@/server/utils/couponRules";
import { randomInt } from "node:crypto";
import { requireCurrentAdmin } from "@@/server/utils/session";
import { couponTransaction } from "@@/server/utils/couponApi";
import {
  lockCoupon,
  grantCoupon,
  assertCouponDistributable,
} from "@@/server/utils/coupons";
export default defineEventHandler(async (event) => {
  const admin = await requireCurrentAdmin(event),
    uuid = assertCouponUuid(getRouterParam(event, "uuid"));
  const body = await readBody(event);
  return couponTransaction(async (client) => {
    const coupon = await lockCoupon(client, uuid),
      method = String(coupon.coupon_distribution_method);
    if (!["manual", "random"].includes(method))
      couponError("คูปองนี้ไม่ใช้วิธีแจกโดย admin", 409);
    assertCouponDistributable(coupon, method);
    let recipients: string[] = [];
    if (method === "manual") {
      if (
        !Array.isArray(body?.userUuids) ||
        !body.userUuids.length ||
        body.userUuids.length > 500
      )
        couponError("กรุณาเลือกผู้รับ 1–500 คนต่อครั้ง");
      recipients = [...new Set<string>(body.userUuids.map(assertCouponUuid))];
    } else {
      const count = Number(body?.count);
      if (!Number.isInteger(count) || count < 1 || count > 500)
        couponError("กรุณาระบุจำนวนสุ่มแจก 1–500 คนต่อครั้ง");
      if (
        count >
        Number(coupon.coupon_recipient_limit) -
          Number(coupon.coupon_issued_count)
      )
        couponError("จำนวนที่ต้องการแจกมากกว่าสิทธิ์ที่เหลือ", 409);
      const eligible = await client.query(
        `SELECT u.uuid FROM tb_users u WHERE u.role='User' AND u.deleted_at IS NULL
        AND NOT EXISTS (SELECT 1 FROM tb_user_coupons h WHERE h.user_coupon_user=u.uuid AND h.user_coupon_coupon=$1) ORDER BY u.id`,
        [uuid],
      );
      const pool = eligible.rows.map((row) => String(row.uuid));
      // Uniform selection without replacement; use the server's secure random source.
      for (let i = 0; i < Math.min(count, pool.length); i++) {
        const index = randomInt(i, pool.length);
        [pool[i], pool[index]] = [pool[index]!, pool[i]!];
        recipients.push(pool[i]!);
      }
      if (!recipients.length)
        couponError("ไม่มีสมาชิกที่ยังไม่ได้รับคูปองนี้", 409);
    }
    const rows = [];
    for (const userUuid of recipients) {
      const result = await grantCoupon(
        client,
        uuid,
        userUuid,
        method,
        admin.uuid,
      );
      if (!result.alreadyClaimed) rows.push(result.row);
    }
    return { rows, count: rows.length };
  });
});
