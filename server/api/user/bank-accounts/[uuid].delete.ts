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
    `UPDATE tb_user_bank_accounts
     SET updated_by = $1,
         updated_at = NOW(),
         deleted_by = $1,
         deleted_at = NOW()
     WHERE uuid::text = $2
       AND bank_account_user = $1
       AND deleted_at IS NULL
     RETURNING *`,
    [currentUser.uuid, uuid],
  );

  if (!result.rows[0]) {
    throw createError({
      statusCode: 404,
      statusMessage: "Bank account was not found",
    });
  }

  return { row: toSafeBankAccountRow(result.rows[0]) };
});
