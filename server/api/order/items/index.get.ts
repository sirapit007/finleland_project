import { useDb } from "@@/server/utils/db";
import { requireCurrentActor } from "@@/server/utils/session";

type OrderItemQuery = {
  page?: string;
  pageSize?: string;
  orderBy?: string;
  q?: string;
  uuid?: string;
  order_item_order?: string;
  order_item_product?: string;
  deleted?: string;
};

export default defineEventHandler(async (event) => {
  const db = useDb();
  const query = getQuery(event) as OrderItemQuery;
  const actor = await requireCurrentActor(event);
  const page = Math.max(Number(query.page || 1), 1);
  const pageSize = Math.min(Math.max(Number(query.pageSize || 10), 1), 100);
  const offset = (page - 1) * pageSize;
  const allowedOrderBy = new Set([
    "base.id DESC",
    "base.id ASC",
    "base.order_item_product_name ASC",
    "base.order_item_product_name DESC",
    "base.order_item_total DESC",
    "base.order_item_total ASC",
  ]);
  const requestedOrderBy = String(query.orderBy || "base.id DESC");
  const orderBy = allowedOrderBy.has(requestedOrderBy)
    ? requestedOrderBy
    : "base.id DESC";
  const params: unknown[] = [];
  let condition = "1 = 1";

  if (!actor.isAdmin) {
    params.push(actor.user.uuid);
    condition += ` AND EXISTS (
      SELECT 1
      FROM tb_shopping_orders AS owner_order
      WHERE owner_order.uuid::text = base.order_item_order
        AND owner_order.order_user = $${params.length}
        AND owner_order.deleted_at IS NULL
    )`;
  }

  condition += actor.isAdmin && query.deleted
    ? " AND base.deleted_at IS NOT NULL"
    : " AND base.deleted_at IS NULL";

  if (query.q) {
    params.push(`%${String(query.q).trim()}%`);
    condition += ` AND (
      base.order_item_product_code ILIKE $${params.length}
      OR base.order_item_product_name ILIKE $${params.length}
      OR COALESCE(base.order_item_promotion_name, '') ILIKE $${params.length}
    )`;
  }

  if (query.uuid) {
    params.push(String(query.uuid));
    condition += ` AND base.uuid::text = $${params.length}`;
  }

  if (query.order_item_order) {
    params.push(String(query.order_item_order));
    condition += ` AND base.order_item_order = $${params.length}`;
  }

  if (query.order_item_product) {
    params.push(String(query.order_item_product));
    condition += ` AND base.order_item_product = $${params.length}`;
  }

  params.push(pageSize, offset);
  const result = await db.query(
    `SELECT base.*,
            orders.order_number,
            concat_ws(' ', user_c.firstname, user_c.lastname) AS created_username,
            concat_ws(' ', user_u.firstname, user_u.lastname) AS updated_username,
            concat_ws(' ', user_d.firstname, user_d.lastname) AS deleted_username
     FROM tb_shopping_order_items AS base
     LEFT JOIN tb_shopping_orders AS orders ON orders.uuid::text = base.order_item_order
     LEFT JOIN tb_users AS user_c ON user_c.uuid::text = base.created_by
     LEFT JOIN tb_users AS user_u ON user_u.uuid::text = base.updated_by
     LEFT JOIN tb_users AS user_d ON user_d.uuid::text = base.deleted_by
     WHERE ${condition}
     ORDER BY ${orderBy}
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
  const totalResult = await db.query(
    `SELECT COUNT(*) AS total
     FROM tb_shopping_order_items AS base
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
