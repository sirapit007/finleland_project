import { useDb } from "@@/server/utils/db";

export default defineEventHandler(async () => {
  const db = useDb();

  let condition = " 1 = 1 ";
  condition += " AND product.deleted_at IS NULL ";

  const result = await db.query(
    `SELECT 
      product.demo_owner, 
      COUNT(product.demo_owner) AS qty_count 
    FROM tb_all_products_demo AS product
    WHERE ${condition} 
    GROUP BY product.demo_owner`
  );

  return {
    rows: result.rows
  };
});
