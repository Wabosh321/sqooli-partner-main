# Social Media Channels & Admin Partner Hierarchy - Complete Implementation

**Status**: ✅ **FULLY IMPLEMENTED & TESTED**  
**Date**: January 3, 2026  
**Implementation Type**: Database + Backend + Frontend Integration  

---

## 🎯 Overview

Campaigns are now channeled through partner's **social media accounts** instead of generic channels. This implementation establishes:

1. **Social Media as Channels**: Each partner's social media account (Instagram, TikTok, YouTube, WhatsApp, etc.) becomes a campaign channel
2. **Admin Partner Hierarchy**: `admin_partner` role can create and manage multiple `media_partner` sub-users
3. **Deterministic Campaign Links**: Campaigns linked to specific social platforms, traceable back to source
4. **Engagement Tracking**: Built-in metrics for followers, engagement rate, verification status

---

## 📊 Data Model

### New Tables & Relationships

```
users (updated)
├── parent_user_id → users.id (for sub-user hierarchy)
├── is_sub_user (boolean)
└── role: 'member' | 'partner' | 'admin_partner' | 'media_partner'

partners (existing)
└── (no changes, but now linked via users)

social_media (NEW)
├── id (UUID, primary key)
├── partner_id → partners.id
├── created_by_user_id → users.id (admin_partner who created it)
├── platform: 'instagram' | 'tiktok' | 'facebook' | 'twitter' | 'youtube' | 'linkedin' | 'whatsapp' | 'telegram' | 'custom'
├── handle (platform-specific username)
├── url (verified URL to account)
├── follower_count (integer, for targeting)
├── engagement_rate (numeric, for analytics)
├── is_verified (boolean)
├── status: 'active' | 'inactive' | 'suspended'
├── metadata (JSONB for platform-specific data)
├── created_at & updated_at
└── UNIQUE(partner_id, platform, handle)

channels (updated)
├── social_media_id → social_media.id
├── name (kept, now reflects platform name)
├── is_active (boolean)
└── subchannels: ['promotional', 'engagement', 'announcements']

campaigns (uses channel_id)
└── channel_id → channels.id → social_media.id (transitive relationship)
```

### Entity Relationship Diagram

```
User (admin_partner)
  ├── parent_user_id: null
  ├── role: 'admin_partner'
  └── partner_id: Partners.id
        ├── social_media[0]: Instagram (15K followers, verified)
        │   └── channels[0]: Instagram channel
        │       └── campaigns[0]: Social Media Campaign - Instagram Launch
        ├── social_media[1]: TikTok (32K followers, verified)
        │   └── channels[1]: TikTok channel
        │       └── campaigns[N]: TikTok engagement campaigns
        ├── social_media[2]: WhatsApp (+254700123456)
        │   └── channels[2]: WhatsApp business channel
        └── social_media[3]: YouTube (8.5K subscribers, verified)
            └── channels[3]: YouTube channel

User (media_partner - sub-user)
  ├── parent_user_id: admin_partner.id
  ├── is_sub_user: true
  ├── role: 'media_partner'
  └── partner_id: (same as admin_partner)
```

---

## 🔑 Key Features

### 1. **Social Media Management**
- Admin partners add/update/delete social media accounts
- Each account linked to a channel automatically
- Platforms: Instagram, TikTok, Facebook, Twitter, YouTube, LinkedIn, WhatsApp, Telegram, Custom

### 2. **Sub-User Hierarchy**
- Admin partners create media_partner sub-users
- All sub-users belong to same partner organization
- Sub-users can create campaigns (via admin-approved channels)

### 3. **Campaign Linking Strategy**
- Campaigns select channel (which is a social media account)
- Link stored automatically: `https://sqooli.app/c/{campaign_uuid}`
- Traceable to platform: Instagram, TikTok, etc.

### 4. **Engagement Metrics**
- Follower count per platform
- Engagement rate tracking
- Verification status (blue check)
- Status monitoring (active/inactive/suspended)

---

## 📱 Test Data Setup

### Admin Partner Created
```
Email: maxwellmutonyi@gmail.com
Role: admin_partner (UPGRADED from partner)
Organization: Vabotech (media type)
Partner ID: 8d2546a1-13ec-4afe-9dd3-48da2b8c6cf6
```

