import { useDb } from "@@/server/utils/db";

type ProductBody = {
  uuid?: string;
  demo_rack?: string;
  demo_amount?: string;
  demo_price?: string;
  demo_comment?: number | string;
  demo_unit?: string;
  deleted_by?: string;
  user?: object;
};

export default defineEventHandler(async (event) => {
  const db = useDb();
  const uuid = getRouterParam(event, "uuid");
  const body = await readBody<ProductBody>(event);

  if (!uuid) {
    throw createError({
      statusCode: 400,
      statusMessage: "Product uuid is required",
    });
  }

  const demoRack = String(body.demo_rack || "").trim();
  const demoAmount = Number(body.demo_amount || 0);
  const demoPrice = Number(body.demo_price || 0);
  const demoComment = String(body.demo_comment || "").trim();
  const deletedBy = body.deleted_by
    ? String(body.deleted_by || "").trim()
    : null;
  const deletedAt = deletedBy ? new Date() : null;
  const user: any = body.user || "";

  if (!Number.isFinite(demoAmount) || demoAmount < 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Product min must be a number greater than or equal to 0",
    });
  }

  const result = await db.query(
    `UPDATE tb_product_transactions_demo
    SET demo_rack = $1, demo_amount = $2, demo_price = $3, demo_comment = $4, updated_by = $5, updated_at = now(), deleted_by = $6, deleted_at = $7
    WHERE uuid = $8
     RETURNING *`,
    [
      demoRack,
      demoAmount,
      demoPrice,
      demoComment,
      user.uuid,
      deletedBy,
      deletedAt,
      uuid,
    ],
  );

  return {
    row: result.rows[0],
  };
});
