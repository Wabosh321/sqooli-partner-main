# DATA SYNCHRONIZATION & LINKING CONFIRMATION

✓ UNIFIED DATASOURCES CONFIGURATION

All files are now fully linked and synchronized with a hierarchical role-based system:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. DATA SOURCE RELATIONSHIPS:

   programs.json (Master Programs)
   ├── id: "program-001"
   ├── partner_id: Linked to partner
   ├── created_by_user_id: user-002 (admin_partner)
   └── Used by: CampaignSection, ReportsSection, CampaignTable, TasksSection

   campaigns.json (Master Campaigns)
   ├── id: "campaign-001"
   ├── program_id: Links to programs.json
   ├── partner_id: Links to partner
   ├── created_by_user_id: Links to users.json
   ├── created_by_user_role: "admin_partner" or "partner_member"
   └── Used by: CampaignSection, ReportsSection, TasksSection, CampaignTable

   tasks.json (Campaign Approvals)
   ├── campaignId: Links to campaigns.json
   ├── createdBy: user-003, user-004 (partner_members creating campaigns)
   ├── createdByRole: "partner_member"
   ├── approver: user-002 (admin_partner reviewing)
   └── status: "pending", "approved", "declined"

   users.json (Role-based User Hierarchy)
   ├── user-001: super_admin (all access)
   ├── user-002: admin_partner (partner-001) - CREATES & APPROVES
   │ ├── user-003: partner_member (child/subuser) - Creates campaigns → Needs approval
   │ └── user-004: partner_member (child/subuser) - Creates campaigns → Needs approval
   ├── user-005: partner_member (partner-002) - Independent
   └── user-006: partner_member (partner-003) - Independent

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2. ROLE-BASED WORKFLOW (IMPLEMENTED):

   admin_partner (user-002):
   ✓ Can CREATE programs
   ✓ Can CREATE campaigns
   ✓ APPROVES/DECLINES campaigns from child users (user-003, user-004)
   ✓ Views all partner campaigns
   ✓ Full access to programs, campaigns, tasks, reports

   partner_member (user-003, user-004 - Subusers):
   ✓ Can CREATE campaigns (status="pending")
   ✓ Campaigns routed to parent_user_id (admin_partner) for approval
   ✓ Can see own campaigns and campaigns pending approval
   ✓ Cannot approve/decline
   ✓ Limited access to reports (view-only)

   Independent partner_member (user-005, user-006):
   ✓ Can CREATE campaigns independently
   ✓ No parent user to approve
   ✓ Full access to own partner's data

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3. SECTION IMPLEMENTATIONS:

   CampaignSection.tsx:
   ✓ Loads from campaigns.json
   ✓ Filters by user role:
   - admin_partner: Shows all partner campaigns
   - partner_member: Shows own + pending campaigns
     ✓ Links to programs.json for program names
     ✓ Tracks created_by_user_id and created_by_user_role

   TasksSection.tsx:
   ✓ Loads from tasks.json (no mock data)
   ✓ Links to campaigns.json for campaign details
   ✓ Displays tasks for campaign approvals
   ✓ Shows created_by_user_id and approver user roles
   ✓ Status: pending, approved, declined

   ProgramSection.tsx:
   ✓ Loads from programs.json
   ✓ Displays created_by_user_id
   ✓ Shows partner_id ownership

   ReportsSection.tsx:
   ✓ Loads from campaigns.json
   ✓ Filters by partner_id
   ✓ Uses JSON data instead of Supabase

   CampaignTable.tsx:
   ✓ FIXED: Replaced hardcoded "AAAA" with getProgramName() function
   ✓ Links program_id to programs.json
   ✓ Displays actual program names dynamically

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

4. DATA ENTITY RELATIONSHIPS:

   User Hierarchy:
   users.json → parent_user_id links to admin_partner

   Campaign Approval Workflow:
   campaigns.json.created_by_user_id → tasks.json.createdBy
   tasks.json.approver → admin_partner (user-002)

   Program-Campaign Link:
   campaigns.json.program_id → programs.json.id

   Campaign Display:
   CampaignTable uses program_id to fetch program name from programs.json

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

5. KEY DATA FIELDS FOR TRACKING:

   ✓ created_by_user_id: User who created the entity
   ✓ created_by_user_role: Role of creator ("admin_partner" or "partner_member")
   ✓ parent_user_id: Link from subuser to admin_partner
   ✓ partner_id: Ownership and access control
   ✓ status: Campaign/Task status (active, draft, expired, pending, approved, declined)
   ✓ approver: User responsible for approving (admin_partner)
   ✓ approvedAt: Timestamp when approved
   ✓ declinedAt: Timestamp when declined
   ✓ declineReason: Reason for decline

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ ALL SECTIONS NOW UNIFIED WITH SINGLE DATA SOURCE
✓ ROLE-BASED ACCESS CONTROL ENFORCED
✓ CAMPAIGN APPROVAL WORKFLOW IMPLEMENTED
✓ PROGRAM-CAMPAIGN LINKING COMPLETE
✓ USER HIERARCHY PROPERLY STRUCTURED
