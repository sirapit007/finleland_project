CREATE TABLE IF NOT EXISTS tb_user_contacts (
  id BIGSERIAL PRIMARY KEY,
  uuid UUID NOT NULL DEFAULT gen_random_uuid(),
  contact_user VARCHAR(100) NOT NULL,
  contact_message TEXT NOT NULL,
  contact_status VARCHAR(20) NOT NULL DEFAULT 'new',
  created_by VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by VARCHAR(100),
  updated_at TIMESTAMPTZ,
  deleted_by VARCHAR(100),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT tb_user_contacts_uuid_unique UNIQUE (uuid),
  CONSTRAINT tb_user_contacts_message_length_check
    CHECK (char_length(btrim(contact_message)) BETWEEN 5 AND 5000),
  CONSTRAINT tb_user_contacts_status_check
    CHECK (contact_status IN ('new', 'reviewed', 'resolved'))
);

CREATE INDEX IF NOT EXISTS tb_user_contacts_created_at_idx
  ON tb_user_contacts (created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS tb_user_contacts_status_idx
  ON tb_user_contacts (contact_status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS tb_user_contacts_user_idx
  ON tb_user_contacts (contact_user)
  WHERE deleted_at IS NULL;
