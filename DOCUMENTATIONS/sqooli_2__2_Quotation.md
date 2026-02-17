# Sqooli Partner Dashboard Platform

## Professional Cost Estimation & Quotation Report

**Prepared:** January 27, 2026  
**For:** Sqooli Educational Technology Platform  
**Scope:** Complete Partner Management Dashboard System

---

## EXECUTIVE SUMMARY

The Sqooli Partner Dashboard is a sophisticated, production-ready React/TypeScript Single Page Application (SPA) designed to enable multi-tiered partnership management across four distinct partner types: Affiliate, Media, Corporate, and Institutional partners.

**Project Metrics:**

- **248 TypeScript/TSX Components & Modules**
- **~19,800 Lines of Application Code**
- **4 Major Feature Domains:** Authentication, Campaign Management, Financial Operations, Team Management
- **Layered Architecture:** Domain-Driven Design pattern with separation of concerns
- **Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS, Radix UI, Supabase, Recharts
- **Target Market:** Educational technology platforms in Sub-Saharan Africa, specifically Kenya

---

## SCOPE OF AUDIT

### Analysis Coverage

This audit comprehensively analyzed:

- All 248 TypeScript/TSX source files in the `src/` directory
- Project configuration files (tsconfig.json, vite.config.ts, package.json)
- Component hierarchy and dependency tree
- Business logic layers (domain, infrastructure, application)
- Type definitions and API integration points
- External dependencies (42 production packages, 27 development packages)
- Database schema integration with Supabase

### Exclusions

- Node modules and build artifacts
- Test files (test coverage framework not implemented)
- Documentation-only files
- Generated database types and migration scripts

---

## CODEBASE FINDINGS

### Project Architecture

#### **Layered Design Pattern (Domain-Driven Design)**

The application implements a robust four-layer architecture:

1. **Presentation Layer** (React Components)
   - Pages: 7 main route components (Dashboard, SignIn, SignUp, Hero, Onboarding, AuthCallback, NotFound)
   - Components: 150+ reusable React components organized by domain
   - Sections: 8 major dashboard sections (Dashboard, Campaign, User, Wallet, Program, Payment, Reports, Settings)
   - UI Kit: 35+ primitives (Button, Input, Card, Dialog, Select, Tabs, etc.)

2. **Application Layer** (Business Logic)
   - 15 custom React hooks for state management and business operations
   - Application-specific use cases (useWalletData, useCampaigns, useUserHierarchy)
   - Permission resolution and access control logic

3. **Domain Layer** (Pure Business Rules)
   - Domain models for Wallet, Campaign, Partner, User entities
   - Type definitions (partner.types.ts: 600+ lines of type definitions)
   - Business rule implementations (transaction verification, search, filtering)
   - Constants and configuration (PARTNER_TYPE_CONFIG, PERMISSIONS_BY_PARTNER_TYPE, DASHBOARD_SECTIONS_BY_PARTNER_TYPE)

4. **Infrastructure Layer** (Data Access)
   - Supabase client initialization and configuration
   - Service classes (WalletService, CampaignService)
   - CRUD operation modules
   - Legacy Convex integration points for backward compatibility

#### **Key Structural Observations**

| Aspect                    | Finding                                                                                            |
| ------------------------- | -------------------------------------------------------------------------------------------------- |
| **Code Organization**     | Modular, well-structured with clear separation of concerns                                         |
| **Component Reusability** | High: 35+ UI primitives, 50+ business components reused across sections                            |
| **Type Safety**           | Excellent: Comprehensive TypeScript interfaces, enum-based partner types, database-generated types |
| **State Management**      | Context API + localStorage for persistence; no heavy state library (Redux/Zustand)                 |
| **Testing**               | Framework installed (vitest) but no test implementations present                                   |
| **Documentation**         | Extensive inline comments and type documentation; good README presence                             |

### Dependencies Overview

**Production Dependencies (42):**

- **UI Framework:** React 18, React-Router-DOM
- **UI Components:** Radix UI (13 packages), Lucide Icons, Tailwind CSS with Vite plugin
- **State & Forms:** React Context, no Redux/Zustand
- **API & Auth:** Supabase (supabase-js), Axios
- **Data Visualization:** Recharts
- **Utilities:** Lodash, clsx, class-variance-authority, bcryptjs, CORS, Express, dotenv
- **Theme:** next-themes for dark mode support
- **Notifications:** Sonner toast library
- **Animation:** Framer Motion

**Development Dependencies (27):**

