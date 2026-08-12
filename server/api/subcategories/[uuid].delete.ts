import { useDb } from "@@/server/utils/db";
import { requireCurrentAdmin } from "@@/server/utils/session";

export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, "uuid");
  const admin = await requireCurrentAdmin(event);
  const db = useDb();

  if (!uuid) {
    throw createError({
      statusCode: 400,
      statusMessage: "Subcategory uuid is required",
    });
  }

  const client = await db.connect();

  try {
    await client.query("BEGIN");
    const usageResult = await client.query(
      `SELECT COUNT(*)::integer AS qty_count
       FROM tb_product_subcategories
       WHERE subcategory_uuid = $1::uuid`,
      [uuid],
    );

    if (Number(usageResult.rows[0]?.qty_count || 0) > 0) {
      throw createError({
        statusCode: 409,
        statusMessage:
          "หมวดหมู่ย่อยนี้ยังถูกใช้งานกับสินค้า กรุณานำออกจากสินค้าก่อน",
      });
    }

    const result = await client.query(
      `UPDATE tb_master_subcategories
       SET updated_by = $1,
           updated_at = NOW(),
           deleted_by = $1,
           deleted_at = NOW()
       WHERE uuid = $2::uuid AND deleted_at IS NULL
       RETURNING *`,
      [admin.uuid, uuid],
    );

    if (!result.rowCount) {
      throw createError({
        statusCode: 404,
        statusMessage: "ไม่พบหมวดหมู่ย่อยที่ต้องการลบ",
      });
    }

    await client.query("COMMIT");
    return { row: result.rows[0] };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});
