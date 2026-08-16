CREATE UNIQUE INDEX IF NOT EXISTS tb_users_active_email_unique
  ON tb_users (LOWER(BTRIM(email)))
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS tb_users_active_phone_unique
  ON tb_users (BTRIM(phone))
  WHERE deleted_at IS NULL;
