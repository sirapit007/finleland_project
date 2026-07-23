import { useDb } from "@@/server/utils/db";
import { requireCurrentUser } from "@@/server/utils/session";

type BasketQuery = {
  deleted?: string;
};

export default defineEventHandler(async (event) => {
  const tableName = "tb_shopping_basket";
  const db = useDb();
  const uuid = getRouterParam(event, "uuid");
  const query = getQuery(event) as BasketQuery;
  const currentUser = await requireCurrentUser(event);

  if (!uuid) {
    throw createError({
      statusCode: 400,
      statusMessage: "Basket uuid is required",
    });
  }

  const result = await db.query(
    `SELECT
      base.*,
      user_c.username AS created_username,
      user_u.username AS updated_username,
      user_d.username AS deleted_username
    FROM ${tableName} AS base
    LEFT JOIN tb_users AS user_c ON base.created_by = user_c.uuid::text
    LEFT JOIN tb_users AS user_u ON base.updated_by = user_u.uuid::text
    LEFT JOIN tb_users AS user_d ON base.deleted_by = user_d.uuid::text
    WHERE base.uuid = $1
      AND base.created_by = $2
      ${query?.deleted ? "" : "AND base.deleted_at IS NULL"}
    LIMIT 1`,
    [uuid, currentUser.uuid],
  );

  return {
    row: result.rows[0] || null,
  };
});
