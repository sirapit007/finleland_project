BEGIN;

ALTER TABLE tb_master_products
  ADD COLUMN IF NOT EXISTS product_shipping_weight_grams NUMERIC(12, 3),
  ADD COLUMN IF NOT EXISTS product_shipping_length_cm NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS product_shipping_width_cm NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS product_shipping_height_cm NUMERIC(10, 2);

ALTER TABLE tb_shopping_orders
  ADD COLUMN IF NOT EXISTS order_shipping_provider VARCHAR(50),
  ADD COLUMN IF NOT EXISTS order_shipping_service_code VARCHAR(50),
  ADD COLUMN IF NOT EXISTS order_shipping_rate_version VARCHAR(100),
  ADD COLUMN IF NOT EXISTS order_shipping_quote JSONB NOT NULL DEFAULT '{}'::JSONB,
  ADD COLUMN IF NOT EXISTS order_shipping_latitude NUMERIC(9, 6),
  ADD COLUMN IF NOT EXISTS order_shipping_longitude NUMERIC(9, 6);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tb_master_products_shipping_measurements_check'
  ) THEN
    ALTER TABLE tb_master_products
      ADD CONSTRAINT tb_master_products_shipping_measurements_check
      CHECK (
        (
          product_shipping_weight_grams IS NULL
          AND product_shipping_length_cm IS NULL
          AND product_shipping_width_cm IS NULL
          AND product_shipping_height_cm IS NULL
        )
        OR (
          product_shipping_weight_grams > 0
          AND product_shipping_length_cm > 0
          AND product_shipping_width_cm > 0
          AND product_shipping_height_cm > 0
        )
      );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS tb_shipping_services (
  shipping_service_code VARCHAR(50) PRIMARY KEY,
  shipping_service_provider VARCHAR(50) NOT NULL,
  shipping_service_label VARCHAR(150) NOT NULL,
  shipping_service_description TEXT,
  shipping_service_volumetric_divisor NUMERIC(10, 2),
  shipping_service_max_weight_kg NUMERIC(10, 2),
  shipping_service_estimated_days_min INTEGER,
  shipping_service_estimated_days_max INTEGER,
  shipping_service_is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS tb_shipping_rate_cards (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipping_rate_card_service_code VARCHAR(50) NOT NULL,
  shipping_rate_card_version VARCHAR(100) NOT NULL,
  shipping_rate_card_effective_from DATE NOT NULL,
  shipping_rate_card_effective_to DATE,
  shipping_rate_card_is_active BOOLEAN NOT NULL DEFAULT TRUE,
  shipping_rate_card_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  CONSTRAINT tb_shipping_rate_cards_service_fk
    FOREIGN KEY (shipping_rate_card_service_code)
    REFERENCES tb_shipping_services (shipping_service_code)
    ON DELETE RESTRICT,
  CONSTRAINT tb_shipping_rate_cards_service_version_unique
    UNIQUE (shipping_rate_card_service_code, shipping_rate_card_version),
  CONSTRAINT tb_shipping_rate_cards_effective_dates_check
    CHECK (
      shipping_rate_card_effective_to IS NULL
      OR shipping_rate_card_effective_to >= shipping_rate_card_effective_from
    )
);

CREATE TABLE IF NOT EXISTS tb_shipping_rate_tiers (
  id BIGSERIAL PRIMARY KEY,
  shipping_rate_tier_card UUID NOT NULL,
  shipping_rate_tier_order INTEGER NOT NULL,
  shipping_rate_tier_max_weight_kg NUMERIC(10, 2) NOT NULL,
  shipping_rate_tier_max_size_cm NUMERIC(10, 2),
  shipping_rate_tier_fee NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  CONSTRAINT tb_shipping_rate_tiers_card_fk
    FOREIGN KEY (shipping_rate_tier_card)
    REFERENCES tb_shipping_rate_cards (uuid)
    ON DELETE CASCADE,
  CONSTRAINT tb_shipping_rate_tiers_card_order_unique
    UNIQUE (shipping_rate_tier_card, shipping_rate_tier_order),
  CONSTRAINT tb_shipping_rate_tiers_values_check
    CHECK (
      shipping_rate_tier_order > 0
      AND shipping_rate_tier_max_weight_kg > 0
      AND (
        shipping_rate_tier_max_size_cm IS NULL
        OR shipping_rate_tier_max_size_cm > 0
      )
      AND shipping_rate_tier_fee >= 0
    )
);

CREATE INDEX IF NOT EXISTS tb_shipping_rate_cards_active_idx
  ON tb_shipping_rate_cards (
    shipping_rate_card_service_code,
    shipping_rate_card_effective_from DESC
  )
  WHERE shipping_rate_card_is_active = TRUE;

INSERT INTO tb_shipping_services (
  shipping_service_code,
  shipping_service_provider,
  shipping_service_label,
  shipping_service_description,
  shipping_service_volumetric_divisor,
  shipping_service_max_weight_kg,
  shipping_service_estimated_days_min,
  shipping_service_estimated_days_max,
  shipping_service_is_active,
  updated_at
) VALUES
  (
    'thailand_post_ems', 'thailand_post', 'ไปรษณีย์ไทย EMS',
    'จัดส่งพัสดุต่างจังหวัดตามน้ำหนักหลังแพ็ก', NULL, 30, 1, 3, TRUE, NOW()
  ),
  (
    'flash_bulky', 'flash_express', 'Flash Express Bulky',
    'จัดส่งสินค้าขนาดใหญ่ตามน้ำหนักจริงหรือน้ำหนักปริมาตร',
    6000, 50, 2, 4, TRUE, NOW()
  )
ON CONFLICT (shipping_service_code) DO UPDATE SET
  shipping_service_provider = EXCLUDED.shipping_service_provider,
  shipping_service_label = EXCLUDED.shipping_service_label,
  shipping_service_description = EXCLUDED.shipping_service_description,
  shipping_service_volumetric_divisor = EXCLUDED.shipping_service_volumetric_divisor,
  shipping_service_max_weight_kg = EXCLUDED.shipping_service_max_weight_kg,
  shipping_service_estimated_days_min = EXCLUDED.shipping_service_estimated_days_min,
  shipping_service_estimated_days_max = EXCLUDED.shipping_service_estimated_days_max,
  shipping_service_is_active = EXCLUDED.shipping_service_is_active,
  updated_at = NOW();

INSERT INTO tb_shipping_rate_cards (
  shipping_rate_card_service_code,
  shipping_rate_card_version,
  shipping_rate_card_effective_from,
  shipping_rate_card_is_active,
  shipping_rate_card_note,
  updated_at
) VALUES
  (
    'thailand_post_ems', 'user-rate-card-2569-08-30', DATE '2026-08-30', TRUE,
    'อัตราจากภาพที่ผู้ใช้ให้มา: มากกว่า 20 กก. เพิ่ม 25 บาทต่อกิโลกรัม สูงสุด 30 กก.', NOW()
  ),
  (
    'flash_bulky', 'user-rate-card-2569-08-30', DATE '2026-08-30', TRUE,
    'อัตราจากภาพที่ผู้ใช้ให้มา โดยตีความขนาดเป็นผลรวม กว้าง+ยาว+สูง', NOW()
  )
ON CONFLICT (
  shipping_rate_card_service_code,
  shipping_rate_card_version
) DO UPDATE SET
  shipping_rate_card_effective_from = EXCLUDED.shipping_rate_card_effective_from,
  shipping_rate_card_is_active = EXCLUDED.shipping_rate_card_is_active,
  shipping_rate_card_note = EXCLUDED.shipping_rate_card_note,
  updated_at = NOW();

WITH rate_card AS (
  SELECT uuid
  FROM tb_shipping_rate_cards
  WHERE shipping_rate_card_service_code = 'thailand_post_ems'
    AND shipping_rate_card_version = 'user-rate-card-2569-08-30'
)
INSERT INTO tb_shipping_rate_tiers (
  shipping_rate_tier_card,
  shipping_rate_tier_order,
  shipping_rate_tier_max_weight_kg,
  shipping_rate_tier_max_size_cm,
  shipping_rate_tier_fee,
  updated_at
)
SELECT rate_card.uuid, tier_order, max_weight_kg, NULL, fee, NOW()
FROM rate_card
CROSS JOIN (VALUES
  (1, 1, 20), (2, 2, 30), (3, 3, 42), (4, 4, 56), (5, 5, 66),
  (6, 6, 79), (7, 7, 89), (8, 8, 99), (9, 9, 109), (10, 10, 135),
  (11, 11, 145), (12, 12, 155), (13, 13, 165), (14, 14, 175),
  (15, 15, 185), (16, 16, 195), (17, 17, 205), (18, 18, 215),
  (19, 19, 225), (20, 20, 235), (21, 21, 260), (22, 22, 285),
  (23, 23, 310), (24, 24, 335), (25, 25, 360), (26, 26, 385),
  (27, 27, 410), (28, 28, 435), (29, 29, 460), (30, 30, 485)
) AS tiers(tier_order, max_weight_kg, fee)
ON CONFLICT (shipping_rate_tier_card, shipping_rate_tier_order) DO UPDATE SET
  shipping_rate_tier_max_weight_kg = EXCLUDED.shipping_rate_tier_max_weight_kg,
  shipping_rate_tier_max_size_cm = EXCLUDED.shipping_rate_tier_max_size_cm,
  shipping_rate_tier_fee = EXCLUDED.shipping_rate_tier_fee,
  updated_at = NOW();

WITH rate_card AS (
  SELECT uuid
  FROM tb_shipping_rate_cards
  WHERE shipping_rate_card_service_code = 'flash_bulky'
    AND shipping_rate_card_version = 'user-rate-card-2569-08-30'
)
INSERT INTO tb_shipping_rate_tiers (
  shipping_rate_tier_card,
  shipping_rate_tier_order,
  shipping_rate_tier_max_weight_kg,
  shipping_rate_tier_max_size_cm,
  shipping_rate_tier_fee,
  updated_at
)
SELECT rate_card.uuid, tier_order, max_weight_kg, max_size_cm, fee, NOW()
FROM rate_card
CROSS JOIN (VALUES
  (1, 5, 80, 50), (2, 6, 85, 60), (3, 7, 90, 70),
  (4, 8, 95, 80), (5, 9, 100, 90), (6, 10, 105, 100),
  (7, 11, 110, 105), (8, 12, 115, 115), (9, 13, 120, 125),
  (10, 14, 125, 135), (11, 15, 130, 145), (12, 16, 135, 155),
  (13, 17, 140, 165), (14, 18, 145, 175), (15, 19, 150, 185),
  (16, 20, 155, 195), (17, 21, 160, 205), (18, 22, 165, 215),
  (19, 23, 170, 225), (20, 24, 175, 235), (21, 25, 180, 245),
  (22, 26, 185, 255), (23, 27, 190, 265), (24, 28, 195, 275),
  (25, 29, 200, 285), (26, 30, 205, 295), (27, 31, 210, 305),
  (28, 32, 215, 305), (29, 33, 220, 315), (30, 34, 225, 335),
  (31, 35, 230, 345), (32, 36, 235, 355), (33, 37, 240, 365),
  (34, 38, 245, 375), (35, 39, 250, 385), (36, 40, 255, 395),
  (37, 41, 260, 405), (38, 42, 265, 415), (39, 43, 270, 425),
  (40, 44, 272, 435), (41, 45, 275, 445), (42, 46, 277, 455),
  (43, 47, 279, 465), (44, 48, 281, 475), (45, 49, 284, 485),
  (46, 50, 286, 495)
) AS tiers(tier_order, max_weight_kg, max_size_cm, fee)
ON CONFLICT (shipping_rate_tier_card, shipping_rate_tier_order) DO UPDATE SET
  shipping_rate_tier_max_weight_kg = EXCLUDED.shipping_rate_tier_max_weight_kg,
  shipping_rate_tier_max_size_cm = EXCLUDED.shipping_rate_tier_max_size_cm,
  shipping_rate_tier_fee = EXCLUDED.shipping_rate_tier_fee,
  updated_at = NOW();

COMMIT;
