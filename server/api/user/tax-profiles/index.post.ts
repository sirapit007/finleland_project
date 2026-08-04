import { useDb } from "@@/server/utils/db";
import { requireCurrentUser } from "@@/server/utils/session";
import { normalizeTaxProfileInput, throwFriendlyTaxProfileError, validateTaxProfileInput } from "@@/server/utils/taxProfile";

export default defineEventHandler(async (event) => {
  const body = await readBody<Record<string, unknown>>(event);
  const currentUser = await requireCurrentUser(event);
  const input = normalizeTaxProfileInput(body);
  validateTaxProfileInput(input);
  const db = useDb();
  const client = await db.connect();

  try {
    await client.query("BEGIN");
    const countResult = await client.query(
      `SELECT COUNT(*) AS total FROM tb_user_tax_profiles WHERE tax_profile_user = $1 AND deleted_at IS NULL`,
      [currentUser.uuid],
    );
    const isDefault = input.tax_profile_is_default || Number(countResult.rows[0]?.total || 0) === 0;
    if (isDefault) {
      await client.query(
        `UPDATE tb_user_tax_profiles
         SET tax_profile_is_default = FALSE, updated_by = $1, updated_at = NOW()
         WHERE tax_profile_user = $1 AND deleted_at IS NULL`,
        [currentUser.uuid],
      );
    }

    const result = await client.query(
      `INSERT INTO tb_user_tax_profiles (
        tax_profile_user, tax_profile_label, taxpayer_type, taxpayer_name,
        taxpayer_id, taxpayer_branch_type, taxpayer_branch_code,
        taxpayer_address, taxpayer_subdistrict, taxpayer_district,
        taxpayer_province, taxpayer_postcode, taxpayer_phone, taxpayer_email,
        tax_profile_is_default, created_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      RETURNING *`,
      [
        currentUser.uuid, input.tax_profile_label, input.taxpayer_type,
        input.taxpayer_name, input.taxpayer_id, input.taxpayer_branch_type,
        input.taxpayer_branch_code, input.taxpayer_address,
        input.taxpayer_subdistrict, input.taxpayer_district,
        input.taxpayer_province, input.taxpayer_postcode, input.taxpayer_phone,
        input.taxpayer_email, isDefault, currentUser.uuid,
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
