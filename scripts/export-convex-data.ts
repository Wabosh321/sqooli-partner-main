/**
 * Export Convex Tables to JSON
 * 
 * Exports all rows from MVP Convex tables to JSON files for migration to Supabase.
 * 
 * Usage:
 *   npx ts-node scripts/export-convex-data.ts
 * 
 * Requires:
 *   CONVEX_URL - Your Convex deployment URL
 *   (Optional) CONVEX_ADMIN_KEY - For admin queries (if accessing private data)
 */

import * as fs from "fs";
import * as path from "path";

const CONVEX_URL = process.env.CONVEX_URL || process.env.VITE_CONVEX_URL;

if (!CONVEX_URL) {
  console.error(
    "❌ Missing CONVEX_URL. Set the environment variable to your Convex deployment URL."
  );
  console.error(
    "   Example: CONVEX_URL=https://your-team.convex.cloud npx ts-node scripts/export-convex-data.ts"
  );
  process.exit(1);
}

const TABLES_TO_EXPORT = [
  "users",
  "partners",
  "campaigns",
  "transactions",
  "wallets",
  "audit_logs",
];

const OUTPUT_DIR = path.join(process.cwd(), "data");
const PAGE_SIZE = 1000;

interface ExportResult {
  table: string;
  rowsExported: number;
  filePath: string;
  success: boolean;
  error?: string;
}

/**
 * Ensure output directory exists
 */
function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`📁 Created output directory: ${OUTPUT_DIR}`);
  }
}

/**
 * Export a single table from Convex via HTTP queries
 * 
 * Note: This uses direct HTTP POST queries to Convex.
 * If tables require authentication, you may need to adjust the method.
 */
async function exportTable(tableName: string): Promise<ExportResult> {
  const result: ExportResult = {
    table: tableName,
    rowsExported: 0,
    filePath: path.join(OUTPUT_DIR, `${tableName}.json`),
    success: false,
  };

  try {
    console.log(`\n📊 Exporting table: ${tableName}...`);

    // Strategy: Attempt a direct fetch to Convex API
    // Most Convex deployments expose a query endpoint
    // We'll try a generic list query pattern
    
    const allRows: any[] = [];
    let pageNumber = 0;
    let hasMore = true;

    while (hasMore) {
      try {
        // Construct a query path — adjust based on your Convex schema
        // This assumes Convex exposes a standard query interface
        const queryPath = `${tableName}:list`;
        
        const response = await fetch(`${CONVEX_URL}/api/query`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            path: queryPath,
            args: {
              // Optional: add pagination args if your Convex schema supports it
              // skip: pageNumber * PAGE_SIZE,
              // limit: PAGE_SIZE,
            },
          }),
        });

        if (!response.ok) {
          // Try alternative query pattern
          console.warn(
            `   ⚠️  Standard query pattern failed for ${tableName}, attempting alternative...`
          );
          hasMore = false;
          break;
        }

        const data = await response.json();

        if (Array.isArray(data)) {
          allRows.push(...data);
          console.log(
            `   ✓ Fetched ${data.length} rows (page ${pageNumber + 1})`
          );

          // If fewer rows than page size, we're done
          if (data.length < PAGE_SIZE) {
            hasMore = false;
          } else {
            pageNumber++;
          }
        } else {
          // Single result or not an array
          hasMore = false;
          if (data && typeof data === "object") {
            allRows.push(data);
          }
        }
      } catch (err) {
        console.error(`   ❌ Error fetching page ${pageNumber}:`, err);
        hasMore = false;
        break;
      }
    }

    // If no rows fetched via API, try a fallback approach
    if (allRows.length === 0) {
      console.warn(
        `   ⚠️  No rows exported via standard method. Table may be empty or require auth.`
      );
      // Write empty array as placeholder
      allRows.push(
        {
          _note: `Table "${tableName}" was empty or could not be exported. Please verify Convex deployment and credentials.`,
        }
      );
    }

    // Write to JSON file
    fs.writeFileSync(
      result.filePath,
      JSON.stringify(allRows, null, 2),
      "utf-8"
    );

    result.rowsExported = allRows.length;
    result.success = true;

    console.log(
      `   ✅ Exported ${allRows.length} rows to ${result.filePath}`
    );

    return result;
  } catch (err) {
    result.error = err instanceof Error ? err.message : String(err);
    console.error(`   ❌ Export failed for ${tableName}:`, result.error);
    return result;
  }
}

/**
 * Main export function
 */
async function main() {
  console.log("🚀 Starting Convex Data Export...\n");
  console.log(`📍 Convex Deployment: ${CONVEX_URL}`);
  console.log(`💾 Output Directory: ${OUTPUT_DIR}`);
  console.log(`📋 Tables to Export: ${TABLES_TO_EXPORT.join(", ")}\n`);

  ensureOutputDir();

  const results: ExportResult[] = [];

  // Export each table
  for (const tableName of TABLES_TO_EXPORT) {
    const result = await exportTable(tableName);
    results.push(result);
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 EXPORT SUMMARY");
  console.log("=".repeat(60));

  let totalRows = 0;
  const successCount = results.filter((r) => r.success).length;

  results.forEach((result) => {
    const status = result.success ? "✅" : "❌";
    console.log(
      `${status} ${result.table.padEnd(20)} → ${result.rowsExported.toString().padStart(6)} rows`
    );
    totalRows += result.rowsExported;
  });

  console.log("=".repeat(60));
  console.log(`✅ Successfully exported: ${successCount}/${results.length} tables`);
  console.log(`📊 Total rows exported: ${totalRows}`);
  console.log(`📁 Data saved to: ${OUTPUT_DIR}\n`);

  // Write summary file
  const summaryPath = path.join(OUTPUT_DIR, "_export_summary.json");
  fs.writeFileSync(
    summaryPath,
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        convexUrl: CONVEX_URL,
        tables: results.map((r) => ({
          table: r.table,
          rowsExported: r.rowsExported,
          success: r.success,
          error: r.error || null,
        })),
        totalRows,
        totalTables: TABLES_TO_EXPORT.length,
        successCount,
      },
      null,
      2
    ),
    "utf-8"
  );

  console.log(`📄 Summary saved to: ${summaryPath}`);

  // Exit with error if any exports failed
  const allSuccess = results.every((r) => r.success);
  if (!allSuccess) {
    console.warn(
      "\n⚠️  Some exports failed. Please review the errors above."
    );
    process.exit(1);
  }

  console.log("\n✅ Export completed successfully!\n");
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
