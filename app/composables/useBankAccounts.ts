import bankLists from "thai-banks-logo/dist/index.js";

export type BankAccountForm = {
  bank_account_bank_code: string;
  bank_account_holder_name: string;
  bank_account_number: string;
};

export type BankAccount = Omit<BankAccountForm, "bank_account_number"> & {
  id: number;
  uuid: string;
  bank_account_user: string;
  bank_account_number_last4: string;
  bank_account_number_masked: string;
  bank_account_number?: string;
  created_by: string;
  created_at: string;
  updated_by: string | null;
  updated_at: string | null;
  deleted_by: string | null;
  deleted_at: string | null;
};

export type ThaiBank = {
  name: string;
  fullname: string;
  nameEN: string;
  symbol: string;
  icon: string;
  color: string;
};

export const thaiBankOptions: ThaiBank[] = Object.values(bankLists)
  .filter((bank) => /^[A-Z0-9]{2,20}$/.test(bank.symbol))
  .map((bank) => ({
    name: bank.name,
    fullname: bank.nameLong,
    nameEN: bank.nameEN,
    symbol: bank.symbol,
    icon: bank.icon,
    color: "",
  }));

export function getThaiBank(bankCode: string) {
  return thaiBankOptions.find((bank) => bank.symbol === bankCode) || null;
}

export function createBankAccountForm(
  initial: Partial<BankAccountForm> = {},
): BankAccountForm {
  return {
    bank_account_bank_code: String(initial.bank_account_bank_code || ""),
    bank_account_holder_name: String(initial.bank_account_holder_name || ""),
    bank_account_number: String(initial.bank_account_number || ""),
  };
}

export function toBankAccountForm(
  account?: Partial<BankAccount> | null,
): BankAccountForm {
  return createBankAccountForm({
    bank_account_bank_code: account?.bank_account_bank_code,
    bank_account_holder_name: account?.bank_account_holder_name,
    bank_account_number: "",
  });
}

export async function fetchBankAccounts() {
  const response = await $fetch<{ rows: BankAccount[] }>(
    "/api/user/bank-accounts",
    { query: { page: 1, pageSize: 100 } },
  );
  return response.rows || [];
}

export async function createBankAccount(form: BankAccountForm) {
  return $fetch<{ row: BankAccount }>("/api/user/bank-accounts", {
    method: "POST",
    body: form,
  });
}

export async function updateBankAccount(uuid: string, form: BankAccountForm) {
  return $fetch<{ row: BankAccount }>(`/api/user/bank-accounts/${uuid}`, {
    method: "PUT",
    body: form,
  });
}

export async function deleteBankAccount(uuid: string) {
  return $fetch<{ row: BankAccount }>(`/api/user/bank-accounts/${uuid}`, {
    method: "DELETE",
  });
}
