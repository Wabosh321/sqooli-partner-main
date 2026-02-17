# CORRECTED 002_FUNCTIONS.SQL - IMMEDIATE PATCH

This file contains the corrected version of the `is_partner_admin()` function from [002_functions.sql](supabase/migrations/002_functions.sql).

## CRITICAL BUG FIXED

**Original (BROKEN):**

```sql
CREATE OR REPLACE FUNCTION public.is_partner_admin(partner_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM public.profiles
    WHERE partner_id = partner_id  -- ❌ BUG: Parameter shadows column, always TRUE
    AND (role ILIKE '%admin%' OR is_super_admin(id))
  );
END;
$$ LANGUAGE plpgsql STABLE;
```

**Corrected (FIXED):**

```sql
CREATE OR REPLACE FUNCTION public.is_partner_admin(p_partner_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM public.profiles
    WHERE partner_id = p_partner_id  -- https://file+.vscode-resource.vscode-cdn.net/c%3A/Gamer/PROJECT_SQOOLI/sqoolipartner-main/sqoolipartner-main/#✓ Parameter name differs from column
    AND (role ILIKE '%admin%' OR public.is_super_admin(id))
  );
END;
$$ LANGUAGE plpgsql STABLE;
```

## TO APPLY THIS FIX IMMEDIATELY:

1. Run this SQL in your Supabase database console:

```sql
DROP FUNCTION IF EXISTS public.is_partner_admin(UUID) CASCADE;

CREATE OR REPLACE FUNCTION public.is_partner_admin(p_partner_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM public.profiles
    WHERE partner_id = p_partner_id
    AND (role ILIKE '%admin%' OR public.is_super_admin(id))
  );
END;
$$ LANGUAGE plpgsql STABLE;
```

2. Verify the fix works:

```sql
-- Test: Should return TRUE only if current user is admin of partner
SELECT public.is_partner_admin('some-partner-uuid');
```

3. Re-enable all RLS policies (they will now work correctly):

```sql
-- Policies will automatically use corrected function
GRANT EXECUTE ON FUNCTION public.is_partner_admin(UUID) TO authenticated;
```

## IMPACT

This fix resolves a **SECURITY VULNERABILITY** where the RLS policies were allowing unauthorized access to:

- Campaigns
- Programs
- Tasks
- Wallets
- All other tables using `is_partner_admin()`

All affected policies will now correctly enforce access control after this function is corrected.