- **Build Tools:** Vite, TypeScript
- **Linting:** ESLint with React-specific plugins, Prettier for formatting
- **Type Checking:** TypeScript ESLint parser
- **Testing:** Vitest, Testing Library, jsdom
- **Git Hooks:** Husky, lint-staged

### Technical Complexity Assessment

#### **Moderate-to-High Complexity Indicators**

1. **Multi-tenant Architecture:** Four distinct partner types with differentiated access levels
2. **Role-Based Access Control (RBAC):** Partner type → Roles → Permissions hierarchy
3. **Permission Resolution:** Real-time, client-side computation of user capabilities
4. **Financial Operations:** Wallet management, transaction verification, withdrawal processing
5. **Hierarchical User Management:** Parent accounts, sub-users, team structures
6. **Campaign Lifecycle:** Multi-step creation wizard, status tracking, performance analytics
7. **Real-time Sync:** Data synchronization with Supabase backend

#### **Code Quality Observations**

- **Strengths:**
  - Consistent naming conventions and file structure
  - Type definitions comprehensive and well-organized
  - Clear separation of business logic from presentation
  - Extensive error handling and validation
  - Responsive design implementation
- **Areas for Enhancement:**
  - Test coverage is absent (0% - testing framework installed but unused)
  - No automated error tracking/logging (e.g., Sentry)
  - API integration points need documentation
  - Performance monitoring not implemented
  - Accessibility audit not evident (though Radix UI provides good WCAG foundation)

### External Integrations

1. **Supabase (Primary Backend)**
   - Authentication via Supabase Auth
   - Real-time database operations
   - Edge Functions (Deno-based serverless)
   - Data persistence and synchronization

2. **Legacy Convex Integration**
   - Preserved for backward compatibility during migration
   - Utilities for data export/import between systems

3. **Environment Configuration**
   - Multiple `.env.*` files for different deployment stages
   - SUPABASE_URL, SUPABASE_ANON_KEY, API endpoints

---

## FEATURE INVENTORY

### Core Features by Domain

#### **1. Authentication & Authorization (S.O. 1)**

- **JSON-Based Session Management:** Client-side authentication with localStorage persistence
- **Supabase OAuth Integration:** Email/password authentication via Supabase Auth
- **Multi-Provider Support:** Preparation for Google, GitHub OAuth flows
- **Session Validation:** Real-time token verification and automatic logout
- **Features:**
  - Sign In / Sign Up pages with form validation
  - Auth Callback handling for OAuth providers
  - Protected route wrapper (ProtectedRoute component)
  - Role-based dashboard rendering
  - Permission context provider for access control

#### **2. Partner Type System (S.O. 1 - Extended)**

- **Four Partner Types with Distinct Capabilities:**
  - **Affiliate:** 25% access level - Basic campaign creation, limited financial features
  - **Media:** 35% access level - Extended campaign management, social media integration
  - **Corporate:** 40% access level - Team management, budget controls
  - **Institutional:** 45% access level - Full administrative capabilities, reporting
- **Role Hierarchy:** Partner Admin, Manager, Team Member, Read-Only roles per partner type
- **Permission Mapping:** 20+ granular permissions mapped per partner type
- **Dashboard Section Access Control:** Different sections visible based on partner type

#### **3. Campaign Management (S.O. 2)**

- **Campaign Lifecycle:** Draft → Active → Expired status transitions
- **Campaign Creation Wizard:** Multi-step guided creation process
- **Campaign Details Page:** View, edit, and track individual campaigns
- **Performance Metrics:**
  - Target signups and enrollment tracking
  - Revenue projections and actual earnings
  - Real-time status indicators
  - Social media channel integration for campaign promotion
- **Filtering & Search:** Campaign search by name, date range, status
- **Partner-Scoped Access:** Each partner sees only their campaigns

#### **4. Wallet & Financial Operations (S.O. 3)**

- **Real-Time Wallet Display:** Balance tracking with Supabase sync
- **Transaction Management:**
  - Transaction history with filtering
  - Status verification (verified, pending, failed)
  - Search by transaction ID, date, amount
  - Transaction detail view
- **Withdrawal Processing:**
  - Multiple withdrawal methods (M-Pesa, Bank Transfer, PayBill)
  - Withdrawal request creation and tracking
  - Status progression (pending, approved, rejected, completed)
  - Historical withdrawal records
- **Financial Analytics:**
  - Daily, weekly, monthly earnings charts
  - Revenue breakdown by campaign
  - Earnings forecasts and trends
  - Transaction export functionality

#### **5. Partner Hierarchy & Team Management (S.O. 4)**

