/**
 * Backup Supabase Data
 * 
 * Creates a backup of Supabase data before importing Convex data.
 * Supports two methods:
 * 1. JSON export (via SELECT *) - for quick validation
 * 2. SQL dump - for full recovery capability
 * 
 * Usage:
 *   VITE_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx ts-node scripts/backup-supabase.ts [--dump]
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const USE_DUMP = process.argv.includes("--dump");

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ Missing Supabase credentials.");
  console.error("   Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TABLES = [
  "users",
  "partners",
  "campaigns",
  "transactions",
  "wallets",
  "audit_logs",
];

interface BackupReport {
  timestamp: string;
  method: "json" | "dump";
  backupPath: string;
  tables: {
    [key: string]: {
      rowCount: number;
      backupSize: string;
    };
  };
  totalSize: number;
  totalRows: number;
  duration: number;
  success: boolean;
}

/**
 * Create JSON backup of all tables
 */
async function backupToJson(): Promise<BackupReport> {
  console.log("📦 Creating JSON backup...\n");

  const startTime = Date.now();
  const backupDir = path.join(process.cwd(), `backups/${new Date().getTime()}`);
  const report: BackupReport = {
    timestamp: new Date().toISOString(),
    method: "json",
    backupPath: backupDir,
    tables: {},
    totalSize: 0,
    totalRows: 0,
    success: true,
    duration: 0,
  };

  // Create backup directory
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  for (const table of TABLES) {
    console.log(`📋 Backing up ${table}...`);

    try {
      let allData: any[] = [];
      let page = 0;
      const pageSize = 1000;

      // Paginate through all rows
      while (true) {
        const { data, error, count } = await supabaseAdmin
          .from(table)
          .select("*", { count: "exact" })
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
          console.error(`   ❌ Error backing up ${table}:`, error.message);
          report.success = false;
          break;
        }

        if (!data || data.length === 0) break;

        allData = allData.concat(data);
        page++;

        console.log(
          `   ✓ Fetched ${data.length} rows (page ${page}, total: ${allData.length})`
        );
      }

      // Write to file
      const filePath = path.join(backupDir, `${table}.json`);
      const jsonData = JSON.stringify(allData, null, 2);
      fs.writeFileSync(filePath, jsonData, "utf-8");

      const fileSize = Buffer.byteLength(jsonData, "utf-8");
      const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);

      report.tables[table] = {
        rowCount: allData.length,
        backupSize: `${fileSizeMB} MB`,
      };

      report.totalRows += allData.length;
      report.totalSize += fileSize;

      console.log(
        `   ✅ Backed up ${allData.length} rows → ${filePath}`
      );
    } catch (err) {
      console.error(
        `   ❌ Error processing ${table}:`,
        (err as Error).message
      );
      report.success = false;
    }
  }

  // Create metadata file
  const metaPath = path.join(backupDir, "_backup_meta.json");
  fs.writeFileSync(metaPath, JSON.stringify(report, null, 2), "utf-8");

  report.duration = Date.now() - startTime;

  return report;
}

/**
 * Create SQL dump backup (for advanced recovery)
 */
async function backupToSqlDump(): Promise<BackupReport> {
  console.log("💾 Creating SQL dump backup...\n");
  console.log("   ℹ️  SQL dumps require pg_dump command-line tool");
  console.log("   ℹ️  For now, using JSON export instead\n");

  // For now, fall back to JSON
  // In production, you'd call pg_dump via execSync with proper credentials
  return backupToJson();
}

/**
 * Main backup function
 */
async function main() {
  console.log("=" + "=".repeat(59));
  console.log("💾 SUPABASE BACKUP");
  console.log("=" + "=".repeat(59) + "\n");

  const report = USE_DUMP
    ? await backupToSqlDump()
    : await backupToJson();

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("✅ BACKUP REPORT");
  console.log("=".repeat(60));

  console.log(`\n📍 Backup Location: ${report.backupPath}`);
  console.log(`📊 Total Rows: ${report.totalRows}`);
  console.log(`📦 Total Size: ${(report.totalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`⏱️  Duration: ${report.duration}ms\n`);

  console.log("📋 Table Breakdown:");
  for (const [table, info] of Object.entries(report.tables)) {
    console.log(
      `   ${table.padEnd(20)} → ${info.rowCount.toString().padStart(6)} rows (${info.backupSize})`
    );
  }

  console.log(
    `\n${report.success ? "✅" : "⚠️"} Status: ${
      report.success ? "Backup successful" : "Backup completed with errors"
    }`
  );

  // Save report to root
  const reportPath = path.join(process.cwd(), `backup_report_${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf-8");
  console.log(`📄 Report saved: ${reportPath}\n`);

  if (!report.success) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
