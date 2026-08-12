import { useDb } from "@@/server/utils/db";
import { requireCurrentAdmin } from "@@/server/utils/session";

type CategoryBody = {
  user?: object;
};

export default defineEventHandler(async (event) => {
  const tableName = "tb_master_categories";

  const db = useDb();
  const uuid = getRouterParam(event, "uuid");
  const body = await readBody<CategoryBody>(event);
  const admin = await requireCurrentAdmin(event);

  if (!uuid) {
    throw createError({
      statusCode: 400,
      statusMessage: "Category uuid is required",
    });
  }
  const childResult = await db.query(
    "SELECT COUNT(*)::integer AS total FROM tb_master_subcategories WHERE subcategory_category = $1::uuid AND deleted_at IS NULL",
    [uuid],
  );

  if (Number(childResult.rows[0]?.total || 0) > 0) {
    throw createError({
      statusCode: 409,
      statusMessage:
        "หมวดหมู่หลักนี้ยังมีหมวดหมู่ย่อย กรุณาย้ายหรือลบหมวดหมู่ย่อยก่อน",
    });
  }

  const result = await db.query(
    `UPDATE ${tableName}
    SET updated_by = $1, updated_at = now(), deleted_by = $1, deleted_at = now()
    WHERE uuid = $2
     RETURNING *`,
    [admin.uuid, uuid],
  );

  return {
    row: result.rows[0],
  };
});
