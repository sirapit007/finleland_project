-- Resolve duplicate active links before running; do not auto-verify legacy rows.
-- SELECT line_provider_id, line_user_id, count(*) FROM tb_user_line_accounts
--   WHERE deleted_at IS NULL GROUP BY line_provider_id, line_user_id HAVING count(*) > 1;
-- SELECT line_user, line_provider_id, count(*) FROM tb_user_line_accounts
--   WHERE deleted_at IS NULL GROUP BY line_user, line_provider_id HAVING count(*) > 1;

BEGIN;

ALTER TABLE tb_user_line_accounts
  ADD COLUMN IF NOT EXISTS line_login_verified_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS tb_user_line_accounts_active_identity_unique
  ON tb_user_line_accounts (line_provider_id, line_user_id)
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS tb_user_line_accounts_active_user_provider_unique
  ON tb_user_line_accounts (line_user, line_provider_id)
  WHERE deleted_at IS NULL;

-- Retain consumed OTP rows containing a proof hash for at least 30 minutes
-- after consumption, longer than any pending LINE signup cookie can remain valid.
ALTER TABLE tb_otp_challenges
  ADD COLUMN IF NOT EXISTS line_signup_proof_hash text;

CREATE UNIQUE INDEX IF NOT EXISTS tb_otp_challenges_line_signup_proof_unique
  ON tb_otp_challenges (line_signup_proof_hash)
  WHERE line_signup_proof_hash IS NOT NULL;

COMMIT;