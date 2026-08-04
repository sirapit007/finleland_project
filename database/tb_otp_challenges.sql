CREATE TABLE IF NOT EXISTS tb_otp_challenges (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(10) NOT NULL,
  email VARCHAR(100),
  provider_token TEXT NOT NULL,
  refno VARCHAR(20),
  purpose VARCHAR(30) NOT NULL DEFAULT 'signup',
  attempts INTEGER NOT NULL DEFAULT 0,
  requester_ip_hash VARCHAR(64),
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- These ALTER statements make this file safe to run against the original table.
ALTER TABLE tb_otp_challenges
  ADD COLUMN IF NOT EXISTS email VARCHAR(100),
  ADD COLUMN IF NOT EXISTS requester_ip_hash VARCHAR(64);

CREATE INDEX IF NOT EXISTS idx_otp_challenges_phone_created_at
  ON tb_otp_challenges (phone, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_otp_challenges_ip_created_at
  ON tb_otp_challenges (requester_ip_hash, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_otp_challenges_active_signup
  ON tb_otp_challenges (phone, expires_at)
  WHERE purpose = 'signup' AND consumed_at IS NULL;
