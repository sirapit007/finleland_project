import { useDb } from "@@/server/utils/db";
import { requireCurrentAdmin } from "@@/server/utils/session";

type PromotionTypeBody = {
  user?: object;
};

export default defineEventHandler(async (event) => {
  const tableName = "tb_event_promotions";

  const db = useDb();
  const uuid = getRouterParam(event, "uuid");
  const body = await readBody<PromotionTypeBody>(event);
  const admin = await requireCurrentAdmin(event);

  if (!uuid) {
    throw createError({
      statusCode: 400,
      statusMessage: "Promotion uuid is required",
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
