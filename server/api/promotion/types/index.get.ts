import { useDb } from "@@/server/utils/db";
import { requireCurrentAdmin } from "@@/server/utils/session";

export default defineEventHandler(async (event) => {
  const tableName = "tb_master_promotion_types";
  await requireCurrentAdmin(event);

  const db = useDb();

  const query = getQuery(event);

  const page = Math.max(Number(query.page || 1), 1);
  const pageSize = Math.min(Math.max(Number(query.pageSize || 10), 1), 100);
  const orderBy = String(query.orderBy || "base.id DESC");
  const allowedOrderBy = new Set(["base.id DESC", "base.id ASC"]);
  const safeOrderBy = allowedOrderBy.has(orderBy) ? orderBy : "base.id DESC";
  const offset = (page - 1) * pageSize;
  const params: unknown[] = [];

  let condition = " 1 = 1 ";
  condition += query?.deleted
    ? " AND base.deleted_at IS NOT NULL "
    : " AND base.deleted_at IS NULL ";
  condition += query?.q
    ? ` AND (base.promotion_type_code ILIKE '%${query?.q}%' OR base.promotion_type_name ILIKE '%${query?.q}%' OR base.promotion_type_description ILIKE '%${query?.q}%') `
    : "";

  params.push(pageSize, offset);
  const limitParam = params.length - 1;
  const offsetParam = params.length;

  const result = await db.query(
    `SELECT 
      base.*,
                        concat_ws(' ', user_c.firstname, user_c.lastname) AS created_username,
      concat_ws(' ', user_u.firstname, user_u.lastname) AS updated_username,
      concat_ws(' ', user_d.firstname, user_d.lastname) AS deleted_username
    FROM ${tableName} AS base
    LEFT JOIN tb_users AS user_c ON base.created_by = user_c.uuid::text
    LEFT JOIN tb_users AS user_u ON base.updated_by = user_u.uuid::text
    LEFT JOIN tb_users AS user_d ON base.deleted_by = user_d.uuid::text
    WHERE ${condition} 
    ORDER BY ${safeOrderBy} 
    LIMIT $${limitParam} OFFSET $${offsetParam}`,
    params,
  );

  const totalResult = await db.query(
    `SELECT COUNT(base.*) AS total FROM ${tableName} AS base WHERE ${condition}`,
    params.slice(0, params.length - 2),
  );
  const total = totalResult.rows[0]?.total ?? 0;

  return {
    rows: result.rows,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
});
