import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import bankLists from "thai-banks-logo/dist/index.js";

export type BankAccountInput = {
  bank_account_bank_code: string;
  bank_account_holder_name: string;
  bank_account_number: string;
};

type EncryptedBankAccountNumber = {
  v: 1;
  alg: "A256GCM";
  iv: string;
  tag: string;
  data: string;
};

type BankAccountRow = Record<string, unknown> & {
  bank_account_number_encrypted?: unknown;
  bank_account_number_last4?: unknown;
};

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const BANK_ACCOUNT_NUMBER_PATTERN = /^[0-9]{10,15}$/;

const bankListsModule = bankLists as unknown as {
  default?: typeof bankLists;
};
const resolvedBankLists =
  bankListsModule.default && typeof bankListsModule.default === "object"
    ? bankListsModule.default
    : bankLists;

const allowedBankCodes = new Set(
  Object.values(resolvedBankLists)
    .map((bank) => String(bank.symbol || "").trim())
    .filter((symbol) => /^[A-Z0-9]{2,20}$/.test(symbol)),
);

function getEncryptionKey() {
  const config = useRuntimeConfig();
  const configuredKey = String(config.bankAccountEncryptionKey || "").trim();

  if (!configuredKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "BANK_ACCOUNT_ENCRYPTION_KEY is not configured",
    });
  }

  const key = /^[0-9a-f]{64}$/i.test(configuredKey)
    ? Buffer.from(configuredKey, "hex")
    : Buffer.from(configuredKey, "base64");

  if (key.length !== 32) {
    throw createError({
      statusCode: 500,
      statusMessage:
        "BANK_ACCOUNT_ENCRYPTION_KEY must be a 32-byte base64 or 64-character hex value",
    });
  }

  return key;
}

export function normalizeBankAccountInput(
  body: Record<string, unknown>,
): BankAccountInput {
  return {
    bank_account_bank_code: String(body.bank_account_bank_code || "")
      .trim()
      .toUpperCase(),
    bank_account_holder_name: String(
      body.bank_account_holder_name || "",
    ).trim(),
    bank_account_number: String(body.bank_account_number || "").replace(
      /[^0-9]/g,
      "",
    ),
  };
}

export function validateBankAccountInput(
  input: BankAccountInput,
  options: { requireAccountNumber?: boolean } = {},
) {
  const requireAccountNumber = options.requireAccountNumber !== false;

  if (!allowedBankCodes.has(input.bank_account_bank_code)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bank code is invalid",
    });
  }

  if (
    !input.bank_account_holder_name ||
    input.bank_account_holder_name.length > 255
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bank account holder name is required",
    });
  }

  if (
    (requireAccountNumber || input.bank_account_number) &&
    !BANK_ACCOUNT_NUMBER_PATTERN.test(input.bank_account_number)
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bank account number must contain 10 to 15 digits",
    });
  }
}

export function encryptBankAccountNumber(accountNumber: string) {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(accountNumber, "utf8"),
    cipher.final(),
  ]);
  const envelope: EncryptedBankAccountNumber = {
    v: 1,
    alg: "A256GCM",
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    data: ciphertext.toString("base64"),
  };

  return JSON.stringify(envelope);
}

export function decryptBankAccountNumber(encryptedValue: string) {
  let envelope: EncryptedBankAccountNumber;

  try {
    envelope = JSON.parse(encryptedValue) as EncryptedBankAccountNumber;
  } catch {
    throw createError({
      statusCode: 500,
      statusMessage: "Stored bank account number is invalid",
    });
  }

  if (envelope.v !== 1 || envelope.alg !== "A256GCM") {
    throw createError({
      statusCode: 500,
      statusMessage: "Stored bank account encryption version is unsupported",
    });
  }

  try {
    const decipher = createDecipheriv(
      ALGORITHM,
      getEncryptionKey(),
      Buffer.from(envelope.iv, "base64"),
    );
    decipher.setAuthTag(Buffer.from(envelope.tag, "base64"));
    return Buffer.concat([
      decipher.update(Buffer.from(envelope.data, "base64")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    throw createError({
      statusCode: 500,
      statusMessage: "Unable to decrypt bank account number",
    });
  }
}

export function toSafeBankAccountRow(
  row?: BankAccountRow | null,
  options: { includeAccountNumber?: boolean } = {},
) {
  if (!row) return null;

  const encryptedAccountNumber = String(
    row.bank_account_number_encrypted || "",
  );
  const { bank_account_number_encrypted: _encrypted, ...safeRow } = row;
  const last4 = String(row.bank_account_number_last4 || "");
  const accountNumber =
    options.includeAccountNumber && encryptedAccountNumber
      ? decryptBankAccountNumber(encryptedAccountNumber)
      : "";

  return {
    ...safeRow,
    bank_account_number_masked: last4 ? `•••• ${last4}` : "",
    ...(accountNumber ? { bank_account_number: accountNumber } : {}),
  };
}

export function throwFriendlyBankAccountError(error: unknown): never {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "23505"
  ) {
    throw createError({
      statusCode: 409,
      statusMessage: "A bank account already exists for this user",
    });
  }

  throw error;
}
