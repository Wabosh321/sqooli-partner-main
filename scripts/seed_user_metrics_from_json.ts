/**
 * PHASE 4: Seed Script - Migrate user metrics from JSON to Supabase
 * Handles user_performance_metrics table population with batch validation
 *
 * Usage: npx tsx scripts/seed_user_metrics_from_json.ts
 */

import { createClient } from "@supabase/supabase-js";

interface UserMetricsRecord {
  id: string;
  user_id: string;
  metric_date: string;
  campaigns_created?: number;
  campaigns_completed?: number;
  tasks_completed?: number;
  engagement_score?: number;
  roi?: number;
  revenue_generated?: number;
  created_at?: string;
  updated_at?: string;
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
  record: UserMetricsRecord,
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

  return true;
}

/**
 * Group metrics by user_id and metric_date for efficient batch processing
 */
function groupMetricsByUserAndDate(
  records: UserMetricsRecord[],
): Map<string, UserMetricsRecord[]> {
  const grouped = new Map<string, UserMetricsRecord[]>();

  for (const record of records) {
    const key = `${record.user_id}-${record.metric_date}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(record);
  }

  return grouped;
}

async function seedUserMetricsFromJson(): Promise<SeedResult> {
  const result: SeedResult = {
    success: true,
    created: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  try {
    // Import user_metrics.json
    const metricsModule = await import("../src/auth/data/user_metrics.json");
    const metricsData: any[] =
      metricsModule.user_metrics || metricsModule.default.user_metrics || [];

    if (!Array.isArray(metricsData)) {
      throw new Error("User metrics data is not an array");
    }

    console.log(
      `\n📈 Starting user metrics migration: ${metricsData.length} records to process`,
    );

    // Group metrics for deduplication
    const groupedMetrics = groupMetricsByUserAndDate(metricsData);
    console.log(
      `   Grouped into ${groupedMetrics.size} unique user-date combinations`,
    );

    // Process in batches of 10
    const batchSize = 10;
    let processedGroups = 0;

    for (const [_, records] of groupedMetrics) {
      try {
        // Use the first record from each group (or aggregate if needed)
        const record = records[0];

        // Validate required fields
        if (!record.user_id || !record.metric_date) {
          result.errors.push({
            record_id: record.id,
            error: "Missing required fields: user_id or metric_date",
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

        // Validate metric values
        if (record.engagement_score !== undefined) {
          if (record.engagement_score < 0 || record.engagement_score > 100) {
            result.errors.push({
              record_id: record.id,
              error: "engagement_score must be between 0 and 100",
            });
            result.failed++;
            continue;
          }
        }

        if (record.roi !== undefined && record.roi < 0) {
          result.errors.push({
            record_id: record.id,
            error: "roi must be non-negative",
          });
          result.failed++;
          continue;
        }

        // Aggregate metrics if multiple records for same user-date
        let aggregated = {
          campaigns_created: record.campaigns_created || 0,
          campaigns_completed: record.campaigns_completed || 0,
          tasks_completed: record.tasks_completed || 0,
          engagement_score: record.engagement_score || 0,
          roi: record.roi || 0,
          revenue_generated: record.revenue_generated || 0,
        };

        if (records.length > 1) {
          console.log(
            `   ℹ️  Aggregating ${records.length} metrics for ${record.user_id} on ${record.metric_date}`,
          );
          aggregated = records.reduce(
            (acc, r) => ({
              campaigns_created:
                acc.campaigns_created + (r.campaigns_created || 0),
              campaigns_completed:
                acc.campaigns_completed + (r.campaigns_completed || 0),
              tasks_completed: acc.tasks_completed + (r.tasks_completed || 0),
              engagement_score: Math.max(
                acc.engagement_score,
                r.engagement_score || 0,
              ),
              roi: Math.max(acc.roi, r.roi || 0),
              revenue_generated:
                acc.revenue_generated + (r.revenue_generated || 0),
            }),
            aggregated,
          );
        }

        // Insert metrics record
        const { error: insertError } = await supabase
          .from("user_performance_metrics")
          .upsert({
            id: record.id,
            user_id: record.user_id,
            metric_date: record.metric_date,
            campaigns_created: aggregated.campaigns_created,
            campaigns_completed: aggregated.campaigns_completed,
            tasks_completed: aggregated.tasks_completed,
            engagement_score: aggregated.engagement_score,
            roi: aggregated.roi,
            revenue_generated: aggregated.revenue_generated,
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
          record_id: records[0].id,
          error: err instanceof Error ? err.message : "Unknown error",
        });
        result.failed++;
      }

      processedGroups++;

      // Progress indicator every 10 batches
      if (processedGroups % 10 === 0) {
        console.log(
          `  Progress: ${processedGroups}/${groupedMetrics.size} (${Math.round(
            (processedGroups / groupedMetrics.size) * 100,
          )}%)`,
        );
      }
    }

    if (result.failed > 0 || result.errors.length > 0) {
      result.success = false;
    }

    console.log("\n📊 User Metrics Migration Summary:");
    console.log(`  ✅ Created: ${result.created}`);
    console.log(`  ⏭️  Skipped: ${result.skipped}`);
    console.log(`  ❌ Failed: ${result.failed}`);

    if (result.errors.length > 0) {
      console.log("\n❌ Errors (showing first 10):");
      result.errors.slice(0, 10).forEach((err) => {
        console.log(`  - ${err.record_id}: ${err.error}`);
      });
    }

    console.log(
      "\n💡 Metrics aggregation: Multiple records for same user-date were summed",
    );

    return result;
  } catch (err) {
    console.error("Fatal error during user metrics migration:", err);
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
seedUserMetricsFromJson()
  .then((result) => {
    process.exit(result.success ? 0 : 1);
  })
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
