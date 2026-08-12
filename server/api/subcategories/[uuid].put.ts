import { useDb } from "@@/server/utils/db";
import { requireCurrentAdmin } from "@@/server/utils/session";

type SubcategoryBody = {
  subcategory_category?: string;
  subcategory_name?: string;
  image_url?: string;
};

export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, "uuid");
  const body = await readBody<SubcategoryBody>(event);
  const admin = await requireCurrentAdmin(event);
  const db = useDb();
  const subcategoryCategory = String(body.subcategory_category || "").trim();
  const subcategoryName = String(body.subcategory_name || "").trim();
  const imageUrl = String(body.image_url || "").trim();

  if (!uuid || !subcategoryCategory || !subcategoryName) {
    throw createError({
      statusCode: 400,
      statusMessage: "ข้อมูลหมวดหมู่ย่อยไม่ครบถ้วน",
    });
  }

  if (subcategoryName.length > 100) {
    throw createError({
      statusCode: 400,
      statusMessage: "ชื่อหมวดหมู่ย่อยต้องไม่เกิน 100 ตัวอักษร",
    });
  }

  try {
    const result = await db.query(
      `UPDATE tb_master_subcategories AS base
       SET subcategory_category = $1::uuid,
           subcategory_name = $2,
           image_url = $3,
           updated_by = $4,
           updated_at = NOW(),
           deleted_by = NULL,
           deleted_at = NULL
       WHERE base.uuid = $5::uuid
         AND EXISTS (
           SELECT 1 FROM tb_master_categories
           WHERE uuid = $1::uuid AND deleted_at IS NULL
         )
       RETURNING base.*`,
      [subcategoryCategory, subcategoryName, imageUrl, admin.uuid, uuid],
    );

    if (!result.rowCount) {
      throw createError({
        statusCode: 404,
        statusMessage: "ไม่พบหมวดหมู่ย่อยหรือหมวดหมู่หลักที่เลือก",
      });
    }

    return { row: result.rows[0] };
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error) {
      if (error.code === "23505") {
        throw createError({
          statusCode: 409,
          statusMessage: "มีชื่อหมวดหมู่ย่อยนี้ในหมวดหมู่หลักแล้ว",
        });
      }
      if (error.code === "22P02") {
        throw createError({
          statusCode: 400,
          statusMessage: "รหัสข้อมูลไม่ถูกต้อง",
        });
      }
    }

    throw error;
  }
});
