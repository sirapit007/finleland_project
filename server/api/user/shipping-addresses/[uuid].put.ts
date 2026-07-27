import { useDb } from "@@/server/utils/db";
import { requireCurrentUser } from "@@/server/utils/session";

type ShippingAddressBody = {
  shipping_label?: string;
  shipping_recipient?: string;
  shipping_phone?: string;
  shipping_address?: string;
  shipping_subdistrict?: string;
  shipping_district?: string;
  shipping_province?: string;
  shipping_postcode?: string;
  shipping_note?: string;
  shipping_is_default?: boolean | string | number;
  user?: object;
};

function toBoolean(value: unknown) {
  return value === true || value === "true" || value === 1 || value === "1";
}

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

  const shipping_label = String(body.shipping_label || "").trim();
  const shipping_recipient = String(body.shipping_recipient || "").trim();
  const shipping_phone = String(body.shipping_phone || "").trim();
  const shipping_address = String(body.shipping_address || "").trim();
  const shipping_subdistrict = String(body.shipping_subdistrict || "").trim();
  const shipping_district = String(body.shipping_district || "").trim();
  const shipping_province = String(body.shipping_province || "").trim();
  const shipping_postcode = String(body.shipping_postcode || "").trim();
  const shipping_note = String(body.shipping_note || "").trim() || null;
  const shipping_is_default = toBoolean(body.shipping_is_default);

  if (
    !shipping_label ||
    !shipping_recipient ||
    !shipping_phone ||
    !shipping_address ||
    !shipping_subdistrict ||
    !shipping_district ||
    !shipping_province ||
    !shipping_postcode
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "Shipping address fields are required",
    });
  }

  if (!/^[0-9]{10}$/.test(shipping_phone)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Phone number must contain exactly 10 digits",
    });
  }

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const currentResult = await client.query(
      `SELECT shipping_user
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

    if (shipping_is_default) {
      await client.query(
        `UPDATE ${tableName}
         SET shipping_is_default = FALSE,
             updated_by = $1,
             updated_at = now()
         WHERE shipping_user = $2
           AND deleted_at IS NULL
           AND uuid <> $3`,
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
           updated_by = $11,
           updated_at = now(),
           deleted_by = NULL,
           deleted_at = NULL
       WHERE uuid = $12
         AND shipping_user = $13
       RETURNING *`,
      [
        shipping_label,
        shipping_recipient,
        shipping_phone,
        shipping_address,
        shipping_subdistrict,
        shipping_district,
        shipping_province,
        shipping_postcode,
        shipping_note,
        shipping_is_default,
        currentUser.uuid,
        uuid,
        currentUser.uuid,
      ],
    );

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
