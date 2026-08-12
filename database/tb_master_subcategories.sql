CREATE TABLE IF NOT EXISTS tb_master_subcategories (
  id BIGSERIAL PRIMARY KEY,
  uuid UUID NOT NULL DEFAULT gen_random_uuid(),
  subcategory_category UUID NOT NULL,
  subcategory_name VARCHAR(100) NOT NULL,
  image_url TEXT,
  created_by VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by VARCHAR(100),
  updated_at TIMESTAMPTZ,
  deleted_by VARCHAR(100),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT tb_master_subcategories_uuid_unique UNIQUE (uuid),
  CONSTRAINT tb_master_subcategories_category_fk
    FOREIGN KEY (subcategory_category)
    REFERENCES tb_master_categories (uuid)
    ON DELETE RESTRICT,
  CONSTRAINT tb_master_subcategories_name_check
    CHECK (char_length(btrim(subcategory_name)) BETWEEN 1 AND 100)
);

CREATE UNIQUE INDEX IF NOT EXISTS tb_master_subcategories_active_name_unique
  ON tb_master_subcategories (subcategory_category, lower(btrim(subcategory_name)))
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS tb_master_subcategories_category_idx
  ON tb_master_subcategories (subcategory_category, id DESC)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS tb_product_subcategories (
  product_uuid UUID NOT NULL,
  subcategory_uuid UUID NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT tb_product_subcategories_pk
    PRIMARY KEY (product_uuid, subcategory_uuid),
  CONSTRAINT tb_product_subcategories_product_fk
    FOREIGN KEY (product_uuid)
    REFERENCES tb_master_products (uuid)
    ON DELETE CASCADE,
  CONSTRAINT tb_product_subcategories_subcategory_fk
    FOREIGN KEY (subcategory_uuid)
    REFERENCES tb_master_subcategories (uuid)
    ON DELETE RESTRICT,
  CONSTRAINT tb_product_subcategories_sort_order_check
    CHECK (sort_order >= 0)
);

CREATE INDEX IF NOT EXISTS tb_product_subcategories_subcategory_idx
  ON tb_product_subcategories (subcategory_uuid, product_uuid);

