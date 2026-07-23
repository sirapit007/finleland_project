import { useDb } from "@@/server/utils/db";
import { requireCurrentUser } from "@@/server/utils/session";

type BasketBody = {
  user?: object;
};

export default defineEventHandler(async (event) => {
  const tableName = "tb_shopping_basket";
  const db = useDb();
  const uuid = getRouterParam(event, "uuid");
  const body = await readBody<BasketBody>(event);
  const currentUser = await requireCurrentUser(event);

  if (!uuid) {
    throw createError({
      statusCode: 400,
      statusMessage: "Basket uuid is required",
    });
  }


  const result = await db.query(
    `UPDATE ${tableName}
     SET updated_by = $1,
         updated_at = now(),
         deleted_by = $1,
         deleted_at = now()
     WHERE uuid = $2
       AND created_by = $3
     RETURNING *`,
    [currentUser.uuid, uuid, currentUser.uuid],
  );

  return {
    row: result.rows[0],
  };
});
