CREATE TABLE IF NOT EXISTS tb_shopping_order_payments (
  id BIGSERIAL PRIMARY KEY,
  uuid UUID NOT NULL DEFAULT gen_random_uuid(),
  order_payment_order UUID NOT NULL,
  order_payment_provider VARCHAR(30) NOT NULL DEFAULT 'slipok',
  order_payment_method VARCHAR(30) NOT NULL DEFAULT 'merchant_qr',
  order_payment_status VARCHAR(30) NOT NULL DEFAULT 'pending',
  order_payment_expected_amount NUMERIC(12, 2) NOT NULL,
  order_payment_verified_amount NUMERIC(12, 2),
  order_payment_currency VARCHAR(3) NOT NULL DEFAULT 'THB',
  order_payment_slip_url TEXT,
  order_payment_slip_public_id TEXT,
  order_payment_slip_original_name VARCHAR(255),
  order_payment_slip_mime_type VARCHAR(100),
  order_payment_slip_size BIGINT,
  order_payment_slip_sha256 CHAR(64),
  order_payment_transaction_ref VARCHAR(100),
  order_payment_transaction_at TIMESTAMPTZ,
  order_payment_sending_bank VARCHAR(10),
  order_payment_receiving_bank VARCHAR(10),
  order_payment_sender_name VARCHAR(255),
  order_payment_sender_account VARCHAR(255),
  order_payment_receiver_name VARCHAR(255),
  order_payment_receiver_account VARCHAR(255),
  order_payment_receiver_proxy_type VARCHAR(30),
  order_payment_receiver_proxy_value VARCHAR(255),
  order_payment_merchant_id VARCHAR(100),
  order_payment_provider_response JSONB NOT NULL DEFAULT '{}'::JSONB,
  order_payment_provider_code VARCHAR(100),
  order_payment_provider_message TEXT,
  order_payment_rejection_reason TEXT,
  order_payment_verified_at TIMESTAMPTZ,
  order_payment_reviewed_by VARCHAR(100),
  order_payment_reviewed_at TIMESTAMPTZ,
  order_payment_review_note TEXT,
  created_by VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by VARCHAR(100),
  updated_at TIMESTAMPTZ,
  deleted_by VARCHAR(100),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT tb_shopping_order_payments_uuid_unique UNIQUE (uuid),
  CONSTRAINT tb_shopping_order_payments_order_fk
    FOREIGN KEY (order_payment_order)
    REFERENCES tb_shopping_orders (uuid)
    ON DELETE RESTRICT,
  CONSTRAINT tb_shopping_order_payments_status_check
    CHECK (order_payment_status IN ('pending', 'verified', 'rejected', 'manual_review', 'error')),
  CONSTRAINT tb_shopping_order_payments_expected_amount_check
    CHECK (order_payment_expected_amount >= 0),
  CONSTRAINT tb_shopping_order_payments_verified_amount_check
    CHECK (order_payment_verified_amount IS NULL OR order_payment_verified_amount >= 0),
  CONSTRAINT tb_shopping_order_payments_slip_size_check
    CHECK (order_payment_slip_size IS NULL OR order_payment_slip_size > 0),
  CONSTRAINT tb_shopping_order_payments_verified_data_check
    CHECK (
      order_payment_status <> 'verified'
      OR (
        order_payment_transaction_ref IS NOT NULL
        AND order_payment_sending_bank IS NOT NULL
        AND order_payment_verified_amount IS NOT NULL
        AND order_payment_transaction_at IS NOT NULL
        AND order_payment_verified_at IS NOT NULL
      )
    )
);

CREATE INDEX IF NOT EXISTS tb_shopping_order_payments_order_created_idx
  ON tb_shopping_order_payments (order_payment_order, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS tb_shopping_order_payments_status_idx
  ON tb_shopping_order_payments (order_payment_status, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS tb_shopping_order_payments_slip_sha256_idx
  ON tb_shopping_order_payments (order_payment_slip_sha256)
  WHERE order_payment_slip_sha256 IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS tb_shopping_order_payments_transaction_unique
  ON tb_shopping_order_payments (order_payment_sending_bank, order_payment_transaction_ref)
  WHERE order_payment_transaction_ref IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS tb_shopping_order_payments_one_verified_per_order
  ON tb_shopping_order_payments (order_payment_order)
  WHERE order_payment_status = 'verified' AND deleted_at IS NULL;

ALTER TABLE tb_shopping_orders
  ADD COLUMN IF NOT EXISTS order_paid_at TIMESTAMPTZ;