### Social Media Accounts Created
```
1. Instagram: @vabotech_media
   - URL: https://instagram.com/vabotech_media
   - Followers: 15,000 ✓ verified
   - Engagement: 4.5%
   - Channel ID: 20297861-b0c2-4bab-89a8-e38fe3192298

2. TikTok: @vabotech_edu
   - URL: https://tiktok.com/@vabotech_edu
   - Followers: 32,000 ✓ verified
   - Engagement: 6.2%
   - Channel ID: 3a4996d1-3078-406f-b1a4-db7a24bdd630

3. WhatsApp: +254700123456
   - URL: https://wa.me/254700123456
   - Business Account: Yes
   - Channel ID: 436b6d44-cdcc-491e-a502-6aef75ae1992

4. YouTube: Vabotech Academy
   - URL: https://youtube.com/c/VabotechAcademy
   - Subscribers: 8,500 ✓ verified
   - Engagement: 3.8%
   - Channel ID: bb5f8a45-2149-4ad5-83ce-6ce65fb7453c
```

### Test Campaign Created
```
Campaign: "Social Media Campaign - Instagram Launch"
Partner: Vabotech (admin_partner managed)
Channel: Instagram (@vabotech_media, 15K followers)
Program: Link-First Test Program
Target Signups: 5,000
Duration: Jan 3 - Apr 3, 2026
Status: active

Campaign URL: https://sqooli.app/c/1d6af7de-fd50-4c53-bc45-c1a4c3f26324
Social Media Source: Instagram @vabotech_media
```

---

## 🛠️ Database Migrations Applied

### Migration 012: Create Social Media & Channels Hierarchy
- Creates `social_media` table with all columns
- Adds `social_media_id` and `is_active` to channels
- Creates indexes for performance
- No RLS yet (applied in next migration)

### Migration 013: Add Social Media RLS Policies
- `admin_view_all_social_media`: Admins see everything
- `partner_view_own_social_media`: Partners see their accounts
- `partner_insert_own_social_media`: Partners add accounts
- `admin_partner_update_social_media`: Update capabilities
- `admin_partner_delete_social_media`: Delete capabilities

### Migration 014: Setup Test Data
- Upgrades maxwellmutonyi@gmail.com to `admin_partner`
- Creates Vabotech partner if not exists
- Inserts 4 social media accounts (Instagram, TikTok, WhatsApp, YouTube)
- Auto-creates channels for each social media
- Verifies all accounts are linked properly

### Migration 015: Add User Hierarchy
- Adds `parent_user_id` and `is_sub_user` columns to users
- Creates `create_media_partner_sub_user()` RPC function
- Creates `admin_add_social_media()` RPC function
- Enables admin partners to manage organization

### Migration 016: Test Campaign Creation
- Creates test campaign using social media channel
- Demonstrates complete flow: User → Partner → Campaign → Program → Channel → Social Media

---

## 🔌 Frontend Integration

### CreateCampaign.tsx Updates
```typescript
// Now fetches social_media instead of generic channels
const { data: smData } = await supabase
  .from('social_media')
  .select(`
    id, platform, handle, url, follower_count, 
    is_verified, status, channels(...)
  `)
  .eq('partner_id', partnerId)
  .eq('status', 'active');

// Channel dropdown shows platform info
<option>
  INSTAGRAM - @vabotech_media (15,000 followers) ✓
</option>
```

### New Components
1. **SocialMediaChannels.tsx** - Display partner's social media with stats
2. **socialMediaService.ts** - Backend service for social media ops
3. **subUserService.ts** - Backend service for sub-user management

---

## 🔐 Security & RLS

### Social Media Access Control
```
✅ Admins: View all social media accounts
✅ Partners: View only their own accounts
✅ Partners: Add social media (creates channel automatically)
✅ Admin Partners: Update own accounts
✅ Admin Partners: Delete own accounts
❌ Media Partners (sub-users): Cannot modify (read-only)
```

### Campaign Channel Access Control
```
✅ Partners: Create campaigns via own channels
✅ Partners: View campaigns in own channels
✅ Admins: View all campaigns
✅ Public: View active campaigns (via link)
❌ Others: No access to draft/archived campaigns
```

---

## 📡 API Endpoints & Functions

### RPC Functions (Database)