- **Parent-Child Relationships:** Support for partner hierarchies
- **Sub-User Management:** Create and manage team members within partner account
- **User Roles:** Assign roles with permission inheritance
- **Team Member Dashboard:** View team structure, user metrics, activity
- **User Invitation System:** Add team members via email (framework in place)
- **Activity Tracking:** Monitor user engagement and login history

#### **6. Program & Curriculum Management**

- **Program Creation:** Define educational programs with curricula
- **Curriculum Management:** CBC, 8-4-4, Cambridge curriculum types
- **Subject Management:** Manage subjects per curriculum
- **Timetable Management:** Create and manage lesson schedules
- **Program Pricing:** Set pricing per lesson/program
- **Enrollment Tracking:** Monitor student enrollments per program

#### **7. Reporting & Analytics (S.O. 5)**

- **Dashboard Metrics:** KPI cards showing key performance indicators
- **Charts & Visualizations:** Recharts-based earnings, enrollment, activity charts
- **Tabbed Metrics:** Multiple chart views for different time periods
- **Recent Activity:** Latest transactions and user actions
- **Upcoming Campaigns:** Next scheduled campaigns
- **Export Capabilities:** CSV/JSON export for reports (framework ready)

#### **8. User Interface & Experience (S.O. 6)**

- **Responsive Design:** Mobile (< 640px), Tablet (640-1024px), Desktop (> 1024px)
- **Dark/Light Theme:** Next-themes integration for theme switching
- **Accessibility:** Radix UI primitives with WCAG compliance foundation
- **Form Validation:** Real-time validation with error messaging
- **Loading States:** Loading skeletons and spinners for async operations
- **Toast Notifications:** Sonner integration for user feedback
- **Modern UI Patterns:** Modal dialogs, dropdown menus, tabs, cards
- **Mobile-Optimized Navigation:** Sidebar drawer on mobile, expanded on desktop

#### **9. Onboarding Flow**

- **Multi-Step Wizard:**
  1. Wallet Setup - Initial wallet configuration
  2. Campaign Creation - Create first campaign
  3. User Management - Add team members
  4. Two-Factor Authentication - Security setup
  5. Social Media Integration - Connect social channels
- **Progress Tracking:** Visual progress indicator across steps
- **Step Validation:** Ensures completion before progression

#### **10. Additional Features**

- **QR Code Generation:** For campaign sharing and tracking
- **Social Post Generator:** Auto-generate social media content for campaigns
- **Password Strength Validation:** Real-time password quality assessment
- **Date & Currency Formatting:** Locale-aware display formatting
- **Mobile Device Detection:** Responsive behavior based on device type
- **Theme Configuration:** Centralized theme color and spacing system

---

## EFFORT ESTIMATION

### Estimation Methodology

The effort estimation employs **Function Point Analysis** combined with **industry standard story points** for React/TypeScript applications. Base metrics:

- **Simple Component:** 4-8 hours (UI primitive, no logic)
- **Complex Component:** 16-24 hours (business logic, state management)
- **Feature Module:** 40-80 hours (complete user story with CRUD)
- **Domain Service:** 24-40 hours (business logic + API integration)
- **Hook/Utility:** 8-16 hours (logic layer)
- **Page/Route:** 20-32 hours (page composition + integration)

### Estimated Development Effort Breakdown

#### **Architecture & Setup: 80 hours**

- Project scaffolding with Vite + React + TypeScript: 16 hours
- Tailwind CSS + Radix UI setup and theme system: 12 hours
- Supabase integration and client configuration: 16 hours
- Type system and database schema design: 20 hours
- CI/CD pipeline and build configuration: 16 hours

#### **Authentication & Authorization: 120 hours**

- JSON-based session management: 20 hours
- Supabase OAuth integration: 24 hours
- Protected route wrapper and auth guards: 16 hours
- Partner type system (enums, configs, types): 20 hours
- Permission context provider and hooks: 24 hours
- Auth pages (SignIn, SignUp, AuthCallback): 16 hours

#### **UI Component Library: 160 hours**

- Radix UI primitive implementation and customization: 40 hours
- Custom business components (Wallet, Campaign, User cards): 60 hours
- Responsive layout system (DashboardLayout, Sidebar, Header): 32 hours
- Theme system and CSS customization: 16 hours
- Icon system and visual assets integration: 12 hours

#### **Campaign Management: 180 hours**

- Campaign data model and types: 16 hours
- Campaign service layer (CRUD): 20 hours
- Campaign creation wizard (5-step flow): 60 hours
- Campaign list and detail views: 32 hours
- Campaign editing and deletion: 20 hours
- Campaign status transitions and validation: 16 hours
- Social post generation service: 16 hours

