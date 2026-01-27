# DATABASE INTEGRITY AUDIT – DETAILED FINDINGS & FILE REFERENCES

## CRITICAL FINDINGS WITH EXACT LOCATIONS

---

## FINDING #1: Plaintext PIN Storage (CRITICAL)

### Problem

The `wallets.pin` column stores wallet PINs as plaintext text. This is a critical security vulnerability that violates NIST guidelines and exposes all user accounts to compromise if the database is breached.

### Affected Components

#### Database Schema

- **Table:** `wallets`
- **Column:** `pin (text)` – Currently plaintext
- **Rows affected:** All partner wallets with set PINs

#### Frontend Components Using PIN

| File                                         | Line     | Operation               | Issue                          |
| -------------------------------------------- | -------- | ----------------------- | ------------------------------ |
| `src/components/common/WalletSetUp.tsx`      | ~100-150 | Captures PIN from input | ⚠️ Sends plaintext to Supabase |
| `src/components/common/WalletEditDialog.tsx` | ~200-300 | Updates PIN             | ⚠️ Sends plaintext to Supabase |
| `src/components/common/WithdrawalDialog.tsx` | ~300-400 | Uses PIN for withdrawal | ⚠️ Plaintext comparison        |
| `src/components/common/PinVerification.tsx`  | ~20-60   | Verifies PIN            | ⚠️ Plaintext string comparison |

#### Code Samples

**WalletSetUp.tsx (Problematic PIN Capture)**

```typescript
// Line ~120-140
const [pin, setPin] = useState("");
const [confirmPin, setConfirmPin] = useState("");

// Sending plaintext to database
const { data, error } = await supabase.from("wallets").insert({
  partner_id: partnerId,
  pin: pin, // ⚠️ PLAINTEXT - NO HASHING
  withdrawal_method: withdrawalMethod,
  // ...
});
```

**PinVerification.tsx (Plaintext Verification)**

```typescript
// Line ~80-100
const pinInput = pinDigits.join("");
if (pinInput !== correctPin) {
  // ⚠️ Direct string comparison
  setError("Invalid PIN");
  return;
}
// This assumes correctPin is plaintext from DB
```

### Remediation Steps

#### Step 1: Create Migration for Hash Column

```sql
-- New migration file: add_pin_hash_column.sql
ALTER TABLE wallets ADD COLUMN pin_hash TEXT;
-- Keep old pin column temporarily for backward compatibility

-- Create index on pin_hash for faster lookup (if needed)
CREATE INDEX idx_wallets_pin_hash ON wallets(pin_hash) WHERE pin_hash IS NOT NULL;
```

#### Step 2: Update WalletSetUp.tsx

```typescript
import { hashPin, verifyPin } from "../lib/pinHash"; // New utility

const handleCreateWallet = async (payload: any) => {
  // Hash PIN before sending
  const pinHash = await hashPin(payload.pin);

  const { data, error } = await supabase.from("wallets").insert({
    ...payload,
    pin_hash: pinHash, // ✅ Hash stored
    pin: null, // ❌ Don't send plaintext
  });
};
```

#### Step 3: Create PIN Hash Utility

```typescript
// src/lib/pinHash.ts (NEW FILE)
import * as argon2 from "argon2-browser";

export async function hashPin(pin: string): Promise<string> {
  const encoded = new TextEncoder().encode(pin);
  const hash = await argon2.hash({
    pass: encoded,
    salt: crypto.getRandomValues(new Uint8Array(16)),
    type: argon2.ArgonType.Argon2i,
    time: 4,
    mem: 256,
    parallelism: 1,
  });
  return hash.encoded;
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return argon2.verify({
    pass: new TextEncoder().encode(pin),
    encoded: hash,
  });
}
```

#### Step 4: Update WithdrawalDialog.tsx

```typescript
import { verifyPin } from "../lib/pinHash";

const handleWithdraw = async () => {
  // Fetch wallet (already has pin_hash)
  const { data: wallet } = await supabase
    .from("wallets")
    .select("pin_hash")
    .eq("id", walletId)
    .single();

  // Verify PIN against hash
  const isValid = await verifyPin(enteredPin, wallet.pin_hash);
  if (!isValid) {
    setError("Invalid PIN");
    return;
  }

  // Proceed with withdrawal
};
```

