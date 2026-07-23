import type { PoolClient } from "pg";

type CreateOrderItemTransactionsInput = {
  createdBy: string;
  orderUuid: string;
  statusHistoryUuid?: string | null;
};

/**
 * Creates an immutable sales snapshot from the final order items. The caller
 * must hold a lock on the order row so a completed order cannot be posted twice.
 */
export async function createOrderItemTransactions(
  client: PoolClient,
  input: CreateOrderItemTransactionsInput,
) {
  const result = await client.query(
    `INSERT INTO tb_shopping_order_item_transactions (
       order_item_transaction_order,
       order_item_transaction_order_item,
       order_item_transaction_status_history,
       order_item_transaction_order_number,
       order_item_transaction_product,
       order_item_transaction_product_code,
       order_item_transaction_product_name,
       order_item_transaction_product_image,
       order_item_transaction_quantity,
       order_item_transaction_unit_selling_price,
       order_item_transaction_gross_amount,
       order_item_transaction_discount_amount,
       order_item_transaction_net_sales,
       order_item_transaction_unit_cost,
       order_item_transaction_total_cost,
       order_item_transaction_gross_profit,
       order_item_transaction_status,
       order_item_transaction_recognized_at,
       created_by
     )
     SELECT
       orders.uuid::text,
       item.uuid::text,
       $2,
       orders.order_number,
       item.order_item_product,
       item.order_item_product_code,
       item.order_item_product_name,
       item.order_item_product_image,
       item.order_item_quantity,
       item.order_item_unit_price,
       item.order_item_subtotal,
       item.order_item_discount,
       item.order_item_total,
       COALESCE(product.product_cost_price, 0),
       COALESCE(product.product_cost_price, 0) * item.order_item_quantity,
       item.order_item_total - (
         COALESCE(product.product_cost_price, 0) * item.order_item_quantity
       ),
       'posted',
       COALESCE(orders.order_completed_at, NOW()),
       $3
     FROM tb_shopping_orders AS orders
     INNER JOIN tb_shopping_order_items AS item
       ON item.order_item_order = orders.uuid::text
       AND item.deleted_at IS NULL
     LEFT JOIN vw_master_products AS product
       ON product.uuid::text = item.order_item_product
     WHERE orders.uuid::text = $1
       AND orders.deleted_at IS NULL
       AND NOT EXISTS (
         SELECT 1
         FROM tb_shopping_order_item_transactions AS posted
         WHERE posted.order_item_transaction_order_item = item.uuid::text
           AND posted.order_item_transaction_status = 'posted'
           AND posted.deleted_at IS NULL
       )
     RETURNING *`,
    [input.orderUuid, input.statusHistoryUuid || null, input.createdBy],
  );

  return result.rows;
}
