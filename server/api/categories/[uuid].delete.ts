import { useDb } from "@@/server/utils/db";
import { requireCurrentAdmin } from "@@/server/utils/session";

type CategoryBody = {
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


  const result = await db.query(
    `UPDATE ${tableName}
    SET updated_by = $1, updated_at = now(), deleted_by = $1, deleted_at = now()
    WHERE uuid = $2
     RETURNING *`,
    [admin.uuid, uuid],
  );

  return {
    row: result.rows[0],
  };
});
