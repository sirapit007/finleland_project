import { useDb } from "@@/server/utils/db";
import { requireCurrentAdmin } from "@@/server/utils/session";

type OrderBody = {
  user?: { uuid?: string };
};

export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, "uuid");
  const body = await readBody<OrderBody>(event);
  const admin = await requireCurrentAdmin(event);
  const userUuid = admin.uuid;

  if (!uuid) {
    throw createError({
      statusCode: 400,
      statusMessage: "Order uuid is required",
    });
  }

  const db = useDb();
  const client = await db.connect();

  try {
    await client.query("BEGIN");
    const result = await client.query(
      `UPDATE tb_shopping_orders
       SET updated_by = $1,
           updated_at = NOW(),
           deleted_by = $1,
           deleted_at = NOW()
       WHERE uuid::text = $2
         AND deleted_at IS NULL
       RETURNING *`,
      [userUuid, uuid],
    );

    if (!result.rows[0]) {
      throw createError({ statusCode: 404, statusMessage: "Order was not found" });
    }

    await client.query(
      `UPDATE tb_shopping_order_items
       SET updated_by = $1,
           updated_at = NOW(),
           deleted_by = $1,
           deleted_at = NOW()
       WHERE order_item_order = $2
         AND deleted_at IS NULL`,
      [userUuid, uuid],
    );

    await client.query("COMMIT");
    return { row: result.rows[0] };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});
