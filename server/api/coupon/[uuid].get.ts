import { useDb } from "@@/server/utils/db";
import { requireCurrentAdmin } from "@@/server/utils/session";
import { couponAdminSelect, couponPage } from "@@/server/utils/couponApi";
import { assertCouponUuid, couponError } from "@@/server/utils/couponRules";
export default defineEventHandler(async (event) => {
  await requireCurrentAdmin(event);
  const uuid = assertCouponUuid(getRouterParam(event, "uuid")),
    db = useDb(),
    query = getQuery(event);
  const pageSize = couponPage(query.pageSize, 100, 500),
    holderPage = couponPage(query.holderPage, 1),
    usagePage = couponPage(query.usagePage, 1);
  const result = await db.query(
    `${couponAdminSelect} WHERE base.uuid=$1 AND base.deleted_at IS NULL`,
    [uuid],
  );
  if (!result.rows[0]) couponError("ไม่พบคูปองนี้", 404);
  const holders = await db.query(
    `SELECT h.*,h.uuid AS user_coupon_uuid,u.firstname,u.lastname,u.email FROM tb_user_coupons h
    JOIN tb_users u ON u.uuid=h.user_coupon_user WHERE h.user_coupon_coupon=$1 ORDER BY h.id DESC LIMIT $2 OFFSET $3`,
    [uuid, pageSize, (holderPage - 1) * pageSize],
  );
  const usages = await db.query(
    `SELECT x.*,u.firstname,u.lastname,u.email,o.order_number,o.order_status,o.order_payment_status FROM tb_shopping_order_coupon_usages x
    JOIN tb_users u ON u.uuid=x.usage_user JOIN tb_shopping_orders o ON o.uuid=x.usage_order WHERE x.usage_coupon=$1 ORDER BY x.id DESC LIMIT $2 OFFSET $3`,
    [uuid, pageSize, (usagePage - 1) * pageSize],
  );
  const count = await db.query(
    "SELECT COUNT(*)::int AS total FROM tb_shopping_order_coupon_usages WHERE usage_coupon=$1",
    [uuid],
  );
  return {
    row: result.rows[0],
    holders: holders.rows,
    usages: usages.rows,
    holderPage,
    usagePage,
    pageSize,
    holderTotal: Number(result.rows[0].coupon_issued_count),
    usageTotal: Number(count.rows[0].total),
  };
});
