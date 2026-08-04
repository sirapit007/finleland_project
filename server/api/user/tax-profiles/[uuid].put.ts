import { useDb } from "@@/server/utils/db";
import { requireCurrentUser } from "@@/server/utils/session";
import { normalizeTaxProfileInput, throwFriendlyTaxProfileError, validateTaxProfileInput } from "@@/server/utils/taxProfile";

export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, "uuid");
  const body = await readBody<Record<string, unknown>>(event);
  const currentUser = await requireCurrentUser(event);
  if (!uuid) throw createError({ statusCode: 400, statusMessage: "Tax profile uuid is required" });
  const input = normalizeTaxProfileInput(body);
  validateTaxProfileInput(input);
  const db = useDb();
  const client = await db.connect();

  try {
    await client.query("BEGIN");
    const currentResult = await client.query(
      `SELECT uuid FROM tb_user_tax_profiles WHERE uuid::text = $1 AND tax_profile_user = $2 AND deleted_at IS NULL LIMIT 1`,
      [uuid, currentUser.uuid],
    );
    if (!currentResult.rows[0]) throw createError({ statusCode: 404, statusMessage: "Tax profile was not found" });
    if (input.tax_profile_is_default) {
      await client.query(
        `UPDATE tb_user_tax_profiles SET tax_profile_is_default = FALSE, updated_by = $1, updated_at = NOW()
         WHERE tax_profile_user = $1 AND deleted_at IS NULL AND uuid::text <> $2`,
        [currentUser.uuid, uuid],
      );
    }
    const result = await client.query(
      `UPDATE tb_user_tax_profiles SET
        tax_profile_label=$1, taxpayer_type=$2, taxpayer_name=$3,
        taxpayer_id=$4, taxpayer_branch_type=$5, taxpayer_branch_code=$6,
        taxpayer_address=$7, taxpayer_subdistrict=$8, taxpayer_district=$9,
        taxpayer_province=$10, taxpayer_postcode=$11, taxpayer_phone=$12,
        taxpayer_email=$13, tax_profile_is_default=$14,
        updated_by=$15, updated_at=NOW(), deleted_by=NULL, deleted_at=NULL
       WHERE uuid::text=$16 AND tax_profile_user=$17
       RETURNING *`,
      [
        input.tax_profile_label, input.taxpayer_type, input.taxpayer_name,
        input.taxpayer_id, input.taxpayer_branch_type, input.taxpayer_branch_code,
        input.taxpayer_address, input.taxpayer_subdistrict, input.taxpayer_district,
        input.taxpayer_province, input.taxpayer_postcode, input.taxpayer_phone,
        input.taxpayer_email, input.tax_profile_is_default, currentUser.uuid,
        uuid, currentUser.uuid,
      ],
    );
    await client.query("COMMIT");
    return { row: result.rows[0] };
  } catch (error) {
    await client.query("ROLLBACK");
    throwFriendlyTaxProfileError(error);
  } finally {
    client.release();
  }
});