#### 1. `create_media_partner_sub_user()`
```sql
Parameters:
  - p_email: TEXT (sub-user email)
  - p_full_name: TEXT
  - p_phone: TEXT (optional)
  - p_username: TEXT (optional)

Returns: { user_id, email, error }

Usage:
  SELECT * FROM create_media_partner_sub_user(
    'media@vabotech.com', 
    'Media Manager',
    '+254700111111'
  );
```

#### 2. `admin_add_social_media()`
```sql
Parameters:
  - p_platform: TEXT ('instagram'|'tiktok'|...) 
  - p_handle: TEXT (@handle or username)
  - p_url: TEXT (full URL to account)
  - p_metadata: JSONB (optional platform data)

Returns: { social_media_id, error }

Usage:
  SELECT * FROM admin_add_social_media(
    'tiktok',
    '@newchannel',
    'https://tiktok.com/@newchannel'
  );
```

### TypeScript Services

#### socialMediaService.ts
```typescript
// Fetch partner's active social media
fetchPartnerSocialMedia(): Promise<SocialMediaAccount[]>

// Fetch channels with social media details
fetchPartnerChannels(partnerId): Promise<Channel[]>

// Add new social media account
addSocialMediaAccount(platform, handle, url, metadata)

// Update social media info
updateSocialMediaAccount(id, updates)

// Delete social media account
deleteSocialMediaAccount(id)

// Get stats for a social media account
getSocialMediaStats(id)

// Fetch engagement metrics
fetchEngagementMetrics(id)
```

#### subUserService.ts
```typescript
// Create media_partner sub-user
createMediaPartnerSubUser(email, full_name, phone)

// Fetch all sub-users created by admin
fetchMySubUsers(): Promise<SubUser[]>

// Get details of specific sub-user
getSubUserDetails(userId)

// Update sub-user info
updateSubUser(userId, updates)

// Deactivate sub-user
deactivateSubUser(userId)

// Get sub-users with their social media
fetchSubUsersWithSocialMedia()

// Check if current user is admin_partner
isAdminPartner(): Promise<boolean>

// Get full organization details
getAdminPartnerOrganization()
```

---

## 🚀 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  1. ADMIN PARTNER SETUP                                      │
│  ────────────────────────────────────────────────────────    │
│  • User: maxwellmutonyi@gmail.com (role: admin_partner)     │
│  • Organization: Vabotech (media partner type)              │
│  • Capability: Manage social media & create sub-users       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  2. ADD SOCIAL MEDIA ACCOUNTS                                │
│  ────────────────────────────────────────────────────────    │
│  Platform    Handle           Followers  Verified  Status    │
│  ───────────────────────────────────────────────────────     │
│  Instagram   @vabotech_media  15,000      ✓       active     │
│  TikTok      @vabotech_edu    32,000      ✓       active     │
│  WhatsApp    +254700123456    —           —       active     │
│  YouTube     Vabotech Academy 8,500       ✓       active     │
│                                                              │
│  Each auto-creates a Channel for campaigns                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  3. CREATE CAMPAIGN (Frontend UI)                            │
│  ────────────────────────────────────────────────────────    │
│  Step 1: Fill Form                                          │
│  • Name: "Social Media Campaign"                            │
│  • Program: "Link-First Test Program"                       │
│  • Channel: "INSTAGRAM - @vabotech_media (15K followers) ✓" │
│  • Description: "Promote via verified Instagram account"    │
│  • Target Signups: 5,000                                    │
│                                                              │
│  Step 2: Review & Create                                    │
│  • Validates all fields                                     │
│  • Generates deterministic campaign link                    │
│  • Associates with Instagram social media                   │
│  • Tracks event for analytics                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  4. CAMPAIGN CREATED WITH SOCIAL CHANNEL                     │
│  ────────────────────────────────────────────────────────    │
│  Campaign ID: 1d6af7de-fd50-4c53-bc45-c1a4c3f26324         │
│  Name: Social Media Campaign - Instagram Launch             │
│  Partner: Vabotech (admin_partner managed)                  │
│  Channel: Instagram (@vabotech_media)                       │
│  Program: Link-First Test Program                           │
│  Status: active                                             │
│  Target: 5,000 signups                                      │
│  Duration: Jan 3 - Apr 3, 2026                              │
│                                                              │
│  ✅ Campaign Link: sqooli.app/c/1d6af7de-fd50-...          │
│  ✅ Traceable to: Instagram @vabotech_media               │
│  ✅ Followers: 15,000 verified account                     │
│  ✅ Engagement: 4.5% (tracked in social_media)             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  5. OPTIONAL: CREATE SUB-USERS                               │
│  ────────────────────────────────────────────────────────    │
│  Admin can create media_partner sub-users:                  │
│                                                              │
│  • Email: social_manager@vabotech.com                       │
│  • Role: media_partner (inherited same partner_id)          │
│  • Permissions: Can create campaigns via social channels    │
│  • Parent: maxwellmutonyi@gmail.com (admin_partner)         │
│  • Hierarchy: Sub-users cannot modify social media          │
│                (admin_partner controls)                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Testing Checklist

