import { useDb } from "@@/server/utils/db";
import { requireCurrentUser } from "@@/server/utils/session";

export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, "uuid");
  const currentUser = await requireCurrentUser(event);
  if (!uuid) throw createError({ statusCode: 400, statusMessage: "Tax profile uuid is required" });
  const db = useDb();
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const currentResult = await client.query(
      `SELECT tax_profile_is_default FROM tb_user_tax_profiles WHERE uuid::text=$1 AND tax_profile_user=$2 AND deleted_at IS NULL LIMIT 1`,
      [uuid, currentUser.uuid],
    );
    const current = currentResult.rows[0];
    if (!current) throw createError({ statusCode: 404, statusMessage: "Tax profile was not found" });
    const result = await client.query(
      `UPDATE tb_user_tax_profiles SET updated_by=$1, updated_at=NOW(), deleted_by=$1, deleted_at=NOW()
       WHERE uuid::text=$2 AND tax_profile_user=$1 RETURNING *`,
      [currentUser.uuid, uuid],
    );
    if (current.tax_profile_is_default) {
      await client.query(
        `UPDATE tb_user_tax_profiles SET tax_profile_is_default=TRUE, updated_by=$1, updated_at=NOW()
         WHERE uuid = (SELECT uuid FROM tb_user_tax_profiles WHERE tax_profile_user=$1 AND deleted_at IS NULL ORDER BY id DESC LIMIT 1)`,
        [currentUser.uuid],
      );
    }
    await client.query("COMMIT");
    return { row: result.rows[0] };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});
