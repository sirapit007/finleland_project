import { useDb } from "@@/server/utils/db";
import { requireCurrentUser } from "@@/server/utils/session";
import {
  encryptBankAccountNumber,
  normalizeBankAccountInput,
  throwFriendlyBankAccountError,
  toSafeBankAccountRow,
  validateBankAccountInput,
} from "@@/server/utils/bankAccount";

export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, "uuid");
  const body = await readBody<Record<string, unknown>>(event);
  const currentUser = await requireCurrentUser(event);

  if (!uuid) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bank account uuid is required",
    });
  }

  const input = normalizeBankAccountInput(body);
  validateBankAccountInput(input, { requireAccountNumber: false });
  const encryptedAccountNumber = input.bank_account_number
    ? encryptBankAccountNumber(input.bank_account_number)
    : null;
  const last4 = input.bank_account_number
    ? input.bank_account_number.slice(-4)
    : null;
  const db = useDb();

  try {
    const result = await db.query(
      `UPDATE tb_user_bank_accounts
       SET bank_account_bank_code = $1,
           bank_account_holder_name = $2,
           bank_account_number_encrypted = COALESCE(
             $3,
             bank_account_number_encrypted
           ),
           bank_account_number_last4 = COALESCE(
             $4,
             bank_account_number_last4
           ),
           updated_by = $5,
           updated_at = NOW()
       WHERE uuid::text = $6
         AND bank_account_user = $5
         AND deleted_at IS NULL
       RETURNING *`,
      [
        input.bank_account_bank_code,
        input.bank_account_holder_name,
        encryptedAccountNumber,
        last4,
        currentUser.uuid,
        uuid,
      ],
    );

    if (!result.rows[0]) {
      throw createError({
        statusCode: 404,
        statusMessage: "Bank account was not found",
      });
    }

    return { row: toSafeBankAccountRow(result.rows[0]) };
  } catch (error) {
    throwFriendlyBankAccountError(error);
  }
});
