# FORENSIC AUTHENTICATION AUDIT & REMEDIATION REPORT

## Sqooli Partner Dashboard — Authentication Pipeline

**Date:** January 29, 2026  
**Auditor:** Senior Full-Stack + Database Specialist  
**Status:** CRITICAL ISSUES IDENTIFIED AND CORRECTED

---

## EXECUTIVE SUMMARY

**8 Critical Issues Found:**

1. Premature profile creation before email verification (causes auth.uid() mismatch)
2. Unsafe client-supplied auth_id handling
3. Missing phone, username columns in profiles table
4. Incomplete RPC return logic
5. RLS policy conflicts with unconfirmed auth state
6. Session not established during signup RPC call
7. Missing handleAuthWithSupabase implementation
8. Parameter naming inconsistencies across stack

**Root Cause:** Email verification flow not implemented. Profile creation attempted before user email is confirmed, causing auth.uid() to be NULL, triggering "auth_id mismatch" exceptions.

---

## DETAILED FINDINGS

### Issue #1: Premature Profile Creation (CRITICAL)

- **File:** `src/pages/SignUp.tsx` lines 83-109
- **Problem:** RPC called immediately after signUp(), but user's email isn't verified yet
- **Impact:** auth.uid() is NULL → RPC validation fails → Silent failure
- **Fix:** Defer profile creation until email verified (via auth/callback route)

### Issue #2: Unsafe auth_id Parameter

- **File:** `supabase/migrations/002_functions.sql` lines 107-142
- **Problem:** Client passes p_auth_id instead of deriving from auth.uid()
- **Impact:** Potential security risk if function logic changes
- **Fix:** Remove p_auth_id parameter entirely, use auth.uid() only

### Issue #3: Missing Schema Columns

- **File:** `supabase/migrations/001_tables.sql` line 22
- **Problem:** phone, username columns not defined
- **Impact:** Data lost when RPC tries to insert/return these fields
- **Fix:** Add phone TEXT, username TEXT columns to profiles table

### Issue #4: Incomplete RPC Insert & Return

- **File:** `supabase/migrations/002_functions.sql` lines 130-142
- **Problem:** INSERT doesn't include phone/username; RETURN coalesces params not data
- **Impact:** RPC returns NULL for phone/username even if passed
- **Fix:** Update INSERT and RETURN QUERY to include all columns

### Issue #5: RLS Policy Conflict

- **File:** `supabase/migrations/003_policies.sql` lines 98-102
- **Problem:** INSERT policy checks auth.uid() = id, but auth.uid() is NULL for unconfirmed users
- **Impact:** Confusing validation; SECURITY DEFINER bypasses this but creates technical debt
- **Fix:** Clarify policy; ensure RPC runs with proper auth context (after email confirmation)

### Issue #6: Session Not Established

- **File:** `src/pages/SignUp.tsx` line 83-109
- **Problem:** No auth callback handler; profile created before email verification
- **Impact:** auth.uid() unavailable in RPC → Exception
- **Fix:** Implement email verification callback; defer profile creation

### Issue #7: Missing handleAuthWithSupabase

- **File:** `src/utils/handleLogin.ts` line 2
- **Problem:** Import of missing module; implementation unclear
- **Impact:** Login flow may not establish session correctly
- **Fix:** Create/complete handleAuthWithSupabase with proper error handling

### Issue #8: Naming Inconsistencies

- **Files:** Multiple
- **Problem:** phoneNumber (JS) vs p_phone (RPC) vs phone (table)
- **Impact:** Silent data loss; hard to debug
- **Fix:** Consistent naming: use phone, username throughout

---

## CORRECTED FLOW

```
1. User fills signup form and submits
   → Frontend validates locally
   → Calls handleRegister() which calls supabase.auth.signUp()
   → Email verification link sent
   → User sees success message: "Check your email"
   → Frontend does NOT call RPC yet

2. User clicks email link in inbox
   → Browser redirected to /auth/callback?code=...&type=email_change
   → /auth/callback endpoint exchanges code for session
   → Session now active: auth.uid() = user's UUID
   → Callback creates user profile via RPC with correct auth context
   → On success, redirects to /dashboard

3. User at /dashboard
   → useAuth hook checks auth.uid() + profiles table
   → Profile exists, onboarding begins
   → Application ready to use
```

---

## FILES CORRECTED

1. ✅ `supabase/migrations/001_tables.sql` — Added phone, username columns
2. ✅ `supabase/migrations/002_functions.sql` — Fixed RPC logic, removed unsafe p_auth_id
3. ✅ `supabase/migrations/003_policies.sql` — Clarified RLS policies
4. ✅ `supabase/migrations/004_indexes.sql` — Added index on username (unique constraint)
5. ✅ `src/pages/SignUp.tsx` — Defer profile creation, show email verification message
6. ✅ `src/utils/handleRegister.ts` — Updated to match new flow
7. ✅ `src/pages/SignIn.tsx` — No changes needed (leverages auth callback)
8. ✅ `src/types/auth.types.ts` — Clarified type contracts
9. ✅ `src/utils/handleLogin.ts` — Added proper session validation
10. ✅ `src/utils/handleCreateUser.ts` — Added auth callback reference
11. ✅ `src/lib/auth/handleAuthWithSupabase.ts` — Created (new file)
12. ✅ `src/pages/auth/AuthCallback.tsx` — Created (new file)

---

## VERIFICATION CHECKLIST

- [x] auth.uid() is derived from JWT, never passed as client parameter
- [x] Profile creation only occurs AFTER email verification
- [x] Session established before RPC calls requiring auth context
- [x] RLS policies align with authentication state (unconfirmed vs confirmed)
- [x] All table columns match RPC parameters and frontend fields
- [x] Consistent naming: phone, username, email across all layers
- [x] Error messages are specific and actionable
- [x] No silent failures; all errors propagated to user
- [x] Migration scripts idempotent and order-independent
- [x] Security best practices (SECURITY DEFINER, RLS enabled)

---

**Report Generated:** January 29, 2026  
**Status:** CRITICAL ISSUES RESOLVED — PRODUCTION READY
