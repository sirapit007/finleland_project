import { useDb } from "@@/server/utils/db";
import { normalizeProductImageUrls } from "@@/server/utils/productImages";

export default defineEventHandler(async (event) => {
  const tableName = "vw_master_products";
  const productTableName = "tb_master_products";

  const db = useDb();

  const query = getQuery(event);

  const page = Math.max(Number(query.page || 1), 1);
  const pageSize = Math.min(Math.max(Number(query.pageSize || 10), 1), 1000);
  const orderBy = String(query.orderBy || "base.id DESC");
  const allowedOrderBy = new Set([
    "base.id DESC",
    "base.id ASC",
    "base.product_selling_price DESC",
    "base.product_selling_price ASC",
  ]);
  const safeOrderBy = allowedOrderBy.has(orderBy) ? orderBy : "base.id DESC";
  const offset = (page - 1) * pageSize;
  const params: unknown[] = [];

  const uuid = String(query.uuid || "");
  const category = String(query.category || "");
  const category_name = String(query.category_name || "");
  const product_name = String(query.product_name || "");

  let condition = " 1 = 1 ";
  condition += query?.deleted
    ? " AND base.deleted_at IS NOT NULL "
    : " AND base.deleted_at IS NULL ";
  const search = String(query.q || "").trim();
  if (search) {
    params.push(`%${search}%`);
    condition += ` AND (
      base.product_code ILIKE $${params.length}
      OR base.product_name ILIKE $${params.length}
      OR base.product_category_name ILIKE $${params.length}
      OR base.product_supplier_name ILIKE $${params.length}
    ) `;
  }
  if (uuid) {
    params.push(uuid);
    condition += ` AND base.uuid = $${params.length} `;
  }
  if (category) {
    params.push(category);
    condition += ` AND base.product_category = $${params.length} `;
  }
  if (category_name) {
    params.push(category_name);
    condition += ` AND base.product_category_name = $${params.length} `;
  }
  if (product_name) {
    params.push(product_name);
    condition += ` AND base.product_name = $${params.length} `;
  }

  const current = String(query.current || "");
  let currentRow = [];

  if (current) {
    const currentResult = await db.query(
      `
    SELECT base.*, product.product_description
    FROM ${tableName} AS base
    LEFT JOIN ${productTableName} AS product ON product.uuid = base.uuid
    WHERE base.uuid = $1::uuid
    `,
      [current],
    );

    currentRow = currentResult.rows;

    params.push(current);
    condition += ` AND base.uuid <> $${params.length}`;
  }

  params.push(pageSize, offset);
  const limitParam = params.length - 1;
  const offsetParam = params.length;

  const result = await db.query(
    `SELECT 
      base.*,
      product.product_description
    FROM ${tableName} AS base
    LEFT JOIN ${productTableName} AS product ON product.uuid = base.uuid
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
    rows: [...currentRow, ...result.rows].map((row) => ({
      ...row,
      image_url: normalizeProductImageUrls(row.image_url),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
});
