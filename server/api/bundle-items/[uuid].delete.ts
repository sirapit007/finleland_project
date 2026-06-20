import { useDb } from "@@/server/utils/db";

type BundleItemBody = {
  user?: object;
};

export default defineEventHandler(async (event) => {
  const tableName = "tb_event_bundle_items";

  const db = useDb();
  const uuid = getRouterParam(event, "uuid");
  const body = await readBody<BundleItemBody>(event);

  if (!uuid) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bundle item uuid is required",
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
