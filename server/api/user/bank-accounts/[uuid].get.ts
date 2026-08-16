import { useDb } from "@@/server/utils/db";
import { requireCurrentUser } from "@@/server/utils/session";
import { toSafeBankAccountRow } from "@@/server/utils/bankAccount";

export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, "uuid");
  const currentUser = await requireCurrentUser(event);

  if (!uuid) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bank account uuid is required",
    });
  }

  const db = useDb();
  const result = await db.query(
    `SELECT
       base.id,
       base.uuid,
       base.bank_account_user,
       base.bank_account_bank_code,
       base.bank_account_holder_name,
       base.bank_account_number_last4,
       base.created_by,
       base.created_at,
       base.updated_by,
       base.updated_at,
       base.deleted_by,
       base.deleted_at,
       concat_ws(' ', user_c.firstname, user_c.lastname) AS created_username,
       concat_ws(' ', user_u.firstname, user_u.lastname) AS updated_username,
       concat_ws(' ', user_d.firstname, user_d.lastname) AS deleted_username
     FROM tb_user_bank_accounts AS base
     LEFT JOIN tb_users AS user_c ON user_c.uuid::text = base.created_by
     LEFT JOIN tb_users AS user_u ON user_u.uuid::text = base.updated_by
     LEFT JOIN tb_users AS user_d ON user_d.uuid::text = base.deleted_by
     WHERE base.uuid::text = $1
       AND base.bank_account_user = $2
       AND base.deleted_at IS NULL
     LIMIT 1`,
    [uuid, currentUser.uuid],
  );

  return { row: toSafeBankAccountRow(result.rows[0]) };
});
