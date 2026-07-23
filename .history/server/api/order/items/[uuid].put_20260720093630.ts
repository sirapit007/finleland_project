import { useDb } from "@@/server/utils/db";
import {
  assertOrderItemsAreEditable,
  recordOrderItemAdjustment,
} from "@@/server/utils/orderItemAdjustments";
import { refreshOrderTotals } from "@@/server/utils/orderTotals";
import { requireCurrentAdmin } from "@@/server/utils/session";

type OrderItemBody = {
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
  const uuid = getRouterParam(event, "uuid");
  const body = await readBody<OrderItemBody>(event);
  const admin = await requireCurrentAdmin(event);
  const userUuid = admin.uuid;

  if (!uuid) {
    throw createError({
      statusCode: 400,
      statusMessage: "Order item uuid is required",
    });
  }

  const db = useDb();
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const currentResult = await client.query(
      `SELECT *
       FROM tb_shopping_order_items
       WHERE uuid::text = $1
         AND deleted_at IS NULL
       LIMIT 1
       FOR UPDATE`,
      [uuid],
    );
    const current = currentResult.rows[0];

    if (!current) {
      throw createError({ statusCode: 404, statusMessage: "Order item was not found" });
    }

    await assertOrderItemsAreEditable(
      client,
      String(current.order_item_order),
    );

    const unitPrice = toMoney(
      body.order_item_unit_price === undefined
        ? Number(current.order_item_unit_price)
        : Number(body.order_item_unit_price),
    );
    const quantity = Math.floor(
      body.order_item_quantity === undefined
        ? Number(current.order_item_quantity)
        : Number(body.order_item_quantity),
    );
    const discount = toMoney(
      body.order_item_discount === undefined
        ? Number(current.order_item_discount)
        : Number(body.order_item_discount),
    );

    if (
      !Number.isFinite(unitPrice) ||
      !Number.isFinite(quantity) ||
      !Number.isFinite(discount) ||
      unitPrice < 0 ||
      quantity <= 0
    ) {
      throw createError({ statusCode: 400, statusMessage: "Order item amount is invalid" });
    }

    const subtotal = toMoney(unitPrice * quantity);
    if (discount < 0 || discount > subtotal) {
      throw createError({ statusCode: 400, statusMessage: "Order item discount is invalid" });
    }

    const result = await client.query(
      `UPDATE tb_shopping_order_items
     SET order_item_unit_price = $1,
         order_item_quantity = $2,
         order_item_subtotal = $3,
         order_item_discount = $4,
         order_item_total = $5,
         order_item_promotion = COALESCE($6, order_item_promotion),
         order_item_promotion_name = COALESCE($7, order_item_promotion_name),
         updated_by = $8,
         updated_at = NOW()
     WHERE uuid::text = $9
       AND deleted_at IS NULL
     RETURNING *`,
      [
        unitPrice,
        quantity,
        subtotal,
        discount,
        toMoney(subtotal - discount),
        body.order_item_promotion
          ? String(body.order_item_promotion).trim()
          : null,
        body.order_item_promotion_name
          ? String(body.order_item_promotion_name).trim()
          : null,
        userUuid,
        uuid,
      ],
    );
    const adjustment = await recordOrderItemAdjustment(client, {
      action: "updated",
      after: result.rows[0],
      before: current,
      itemUuid: uuid,
      note: "Admin adjusted this order item",
      orderUuid: String(current.order_item_order),
      userUuid,
    });
    const order = await refreshOrderTotals(
      client,
      String(current.order_item_order),
      userUuid,
    );

    await client.query("COMMIT");
    return { row: result.rows[0] || null, order, adjustment };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});
