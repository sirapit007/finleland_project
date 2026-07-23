import { useDb } from "@@/server/utils/db";
import { requireCurrentAdmin } from "@@/server/utils/session";

type PromotionTypeBody = {
  promotion_type_code?: string;
  promotion_type_name?: string;
  promotion_type_description?: string;
  user?: object;
};

export default defineEventHandler(async (event) => {
  const tableName = "tb_master_promotion_types";

  const db = useDb();
  const body = await readBody<PromotionTypeBody>(event);
  const admin = await requireCurrentAdmin(event);

  const promotion_type_code = String(body.promotion_type_code || "").trim();
  const promotion_type_name = String(body.promotion_type_name || "").trim();
  const promotion_type_description = String(body.promotion_type_description || "").trim();

  if (!promotion_type_name || !promotion_type_name || !promotion_type_name) {
    throw createError({
      statusCode: 400,
      statusMessage: "Promotion type code, name and description is required",
    });
  }

  const result = await db.query(
    `INSERT INTO ${tableName} (promotion_type_code, promotion_type_name, promotion_type_description, created_by)
    VALUES($1, $2, $3, $4)
     RETURNING *`,
    [promotion_type_code, promotion_type_name, promotion_type_description, admin.uuid],
  );

  return {
    row: result.rows[0],
  };
});
