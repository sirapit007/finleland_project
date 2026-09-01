import { useDb } from "@@/server/utils/db";
import { requireScopedUserUuid } from "@@/server/utils/scopedUser";

type ShippingAddressQuery = {
  page?: string;
  pageSize?: string;
  orderBy?: string;
  q?: string;
  uuid?: string;
  user_uuid?: string;
  deleted?: string;
};

export default defineEventHandler(async (event) => {
  const tableName = "tb_user_shipping_addresses";
  const db = useDb();
  const query = getQuery(event) as ShippingAddressQuery;
  const scopedUserUuid = await requireScopedUserUuid(event, query.user_uuid);
  const page = Math.max(Number(query.page || 1), 1);
  const pageSize = Math.min(Math.max(Number(query.pageSize || 10), 1), 100);
  const orderBy = String(
    query.orderBy || "base.shipping_is_default DESC, base.id DESC",
  );
  const allowedOrderBy = new Set([
    "base.shipping_is_default DESC, base.id DESC",
    "base.shipping_is_default DESC, base.id ASC",
    "base.id DESC",
    "base.id ASC",
    "base.shipping_label ASC",
    "base.shipping_label DESC",
    "base.created_at DESC",
    "base.created_at ASC",
  ]);
  const safeOrderBy = allowedOrderBy.has(orderBy)
    ? orderBy
    : "base.shipping_is_default DESC, base.id DESC";
  const offset = (page - 1) * pageSize;
  const params: unknown[] = [scopedUserUuid];
  let condition = "base.shipping_user = $1";
  condition += query.deleted
    ? " AND base.deleted_at IS NOT NULL "
    : " AND base.deleted_at IS NULL ";

  if (query.q) {
    params.push(`%${String(query.q).trim()}%`);
    const qParam = `$${params.length}`;
    condition += ` AND (
      base.shipping_label ILIKE ${qParam}
      OR base.shipping_recipient ILIKE ${qParam}
      OR base.shipping_phone ILIKE ${qParam}
      OR base.shipping_address ILIKE ${qParam}
      OR base.shipping_subdistrict ILIKE ${qParam}
      OR base.shipping_district ILIKE ${qParam}
      OR base.shipping_province ILIKE ${qParam}
      OR base.shipping_postcode ILIKE ${qParam}
      OR COALESCE(base.shipping_note, '') ILIKE ${qParam}
    )`;
  }

  if (query.uuid) {
    params.push(String(query.uuid));
    condition += ` AND base.uuid = $${params.length} `;
  }

  const countParams = [...params];
  params.push(pageSize, offset);
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
    LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
  const totalResult = await db.query(
    `SELECT COUNT(base.*) AS total
     FROM ${tableName} AS base
     WHERE ${condition}`,
    countParams,
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