#### Step 5: Update PinVerification.tsx

```typescript
// Replace plaintext verification
import { verifyPin } from "../lib/pinHash";

// OLD (REMOVE):
// if (pinInput !== correctPin) { ... }

// NEW:
const isValid = await verifyPin(pinInput, correctPin); // assumes correctPin is hash
if (!isValid) {
  setError("Invalid PIN");
  return;
}
```

#### Step 6: Data Migration (One-Time)

```typescript
// src/migrations/migratePINToHash.ts (RUN ONCE)
import { supabase } from "../lib/supabase";
import { hashPin } from "../lib/pinHash";

export async function migratePINsToHash() {
  const { data: wallets } = await supabase
    .from("wallets")
    .select("id, pin")
    .not("pin", "is", null);

  for (const wallet of wallets || []) {
    if (wallet.pin) {
      const pinHash = await hashPin(wallet.pin);
      await supabase
        .from("wallets")
        .update({ pin_hash: pinHash })
        .eq("id", wallet.id);
    }
  }

  console.log("PIN migration complete");
}

// Call once after deployment:
// await migratePINsToHash();
```

### Verification Checklist

- [ ] PIN hashing library selected and installed (argon2, bcrypt, or scrypt)
- [ ] Hash column created in production database
- [ ] PIN hash utility function implemented and tested
- [ ] All PIN input components updated to hash before sending
- [ ] All PIN verification components updated to use verifyPin()
- [ ] Data migration script created and executed
- [ ] Old plaintext PIN column dropped (after verification period)
- [ ] Tests added for PIN verification flow

---

## FINDING #2: database.types.ts Out of Sync (CRITICAL)

### Problem

The generated TypeScript types file is missing columns that were added in recent database migrations. This causes type mismatches when accessing these fields, leading to potential runtime errors.

### Missing Columns

#### users Table

**File:** `src/types/database.types.ts`  
**Lines:** ~20-40 (in Row type definition)

**Columns missing from types:**

```typescript
// Actual DB schema:
users.partner_id (uuid, nullable)
users.parent_user_id (uuid, nullable)
users.is_sub_user (boolean, default false)

// Current types only has:
Row: {
  id: string
  auth_id: string
  convex_id: string | null
  email: string
  full_name: string | null
  phone: string | null
  username: string | null
  role: string | null
  created_at: string
  updated_at: string
  // ❌ MISSING: partner_id, parent_user_id, is_sub_user
}
```

#### partners Table

**File:** `src/types/database.types.ts`  
**Lines:** ~50-100 (in Row type definition)

**Columns missing from types:**

```typescript
// Actual DB schema has 42 columns but types has ~15
// Missing onboarding tracking:
wallet_setup_completed(boolean);
campaign_created(boolean);
users_added(boolean);
two_factor_setup_completed(boolean);
social_media_added(boolean);
social_media_completed(boolean);
onboarding_completed(boolean);
onboarding_completed_at(timestamp);
wallet_setup_completed_at(timestamp);
campaign_created_at(timestamp);
users_added_at(timestamp);
two_factor_setup_completed_at(timestamp);
social_media_completed_at(timestamp);
two_factor_phone(text);
two_factor_phone_verified(boolean);
two_factor_email(text);
two_factor_email_verified(boolean);
social_media_links(jsonb);
is_first_login(boolean);
onboarding_steps_skipped(jsonb);
onboarding_metadata(jsonb);
```

### Affected Code

#### Components Using partner_id (Type Error)

| File                                      | Line | Usage                 | Error                                        |
| ----------------------------------------- | ---- | --------------------- | -------------------------------------------- |
| `src/sections/UserSection.tsx`            | ~50  | `partner?._id` lookup | ⚠️ partner type may not have \_id field      |
| `src/utils/verifyAuthData.ts`             | ~110 | partners update       | ⚠️ Type mismatch on users.partner_id         |
| `src/components/common/AddUserDialog.tsx` | ~300 | user creation         | ⚠️ partner_id assignment may fail type check |

#### Components Using Onboarding Fields (Type Error)

