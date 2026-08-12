import { useDb } from "@@/server/utils/db";

const parseCurrentValues = (value: unknown) => {
  const values = Array.isArray(value) ? value : [value];
  return [
    ...new Set(
      values
        .flatMap((item) => String(item || "").split(","))
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
};

export default defineEventHandler(async (event) => {
  const db = useDb();
  const query = getQuery(event);
  const page = Math.max(Number(query.page || 1), 1);
  const pageSize = Math.min(Math.max(Number(query.pageSize || 10), 1), 1000);
  const offset = (page - 1) * pageSize;
  const orderBy = String(query.orderBy || "base.id DESC");
  const allowedOrderBy = new Set([
    "base.id DESC",
    "base.id ASC",
    "base.subcategory_name ASC",
    "base.subcategory_name DESC",
  ]);
  const safeOrderBy = allowedOrderBy.has(orderBy) ? orderBy : "base.id DESC";
  const params: unknown[] = [];
  const currentValues = parseCurrentValues(query.current);
  const category = String(query.category || "").trim();
  const search = String(query.q || "").trim();

  let condition = query.deleted
    ? "base.deleted_at IS NOT NULL"
    : "base.deleted_at IS NULL";

  if (search) {
    params.push(`%${search}%`);
    condition += ` AND (
      base.subcategory_name ILIKE $${params.length}
      OR category.category_name ILIKE $${params.length}
    )`;
  }

  if (category) {
    params.push(category);
    condition += ` AND base.subcategory_category = $${params.length}::uuid`;
  }

  if (currentValues.length) {
    params.push(currentValues);
    condition += ` AND base.uuid <> ALL($${params.length}::uuid[])`;
  }

  const selectSql = `
    SELECT
      base.*,
      category.category_name,
      concat_ws(' ', user_c.firstname, user_c.lastname) AS created_username,
      concat_ws(' ', user_u.firstname, user_u.lastname) AS updated_username,
      concat_ws(' ', user_d.firstname, user_d.lastname) AS deleted_username,
      (
        SELECT COUNT(*)
        FROM tb_product_subcategories AS relation
        WHERE relation.subcategory_uuid = base.uuid
      ) AS qty_count
    FROM tb_master_subcategories AS base
    LEFT JOIN tb_master_categories AS category
      ON category.uuid = base.subcategory_category
    LEFT JOIN tb_users AS user_c ON base.created_by = user_c.uuid::text
    LEFT JOIN tb_users AS user_u ON base.updated_by = user_u.uuid::text
    LEFT JOIN tb_users AS user_d ON base.deleted_by = user_d.uuid::text`;

  let currentRows: Record<string, unknown>[] = [];
  if (currentValues.length) {
    const currentResult = await db.query(
      `${selectSql}
       WHERE base.uuid = ANY($1::uuid[])
       ORDER BY array_position($1::uuid[], base.uuid)`,
      [currentValues],
    );
    currentRows = currentResult.rows;
  }

  params.push(pageSize, offset);
  const limitParam = params.length - 1;
  const offsetParam = params.length;

  const [result, totalResult] = await Promise.all([
    db.query(
      `${selectSql}
       WHERE ${condition}
       ORDER BY ${safeOrderBy}
       LIMIT $${limitParam} OFFSET $${offsetParam}`,
      params,
    ),
    db.query(
      `SELECT COUNT(*) AS total
       FROM tb_master_subcategories AS base
       LEFT JOIN tb_master_categories AS category
         ON category.uuid = base.subcategory_category
       WHERE ${condition}`,
      params.slice(0, -2),
    ),
  ]);

  const total = Number(totalResult.rows[0]?.total || 0);

  return {
    rows: [...currentRows, ...result.rows],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
});
