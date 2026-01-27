/**
 * Transform Convex JSON to Supabase Schema
 * 
 * Maps Convex export JSON to Supabase table schema:
 * - Preserves original convex_id from _id
 * - Generates new UUIDs for Supabase id column
 * - Converts timestamps to ISO 8601
 * - Handles field name mappings per table
 * 
 * Usage:
 *   npx ts-node scripts/transform-convex-data.ts
 */

import * as fs from "fs";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";

const DATA_DIR = path.join(process.cwd(), "data");
const TRANSFORMED_DIR = path.join(process.cwd(), "data", "transformed");

// Field mappings per table
const TABLE_MAPPINGS: Record<string, Record<string, string[]>> = {
  users: {
    id: ["id"],
    convex_id: ["_id", "convexId"],
    email: ["email"],
    name: ["name", "fullName", "first_name"],
    metadata: ["metadata"],
    created_at: ["_creationTime", "created_at", "signup_date"],
  },
  partners: {
    id: ["id"],
    convex_id: ["_id", "convexId"],
    email: ["email"],
    name: ["name", "company_name"],
    metadata: ["metadata"],
    is_first_login: ["is_first_login", "firstLogin"],
    created_at: ["_creationTime", "created_at"],
  },
  campaigns: {
    id: ["id"],
    convex_id: ["_id", "convexId"],
    partner_id: ["partner_id", "partnerId"],
    name: ["name"],
    description: ["description"],
    status: ["status"],
    metadata: ["metadata"],
    created_at: ["_creationTime", "created_at"],
  },
  transactions: {
    id: ["id"],
    convex_id: ["_id", "convexId"],
    partner_id: ["partner_id", "partnerId"],
    campaign_id: ["campaign_id", "campaignId"],
    amount: ["amount"],
    status: ["status"],
    metadata: ["metadata"],
    created_at: ["_creationTime", "created_at"],
  },
  wallets: {
    id: ["id"],
    convex_id: ["_id", "convexId"],
    partner_id: ["partner_id", "partnerId"],
    balance: ["balance"],
    metadata: ["metadata"],
    created_at: ["_creationTime", "created_at"],
  },
  audit_logs: {
    id: ["id"],
    convex_id: ["_id", "convexId"],
    user_id: ["user_id", "userId"],
    action: ["action"],
    details: ["details"],
    created_at: ["_creationTime", "created_at"],
  },
};

interface TransformResult {
  table: string;
  rowsTransformed: number;
  sampleRecord?: any;
  success: boolean;
  error?: string;
}

/**
 * Find first matching field from source object
 */
function extractField(source: any, fieldCandidates: string[]): any {
  for (const candidate of fieldCandidates) {
    if (source.hasOwnProperty(candidate) && source[candidate] !== undefined) {
      return source[candidate];
    }
  }
  return null;
}

/**
 * Convert Convex timestamp to ISO 8601
 */
function convertTimestamp(value: any): string | null {
  if (!value) return null;
  if (typeof value === "number") {
    return new Date(value).toISOString();
  }
  if (typeof value === "string") {
    // Already ISO or timestamp string
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }
  return null;
}

/**
 * Transform a single row from Convex format to Supabase format
 */
function transformRow(source: any, tableMapping: Record<string, string[]>): any {
  const transformed: any = {};

  // Generate new UUID for id if not present
  transformed.id = source.id || uuidv4();

  // Map each field according to table schema
  for (const [targetField, candidates] of Object.entries(tableMapping)) {
    if (targetField === "id") continue; // Already set

    const value = extractField(source, candidates);

    if (value === null || value === undefined) {
      continue;
    }

    // Special handling for timestamp fields
    if (targetField.includes("created_at") || targetField.includes("updated_at")) {
      transformed[targetField] = convertTimestamp(value);
    } else if (
      targetField.includes("metadata") ||
      (typeof value === "object" && !Array.isArray(value))
    ) {
      // Store complex objects as JSONB
      transformed[targetField] = value;
    } else {
      // Simple field copy
      transformed[targetField] = value;
    }
  }

  return transformed;
}

/**
 * Transform a single table
 */
