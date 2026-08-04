import { useDb } from "@@/server/utils/db";
import { requireCurrentActor } from "@@/server/utils/session";

type Body = { order_tax_order?: string; order_tax_profile_uuid?: string };

export default defineEventHandler(async (event) => {
  const body = await readBody<Body>(event);
  const actor = await requireCurrentActor(event);
  const orderUuid = String(body.order_tax_order || "").trim();
  const profileUuid = String(body.order_tax_profile_uuid || "").trim();
  if (!orderUuid || !profileUuid) throw createError({ statusCode: 400, statusMessage: "Order and tax profile are required" });
  const db = useDb();
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const orderResult = await client.query(
      `SELECT uuid::text AS uuid, order_user, order_status FROM tb_shopping_orders
       WHERE uuid::text=$1 AND deleted_at IS NULL AND ($2::boolean OR order_user=$3) LIMIT 1 FOR UPDATE`,
      [orderUuid, actor.isAdmin, actor.user.uuid],
    );
    const order = orderResult.rows[0];
    if (!order) throw createError({ statusCode: 404, statusMessage: "Order was not found" });
    if (["completed", "canceled"].includes(String(order.order_status))) throw createError({ statusCode: 409, statusMessage: "Tax details cannot be added to a closed order" });
    const profileResult = await client.query(
      `SELECT * FROM tb_user_tax_profiles WHERE uuid::text=$1 AND tax_profile_user=$2 AND deleted_at IS NULL LIMIT 1`,
      [profileUuid, order.order_user],
    );
    const profile = profileResult.rows[0];
    if (!profile) throw createError({ statusCode: 404, statusMessage: "Tax profile was not found" });
    const result = await client.query(
      `INSERT INTO tb_shopping_order_tax_details (
        order_tax_order, order_tax_profile_uuid, order_taxpayer_type,
        order_taxpayer_name, order_taxpayer_id, order_taxpayer_branch_type,
        order_taxpayer_branch_code, order_taxpayer_address,
        order_taxpayer_subdistrict, order_taxpayer_district,
        order_taxpayer_province, order_taxpayer_postcode,
        order_taxpayer_phone, order_taxpayer_email, created_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      RETURNING *`,
      [
        orderUuid, profile.uuid, profile.taxpayer_type, profile.taxpayer_name,
        profile.taxpayer_id, profile.taxpayer_branch_type,
        profile.taxpayer_branch_code, profile.taxpayer_address,
        profile.taxpayer_subdistrict, profile.taxpayer_district,
        profile.taxpayer_province, profile.taxpayer_postcode,
        profile.taxpayer_phone, profile.taxpayer_email, actor.user.uuid,
      ],
    );
    await client.query("COMMIT");
    return { row: result.rows[0] };
  } catch (error: any) {
    await client.query("ROLLBACK");
    if (error?.code === "23505") throw createError({ statusCode: 409, statusMessage: "This order already has tax details" });
    throw error;
  } finally { client.release(); }
});
