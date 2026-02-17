/**
 * Phase 3: Seed Script - Wallets from JSON
 * Migrates wallet data from JSON to Supabase wallets table
 */

import { supabase } from "../lib/supabase";
import walletsData from "./data/wallets.json";

interface WalletRecord {
  id: string;
  partner_id: string;
  user_id: string;
  balance: number;
  total_earnings: number;
  pending_withdrawals: number;
  paybill_number?: string;
  account_number?: string;
  payment_method: string;
  is_active: boolean;
}

export async function seedWalletsFromJSON(): Promise<{
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
    console.log("Starting wallet migration from JSON to Supabase...");

    if (!walletsData.wallets || walletsData.wallets.length === 0) {
      results.errors.push("No wallets found in JSON data");
      return results;
    }

    // Validate and transform wallet records
    const walletRecords: WalletRecord[] = walletsData.wallets
      .filter((w: any) => {
        if (!w.partner_id || !w.user_id) {
          results.errors.push(
            `Wallet missing partner_id or user_id: ${JSON.stringify(w)}`,
          );
          results.failed++;
          return false;
        }
        return true;
      })
      .map((w: any) => ({
        id: w.id || crypto.randomUUID(),
        partner_id: w.partner_id,
        user_id: w.user_id,
        balance: Number(w.balance || 0),
        total_earnings: Number(w.total_earnings || 0),
        pending_withdrawals: Number(w.pending_withdrawals || 0),
        paybill_number: w.paybill_number,
        account_number: w.account_number,
        payment_method: w.payment_method || "mpesa",
        is_active: w.is_active !== false,
      }));

    // Insert wallets in batches
    const batchSize = 10;
    for (let i = 0; i < walletRecords.length; i += batchSize) {
      const batch = walletRecords.slice(i, i + batchSize);

      const { error } = await supabase.from("wallets").insert(batch);

      if (error) {
        console.error(
          `Error inserting wallet batch ${i / batchSize + 1}:`,
          error,
        );
        results.errors.push(`Batch ${i / batchSize + 1}: ${error.message}`);
        results.failed += batch.length;
      } else {
        console.log(`Successfully inserted ${batch.length} wallets`);
        results.created += batch.length;
      }
    }

    results.success = results.failed === 0;
    return results;
  } catch (err) {
    console.error("Unexpected error during wallet migration:", err);
    results.errors.push(String(err));
    return results;
  }
}

// Execute as standalone script
async function runSeed() {
  const result = await seedWalletsFromJSON();
  console.log("\nSeed Results:", result);
}

// Only run if this file is executed directly
if (typeof import.meta !== 'undefined') {
  runSeed().catch(console.error);
}
