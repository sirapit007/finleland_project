import { useDb } from "@@/server/utils/db";

type ProductBody = {
  product_code?: string;
  product_name?: string;
  product_supplier?: string;
  product_category?: string;
  product_cost_price?: number;
  product_selling_price?: number;
  image_url?: string;
  deleted_by?: string;
  user?: object;
};

export default defineEventHandler(async (event) => {
  const tableName = "tb_master_products";

  const db = useDb();
  const uuid = getRouterParam(event, "uuid");
  const body = await readBody<ProductBody>(event);

  if (!uuid) {
    throw createError({
      statusCode: 400,
      statusMessage: "Product uuid is required",
    });
  }

  const product_code = String(body.product_code || "").trim();
  const product_name = String(body.product_name || "").trim();
  const product_supplier = String(body.product_supplier || "").trim();
  const product_category = String(body.product_category || "").trim();
  const product_cost_price = Number(body.product_cost_price || 0);
  const product_selling_price = Number(body.product_selling_price || 0);
  const image_url = String(body.image_url || "").trim();
  const deleted_by = null;
  const deleted_at = null;
  const user: any = body.user || "";

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

  const result = await db.query(
    `UPDATE ${tableName}
    SET product_code = $1
    , product_name = $2
    , product_supplier = $3
    , product_category = $4
    , product_cost_price = $5
    , product_selling_price = $6
    , image_url = $7
    , updated_by = $8
    , updated_at = now()
    , deleted_by = $9
    , deleted_at = $10
    WHERE uuid = $11
     RETURNING *`,
    [
      product_code,
      product_name,
      product_supplier,
      product_category,
      product_cost_price,
      product_selling_price,
      image_url,
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
