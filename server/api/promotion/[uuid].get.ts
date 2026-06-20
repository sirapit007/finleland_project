import { useDb } from "@@/server/utils/db";

export default defineEventHandler(async (event) => {
  const tableName = "tb_event_promotions";

  const db = useDb();
  const query = getQuery(event);
  const uuid = getRouterParam(event, "uuid");

  if (!uuid) {
    throw createError({
      statusCode: 400,
      statusMessage: "Promotion type is required",
    });
  }

  const pageSize = Math.min(Math.max(Number(query.pageSize || 10), 1), 100);

  const result = await db.query(
    `SELECT 
      base.*,
      user_c.username AS created_username,
      user_u.username AS updated_username
    FROM ${tableName} AS base
    LEFT JOIN tb_users AS user_c ON base.created_by = user_c.uuid::text
    LEFT JOIN tb_users AS user_u ON base.updated_by = user_u.uuid::text
    LEFT JOIN tb_users AS user_d ON base.deleted_by = user_d.uuid::text
    WHERE base.promotion_product = $1 AND base.deleted_at IS NULL
    ORDER BY base.id DESC 
    LIMIT $2 OFFSET 0`,
    [uuid, pageSize],
  );

  const rows = result.rows.map((row) => ({
    ...row,
    promotion_start_date: row.promotion_start_date
      ?.toISOString()
      ?.split("T")[0],
    promotion_end_date: row.promotion_end_date?.toISOString()?.split("T")[0],
  }));

  return {
    rows
  };
});
