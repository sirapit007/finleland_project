import { useDb } from "@@/server/utils/db";

export default defineEventHandler(async (event) => {
  const db = useDb();

  const uuid = getRouterParam(event, "uuid");

  const result = await db.query(
    `SELECT 
      transaction.*,
      user_c.username AS created_username,
      user_u.username AS updated_username
    FROM tb_product_transactions_demo AS transaction
    LEFT JOIN tb_users AS user_c ON user_c.uuid::text = transaction.created_by
    LEFT JOIN tb_users AS user_u ON user_u.uuid::text = transaction.updated_by
    LEFT JOIN tb_users AS user_d ON user_d.uuid::text = transaction.deleted_by
    WHERE transaction.all_products_demo_uuid = $1 AND transaction.deleted_at IS NULL`,
    [uuid],
  );

  const rows = result.rows;

  return rows;
});
