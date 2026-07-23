import { useDb } from "@@/server/utils/db";
import { requireCurrentAdmin } from "@@/server/utils/session";

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
  image_url?: string;
  user?: object;
};

export default defineEventHandler(async (event) => {
  const tableName = "tb_event_promotions";

  const db = useDb();
  const body = await readBody<PromotionBody>(event);
  const admin = await requireCurrentAdmin(event);

  const promotion_product = String(body.promotion_product || "").trim();
  const promotion_type = String(body.promotion_type || "").trim();
  const promotion_name = String(body.promotion_name || "").trim();
  const promotion_description = String(body.promotion_description || "").trim();
  const promotion_start_date = String(body.promotion_start_date || "").trim();
  const promotion_end_date = String(body.promotion_end_date || "").trim();
  const promotion_discounted_price = body.promotion_discounted_price || 0;
  const promotion_min_quantity = body.promotion_min_quantity || 0;
  const promotion_min_purchase_amount = body.promotion_min_purchase_amount || 0;
  const promotion_bundle_price = body.promotion_bundle_price || 0;
  const image_url = String(body.image_url || "").trim();

  if (
    !promotion_product ||
    !promotion_type ||
    !promotion_name ||
    !promotion_start_date ||
    !promotion_end_date
  ) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "Promotion code, name, start date and end date is required",
    });
  }

  const result = await db.query(
    `INSERT INTO ${tableName} (promotion_product, promotion_type, promotion_name, promotion_description, promotion_start_date, promotion_end_date, promotion_discounted_price, promotion_min_quantity, promotion_min_purchase_amount, promotion_bundle_price, image_url, created_by)
    VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [
      promotion_product,
      promotion_type,
      promotion_name,
      promotion_description,
      promotion_start_date,
      promotion_end_date,
      promotion_discounted_price,
      promotion_min_quantity,
      promotion_min_purchase_amount,
      promotion_bundle_price,
      image_url,
      admin.uuid,
    ],
  );

  return {
    row: result.rows[0],
  };
});