| File                                | Line | Usage              | Error                                        |
| ----------------------------------- | ---- | ------------------ | -------------------------------------------- |
| `src/context/AuthContext.tsx`       | ~50  | Onboarding state   | ⚠️ Types don't include onboarding\_\* fields |
| `src/sections/DashboardSection.tsx` | ~150 | Onboarding display | ⚠️ Types missing                             |
| `src/components/common/Profile.tsx` | ~80  | Onboarding UI      | ⚠️ Types missing                             |

### Remediation

#### Command to Regenerate Types

```bash
# In project root directory
npx supabase gen types typescript --schema public > src/types/database.types.ts
```

#### Verification Steps

```bash
# 1. Generate new types
npx supabase gen types typescript --schema public > src/types/database.types.ts

# 2. Check for TypeScript errors
npx tsc --noEmit

# 3. Update any files with type errors that emerge
# (likely from using newly-available fields)

# 4. Commit changes
git add src/types/database.types.ts
git commit -m "chore: regenerate database types from current schema"
```

#### Expected Changes in Generated File

```typescript
// OLD (current):
Row: {
  id: string;
  auth_id: string;
  // ... 11 fields total
}

// NEW (after regeneration):
Row: {
  id: string;
  auth_id: string;
  convex_id: string | null;
  email: string;
  full_name: string | null;
  phone: string | null;
  username: string | null;
  role: string | null;
  created_at: string;
  updated_at: string;
  partner_id: string | null; // ✅ NEW
  parent_user_id: string | null; // ✅ NEW
  is_sub_user: boolean; // ✅ NEW
}
```

### Verification Checklist

- [ ] Run `npx supabase gen types...` command
- [ ] Verify database.types.ts updated with 42+ columns for partners
- [ ] Verify users type includes partner_id, parent_user_id, is_sub_user
- [ ] Run `npx tsc --noEmit` to check for new type errors
- [ ] Fix any type errors in components that now have access to new fields
- [ ] Test that onboarding tracking fields are now properly typed
- [ ] Commit updated types file

---

## FINDING #3: Missing campaigns.link_url Handling (HIGH)

### Problem

The database schema includes a `campaigns.link_url` column for campaign affiliate links, but the frontend UI doesn't capture or display this field, resulting in data loss.

### Database Schema

```sql
campaigns TABLE:
  link_url (text, nullable)
  -- Purpose: Store unique campaign affiliate link
```

### Missing UI Implementation

#### CreateCampaignWizard.tsx

**File:** `src/components/common/CreateCampaignWizard.tsx`  
**Missing:** Link URL input field

**Current flow (lines ~150-250):**

```typescript
// Step 2 - Campaign Details (no link_url input)
const [wizardState, setWizardState] = useState<WizardState>({
  program_id: "",
  channel_id: "",
  subchannel: "",
  name: "",
  description: "",
  target_signups: 0,
  // ❌ MISSING: link_url: ""
});

// Form fields captured:
- Program selector
- Channel selector
- Subchannel input
- Campaign name
- Description
- Target signups
// ❌ NO LINK URL INPUT

// Submit (lines ~240-260):
const campaignPayload = {
  partner_id: partnerId,
  program_id: wizardState.program_id,
  channel_id: wizardState.channel_id,
  name: wizardState.name,
  description: wizardState.description,
  target_signups: wizardState.target_signups,
  // ❌ MISSING: link_url: wizardState.link_url
};
```

#### CampaignDetails.tsx

**File:** `src/components/common/CampaignDetails.tsx`  
**Missing:** Link URL display field

**Current display (lines ~200-300):**

```typescript
// Displays campaign details but no link_url
return (
  <div className="space-y-4">
    <DetailRow label="Name" value={campaign?.name} />
    <DetailRow label="Description" value={campaign?.description} />
    <DetailRow label="Status" value={campaign?.status} />
    <DetailRow label="Target Signups" value={campaign?.target_signups} />
    <DetailRow label="Start Date" value={campaign?.start_date} />
    <DetailRow label="End Date" value={campaign?.end_date} />
    // ❌ MISSING:{" "}
    <DetailRow label="Campaign Link" value={campaign?.link_url} />
  </div>
);
```

