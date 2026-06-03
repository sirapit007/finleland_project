import { useDb } from "@@/server/utils/db";

type ProductBody = {
  all_products_demo_uuid?: string;
  demo_status?: string;
  demo_rack?: string;
  demo_amount?: number;
  demo_price?: number;
  demo_comment?: string;
  user?: object;
};

export default defineEventHandler(async (event) => {
  const body = await readBody<ProductBody>(event);
  const db = useDb();

  const allProductsDemo = String(body.all_products_demo_uuid || "").trim();
  const demoStatus = String(body.demo_status || "").trim();
  const demoRack = String(body.demo_rack || "").trim();
  const demoAmount = Number(body.demo_amount || 0);
  const demoPrice = Number(body.demo_price || 0);
  const demoComment = String(body.demo_comment || "").trim();;
  const user: any = body.user || "";

  if (!Number.isFinite(demoAmount) || demoAmount < 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Product min must be a number greater than or equal to 0",
    });
  }

  const result = await db.query(
    `INSERT INTO tb_product_transactions_demo (all_products_demo_uuid, demo_status, demo_rack, demo_amount, demo_price, demo_comment, created_by, created_at)
    VALUES($1, $2, $3, $4, $5, $6, $7, now())
     RETURNING *`,
    [allProductsDemo, demoStatus, demoRack, demoAmount, demoPrice, demoComment, user.uuid],
  );

  return {
    row: result.rows[0],
  };
});
