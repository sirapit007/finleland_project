import { useDb } from "@@/server/utils/db";
import {
  assertOrderItemsAreEditable,
  recordOrderItemAdjustment,
} from "@@/server/utils/orderItemAdjustments";
import { refreshOrderTotals } from "@@/server/utils/orderTotals";
import { requireCurrentAdmin } from "@@/server/utils/session";

type OrderItemBody = {
  user?: { uuid?: string };
};

export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, "uuid");
  const body = await readBody<OrderItemBody>(event);
  const admin = await requireCurrentAdmin(event);
  const userUuid = admin.uuid;

  if (!uuid) {
    throw createError({
      statusCode: 400,
      statusMessage: "Order item uuid is required",
    });
  }

  const db = useDb();
  const client = await db.connect();

  try {
    await client.query("BEGIN");
    const currentResult = await client.query(
      `SELECT *
       FROM tb_shopping_order_items
       WHERE uuid::text = $1
         AND deleted_at IS NULL
       LIMIT 1
       FOR UPDATE`,
      [uuid],
    );
    const current = currentResult.rows[0];

    if (!current) {
      throw createError({ statusCode: 404, statusMessage: "Order item was not found" });
    }

    await assertOrderItemsAreEditable(
      client,
      String(current.order_item_order),
    );

    const result = await client.query(
      `UPDATE tb_shopping_order_items
     SET updated_by = $1,
         updated_at = NOW(),
         deleted_by = $1,
         deleted_at = NOW()
     WHERE uuid::text = $2
       AND deleted_at IS NULL
     RETURNING *`,
      [userUuid, uuid],
    );
    const adjustment = await recordOrderItemAdjustment(client, {
      action: "removed",
      before: current,
      itemUuid: uuid,
      note: "Admin removed this item from the order",
      orderUuid: String(current.order_item_order),
      userUuid,
    });
    const order = await refreshOrderTotals(
      client,
      String(current.order_item_order),
      userUuid,
    );

    await client.query("COMMIT");
    return { row: result.rows[0] || null, order, adjustment };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});