#### campaignsCRUD.ts

**File:** `src/lib/campaignsCRUD.ts`  
**Issue:** Over-fetching with `.select('*')` but should explicitly include link_url

```typescript
// Line ~20-30:
export async function getCampaign(id: string) {
  return getById("campaigns", id); // Uses genericHelpers
  // Which does: .select('*')  ✅ OK but inefficient
}

// Should be:
export async function getCampaign(id: string) {
  try {
    const { data, error } = await supabase
      .from("campaigns")
      .select(
        `
        id, partner_id, program_id, channel_id,
        name, description, status, target_signups,
        start_date, end_date, duration_start, duration_end,
        target_amount, current_amount, commission_rate,
        subchannel, link_url, metadata,
        created_at, updated_at
      `
      )
      .eq("id", id)
      .single();
    return { data, error };
  } catch (error) {
    return { data: null, error: error as any };
  }
}
```

### Remediation

#### Step 1: Update CreateCampaignWizard.tsx

Add link_url to wizard state:

```typescript
// Line ~30-40, update WizardState interface:
interface WizardState {
  program_id: string | "";
  channel_id: string | "";
  subchannel: string;
  name: string;
  description: string;
  target_signups: number;
  link_url: string; // ✅ ADD THIS
}

// Line ~45-50, initialize state:
const [wizardState, setWizardState] = useState<WizardState>({
  program_id: "",
  channel_id: "",
  subchannel: "",
  name: "",
  description: "",
  target_signups: 0,
  link_url: "", // ✅ ADD THIS
});
```

Add UI field for link URL (after description field):

```typescript
// In render JSX, around line ~350-400:
<div className="space-y-4">
  <FormField
    label="Campaign Name"
    value={wizardState.name}
    onChange={(name) => setWizardState({ ...wizardState, name })}
  />
  <FormField
    label="Description"
    value={wizardState.description}
    onChange={(description) => setWizardState({ ...wizardState, description })}
  />
  {/* ✅ ADD LINK URL FIELD */}
  <FormField
    label="Campaign Link (Affiliate URL)"
    value={wizardState.link_url}
    onChange={(link_url) => setWizardState({ ...wizardState, link_url })}
    placeholder="https://example.com/campaign/abc123"
    type="url"
  />
  <FormField
    label="Target Signups"
    value={wizardState.target_signups}
    onChange={(target_signups) =>
      setWizardState({
        ...wizardState,
        target_signups: parseInt(target_signups),
      })
    }
    type="number"
  />
</div>
```

Update submit payload:

```typescript
// Line ~250-270:
const campaignPayload = {
  partner_id: partnerId,
  program_id: wizardState.program_id,
  channel_id: wizardState.channel_id,
  name: wizardState.name,
  description: wizardState.description,
  target_signups: wizardState.target_signups,
  link_url: wizardState.link_url, // ✅ ADD THIS
  // ... rest of payload
};
```

#### Step 2: Update CampaignDetails.tsx

Add link_url to display (around line ~250):

```typescript
// In the details JSX, add:
{
  campaign?.link_url && (
    <DetailRow
      label="Campaign Link"
      value={
        <a href={campaign.link_url} target="_blank" rel="noopener noreferrer">
          {campaign.link_url}
        </a>
      }
    />
  );
}

// Or as a copiable field:
<DetailRow label="Campaign Link" value={campaign?.link_url} copyable={true} />;
```

#### Step 3: Update campaignsCRUD.ts

Optimize column selection (optional but recommended):

```typescript
// Replace genericHelpers call with explicit select
export async function getCampaign(id: string): Promise<SupabaseResponse<any>> {
  try {
    const { data, error } = await supabase
      .from("campaigns")
      .select(
        `
        id, partner_id, program_id, channel_id,
        name, description, status, target_signups,
        start_date, end_date, duration_start, duration_end,
        target_amount, current_amount, commission_rate,
        subchannel, link_url, metadata,
        created_at, updated_at
      `
      )
      .eq("id", id)
      .single();
    return { data, error };
  } catch (error) {
    return { data: null, error: error as any };
  }
}
```

### Verification Checklist

