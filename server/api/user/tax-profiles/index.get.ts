import { useDb } from "@@/server/utils/db";
import { requireScopedUserUuid } from "@@/server/utils/scopedUser";

type TaxProfileQuery = {
  page?: string;
  pageSize?: string;
  orderBy?: string;
  q?: string;
  uuid?: string;
  deleted?: string;
  user_uuid?: string;
};

export default defineEventHandler(async (event) => {
  const db = useDb();
  const query = getQuery(event) as TaxProfileQuery;
  const scopedUserUuid = await requireScopedUserUuid(event, query.user_uuid);
  const page = Math.max(Number(query.page || 1), 1);
  const pageSize = Math.min(Math.max(Number(query.pageSize || 10), 1), 100);
  const offset = (page - 1) * pageSize;
  const requestedOrderBy = String(
    query.orderBy || "base.tax_profile_is_default DESC, base.id DESC",
  );
  const allowedOrderBy = new Set([
    "base.tax_profile_is_default DESC, base.id DESC",
    "base.tax_profile_is_default DESC, base.id ASC",
    "base.id DESC",
    "base.id ASC",
    "base.tax_profile_label ASC",
    "base.tax_profile_label DESC",
    "base.created_at DESC",
    "base.created_at ASC",
  ]);
  const orderBy = allowedOrderBy.has(requestedOrderBy)
    ? requestedOrderBy
    : "base.tax_profile_is_default DESC, base.id DESC";
  const params: unknown[] = [scopedUserUuid];
  let condition = "base.tax_profile_user = $1";
  condition += query.deleted
    ? " AND base.deleted_at IS NOT NULL"
    : " AND base.deleted_at IS NULL";

  if (query.q) {
    params.push(`%${String(query.q).trim()}%`);
    const q = `$${params.length}`;
    condition += ` AND (
      base.tax_profile_label ILIKE ${q}
      OR base.taxpayer_name ILIKE ${q}
      OR base.taxpayer_id ILIKE ${q}
      OR base.taxpayer_address ILIKE ${q}
      OR base.taxpayer_province ILIKE ${q}
    )`;
  }
  if (query.uuid) {
    params.push(String(query.uuid));
    condition += ` AND base.uuid::text = $${params.length}`;
  }

  params.push(pageSize, offset);
  const result = await db.query(
    `SELECT base.*,
            concat_ws(' ', user_c.firstname, user_c.lastname) AS created_username,
            concat_ws(' ', user_u.firstname, user_u.lastname) AS updated_username,
            concat_ws(' ', user_d.firstname, user_d.lastname) AS deleted_username
     FROM tb_user_tax_profiles AS base
     LEFT JOIN tb_users AS user_c ON user_c.uuid::text = base.created_by
     LEFT JOIN tb_users AS user_u ON user_u.uuid::text = base.updated_by
     LEFT JOIN tb_users AS user_d ON user_d.uuid::text = base.deleted_by
     WHERE ${condition}
     ORDER BY ${orderBy}
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
  const totalResult = await db.query(
    `SELECT COUNT(*) AS total FROM tb_user_tax_profiles AS base WHERE ${condition}`,
    params.slice(0, -2),
  );
  const total = Number(totalResult.rows[0]?.total || 0);

  return {
    rows: result.rows,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
});
