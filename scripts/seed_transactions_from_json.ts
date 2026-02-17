/**
 * Seed Script: Migrate transactions from JSON to Supabase
 * Phase 3: Transfer transaction data with wallet FK validation
 *
 * Usage: npx tsx scripts/seed_transactions_from_json.ts
 */

import { createClient } from "@supabase/supabase-js";

interface TransactionRecord {
  id: string;
  partner_id: string;
  user_id: string;
  transaction_type: string;
  amount: number;
  campaign_id?: string;
  created_at: string;
  description?: string;
  reference_number?: string;
  status?: string;
  metadata?: Record<string, any>;
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

async function seedTransactionsFromJson(): Promise<SeedResult> {
  const result: SeedResult = {
    success: true,
    created: 0,
    failed: 0,
    errors: [],
  };

  try {
    // Import transactions.json
    const transactionsModule =
      await import("../src/auth/data/transactions.json");
    const transactionsData: TransactionRecord[] =
      transactionsModule.transactions ||
      transactionsModule.default.transactions;

    if (!Array.isArray(transactionsData)) {
      throw new Error("Transactions data is not an array");
    }

    console.log(
      `\n📊 Starting transaction migration: ${transactionsData.length} records to process`,
    );

    // Fetch all wallets to build partner_id -> user_id -> wallet_id map
    console.log("🔍 Building wallet lookup map...");
    const { data: wallets, error: walletsError } = await supabase
      .from("wallets")
      .select("id, partner_id, user_id");

    if (walletsError) {
      throw new Error(`Failed to fetch wallets: ${walletsError.message}`);
    }

    const walletMap = new Map<string, string>();
    if (wallets) {
      wallets.forEach((wallet: any) => {
        const key = `${wallet.partner_id}:${wallet.user_id}`;
        walletMap.set(key, wallet.id);
      });
    }
    console.log(`✅ Wallet map built: ${wallets?.length || 0} wallets found`);

    // Process transactions
    const validTransactions: any[] = [];
    const failedTransactions: Array<{ id: string; reason: string }> = [];

    transactionsData.forEach((tx) => {
      // Validate required fields
      if (!tx.partner_id || !tx.user_id) {
        result.errors.push({
          record_id: tx.id,
          error: "Missing partner_id or user_id",
        });
        result.failed++;
        return;
      }

      // Find wallet
      const walletKey = `${tx.partner_id}:${tx.user_id}`;
      const walletId = walletMap.get(walletKey);

      if (!walletId) {
        failedTransactions.push({
          id: tx.id,
          reason: `No wallet found for partner_id=${tx.partner_id}, user_id=${tx.user_id}`,
        });
        result.errors.push({
          record_id: tx.id,
          error: `No wallet found for partner_id=${tx.partner_id}, user_id=${tx.user_id}`,
        });
        result.failed++;
        return;
      }

      // Normalize transaction type
      let transactionType = "adjustment";
      if (tx.transaction_type?.toLowerCase().includes("earn")) {
        transactionType = "earnings";
      } else if (tx.transaction_type?.toLowerCase().includes("bonus")) {
        transactionType = "bonus";
      } else if (tx.transaction_type?.toLowerCase().includes("referral")) {
        transactionType = "referral";
      }

      // Create transaction record
      validTransactions.push({
        wallet_id: walletId,
        partner_id: tx.partner_id,
        user_id: tx.user_id,
        campaign_id: tx.campaign_id || null,
        transaction_type: transactionType,
        amount: tx.amount || 0,
        description: tx.description || null,
        reference_number: tx.reference_number || null,
        status: tx.status || "completed",
        metadata: tx.metadata || null,
        created_at: tx.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    });

    if (failedTransactions.length > 0) {
      console.log(
        `\n⚠️  Skipping ${failedTransactions.length} transactions with missing wallet references:`,
      );
      failedTransactions.slice(0, 5).forEach((tx) => {
        console.log(`  - [${tx.id}] ${tx.reason}`);
      });
      if (failedTransactions.length > 5) {
        console.log(`  ... and ${failedTransactions.length - 5} more`);
      }
    }

    // Insert in batches
    const batchSize = 25;
    console.log(
      `\n📤 Inserting ${validTransactions.length} validated transactions in batches of ${batchSize}...`,
    );

    for (let i = 0; i < validTransactions.length; i += batchSize) {
      const batch = validTransactions.slice(i, i + batchSize);
      const { error } = await supabase
        .from("transactions")
        .insert(batch as any, { count: "estimated" });

      if (error) {
        console.error(
          `❌ Batch insert error (records ${i}-${i + Math.min(batchSize, validTransactions.length - i)}):`,
          error,
        );
        batch.forEach((tx) => {
          result.errors.push({
            record_id: `batch_${i}`,
            error: error.message,
          });
        });
        result.failed += batch.length;
      } else {
        console.log(
          `✅ Batch inserted (records ${i}-${i + Math.min(batchSize, validTransactions.length - i)})`,
        );
        result.created += batch.length;
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

  if (result.errors.length > 0 && result.errors.length <= 10) {
    console.log("\n⚠️  ERRORS:");
    result.errors.forEach((err) => {
      console.log(`  - [${err.record_id}] ${err.error}`);
    });
  } else if (result.errors.length > 10) {
    console.log(
      `\n⚠️  ERRORS: ${result.errors.length} errors (showing first 10):`,
    );
    result.errors.slice(0, 10).forEach((err) => {
      console.log(`  - [${err.record_id}] ${err.error}`);
    });
  }

  console.log("═".repeat(50));
  console.log(`✨ Status: ${result.success ? "SUCCESS" : "PARTIAL_FAILURE"}\n`);

  return result;
}

// Run the seed function
seedTransactionsFromJson()
  .then((result) => {
    process.exit(result.success ? 0 : 1);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
