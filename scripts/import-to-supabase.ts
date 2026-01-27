/**
 * Import JSON Data into Supabase
 * 
 * Imports previously exported Convex data from JSON files into Supabase tables.
 * Handles ID mapping and data transformation as needed.
 * 
 * Usage:
 *   npx ts-node scripts/import-to-supabase.ts
 * 
 * Requires:
 *   VITE_SUPABASE_URL - Your Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Your Supabase service role key (from settings)
 */

import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DATA_DIR = path.join(process.cwd(), "data");

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ Missing Supabase credentials.");
  console.error("   Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Initialize Supabase admin client (with service role key for full access)
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const TABLES_TO_IMPORT = [
  "users",
  "partners",
  "campaigns",
  "transactions",
  "wallets",
  "audit_logs",
];

const BATCH_SIZE = 100; // Insert in batches to avoid oversized payloads

interface ImportResult {
  table: string;
  rowsImported: number;
  rowsFailed: number;
  success: boolean;
  error?: string;
}

/**
 * Load JSON data from file
 */
function loadTableData(tableName: string): any[] {
  const filePath = path.join(DATA_DIR, `${tableName}.json`);

  if (!fs.existsSync(filePath)) {
    console.warn(`   ⚠️  File not found: ${filePath}`);
    return [];
  }

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(content);
    return Array.isArray(data) ? data : [data];
  } catch (err) {
    console.error(`   ❌ Failed to parse ${filePath}:`, err);
    return [];
  }
}

/**
 * Transform Convex row to Supabase row (if needed)
 * 
 * Common transformations:
 * - Preserve convex_id for traceability
 * - Adjust timestamp formats
 * - Handle nested objects → JSONB
 */
function transformRow(row: any, tableName: string): any {
  if (!row) return null;

  const transformed = { ...row };

  // Store original Convex ID
  if (row._id && !transformed.convex_id) {
    transformed.convex_id = row._id;
  }

  // Handle timestamp fields
  if (row._creationTime && !transformed.created_at) {
    transformed.created_at = new Date(row._creationTime).toISOString();
  }

  // Remove Convex-specific fields if they conflict with Supabase schema
  delete transformed._id;
  delete transformed._creationTime;

  return transformed;
}

/**
 * Import a single table
 */
async function importTable(tableName: string): Promise<ImportResult> {
  const result: ImportResult = {
    table: tableName,
    rowsImported: 0,
    rowsFailed: 0,
    success: false,
  };

  try {
    console.log(`\n📥 Importing table: ${tableName}...`);

    // Load data from JSON file
    const rows = loadTableData(tableName);

    if (rows.length === 0) {
      console.log(`   ℹ️  No data to import for ${tableName}`);
      result.success = true;
      return result;
    }

    console.log(`   📋 Loaded ${rows.length} rows from JSON`);

    // Transform rows
    const transformedRows = rows
      .map((row) => transformRow(row, tableName))
      .filter((row) => row !== null);

    // Import in batches
    for (let i = 0; i < transformedRows.length; i += BATCH_SIZE) {
      const batch = transformedRows.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;

      try {
        const { error } = await supabaseAdmin
          .from(tableName)
          .insert(batch);

        if (error) {
          console.error(
            `   ❌ Batch ${batchNum} failed:`,
            error.message
          );
          result.rowsFailed += batch.length;
        } else {
          result.rowsImported += batch.length;
          console.log(
            `   ✓ Batch ${batchNum}: ${batch.length} rows imported`
          );
        }
      } catch (err) {
        console.error(`   ❌ Batch ${batchNum} error:`, err);
        result.rowsFailed += batch.length;
      }
    }

    result.success = result.rowsFailed === 0;

    if (result.success) {
      console.log(
        `   ✅ Successfully imported ${result.rowsImported} rows`
      );
    } else {
      console.warn(
        `   ⚠️  Imported ${result.rowsImported}, failed ${result.rowsFailed}`
      );
    }

    return result;
  } catch (err) {
    result.error = err instanceof Error ? err.message : String(err);
    console.error(`   ❌ Import failed for ${tableName}:`, result.error);
    return result;
  }
}

/**
 * Verify data integrity after import
 */
async function verifyImport(results: ImportResult[]) {
  console.log("\n" + "=".repeat(60));
  console.log("🔍 VERIFYING IMPORT");
  console.log("=".repeat(60));

  for (const tableName of TABLES_TO_IMPORT) {
    try {
      const { count, error } = await supabaseAdmin
        .from(tableName)
        .select("*", { count: "exact", head: true });

      if (error) {
        console.log(`❌ ${tableName.padEnd(20)} → Error: ${error.message}`);
      } else {
        const importResult = results.find((r) => r.table === tableName);
        const imported = importResult?.rowsImported || 0;
        const dbCount = count || 0;
        const match = imported === dbCount ? "✅" : "⚠️";
        console.log(
          `${match} ${tableName.padEnd(20)} → DB: ${dbCount.toString().padStart(6)}, Imported: ${imported.toString().padStart(6)}`
        );
      }
    } catch (err) {
      console.error(`❌ ${tableName}: ${err}`);
    }
  }
}

/**
 * Main import function
 */
async function main() {
  console.log("🚀 Starting Supabase Data Import...\n");
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
  console.log(`📂 Data Directory: ${DATA_DIR}`);
  console.log(`📋 Tables to Import: ${TABLES_TO_IMPORT.join(", ")}\n`);

  // Check if data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    console.error(`❌ Data directory not found: ${DATA_DIR}`);
    console.error(
      "   Run 'npx ts-node scripts/export-convex-data.ts' first to export data."
    );
    process.exit(1);
  }

  const results: ImportResult[] = [];

  // Import each table
  for (const tableName of TABLES_TO_IMPORT) {
    const result = await importTable(tableName);
    results.push(result);
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 IMPORT SUMMARY");
  console.log("=".repeat(60));

  let totalImported = 0;
  let totalFailed = 0;
  const successCount = results.filter((r) => r.success).length;

  results.forEach((result) => {
    const status = result.success ? "✅" : "❌";
    console.log(
      `${status} ${result.table.padEnd(20)} → ${result.rowsImported.toString().padStart(6)} imported, ${result.rowsFailed.toString().padStart(6)} failed`
    );
    totalImported += result.rowsImported;
    totalFailed += result.rowsFailed;
  });

  console.log("=".repeat(60));
  console.log(`✅ Successfully imported: ${successCount}/${results.length} tables`);
  console.log(`📊 Total rows imported: ${totalImported}`);
  console.log(`❌ Total rows failed: ${totalFailed}\n`);

  // Verify import
  await verifyImport(results);

  // Write summary
  const summaryPath = path.join(DATA_DIR, "_import_summary.json");
  fs.writeFileSync(
    summaryPath,
    JSON.stringify(
      {
        importedAt: new Date().toISOString(),
        supabaseUrl: SUPABASE_URL,
        tables: results.map((r) => ({
          table: r.table,
          rowsImported: r.rowsImported,
          rowsFailed: r.rowsFailed,
          success: r.success,
          error: r.error || null,
        })),
        totalImported,
        totalFailed,
        totalTables: TABLES_TO_IMPORT.length,
        successCount,
      },
      null,
      2
    ),
    "utf-8"
  );

  console.log(`\n📄 Summary saved to: ${summaryPath}`);

  // Exit with error if any imports failed
  if (totalFailed > 0) {
    console.warn("\n⚠️  Some imports failed. Please review the errors above.");
    process.exit(1);
  }

  console.log("\n✅ Import completed successfully!\n");
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
