/**
 * Phase 3: Seed Script - Transactions from JSON
 * Migrates transaction data from JSON to Supabase transactions table
 */

import { supabase } from "../lib/supabase";
import transactionsData from "./data/transactions.json";

interface TransactionRecord {
  id: string;
  wallet_id: string;
  partner_id: string;
  user_id: string;
  campaign_id?: string;
  transaction_type: string;
  amount: number;
  description?: string;
  status: string;
  reference_number?: string;
  created_at: string;
}

export async function seedTransactionsFromJSON(): Promise<{
  success: boolean;
  created: number;
  failed: number;
  errors: string[];
}> {
  const results = {
    success: false,
    created: 0,
    failed: 0,
    errors: [] as string[],
  };

  try {
    console.log("Starting transaction migration from JSON to Supabase...");

    if (
      !transactionsData.transactions ||
      transactionsData.transactions.length === 0
    ) {
      results.errors.push("No transactions found in JSON data");
      return results;
    }

    // Fetch wallets to get wallet_id mapping
    const { data: wallets, error: walletError } = await supabase
      .from("wallets")
      .select("id, partner_id, user_id");

    if (walletError || !wallets) {
      results.errors.push(`Failed to fetch wallets: ${walletError?.message}`);
      return results;
    }

    // Create wallet lookup
    const walletMap = new Map(
      wallets.map((w) => [
        `${w.partner_id}:${w.user_id}`,
        { id: w.id, partner_id: w.partner_id, user_id: w.user_id },
      ]),
    );

    // Validate and transform transaction records
    const transactionRecords: TransactionRecord[] =
      transactionsData.transactions
        .filter((t: any) => {
          const walletKey = `${t.partner_id}:${t.user_id}`;
          if (!walletMap.has(walletKey)) {
            results.errors.push(
              `Transaction has no matching wallet: ${walletKey}`,
            );
            results.failed++;
            return false;
          }
          if (!t.partner_id || !t.user_id) {
            results.errors.push(
              `Transaction missing partner_id or user_id: ${JSON.stringify(t)}`,
            );
            results.failed++;
            return false;
          }
          return true;
        })
        .map((t: any) => {
          const walletKey = `${t.partner_id}:${t.user_id}`;
          const wallet = walletMap.get(walletKey)!;

          return {
            id: t.id || crypto.randomUUID(),
            wallet_id: wallet.id,
            partner_id: t.partner_id,
            user_id: t.user_id,
            campaign_id: t.campaign_id,
            transaction_type: t.transaction_type || "earnings",
            amount: Number(t.amount || 0),
            description: t.description,
            status: t.status || "completed",
            reference_number: t.reference_number,
            created_at: t.created_at || new Date().toISOString(),
          };
        });

    // Insert transactions in batches
    const batchSize = 10;
    for (let i = 0; i < transactionRecords.length; i += batchSize) {
      const batch = transactionRecords.slice(i, i + batchSize);

      const { error } = await supabase.from("transactions").insert(batch);

      if (error) {
        console.error(
          `Error inserting transaction batch ${i / batchSize + 1}:`,
          error,
        );
        results.errors.push(`Batch ${i / batchSize + 1}: ${error.message}`);
        results.failed += batch.length;
      } else {
        console.log(`Successfully inserted ${batch.length} transactions`);
        results.created += batch.length;
      }
    }

    results.success = results.failed === 0;
    return results;
  } catch (err) {
    console.error("Unexpected error during transaction migration:", err);
    results.errors.push(String(err));
    return results;
  }
}

// Execute if run directly
if (require.main === module) {
  seedTransactionsFromJSON().then((result) => {
    console.log("\nSeed Results:", result);
    process.exit(result.success ? 0 : 1);
  });
}