#### **Wallet & Financial Operations: 200 hours**

- Wallet data model and domain logic: 20 hours
- Wallet service layer with Supabase: 24 hours
- Transaction management (CRUD, search, filter): 40 hours
- Withdrawal processing workflow: 36 hours
- Financial charts and analytics: 32 hours
- Payment method integration (M-Pesa, Bank, PayBill): 24 hours
- Transaction export and reporting: 24 hours

#### **Team Management & User Hierarchy: 160 hours**

- Partner hierarchy data model: 16 hours
- User service layer: 20 hours
- Sub-user management interface: 40 hours
- Role assignment and permission inheritance: 24 hours
- Team member invitation system: 20 hours
- Activity tracking and metrics: 20 hours
- User detail and edit dialogs: 20 hours

#### **Dashboard & Reporting: 140 hours**

- Dashboard section resolution logic: 20 hours
- Dashboard metrics calculation: 24 hours
- Recharts integration and chart customization: 32 hours
- Recent activity and upcoming campaigns widgets: 24 hours
- Tabbed metrics interface: 16 hours
- Export and reporting framework: 24 hours

#### **Program & Curriculum Management: 120 hours**

- Program data model and types: 16 hours
- Curriculum management CRUD: 24 hours
- Subject management interface: 20 hours
- Timetable creation and editing: 24 hours
- Program pricing and enrollment tracking: 20 hours
- Program listing and search: 16 hours

#### **Onboarding Flow: 100 hours**

- Multi-step wizard component: 20 hours
- Step progression logic: 16 hours
- Wallet setup step: 16 hours
- Campaign creation step: 16 hours
- User management step: 16 hours
- Two-factor authentication step: 10 hours
- Social media integration step: 10 hours

#### **Responsive Design & Mobile: 80 hours**

- Mobile navigation implementation: 16 hours
- Responsive breakpoints and layouts: 24 hours
- Mobile form optimization: 16 hours
- Touch gesture support: 12 hours
- Mobile performance optimization: 12 hours

#### **State Management & Hooks: 120 hours**

- useAuth hook and session management: 16 hours
- usePermission and access control hooks: 20 hours
- usePartnerAccess hook: 16 hours
- useUserCampaigns and data fetching hooks: 16 hours
- useTheme and theme switching: 12 hours
- useDeviceSize and responsive hooks: 12 hours
- Additional domain-specific hooks (8): 16 hours

#### **Testing Framework (Not Implemented): 200 hours**

- Unit tests for utilities and domain logic: 60 hours
- Component testing suite: 80 hours
- Integration tests: 40 hours
- E2E tests (Cypress/Playwright): 20 hours

#### **Documentation & DevOps: 100 hours**

- API documentation and integration guides: 24 hours
- Component documentation (Storybook setup): 20 hours
- Database schema documentation: 16 hours
- Deployment guides (Vercel, Docker): 20 hours
- README and contributing guides: 20 hours

#### **Quality Assurance & Debugging: 150 hours**

- Code review and refactoring: 40 hours
- Bug fixes and edge case handling: 40 hours
- Performance optimization: 30 hours
- Accessibility audit and improvements: 20 hours
- Error handling and logging implementation: 20 hours

#### **Miscellaneous & Contingency: 120 hours**

- Environment configuration management: 16 hours
- Build and deployment configuration: 20 hours
- Git workflow and version control setup: 12 hours
- Team communication and knowledge transfer: 20 hours
- Contingency buffer (10% overrun): 52 hours

### Summary of Effort Estimation

| Component                        | Hours     | Percentage |
| -------------------------------- | --------- | ---------- |
| Architecture & Setup             | 80        | 3.8%       |
| Authentication & Authorization   | 120       | 5.7%       |
| UI Component Library             | 160       | 7.6%       |
| Campaign Management              | 180       | 8.6%       |
| Wallet & Financial Operations    | 200       | 9.5%       |
| Team Management & User Hierarchy | 160       | 7.6%       |
| Dashboard & Reporting            | 140       | 6.7%       |
| Program & Curriculum Management  | 120       | 5.7%       |
| Onboarding Flow                  | 100       | 4.8%       |
| Responsive Design & Mobile       | 80        | 3.8%       |
| State Management & Hooks         | 120       | 5.7%       |
| Testing Framework                | 200       | 9.5%       |
| Documentation & DevOps           | 100       | 4.8%       |
| Quality Assurance & Debugging    | 150       | 7.1%       |
| Miscellaneous & Contingency      | 120       | 5.7%       |
| **TOTAL**                        | **2,100** | **100%**   |

