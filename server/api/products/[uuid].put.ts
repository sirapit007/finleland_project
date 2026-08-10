import { useDb } from "@@/server/utils/db";
import {
  normalizeProductImageUrls,
  serializeProductImageUrls,
} from "@@/server/utils/productImages";
import { requireCurrentAdmin } from "@@/server/utils/session";

type ProductBody = {
  product_code?: string;
  product_name?: string;
  product_description?: string;
  product_supplier?: string;
  product_category?: string;
  product_cost_price?: number;
  product_selling_price?: number;
  image_url?: unknown;
  deleted_by?: string;
  user?: object;
};

export default defineEventHandler(async (event) => {
  const tableName = "tb_master_products";

  const db = useDb();
  const uuid = getRouterParam(event, "uuid");
  const body = await readBody<ProductBody>(event);
  const admin = await requireCurrentAdmin(event);

  if (!uuid) {
    throw createError({
      statusCode: 400,
      statusMessage: "Product uuid is required",
    });
  }

  const product_code = String(body.product_code || "").trim();
  const product_name = String(body.product_name || "").trim();
  const product_description = String(body.product_description || "").trim();
  const product_supplier = String(body.product_supplier || "").trim();
  const product_category = String(body.product_category || "").trim();
  const product_cost_price = Number(body.product_cost_price || 0);
  const product_selling_price = Number(body.product_selling_price || 0);
  const image_url = serializeProductImageUrls(body.image_url);
  const deleted_by = null;
  const deleted_at = null;

  if (!product_code || !product_name || !product_category) {
    throw createError({
      statusCode: 400,
      statusMessage: "Product code, name, and category are required",
    });
  }

  if (!Number.isFinite(product_selling_price) || product_selling_price < 0) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "Product selling price must be a number greater than or equal to 0",
    });
  }

  let result;

  try {
    result = await db.query(
      `UPDATE ${tableName}
    SET product_code = $1
    , product_name = $2
    , product_description = $3
    , product_supplier = $4
    , product_category = $5
    , product_cost_price = $6
    , product_selling_price = $7
    , image_url = $8
    , updated_by = $9
    , updated_at = now()
    , deleted_by = $10
    , deleted_at = $11
    WHERE uuid = $12
     RETURNING *`,
      [
        product_code,
        product_name,
        product_description,
        product_supplier,
        product_category,
        product_cost_price,
        product_selling_price,
        image_url,
        admin.uuid,
        deleted_by,
        deleted_at,
        uuid,
      ],
    );
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "23505"
    ) {
      throw createError({
        statusCode: 409,
        statusMessage: "รหัสสินค้านี้ถูกใช้ไปแล้ว กรุณาใช้รหัสสินค้าอื่น",
      });
    }

    throw error;
  }

  return {
    row: {
      ...result.rows[0],
      image_url: normalizeProductImageUrls(result.rows[0]?.image_url),
    },
  };
});
