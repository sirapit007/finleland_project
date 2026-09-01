import { useDb } from "@@/server/utils/db";
import { requireCurrentUser } from "@@/server/utils/session";
import {
  parseSmartShippingAddress,
  type SmartShippingAddressBody,
} from "@@/server/utils/smartShippingAddress";

export default defineEventHandler(async (event) => {
  const tableName = "tb_user_shipping_addresses";
  const db = useDb();
  const body = await readBody<SmartShippingAddressBody>(event);
  const currentUser = await requireCurrentUser(event);
  const input = parseSmartShippingAddress(body);
  const client = await db.connect();

  try {
    await client.query("BEGIN");
    if (input.shipping_is_default) {
      await client.query(
        `UPDATE ${tableName}
         SET shipping_is_default = FALSE, updated_by = $1, updated_at = now()
         WHERE shipping_user = $2 AND deleted_at IS NULL`,
        [currentUser.uuid, currentUser.uuid],
      );
    }

    const result = await client.query(
      `INSERT INTO ${tableName} (
        shipping_user, shipping_label, shipping_recipient, shipping_phone,
        shipping_address, shipping_subdistrict, shipping_district,
        shipping_province, shipping_postcode, shipping_note,
        shipping_is_default, shipping_latitude, shipping_longitude,
        shipping_location_provider, shipping_place_id,
        shipping_location_source, shipping_location_accuracy,
        shipping_location_confirmed_at, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19
      ) RETURNING *`,
      [
        currentUser.uuid,
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