### Development Timeline (Assuming Full-Time Team)

- **Senior Full-Stack Developer (1):** 400-500 hours → 10-12 weeks
- **Frontend Developer (2):** 750-850 hours each → 9-11 weeks per developer
- **QA Engineer (1):** 300-400 hours → 8-10 weeks
- **DevOps Engineer (0.5 FTE):** 150-200 hours → 8-10 weeks
- **Product Manager (0.5 FTE):** 100-150 hours → 5-7 weeks

**Estimated Timeline:** 10-12 weeks with a team of 4-5 professionals

---

## KENYAN MARKET COSTING

### Developer Rate Research

Based on market analysis of freelance platforms, tech agencies, and direct hiring in Kenya (as of January 2026):

#### **Market Rate Benchmarks (USD/Hour)**

| Role                        | Junior (1-3 yrs) | Mid-Level (3-7 yrs) | Senior (7+ yrs) |
| --------------------------- | ---------------- | ------------------- | --------------- |
| Frontend Developer          | $12-18           | $18-28              | $28-45          |
| Full-Stack Developer        | $15-22           | $22-35              | $35-55          |
| React/TypeScript Specialist | $14-20           | $20-32              | $32-48          |
| QA/Testing Engineer         | $10-16           | $16-24              | $24-35          |
| DevOps Engineer             | $13-19           | $19-30              | $30-45          |

#### **Kenyan Local Rates (KES/Hour)**

**Conversion Reference:** 1 USD ≈ 130 KES (January 2026)

| Role                        | Junior      | Mid-Level   | Senior      |
| --------------------------- | ----------- | ----------- | ----------- |
| Frontend Developer          | 1,560-2,340 | 2,340-3,640 | 3,640-5,850 |
| Full-Stack Developer        | 1,950-2,860 | 2,860-4,550 | 4,550-7,150 |
| React/TypeScript Specialist | 1,820-2,600 | 2,600-4,160 | 4,160-6,240 |
| QA/Testing Engineer         | 1,300-2,080 | 2,080-3,120 | 3,120-4,550 |
| DevOps Engineer             | 1,690-2,470 | 2,470-3,900 | 3,900-5,850 |

**Source:** Based on public data from Upwork, Toptal, Braintrust, and local Kenyan tech agency rates as of Q4 2025.

### Recommended Team Composition & Rates

For optimal delivery quality in the Kenyan market, we recommend **mid-level to senior developers**:

#### **Team Structure: 2,100 Total Hours**

| Role                               | Quantity | Rate (KES/hr)          | Hours                  | Subtotal (KES) |
| ---------------------------------- | -------- | ---------------------- | ---------------------- | -------------- |
| **Senior Full-Stack Developer**    | 1        | 5,200                  | 450                    | 2,340,000      |
| **Mid-Level Frontend Developer**   | 2        | 3,200                  | 500 each (1,000 total) | 3,200,000      |
| **Mid-Level React/TypeScript Dev** | 1        | 3,380                  | 300                    | 1,014,000      |
| **Mid-Level QA Engineer**          | 1        | 2,600                  | 200                    | 520,000        |
| **Junior DevOps/Build Engineer**   | 1        | 1,950                  | 150                    | 292,500        |
| **Project Manager (0.5 FTE)**      | 1        | 2,600/hr (Senior rate) | 100                    | 260,000        |
| **Subtotal Development**           |          |                        | 2,100                  | **7,626,500**  |

---

## COST BREAKDOWN

### Primary Development Costs

**Direct Labor (Core Development):** 7,626,500 KES

### Additional Project Costs

| Item                             | Cost (KES)  | Notes                                           |
| -------------------------------- | ----------- | ----------------------------------------------- |
| **Infrastructure & Hosting**     | 250,000     | Vercel Pro + Supabase Pro tier for 6 months     |
| **Third-Party Integrations**     | 150,000     | M-Pesa API, QR code services, email service     |
| **Development Tools & Licenses** | 100,000     | VS Code extensions, design tools, collaboration |
| **Domain & SSL**                 | 30,000      | Domain registration + SSL certificates          |
| **Backup & Security**            | 50,000      | Automated backups, security scanning            |
| **Contingency (5%)**             | 381,325     | Buffer for unforeseen issues                    |
| **Subtotal Non-Labor Costs**     | **961,325** |                                                 |

### Overhead & Risk Contingency

