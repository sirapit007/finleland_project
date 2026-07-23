import { useDb } from "@@/server/utils/db";
import { requireCurrentAdmin } from "@@/server/utils/session";

export default defineEventHandler(async (event) => {
  await requireCurrentAdmin(event);

  const query = getQuery(event);
  const page = Math.max(Number(query.page || 1), 1);
  const pageSize = Math.min(Math.max(Number(query.pageSize || 20), 1), 100);
  const q = String(query.q || "").trim();
  const status = String(query.status || "").trim();
  const allowedStatuses = new Set(["new", "reviewed", "resolved"]);

  const conditions = ["base.deleted_at IS NULL"];
  const filterParams: unknown[] = [];

  if (q) {
    filterParams.push(`%${q}%`);
    conditions.push(
      `(base.contact_message ILIKE $${filterParams.length}
        OR customer.firstname ILIKE $${filterParams.length}
        OR customer.lastname ILIKE $${filterParams.length}
        OR customer.email ILIKE $${filterParams.length})`,
    );
  }

  if (allowedStatuses.has(status)) {
    filterParams.push(status);
    conditions.push(`base.contact_status = $${filterParams.length}`);
  }

  const whereClause = conditions.join(" AND ");
  const offset = (page - 1) * pageSize;
  const dataParams = [...filterParams, pageSize, offset];
  const limitParam = filterParams.length + 1;
  const offsetParam = filterParams.length + 2;
  const db = useDb();

  const [result, totalResult] = await Promise.all([
    db.query(
      `SELECT
         base.*,
         customer.firstname,
         customer.lastname,
         customer.email,
         customer.phone
       FROM tb_user_contacts AS base
       LEFT JOIN tb_users AS customer
         ON base.contact_user = customer.uuid::text
       WHERE ${whereClause}
       ORDER BY base.created_at DESC, base.id DESC
       LIMIT $${limitParam} OFFSET $${offsetParam}`,
      dataParams,
    ),
    db.query(
      `SELECT COUNT(*) AS total
       FROM tb_user_contacts AS base
       LEFT JOIN tb_users AS customer
         ON base.contact_user = customer.uuid::text
       WHERE ${whereClause}`,
      filterParams,
    ),
  ]);

  const total = Number(totalResult.rows[0]?.total || 0);

  return {
    rows: result.rows,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
});
