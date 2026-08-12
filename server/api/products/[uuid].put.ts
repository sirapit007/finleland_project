import { useDb } from "@@/server/utils/db";
import {
  normalizeProductImageUrls,
  serializeProductImageUrls,
} from "@@/server/utils/productImages";
import {
  normalizeProductSubcategoryIds,
  syncProductSubcategories,
} from "@@/server/utils/productSubcategories";
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
  image_url?: unknown;
};

export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, "uuid");
  const body = await readBody<ProductBody>(event);
  const db = useDb();
  const admin = await requireCurrentAdmin(event);

  if (!uuid) {
    throw createError({
      statusCode: 400,
      statusMessage: "Product uuid is required",
    });
  }

  const productCode = String(body.product_code || "").trim();
  const productName = String(body.product_name || "").trim();
  const productDescription = String(body.product_description || "").trim();
  const productSupplier = String(body.product_supplier || "").trim();
  const productCategory = String(body.product_category || "").trim();
  const productSubcategories = normalizeProductSubcategoryIds(
    body.product_subcategories,
  );
  const shouldSyncSubcategories = Object.prototype.hasOwnProperty.call(
    body,
    "product_subcategories",
  );
  const productCostPrice = Number(body.product_cost_price || 0);
  const productSellingPrice = Number(body.product_selling_price || 0);
  const imageUrl = serializeProductImageUrls(body.image_url);

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
      "UPDATE tb_master_products SET product_code = $1, product_name = $2, product_description = $3, product_supplier = $4, product_category = $5, product_cost_price = $6, product_selling_price = $7, image_url = $8, updated_by = $9, updated_at = NOW(), deleted_by = NULL, deleted_at = NULL WHERE uuid = $10::uuid RETURNING *",
      [
        productCode,
        productName,
        productDescription,
        productSupplier,
        productCategory,
        productCostPrice,
        productSellingPrice,
        imageUrl,
        admin.uuid,
        uuid,
      ],
    );

    if (!result.rowCount) {
      throw createError({
        statusCode: 404,
        statusMessage: "ไม่พบสินค้าที่ต้องการแก้ไข",
      });
    }

    savedProduct = result.rows[0];

    if (shouldSyncSubcategories) {
      await syncProductSubcategories(
        client,
        uuid,
        productCategory,
        productSubcategories,
        admin.uuid,
      );
    }
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
      ...(shouldSyncSubcategories
        ? { product_subcategories: productSubcategories }
        : {}),
    },
  };
});
