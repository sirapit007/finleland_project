import { useDb } from "@@/server/utils/db";
import { requireCurrentAdmin } from "@@/server/utils/session";

type SubcategoryBody = {
  subcategory_category?: string;
  subcategory_name?: string;
  image_url?: string;
};

export default defineEventHandler(async (event) => {
  const body = await readBody<SubcategoryBody>(event);
  const admin = await requireCurrentAdmin(event);
  const db = useDb();
  const subcategoryCategory = String(body.subcategory_category || "").trim();
  const subcategoryName = String(body.subcategory_name || "").trim();
  const imageUrl = String(body.image_url || "").trim();

  if (!subcategoryCategory || !subcategoryName) {
    throw createError({
      statusCode: 400,
      statusMessage: "กรุณาเลือกหมวดหมู่หลักและกรอกชื่อหมวดหมู่ย่อย",
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
      `INSERT INTO tb_master_subcategories
        (subcategory_category, subcategory_name, image_url, created_by)
       SELECT $1::uuid, $2, $3, $4
       WHERE EXISTS (
         SELECT 1 FROM tb_master_categories
         WHERE uuid = $1::uuid AND deleted_at IS NULL
       )
       RETURNING *`,
      [subcategoryCategory, subcategoryName, imageUrl, admin.uuid],
    );

    if (!result.rowCount) {
      throw createError({
        statusCode: 400,
        statusMessage: "ไม่พบหมวดหมู่หลักที่เลือก หรือหมวดหมู่หลักถูกลบแล้ว",
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
          statusMessage: "รหัสหมวดหมู่หลักไม่ถูกต้อง",
        });
      }
    }

    throw error;
  }
});
