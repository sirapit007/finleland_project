CREATE TABLE IF NOT EXISTS tb_user_bank_accounts (
  id BIGSERIAL PRIMARY KEY,
  uuid UUID NOT NULL DEFAULT gen_random_uuid(),
  bank_account_user VARCHAR(100) NOT NULL,
  bank_account_bank_code VARCHAR(20) NOT NULL,
  bank_account_holder_name VARCHAR(255) NOT NULL,
  bank_account_number_encrypted TEXT NOT NULL,
  bank_account_number_last4 CHAR(4) NOT NULL,
  created_by VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by VARCHAR(100),
  updated_at TIMESTAMPTZ,
  deleted_by VARCHAR(100),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT tb_user_bank_accounts_uuid_unique UNIQUE (uuid),
  CONSTRAINT tb_user_bank_accounts_bank_code_check
    CHECK (bank_account_bank_code ~ '^[A-Z0-9]{2,20}$'),
  CONSTRAINT tb_user_bank_accounts_holder_name_check
    CHECK (LENGTH(TRIM(bank_account_holder_name)) > 0),
  CONSTRAINT tb_user_bank_accounts_last4_check
    CHECK (bank_account_number_last4 ~ '^[0-9]{4}$')
);

CREATE UNIQUE INDEX IF NOT EXISTS tb_user_bank_accounts_one_active_per_user
  ON tb_user_bank_accounts (bank_account_user)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS tb_user_bank_accounts_uuid_active_idx
  ON tb_user_bank_accounts (uuid)
  WHERE deleted_at IS NULL;
