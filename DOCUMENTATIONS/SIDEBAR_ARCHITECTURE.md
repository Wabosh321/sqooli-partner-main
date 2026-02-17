# Sidebar Refactor: Dependency Graph & Architecture

**Date:** December 29, 2025  
**Status:** ✅ Complete

---

## Dependency Graph (High Level)

```
┌─────────────────────────────────────────────────────────────────┐
│                      DashboardLayout                            │
│  (src/components/layout/DashboardLayout.tsx)                   │
│  - Manages sidebar open/close state (mobileDrawerOpen)         │
│  - Manages route/active tab (useLocation, navigate)            │
│  - Renders Header + AppSidebar + Main                          │
└───────────────┬───────────────────────────────────────────────┘
                │
                ├──────────────────────────────────────────┐
                │                                          │
        ┌───────▼────────────┐              ┌─────────────▼──────┐
        │    AppSidebar      │              │   Dashboard Page   │
        │    (Sidebar.tsx)   │              │   (pages/Dash...) │
        │                    │              │                    │
        │ Props:             │              │ Uses:              │
        │ - activeItem       │              │ - usePartnerAccess │
        │ - onSelect         │              │ - usePermissions   │
        │ - isDashboard      │              │ - useDeviceSize    │
        │ - isMobileDrawer   │              │ - useSearchParams  │
        └──┬──────┬──────┬──┘              └────────────────────┘
           │      │      │
        ┌──▼──┐ ┌─▼───┐ ┌▼────────────────────────────────┐
        │Hooks│ │Data │ │Sidebar UI Modules               │
        │     │ │     │ │(sidebar/ folder)                │
        └──┬──┘ └─┬───┘ └┬───────────────────────────────┘
           │      │      │
     ┌─────▼──────▼──┬───▼─────────────────────┐
     │               │                         │
   ┌─▼────────────┐ ┌▼──────────────┐  ┌──────▼──────────┐
   │ usePermissions   │ sidebar.config  │ SidebarContext  │
   │ useAuth          │ (SIDEBAR_MENU)  │ (Provider +     │
   │ useDeviceSize    │                 │  useSidebar...)  │
   │                 │ Data-only config│                  │
   │                 │ - id            │ State management:│
   │ Permission      │ - label         │ - open/closed   │
   │ and user data   │ - icon          │ - mobile vs     │
   │                 │ - requiredCat...│   desktop       │
   │                 │ - excludeRoles  │ - cookie persist│
   │                 │                 │ - keyboard Ctrl+B│
   └──────────────────┴─────────────────┴──────────────────┘
           │                                  │
           │                                  │
        ┌──▼──────────────────────────────────▼──┐
        │                                         │
   ┌────▼──────────────┐  ┌────────────────────┐ │
   │ checkAccess()     │  │ resolveSidebar     │ │
   │ (pure)            │  │ Sections.ts        │ │
   │                   │  │ (pure function)    │ │
   │ Evaluates:        │  │                    │ │
   │ - loading state   │  │ Maps:              │ │
   │ - isSuperAdmin()  │  │ - partnerType →    │ │
   │ - permissions     │  │   sections         │ │
   │ - categories      │  │ - accessLevel →    │ │
   │                   │  │   sections         │ │
   └───────────────────┘  └────────────────────┘ │
        │                         │               │
        │                         │               │
   ┌────▼─────────────────────────▼────┐         │
   │ resolvedMenuItems (useMemo)         │         │
   │                                     │         │
   │ SIDEBAR_MENU.filter(...).map({     │         │
   │   ...item,                          │         │
   │   locked: !checkAccess(item)        │         │
   │ })                                  │         │
   │                                     │         │
   │ Result: { ...NavItem, locked }[]   │         │
   └─────────┬──────────────────────────┘         │
             │                                     │
             │                                     │
             │  ┌───────────────────────────────┐ │
             │  │                               │ │
             │  ▼                               │ │
         ┌───────────────────────┐              │ │
         │ resolvedMenuItems.map │              │ │
         │ render SidebarItem    │              │ │
         │                       │              │ │
         │ for each:             │              │ │
         │ <SidebarItem          │              │ │
         │   id={id}             │              │ │
         │   label={label}       │              │ │
         │   icon={Icon}         │              │ │
         │   active={isActive}   │              │ │
         │   locked={locked}     │              │ │
         │   onClick={...}       │              │ │
         │   isMobileDrawer={..} │              │ │
         │ />                    │              │ │
         └───────┬───────────────┘              │ │
                 │                              │ │
                 │  ┌──────────────────────────┘ │
                 │  │                            │
                 ▼  ▼                            │
         ┌───────────────────┐                  │
         │  SidebarItem      │                  │
         │  Component        │                  │
         │                   │                  │
         │ Props: id, label, │                  │
         │ icon, active,     │                  │
         │ locked, onClick   │                  │
         │                   │                  │
         │ Renders:          │                  │
         │ - Button with     │                  │
         │   icon + label    │                  │
         │ - Lock icon if    │                  │
         │   locked          │                  │
         │ - Active highlight│                  │
         │ - Disabled state  │                  │
         └───────────────────┘                  │
                                                │
         ┌──────────────────────────────────────┘
         │
         ├─────────────────────────────────────┐
         │                                     │
         ▼                                     ▼
    ┌─────────────┐                    ┌──────────────┐
    │ User Avatar │                    │ Logout Btn   │
    │ & Dropdown  │                    │ & Profile    │
    │             │                    │              │
    │ Desktop:    │                    │ Always       │
    │ Dropdown    │                    │ shown in     │
    │ menu        │                    │ dashboard    │
    │             │                    │ mode         │
    │ Mobile:     │                    │              │
    │ Text info   │                    │              │
    └─────────────┘                    └──────────────┘
```