async function transformTable(
  tableName: string
): Promise<TransformResult> {
  const result: TransformResult = {
    table: tableName,
    rowsTransformed: 0,
    success: false,
  };

  try {
    console.log(`\n🔄 Transforming table: ${tableName}...`);

    const sourceFile = path.join(DATA_DIR, `${tableName}.json`);
    if (!fs.existsSync(sourceFile)) {
      console.warn(`   ⚠️  Source file not found: ${sourceFile}`);
      result.success = true;
      return result;
    }

    // Load source data
    const content = fs.readFileSync(sourceFile, "utf-8");
    const sourceRows = JSON.parse(content);

    if (!Array.isArray(sourceRows)) {
      console.warn(`   ⚠️  Expected array in ${sourceFile}`);
      return result;
    }

    // Get table mapping (or use generic fallback)
    const mapping = TABLE_MAPPINGS[tableName] || TABLE_MAPPINGS.users;

    // Transform each row
    const transformedRows = sourceRows
      .map((row) => transformRow(row, mapping))
      .filter((row) => row !== null);

    // Save transformed data
    const targetFile = path.join(TRANSFORMED_DIR, `${tableName}.json`);
    fs.writeFileSync(
      targetFile,
      JSON.stringify(transformedRows, null, 2),
      "utf-8"
    );

    result.rowsTransformed = transformedRows.length;
    result.sampleRecord = transformedRows[0] || null;
    result.success = true;

    console.log(
      `   ✅ Transformed ${transformedRows.length} rows`
    );
    if (result.sampleRecord) {
      console.log(
        `   📋 Sample: ${JSON.stringify(result.sampleRecord).substring(0, 100)}...`
      );
    }

    return result;
  } catch (err) {
    result.error = err instanceof Error ? err.message : String(err);
    console.error(`   ❌ Transform failed:`, result.error);
    return result;
  }
}

/**
 * Main transformation function
 */
async function main() {
  console.log("🔄 Starting Convex → Supabase Data Transformation...\n");
  console.log(`📂 Source: ${DATA_DIR}`);
  console.log(`📂 Target: ${TRANSFORMED_DIR}\n`);

  // Create transformed directory
  if (!fs.existsSync(TRANSFORMED_DIR)) {
    fs.mkdirSync(TRANSFORMED_DIR, { recursive: true });
    console.log(`📁 Created transformed directory\n`);
  }

  const tables = Object.keys(TABLE_MAPPINGS);
  const results: TransformResult[] = [];

  // Transform each table
  for (const table of tables) {
    const result = await transformTable(table);
    results.push(result);
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 TRANSFORMATION SUMMARY");
  console.log("=".repeat(60));

  let totalTransformed = 0;
  const successCount = results.filter((r) => r.success).length;

  results.forEach((result) => {
    const status = result.success ? "✅" : "❌";
    console.log(
      `${status} ${result.table.padEnd(20)} → ${result.rowsTransformed.toString().padStart(6)} rows`
    );
    totalTransformed += result.rowsTransformed;
  });

  console.log("=".repeat(60));
  console.log(`✅ Successfully transformed: ${successCount}/${results.length} tables`);
  console.log(`📊 Total rows transformed: ${totalTransformed}\n`);

  // Write summary
  const summaryPath = path.join(TRANSFORMED_DIR, "_transform_summary.json");
  fs.writeFileSync(
    summaryPath,
    JSON.stringify(
      {
        transformedAt: new Date().toISOString(),
        tables: results.map((r) => ({
          table: r.table,
          rowsTransformed: r.rowsTransformed,
          success: r.success,
          error: r.error || null,
          sampleRecord: r.sampleRecord,
        })),
        totalTransformed,
        totalTables: tables.length,
        successCount,
      },
      null,
      2
    ),
    "utf-8"
  );

  console.log(`📄 Summary saved: ${summaryPath}\n`);

  const allSuccess = results.every((r) => r.success);
  if (!allSuccess) {
    console.error("⚠️  Some transformations failed.");
    process.exit(1);
  }

  console.log("✅ Transformation completed successfully!\n");
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
