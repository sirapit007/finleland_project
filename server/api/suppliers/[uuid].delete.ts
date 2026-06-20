import { useDb } from "@@/server/utils/db";

type SupplierBody = {
  user?: object;
};

export default defineEventHandler(async (event) => {
  const tableName = "tb_master_suppliers";

  const db = useDb();
  const uuid = getRouterParam(event, "uuid");
  const body = await readBody<SupplierBody>(event);

  if (!uuid) {
    throw createError({
      statusCode: 400,
      statusMessage: "Supplier uuid is required",
    });
  }

  const user: any = body.user || "";

  const result = await db.query(
    `UPDATE ${tableName}
    SET updated_by = $1, updated_at = now(), deleted_by = $1, deleted_at = now()
    WHERE uuid = $2
     RETURNING *`,
    [user.uuid, uuid],
  );

  return {
    row: result.rows[0],
  };
});
