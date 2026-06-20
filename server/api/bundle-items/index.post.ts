import { useDb } from "@@/server/utils/db";

type BundleItemsBody = {
  bundle_item_promotion?: string;
  bundle_item_product?: string;
  bundle_item_quantity?: number;
  bundle_item_unit_price?: number;
  user?: object;
};

export default defineEventHandler(async (event) => {
  const tableName = "tb_event_bundle_items";

  const db = useDb();
  const body = await readBody<BundleItemsBody>(event);

  const bundle_item_promotion = String(body.bundle_item_promotion || "").trim();
  const bundle_item_product = String(body.bundle_item_product || "").trim();
  const bundle_item_quantity = body.bundle_item_quantity || 0;
  const bundle_item_unit_price = body.bundle_item_unit_price || 0;
  const user: any = body.user || "";

  if (
    !bundle_item_promotion ||
    !bundle_item_product
  ) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "Bundle item promotion and product is required",
    });
  }

  if (!Number.isFinite(bundle_item_quantity) || bundle_item_quantity < 0 || !Number.isFinite(bundle_item_unit_price) || bundle_item_unit_price < 0) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "Bundle item quantity and unit price must be a number greater than or equal to 0",
    });
  }

  const result = await db.query(
    `INSERT INTO ${tableName} (bundle_item_promotion, bundle_item_product, bundle_item_quantity, bundle_item_unit_price, created_by)
    VALUES($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      bundle_item_promotion,
      bundle_item_product,
      bundle_item_quantity,
      bundle_item_unit_price,
      user.uuid,
    ],
  );

  return {
    row: result.rows[0],
  };
});
