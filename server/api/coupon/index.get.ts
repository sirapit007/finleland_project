import { useDb } from "@@/server/utils/db";
import { requireCurrentAdmin } from "@@/server/utils/session";
import { couponAdminSelect, couponPage } from "@@/server/utils/couponApi";
export default defineEventHandler(async (event) => {
  await requireCurrentAdmin(event);
  const query = getQuery(event),
    db = useDb();
  const page = couponPage(query.page, 1),
    pageSize = couponPage(query.pageSize, 10, 100);
  const params: unknown[] = [];
  let where =
    query.deleted === "true"
      ? "base.deleted_at IS NOT NULL"
      : "base.deleted_at IS NULL";
  if (query.q) {
    params.push(`%${String(query.q).trim()}%`);
    where += ` AND (base.coupon_name ILIKE $${params.length} OR base.coupon_description ILIKE $${params.length})`;
  }
  if (query.status) {
    params.push(String(query.status));
    where += ` AND base.coupon_status=$${params.length}`;
  }
  const count = await db.query(
    `SELECT COUNT(*)::int AS total FROM tb_event_coupons base WHERE ${where}`,
    params,
  );
  const orderBy =
    query.orderBy === "base.id ASC" ? "base.id ASC" : "base.id DESC";
  params.push(pageSize, (page - 1) * pageSize);
  const result = await db.query(
    `${couponAdminSelect} WHERE ${where} ORDER BY ${orderBy} LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
  const total = Number(count.rows[0].total);
  return {
    rows: result.rows,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
});
