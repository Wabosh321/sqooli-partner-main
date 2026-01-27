-- Migration: add partner_id to users and populate from partners.user_id
-- Backup your DB before running. Designed for PostgreSQL.

BEGIN;

-- 1) Add column if missing
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS partner_id uuid;

-- 2) Populate partner_id from partners.user_id when available
UPDATE users u
SET partner_id = p.id
FROM partners p
WHERE p.user_id = u.id
  AND (u.partner_id IS DISTINCT FROM p.id OR u.partner_id IS NULL);

-- 3) Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_partner_id ON users(partner_id);

-- 4) Add foreign key constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_users_partner'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT fk_users_partner FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE SET NULL;
  END IF;
END$$;

COMMIT;

-- Verification queries (run after migration):
-- SELECT count(*) FROM users WHERE partner_id IS NOT NULL;
-- SELECT u.id, u.email, u.partner_id, p.id AS partner_id_from_partners, p.user_id
-- FROM users u LEFT JOIN partners p ON p.user_id = u.id
-- WHERE u.id = '3c5bfe77-4b49-452c-80bc-9513167cda3f';
