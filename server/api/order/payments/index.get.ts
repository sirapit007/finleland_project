import { sanitizePaymentRow } from "@@/server/utils/orderPayments";
import { useDb } from "@@/server/utils/db";
import { requireCurrentActor } from "@@/server/utils/session";

type PaymentQuery = {
  page?: string;
  pageSize?: string;
  q?: string;
  uuid?: string;
  order_payment_order?: string;
  order_payment_status?: string;
  deleted?: string;
};

export default defineEventHandler(async (event) => {
  const query = getQuery(event) as PaymentQuery;
  const actor = await requireCurrentActor(event);
  const page = Math.max(Number(query.page || 1), 1);
  const pageSize = Math.min(Math.max(Number(query.pageSize || 10), 1), 100);
  const offset = (page - 1) * pageSize;
  const params: unknown[] = [];
  let condition = "orders.deleted_at IS NULL";

  if (!actor.isAdmin) {
    params.push(actor.user.uuid);
    condition += ` AND orders.order_user = $${params.length}`;
  }
  condition +=
    actor.isAdmin && query.deleted
      ? " AND base.deleted_at IS NOT NULL"
      : " AND base.deleted_at IS NULL";

  if (query.uuid) {
    params.push(String(query.uuid));
    condition += ` AND base.uuid::text = $${params.length}`;
  }
  if (query.order_payment_order) {
    params.push(String(query.order_payment_order));
    condition += ` AND base.order_payment_order::text = $${params.length}`;
  }
  if (query.order_payment_status) {
    params.push(String(query.order_payment_status));
    condition += ` AND base.order_payment_status = $${params.length}`;
  }
  if (query.q) {
    params.push(`%${String(query.q).trim()}%`);
    const q = `$${params.length}`;
    condition += ` AND (
      orders.order_number ILIKE ${q}
      OR COALESCE(base.order_payment_transaction_ref, '') ILIKE ${q}
      OR COALESCE(base.order_payment_sender_name, '') ILIKE ${q}
    )`;
  }

  params.push(pageSize, offset);
  const db = useDb();
  const result = await db.query(
    `SELECT base.*,
            orders.order_number,
            orders.order_user,
            orders.order_customer_name,
            orders.order_grand_total,
            orders.order_payment_status AS current_order_payment_status,
            concat_ws(' ', user_c.firstname, user_c.lastname) AS created_username,
            concat_ws(' ', user_u.firstname, user_u.lastname) AS updated_username
     FROM tb_shopping_order_payments AS base
     INNER JOIN tb_shopping_orders AS orders
       ON orders.uuid = base.order_payment_order
     LEFT JOIN tb_users AS user_c ON user_c.uuid::text = base.created_by
     LEFT JOIN tb_users AS user_u ON user_u.uuid::text = base.updated_by
     WHERE ${condition}
     ORDER BY base.id DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
  const totalResult = await db.query(
    `SELECT COUNT(*) AS total
     FROM tb_shopping_order_payments AS base
     INNER JOIN tb_shopping_orders AS orders
       ON orders.uuid = base.order_payment_order
     WHERE ${condition}`,
    params.slice(0, -2),
  );
  const total = Number(totalResult.rows[0]?.total || 0);

  return {
    rows: result.rows.map((row) =>
      sanitizePaymentRow(row, {
        includeProviderResponse: actor.isAdmin,
      }),
    ),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
});
