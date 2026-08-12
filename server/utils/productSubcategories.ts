import type { PoolClient } from "pg";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizeProductSubcategoryIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return [
    ...new Set(
      value
        .map((item) => {
          if (typeof item === "string" || typeof item === "number") {
            return String(item).trim();
          }

          if (item && typeof item === "object" && "uuid" in item) {
            return String((item as { uuid?: unknown }).uuid || "").trim();
          }

          return "";
        })
        .filter(Boolean),
    ),
  ];
}

export async function syncProductSubcategories(
  client: PoolClient,
  productUuid: string,
  categoryUuid: string,
  subcategoryIds: string[],
  adminUuid: string,
) {
  if (
    !UUID_PATTERN.test(productUuid) ||
    !UUID_PATTERN.test(categoryUuid) ||
    subcategoryIds.some((uuid) => !UUID_PATTERN.test(uuid))
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "ข้อมูลหมวดหมู่ย่อยไม่ถูกต้อง",
    });
  }

  if (subcategoryIds.length) {
    const validResult = await client.query<{ uuid: string }>(
      `SELECT uuid::text AS uuid
       FROM tb_master_subcategories
       WHERE uuid = ANY($1::uuid[])
         AND subcategory_category = $2::uuid
         AND deleted_at IS NULL`,
      [subcategoryIds, categoryUuid],
    );
    const validIds = new Set(validResult.rows.map((row) => row.uuid));

    if (subcategoryIds.some((uuid) => !validIds.has(uuid))) {
      throw createError({
        statusCode: 400,
        statusMessage:
          "มีหมวดหมู่ย่อยที่ไม่อยู่ในหมวดหมู่หลักที่เลือก หรือถูกลบไปแล้ว",
      });
    }
  }

  await client.query(
    "DELETE FROM tb_product_subcategories WHERE product_uuid = $1::uuid",
    [productUuid],
  );

  if (!subcategoryIds.length) return;

  await client.query(
    `INSERT INTO tb_product_subcategories
      (product_uuid, subcategory_uuid, sort_order, created_by)
     SELECT $1::uuid, selected.uuid, (selected.sort_order - 1)::integer, $3
     FROM unnest($2::uuid[]) WITH ORDINALITY AS selected(uuid, sort_order)`,
    [productUuid, subcategoryIds, adminUuid],
  );
}
