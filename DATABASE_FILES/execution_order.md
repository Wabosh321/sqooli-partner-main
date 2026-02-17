# Supabase Migration Execution Order

## Overview

This migration suite is organized into 4 files with clear separation of concerns:

1. **001_tables.sql** - Create all tables in dependency order
2. **002_functions.sql** - Create all functions and triggers
3. **003_policies.sql** - Enable RLS and create all policies
4. **004_indexes.sql** - Create all indexes for performance

## Execution Sequence

Run the migrations in this exact order:

```
001_tables.sql    (Creates all table definitions)
    ↓
002_functions.sql (Creates helper functions, RPC functions, triggers)
    ↓
003_policies.sql  (Enables RLS, creates all policies)
    ↓
004_indexes.sql   (Creates indexes)
```

## Why This Order?

### 001_tables.sql First

- Tables have no dependencies on functions or policies
- Tables only depend on other tables (via FKs)
- All table dependencies are in correct order (parents before children)

### 002_functions.sql Second

- Functions require tables to exist
- Triggers reference tables
- Functions used by policies (created next)

### 003_policies.sql Third

- Policies require functions to exist
- RLS can be enabled once tables exist
- Policies use helper functions from 002

### 004_indexes.sql Last

- Indexes require tables to exist
- Creating indexes last is more efficient
- Indexes are performance optimization, not required for functionality

## Table Dependency Graph

```
auth.users (Supabase Auth)
    ↓
partners (001)
    ↓
    ├→ profiles (002) ← also refs profiles itself
    │
    ├→ campaigns (003)
    │   ├→ depends on: partners, profiles, programs
    │   └→ programs FK added via ALTER (deferred)
    │
    ├→ programs (004)
    │   └→ depends on: partners, profiles
    │
    ├→ tasks (005)
    │   ├→ depends on: campaigns, profiles
    │   └→ FK from campaigns.program_id added in 001
    │
    ├→ audit_logs (006)
    │   └→ depends on: profiles (nullable)
    │
    ├→ user_activity_log (007)
    │   └→ depends on: profiles (both user_id and parent_user_id)
    │
    └→ user_performance_metrics (008)
        └→ depends on: profiles (both user_id and parent_user_id)
```

## Function Dependency Graph

```
is_super_admin()
    ├→ Used by: is_partner_admin()
    ├→ Used by: RLS policies across all tables
    └→ Defined in: 002_functions.sql

get_user_partner_id()
    ├→ Used by: RLS policies in campaigns, programs
    └→ Defined in: 002_functions.sql

is_partner_admin()
    ├→ Depends on: is_super_admin()
    ├→ Used by: RLS policies in campaigns, programs, tasks
    └→ Defined in: 002_functions.sql

is_authenticated()
    ├→ Used by: RLS policy in audit_logs
    └→ Defined in: 002_functions.sql

rpc_onboard_partner_user()
    ├→ Depends on: partners, profiles tables
    └→ Defined in: 002_functions.sql

rpc_log_audit_event()
    ├→ Depends on: audit_logs table
    └→ Defined in: 002_functions.sql
```

## Testing After Deployment

### Verify Tables Created

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('partners', 'profiles', 'campaigns', 'programs', 'tasks', 'audit_logs', 'user_activity_log', 'user_performance_metrics')
ORDER BY table_name;
```

### Verify Functions Created

```sql
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('is_super_admin', 'get_user_partner_id', 'is_partner_admin', 'rpc_onboard_partner_user', 'rpc_log_audit_event')
ORDER BY routine_name;
```

### Verify RLS Enabled

```sql
SELECT schemaname, tablename FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true
ORDER BY tablename;
```

### Count RLS Policies

```sql
SELECT schemaname, tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;
```

### Verify Indexes Created

```sql
SELECT tablename, indexname FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

## Known Issues & Solutions

### Issue: "relation X does not exist"

- **Cause:** Running migrations out of order
- **Solution:** Always run in sequence: 001 → 002 → 003 → 004

### Issue: "function X does not exist"

- **Cause:** Running 003_policies before 002_functions
- **Solution:** Ensure 002_functions completes successfully before running 003_policies

### Issue: Foreign key constraint errors

- **Cause:** Parent table doesn't exist when creating child table
- **Solution:** Check table dependency graph above; tables are created in correct order

### Issue: RLS policy creation fails

- **Cause:** Policy references undefined function
- **Solution:** Ensure 002_functions ran completely before 003_policies

## Rollback Instructions

If something goes wrong, you can delete migrations individually:

1. Delete most recent migration (starting from 004)
2. Work backwards to find the problematic migration
3. Fix the migration SQL
4. Rerun from the fixed file onwards

Or, drop entire schema and start over:

```sql
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres, anon, authenticated, service_role;
```

Then re-run all 4 migrations.

## Migration File Sizes

| File              | Tables | Functions | Policies | Indexes | Size    |
| ----------------- | ------ | --------- | -------- | ------- | ------- |
| 001_tables.sql    | 8      | -         | -        | -       | ~2.5 KB |
| 002_functions.sql | -      | 10+       | -        | -       | ~3 KB   |
| 003_policies.sql  | -      | -         | 26+      | -       | ~4 KB   |
| 004_indexes.sql   | -      | -         | -        | 20+     | ~1.5 KB |

## Performance Notes

- All tables use UUID primary keys with `gen_random_uuid()`
- Foreign keys use `ON DELETE CASCADE` or `ON DELETE SET NULL` as appropriate
- Timestamps use `TIMESTAMP WITH TIME ZONE` for timezone awareness
- JSONB fields used for flexible data structures
- Indexes created on foreign keys, frequently queried columns, and status fields

## Support

For issues:

1. Check the "Testing After Deployment" section
2. Review the "Known Issues" section
3. Check table/function dependency graphs above
4. Verify migrations ran in correct order
