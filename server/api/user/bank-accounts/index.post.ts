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
  const body = await readBody<Record<string, unknown>>(event);
  const currentUser = await requireCurrentUser(event);
  const input = normalizeBankAccountInput(body);
  validateBankAccountInput(input);
  const encryptedAccountNumber = encryptBankAccountNumber(
    input.bank_account_number,
  );
  const last4 = input.bank_account_number.slice(-4);
  const db = useDb();

  try {
    const result = await db.query(
      `INSERT INTO tb_user_bank_accounts (
         bank_account_user,
         bank_account_bank_code,
         bank_account_holder_name,
         bank_account_number_encrypted,
         bank_account_number_last4,
         created_by
       ) VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        currentUser.uuid,
        input.bank_account_bank_code,
        input.bank_account_holder_name,
        encryptedAccountNumber,
        last4,
        currentUser.uuid,
      ],
    );

    return { row: toSafeBankAccountRow(result.rows[0]) };
  } catch (error) {
    throwFriendlyBankAccountError(error);
  }
});