- [ ] Add link_url to WizardState interface
- [ ] Initialize link_url in state
- [ ] Add URL input field in CreateCampaignWizard form
- [ ] Update campaign payload to include link_url
- [ ] Test campaign creation with link URL
- [ ] Update CampaignDetails to display link_url
- [ ] Make link clickable or copyable
- [ ] Update campaignsCRUD.ts to explicitly select link_url
- [ ] Test that link_url persists after campaign creation

---

## FINDING #4: Nullable campaigns.channel_id Without Validation (HIGH)

### Problem

The `campaigns.channel_id` column is nullable, but the UI allows creating campaigns with social media selections without enforcing a channel. This creates incomplete data that causes issues downstream.

### Database Schema Issue

```sql
campaigns.channel_id (uuid, nullable, FK → channels.id)
-- Actual constraint: No NOT NULL, so NULL is technically allowed
-- Business logic: If campaign has subchannel, it SHOULD have channel_id
```

### Affected Code

#### CreateCampaignWizard.tsx

**File:** `src/components/common/CreateCampaignWizard.tsx`  
**Lines:** ~200-250 (validation missing)

**Current logic:**

```typescript
// Step 2 - Channel/Subchannel selection (lines ~150-180)
const [wizardState, setWizardState] = useState({
  // ...
  channel_id: "", // Selected channel UUID
  subchannel: "", // Selected subchannel string
});

// Form rendering (lines ~280-320):
{
  step === 1 && (
    <div>
      <label>Select Channel</label>
      <ChannelSelector
        value={wizardState.channel_id}
        onChange={(id) => setWizardState({ ...wizardState, channel_id: id })}
      />
      <label>Select Subchannel</label>
      <input
        value={wizardState.subchannel}
        onChange={(e) =>
          setWizardState({ ...wizardState, subchannel: e.target.value })
        }
      />
    </div>
  );
}

// Submit validation (lines ~420-450):
const handleSubmit = async () => {
  if (!wizardState.name) {
    throw new Error("Campaign name required");
  }
  if (!wizardState.program_id) {
    throw new Error("Program required");
  }
  // ❌ NO VALIDATION: if subchannel is set, channel_id must be set

  // Creates campaign payload:
  const payload = {
    partner_id: partnerId,
    program_id: wizardState.program_id,
    channel_id: wizardState.channel_id, // Could be "" or undefined
    subchannel: wizardState.subchannel,
    // ... rest
  };

  // Supabase allows this because channel_id is nullable
  // Result: Campaign created with subchannel but no channel
};
```

#### Downstream Issue

**File:** `src/components/common/CampaignDetails.tsx`  
**Lines:** ~150-200 (assumes channel_id exists)

```typescript
// Display channel info (lines ~180-190):
const renderChannelInfo = () => {
  if (!campaign?.channel_id) {
    return <span className="text-muted">No channel selected</span>;
  }

  // Fetch channel data (assumes it exists)
  const channel = channels.find((c) => c.id === campaign.channel_id);
  return channel?.name || "Unknown channel";
};

// If campaign has subchannel but no channel_id, this shows "No channel selected"
// but user selected a subchannel, which is confusing
```

### Remediation

#### Step 1: Add Validation in CreateCampaignWizard.tsx

```typescript
// Add validation function (new):
const validateChannelSelection = (): string | null => {
  // If subchannel is selected, channel_id must be set
  if (wizardState.subchannel && !wizardState.channel_id) {
    return "Channel is required when selecting a subchannel";
  }

  // If channel_id is selected, subchannel must be set
  if (wizardState.channel_id && !wizardState.subchannel) {
    return "Subchannel is required when selecting a channel";
  }

  return null;
};

// Update submit handler (line ~420):
const handleSubmit = async () => {
  // Existing validations:
  if (!wizardState.name) {
    throw new Error("Campaign name required");
  }
  if (!wizardState.program_id) {
    throw new Error("Program required");
  }

  // ✅ ADD THIS:
  const channelError = validateChannelSelection();
  if (channelError) {
    setError(channelError);
    return;
  }

  // Proceed with submission
  const payload = {
    partner_id: partnerId,
    program_id: wizardState.program_id,
    channel_id: wizardState.channel_id || null, // Explicit null OK now
    subchannel: wizardState.subchannel || null,
    // ...
  };

  // Submit...
};
```

