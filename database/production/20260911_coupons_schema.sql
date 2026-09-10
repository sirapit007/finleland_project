-- Production schema changes from 2026-09-11.
-- Requires the existing tb_users and tb_shopping_orders tables.
BEGIN;
SET LOCAL lock_timeout = '10s';

-- Coupon campaigns, ownership and order usage. Apply atomically with scripts/coupons-db.mjs.
CREATE UNIQUE INDEX IF NOT EXISTS tb_users_uuid_coupon_unique ON tb_users (uuid);

CREATE TABLE IF NOT EXISTS tb_event_coupons (
  id BIGSERIAL PRIMARY KEY,
  uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  coupon_key VARCHAR(100) UNIQUE,
  coupon_name VARCHAR(200) NOT NULL,
  coupon_description TEXT,
  coupon_discount_type VARCHAR(20) NOT NULL CHECK (coupon_discount_type IN ('amount', 'percent')),
  coupon_discount_value NUMERIC(12,2) NOT NULL CHECK (coupon_discount_value > 0),
  coupon_max_discount NUMERIC(12,2) CHECK (coupon_max_discount > 0),
  coupon_min_purchase_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (coupon_min_purchase_amount >= 0),
  coupon_min_quantity INTEGER NOT NULL DEFAULT 0 CHECK (coupon_min_quantity >= 0),
  coupon_min_items INTEGER NOT NULL DEFAULT 0 CHECK (coupon_min_items >= 0),
  coupon_usage_limit INTEGER NOT NULL DEFAULT 1 CHECK (coupon_usage_limit > 0),
  coupon_recipient_limit INTEGER NOT NULL CHECK (coupon_recipient_limit > 0),
  coupon_issued_count INTEGER NOT NULL DEFAULT 0 CHECK (coupon_issued_count >= 0 AND coupon_issued_count <= coupon_recipient_limit),
  coupon_distribution_method VARCHAR(20) NOT NULL CHECK (coupon_distribution_method IN ('signup','random','manual','claim')),
  coupon_status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (coupon_status IN ('draft','active','paused')),
  coupon_activated_at TIMESTAMPTZ,
  coupon_expires_at TIMESTAMPTZ,
  created_by VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by VARCHAR(100),
  updated_at TIMESTAMPTZ,
  deleted_by VARCHAR(100),
  deleted_at TIMESTAMPTZ,
  CHECK (coupon_discount_type <> 'percent' OR coupon_discount_value <= 100),
  CHECK (coupon_discount_type = 'percent' OR coupon_max_discount IS NULL),
  CHECK (btrim(coupon_name) <> ''),
  CHECK (coupon_status = 'draft' OR coupon_activated_at IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS tb_event_coupons_distribution_idx
  ON tb_event_coupons (coupon_distribution_method, coupon_status, id) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS tb_user_coupons (
  id BIGSERIAL PRIMARY KEY,
  uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  user_coupon_coupon UUID NOT NULL REFERENCES tb_event_coupons(uuid) ON DELETE RESTRICT,
  user_coupon_user UUID NOT NULL REFERENCES tb_users(uuid) ON DELETE RESTRICT,
  user_coupon_source VARCHAR(20) NOT NULL CHECK (user_coupon_source IN ('signup','random','manual','claim')),
  user_coupon_granted_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  user_coupon_used_count INTEGER NOT NULL DEFAULT 0 CHECK (user_coupon_used_count >= 0),
  created_by VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by VARCHAR(100),
  updated_at TIMESTAMPTZ,
  deleted_by VARCHAR(100),
  deleted_at TIMESTAMPTZ,
  -- Deliberately includes deleted rows: receiving a coupon is a lifetime unique entitlement.
  UNIQUE (user_coupon_coupon, user_coupon_user)
);
CREATE INDEX IF NOT EXISTS tb_user_coupons_user_idx ON tb_user_coupons(user_coupon_user, id DESC);

CREATE TABLE IF NOT EXISTS tb_shopping_order_coupon_usages (
  id BIGSERIAL PRIMARY KEY,
  uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  usage_order UUID NOT NULL UNIQUE REFERENCES tb_shopping_orders(uuid) ON DELETE RESTRICT,
  usage_user_coupon UUID NOT NULL REFERENCES tb_user_coupons(uuid) ON DELETE RESTRICT,
  usage_coupon UUID NOT NULL REFERENCES tb_event_coupons(uuid) ON DELETE RESTRICT,
  usage_user UUID NOT NULL REFERENCES tb_users(uuid) ON DELETE RESTRICT,
  usage_discount_amount NUMERIC(12,2) NOT NULL CHECK (usage_discount_amount >= 0),
  usage_snapshot JSONB NOT NULL,
  usage_status VARCHAR(20) NOT NULL DEFAULT 'used' CHECK (usage_status IN ('used','returned')),
  usage_returned_at TIMESTAMPTZ,
  usage_returned_by VARCHAR(100),
  usage_return_reason TEXT,
  created_by VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by VARCHAR(100),
  updated_at TIMESTAMPTZ,
  deleted_by VARCHAR(100),
  deleted_at TIMESTAMPTZ,
  CHECK (usage_status <> 'returned' OR (usage_returned_at IS NOT NULL AND usage_return_reason IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS tb_shopping_order_coupon_usages_coupon_idx ON tb_shopping_order_coupon_usages(usage_coupon, id DESC);
CREATE INDEX IF NOT EXISTS tb_shopping_order_coupon_usages_holder_idx ON tb_shopping_order_coupon_usages(usage_user_coupon, usage_status);

ALTER TABLE tb_shopping_orders
  ADD COLUMN IF NOT EXISTS order_coupon_discount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (order_coupon_discount >= 0),
  ADD COLUMN IF NOT EXISTS order_user_coupon UUID REFERENCES tb_user_coupons(uuid) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS order_coupon_snapshot JSONB;

COMMIT;
