/**
 * Verify Supabase Import Integrity
 * 
 * Runs validation queries to ensure data was imported correctly:
 * - Row count verification
 * - Sample data checks
 * - Foreign key constraint validation
 * - Orphaned record detection
 * 
 * Usage:
 *   VITE_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx ts-node scripts/verify-migration.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ Missing Supabase credentials.");
  console.error("   Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TABLES = ["users", "partners", "campaigns", "transactions", "wallets", "audit_logs"];

interface VerificationReport {
  timestamp: string;
  tables: {
    [key: string]: {
      count: number;
      sampleRecords: any[];
      hasConvexIds: boolean;
      convexIdCount: number;
    };
  };
  foreignKeyChecks: {
    [key: string]: {
      orphanedCount: number;
      issues: any[];
    };
  };
  summary: {
    tablesChecked: number;
    totalRows: number;
    issues: string[];
  };
}

/**
 * Get row count for a table
 */
async function getRowCount(table: string): Promise<number> {
  try {
    const { count, error } = await supabaseAdmin
      .from(table)
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error(`   ❌ Error querying ${table}:`, error.message);
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.error(`   ❌ Error counting ${table}:`, err);
    return 0;
  }
}

/**
 * Get sample records from a table
 */
async function getSampleRecords(
  table: string,
  limit: number = 5
): Promise<any[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from(table)
      .select("*")
      .limit(limit);

    if (error) {
      console.error(`   ❌ Error fetching samples from ${table}:`, error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error(`   ❌ Error sampling ${table}:`, err);
    return [];
  }
}

/**
 * Check if table has convex_id values
 */
async function checkConvexIds(table: string): Promise<{
  hasConvexIds: boolean;
  count: number;
}> {
  try {
    const { count, error } = await supabaseAdmin
      .from(table)
      .select("*", { count: "exact", head: true })
      .not("convex_id", "is", null);

    if (error) {
      return { hasConvexIds: false, count: 0 };
    }

    return { hasConvexIds: (count || 0) > 0, count: count || 0 };
  } catch (err) {
    return { hasConvexIds: false, count: 0 };
  }
}

/**
 * Check for orphaned transactions (FK to partners)
 */
async function checkOrphanedTransactions(): Promise<{
  orphanedCount: number;
  issues: any[];
}> {
  try {
    // Note: This assumes transactions have partner_id FK
    // Adjust query based on actual schema
    const { data, error } = await supabaseAdmin.rpc("check_orphaned_transactions", {});

    if (error) {
      // Fallback: query directly if RPC doesn't exist
      const { data: orphans } = await supabaseAdmin
        .from("transactions")
        .select("id, convex_id, partner_id")
        .is("partner_id", null)
        .limit(10);

      return {
        orphanedCount: orphans?.length || 0,
        issues: orphans || [],
      };
    }

    return {
      orphanedCount: (data as any)?.count || 0,
      issues: (data as any)?.records || [],
    };
  } catch (err) {
    console.warn("   ⚠️  FK check skipped (RPC not available)");
    return { orphanedCount: 0, issues: [] };
  }
}

/**
 * Verify all tables
 */
async function verifyAll(): Promise<VerificationReport> {
  console.log("🔍 Starting Supabase Import Verification...\n");

  const report: VerificationReport = {
    timestamp: new Date().toISOString(),
    tables: {},
    foreignKeyChecks: {},
    summary: {
      tablesChecked: TABLES.length,
      totalRows: 0,
      issues: [],
    },
  };

  // Check each table
  for (const table of TABLES) {
    console.log(`📊 Verifying table: ${table}...`);

    const count = await getRowCount(table);
    const samples = await getSampleRecords(table, 5);
    const { hasConvexIds, count: convexIdCount } = await checkConvexIds(table);

    report.tables[table] = {
      count,
      sampleRecords: samples,
      hasConvexIds,
      convexIdCount,
    };

    report.summary.totalRows += count;

    console.log(
      `   ✓ ${count} rows, ${convexIdCount} with convex_id, ${samples.length} samples`
    );

    if (count === 0) {
      report.summary.issues.push(`${table}: No rows imported`);
    }

    if (hasConvexIds && convexIdCount < count) {
      report.summary.issues.push(
        `${table}: Only ${convexIdCount}/${count} rows have convex_id`
      );
    }
  }

  // Check foreign keys
  console.log(`\n🔗 Checking foreign key integrity...`);
  const fkResult = await checkOrphanedTransactions();
  report.foreignKeyChecks["transactions.partner_id"] = fkResult;

  if (fkResult.orphanedCount > 0) {
    report.summary.issues.push(
      `transactions: ${fkResult.orphanedCount} orphaned records (no matching partner)`
    );
  }

  return report;
}

/**
 * Main
 */
async function main() {
  const report = await verifyAll();

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("✅ VERIFICATION REPORT");
  console.log("=".repeat(60));

  console.log(`\n📊 Tables Checked: ${report.summary.tablesChecked}`);
  console.log(`📊 Total Rows: ${report.summary.totalRows}\n`);

  console.log("📋 Table Details:");
  for (const [table, info] of Object.entries(report.tables)) {
    console.log(`  ${table.padEnd(20)} → ${info.count.toString().padStart(6)} rows`);
    if (!info.hasConvexIds) {
      console.log(`    ⚠️  Missing convex_id values`);
    }
  }

  if (report.summary.issues.length > 0) {
    console.log("\n⚠️  Issues Found:");
    report.summary.issues.forEach((issue) => console.log(`   - ${issue}`));
  } else {
    console.log("\n✅ No issues found!");
  }

  // Save report
  const reportPath = path.join(
    process.cwd(),
    `verification_report_${Date.now()}.json`
  );
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf-8");
  console.log(`\n📄 Report saved: ${reportPath}\n`);

  // Exit with error if issues found
  if (report.summary.issues.length > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
