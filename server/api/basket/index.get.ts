import { useDb } from "@@/server/utils/db";
import { requireCurrentUser } from "@@/server/utils/session";

type BasketQuery = {
  page?: string;
  pageSize?: string;
  orderBy?: string;
  q?: string;
  uuid?: string;
  created_by?: string;
  basket_product?: string;
  deleted?: string;
};

export default defineEventHandler(async (event) => {
  const tableName = "tb_shopping_basket";
  const db = useDb();
  const query = getQuery(event) as BasketQuery;
  const currentUser = await requireCurrentUser(event);

  const page = Math.max(Number(query.page || 1), 1);
  const pageSize = Math.min(Math.max(Number(query.pageSize || 10), 1), 100);
  const orderBy = String(query.orderBy || "base.id DESC");
  const allowedOrderBy = new Set([
    "base.id DESC",
    "base.id ASC",
    "base.basket_quantity DESC",
    "base.basket_quantity ASC",
    "base.basket_total DESC",
    "base.basket_total ASC",
  ]);
  const safeOrderBy = allowedOrderBy.has(orderBy) ? orderBy : "base.id DESC";
  const offset = (page - 1) * pageSize;
  const params: unknown[] = [];

  let condition = "1 = 1";
  params.push(currentUser.uuid);
  condition += ` AND base.created_by = $${params.length} `;
  condition += query?.deleted
    ? " AND base.deleted_at IS NOT NULL "
    : " AND base.deleted_at IS NULL ";
  condition += " AND base.basket_expire > NOW() ";
  condition += query?.q
    ? ` AND (base.basket_product ILIKE '%${query.q}%') `
    : "";

  if (query.uuid) {
    params.push(String(query.uuid));
    condition += ` AND base.uuid = $${params.length} `;
  }

  if (query.basket_product) {
    params.push(String(query.basket_product));
    condition += ` AND base.basket_product = $${params.length} `;
  }

  params.push(pageSize, offset);
  const limitParam = params.length - 1;
  const offsetParam = params.length;

  const result = await db.query(
    `SELECT
      base.*,
      product.product_name,
      product.product_code,
      product.image_url,
      product.product_selling_price,
      shipping_product.product_shipping_weight_grams,
      shipping_product.product_shipping_length_cm,
      shipping_product.product_shipping_width_cm,
      shipping_product.product_shipping_height_cm,
      promotion.uuid::text AS promotion_uuid,
      promotion.promotion_name,
      promotion.promotion_discounted_price,
      promotion.promotion_bundle_price,
      promotion.promotion_min_quantity,
      promotion.promotion_min_purchase_amount,
      user_c.username AS created_username,
      user_u.username AS updated_username,
      user_d.username AS deleted_username
    FROM ${tableName} AS base
    LEFT JOIN vw_master_products AS product ON product.uuid::text = base.basket_product
    LEFT JOIN tb_master_products AS shipping_product
      ON shipping_product.uuid::text = base.basket_product
    LEFT JOIN LATERAL (
      SELECT promotion.*
      FROM tb_event_promotions AS promotion
      WHERE promotion.promotion_product = base.basket_product
        AND promotion.promotion_is_active = TRUE
        AND promotion.deleted_at IS NULL
        AND CURRENT_DATE BETWEEN promotion.promotion_start_date AND promotion.promotion_end_date
      ORDER BY promotion.promotion_start_date DESC, promotion.id DESC
      LIMIT 1
    ) AS promotion ON TRUE
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

  const quantityResult = await db.query(
    `SELECT COALESCE(SUM(base.basket_quantity), 0) AS total_quantity
     FROM ${tableName} AS base
     WHERE ${condition}`,
    params.slice(0, params.length - 2),
  );
  const totalQuantity = Number(quantityResult.rows[0]?.total_quantity ?? 0);

  return {
    rows: result.rows,
    total,
    totalQuantity,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
});
