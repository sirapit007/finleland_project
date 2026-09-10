import type { PoolClient } from "pg";
import { useDb } from "./db";
export async function couponTransaction<T>(
  action: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await useDb().connect();
  try {
    await client.query("BEGIN");
    const result = await action(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
export function couponPage(value: unknown, fallback: number, max = 1000000) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0
    ? Math.min(number, max)
    : fallback;
}
export const couponAdminSelect = `SELECT base.*,
  (SELECT COUNT(*)::int FROM tb_shopping_order_coupon_usages u WHERE u.usage_coupon=base.uuid AND u.usage_status='used') AS coupon_usage_count,
  concat_ws(' ',user_c.firstname,user_c.lastname) AS created_username,
  concat_ws(' ',user_u.firstname,user_u.lastname) AS updated_username,
  concat_ws(' ',user_d.firstname,user_d.lastname) AS deleted_username
  FROM tb_event_coupons base
  LEFT JOIN tb_users user_c ON user_c.uuid::text=base.created_by
  LEFT JOIN tb_users user_u ON user_u.uuid::text=base.updated_by
  LEFT JOIN tb_users user_d ON user_d.uuid::text=base.deleted_by`;
