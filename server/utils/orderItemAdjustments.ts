import type { PoolClient } from "pg";

type AdjustmentAction = "added" | "updated" | "removed";

type AdjustmentInput = {
  action: AdjustmentAction;
  after?: Record<string, unknown> | null;
  before?: Record<string, unknown> | null;
  itemUuid: string;
  note?: string | null;
  orderUuid: string;
  userUuid: string;
};

const terminalStatuses = new Set(["completed", "canceled"]);

export async function assertOrderItemsAreEditable(
  client: PoolClient,
  orderUuid: string,
) {
  const result = await client.query(
    `SELECT uuid::text AS uuid, order_status
     FROM tb_shopping_orders
     WHERE uuid::text = $1
       AND deleted_at IS NULL
     LIMIT 1
     FOR UPDATE`,
    [orderUuid],
  );
  const order = result.rows[0];

  if (!order) {
    throw createError({ statusCode: 404, statusMessage: "Order was not found" });
  }
  if (terminalStatuses.has(String(order.order_status || ""))) {
    throw createError({
      statusCode: 409,
      statusMessage: "Completed or canceled orders cannot be adjusted",
    });
  }

  return order;
}

export async function recordOrderItemAdjustment(
  client: PoolClient,
  input: AdjustmentInput,
) {
  const result = await client.query(
    `INSERT INTO tb_shopping_order_item_adjustments (
      order_item_adjustment_order,
      order_item_adjustment_item,
      order_item_adjustment_action,
      order_item_adjustment_before,
      order_item_adjustment_after,
      order_item_adjustment_note,
      created_by
    ) VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7)
    RETURNING *`,
    [
      input.orderUuid,
      input.itemUuid,
      input.action,
      input.before ? JSON.stringify(input.before) : null,
      input.after ? JSON.stringify(input.after) : null,
      input.note || null,
      input.userUuid,
    ],
  );

  return result.rows[0];
}
