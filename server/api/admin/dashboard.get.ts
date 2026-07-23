import { useDb } from "@@/server/utils/db";
import { requireCurrentAdmin } from "@@/server/utils/session";

type DashboardQuery = {
  date?: string;
};

const isDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

export default defineEventHandler(async (event) => {
  await requireCurrentAdmin(event);

  const query = getQuery(event) as DashboardQuery;
  const selectedDate = String(query.date || "").trim();

  if (!selectedDate || !isDate(selectedDate)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Dashboard date is invalid",
    });
  }

  const db = useDb();
  const [salesResult, ordersResult, last7DaysResult, topProductsResult] =
    await Promise.all([
      db.query(
        `SELECT
           COALESCE(SUM(base.order_item_transaction_net_sales)
             FILTER (
               WHERE DATE(base.order_item_transaction_recognized_at AT TIME ZONE 'Asia/Bangkok') = $1::date
             ), 0) AS daily_net_sales,
           COALESCE(SUM(base.order_item_transaction_total_cost)
             FILTER (
               WHERE DATE(base.order_item_transaction_recognized_at AT TIME ZONE 'Asia/Bangkok') = $1::date
             ), 0) AS daily_total_cost,
           COALESCE(SUM(base.order_item_transaction_gross_profit)
             FILTER (
               WHERE DATE(base.order_item_transaction_recognized_at AT TIME ZONE 'Asia/Bangkok') = $1::date
             ), 0) AS daily_gross_profit,
           COUNT(DISTINCT base.order_item_transaction_order)
             FILTER (
               WHERE DATE(base.order_item_transaction_recognized_at AT TIME ZONE 'Asia/Bangkok') = $1::date
             ) AS daily_completed_order_count,
           COALESCE(SUM(base.order_item_transaction_net_sales)
             FILTER (
               WHERE DATE_TRUNC(
                 'month',
                 base.order_item_transaction_recognized_at AT TIME ZONE 'Asia/Bangkok'
               ) = DATE_TRUNC('month', $1::date)
             ), 0) AS monthly_net_sales
         FROM tb_shopping_order_item_transactions AS base
         WHERE base.order_item_transaction_status = 'posted'
           AND base.deleted_at IS NULL`,
        [selectedDate],
      ),
      db.query(
        `SELECT
           COUNT(*) AS order_count,
           COUNT(*) FILTER (
             WHERE base.order_status NOT IN ('completed', 'canceled')
           ) AS active_order_count,
           COUNT(*) FILTER (
             WHERE base.order_status = 'completed'
           ) AS completed_order_count,
           COUNT(*) FILTER (
             WHERE base.order_status = 'canceled'
           ) AS canceled_order_count
         FROM tb_shopping_orders AS base
         WHERE base.deleted_at IS NULL
           AND DATE(base.order_placed_at AT TIME ZONE 'Asia/Bangkok') = $1::date`,
        [selectedDate],
      ),
      db.query(
        `WITH calendar AS (
           SELECT GENERATE_SERIES(
             $1::date - INTERVAL '6 days',
             $1::date,
             INTERVAL '1 day'
           )::date AS sale_date
         ),
         sales AS (
           SELECT
             DATE(base.order_item_transaction_recognized_at AT TIME ZONE 'Asia/Bangkok') AS sale_date,
             COALESCE(SUM(base.order_item_transaction_net_sales), 0) AS net_sales,
             COALESCE(SUM(base.order_item_transaction_gross_profit), 0) AS gross_profit
           FROM tb_shopping_order_item_transactions AS base
           WHERE base.order_item_transaction_status = 'posted'
             AND base.deleted_at IS NULL
             AND DATE(base.order_item_transaction_recognized_at AT TIME ZONE 'Asia/Bangkok')
               BETWEEN $1::date - INTERVAL '6 days' AND $1::date
           GROUP BY sale_date
         )
         SELECT
           calendar.sale_date,
           COALESCE(sales.net_sales, 0) AS net_sales,
           COALESCE(sales.gross_profit, 0) AS gross_profit
         FROM calendar
         LEFT JOIN sales USING (sale_date)
         ORDER BY calendar.sale_date ASC`,
        [selectedDate],
      ),
      db.query(
        `SELECT
           base.order_item_transaction_product_name,
           base.order_item_transaction_product_code,
           COALESCE(SUM(base.order_item_transaction_quantity), 0) AS quantity,
           COALESCE(SUM(base.order_item_transaction_net_sales), 0) AS net_sales,
           COALESCE(SUM(base.order_item_transaction_gross_profit), 0) AS gross_profit
         FROM tb_shopping_order_item_transactions AS base
         WHERE base.order_item_transaction_status = 'posted'
           AND base.deleted_at IS NULL
           AND DATE(base.order_item_transaction_recognized_at AT TIME ZONE 'Asia/Bangkok') = $1::date
         GROUP BY
           base.order_item_transaction_product_name,
           base.order_item_transaction_product_code
         ORDER BY net_sales DESC
         LIMIT 5`,
        [selectedDate],
      ),
    ]);

  return {
    date: selectedDate,
    summary: {
      ...salesResult.rows[0],
      ...ordersResult.rows[0],
    },
    last7Days: last7DaysResult.rows,
    topProducts: topProductsResult.rows,
  };
});
