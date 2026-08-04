import { useDb } from "@@/server/utils/db";
import { requireCurrentAdmin } from "@@/server/utils/session";

export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, "uuid");
  const admin = await requireCurrentAdmin(event);
  if (!uuid) throw createError({ statusCode: 400, statusMessage: "Order tax detail uuid is required" });
  const db = useDb();
  const result = await db.query(
    `UPDATE tb_shopping_order_tax_details SET order_tax_status='cancelled', updated_by=$1, updated_at=NOW()
     WHERE uuid::text=$2 RETURNING *`,
    [admin.uuid, uuid],
  );
  if (!result.rows[0]) throw createError({ statusCode: 404, statusMessage: "Order tax detail was not found" });
  return { row: result.rows[0] };
});