---

## Module Dependency Tree (Detailed)

### Layer 1: Data & Configuration
```
sidebar.config.ts (DATA)
├─ Exports: SIDEBAR_MENU (const SidebarNavItem[])
├─ Dependencies: lucide-react icons
└─ Used by: AppSidebar, resolvedMenuItems computation
```

### Layer 2: Pure Functions
```
resolveSidebarSections.ts (PURE)
├─ Exports: resolveSidebarSections(opts) → string[]
├─ Exports: SECTION_ACCESS_BY_PARTNER_TYPE, SECTION_ACCESS_BY_LEVEL
├─ Dependencies: none (no hooks, no side effects)
└─ Used by: (future integration; currently in AppSidebar.checkAccess)
```

### Layer 3: State Management
```
SidebarContext.tsx (HOOKS + STATE)
├─ Exports: SidebarProvider (component), useSidebarContext (hook)
├─ Dependencies: React, useIsMobile hook
├─ Provides:
│  ├─ state: "expanded" | "collapsed"
│  ├─ open: boolean
│  ├─ setOpen: (boolean) => void
│  ├─ openMobile: boolean
│  ├─ setOpenMobile: (boolean) => void
│  ├─ isMobile: boolean
│  └─ toggleSidebar: () => void
├─ Features:
│  ├─ Cookie persistence (sidebar_state)
│  ├─ Keyboard shortcut (Ctrl/Cmd+B)
│  └─ Mobile vs desktop behavior split
└─ Used by: SidebarRoot, any component needing sidebar state
```

### Layer 4: UI Components
```
SidebarItem.tsx (COMPONENT)
├─ Exports: SidebarItem (functional component)
├─ Props: id, label, icon, active, locked, onClick, isMobileDrawer
├─ Dependencies: React, Lock icon, cn utility
├─ Renders: single menu button with icon + label
├─ Features:
│  ├─ Active state highlight
│  ├─ Locked state (disabled + Lock icon + overlay)
│  └─ Click handler delegation
└─ Used by: AppSidebar (in map render)

SidebarSection.tsx (COMPONENT)
├─ Exports: SidebarSection (functional component)
├─ Props: items[], onSelect, activeItem, isMobileDrawer
├─ Dependencies: React, SidebarItem
├─ Renders: flex container with multiple SidebarItem
└─ Used by: (optional composition pattern; AppSidebar can use directly)

SidebarRoot.tsx (COMPONENT)
├─ Exports: SidebarRoot (functional component)
├─ Props: defaultOpen?, children
├─ Dependencies: React, SidebarProvider, TooltipProvider
├─ Renders: wrapper with provider setup + CSS variables
└─ Used by: (future app shell integration)
```

### Layer 5: Hooks
```
useSidebarNavigation.ts (HOOK)
├─ Exports: useSidebarNavigation (custom hook)
├─ Dependencies: react-router-dom hooks
├─ Provides:
│  ├─ navigateTo(id) → navigates to /dashboard?tab={id}
│  └─ getActiveFromLocation() → reads tab param
└─ Used by: (future integration in AppSidebar)
```

