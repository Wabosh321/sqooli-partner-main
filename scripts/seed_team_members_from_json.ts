/**
 * PHASE 4: Seed Script - Migrate team members from JSON to Supabase
 * Handles team_members table population with FK validation
 *
 * Usage: npx tsx scripts/seed_team_members_from_json.ts
 */

import { createClient } from "@supabase/supabase-js";

interface TeamMemberRecord {
  id: string;
  campaign_id: string;
  user_id: string;
  role: "creator" | "approver" | "member" | "viewer" | "admin";
  permission_level: "full" | "limited" | "read_only";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SeedResult {
  success: boolean;
  created: number;
  failed: number;
  skipped: number;
  errors: Array<{ record_id: string; error: string }>;
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Validate foreign key references
 */
async function validateForeignKeys(record: TeamMemberRecord): Promise<boolean> {
  // Check if user exists
  const { data: userData, error: userError } = await supabase
    .from("auth.users")
    .select("id")
    .eq("id", record.user_id)
    .single();

  if (userError || !userData) {
    console.warn(`⚠️  User not found: ${record.user_id}`);
    return false;
  }

  // Check if campaign exists
  const { data: campaignData, error: campaignError } = await supabase
    .from("campaigns")
    .select("id")
    .eq("id", record.campaign_id)
    .single();

  if (campaignError || !campaignData) {
    console.warn(`⚠️  Campaign not found: ${record.campaign_id}`);
    return false;
  }

  return true;
}

async function seedTeamMembersFromJson(): Promise<SeedResult> {
  const result: SeedResult = {
    success: true,
    created: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  try {
    // Import team_members.json (placeholder - will be created if needed)
    let teamMembersData: TeamMemberRecord[] = [];

    try {
      const teamMembersModule =
        await import("../src/auth/data/team_members.json");
      teamMembersData =
        teamMembersModule.team_members ||
        teamMembersModule.default.team_members ||
        [];
    } catch (err) {
      console.log(
        "📝 team_members.json not found, creating sample data from campaigns...",
      );
      // Generate sample team members from existing campaigns and users
      const { data: campaigns } = await supabase
        .from("campaigns")
        .select("id, created_by_user_id")
        .limit(5);

      const { data: users } = await supabase
        .from("auth.users")
        .select("id")
        .limit(10);

      if (campaigns && users) {
        const roles: Array<
          "creator" | "approver" | "member" | "viewer" | "admin"
        > = ["creator", "approver", "member", "viewer"];
        const permissions: Array<"full" | "limited" | "read_only"> = [
          "full",
          "limited",
          "read_only",
        ];

        teamMembersData = campaigns.flatMap((campaign, cIdx) =>
          users.slice(0, 3).map((user, uIdx) => ({
            id: `team-member-${cIdx}-${uIdx}`,
            campaign_id: campaign.id,
            user_id: user.id,
            role: roles[uIdx % roles.length],
            permission_level: permissions[uIdx % permissions.length],
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })),
        );
      }
    }

    if (!Array.isArray(teamMembersData)) {
      throw new Error("Team members data is not an array");
    }

    console.log(
      `\n👥 Starting team members migration: ${teamMembersData.length} records to process`,
    );

    // Process in batches of 10
    const batchSize = 10;
    for (let i = 0; i < teamMembersData.length; i += batchSize) {
      const batch = teamMembersData.slice(i, i + batchSize);

      for (const record of batch) {
        try {
          // Validate required fields
          if (!record.campaign_id || !record.user_id || !record.role) {
            result.errors.push({
              record_id: record.id,
              error: "Missing required fields: campaign_id, user_id, or role",
            });
            result.failed++;
            continue;
          }

          // Validate foreign keys
          const fksValid = await validateForeignKeys(record);
          if (!fksValid) {
            result.skipped++;
            continue;
          }

          // Insert team member
          const { error: insertError } = await supabase
            .from("team_members")
            .upsert({
              id: record.id,
              campaign_id: record.campaign_id,
              user_id: record.user_id,
              role: record.role,
              permission_level: record.permission_level || "limited",
              is_active: record.is_active !== false,
              created_at: record.created_at || new Date().toISOString(),
              updated_at: record.updated_at || new Date().toISOString(),
            });

          if (insertError) {
            result.errors.push({
              record_id: record.id,
              error: insertError.message,
            });
            result.failed++;
          } else {
            result.created++;
          }
        } catch (err) {
          result.errors.push({
            record_id: record.id,
            error: err instanceof Error ? err.message : "Unknown error",
          });
          result.failed++;
        }
      }

      // Progress indicator
      const processed = Math.min(i + batchSize, teamMembersData.length);
      console.log(
        `  Progress: ${processed}/${teamMembersData.length} (${Math.round(
          (processed / teamMembersData.length) * 100,
        )}%)`,
      );
    }

    if (result.failed > 0 || result.errors.length > 0) {
      result.success = false;
    }

    console.log("\n📊 Team Members Migration Summary:");
    console.log(`  ✅ Created: ${result.created}`);
    console.log(`  ⏭️  Skipped: ${result.skipped}`);
    console.log(`  ❌ Failed: ${result.failed}`);

    if (result.errors.length > 0) {
      console.log("\n❌ Errors:");
      result.errors.forEach((err) => {
        console.log(`  - ${err.record_id}: ${err.error}`);
      });
    }

    return result;
  } catch (err) {
    console.error("Fatal error during team members migration:", err);
    return {
      ...result,
      success: false,
      errors: [
        {
          record_id: "all",
          error: err instanceof Error ? err.message : "Unknown error",
        },
      ],
    };
  }
}

// Execute seed script
seedTeamMembersFromJson()
  .then((result) => {
    process.exit(result.success ? 0 : 1);
  })
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
