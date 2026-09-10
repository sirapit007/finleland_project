import { useDb } from "@@/server/utils/db";
import { assertOrderItemsAreEditable } from "@@/server/utils/orderItemAdjustments";
import { refreshOrderTotals } from "@@/server/utils/orderTotals";
import { requireCurrentAdmin } from "@@/server/utils/session";

export default defineEventHandler(async (event) => {
  const admin = await requireCurrentAdmin(event);
  const orderUuid = String(getRouterParam(event, "uuid") || "").trim();
  if (!orderUuid)
    throw createError({
      statusCode: 400,
      statusMessage: "Order uuid is required",
    });
  const client = await useDb().connect();
  try {
    await client.query("BEGIN");
    await assertOrderItemsAreEditable(client, orderUuid);
    const row = await refreshOrderTotals(client, orderUuid, admin.uuid, {
      removeCoupon: true,
    });
    await client.query("COMMIT");
    return { row };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});