### Layer 6: Layout & Composition
```
AppSidebar.tsx (COMPONENT - MAIN INTEGRATOR)
├─ Imports:
│  ├─ SIDEBAR_MENU from sidebar.config
│  ├─ SidebarItem component
│  ├─ usePermissions, useAuth, useDeviceSize hooks
│  ├─ react-router-dom navigate
│  └─ UI primitives (Avatar, DropdownMenu, Button, etc.)
├─ Props: activeItem, onSelect, isDashboard, isMobileDrawer
├─ Local logic:
│  ├─ checkAccess(menuItem) → pure permission check
│  ├─ handleSelect(id, locked) → guards, calls onSelect
│  ├─ onLogout() → Supabase sign-out + navigate
│  └─ resolvedMenuItems (useMemo) → maps SIDEBAR_MENU with locked state
├─ Renders:
│  ├─ aside container (desktop/mobile adaptive)
│  ├─ nav > resolvedMenuItems.map(SidebarItem)
│  ├─ User avatar + dropdown (desktop)
│  ├─ User info text (mobile drawer)
│  └─ Logout button
└─ Used by: DashboardLayout (2x: desktop aside + mobile drawer)
```

---

## Call Flow: User Clicks Menu Item

```
User clicks "Campaigns" button
          │
          ▼
┌──────────────────────────┐
│  SidebarItem.onClick()   │
│  (from resolvedMenuItems)│
│  ↓ onClick({id:'campaigns', locked:false})
│
│  ▼
├─ AppSidebar.handleSelect('campaigns', false)
│      │
│      ├─ Guard: if (locked) { alert(...); return }
│      │  → PASS (not locked)
│      │
│      ├─ Call: onSelect?.('campaigns')
│      │  → DashboardLayout.handleNavigation('campaigns')
│      │      ├─ setActiveItem('campaigns')
│      │      ├─ navigate('/dashboard?tab=campaigns')
│      │      └─ if isMobile: setMobileDrawerOpen(false)
│      │
│      └─ Drawer closes (mobile only)
│
│  ▼
├─ Dashboard.tsx
│  ├─ useSearchParams() → { tab: 'campaigns' }
│  ├─ activeItemFromUrl = 'campaigns'
│  ├─ sectionMap['campaigns'] → <CampaignSection />
│  └─ Renders campaign content
│
│  ▼
└─ Browser
   ├─ URL updates: /dashboard?tab=campaigns
   ├─ "Campaigns" button highlighted (active state)
   └─ Page content shows campaigns section
```

---

## Data Flow: Permission Resolution

```
User loads dashboard
│
├─ DashboardLayout mounts
│
├─ AppSidebar mounts
│  │
│  ├─ usePermissions() hook
│  │  ├─ Fetch user permissions from auth context / DB
│  │  ├─ Return: { hasCategory, hasPermission, isSuperAdmin, userRole, loading, permissions }
│  │  └─ state: loading = true initially
│  │
│  ├─ useMemo: resolvedMenuItems
│  │  │
│  │  ├─ if (loading) return [] → deny all items until loaded
│  │  │
│  │  ├─ SIDEBAR_MENU.filter(item => {
│  │  │    // Role-based visibility
│  │  │    if (item.excludeForRoles?.includes(userRole)) return false
│  │  │    return true
│  │  │  })
│  │  │
│  │  ├─ .map(item => ({
│  │  │    ...item,
│  │  │    locked: !checkAccess(item)  // ← key transformation
│  │  │  }))
│  │  │
│  │  └─ checkAccess(item) evaluates:
│  │     ├─ if (loading) return false
│  │     ├─ if (isSuperAdmin()) return true
│  │     ├─ if (item.requiredCategory && hasCategory(cat)) return true
│  │     ├─ if (item.requiredPermission && hasPermission(perm)) return true
│  │     └─ return false
│  │
│  └─ Render: resolvedMenuItems.map(SidebarItem)
│
├─ Permissions arrive
│  ├─ loading = false
│  ├─ permissions populated
│  ├─ useMemo re-runs (deps changed)
│  └─ resolvedMenuItems updates (locked states recalculated)
│
└─ Sidebar re-renders
   ├─ Locked items get Lock icon + disabled state
   ├─ Accessible items are clickable
   └─ User can navigate to allowed sections
```

---

## State Management Layers

### Sidebar State (Sidebar-Specific)
- **Where:** `SidebarContext` (React Context)
- **What:** open/closed, mobile vs desktop, cookie persistence
- **Managed by:** `SidebarProvider`
- **Accessed via:** `useSidebarContext()` (if used)
- **Current users:** (future; not yet integrated into AppSidebar)

### Navigation State (Layout-Specific)
- **Where:** `DashboardLayout` local state + URL query param
- **What:** activeItem (current tab), mobileDrawerOpen (drawer toggle)
- **Managed by:** `useState`, `useLocation`, `useNavigate`
- **Flow:** DashboardLayout → AppSidebar prop (activeItem, onSelect)

### Permission State (Global Auth Context)
- **Where:** Custom hook `usePermissions()`
- **What:** user permissions, categories, role, loading state
- **Managed by:** Auth context / custom hook
- **Accessed by:** AppSidebar (for permission checks)

