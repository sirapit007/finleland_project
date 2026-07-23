import { useDb } from "@@/server/utils/db";
import {
  assertOrderItemsAreEditable,
  recordOrderItemAdjustment,
} from "@@/server/utils/orderItemAdjustments";
import { refreshOrderTotals } from "@@/server/utils/orderTotals";
import { requireCurrentAdmin } from "@@/server/utils/session";

type OrderItemBody = {
  order_item_order?: string;
  order_item_product?: string;
  order_item_product_code?: string;
  order_item_product_name?: string;
  order_item_product_image?: string;
  order_item_unit_price?: number;
  order_item_quantity?: number;
  order_item_discount?: number;
  order_item_promotion?: string;
  order_item_promotion_name?: string;
  user?: { uuid?: string };
};

const toMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export default defineEventHandler(async (event) => {
  const body = await readBody<OrderItemBody>(event);
  const admin = await requireCurrentAdmin(event);
  const userUuid = admin.uuid;
  const orderUuid = String(body.order_item_order || "").trim();
  const productUuid = String(body.order_item_product || "").trim();
  const productCode = String(body.order_item_product_code || "").trim();
  const productName = String(body.order_item_product_name || "").trim();
  const unitPrice = toMoney(Number(body.order_item_unit_price || 0));
  const quantity = Math.floor(Number(body.order_item_quantity || 0));
  const discount = toMoney(Number(body.order_item_discount || 0));

  if (!orderUuid || !productUuid || !productCode || !productName) {
    throw createError({
      statusCode: 400,
      statusMessage: "Order, product, and user fields are required",
    });
  }
  if (
    !Number.isFinite(unitPrice) ||
    !Number.isFinite(quantity) ||
    !Number.isFinite(discount) ||
    quantity <= 0 ||
    unitPrice < 0
  ) {
    throw createError({ statusCode: 400, statusMessage: "Order item amount is invalid" });
  }

  const subtotal = toMoney(unitPrice * quantity);
  if (discount < 0 || discount > subtotal) {
    throw createError({ statusCode: 400, statusMessage: "Order item discount is invalid" });
  }

  const db = useDb();
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    await assertOrderItemsAreEditable(client, orderUuid);

    const result = await client.query(
      `INSERT INTO tb_shopping_order_items (
      order_item_order,
      order_item_product,
      order_item_product_code,
      order_item_product_name,
      order_item_product_image,
      order_item_unit_price,
      order_item_quantity,
      order_item_subtotal,
      order_item_discount,
      order_item_total,
      order_item_promotion,
      order_item_promotion_name,
      created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *`,
      [
        orderUuid,
        productUuid,
        productCode,
        productName,
        String(body.order_item_product_image || "").trim() || null,
        unitPrice,
        quantity,
        subtotal,
        discount,
        toMoney(subtotal - discount),
        String(body.order_item_promotion || "").trim() || null,
        String(body.order_item_promotion_name || "").trim() || null,
        userUuid,
      ],
    );
    const adjustment = await recordOrderItemAdjustment(client, {
      action: "added",
      after: result.rows[0],
      itemUuid: String(result.rows[0].uuid),
      note: "Admin added an item to this order",
      orderUuid,
      userUuid,
    });
    const order = await refreshOrderTotals(client, orderUuid, userUuid);

    await client.query("COMMIT");
    return { row: result.rows[0], order, adjustment };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});
