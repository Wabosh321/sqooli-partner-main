/**
 * Seed Script: Migrate wallets from JSON to Supabase
 * Phase 3: Transfer wallet data with validation
 *
 * Usage: npx tsx scripts/seed_wallets_from_json.ts
 */

import { createClient } from "@supabase/supabase-js";

interface WalletRecord {
  id: string;
  partner_id: string;
  user_id?: string;
  balance: number;
  total_earned: number;
  pending_withdrawals?: number;
  paybill_number?: string;
  account_number?: string;
  payment_method?: string;
  currency?: string;
  created_at: string;
  updated_at: string;
}

interface SeedResult {
  success: boolean;
  created: number;
  failed: number;
  errors: Array<{ record_id: string; error: string }>;
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedWalletsFromJson(): Promise<SeedResult> {
  const result: SeedResult = {
    success: true,
    created: 0,
    failed: 0,
    errors: [],
  };

  try {
    // Import wallets.json
    const walletsModule = await import("../src/auth/data/wallets.json");
    const walletsData: WalletRecord[] =
      walletsModule.wallets || walletsModule.default.wallets;

    if (!Array.isArray(walletsData)) {
      throw new Error("Wallets data is not an array");
    }

    console.log(
      `\n📊 Starting wallet migration: ${walletsData.length} records to process`,
    );

    // Process in batches of 10
    const batchSize = 10;
    for (let i = 0; i < walletsData.length; i += batchSize) {
      const batch = walletsData.slice(i, i + batchSize);
      const processedBatch = batch.map((wallet) => {
        // Validate required fields
        if (!wallet.partner_id) {
          result.errors.push({
            record_id: wallet.id,
            error: "Missing partner_id",
          });
          result.failed++;
          return null;
        }

        // Map balance
        const balance = wallet.balance || 0;
        const total_earnings = wallet.total_earned || 0;
        const pending_withdrawals = wallet.pending_withdrawals || 0;

        return {
          partner_id: wallet.partner_id,
          user_id: wallet.user_id || wallet.partner_id, // Use partner_id as fallback
          balance: balance,
          total_earnings: total_earnings,
          pending_withdrawals: pending_withdrawals,
          paybill_number: wallet.paybill_number,
          account_number: wallet.account_number,
          payment_method: wallet.payment_method || "mpesa",
          is_active: true,
          created_at: wallet.created_at || new Date().toISOString(),
          updated_at: wallet.updated_at || new Date().toISOString(),
        };
      });

      // Filter out null values and insert
      const validRecords = processedBatch.filter((record) => record !== null);

      if (validRecords.length > 0) {
        const { error } = await supabase
          .from("wallets")
          .insert(validRecords as any, { count: "estimated" });

        if (error) {
          console.error(
            `❌ Batch insert error (records ${i}-${i + batchSize}):`,
            error,
          );
          validRecords.forEach((record) => {
            result.errors.push({
              record_id: record?.partner_id || "unknown",
              error: error.message,
            });
            result.failed++;
          });
        } else {
          console.log(
            `✅ Batch inserted (records ${i}-${i + Math.min(batchSize, walletsData.length - i)})`,
          );
          result.created += validRecords.length;
        }
      }
    }

    result.success = result.failed === 0;
  } catch (error) {
    result.success = false;
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Fatal error during seed:", errorMsg);
    result.errors.push({
      record_id: "fatal",
      error: errorMsg,
    });
  }

  // Summary
  console.log("\n📋 MIGRATION SUMMARY");
  console.log("═".repeat(50));
  console.log(`✅ Successfully created: ${result.created}`);
  console.log(`❌ Failed to create:     ${result.failed}`);
  console.log(`📊 Total processed:      ${result.created + result.failed}`);

  if (result.errors.length > 0) {
    console.log("\n⚠️  ERRORS:");
    result.errors.forEach((err) => {
      console.log(`  - [${err.record_id}] ${err.error}`);
    });
  }

  console.log("═".repeat(50));
  console.log(`✨ Status: ${result.success ? "SUCCESS" : "PARTIAL_FAILURE"}\n`);

  return result;
}

// Run the seed function
seedWalletsFromJson()
  .then((result) => {
    process.exit(result.success ? 0 : 1);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
