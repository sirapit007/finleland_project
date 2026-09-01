import { useDb } from "@@/server/utils/db";
import { requireCurrentUser } from "@@/server/utils/session";
import {
  parseSmartShippingAddress,
  type SmartShippingAddressBody,
} from "@@/server/utils/smartShippingAddress";

export default defineEventHandler(async (event) => {
  const tableName = "tb_user_shipping_addresses";
  const db = useDb();
  const uuid = getRouterParam(event, "uuid");
  const body = await readBody<SmartShippingAddressBody>(event);
  const currentUser = await requireCurrentUser(event);

  if (!uuid) {
    throw createError({
      statusCode: 400,
      statusMessage: "Shipping address uuid is required",
    });
  }

  const input = parseSmartShippingAddress(body);
  const client = await db.connect();

  try {
    await client.query("BEGIN");
    const currentResult = await client.query(
      `SELECT shipping_user
       FROM ${tableName}
       WHERE uuid = $1 AND shipping_user = $2 AND deleted_at IS NULL
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

    if (input.shipping_is_default) {
      await client.query(
        `UPDATE ${tableName}
         SET shipping_is_default = FALSE, updated_by = $1, updated_at = now()
         WHERE shipping_user = $2 AND deleted_at IS NULL AND uuid <> $3`,
        [currentUser.uuid, currentRow.shipping_user, uuid],
      );
    }

    const result = await client.query(
      `UPDATE ${tableName}
       SET shipping_label = $1,
           shipping_recipient = $2,
           shipping_phone = $3,
           shipping_address = $4,
           shipping_subdistrict = $5,
           shipping_district = $6,
           shipping_province = $7,
           shipping_postcode = $8,
           shipping_note = $9,
           shipping_is_default = $10,
           shipping_latitude = $11,
           shipping_longitude = $12,
           shipping_location_provider = $13,
           shipping_place_id = $14,
           shipping_location_source = $15,
           shipping_location_accuracy = $16,
           shipping_location_confirmed_at = $17,
           updated_by = $18,
           updated_at = now(),
           deleted_by = NULL,
           deleted_at = NULL
       WHERE uuid = $19 AND shipping_user = $20
       RETURNING *`,
      [
        input.shipping_label,
        input.shipping_recipient,
        input.shipping_phone,
        input.shipping_address,
        input.shipping_subdistrict,
        input.shipping_district,
        input.shipping_province,
        input.shipping_postcode,
        input.shipping_note,
        input.shipping_is_default,
        input.shipping_latitude,
        input.shipping_longitude,
        input.shipping_location_provider,
        input.shipping_place_id,
        input.shipping_location_source,
        input.shipping_location_accuracy,
        input.shipping_location_confirmed_at,
        currentUser.uuid,
        uuid,
        currentUser.uuid,
      ],
    );

    await client.query("COMMIT");
    return { row: result.rows[0] };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});
