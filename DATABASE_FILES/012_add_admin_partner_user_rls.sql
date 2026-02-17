-- Migration 012: Add RLS policies for admin_partner user management
-- Purpose: Allow admin_partner users to SELECT, INSERT, and UPDATE users within their partner
-- Date: January 2, 2026

-- ============================================================================
-- ADD RLS POLICIES FOR ADMIN_PARTNER USER MANAGEMENT
-- ============================================================================

-- Allow admin_partner users to SELECT all users in their partner
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'admin_partner_select_users' 
    AND tablename = 'users'
  ) THEN
    CREATE POLICY "admin_partner_select_users" ON users 
    FOR SELECT
    USING (
      -- Admin partner can see users in their partner
      partner_id IN (
        SELECT partner_id FROM users 
        WHERE auth_id = auth.uid() 
        AND (role = 'admin_partner' OR role = 'super_admin')
      )
      OR
      -- Users can always see themselves
      auth_id = auth.uid()
    );
  END IF;
END $$;

-- Allow admin_partner users to INSERT users into their partner
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'admin_partner_insert_users' 
    AND tablename = 'users'
  ) THEN
    CREATE POLICY "admin_partner_insert_users" ON users 
    FOR INSERT
    WITH CHECK (
      -- Admin partner can create users in their partner
      partner_id IN (
        SELECT partner_id FROM users 
        WHERE auth_id = auth.uid() 
        AND (role = 'admin_partner' OR role = 'super_admin')
      )
      OR
      -- Service role bypass (for backend operations)
      auth.role() = 'service_role'
    );
  END IF;
END $$;

-- Allow admin_partner users to UPDATE users in their partner
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'admin_partner_update_users' 
    AND tablename = 'users'
  ) THEN
    CREATE POLICY "admin_partner_update_users" ON users 
    FOR UPDATE
    USING (
      -- Admin partner can update users in their partner
      partner_id IN (
        SELECT partner_id FROM users 
        WHERE auth_id = auth.uid() 
        AND (role = 'admin_partner' OR role = 'super_admin')
      )
      OR
      -- Users can update themselves
      auth_id = auth.uid()
    )
    WITH CHECK (
      -- Admin partner can update users in their partner
      partner_id IN (
        SELECT partner_id FROM users 
        WHERE auth_id = auth.uid() 
        AND (role = 'admin_partner' OR role = 'super_admin')
      )
      OR
      -- Users can update themselves
      auth_id = auth.uid()
    );
  END IF;
END $$;

-- Allow admin_partner users to DELETE users in their partner
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'admin_partner_delete_users' 
    AND tablename = 'users'
  ) THEN
    CREATE POLICY "admin_partner_delete_users" ON users 
    FOR DELETE
    USING (
      -- Admin partner can delete users in their partner
      partner_id IN (
        SELECT partner_id FROM users 
        WHERE auth_id = auth.uid() 
        AND (role = 'admin_partner' OR role = 'super_admin')
      )
    );
  END IF;
END $$;

-- ============================================================================
-- NOTES & VERIFICATION
-- ============================================================================
--
-- After applying this migration, verify:
--
-- 1. Admin partner can SELECT users in their partner:
--    SELECT * FROM users WHERE partner_id = '<partner_id>'
--
-- 2. Admin partner can INSERT users:
--    INSERT INTO users (partner_id, email, role, ...) VALUES (...)
--
-- 3. Admin partner can UPDATE users (e.g., change role):
--    UPDATE users SET role = 'media_partner' WHERE partner_id = '<partner_id>'
--
-- 4. Admin partner can DELETE users:
--    DELETE FROM users WHERE partner_id = '<partner_id>'
--
-- 5. Regular users can still only SELECT/UPDATE themselves
--
-- Testing with maxwellmutonyiwabomba@gmail.com:
-- - User has role='admin_partner'
-- - User has partner_id='f74b13a5-145e-42e2-ad53-5f130dd496b5'
-- - Query: SELECT * FROM users WHERE partner_id = 'f74b13a5-145e-42e2-ad53-5f130dd496b5'
--   Should return 0 or more users
--
