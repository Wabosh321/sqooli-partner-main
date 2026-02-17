Executive summary

- Centralized sidebar visibility, access, and lock logic into a single, typed resolver: `src/components/ui/sidebar/resolveSidebarSections.ts`.
- Consumers updated to use resolver as the canonical decision engine. No inline partner-type access maps remain in the updated hooks and sidebar layout.

Architectural explanation (before → after)

- Before: multiple scattered maps and JSX-level checks determined sidebar visibility and permission decisions (inline partner-type maps in hooks, PermissionProvider producing permissions inconsistently).
- After: `resolveSidebarSections` is the single source-of-truth. It accepts partner type, access level, user role, resolved permissions, and partner flags, and returns visible/allowed sections and helpers (`isVisible`, `isAllowed`, `isLocked`). All access decisions must call it.

Partner Type × Sidebar Items

- media: dashboard, campaigns, programs, wallet, reports, tasks, settings
- beneficiary: dashboard, beneficiaries, sponsorships, wallet, users, settings, reports

Partner Type × Sections (visible vs allowed)

- Visible: determined by partner_type or access_level via resolver mappings above.
- Allowed: visible sections filtered by user role and explicit permissions. Roles `super_admin`, `partner_admin`, `admin_partner` bypass permission checks.
- Locked: onboarding-locks (campaigns, programs, users) until `wallet_setup_completed` && `campaign_created` are true.

Role × Permission × Outcome

- `super_admin`, `partner_admin`, `admin_partner`: allowed all visible sections (bypass checks).
- Other roles: allowed only if `permissions` contains either `category === section` or `key === ${section}.read`, or `all_access`/`full` level present.
- If not allowed but visible, UI should route to `LockedSection` (or show locked state in sidebar). If not visible, item is hidden.

File-by-file responsibility matrix

- `src/components/ui/sidebar/resolveSidebarSections.ts`: Canonical resolver — visibility, allowed, locked helpers (primary decision engine).
- `src/components/ui/sidebar/sidebar.config.ts`: Sidebar menu item metadata (id, label, icon, requiredCategory). No access logic.
- `src/context/PermissionProvider.tsx`: Produces `Permission[]` from resolver for current partner; exposes permission helpers that operate on permission array.
- `src/context/PermissionContext.tsx`: Permission types and context shape.
- `src/hooks/usePartnerAccess.ts`: Lightweight wrapper that calls resolver and provides convenience methods: `canAccessSection`, `isSectionAllowed`, `isSectionLocked`, `getAvailableSections`.
- `src/hooks/usePartnerPermissions.ts`: Partner-level helpers using resolver (partner-type awareness).
- `src/components/layout/Sidebar.tsx`: Renders items using resolver for visibility and locked state; removes inline maps and checks.
- `src/components/layout/Header.tsx`: Uses resolver flags (isMedia/isBeneficiary) for presentation decisions (badge vs title).
- `src/pages/Dashboard.tsx`: Uses `usePartnerAccess` `isSectionAllowed` for section rendering logic; falls back to permission checks produced by `PermissionProvider`.

Explicit assumptions

- The canonical resolver controls all visibility and lock decisions; callers must not reimplement partner-type logic.
- `PermissionProvider` continues to expose permission arrays; those arrays are derived from resolver-visible sections (read-level entries).
- Onboarding locks target a small, well-defined set: `campaigns`, `programs`, `users`.
- Consumers that require partner metadata for lock decisions will pass `partnerFlags` (onboarding, wallet, campaign) to the resolver; hooks supply these flags from `useAuth()`.
- This patch only modifies code to centralize logic; it does not change database state or migration files.

Notes

- Run `pnpm exec tsc --noEmit` to validate TypeScript. The repository contains existing, pre-existing type issues unrelated to the resolver refactor; the resolver and updated consumers are typed and integrated, but a full TS clean requires broader repo fixes outside the scope of this refactor.

Change summary (files added/modified)

- Modified: `src/components/ui/sidebar/resolveSidebarSections.ts` (new typed resolver)
- Modified: `src/hooks/usePartnerAccess.ts` (now uses resolver exclusively)
- Modified: `src/hooks/usePartnerPermissions.ts` (uses resolver)
- Modified: `src/context/PermissionProvider.tsx` (derives permissions from resolver)
- Modified: `src/components/layout/Sidebar.tsx` (consumes resolver; removed inline checks)
- Modified: `src/components/layout/Header.tsx` (uses resolver flags for badge)
- Modified: `src/pages/Dashboard.tsx` (delegates access decisions to resolver via hook)

All changes are limited to code-level refactor; no DB migrations were modified per instruction.