#### Step 2: Add Database Constraint (Migration)

Create a CHECK constraint to enforce business logic at DB level:

```sql
-- NEW MIGRATION FILE: add_campaign_channel_validation.sql

-- Add CHECK constraint to enforce:
-- If subchannel is provided, channel_id must also be provided
ALTER TABLE campaigns ADD CONSTRAINT campaign_channel_subchannel_check
CHECK (
  (subchannel IS NULL AND channel_id IS NULL)  -- Both empty
  OR
  (subchannel IS NOT NULL AND channel_id IS NOT NULL)  -- Both set
);

-- This prevents:
-- subchannel='TikTok' with channel_id=NULL
-- subchannel=NULL with channel_id='abc-def-...'

-- Add INDEX for channel_id lookups:
CREATE INDEX IF NOT EXISTS idx_campaigns_channel_id ON campaigns(channel_id);
```

#### Step 3: Update CampaignDetails.tsx

Handle incomplete channel data gracefully:

```typescript
// Line ~180-200:
const renderChannelInfo = () => {
  if (!campaign?.channel_id) {
    if (campaign?.subchannel) {
      // Inconsistent state - should not happen with constraint
      return (
        <div className="text-warning">
          <AlertCircle /> Subchannel set but no channel
        </div>
      );
    }
    return <span className="text-muted">No channel selected</span>;
  }

  // channel_id exists, fetch channel
  const channel = channels.find((c) => c.id === campaign.channel_id);
  return (
    <div>
      <span className="font-semibold">{channel?.name || "Unknown"}</span>
      {campaign?.subchannel && (
        <span className="text-muted"> → {campaign.subchannel}</span>
      )}
    </div>
  );
};
```

### Verification Checklist

- [ ] Add validateChannelSelection() function to CreateCampaignWizard
- [ ] Update submit handler to call validation
- [ ] Display error message if validation fails
- [ ] Create migration with CHECK constraint
- [ ] Apply migration to database
- [ ] Test: Try creating campaign with subchannel but no channel (should fail)
- [ ] Test: Try creating campaign with channel but no subchannel (should fail)
- [ ] Test: Creating campaign with both set (should succeed)
- [ ] Update CampaignDetails to handle edge cases
- [ ] Verify existing campaigns with inconsistent channel/subchannel (data cleanup)

---

## FINDING #5: Incomplete Wallet Setup Validation (HIGH)

### Problem

The wallet setup dialog allows creating wallets without validating that a complete payment method is selected. This creates wallets that can't process withdrawals, causing user frustration.

### Database Schema

```sql
wallets TABLE:
  withdrawal_method (text) -- 'mpesa', 'bank', 'paybill'
  account_number (text, nullable) -- For bank transfers
  paybill_number (text, nullable) -- For M-Pesa paybill
  bank_name (text, nullable) -- Bank details
  account_holder (text, nullable) -- Account owner name
```

### Missing Validation

#### WalletSetUp.tsx

**File:** `src/components/common/WalletSetUp.tsx`  
**Lines:** ~300-400 (submit handler)

**Current issue:**

```typescript
const handleCreateWallet = async () => {
  // Only validates:
  if (!withdrawalMethod) {
    setError("Select withdrawal method");
    return;
  }

  // ❌ MISSING: Validate method-specific fields
  // If mpesa is selected, PIN is validated
  // But account details are NOT validated

  const payload = {
    partner_id: partnerId,
    user_id: userId,
    withdrawal_method: withdrawalMethod,
    account_number: accountNumber, // Could be empty
    paybill_number: paybillNumber, // Could be empty
    bank_name: bankName, // Could be empty
    pin: pinHash,
    // ...
  };

  // Submits even if no account details provided
  const { error } = await supabase.from("wallets").insert(payload);
};
```

#### WalletEditDialog.tsx

**File:** `src/components/common/WalletEditDialog.tsx`  
**Lines:** ~150-250 (same issue)

```typescript
// Allows updating withdrawal method without validating new method details
const handleUpdateWallet = async () => {
  // If switching from bank to paybill, doesn't validate paybill_number exists

  const payload = {
    // withdrawal_method updated
    // But related fields may be empty
  };
};
```