✅ **Database Level**
- [x] social_media table created with all columns
- [x] channels updated with social_media_id
- [x] RLS policies enforced for social media access
- [x] Test data inserted (4 social media accounts)
- [x] Channels auto-created for each social media
- [x] Campaign created using channel
- [x] Complete relationship verified (User → Partner → Campaign → Channel → Social Media)

✅ **Backend Level**
- [x] socialMediaService.ts created with all functions
- [x] subUserService.ts created with all functions
- [x] RPC functions deployed and working
- [x] Error handling in place for all operations

✅ **Frontend Level**
- [x] CreateCampaign.tsx updated to fetch social_media
- [x] Channel dropdown shows social media with follower count and verification
- [x] SocialMediaChannels.tsx component created
- [x] Social media details displayed in campaign review
- [x] Responsive design (mobile & desktop)

✅ **Integration Level**
- [x] Campaign successfully created with social media channel
- [x] Data flow verified (all relationships intact)
- [x] RLS policies enforced (admin_partner can manage social media)
- [x] Test data shows complete hierarchy

---

## 🎓 How to Use

### For Admin Partners (maxwellmutonyi@gmail.com)

1. **Add Social Media Account**
```typescript
import { addSocialMediaAccount } from 'src/lib/socialMediaService';

const result = await addSocialMediaAccount(
  'instagram',
  '@vabotech_media',
  'https://instagram.com/vabotech_media',
  { bio: 'Educational content creators' }
);
```

2. **Create Campaign**
- Navigate to Campaigns section
- Click "Create Campaign"
- Select social media channel from dropdown
- Fill in campaign details
- Review and create
- Campaign will be promoted via selected social media

3. **Create Sub-User**
```typescript
import { createMediaPartnerSubUser } from 'src/lib/subUserService';

const result = await createMediaPartnerSubUser({
  email: 'media_manager@vabotech.com',
  full_name: 'Media Manager',
  phone: '+254700111111'
});
```

### For Media Partner Sub-Users

- Can create campaigns via partner's social media channels
- Cannot add/modify social media accounts
- Cannot create other sub-users
- Manage promotional content distribution

---

## 📊 Expected Outcomes

After this implementation:

1. **Campaigns are channel-aware**: Each campaign explicitly linked to a specific social media platform
2. **Social media metrics tracked**: Follower counts, engagement rates, verification status stored
3. **Partner hierarchy established**: Admin partners manage organization, media partners execute campaigns
4. **Traceable promotion**: Campaign links trace back to exact social media account used
5. **Scalable system**: One admin partner can manage multiple social accounts and sub-users

---

## ⚙️ Configuration

### Required Database Settings
```sql
-- Already applied via migrations 012-016:
-- • social_media table enabled
-- • RLS policies active
-- • Indexes created
-- • Test data populated
```

### Frontend Configuration
```typescript
// socialMediaService uses Supabase client
import { supabase } from './supabase';

// subUserService uses Supabase auth
const { data: authUser } = await supabase.auth.getUser();
```

### Environment Variables
```
VITE_SUPABASE_URL=https://heqsfgmrosuupxahdtda.supabase.co
VITE_SUPABASE_ANON_KEY=your-key-here
```

---

## 📝 Summary

This implementation transforms the campaign system from generic channels to **social-media-first architecture**:

- ✅ Social media accounts are now explicit campaign channels
- ✅ Partner hierarchy (admin_partner ↔ media_partner) established
- ✅ Engagement metrics and verification tracked
- ✅ Complete data model proven with test campaign
- ✅ RLS policies enforce organization isolation
- ✅ Frontend fully integrated with social media UI
- ✅ Backend services ready for production

**Status**: Ready for staging integration and production deployment 🚀
