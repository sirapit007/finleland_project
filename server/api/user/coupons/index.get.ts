import { requireCurrentUser } from "@@/server/utils/session";
import { couponTransaction } from "@@/server/utils/couponApi";
import { getCouponBasket, evaluateOwnedCoupon } from "@@/server/utils/coupons";
import {
  evaluateCouponRules,
  couponEditableFields,
} from "@@/server/utils/couponRules";
export default defineEventHandler(async (event) => {
  const user = await requireCurrentUser(event);
  setHeader(event, "Cache-Control", "private, no-store");
  return couponTransaction(async (client) => {
    await client.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ");
    const basket = await getCouponBasket(client, user.uuid);
    const fields = ["uuid", ...couponEditableFields, "coupon_issued_count"]
      .map((field) => `c.${field}`)
      .join(",");
    const owned = await client.query(
      `SELECT ${fields},h.uuid AS user_coupon_uuid,h.user_coupon_used_count,h.user_coupon_granted_at,
      h.deleted_at AS user_coupon_deleted_at FROM tb_user_coupons h JOIN tb_event_coupons c ON c.uuid=h.user_coupon_coupon
      WHERE h.user_coupon_user=$1 AND c.deleted_at IS NULL ORDER BY h.id DESC`,
      [user.uuid],
    );
    const rows = owned.rows
      .map((row) => ({ ...row, ...evaluateOwnedCoupon(row, basket) }))
      .sort((a, b) => Number(b.discount_amount) - Number(a.discount_amount));
    const publicRows = await client.query(
      `SELECT ${fields},(h.uuid IS NOT NULL) AS claimed,h.uuid AS user_coupon_uuid,h.user_coupon_used_count,h.deleted_at AS user_coupon_deleted_at
      FROM tb_event_coupons c LEFT JOIN tb_user_coupons h ON h.user_coupon_coupon=c.uuid AND h.user_coupon_user=$1
      WHERE c.coupon_distribution_method='claim' AND c.coupon_status='active' AND c.deleted_at IS NULL
      AND (c.coupon_expires_at IS NULL OR c.coupon_expires_at>clock_timestamp())
      AND (c.coupon_issued_count<c.coupon_recipient_limit OR h.uuid IS NOT NULL) ORDER BY c.id DESC`,
      [user.uuid],
    );
    const claimableRows = publicRows.rows.map((row) => ({
      ...row,
      ...(row.claimed
        ? evaluateOwnedCoupon(row, basket)
        : evaluateCouponRules(row, basket)),
    }));
    return {
      rows,
      claimableRows,
      eligibleCount: rows.filter((row) => row.eligible).length,
      claimableCount: claimableRows.filter((row) => !row.claimed).length,
      basket,
    };
  });
});
