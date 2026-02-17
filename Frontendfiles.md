# Frontend Files Inventory

**Root:** `/vercel/share/v0-project/src`  
**Extensions:** .ts, .tsx, .js, .jsx

## Frontend File List

### Application Layer (Hooks/Composition)
- application/campaign/useCampaigns.ts
- application/dashboard/useDashboardMetrics.ts
- application/dashboard/useDashboardStats.ts
- application/dashboard/useRecentActivity.ts
- application/dashboard/useUpcomingCampaigns.ts
- application/wallet/index.ts
- application/wallet/useWalletData.ts
- application/wallet/useWalletFiltering.ts

### Auth Components
- auth/handleJsonAuth.ts
- components/auth/AuthLayout.tsx
- components/common/PinVerification.tsx
- pages/AuthCallback.tsx

### UI Components (Core Library)
- components/ui/Typography.tsx
- components/ui/alert.tsx
- components/ui/avatar.tsx
- components/ui/badge.tsx
- components/ui/button.tsx
- components/ui/card.tsx
- components/ui/chart.tsx
- components/ui/checkbox.tsx
- components/ui/dialog.tsx
- components/ui/dropdown-menu.tsx
- components/ui/input.tsx
- components/ui/label.tsx
- components/ui/popover.tsx
- components/ui/radio-group.tsx
- components/ui/scroll-area.tsx
- components/ui/select.tsx
- components/ui/separator.tsx
- components/ui/sheet.tsx
- components/ui/sidebar.tsx
- components/ui/skeleton.tsx
- components/ui/sonner.tsx
- components/ui/table.tsx
- components/ui/tabs.tsx
- components/ui/textarea.tsx
- components/ui/tooltip.tsx

### Sidebar Components
- components/ui/sidebar/SidebarContext.tsx
- components/ui/sidebar/SidebarItem.tsx
- components/ui/sidebar/SidebarRoot.tsx
- components/ui/sidebar/SidebarSection.tsx
- components/ui/sidebar/index.ts
- components/ui/sidebar/resolveSidebarSections.ts
- components/ui/sidebar/sidebar.config.ts
- components/ui/sidebar/sidebar.styles.ts
- components/ui/sidebar/useSidebarNavigation.ts

### Common Components
- components/Footer.tsx
- components/Protected.tsx
- components/common/AddUserDialog.tsx
- components/common/CampaignAssets.tsx
- components/common/CampaignDetails.tsx
- components/common/ComingSoon.tsx
- components/common/ConfirmationDialog.tsx
- components/common/CreateCampaign.tsx
- components/common/CreateCurriculumDialog.tsx
- components/common/CreatePartnerDialog.tsx
- components/common/CreateProgramDialog.tsx
- components/common/CreateSubjectDialog.tsx
- components/common/EditProgramDialog.tsx
- components/common/ErrorBoundary.tsx
- components/common/Loading.tsx
- components/common/Logo.tsx
- components/common/ManageCurriculaDialog.tsx
- components/common/ManageSubjectsDialog.tsx
- components/common/MiniChart.tsx
- components/common/NoCampaignCard.tsx
- components/common/NotificationDropDown.tsx
- components/common/PageNotFound.tsx
- components/common/PartnerManagement.tsx
- components/common/PermissionFallbacks.tsx
- components/common/PermissionRefresherBanner.tsx
- components/common/PermissionWrapper.tsx
- components/common/Profile.tsx
- components/common/SocialMediaChannels.tsx
- components/common/SuperAdminDashboard.tsx
- components/common/SuperAdminWalletSection.tsx
- components/common/ThemeButton.tsx
- components/common/UserCredentialsDialog.tsx
- components/common/ViewUserDialog.tsx
- components/common/Wallet.tsx
- components/common/WalletEditDialog.tsx
- components/common/WalletSetUp.tsx
- components/common/WithdrawalDialog.tsx

### Icons
- components/icons/BrowserControlsIcon.tsx
- components/icons/CrownIcon.tsx
- components/icons/HighlightIcon.tsx
- components/icons/LightningIcon.tsx
- components/icons/SmileyIcon.tsx

### Landing Page Components
- components/landing/BrowserChrome.tsx
- components/landing/Footer.tsx
- components/landing/PartnerCarousel.tsx
- components/landing/PartnershipCard.tsx
- components/landing/StatCard.tsx
- components/landing/TimelineStep.tsx

### Layout Components
- components/layout/DashboardLayout.tsx
- components/layout/Header.tsx
- components/layout/HeroHeader.tsx
- components/layout/RootLayout.tsx
- components/layout/Sidebar.tsx
- components/layout/header/HeaderContainer.tsx
- components/layout/header/HeaderLeft.tsx
- components/layout/header/HeaderRight.tsx
- components/layout/header/PartnerBadge.tsx
- components/layout/header/index.ts
- components/layout/header/types.ts
- components/layout/header/useHeaderState.ts

### Onboarding Components
- components/onboarding/StepAction.tsx
- components/onboarding/StepItem.tsx
- components/onboarding/StepProgressIndicator.tsx
- components/onboarding/StepsList.tsx
- components/onboarding/hooks/useOnboardingData.ts
- components/onboarding/hooks/useStepProgression.ts
- components/onboarding/steps/CampaignStep.tsx
- components/onboarding/steps/SocialMediaStep.tsx
- components/onboarding/steps/TwoFactorStep.tsx
- components/onboarding/steps/UsersStep.tsx
- components/onboarding/steps/WalletStep.tsx
- components/onboarding/types.ts

### Context & Providers
- context/PermissionContext.tsx
- context/PermissionProvider.tsx
- context/ThemeContext.tsx
- context/ThemeProvider.tsx

### Custom Hooks
- hooks/use-mobile.ts
- hooks/useActivityTracker.ts
- hooks/useAuth.ts
- hooks/useDeviceSize.ts
- hooks/usePartnerAccess.ts
- hooks/usePartnerPermissions.ts
- hooks/usePermission.ts
- hooks/useTeamData.ts
- hooks/useTheme.ts
- hooks/useUserEnrollments.ts
- hooks/useUserRevenue.ts
- hooks/useUserTransactions.ts

### Integrations
- integrations/logger-context.ts
- integrations/logger-setup.ts

### Pages
- pages/AuthCallback.tsx
- pages/Dashboard.tsx
- pages/Hero.tsx

### Root/Entry
- App.tsx
- main.tsx
- Constants.ts

## Notes
- Only UI/client-rendered code included
- Excludes database services, API layer, and backend utilities
- Includes UI components, hooks, contexts, and page layouts