### Affected User Flow

**Scenario 1: User selects "Bank Transfer"**

```
1. User selects Bank Transfer method
2. Form should show: bank_name, account_number, account_holder
3. ❌ Validation missing: User can submit without filling these
4. Wallet created with withdrawal_method='bank' but no account_number
5. When user tries to withdraw: Error "No bank account configured"
6. User has to re-edit wallet
```

**Scenario 2: User selects "M-Pesa Paybill"**

```
1. User selects Paybill method
2. Form should show: paybill_number, business_type
3. ❌ Validation missing: User can submit without paybill_number
4. Wallet created with withdrawal_method='paybill' but no paybill_number
5. Withdrawal fails at processing
```

### Remediation

#### Step 1: Create Wallet Validation Utility

```typescript
// src/lib/walletValidation.ts (NEW FILE)

export interface WalletValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateWalletPaymentMethod(
  withdrawalMethod: "mpesa" | "bank" | "paybill",
  accountNumber?: string,
  paybillNumber?: string,
  bankName?: string,
  accountHolder?: string
): WalletValidationResult {
  const errors: Record<string, string> = {};

  switch (withdrawalMethod) {
    case "bank":
      if (!bankName?.trim()) {
        errors.bank_name = "Bank name is required";
      }
      if (!accountNumber?.trim()) {
        errors.account_number = "Account number is required";
      }
      if (!accountHolder?.trim()) {
        errors.account_holder = "Account holder name is required";
      }
      // Optional validation: check account number format
      if (accountNumber && !/^\d+$/.test(accountNumber)) {
        errors.account_number = "Account number must contain only digits";
      }
      break;

    case "paybill":
      if (!paybillNumber?.trim()) {
        errors.paybill_number = "Paybill number is required";
      }
      // M-Pesa paybill format validation
      if (paybillNumber && !/^\d{5,7}$/.test(paybillNumber)) {
        errors.paybill_number = "Paybill number must be 5-7 digits";
      }
      break;

    case "mpesa":
      // M-Pesa requires PIN (validated elsewhere)
      // No additional account details needed
      break;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
```

#### Step 2: Update WalletSetUp.tsx

```typescript
import { validateWalletPaymentMethod } from "../lib/walletValidation";

const handleCreateWallet = async () => {
  // Existing PIN validation
  if (!pin) {
    setError("PIN is required");
    return;
  }

  // ✅ ADD PAYMENT METHOD VALIDATION
  const validation = validateWalletPaymentMethod(
    withdrawalMethod as "mpesa" | "bank" | "paybill",
    accountNumber,
    paybillNumber,
    bankName,
    accountHolder
  );

  if (!validation.isValid) {
    const errorList = Object.entries(validation.errors)
      .map(([field, message]) => message)
      .join("\n");
    setError(`Validation errors:\n${errorList}`);
    return;
  }

  // Proceed with wallet creation
  const pinHash = await hashPin(pin);
  const payload = {
    partner_id: partnerId,
    user_id: userId,
    withdrawal_method: withdrawalMethod,
    account_number: accountNumber || null,
    paybill_number: paybillNumber || null,
    bank_name: bankName || null,
    account_holder: accountHolder || null,
    pin_hash: pinHash,
    status: "active",
  };

  const { error } = await supabase.from("wallets").insert(payload).select();

  if (error) {
    setError("Failed to create wallet: " + error.message);
    return;
  }

  onWalletCreated?.();
  onClose();
};
```

#### Step 3: Update WalletEditDialog.tsx

