import { useDb } from "@@/server/utils/db";
import { requireCurrentActor } from "@@/server/utils/session";

type OrderQuery = {
  page?: string;
  pageSize?: string;
  orderBy?: string;
  q?: string;
  uuid?: string;
  order_user?: string;
  order_status?: string;
  deleted?: string;
};

export default defineEventHandler(async (event) => {
  const db = useDb();
  const query = getQuery(event) as OrderQuery;
  const actor = await requireCurrentActor(event);
  const page = Math.max(Number(query.page || 1), 1);
  const pageSize = Math.min(Math.max(Number(query.pageSize || 10), 1), 100);
  const offset = (page - 1) * pageSize;
  const allowedOrderBy = new Set([
    "base.id DESC",
    "base.id ASC",
    "base.order_placed_at DESC",
    "base.order_placed_at ASC",
    "base.order_grand_total DESC",
    "base.order_grand_total ASC",
  ]);
  const requestedOrderBy = String(query.orderBy || "base.order_placed_at DESC");
  const orderBy = allowedOrderBy.has(requestedOrderBy)
    ? requestedOrderBy
    : "base.order_placed_at DESC";
  const params: unknown[] = [];
  let condition = "1 = 1";

  if (!actor.isAdmin) {
    params.push(actor.user.uuid);
    condition += ` AND base.order_user = $${params.length}`;
  }

  condition +=
    actor.isAdmin && query.deleted
      ? " AND base.deleted_at IS NOT NULL"
      : " AND base.deleted_at IS NULL";

  if (query.q) {
    params.push(`%${String(query.q).trim()}%`);
    condition += ` AND (
      base.order_number ILIKE $${params.length}
      OR base.order_customer_name ILIKE $${params.length}
      OR COALESCE(base.order_customer_phone, '') ILIKE $${params.length}
    )`;
  }

  if (query.uuid) {
    params.push(String(query.uuid));
    condition += ` AND base.uuid::text = $${params.length}`;
  }

  if (actor.isAdmin && query.order_user) {
    params.push(String(query.order_user));
    condition += ` AND base.order_user = $${params.length}`;
  }

  if (query.order_status) {
    params.push(String(query.order_status));
    condition += ` AND base.order_status = $${params.length}`;
  }

  params.push(pageSize, offset);
  const result = await db.query(
    `SELECT base.*,
            COALESCE(
              base.order_shipping_latitude,
              shipping_location.shipping_latitude
            ) AS order_shipping_latitude,
            COALESCE(
              base.order_shipping_longitude,
              shipping_location.shipping_longitude
            ) AS order_shipping_longitude,
            concat_ws(' ', customer.firstname, customer.lastname) AS order_customer_current_name,
            (
              SELECT COUNT(*)
              FROM tb_shopping_order_items AS item
              WHERE item.order_item_order = base.uuid::text
                AND item.deleted_at IS NULL
            ) AS order_item_count,
            tax_snapshot.order_tax_detail,
            concat_ws(' ', user_c.firstname, user_c.lastname) AS created_username,
            concat_ws(' ', user_u.firstname, user_u.lastname) AS updated_username,
            concat_ws(' ', user_d.firstname, user_d.lastname) AS deleted_username
     FROM tb_shopping_orders AS base
     LEFT JOIN tb_user_shipping_addresses AS shipping_location
       ON shipping_location.uuid::text = base.order_shipping_address_uuid
      AND shipping_location.shipping_user = base.order_user
     LEFT JOIN tb_users AS customer ON customer.uuid::text = base.order_user
     LEFT JOIN tb_users AS user_c ON user_c.uuid::text = base.created_by
     LEFT JOIN tb_users AS user_u ON user_u.uuid::text = base.updated_by
     LEFT JOIN tb_users AS user_d ON user_d.uuid::text = base.deleted_by
     LEFT JOIN LATERAL (
       SELECT to_jsonb(tax_detail) - 'id' AS order_tax_detail
       FROM tb_shopping_order_tax_details AS tax_detail
       WHERE tax_detail.order_tax_order = base.uuid::text
       LIMIT 1
     ) AS tax_snapshot ON TRUE
     WHERE ${condition}
     ORDER BY ${orderBy}
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
  const totalResult = await db.query(
    `SELECT COUNT(*) AS total
     FROM tb_shopping_orders AS base
     WHERE ${condition}`,
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
