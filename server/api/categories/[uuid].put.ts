import { useDb } from "@@/server/utils/db";
import { requireCurrentAdmin } from "@@/server/utils/session";

type CategoryBody = {
  category_name?: string;
  image_url?: string;
  user?: object;
};

export default defineEventHandler(async (event) => {
  const tableName = "tb_master_categories";

  const db = useDb();
  const uuid = getRouterParam(event, "uuid");
  const body = await readBody<CategoryBody>(event);
  const admin = await requireCurrentAdmin(event);

  if (!uuid) {
    throw createError({
      statusCode: 400,
      statusMessage: "Category uuid is required",
    });
  }

  const category_name = String(body.category_name || "").trim();
    const image_url = String(body.image_url || "").trim();
  const deleted_by = null;
  const deleted_at = null;

  if (!category_name) {
    throw createError({
      statusCode: 400,
      statusMessage: "Category name is required",
    });
  }

  const result = await db.query(
    `UPDATE ${tableName}
    SET category_name = $1, image_url = $2, updated_by = $3, updated_at = now(), deleted_by = $4, deleted_at = $5
    WHERE uuid = $6
     RETURNING *`,
    [category_name, image_url, admin.uuid, deleted_by, deleted_at, uuid],
  );

  return {
    row: result.rows[0],
  };
});