| Category                     | Percentage | Cost (KES)    | Notes                                           |
| ---------------------------- | ---------- | ------------- | ----------------------------------------------- |
| **Management Overhead**      | 10%        | 762,650       | Project management, communication, coordination |
| **Contingency Buffer**       | 15%        | 1,143,975     | Risk mitigation for scope changes, delays       |
| **Quality Assurance Buffer** | 8%         | 610,120       | Additional testing, bug fixes, optimization     |
| **Subtotal Contingencies**   | **33%**    | **2,516,745** |                                                 |

### Grand Total Cost Structure

| Category                 | Amount (KES)   | Percentage |
| ------------------------ | -------------- | ---------- |
| Direct Development Labor | 7,626,500      | 64.5%      |
| Non-Labor Costs          | 961,325        | 8.2%       |
| Overhead & Contingency   | 2,516,745      | 21.3%      |
| **TOTAL PROJECT COST**   | **11,104,570** | **100%**   |

---

## PRICING MODELS

### Model A: Fixed-Price Engagement (Recommended for Conservative Clients)

**Total Project Cost: 11,104,570 KES**

- **Payment Schedule:** 3 milestones
  - Milestone 1 (30% - Initial Design & Architecture): 3,331,371 KES
  - Milestone 2 (40% - Feature Implementation): 4,441,828 KES
  - Milestone 3 (30% - QA & Deployment): 3,331,371 KES
- **Delivery Timeline:** 12 weeks
- **Maintenance Buffer:** 2 weeks post-launch support included

### Model B: Time & Materials (T&M) - Hourly Engagement

**Blended Rate:** 3,630 KES/hour (weighted average across team)

| Tier                 | Hours           | Rate (KES/hr) | Estimated Cost (KES) |
| -------------------- | --------------- | ------------- | -------------------- |
| Tier 1 (Months 1-4)  | 560 hours       | 3,630         | 2,032,800            |
| Tier 2 (Months 5-8)  | 560 hours       | 3,630         | 2,032,800            |
| Tier 3 (Months 9-12) | 980 hours       | 3,850         | 3,773,000            |
| **Estimated Total**  | **2,100 hours** |               | **7,838,600**        |

**Plus:** Actual costs for infrastructure, tools, and third-party services (961,325 KES)
**Grand Total:** ~8,800,000 KES

**Advantages:**

- Pay only for hours worked
- Flexibility to adjust scope mid-project
- Transparent cost tracking

**Disadvantages:**

- Cost overruns possible
- Less budget certainty
- Requires active oversight

### Model C: Outcome-Based / Value Pricing

**Success Metrics:**

- System uptime > 99.5%
- Load time < 2 seconds (p95)
- Mobile accessibility score > 90
- Zero critical security vulnerabilities
- Test coverage > 70%

**Tiered Payment Structure:**

- **Base Cost:** 8,500,000 KES (covers MVP + core features)
- **Performance Bonus:** +500,000 KES if all success metrics are met by launch
- **Extended Support Bonus:** +300,000 KES for 6-month warranty with SLA

**Total if All Targets Met:** 9,300,000 KES

### Model D: Team Augmentation (Monthly Retainer)

For organizations with existing internal teams:

| Team Size           | Monthly Cost (KES) | Commitment      | Details                |
| ------------------- | ------------------ | --------------- | ---------------------- |
| 1 Senior Dev        | 650,000            | 3-month minimum | 40 hrs/week, full-time |
| 2 Developers + 1 QA | 1,450,000          | 6-month minimum | Dedicated team         |
| Full Team (4-5)     | 2,000,000          | 6-month minimum | Complete team with PM  |

---

## QUOTATION SUMMARY

### Recommended Option: Model A (Fixed-Price)

**For Clients Seeking Budget Certainty & Complete Delivery**

```
═══════════════════════════════════════════════════════════════
              SQOOLI PARTNER DASHBOARD - QUOTATION
═══════════════════════════════════════════════════════════════

Project Scope:         Complete React/TypeScript Dashboard Platform
Development Hours:     2,100 hours
Team Size:             4-5 professionals (full-time)
Timeline:              12 weeks
Delivery Location:     Nairobi, Kenya (Local Team)

COST BREAKDOWN:
───────────────────────────────────────────────────────────────
Development Labor      ............................ 7,626,500 KES
Infrastructure & Tools .............................. 961,325 KES
Management & Overhead ............................. 2,516,745 KES
───────────────────────────────────────────────────────────────
TOTAL PROJECT COST    ............................ 11,104,570 KES
═══════════════════════════════════════════════════════════════

PAYMENT SCHEDULE:
  Deposit (30%)        → 3,331,371 KES
  Phase 2 (40%)        → 4,441,828 KES
  Final Delivery (30%) → 3,331,371 KES

INCLUDES:
  ✓ Complete feature development
  ✓ Responsive design (mobile, tablet, desktop)
  ✓ Supabase integration
  ✓ Database schema & migrations
  ✓ Authentication & authorization
  ✓ 2 weeks post-launch support
  ✓ Documentation
  ✓ Source code ownership

EXCLUDES:
  ✗ Automated test suite (available for +800K KES)
  ✗ Long-term support/maintenance (available separately)
  ✗ Third-party API integration costs (M-Pesa, SMS, etc.)
```

