import { useDb } from "@@/server/utils/db";
import { createOrderItemTransactions } from "@@/server/utils/orderItemTransactions";
import { requireCurrentAdmin } from "@@/server/utils/session";

type CreateTransactionBody = {
  order_item_transaction_order?: string;
};

export default defineEventHandler(async (event) => {
  const admin = await requireCurrentAdmin(event);
  const body = await readBody<CreateTransactionBody>(event);
  const orderUuid = String(body.order_item_transaction_order || "").trim();

  if (!orderUuid) {
    throw createError({ statusCode: 400, statusMessage: "Order uuid is required" });
  }

  const db = useDb();
  const client = await db.connect();

  try {
    await client.query("BEGIN");
    const orderResult = await client.query(
      `SELECT uuid::text AS uuid, order_status
       FROM tb_shopping_orders
       WHERE uuid::text = $1
         AND deleted_at IS NULL
       LIMIT 1
       FOR UPDATE`,
      [orderUuid],
    );
    const order = orderResult.rows[0];

    if (!order) {
      throw createError({ statusCode: 404, statusMessage: "Order was not found" });
    }
    if (order.order_status !== "completed") {
      throw createError({
        statusCode: 409,
        statusMessage: "Only completed orders can be posted as sales transactions",
      });
    }

    const rows = await createOrderItemTransactions(client, {
      createdBy: admin.uuid,
      orderUuid,
    });
    await client.query("COMMIT");

    return { rows, created: rows.length };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});
