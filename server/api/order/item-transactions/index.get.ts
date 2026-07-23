import { useDb } from "@@/server/utils/db";
import { requireCurrentAdmin } from "@@/server/utils/session";

type TransactionQuery = {
  dateFrom?: string;
  dateTo?: string;
  page?: string;
  pageSize?: string;
};

const isDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

export default defineEventHandler(async (event) => {
  await requireCurrentAdmin(event);
  const query = getQuery(event) as TransactionQuery;
  const page = Math.max(Number(query.page || 1), 1);
  const pageSize = Math.min(Math.max(Number(query.pageSize || 20), 1), 100);
  const offset = (page - 1) * pageSize;
  const dateFrom = String(query.dateFrom || "").trim();
  const dateTo = String(query.dateTo || "").trim();

  if ((dateFrom && !isDate(dateFrom)) || (dateTo && !isDate(dateTo))) {
    throw createError({ statusCode: 400, statusMessage: "Date filter is invalid" });
  }
  if (dateFrom && dateTo && dateFrom > dateTo) {
    throw createError({ statusCode: 400, statusMessage: "Date range is invalid" });
  }

  const params: unknown[] = [];
  let condition = `base.order_item_transaction_status = 'posted'
                   AND base.deleted_at IS NULL`;

  if (dateFrom) {
    params.push(dateFrom);
    condition += ` AND base.order_item_transaction_recognized_at >= $${params.length}::date`;
  }
  if (dateTo) {
    params.push(dateTo);
    condition += ` AND base.order_item_transaction_recognized_at < ($${params.length}::date + INTERVAL '1 day')`;
  }

  const db = useDb();
  const [summaryResult, byDayResult, topProductsResult, rowsResult, totalResult] =
    await Promise.all([
      db.query(
        `SELECT COUNT(DISTINCT base.order_item_transaction_order) AS order_count,
                COUNT(*) AS item_line_count,
                COALESCE(SUM(base.order_item_transaction_quantity), 0) AS quantity,
                COALESCE(SUM(base.order_item_transaction_gross_amount), 0) AS gross_sales,
                COALESCE(SUM(base.order_item_transaction_discount_amount), 0) AS discount_amount,
                COALESCE(SUM(base.order_item_transaction_net_sales), 0) AS net_sales,
                COALESCE(SUM(base.order_item_transaction_total_cost), 0) AS total_cost,
                COALESCE(SUM(base.order_item_transaction_gross_profit), 0) AS gross_profit
         FROM tb_shopping_order_item_transactions AS base
         WHERE ${condition}`,
        params,
      ),
      db.query(
        `SELECT DATE(base.order_item_transaction_recognized_at AT TIME ZONE 'Asia/Bangkok') AS sale_date,
                COUNT(DISTINCT base.order_item_transaction_order) AS order_count,
                COALESCE(SUM(base.order_item_transaction_net_sales), 0) AS net_sales,
                COALESCE(SUM(base.order_item_transaction_gross_profit), 0) AS gross_profit
         FROM tb_shopping_order_item_transactions AS base
         WHERE ${condition}
         GROUP BY sale_date
         ORDER BY sale_date DESC
         LIMIT 31`,
        params,
      ),
      db.query(
        `SELECT base.order_item_transaction_product_name,
                base.order_item_transaction_product_code,
                COALESCE(SUM(base.order_item_transaction_quantity), 0) AS quantity,
                COALESCE(SUM(base.order_item_transaction_net_sales), 0) AS net_sales,
                COALESCE(SUM(base.order_item_transaction_gross_profit), 0) AS gross_profit
         FROM tb_shopping_order_item_transactions AS base
         WHERE ${condition}
         GROUP BY base.order_item_transaction_product_name,
                  base.order_item_transaction_product_code
         ORDER BY net_sales DESC
         LIMIT 5`,
        params,
      ),
      db.query(
        `SELECT base.*
         FROM tb_shopping_order_item_transactions AS base
         WHERE ${condition}
         ORDER BY base.order_item_transaction_recognized_at DESC, base.id DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, pageSize, offset],
      ),
      db.query(
        `SELECT COUNT(*) AS total
         FROM tb_shopping_order_item_transactions AS base
         WHERE ${condition}`,
        params,
      ),
    ]);

  const total = Number(totalResult.rows[0]?.total || 0);
  return {
    summary: summaryResult.rows[0],
    byDay: byDayResult.rows,
    topProducts: topProductsResult.rows,
    rows: rowsResult.rows,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
});
