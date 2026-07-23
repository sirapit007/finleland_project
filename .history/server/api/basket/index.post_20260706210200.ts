import { useDb } from "@@/server/utils/db";

type BasketBody = {
  basket_product?: string;
  basket_quantity?: number;
  basket_total?: number;
  basket_expire?: string;
  user?: object;
};

export default defineEventHandler(async (event) => {
  const tableName = "tb_shopping_basket";
  const body = await readBody<BasketBody>(event);
  const db = useDb();

  const basket_product = String(body.basket_product || "").trim();
  const basket_quantity = Number(body.basket_quantity || 0);
  const basket_total = Number(body.basket_total || 0);
  const basket_expire = body.basket_expire ? String(body.basket_expire).trim() : null;
  const user: any = body.user || "";

  if (!basket_product || basket_quantity <= 0 || basket_total <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Product, quantity and total are required",
    });
  }

  const result = await db.query(
    `INSERT INTO ${tableName}
      (basket_product, basket_quantity, basket_total, basket_expire, created_by, created_at)
     VALUES
      ($1, $2, $3, COALESCE($4::timestamptz, now() + '7 days'::interval), $5, now())
     RETURNING *`,
    [basket_product, basket_quantity, basket_total, basket_expire, user.uuid],
  );

  return {
    row: result.rows[0],
  };
});
