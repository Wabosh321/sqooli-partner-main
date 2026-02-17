# **SQOOLI PARTNER PORTAL**

## **User Manual**

---

## **Cover Page**

### **Project Name**

Sqooli Partner Portal

### **Project Description**

The Sqooli Partner Portal is a comprehensive partner management and engagement platform designed to facilitate collaboration between Sqooli and various partner organizations across multiple sectors. The platform enables partners to manage campaigns, track earnings, enroll users, and access analytics through a unified, role-based dashboard interface.

**Version:** 1.0.0  
**Last Updated:** January 2026

---

## **Table of Contents**

1. [Introduction](#introduction)
2. [System Overview](#system-overview)
3. [Features & Functionalities](#features--functionalities)
4. [User Roles and Permissions](#user-roles-and-permissions)
5. [Application Navigation](#application-navigation)
6. [Getting Started](#getting-started)
7. [Step-by-Step Usage Guide](#step-by-step-usage-guide)
8. [Dashboard Sections](#dashboard-sections)
9. [Input & Output Description](#input--output-description)
10. [Error Handling & Messages](#error-handling--messages)
11. [System Requirements](#system-requirements)
12. [Limitations](#limitations)
13. [Conclusion](#conclusion)

---

## **Introduction**

### **Purpose of the System**

The Sqooli Partner Portal serves as a centralized platform for partner organizations to collaborate with Sqooli in delivering educational services and programs. The system is designed to streamline partner management, campaign execution, financial tracking, and user administration while maintaining robust access controls based on partner type and user role.

### **Target Users**

The platform serves four primary user categories:

- **Affiliate Partners**: Individual affiliates and agents responsible for grassroots distribution
- **Media Partners**: Radio stations, influencers, and content creators for amplification
- **Corporate Partners**: B2B organizations providing employee benefits and welfare integration
- **Institutional Partners**: Churches, NGOs, and community organizations serving as physical anchors

Within each partner type, users assume specific roles that define their capabilities and access levels.

### **Key Objectives**

- Enable partners to manage and track promotional campaigns
- Provide financial visibility through wallet and earnings tracking
- Facilitate user and program management
- Generate actionable reports and analytics
- Ensure secure, role-based access to sensitive information

---

## **System Overview**

### **What the System Does**

The Sqooli Partner Portal is a web-based dashboard application that allows partner organizations to:

1. **Authenticate and Access**: Users securely sign in with email and password credentials
2. **Complete Onboarding**: New users complete a guided setup process to configure their organization
3. **Manage Campaigns**: Create, view, edit, and monitor promotional campaigns
4. **Track Earnings**: Monitor wallet balances, revenue shares, and transaction history
5. **Administer Users**: Manage team members and set appropriate roles and permissions
6. **View Programs**: Access educational program information and enrollment data
7. **Generate Reports**: Access analytics and performance metrics
8. **Manage Settings**: Configure organization details and user preferences

### **Architecture Overview**

The system operates as a responsive web application built with React and TypeScript. It uses:

- **Supabase** for user authentication and backend services
- **JSON-based data storage** for partner and campaign information
- **Role-based access control (RBAC)** to restrict features by user role and partner type
- **React Router** for client-side navigation
- **Tailwind CSS** for responsive UI design
- **Supabase Real-time** for data synchronization

### **User Interface Philosophy**

The interface is designed to be:

- **Responsive**: Adapts seamlessly to mobile, tablet, and desktop screens
- **Role-aware**: Displays only features relevant to the user's authorization level
- **Data-driven**: Shows real-time metrics and actionable insights
- **Accessible**: Uses clear labels, icons, and validation messages

---

## **Features & Functionalities**

### **1. Authentication & Account Management**

#### **Sign Up**

- New users create an account with email, password, and personal information
- Password must contain uppercase, lowercase, numbers, and be minimum 8 characters
- Phone number validation ensures proper format
- Username selection with alphanumeric and underscore support
- Partner type selection during registration (Affiliate, Media, Corporate, or Institutional)

#### **Sign In**

- Existing users log in with email and password
- Email validation confirms proper format
- Password requirements enforced at login
- Automatic session management through Supabase
- Secure logout with session termination

#### **Account Selection**

- Users can select their account type after authentication
- Account type determines which dashboard views are available
- Supports Partner, School, and Teacher account types

### **2. Onboarding Process**

New partners complete a structured onboarding workflow:

#### **Wallet Configuration**

- Set up preferred withdrawal method (M-Pesa, bank transfer, PayPal)
- Add beneficiary account information
- Verify banking details

#### **Campaign Creation**

- Create the first promotional campaign
- Define target demographics and goals
- Set revenue share agreements
- Configure promotional materials

#### **User Enrollment**

- Add team members to the organization
- Assign roles and permissions
- Configure access levels

#### **Two-Factor Authentication (Optional)**

- Enable additional security layer
- Configure recovery methods

#### **Social Media Integration**

- Connect organizational social media accounts
- Configure channel settings for campaign distribution

### **3. Campaign Management**

#### **Create Campaign**

- Specify campaign name, description, and duration
- Define target signup numbers and daily targets
- Configure bundled offers and pricing
- Set revenue share percentages
- Generate promotional codes
- Add WhatsApp contact information

#### **View Campaigns**

- Display campaigns in three tabs: Active, Expired, and Draft
- Search campaigns by ID or name
- Sort by status, start date, or revenue
- View campaign details including metrics

#### **Manage Campaign Status**

- Transition campaigns through lifecycle (Draft → Active → Expired)
- View campaign performance metrics
- Monitor signup progress against targets

#### **Campaign Details**

- Review revenue projections
- Check target signup achievements
- View promotional materials and codes
- Monitor campaign timeline

### **4. Wallet & Financial Management**

#### **View Wallet Balance**

- Display current account balance
- Show withdrawal method configuration
- Display recent transaction history

#### **Transaction History**

- View all payments received
- Track withdrawal requests
- Filter transactions by date range
- Export transaction data

#### **Withdrawal Management**

- Request withdrawals through configured method
- View withdrawal status and history
- Verify beneficiary information

#### **Revenue Share Details**

- Display partner's percentage of revenue
- Show Sqooli's percentage
- Calculate earnings based on campaign performance

### **5. User & Team Management**

#### **View Team Members**

- Display all added users with status
- Show user roles and permissions
- Filter users by department or status
- Search by name or email

#### **Add Team Members**

- Invite new users to organization
- Assign specific roles
- Set initial permissions
- Configure department assignments

#### **Manage User Roles**

- Change user roles within partner type
- Adjust access levels and permissions
- Enable/disable user accounts
- Remove users from organization

#### **User Activity Monitoring**

- View last login times
- Track user actions and engagement
- Monitor permission usage patterns

### **6. Program Management**

#### **View Programs**

- Browse available educational programs
- Filter by curriculum type
- View program details and pricing
- Check enrollment numbers

#### **Create Programs**

- Define program name and description
- Select curriculum type (CBC, 8-4-4, Cambridge)
- Configure subjects and schedules
- Set pricing for the program
- Define start and end dates

#### **Manage Curricula**

- View available curricula
- Manage subjects within each curriculum
- Update curriculum details

### **7. Reports & Analytics**

#### **Dashboard Analytics**

- Total campaigns created
- Active campaigns count
- Total user signups
- Total earnings to date
- Revenue trends visualization

#### **Campaign Reports**

- Performance metrics by campaign
- Conversion rate analysis
- Revenue share calculations
- Signup progress tracking

#### **User Reports**

- User activity summaries
- Enrollment trends
- Engagement metrics

#### **Financial Reports**

- Earnings summaries
- Revenue share breakdowns
- Payment history
- Withdrawal summaries

### **8. System Settings**

#### **Organization Settings**

- View and update organization name
- Configure organization details
- Manage organization contact information

#### **User Settings**

- Update user profile information
- Change password
- Configure notification preferences
- Set display preferences

#### **Theme Customization**

- Toggle between light and dark mode
- Persist theme preference

#### **Role Management**

- View role definitions and permissions
- Understand access restrictions
- View role-specific features

---

## **User Roles and Permissions**

### **Permission Hierarchy**

Access to platform features is determined by:

1. **Partner Type** (primary determinant)
2. **User Role** within that partner type
3. **Access Level** (0-100 percentage scale)
4. **Specific Permissions** granted

### **Partner Types & Access Levels**

#### **1. Affiliate Partner (Access Level: 25%)**

**Available Sections:**

- Dashboard
- Campaigns
- Wallet

**Capabilities:**

- View basic dashboard metrics
- Create and manage campaigns
- Track limited financial information
- No access to user management, programs, or advanced reporting

**Typical Roles:**

- Affiliate Agent: Individual contributor managing referrals
- Affiliate Manager: Team lead overseeing multiple agents

---

#### **2. Media Partner (Access Level: 35%)**

**Available Sections:**

- Dashboard
- Campaigns
- Wallet
- Reports
- Tasks

**Capabilities:**

- Full campaign management
- Advanced financial tracking
- Generate reports and analytics
- Manage task workflows
- View audience insights
- Access revenue share details

**Typical Roles:**

- Media Manager: Oversee team and campaigns
- Media Admin: Administrative tasks for media partner
- Content Creator: Create promotional materials

---

#### **3. Corporate Partner (Access Level: 40%)**

**Available Sections:**

- Dashboard
- Campaigns
- Wallet
- Reports

**Capabilities:**

- Manage employee benefit campaigns
- Track departmental usage
- Generate HR-focused reports
- Bulk enrollment capabilities
- Payroll integration tracking
- View employee portal analytics

**Typical Roles:**

- Corporate Admin: Full administrative access
- HR Manager: Human resources focused tasks
- Finance Manager: Financial reporting and reconciliation

---

#### **4. Institutional Partner (Access Level: 45%)**

**Available Sections:**

- Dashboard
- Campaigns
- Wallet
- Reports
- Users
- Programs
- Tasks
- Settings

**Capabilities:**

- Complete platform access
- Full user management
- Program administration
- Community member enrollment
- Advanced task management
- Comprehensive settings configuration

**Typical Roles:**

- Hub Manager: Manage hub operations
- Hub Admin: Full administrative control
- Community Coordinator: Community engagement and enrollment

---

#### **5. Admin Partner / Super Admin (Access Level: 100%)**

**Available Sections:** All sections

**Capabilities:**

- Full access to all features
- Create and manage other users
- Assign roles and permissions
- Manage organizations
- Access system administration features
- View all analytics and reports

---

### **Permission Categories**

Users may have explicit permissions in these categories:

- **Track Referrals**: Monitor and report on referral activity
- **View Earnings**: Access financial information and transaction history
- **Access Marketing Materials**: Download and use promotional content
- **Basic Analytics**: View fundamental dashboards and metrics
- **View Referral Data**: Access detailed referral information
- **Manage Campaigns**: Create, edit, and delete campaigns
- **View Audience Insights**: Analyze target demographics
- **Advanced Analytics**: Access detailed reporting tools
- **View Revenue Share**: See financial distributions
- **Bulk Enrollment**: Add multiple users simultaneously
- **Usage Reports**: Generate usage-based reports
- **Department Reporting**: View departmental breakdowns
- **Employee Portal**: Access employee-facing features
- **Manage Hub**: Administer community hub operations
- **Enroll Members**: Add community members

---

## **Application Navigation**

### **URL Routes**

The application is structured with the following primary routes:

| Route             | Purpose                       | Authentication Required |
| ----------------- | ----------------------------- | ----------------------- |
| `/`               | Landing/Hero page             | No                      |
| `/signIn`         | User login page               | No                      |
| `/signUp`         | User registration page        | No                      |
| `/auth/callback`  | OAuth callback handler        | No                      |
| `/onboarding`     | Setup wizard for new partners | Yes                     |
| `/select-account` | Account type selection        | Yes                     |
| `/dashboard`      | Main partner dashboard        | Yes                     |

### **Dashboard Navigation Structure**

Once logged in, users access the dashboard with the following navigation:

#### **Left Sidebar** (Desktop)

- Contains logo and Sqooli branding
- Lists accessible sections based on partner type
- Collapsible on mobile devices
- Highlighted active section

#### **Header Area**

- Organization/title display
- Notification icon
- User profile dropdown
- Theme toggle
- Mobile menu button (on mobile)

#### **Main Content Area**

- Active section content
- Responsive layout for all screen sizes
- Adaptive typography and spacing
- Sidebar-aware content positioning

#### **Footer Area**

- Typically hidden or minimal on dashboard
- Visible on public landing pages

### **Dashboard Sections (by Partner Type)**

#### **Dashboard Section**

- Available to: All partner types
- Displays: Key metrics, earnings charts, upcoming campaigns, recent activity

#### **Campaigns Section**

- Available to: All partner types with campaign management
- Displays: Campaign list, creation interface, campaign details

#### **Wallet Section**

- Available to: All partner types
- Displays: Balance, transactions, withdrawal requests

#### **Reports Section**

- Available to: Media, Corporate, and Institutional partners
- Displays: Analytics, performance metrics, download options

#### **Users Section**

- Available to: Corporate and Institutional partners
- Displays: Team member list, add/remove users, role management

#### **Programs Section**

- Available to: Institutional partners
- Displays: Program list, creation interface, curriculum management

#### **Tasks Section**

- Available to: Media and Institutional partners
- Displays: Pending tasks, approval workflows, task details

#### **Settings Section**

- Available to: Institutional partners and admins
- Displays: Organization settings, user preferences, role configuration

---

## **Getting Started**

### **First-Time User Steps**

#### **Step 1: Sign Up**

1. Navigate to the Sqooli Partner Portal landing page
2. Click "Sign Up" button
3. Complete the registration form with:
   - First and last name
   - Valid email address
   - Phone number
   - Username (alphanumeric, 3+ characters)
   - Strong password (8+ characters, uppercase, lowercase, number)
4. Select your partner type (Affiliate, Media, Corporate, or Institutional)
5. Review terms and click "Register"
6. Confirm email address if required

#### **Step 2: Sign In**

1. Go to the sign in page
2. Enter your email address and password
3. Click "Sign In"
4. You will be authenticated and logged into the system

#### **Step 3: Select Account Type**

1. Choose your account type from the available options:
   - **Partner**: For business account access
   - **School**: For institutional educational partners
   - **Teacher**: For individual educator access
2. Click "Continue" to proceed

#### **Step 4: Complete Onboarding**

1. Follow the guided onboarding wizard steps:
   - **Wallet Setup**: Configure your withdrawal method and beneficiary account
   - **Campaign Creation**: Create your first promotional campaign
   - **User Enrollment**: Add team members (optional)
   - **Two-Factor Authentication**: Enable additional security (optional)
   - **Social Media Setup**: Connect your social channels (optional)
2. As you complete each step, the system tracks progress
3. Once all required steps are complete (wallet and campaign), your account is activated

#### **Step 5: Access Dashboard**

1. After onboarding completion, you are redirected to your dashboard
2. Select the section you want to work with from the sidebar
3. Begin managing your campaigns, team, and finances

### **Returning User Steps**

#### **Sign In**

1. Visit the Sqooli Partner Portal
2. Click "Sign In"
3. Enter email and password
4. You are logged into your dashboard

#### **Select Your Account**

1. If you have multiple account types, select the one you want to use
2. Otherwise, you proceed directly to dashboard

#### **Access Dashboard**

1. You land on your main dashboard
2. Use the sidebar to navigate to required sections

---

## **Step-by-Step Usage Guide**

### **Creating a Campaign**

#### **Objective**

Establish a promotional campaign to drive signups and generate revenue.

#### **Steps**

1. **Navigate to Campaigns Section**
   - Click "Campaigns" in the left sidebar
   - Page loads with campaign list and filters

2. **Click "Create Campaign" Button**
   - Locate the "+" button or "Create Campaign" button
   - Button opens the campaign creation wizard

3. **Complete Campaign Details**
   - **Campaign Name**: Enter a descriptive name
   - **Description**: Provide campaign overview
   - **Start Date**: Select campaign start date
   - **End Date**: Select campaign end date
   - **Target Signups**: Enter target number of signups
   - **Daily Target**: Specify daily signup goals

4. **Configure Offerings**
   - **Bundled Offers**: Set minimum lessons and total price
   - **Discount Rules**: Define per-lesson pricing
   - **Promotional Code**: Auto-generated or custom promo code

5. **Set Revenue Share**
   - **Partner Percentage**: Your revenue share percentage
   - **Sqooli Percentage**: Platform percentage
   - Both percentages automatically calculated to total 100%

6. **Add Contact Information**
   - **WhatsApp Number**: Contact number for inquiries

7. **Review Campaign**
   - Verify all information is correct
   - Check revenue projections

8. **Submit Campaign**
   - Click "Create Campaign" button
   - System validates information
   - Campaign created and enters Draft status
   - Confirmation message displays

#### **After Creation**

- Campaign appears in Campaigns list
- Can transition to Active status
- Track performance in campaign details

---

### **Tracking Earnings & Withdrawals**

#### **Objective**

Monitor your account balance and manage financial withdrawals.

#### **Steps**

1. **Navigate to Wallet Section**
   - Click "Wallet" in the left sidebar
   - Wallet overview displays current balance

2. **View Current Balance**
   - Current balance shown in primary card
   - Withdrawal method displayed
   - Beneficiary account information shown

3. **Review Transaction History**
   - Default "Payments" tab shows received payments
   - Each transaction shows:
     - Date
     - Amount
     - Campaign associated
     - Status

4. **Switch to Withdrawals Tab**
   - Click "Withdrawals" tab
   - View previous withdrawal requests
   - See withdrawal status (pending, completed, failed)

5. **Request Withdrawal**
   - Click "Withdraw Funds" button
   - Specify withdrawal amount (must be available balance)
   - Confirm withdrawal method
   - Review beneficiary information
   - Click "Confirm Withdrawal"
   - System processes request
   - Confirmation message displays with reference number

6. **Monitor Withdrawal Status**
   - Withdrawals appear in "Withdrawals" tab
   - Status updates as processing continues
   - Estimated processing time displayed

#### **Troubleshooting**

- If balance is insufficient, add successful campaigns
- If withdrawal fails, verify beneficiary account information
- Contact support for stuck withdrawals

---

### **Managing Team Members**

#### **Objective**

Add and manage team members and their access levels.

#### **Prerequisites**

- User must have access to Users section (Corporate or Institutional partners)
- User must have write permissions for user management

#### **Steps**

1. **Navigate to Users Section**
   - Click "Users" in the left sidebar
   - Current team members list displays

2. **View Team Members**
   - See list of added users
   - View each user's:
     - Name
     - Email
     - Role
     - Status (active/inactive)
     - Last login date

3. **Add New Team Member**
   - Click "Add User" or "+" button
   - Fill in user details:
     - First name
     - Last name
     - Email address
     - Phone number
     - Role (from available roles for your partner type)
   - Click "Invite User"
   - Invitation email sent to user
   - User appears in list as "pending"

4. **Change User Role**
   - Find user in list
   - Click "Edit" or context menu
   - Select new role from dropdown
   - Confirm change
   - User permissions updated immediately

5. **Deactivate User**
   - Find user in list
   - Click context menu (three dots)
   - Select "Deactivate" or "Remove"
   - Confirm action
   - User account deactivated (remains visible for audit)

6. **View User Details**
   - Click on user name
   - Details dialog opens showing:
     - All user information
     - Current permissions
     - Activity history
     - Audit trail

#### **User Roles by Partner Type**

**Affiliate Partners:**

- Affiliate Agent
- Affiliate Manager

**Media Partners:**

- Media Manager
- Media Admin
- Content Creator

**Corporate Partners:**

- Corporate Admin
- HR Manager
- Finance Manager

**Institutional Partners:**

- Hub Manager
- Hub Admin
- Community Coordinator

---

### **Accessing Reports & Analytics**

#### **Objective**

Generate reports to understand campaign performance and financial metrics.

#### **Prerequisites**

- User must have access to Reports section
- Partner type must support reporting (Media, Corporate, or Institutional)

#### **Steps**

1. **Navigate to Reports Section**
   - Click "Reports" in the left sidebar
   - Reports page loads

2. **View Dashboard Analytics**
   - **Total Campaigns**: Number of campaigns created
   - **Ongoing Campaigns**: Number of active campaigns
   - **Total Signups**: Sum of signups across campaigns
   - **Total Earnings**: Cumulative earnings to date

3. **View Campaign Performance**
   - If campaigns exist:
     - Campaign details display
     - Performance metrics shown (signups, revenue)
     - Trend visualization if data available
   - If no campaigns:
     - "No Campaigns" message with creation prompt

4. **Export Data**
   - Click "Export" button (if available)
   - Select export format (CSV, PDF)
   - File downloads to computer

5. **Filter Reports**
   - Use date range selector to filter
   - Select campaign to view specific campaign data
   - Results update based on filters

#### **Available Report Types**

- Summary dashboards (all partners with report access)
- Campaign performance (detailed metrics)
- Financial reports (earnings, payments, commissions)
- User activity (if available)

---

### **Completing Organization Settings**

#### **Objective**

Configure organization information and user preferences.

#### **Prerequisites**

- User must have access to Settings section
- Institutional partners and admins only

#### **Steps**

1. **Navigate to Settings Section**
   - Click "Settings" in the left sidebar
   - Settings page loads with tabs

2. **Update Profile Settings**
   - **Organization Name**: Update name if needed
   - **Contact Email**: Verify/update email
   - **Phone Number**: Update contact phone
   - Click "Save" to apply changes
   - Confirmation message displays

3. **Configure User Roles** (Admin only)
   - Click "Roles" tab
   - View available roles for partner type
   - See permissions for each role
   - Confirm role configuration meets needs

4. **Set Preferences**
   - **Theme**: Toggle light/dark mode
   - **Notifications**: Configure notification settings
   - **Language**: Select preferred language (if available)
   - Changes apply immediately

5. **View Organization Details**
   - Display current organization information
   - Access level shown
   - Commission rate information
   - Partner type confirmed

---

## **Dashboard Sections**

### **Dashboard (Overview)**

#### **Purpose**

Provides high-level overview of organizational performance and activity.

#### **Content**

- **Key Metrics Cards**:
  - Total campaigns (count)
  - Active campaigns (count)
  - Total signups (sum)
  - Total earnings (amount)

- **Earnings Chart**
  - Line graph of earnings over time
  - Interactive hover for specific dates
  - Toggle between different time ranges

- **Wallet Status**
  - Current balance display
  - Last transaction shown
  - Quick link to Wallet section

- **Upcoming Campaigns**
  - Next 3-5 campaigns listed
  - Start date and target signups shown
  - Quick access to campaign details

- **Recent Activity**
  - Latest user actions
  - Campaign status changes
  - Withdrawal requests
  - User additions/removals

#### **Interactions**

- Click campaign to view details
- Click metrics to drill down
- Refresh data manually or auto-refreshes periodically

---

### **Campaigns**

#### **Purpose**

Manage and monitor promotional campaigns.

#### **Content**

**Campaign List View:**

- **Tabs**: Active | Expired | Draft
- **Search**: Find campaigns by ID or name
- **Columns**:
  - Campaign ID
  - Campaign Name
  - Start Date
  - End Date
  - Status
  - Target Signups
  - Revenue Projection

**Campaign Actions:**

- Click campaign row to view details
- Click "Edit" to modify campaign details
- Click "Delete" to remove campaign
- Create new campaign via button

#### **Campaign Details Modal**

When viewing a campaign:

- Full campaign information
- Performance metrics (actual vs. target)
- Promotional code
- Contact information
- Revenue calculations
- Status options (activate, archive, delete)

#### **Interactions**

- Switch between tabs to filter by status
- Search to find specific campaign
- Sort by column headers
- Add new campaign
- Edit existing campaign
- View detailed campaign information

---

### **Wallet**

#### **Purpose**

Manage financial accounts and track transactions.

#### **Content**

**Wallet Overview:**

- Current balance (prominent display)
- Withdrawal method
- Beneficiary account information

**Tabs:**

1. **Payments Tab**
   - List of all payments received
   - Columns: Date, Amount, Campaign, Status
   - Search and filter options
   - Export transaction list

2. **Withdrawals Tab**
   - List of withdrawal requests
   - Columns: Date, Amount, Status, Reference
   - Track processing status
   - View withdrawal history

**Actions:**

- Request new withdrawal
- View transaction details
- Filter by date range
- Export data

#### **Interactions**

- Switch between Payments and Withdrawals
- Click transaction for details
- Request withdrawal for available balance
- Filter and search transactions

---

### **Reports**

#### **Purpose**

Analyze performance and generate insights.

#### **Content**

**Dashboard Analytics:**

- Total campaigns created
- Ongoing campaigns count
- Total signups across all campaigns
- Total earnings to date

**Campaign Reports:**

- Performance by campaign
- Signup progress
- Revenue performance
- Status breakdown

**Data Presentation:**

- Summary cards with key metrics
- Tables with detailed data
- Charts visualizing trends (if available)
- Export options

#### **Interactions**

- View available reports
- Export data to CSV or PDF
- Filter by date range or campaign
- Drill down for campaign details

---

### **Users**

#### **Purpose**

Manage team members and permissions.

#### **Content**

**User List:**

- Name
- Email
- Role
- Status
- Last login
- Actions menu

**Actions Available:**

- View user details
- Edit user role
- Deactivate user
- View activity history
- Resend invitation

**User Management Interface:**

- Search users by name or email
- Filter by role or status
- Sort by columns
- Bulk actions (if available)

#### **Interactions**

- Click user to view details
- Add new user via form
- Change user role
- Deactivate or remove user
- View user activity

---

### **Programs**

#### **Purpose**

Manage educational programs and curriculum.

#### **Content**

**Programs List:**

- Program name
- Description
- Curriculum type
- Status
- Pricing
- Created date

**Program Details:**

- Full program information
- Associated subjects
- Timetable/schedule
- Enrollment numbers
- Actions to edit or delete

**Curriculum Management:**

- Available curricula (CBC, 8-4-4, Cambridge)
- Subjects within each curriculum
- Add or modify subjects

#### **Interactions**

- View program list
- Create new program
- Edit program details
- Delete program
- Manage curriculum
- Add/remove subjects

---

### **Tasks**

#### **Purpose**

Manage campaign task workflows and approvals.

#### **Content**

**Task List:**

- Task ID/Reference
- Campaign
- Status (Pending, Approved, Declined)
- Created date
- Created by
- Approval status

**Task Tabs:**

- **Pending**: Tasks awaiting approval
- **Completed**: Approved or declined tasks

**Task Details:**

- Campaign name
- Task description
- Promo code
- QR code (if applicable)
- Created by
- Assigned approver
- Status timeline

#### **Actions:**

- Approve task
- Decline task with reason
- View task details
- Add comments

#### **Interactions**

- Switch between Pending and Completed tabs
- Click task for details
- Approve/decline task
- Provide approval reason
- View approval history

---

### **Settings**

#### **Purpose**

Configure organization and user preferences.

#### **Content**

**Profile Tab:**

- Organization name and logo
- Contact information
- Email address
- Phone number
- Partner type
- Access level
- Commission rate

**Roles Tab:**

- Available roles for partner type
- Permissions for each role
- Role descriptions
- Permission matrix

**Preferences:**

- Theme selection (light/dark)
- Notification settings
- Language preference
- Display preferences

#### **Interactions**

- Update organization information
- Change theme
- Configure notifications
- View role information
- Save preferences

---

## **Input & Output Description**

### **Authentication Forms**

#### **Sign Up Form**

**Inputs:**

- First Name (text, 2+ characters)
- Last Name (text, 2+ characters)
- Email (email format validation)
- Phone Number (10+ digits, alphanumeric)
- Username (alphanumeric + underscore/hyphen, 3+ characters)
- Password (8+ characters, uppercase, lowercase, number required)
- Confirm Password (must match password)
- Partner Type (dropdown: Affiliate, Media, Corporate, Institutional)

**Outputs:**

- Account created confirmation
- Automatic login upon success
- Redirect to account selection page
- Error messages for validation failures

#### **Sign In Form**

**Inputs:**

- Email (email format validation)
- Password (8+ characters minimum)
- Remember me (optional checkbox)

**Outputs:**

- Session authenticated
- User redirected to dashboard
- Error messages for:
  - Invalid email format
  - Password too short
  - Incorrect credentials
  - Account not found

---

### **Campaign Form**

#### **Inputs**

**Basic Information:**

- Campaign Name (text, required)
- Description (textarea, optional)
- Program Selection (dropdown)

**Timing:**

- Start Date (date picker)
- End Date (date picker)

**Goals:**

- Target Signups (number)
- Daily Target (number)

**Pricing:**

- Bundled Offers Min Lessons (number)
- Bundled Offers Price (currency)
- Discount Per Lesson (currency)

**Revenue:**

- Partner Percentage (0-100)
- Sqooli Percentage (auto-calculated)

**Contact:**

- WhatsApp Number (phone number)

**Promotional:**

- Promotional Code (auto-generated or custom)

#### **Outputs**

- Campaign created successfully message
- Campaign ID assigned
- Campaign appears in list
- Confirmation with campaign details
- Option to activate immediately
- Error messages for:
  - Required fields missing
  - Invalid date ranges
  - Conflicting percentages
  - Duplicate campaign name

---

### **User Management Form**

#### **Add User**

**Inputs:**

- First Name (text, required)
- Last Name (text, required)
- Email (email format, required)
- Phone Number (phone format, required)
- Role (dropdown, required)
- Department (optional)

**Outputs:**

- User created/invitation sent
- User appears in list as "pending"
- Confirmation message with user details
- Email sent to new user
- Error for:
  - Duplicate email
  - Invalid role
  - Required fields missing

#### **Edit User**

**Inputs:**

- Role (dropdown)
- Status (active/inactive)
- Permissions (checkboxes)

**Outputs:**

- Changes applied immediately
- Confirmation message
- User permissions updated in system
- Activity logged for audit

---

### **Wallet Withdrawal**

#### **Inputs**

- Withdrawal Amount (currency, ≤ current balance)
- Withdrawal Method (pre-configured or selection)
- Beneficiary Confirmation (checkbox)

#### **Outputs**

- Withdrawal processed
- Reference number generated
- Status message (pending, processing)
- Transaction added to history
- Email confirmation sent
- Error for:
  - Insufficient balance
  - Invalid amount
  - Unconfirmed beneficiary
  - Processing errors

---

### **Dashboard Outputs**

#### **Metrics Display**

**Cards Show:**

- Total Campaigns: Count of all campaigns
- Active Campaigns: Count of campaigns with active status
- Total Signups: Sum of target_signups across campaigns
- Total Earnings: Sum of revenue earned from campaigns

**Charts Display:**

- Earnings over time: Line chart with date on X-axis, amount on Y-axis
- Campaign status breakdown: Pie or bar chart
- Signup progress: Bar chart showing achieved vs. target

#### **Lists Display**

**Campaign List:**

- Campaign ID, Name, Dates, Status, Metrics

**Transaction List:**

- Date, Amount, Type (payment/withdrawal), Status, Campaign

**User List:**

- Name, Email, Role, Status, Last Login

---

## **Error Handling & Messages**

### **Validation Error Messages**

The system provides specific, user-friendly error messages:

#### **Email Validation**

- "Email is required"
- "Please enter a valid email address"
- "Email already registered"

#### **Password Validation**

- "Password is required"
- "Password must be at least 8 characters"
- "Password must contain at least one uppercase letter"
- "Password must contain at least one lowercase letter"
- "Password must contain at least one number"
- "Passwords do not match"

#### **Username Validation**

- "Username is required"
- "Username must be at least 3 characters"
- "Username can only contain letters, numbers, underscores, and hyphens"

#### **Phone Number Validation**

- "Phone number is required"
- "Please enter a valid phone number"

#### **Name Validation**

- "First name is required"
- "First name must be at least 2 characters"
- "Last name is required"
- "Last name must be at least 2 characters"

---

### **Authentication Error Messages**

#### **Login Errors**

- "Please fix the validation errors" (for validation failures)
- "Login failed" (generic error)
- "Invalid email or password" (credential mismatch)
- "Account not found" (user doesn't exist)
- "Account is disabled" (deactivated user)

#### **Registration Errors**

- "Please fix the validation errors"
- "Email already registered"
- "Username already taken"
- "Registration failed - please try again"

#### **Session Errors**

- "Session expired - please log in again"
- "Your session has been terminated"
- "Unauthorized access"

---

### **Permission Error Messages**

#### **Access Denied Messages**

- "Access Restricted" (shown when section unavailable)
- "Your partner tier doesn't include [feature] access"
- "You do not have permission to view this section"
- "You do not have permission to perform this action"

---

### **Data Operation Error Messages**

#### **Campaign Operations**

- "Campaign creation failed"
- "Campaign update failed"
- "Campaign deletion failed"
- "Campaign not found"
- "Campaign end date must be after start date"

#### **Wallet Operations**

- "Insufficient balance for withdrawal"
- "Withdrawal amount must be greater than zero"
- "Beneficiary information is incomplete"
- "Withdrawal failed - please try again"
- "Transaction processing failed"

#### **User Management**

- "User creation failed"
- "User update failed"
- "User deletion failed"
- "Email already in use"
- "Invalid role selection"

---

### **System Error Messages**

#### **Network/Connection**

- "Network error - please check your connection"
- "Unable to reach server - please try again"
- "Request timeout - please try again"

#### **Server Errors**

- "An unexpected error occurred"
- "Server error - please contact support"
- "Database error - please try again"

#### **Specific Issues**

- "No partner data available" (when partner not loaded)
- "Unable to load campaigns" (data fetch failure)
- "Unable to process request" (generic failure)

---

### **Success Messages**

- "Signed up successfully!" (after registration)
- "Logged in successfully!" (after login)
- "Campaign created successfully"
- "Campaign updated successfully"
- "Campaign deleted successfully"
- "User added successfully"
- "User updated successfully"
- "Withdrawal requested successfully"
- "Settings saved successfully"
- "Password changed successfully"
- "Account settings updated"

---

### **Information Messages**

- "Logged out successfully 👋" (after logout)
- "Loading your dashboard..."
- "Loading your wallet..."
- "No campaigns found"
- "No team members yet"
- "Onboarding in progress..."
- "All required steps complete"
- "Permission changes detected - refresh your session"

---

## **System Requirements**

### **Browser Compatibility**

The application is tested and supported on:

**Desktop Browsers:**

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Mobile Browsers:**

- Chrome Mobile (latest)
- Safari Mobile (iOS 12+)
- Firefox Mobile (latest)
- Samsung Internet (latest)

### **Device Requirements**

**Minimum Specifications:**

- Processor: 1 GHz multi-core
- RAM: 1 GB minimum
- Storage: 100 MB available space
- Display: 320px minimum width (mobile)
- Internet: 1 Mbps minimum connection

**Recommended Specifications:**

- Processor: 2+ GHz multi-core
- RAM: 4 GB or more
- Storage: SSD with 500 MB available space
- Display: 1920x1080 or higher
- Internet: 5+ Mbps connection

### **Network Requirements**

- Active internet connection (broadband or 4G recommended)
- Stable connection required for real-time features
- Support for WebSocket connections (for real-time updates)
- HTTPS required (TLS 1.2+)
- Cookies must be enabled for session management
- Third-party cookies may be required for integrations

### **Operating System**

**Supported:**

- Windows 7 and later
- macOS 10.12 and later
- iOS 12 and later
- Android 5.0 and later
- Linux (any distribution with modern browser)

### **Email Client Requirements**

Users must have:

- Valid email address for registration and password recovery
- Access to email for receiving invitations and notifications
- Ability to receive emails from no-reply@sqooli.com

### **Accessibility Features**

- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Text size adjustability
- Focus indicators for keyboard users

### **Third-Party Services**

The application integrates with:

- **Supabase**: For authentication and backend services
- **Payment Processors**: For financial transactions
- **Email Service**: For notifications and communications
- **SMS Service**: For two-factor authentication (optional)

---

## **Limitations**

### **Functional Limitations**

1. **Onboarding Requirement**
   - All new users must complete onboarding process before accessing full dashboard
   - Onboarding requires at least wallet setup and initial campaign creation

2. **Campaign Management**
   - Campaign dates cannot be modified after creation in some cases
   - Campaign deletion may not be allowed if transactions exist

3. **User Management**
   - Only admins can manage users at institutional level
   - Cannot delete users; only deactivation supported for audit trail

4. **Real-Time Updates**
   - Some metrics may be updated on a delay basis (not true real-time)
   - Page refresh may be needed to see latest data in certain cases

5. **Data Export**
   - Limited export formats in current version (CSV, PDF)
   - Export size limits may apply for large datasets

### **Access Limitations**

1. **Feature Availability by Partner Type**
   - Affiliate partners have limited feature access (no user or program management)
   - Not all reports available to all partner types
   - Some advanced features reserved for Institutional and Corporate partners

2. **Cross-Partner Visibility**
   - Partners can only view data for their own organization
   - No visibility into other partners' campaigns or performance
   - Admin partners have cross-partner visibility only

3. **Historical Data**
   - Limited historical data retention period (specific window varies)
   - Complete audit logs maintained separately for compliance

### **Technical Limitations**

1. **Browser Compatibility**
   - Internet Explorer not supported
   - Older browser versions may have degraded functionality
   - JavaScript must be enabled

2. **Session Management**
   - Sessions timeout after period of inactivity
   - Active sessions from same user may conflict
   - Simultaneous multi-device logins may cause issues

3. **File Upload Limits**
   - Maximum file size for uploads (varies by upload type)
   - Limited file types supported
   - Bulk uploads have row limits

4. **Performance Considerations**
   - Large datasets may load slowly
   - Complex filtering may impact responsiveness
   - High concurrent user load may cause slowdown

### **Data Limitations**

1. **Demo Data**
   - Application includes sample/demo data for testing
   - Demo data may not reflect real operational data
   - JSON-based data storage for development purposes

2. **Synchronization**
   - Potential delays in data synchronization across systems
   - Offline mode not supported
   - Real-time collaboration features limited

### **Integration Limitations**

1. **Third-Party Services**
   - Dependence on Supabase availability
   - Payment processor integration limited to configured methods
   - Some features require external service availability

2. **Social Media Integration**
   - Limited platforms supported initially
   - API rate limits may apply
   - Requires proper permissions from social platforms

---

## **Conclusion**

The Sqooli Partner Portal represents a comprehensive platform for partner management and engagement. By providing role-based access, intuitive navigation, and powerful analytical tools, it empowers partners to collaborate effectively with Sqooli while maintaining appropriate security and access controls.

### **Key Takeaways**

- **Partner-Centric Design**: Each partner type has customized access based on their role and needs
- **Ease of Use**: Intuitive interface with clear workflows for common tasks
- **Data-Driven**: Comprehensive analytics and reporting capabilities
- **Security**: Role-based access control and secure authentication
- **Scalability**: Supports multiple partner types and organizational structures
- **Support**: Clear error messages and validation guidance

### **Getting Help**

Should users encounter issues or have questions:

1. Review the relevant section of this manual
2. Check the error message and follow guidance provided
3. Contact your organization's administrator
4. Reach out to Sqooli support team

### **Next Steps**

After completing this manual:

1. Set up your account following the Getting Started section
2. Complete the onboarding process
3. Create your first campaign in the Campaigns section
4. Explore analytics in the Reports section
5. Configure team members if applicable

### **Continuous Improvement**

The Sqooli Partner Portal is continuously updated with new features and improvements. Users are encouraged to:

- Provide feedback on the platform
- Report issues or bugs encountered
- Suggest features or enhancements
- Share success stories and best practices

---

## **Document Information**

**Title**: Sqooli Partner Portal - User Manual  
**Version**: 1.0.0  
**Date**: January 2026  
**Target Audience**: Partner organizations and users of the Sqooli platform  
**Maintenance**: Regular updates as features evolve

For the most up-to-date information, visit the Sqooli Partner Portal help section or contact support.

---

**End of User Manual**
