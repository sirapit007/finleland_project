import { useDb } from "@@/server/utils/db";
import { requireCurrentAdmin } from "@@/server/utils/session";

type CategoryBody = {
  category_name?: string;
  image_url?: string;
  user?: object;
};

export default defineEventHandler(async (event) => {
  const tableName = "tb_master_categories";

  const body = await readBody<CategoryBody>(event);
  const db = useDb();
  const admin = await requireCurrentAdmin(event);

  const category_name = String(body.category_name || "").trim();
  const image_url = String(body.image_url || "").trim();

  if (!category_name) {
    throw createError({
      statusCode: 400,
      statusMessage: "Category name is required",
    });
  }

  const result = await db.query(
    `INSERT INTO ${tableName} (category_name, image_url, created_by)
    VALUES($1, $2, $3)
     RETURNING *`,
    [category_name, image_url, admin.uuid],
  );

  return {
    row: result.rows[0],
  };
});
