import { useDb } from "@@/server/utils/db";

type ProductBody = {
  demo_owner?: string;
  demo_code?: string;
  demo_name?: string;
  demo_min?: number | string;
  demo_unit?: string;
  user?: object;
};

export default defineEventHandler(async (event) => {
  const body = await readBody<ProductBody>(event);
  const db = useDb();

  const demoOwner = String(body.demo_owner || "").trim();
  const demoCode = String(body.demo_code || "").trim();
  const demoName = String(body.demo_name || "").trim();
  const demoMin = Number(body.demo_min || 0);
  const demoUnit = String(body.demo_unit || "").trim();
  const user: any = body.user || "";

  if (!demoOwner || !demoCode || !demoName || !demoUnit) {
    throw createError({
      statusCode: 400,
      statusMessage: "Product owner, code, name, and unit are required",
    });
  }

  if (!Number.isFinite(demoMin) || demoMin < 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Product min must be a number greater than or equal to 0",
    });
  }

  const result = await db.query(
    `INSERT INTO tb_all_products_demo (demo_owner, demo_code, demo_name, demo_min, demo_unit, created_by, created_at)
    VALUES($1, $2, $3, $4, $5 ,$6, now())
     RETURNING *`,
    [demoOwner, demoCode, demoName, demoMin, demoUnit, user.uuid],
  );

  return {
    row: result.rows[0],
  };
});
