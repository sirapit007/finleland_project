import { useDb } from "@@/server/utils/db";
import { requireCurrentUser } from "@@/server/utils/session";

type BasketBody = {
  basket_product?: string;
  basket_quantity?: number;
  basket_total?: number;
  basket_expire?: string;
  user?: object;
};

export default defineEventHandler(async (event) => {
  const tableName = "tb_shopping_basket";
  const db = useDb();
  const uuid = getRouterParam(event, "uuid");
  const body = await readBody<BasketBody>(event);
  const currentUser = await requireCurrentUser(event);

  if (!uuid) {
    throw createError({
      statusCode: 400,
      statusMessage: "Basket uuid is required",
    });
  }

  const basket_product = String(body.basket_product || "").trim();
  const basket_quantity = Number(body.basket_quantity || 0);
  const basket_total = Number(body.basket_total || 0);
  const basket_expire = body.basket_expire ? String(body.basket_expire).trim() : null;

  if (!basket_product || basket_quantity <= 0 || basket_total <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Product, quantity and total are required",
    });
  }

  const result = await db.query(
    `UPDATE ${tableName}
     SET basket_product = $1,
         basket_quantity = $2,
         basket_total = $3,
         basket_expire = COALESCE($4::timestamptz, basket_expire),
         updated_by = $5,
         updated_at = now(),
         deleted_by = $6,
         deleted_at = $7
     WHERE uuid = $8
       AND created_by = $9
     RETURNING *`,
    [basket_product, basket_quantity, basket_total, basket_expire, currentUser.uuid, null, null, uuid, currentUser.uuid],
  );

  return {
    row: result.rows[0],
  };
});