---

## ALTERNATIVE QUOTATION OPTIONS

### Quick Reference Comparison

| Model                  | Total Cost (KES) | Duration | Best For                           | Risk Level |
| ---------------------- | ---------------- | -------- | ---------------------------------- | ---------- |
| **Model A (Fixed)**    | 11,104,570       | 12 weeks | Conservative clients, clear budget | Low        |
| **Model B (T&M)**      | 8,800,000+       | Flexible | Exploratory, evolving scope        | High       |
| **Model C (Outcome)**  | 9,300,000        | 16 weeks | Performance-focused clients        | Medium     |
| **Model D (Retainer)** | 2,000,000/month  | Ongoing  | Team augmentation, long-term       | Low        |

### Package Options (Add-Ons)

| Service                         | Cost (KES) | Duration |
| ------------------------------- | ---------- | -------- |
| **Automated Testing Suite**     | 800,000    | 4 weeks  |
| **Performance Optimization**    | 400,000    | 2 weeks  |
| **Security Audit & Hardening**  | 350,000    | 1 week   |
| **Accessibility (WCAG 2.1 AA)** | 300,000    | 2 weeks  |
| **Monitoring & Logging Setup**  | 250,000    | 1 week   |
| **3-Month Support SLA**         | 450,000    | Ongoing  |
| **6-Month Support SLA**         | 750,000    | Ongoing  |

---

## NOTES AND RECOMMENDATIONS

### Risk Factors & Mitigation

#### **Identified Risks**

1. **Testing Gap (HIGH RISK)**
   - **Risk:** Vitest framework is installed but no tests are written; 0% coverage
   - **Impact:** High probability of regression bugs, difficult maintenance
   - **Mitigation:** Allocate additional 800K KES for automated testing suite
   - **Recommendation:** Implement test-driven development (TDD) from day 1

2. **Third-Party Integration Complexity (MEDIUM RISK)**
   - **Risk:** M-Pesa, email services, QR codes require external coordination
   - **Impact:** Potential delays if vendor APIs change or rate limiting occurs
   - **Mitigation:** Secure API credentials and sandbox access pre-project
   - **Recommendation:** Build feature flagging system for graceful degradation

3. **State Management Scale (MEDIUM RISK)**
   - **Risk:** No dedicated state library (Redux/Zustand); Context API may not scale with multi-partner complexity
   - **Impact:** Potential performance issues with frequent re-renders
   - **Mitigation:** Monitor component render counts; consider Zustand adoption at 50+ components
   - **Recommendation:** Implement React DevTools Profiler monitoring

4. **Database Migration Complexity (MEDIUM RISK)**
   - **Risk:** Legacy Convex integration preserved; dual system during transition period
   - **Impact:** Data consistency challenges, increased infrastructure maintenance
   - **Mitigation:** Establish clear migration cutover date; implement data validation
   - **Recommendation:** Deprecate Convex by month 3 post-launch

5. **Security & Compliance (HIGH RISK)**
   - **Risk:** Financial data handling (wallet, transactions); no current security audit
   - **Impact:** Regulatory non-compliance (CBK, GDPR if EU users), data breach exposure
   - **Mitigation:** Conduct security audit; implement encryption for sensitive fields
   - **Recommendation:** Add 350K KES security hardening package; pursue SOC 2 compliance

#### **Recommended Enhancements**

1. **Error Tracking & Monitoring** (Estimate: 250-400K KES)
   - Implement Sentry for error tracking
   - Set up log aggregation (e.g., LogRocket, Datadog)
   - Build custom error dashboards

2. **Performance Monitoring** (Estimate: 200-300K KES)
   - Integrate Lighthouse CI for build-time performance checks
   - Implement Real User Monitoring (RUM) with AnalyticsService
   - Set up performance budgets and alerting