```typescript
const handleUpdateWallet = async () => {
  // ✅ ADD PAYMENT METHOD VALIDATION
  const validation = validateWalletPaymentMethod(
    withdrawalMethod as "mpesa" | "bank" | "paybill",
    accountNumber,
    paybillNumber,
    bankName,
    accountHolder
  );

  if (!validation.isValid) {
    const errorList = Object.entries(validation.errors)
      .map(([field, message]) => message)
      .join("\n");
    setError(`Validation errors:\n${errorList}`);
    return;
  }

  // If PIN changed, hash it
  let pinHash = wallet.pin_hash;
  if (pin && pin !== "****") {
    pinHash = await hashPin(pin);
  }

  const payload = {
    withdrawal_method: withdrawalMethod,
    account_number: accountNumber || null,
    paybill_number: paybillNumber || null,
    bank_name: bankName || null,
    account_holder: accountHolder || null,
    ...(pinHash && { pin_hash: pinHash }),
  };

  const { error } = await supabase
    .from("wallets")
    .update(payload)
    .eq("id", wallet.id);

  if (error) {
    setError("Failed to update wallet: " + error.message);
    return;
  }

  onClose();
};
```

#### Step 4: Add Database Constraint

```sql
-- NEW MIGRATION: add_wallet_payment_method_validation.sql

ALTER TABLE wallets ADD CONSTRAINT wallet_payment_method_check
CHECK (
  (withdrawal_method = 'bank' AND bank_name IS NOT NULL AND account_number IS NOT NULL)
  OR
  (withdrawal_method = 'paybill' AND paybill_number IS NOT NULL)
  OR
  (withdrawal_method = 'mpesa' AND pin IS NOT NULL)
);

-- This prevents:
-- withdrawal_method='bank' without account_number
-- withdrawal_method='paybill' without paybill_number
-- withdrawal_method='mpesa' without PIN
```

### Verification Checklist

- [ ] Create walletValidation.ts utility
- [ ] Add validateWalletPaymentMethod() function
- [ ] Update WalletSetUp.tsx to call validation before submit
- [ ] Update WalletEditDialog.tsx to call validation
- [ ] Display detailed error messages for each missing field
- [ ] Test: Try creating bank wallet without account number (should fail)
- [ ] Test: Try creating paybill wallet without paybill number (should fail)
- [ ] Test: Try creating M-Pesa wallet without PIN (should fail)
- [ ] Test: Create complete wallet with all required fields (should succeed)
- [ ] Create migration with CHECK constraint
- [ ] Apply migration to database
- [ ] Audit existing wallets for incomplete payment methods

---

## Summary Table: All Findings by Severity

| #   | Finding                           | Severity    | File(s)                                     | Line(s)  | Status                                      |
| --- | --------------------------------- | ----------- | ------------------------------------------- | -------- | ------------------------------------------- |
| 1   | Plaintext PIN Storage             | 🔴 CRITICAL | wallets table, WalletSetUp, PinVerification | Multiple | Requires DB migration + code updates        |
| 2   | Type System Out of Sync           | 🔴 CRITICAL | database.types.ts                           | 20-100   | Requires regen: `npx supabase gen types...` |
| 3   | Missing campaigns.link_url        | 🟠 HIGH     | CreateCampaignWizard, CampaignDetails       | 100-400  | Requires UI + CRUD updates                  |
| 4   | Nullable channel_id No Validation | 🟠 HIGH     | CreateCampaignWizard                        | 200-450  | Requires validation + constraint            |
| 5   | Incomplete Wallet Validation      | 🟠 HIGH     | WalletSetUp, WalletEditDialog               | 150-400  | Requires validation utility + constraint    |
| 6   | Missing Permission Guards         | 🟡 MEDIUM   | CampaignDetails, WalletEditDialog           | Multiple | Requires adding usePartnerAccess checks     |
| 7   | Sub-User Hierarchy Unverified     | 🟡 MEDIUM   | subUserService.ts, RLS policies             | Various  | Requires testing + verification             |
| 8   | Over-Fetching Queries             | 🟡 MEDIUM   | Dashboard, Grid components                  | Multiple | Performance optimization                    |
| 9   | Convex Legacy Code                | 🔵 LOW      | All tables (convex_id)                      | Multiple | Deprecation - can remove in v2.0            |
| 10  | Edge Function Verification        | 🔵 LOW      | processTransaction, createPartner, login    | Various  | Operational verification                    |
| 11  | Orphaned Transactions Risk        | 🔵 LOW      | transactions.campaign_id                    | Variable | Data quality, optional NOT NULL             |

---

**Report compiled:** January 4, 2026  
**Audit completion:** Phase 5 Complete  
**Next action:** Implement Critical fixes immediately
