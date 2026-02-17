/**
 * PHASE 4: Seed Script - Migrate user activity from JSON to Supabase
 * Handles user_activity_log table population with immutable audit trail
 *
 * Usage: npx tsx scripts/seed_user_activity_from_json.ts
 */

import { createClient } from "@supabase/supabase-js";

interface UserActivityRecord {
  id: string;
  partner_id: string;
  user_id: string;
  action: string;
  action_type?: string;
  entity_type?: string;
  entity_id?: string;
  details?: string;
  before_state?: Record<string, any>;
  after_state?: Record<string, any>;
  summary?: string;
  timestamp: string;
  created_at?: string;
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
async function validateForeignKeys(
  record: UserActivityRecord,
): Promise<boolean> {
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

  // Check if partner exists
  const { data: partnerData, error: partnerError } = await supabase
    .from("partners")
    .select("id")
    .eq("id", record.partner_id)
    .single();

  if (partnerError || !partnerData) {
    console.warn(`⚠️  Partner not found: ${record.partner_id}`);
    return false;
  }

  // Optional: Validate entity_id reference if entity_type is known
  if (record.entity_type && record.entity_id) {
    const { data: entityData, error: entityError } = await supabase
      .from(record.entity_type)
      .select("id")
      .eq("id", record.entity_id)
      .single();

    if (entityError || !entityData) {
      console.warn(
        `⚠️  Entity not found: ${record.entity_type}(${record.entity_id})`,
      );
      // Don't fail here - entity might not exist yet
    }
  }

  return true;
}

async function seedUserActivityFromJson(): Promise<SeedResult> {
  const result: SeedResult = {
    success: true,
    created: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  try {
    // Import user_activity.json
    const activityModule = await import("../src/auth/data/user_activity.json");
    const activityData: any[] =
      activityModule.user_activities ||
      activityModule.default.user_activities ||
      [];

    if (!Array.isArray(activityData)) {
      throw new Error("User activity data is not an array");
    }

    console.log(
      `\n📋 Starting user activity migration: ${activityData.length} records to process`,
    );

    // Get a sample partner_id if not in data
    let defaultPartnerId: string | null = null;
    const { data: partnerData } = await supabase
      .from("partners")
      .select("id")
      .limit(1);
    if (partnerData && partnerData.length > 0) {
      defaultPartnerId = partnerData[0].id;
    }

    if (!defaultPartnerId) {
      console.error(
        "❌ No partners found in database. Cannot seed activity without partner_id.",
      );
      return {
        ...result,
        success: false,
        errors: [{ record_id: "all", error: "No partners found in database" }],
      };
    }

    // Process in batches of 10
    const batchSize = 10;
    for (let i = 0; i < activityData.length; i += batchSize) {
      const batch = activityData.slice(i, i + batchSize);

      for (const record of batch) {
        try {
          // Validate required fields
          if (!record.user_id || !record.action) {
            result.errors.push({
              record_id: record.id,
              error: "Missing required fields: user_id or action",
            });
            result.failed++;
            continue;
          }

          // Map parent_user_id to partner_id if available, otherwise use default
          const partnerId = record.parent_user_id || defaultPartnerId;

          // Validate foreign keys
          const fksValid = await validateForeignKeys({
            id: record.id,
            partner_id: partnerId,
            user_id: record.user_id,
            action: record.action,
            entity_type: record.entity_type,
            entity_id: record.entity_id,
            timestamp: record.timestamp,
          });

          if (!fksValid) {
            result.skipped++;
            continue;
          }

          // Map action_type to entity_type if not provided
          const entityType = record.entity_type || record.action_type;

          // Insert activity record via RPC function to ensure logging
          const { data, error: insertError } = await supabase.rpc(
            "log_activity",
            {
              p_partner_id: partnerId,
              p_user_id: record.user_id,
              p_action: record.action,
              p_entity_type: entityType || "unknown",
              p_entity_id: record.entity_id,
              p_before_state: record.before_state,
              p_after_state: record.after_state,
              p_summary: record.summary || record.details,
            },
          );

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
      const processed = Math.min(i + batchSize, activityData.length);
      console.log(
        `  Progress: ${processed}/${activityData.length} (${Math.round(
          (processed / activityData.length) * 100,
        )}%)`,
      );
    }

    if (result.failed > 0 || result.errors.length > 0) {
      result.success = false;
    }

    console.log("\n📊 User Activity Migration Summary:");
    console.log(`  ✅ Created: ${result.created}`);
    console.log(`  ⏭️  Skipped: ${result.skipped}`);
    console.log(`  ❌ Failed: ${result.failed}`);

    if (result.errors.length > 0) {
      console.log("\n❌ Errors (showing first 10):");
      result.errors.slice(0, 10).forEach((err) => {
        console.log(`  - ${err.record_id}: ${err.error}`);
      });
    }

    return result;
  } catch (err) {
    console.error("Fatal error during user activity migration:", err);
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
seedUserActivityFromJson()
  .then((result) => {
    process.exit(result.success ? 0 : 1);
  })
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
