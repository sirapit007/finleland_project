import { useDb } from "@@/server/utils/db";
import { requireCurrentAdmin } from "@@/server/utils/session";

type BundleItemBody = {
  bundle_item_promotion?: string;
  bundle_item_product?: string;
  bundle_item_quantity?: number;
  bundle_item_unit_price?: number;
  user?: object;
};

export default defineEventHandler(async (event) => {
  const tableName = "tb_event_bundle_items";

  const db = useDb();
  const uuid = getRouterParam(event, "uuid");
  const body = await readBody<BundleItemBody>(event);
  const admin = await requireCurrentAdmin(event);

  if (!uuid) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bundle item uuid is required",
    });
  }

  const bundle_item_promotion = String(body.bundle_item_promotion || "").trim();
  const bundle_item_product = String(body.bundle_item_product || "").trim();
  const bundle_item_quantity = body.bundle_item_quantity || 0;
  const bundle_item_unit_price = body.bundle_item_unit_price || 0;
  const deleted_by = null;
  const deleted_at = null;

  if (!bundle_item_promotion || !bundle_item_product) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bundle item promotion and product is required",
    });
  }

  //  || !Number.isFinite(bundle_item_unit_price) || bundle_item_unit_price < 0
  if (!Number.isFinite(bundle_item_quantity) || bundle_item_quantity < 0) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "Bundle item quantity and unit price must be a number greater than or equal to 0",
    });
  }

  const result = await db.query(
    `UPDATE ${tableName}
    SET bundle_item_promotion = $1
    , bundle_item_product = $2
    , bundle_item_quantity = $3
    , bundle_item_unit_price = $4
    , updated_by = $5
    , updated_at = now()
    , deleted_by = $6
    , deleted_at = $7
    WHERE uuid = $8
     RETURNING *`,
    [
      bundle_item_promotion,
      bundle_item_product,
      bundle_item_quantity,
      bundle_item_unit_price,
      admin.uuid,
      deleted_by,
      deleted_at,
      uuid,
    ],
  );

  return {
    row: result.rows[0],
  };
});
