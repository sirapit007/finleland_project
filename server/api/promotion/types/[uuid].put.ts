import { useDb } from "@@/server/utils/db";

type PromotionTypeBody = {
  promotion_type_code?: string;
  promotion_type_name?: string;
  promotion_type_description?: string;
  promotion_type_is_active?: boolean;
  user?: object;
};

export default defineEventHandler(async (event) => {
  const tableName = "tb_master_promotion_types";

  const db = useDb();
  const uuid = getRouterParam(event, "uuid");
  const body = await readBody<PromotionTypeBody>(event);

  if (!uuid) {
    throw createError({
      statusCode: 400,
      statusMessage: "Promotion type uuid is required",
    });
  }

  const promotion_type_code = String(body.promotion_type_code || "").trim();
  const promotion_type_name = String(body.promotion_type_name || "").trim();
  const promotion_type_description = String(body.promotion_type_description || "").trim();
  const promotion_type_is_active = (body.promotion_type_is_active || false);
  const deleted_by = null;
  const deleted_at = null;
  const user: any = body.user || "";

  if (!promotion_type_name || !promotion_type_name || !promotion_type_name) {
    throw createError({
      statusCode: 400,
      statusMessage: "Promotion type code, name, description is required",
    });
  }

  const result = await db.query(
    `UPDATE ${tableName}
    SET promotion_type_code = $1, promotion_type_name = $2, promotion_type_description = $3, promotion_type_is_active = $4, updated_by = $5, updated_at = now(), deleted_by = $6, deleted_at = $7
    WHERE uuid = $8
     RETURNING *`,
    [promotion_type_code, promotion_type_name, promotion_type_description, promotion_type_is_active, user.uuid, deleted_by, deleted_at, uuid],
  );

  return {
    row: result.rows[0],
  };
});
