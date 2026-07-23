import { useDb } from "@@/server/utils/db";

type ShippingAddressBody = {
  shipping_user?: string;
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
  const body = await readBody<ShippingAddressBody>(event);
  const user: any = body.user || "";

  if (!user?.uuid) {
    throw createError({
      statusCode: 400,
      statusMessage: "User is required",
    });
  }

  const shipping_user = String(body.shipping_user || user.uuid || "").trim();
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
    !shipping_user ||
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

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    if (shipping_is_default) {
      await client.query(
        `UPDATE ${tableName}
         SET shipping_is_default = FALSE,
             updated_by = $1,
             updated_at = now()
         WHERE shipping_user = $2
           AND deleted_at IS NULL`,
        [user.uuid, shipping_user],
      );
    }

    const result = await client.query(
      `INSERT INTO ${tableName}
        (shipping_user, shipping_label, shipping_recipient, shipping_phone, shipping_address, shipping_subdistrict, shipping_district, shipping_province, shipping_postcode, shipping_note, shipping_is_default, created_by)
       VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        shipping_user,
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
        user.uuid,
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
