import { useDb } from "@@/server/utils/db";

export default defineEventHandler(async (event) => {
  const db = useDb();

  const query = getQuery(event);

  const page = Math.max(Number(query.page || 1), 1);
  const pageSize = Math.min(Math.max(Number(query.pageSize || 10), 1), 100);
  const owner = String(query.owner || "");
  const orderBy = String(query.orderBy || "product.id DESC");
  const allowedOrderBy = new Set([
    "product.id DESC",
    "product.id ASC",
    "product.demo_price DESC",
    "product.demo_price ASC",
  ]);
  const safeOrderBy = allowedOrderBy.has(orderBy) ? orderBy : "product.id DESC";
  const offset = (page - 1) * pageSize;
  const params: unknown[] = [];

  let condition = " 1 = 1 ";
  condition += (query?.deleted) ? " AND product.deleted_at IS NOT NULL " : " AND product.deleted_at IS NULL ";
  if (owner) {
    params.push(owner);
    condition += ` AND product.demo_owner = $${params.length} `;
  }

  params.push(pageSize, offset);
  const limitParam = params.length - 1;
  const offsetParam = params.length;

  const result = await db.query(
    `SELECT 
      product.*,
      user_c.username AS created_username,
      user_u.username AS updated_username
    FROM tb_all_products_demo AS product
    LEFT JOIN tb_users AS user_c ON user_c.uuid::text = product.created_by
    LEFT JOIN tb_users AS user_u ON user_u.uuid::text = product.updated_by
    LEFT JOIN tb_users AS user_d ON user_d.uuid::text = product.deleted_by
    WHERE ${condition} 
    ORDER BY ${safeOrderBy} 
    LIMIT $${limitParam} OFFSET $${offsetParam}`,
    params
  );

  const totalResult = await db.query(
    `SELECT COUNT(product.*) AS total FROM tb_all_products_demo AS product WHERE ${condition}`,
    params.slice(0, params.length - 2)
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
