import { useDb } from "@@/server/utils/db";
import { requireCurrentActor } from "@@/server/utils/session";

type StatusHistoryQuery = {
  order_status_history_order?: string;
  orderBy?: string;
  page?: string;
  pageSize?: string;
};

export default defineEventHandler(async (event) => {
  const query = getQuery(event) as StatusHistoryQuery;
  const orderUuid = String(query.order_status_history_order || "").trim();

  if (!orderUuid) {
    throw createError({
      statusCode: 400,
      statusMessage: "Order uuid is required",
    });
  }

  const viewer = await requireCurrentActor(event);
  const db = useDb();
  const orderResult = await db.query(
    `SELECT uuid
     FROM tb_shopping_orders
     WHERE uuid::text = $1
       AND deleted_at IS NULL
       AND ($2::boolean OR order_user = $3)
     LIMIT 1`,
    [orderUuid, viewer.isAdmin, viewer.user.uuid],
  );

  if (!orderResult.rows[0]) {
    throw createError({ statusCode: 404, statusMessage: "Order was not found" });
  }

  const page = Math.max(Number(query.page || 1), 1);
  const pageSize = Math.min(Math.max(Number(query.pageSize || 50), 1), 100);
  const offset = (page - 1) * pageSize;
  const allowedOrderBy = new Set(["base.created_at ASC", "base.created_at DESC"]);
  const requestedOrderBy = String(query.orderBy || "base.created_at ASC");
  const orderBy = allowedOrderBy.has(requestedOrderBy)
    ? requestedOrderBy
    : "base.created_at ASC";

  const result = await db.query(
    `SELECT base.*,
            orders.order_number,
            concat_ws(' ', actor.firstname, actor.lastname) AS created_username
     FROM tb_shopping_order_status_histories AS base
     LEFT JOIN tb_shopping_orders AS orders
       ON orders.uuid::text = base.order_status_history_order
     LEFT JOIN tb_users AS actor ON actor.uuid::text = base.created_by
     WHERE base.order_status_history_order = $1
       AND base.deleted_at IS NULL
     ORDER BY ${orderBy}
     LIMIT $2 OFFSET $3`,
    [orderUuid, pageSize, offset],
  );
  const totalResult = await db.query(
    `SELECT COUNT(*) AS total
     FROM tb_shopping_order_status_histories
     WHERE order_status_history_order = $1
       AND deleted_at IS NULL`,
    [orderUuid],
  );
  const total = Number(totalResult.rows[0]?.total || 0);

  return {
    rows: result.rows,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
});
