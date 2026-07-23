import { useDb } from "@@/server/utils/db";
import { requireCurrentUser } from "@@/server/utils/session";

type ShippingAddressBody = {
  user?: object;
};

export default defineEventHandler(async (event) => {
  const tableName = "tb_user_shipping_addresses";
  const db = useDb();
  const uuid = getRouterParam(event, "uuid");
  const body = await readBody<ShippingAddressBody>(event);
  const currentUser = await requireCurrentUser(event);

  if (!uuid) {
    throw createError({
      statusCode: 400,
      statusMessage: "Shipping address uuid is required",
    });
  }

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const currentResult = await client.query(
      `SELECT shipping_user, shipping_is_default
       FROM ${tableName}
       WHERE uuid = $1
         AND shipping_user = $2
         AND deleted_at IS NULL
       LIMIT 1`,
      [uuid, currentUser.uuid],
    );

    const currentRow = currentResult.rows[0];

    if (!currentRow) {
      throw createError({
        statusCode: 404,
        statusMessage: "Shipping address not found",
      });
    }

    const result = await client.query(
      `UPDATE ${tableName}
       SET updated_by = $1,
           updated_at = now(),
           deleted_by = $1,
           deleted_at = now()
       WHERE uuid = $2
         AND shipping_user = $3
       RETURNING *`,
      [currentUser.uuid, uuid, currentUser.uuid],
    );

    if (currentRow.shipping_is_default) {
      await client.query(
        `UPDATE ${tableName}
         SET shipping_is_default = TRUE,
             updated_by = $1,
             updated_at = now()
         WHERE uuid = (
           SELECT uuid
           FROM ${tableName}
           WHERE shipping_user = $2
             AND deleted_at IS NULL
             AND uuid <> $3
           ORDER BY id DESC
           LIMIT 1
         )`,
        [currentUser.uuid, currentRow.shipping_user, uuid],
      );
    }

    await client.query("COMMIT");

    return {
      row: result.rows[0],
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});
