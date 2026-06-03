import { useDb } from "@@/server/utils/db";

export default defineEventHandler(async (event) => {
  const db = useDb();
  const query = getQuery(event);
  const category = getRouterParam(event, "category");

  if (!category) {
    throw createError({
      statusCode: 400,
      statusMessage: "Product category is required",
    });
  }

  const pageSize = Math.min(Math.max(Number(query.pageSize || 10), 1), 100);

  const result = await db.query(
    `SELECT 
      product.*,
      user_c.username AS created_username,
      user_u.username AS updated_username
    FROM tb_all_products_demo AS product
    LEFT JOIN tb_users AS user_c ON user_c.uuid::text = product.created_by
    LEFT JOIN tb_users AS user_u ON user_u.uuid::text = product.updated_by
    LEFT JOIN tb_users AS user_d ON user_d.uuid::text = product.deleted_by
    WHERE product.demo_owner = $1
    ORDER BY product.id DESC 
    LIMIT $2 OFFSET 0`,
    [category, pageSize],
  );

  return {
    rows: result.rows,
  };
});
