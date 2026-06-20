import { useDb } from "@@/server/utils/db";

type PromotionBody = {
  promotion_product?: string;
  promotion_type?: string;
  promotion_name?: string;
  promotion_description?: string;
  promotion_is_active?: boolean;
  promotion_start_date?: string;
  promotion_end_date?: string;
  promotion_discounted_price?: number;
  promotion_min_quantity?: number;
  promotion_min_purchase_amount?: number;
  promotion_bundle_price?: number;
  user?: object;
};

export default defineEventHandler(async (event) => {
  const tableName = "tb_event_promotions";

  const db = useDb();
  const uuid = getRouterParam(event, "uuid");
  const body = await readBody<PromotionBody>(event);
  
  if (!uuid) {
    throw createError({
      statusCode: 400,
      statusMessage: "Promotion uuid is required",
    });
  }

  const promotion_product = String(body.promotion_product || "").trim();
  const promotion_type = String(body.promotion_type || "").trim();
  const promotion_name = String(body.promotion_name || "").trim();
  const promotion_description = String(body.promotion_description || "").trim();
  const promotion_is_active = body.promotion_is_active || false;
  const promotion_start_date = String(body.promotion_start_date || "").trim();
  const promotion_end_date = String(body.promotion_end_date || "").trim();
  const promotion_discounted_price = body.promotion_discounted_price || 0;
  const promotion_min_quantity = body.promotion_min_quantity || 0;
  const promotion_min_purchase_amount = body.promotion_min_purchase_amount || 0;
  const promotion_bundle_price = body.promotion_bundle_price || 0;
  const deleted_by = null;
  const deleted_at = null;
  const user: any = body.user || "";

  if (
    !promotion_product ||
    !promotion_type ||
    !promotion_name ||
    !promotion_description ||
    !promotion_start_date ||
    !promotion_end_date
  ) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "Promotion code, name, description, start date and end date is required",
    });
  }

  const result = await db.query(
    `UPDATE ${tableName}
    SET promotion_product = $1
    , promotion_type = $2
    , promotion_name = $3
    , promotion_description = $4
    , promotion_is_active = $5
    , promotion_start_date = $6
    , promotion_end_date = $7
    , promotion_discounted_price = $8
    , promotion_min_quantity = $9
    , promotion_min_purchase_amount = $10
    , promotion_bundle_price = $11
    , updated_by = $12
    , updated_at = now()
    , deleted_by = $13
    , deleted_at = $14
    WHERE uuid = $15
     RETURNING *`,
    [
      promotion_product,
      promotion_type,
      promotion_name,
      promotion_description,
      promotion_is_active,
      promotion_start_date,
      promotion_end_date,
      promotion_discounted_price,
      promotion_min_quantity,
      promotion_min_purchase_amount,
      promotion_bundle_price,
      user.uuid,
      deleted_by,
      deleted_at,
      uuid,
    ],
  );

  return {
    row: result.rows[0],
  };
});
