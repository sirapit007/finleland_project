import { useDb } from "@@/server/utils/db";

type ProductBody = {
  uuid?: string;
  demo_owner?: string;
  demo_code?: string;
  demo_name?: string;
  demo_min?: number | string;
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

  const demoOwner = String(body.demo_owner || "").trim();
  const demoCode = String(body.demo_code || "").trim();
  const demoName = String(body.demo_name || "").trim();
  const demoMin = Number(body.demo_min || 0);
  const demoUnit = String(body.demo_unit || "").trim();
  const deletedBy = body.deleted_by
    ? String(body.deleted_by || "").trim()
    : null;
  const deletedAt = deletedBy ? new Date() : null;
  const user: any = body.user || "";

  if (!Number.isFinite(demoMin) || demoMin < 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Product min must be a number greater than or equal to 0",
    });
  }

  const result = await db.query(
    `UPDATE tb_all_products_demo
    SET demo_owner = $1, demo_code = $2, demo_name = $3, demo_min = $4, demo_unit = $5, updated_by = $6, updated_at = now(), deleted_by = $7, deleted_at = $8
    WHERE uuid = $9
     RETURNING *`,
    [
      demoOwner,
      demoCode,
      demoName,
      demoMin,
      demoUnit,
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
