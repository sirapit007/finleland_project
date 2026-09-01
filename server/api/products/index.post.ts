import { useDb } from "@@/server/utils/db";
import {
  normalizeProductImageUrls,
  serializeProductImageUrls,
} from "@@/server/utils/productImages";
import {
  normalizeProductSubcategoryIds,
  syncProductSubcategories,
} from "@@/server/utils/productSubcategories";
import { normalizeProductShippingMeasurements } from "@@/server/utils/productShipping";
import { requireCurrentAdmin } from "@@/server/utils/session";

type ProductBody = {
  product_code?: string;
  product_name?: string;
  product_description?: string;
  product_supplier?: string;
  product_category?: string;
  product_subcategories?: unknown;
  product_cost_price?: number;
  product_selling_price?: number;
  product_shipping_weight_grams?: unknown;
  product_shipping_length_cm?: unknown;
  product_shipping_width_cm?: unknown;
  product_shipping_height_cm?: unknown;
  image_url?: unknown;
};

export default defineEventHandler(async (event) => {
  const body = await readBody<ProductBody>(event);
  const db = useDb();
  const admin = await requireCurrentAdmin(event);
  const productCode = String(body.product_code || "").trim();
  const productName = String(body.product_name || "").trim();
  const productDescription = String(body.product_description || "").trim();
  const productSupplier = String(body.product_supplier || "").trim();
  const productCategory = String(body.product_category || "").trim();
  const productSubcategories = normalizeProductSubcategoryIds(
    body.product_subcategories,
  );
  const productCostPrice = Number(body.product_cost_price || 0);
  const productSellingPrice = Number(body.product_selling_price || 0);
  const imageUrl = serializeProductImageUrls(body.image_url);
  const shipping = normalizeProductShippingMeasurements(body);

  if (!productCode || !productName || !productCategory) {
    throw createError({
      statusCode: 400,
      statusMessage: "Product code, name, and category are required",
    });
  }

  if (!Number.isFinite(productSellingPrice) || productSellingPrice < 0) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "Product selling price must be a number greater than or equal to 0",
    });
  }

  const client = await db.connect();
  let savedProduct: Record<string, any> = {};

  try {
    await client.query("BEGIN");
    const result = await client.query(
      `INSERT INTO tb_master_products (
        product_code, product_name, product_description, product_supplier,
        product_category, product_cost_price, product_selling_price, image_url,
        product_shipping_weight_grams, product_shipping_length_cm,
        product_shipping_width_cm, product_shipping_height_cm, created_by
      ) VALUES(
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
      ) RETURNING *`,
      [
        productCode,
        productName,
        productDescription,
        productSupplier,
        productCategory,
        productCostPrice,
        productSellingPrice,
        imageUrl,
        shipping.weightGrams,
        shipping.lengthCm,
        shipping.widthCm,
        shipping.heightCm,
        admin.uuid,
      ],
    );
    savedProduct = result.rows[0];

    await syncProductSubcategories(
      client,
      String(savedProduct.uuid),
      productCategory,
      productSubcategories,
      admin.uuid,
    );
    await client.query("COMMIT");
  } catch (error: unknown) {
    await client.query("ROLLBACK");

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
  } finally {
    client.release();
  }

  return {
    row: {
      ...savedProduct,
      image_url: normalizeProductImageUrls(savedProduct.image_url),
      product_subcategories: productSubcategories,
    },
  };
});