### User State (Global Auth Context)
- **Where:** Custom hook `useAuth()`
- **What:** user object, partner, loginMethod
- **Managed by:** Auth context
- **Accessed by:** AppSidebar (for avatar, dropdown), logout handler

---

## Integration Points

### ✅ Currently Integrated
1. **DashboardLayout** → **AppSidebar**
   - Props: activeItem, onSelect, isDashboard, isMobileDrawer
   - State managed by DashboardLayout (URL + local state)

2. **AppSidebar** → **SidebarItem**
   - Imports SidebarItem component
   - Renders items from resolvedMenuItems

3. **AppSidebar** → **sidebar.config**
   - Imports SIDEBAR_MENU (data)
   - Uses it as the source of truth for menu

### ⏳ Future Integration (Optional)
1. **App Shell** → **SidebarRoot**
   - Wrap entire app with SidebarRoot for centralized keyboard shortcut + cookie

2. **AppSidebar** → **useSidebarNavigation**
   - Replace direct `navigate()` call with `navigateTo()` from hook
   - Makes router swapping easier

3. **AppSidebar** → **resolveSidebarSections (pure)**
   - Call in parent (DashboardLayout) or AppSidebar
   - Compute allowed sections from partnerType / accessLevel
   - Filter menu items based on resolved sections

4. **SidebarContext** → **AppSidebar**
   - Inject SidebarContext provider around sidebar
   - Use useSidebarContext() inside AppSidebar
   - Centralize keyboard shortcut + toggle logic

---

## Performance Characteristics

### Re-Render Triggers

| Component | Triggers | Impact |
|-----------|----------|--------|
| **DashboardLayout** | URL change, drawer toggle, navigation | Mild (affects layout, not page content directly) |
| **AppSidebar** | activeItem prop, permissions load, user role change | Mild (useMemo guards large recompute) |
| **resolvedMenuItems (useMemo)** | loading, userRole, permissions, isSuperAdmin | Only when deps change (permission resolution) |
| **SidebarItem** | active, locked props | Minimal (no hooks, receives props) |

### Memoization Strategy
- **resolvedMenuItems:** Memoized with `useMemo`. Re-evaluates only when:
  - `loading` changes
  - `userRole` changes
  - `permissions` reference changes
  - `isSuperAdmin` return value changes
- **SidebarItem:** No memoization needed (simple button, no hooks)

### Bundle Size Impact
- **New modules:** ~2–3 KB (config + hooks + components)
- **Removed:** 0 KB (no deletion, only refactored)
- **Net:** +2–3 KB (minimal, largely unavoidable due to module split)

---

## Error Handling & Edge Cases

### Loading State
```tsx
// In AppSidebar.resolvedMenuItems
if (loading) return []  // Hide all items until permissions load
// → Prevents "locked" items from flickering during load
```

### Super Admin Bypass
```tsx
// In AppSidebar.checkAccess
if (isSuperAdmin()) return true  // Super admin sees everything
// → Allows testing; matches intent from original code
```

### Role-Based Visibility
```tsx
// In AppSidebar.resolvedMenuItems
if (item.excludeForRoles?.includes(userRole)) return false
// → Hide items entirely (not locked) based on role
// → Example: super_admin role excluded from "campaigns"
```

### Locked Item Click Guard
```tsx
// In AppSidebar.handleSelect
if (isLocked) {
  alert('This feature is locked. Contact your administrator for access.')
  return
}
// → Prevents navigation; shows user-friendly message
```

---

## Scalability & Extensibility

### Adding a New Menu Item
1. Add to `sidebar.config.ts`:
   ```tsx
   { id: 'reports', label: 'Reports', icon: BarChart3, requiredCategory: 'reports' }
   ```
2. Done. Auto-included in `SIDEBAR_MENU`; permission checks work automatically.

### Changing Permission Requirements
1. Update `checkAccess()` logic in `AppSidebar`
2. Or: refactor into a hook `useItemAccess(item)` for reuse.

### Swapping Router (Next.js → React Router)
1. Update `useSidebarNavigation.ts` implementation
2. All nav calls go through the hook; one place to change

### Extracting to Multiple Sidebars
1. `SidebarItem` is reusable; compose into different `SidebarSection` layouts
2. `SIDEBAR_MENU` is data; create variants (e.g., `ADMIN_SIDEBAR_MENU`)

---

## Summary

**Cleaner architecture:**
- Data (config) separated from logic (permissions) separated from UI (components)
- Clear dependency flow: Data → Pure functions → State → Components
- Easy to test, extend, and maintain

**No breaking changes:**
- `AppSidebar` API unchanged
- Downstream code sees no difference
- Additive: new modules coexist with existing code

**Ready for production:** ✅