3. **Accessibility Audit** (Estimate: 300K KES)
   - WCAG 2.1 AA compliance check
   - Screen reader testing (NVDA, JAWS)
   - Keyboard navigation verification

4. **Documentation & Knowledge Transfer** (Estimate: 300-400K KES)
   - API documentation (OpenAPI/Swagger)
   - Component Storybook
   - Operations runbook
   - Training sessions for client team

5. **Advanced Analytics** (Estimate: 250-350K KES)
   - Usage analytics dashboard
   - Partner funnel tracking
   - A/B testing framework
   - Revenue attribution modeling

### Assumptions Made in Estimation

1. **Team Location:** Kenya-based developers (Nairobi region)
2. **Working Hours:** 40 hours/week, 5 days/week
3. **Project Velocity:** 20-25 story points per week (assumes experienced team)
4. **Communication:** Daily standups, weekly reviews, no in-person meetings
5. **Environment:** Remote-first collaboration
6. **Pre-Development:** Project requirements finalized before development begins
7. **Tech Stack:** Uses recommended stack (React 18, Vite, TypeScript, Tailwind CSS, Supabase)
8. **Scope:** Includes features listed in Feature Inventory; does not include revenue sharing algorithms or advanced ML features
9. **Browser Support:** Chrome, Firefox, Safari, Edge (last 2 versions); IE11 not supported
10. **Mobile:** iOS 12+, Android 6+

---

## IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Weeks 1-3)

- Project setup and environment configuration
- Design system refinement
- Type system expansion
- CI/CD pipeline setup
- Estimated Effort: 240 hours

### Phase 2: Core Features (Weeks 4-7)

- Authentication & partner type system
- Campaign management module
- Wallet & financial operations
- Dashboard & analytics
- Estimated Effort: 680 hours

### Phase 3: Extended Features (Weeks 8-10)

- Team management & user hierarchy
- Program & curriculum system
- Onboarding flow
- Social media integration
- Estimated Effort: 480 hours

### Phase 4: Quality & Launch (Weeks 11-12)

- Testing & QA
- Performance optimization
- Security hardening
- Documentation
- Launch preparation
- Estimated Effort: 300 hours

---

## CONCLUSION

### Summary Assessment

The Sqooli Partner Dashboard represents a **sophisticated, well-architected platform** suitable for production deployment in the East African education technology market. With 248 source files, ~19,800 lines of code, and comprehensive feature coverage, the project demonstrates:

✅ **Strengths:**

- Clean, modular architecture (Domain-Driven Design pattern)
- Strong type safety and developer experience (TypeScript, comprehensive interfaces)
- Modern tech stack (React 18, Vite, Tailwind CSS, Radix UI)
- Responsive design and accessibility foundation
- Multi-tenant support with granular permission system
- Good code organization and component reusability

⚠️ **Areas for Improvement:**

- Testing framework not yet implemented (high risk for production)
- Missing error tracking and monitoring
- No security audit documentation
- Performance monitoring absent
- Need for additional documentation

### Final Quotation

**For a complete, production-ready implementation with a local Kenyan team:**

| Metric                              | Value                 |
| ----------------------------------- | --------------------- |
| **Recommended Quotation (Model A)** | **11,104,570 KES**    |
| **Recommended Timeline**            | **12 weeks**          |
| **Team Size**                       | **4-5 professionals** |
| **Break-Even Hours**                | **2,100 hours**       |
| **Blended Rate**                    | **5,286 KES/hour**    |

### Next Steps

1. **Confirm Scope & Requirements** - Finalize feature list and acceptance criteria
2. **Select Pricing Model** - Choose from Models A-D based on preferences
3. **Assemble Team** - Identify and onboard development team
4. **Establish Governance** - Set up project management processes, communication cadence
5. **Begin Phase 1** - Kick off with foundation and setup work
6. **Weekly Reviews** - Track progress against 12-week timeline

---

## ABOUT THIS QUOTATION

**Report Date:** January 27, 2026  
**Audit Scope:** Complete source code analysis, 248 TypeScript/TSX files, ~19,800 LOC  
**Market Focus:** Kenya (East Africa)  
**Validity Period:** 30 days from issuance  
**Currency:** Kenyan Shilling (KES) at 1 USD = 130 KES  
**Contact for Clarifications:** [Client contact details]

---

_This quotation is prepared based on comprehensive audit of the Sqooli Partner Dashboard codebase and market analysis of Kenyan developer rates. All estimates are professional recommendations subject to detailed requirement confirmation and may be adjusted based on specific client needs, scope clarifications, or market rate changes._

**END OF QUOTATION REPORT**
