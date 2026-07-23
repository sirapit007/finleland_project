import { useDb } from "@@/server/utils/db";
import { requireCurrentAdmin } from "@@/server/utils/session";

type ProductBody = {
  product_code?: string;
  product_name?: string;
  product_supplier?: string;
  product_category?: string;
  product_cost_price?: number;
  product_selling_price?: number;
  image_url?: string;
  user?: object;
};

export default defineEventHandler(async (event) => {
  const tableName = "tb_master_products";

  const body = await readBody<ProductBody>(event);
  const db = useDb();
  const admin = await requireCurrentAdmin(event);

  const product_code = String(body.product_code || "").trim();
  const product_name = String(body.product_name || "").trim();
  const product_supplier = String(body.product_supplier || "").trim();
  const product_category = String(body.product_category || "").trim();
  const product_cost_price = Number(body.product_cost_price || 0);
  const product_selling_price = Number(body.product_selling_price || 0);
  const image_url = String(body.image_url || "").trim();

  if (
    !product_code ||
    !product_name ||
    !product_category
  ) {
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
    `INSERT INTO ${tableName} (product_code, product_name, product_supplier, product_category, product_cost_price, product_selling_price, image_url, created_by)
    VALUES($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      product_code,
      product_name,
      product_supplier,
      product_category,
      product_cost_price,
      product_selling_price,
      image_url,
      admin.uuid,
    ],
  );

  return {
    row: result.rows[0],
  };
});
