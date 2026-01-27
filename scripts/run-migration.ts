/**
 * Phase 4: Complete Convex → Supabase Migration Workflow
 * 
 * Orchestrates the full data migration in a single command:
 * 1. Export Convex tables to JSON
 * 2. Transform JSON to Supabase schema
 * 3. Backup existing Supabase data
 * 4. Import transformed data to Supabase
 * 5. Verify import integrity
 * 6. Finalize migration (optional: remove Convex files)
 * 
 * Prerequisites:
 *   - Supabase project created with schema applied
 *   - Convex project accessible and populated
 *   - Environment variables set:
 *     VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *     VITE_CONVEX_URL (optional, for Convex exports)
 * 
 * Usage:
 *   npx ts-node scripts/run-migration.ts [options]
 * 
 * Options:
 *   --skip-backup        Don't create Supabase backup (not recommended)
 *   --skip-export        Use existing export/ directory
 *   --skip-transform     Use existing transformed/ directory
 *   --skip-verify        Don't verify after import
 *   --no-finalize        Don't remove Convex files
 *   --remove-shims       Also remove compatibility shims during finalize
 *   --smoke-test         Run smoke tests after finalize
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const WORKSPACE = process.cwd();
const ARGS = process.argv.slice(2);

interface MigrationStep {
  name: string;
  command: string;
  optional: boolean;
  skip: boolean;
}

const steps: MigrationStep[] = [
  {
    name: "Export Convex Data",
    command: "npx ts-node scripts/export-convex-data.ts",
    optional: false,
    skip: ARGS.includes("--skip-export"),
  },
  {
    name: "Transform to Supabase Schema",
    command: "npx ts-node scripts/transform-convex-data.ts",
    optional: false,
    skip: ARGS.includes("--skip-transform"),
  },
  {
    name: "Backup Supabase Data",
    command: "npx ts-node scripts/backup-supabase.ts",
    optional: true,
    skip: ARGS.includes("--skip-backup"),
  },
  {
    name: "Import to Supabase",
    command: "npx ts-node scripts/import-to-supabase.ts",
    optional: false,
    skip: false,
  },
  {
    name: "Verify Import",
    command: "npx ts-node scripts/verify-migration.ts",
    optional: true,
    skip: ARGS.includes("--skip-verify"),
  },
];

const finalizationCommand = `npx ts-node scripts/finalize-migration.ts${
  ARGS.includes("--remove-shims") ? " --remove-shims" : ""
}${ARGS.includes("--smoke-test") ? " --smoke-test" : ""}`;

interface MigrationReport {
  timestamp: string;
  steps: {
    name: string;
    success: boolean;
    duration: number;
    error?: string;
  }[];
  finalization?: {
    success: boolean;
    duration: number;
    error?: string;
  };
  summary: {
    totalSteps: number;
    successful: number;
    failed: number;
    totalDuration: number;
  };
}

const report: MigrationReport = {
  timestamp: new Date().toISOString(),
  steps: [],
  summary: {
    totalSteps: steps.length,
    successful: 0,
    failed: 0,
    totalDuration: 0,
  },
};

function logHeader(text: string) {
  console.log("\n" + "=".repeat(60));
  console.log(text);
  console.log("=".repeat(60));
}

function logStep(step: number, name: string) {
  console.log(`\n🔹 [${step}/${steps.length}] ${name}`);
}

function logSuccess(msg: string) {
  console.log(`✅ ${msg}`);
}

function logError(msg: string) {
  console.log(`❌ ${msg}`);
}

async function runStep(
  step: MigrationStep,
  index: number
): Promise<boolean> {
  if (step.skip) {
    console.log(`   ⏭️  Skipped`);
    return true;
  }

  logStep(index + 1, step.name);

  const startTime = Date.now();

  try {
    console.log(`   Running: ${step.command}`);
    execSync(step.command, {
      cwd: WORKSPACE,
      stdio: "inherit",
    });

    const duration = Date.now() - startTime;
    report.steps.push({
      name: step.name,
      success: true,
      duration,
    });

    report.summary.successful++;
    report.summary.totalDuration += duration;

    logSuccess(`Completed in ${(duration / 1000).toFixed(2)}s`);
    return true;
  } catch (err) {
    const duration = Date.now() - startTime;
    const errorMsg = (err as Error).message || String(err);

    report.steps.push({
      name: step.name,
      success: false,
      duration,
      error: errorMsg,
    });

    report.summary.failed++;
    report.summary.totalDuration += duration;

    logError(`Failed: ${errorMsg}`);

    // Ask user if they want to continue or abort
    if (!step.optional) {
      console.log("\n⚠️  This is a critical step. Migration aborted.");
      return false;
    } else {
      console.log("\n⚠️  This is an optional step. Continuing...");
      return true;
    }
  }
}

async function runFinalization(): Promise<boolean> {
  if (ARGS.includes("--no-finalize")) {
    console.log("\n   ⏭️  Finalization skipped (use --remove-shims or --smoke-test to enable)");
    return true;
  }

  logStep(steps.length + 1, "Finalize Migration");
  console.log(`   Running: ${finalizationCommand}`);

  const startTime = Date.now();

  try {
    execSync(finalizationCommand, {
      cwd: WORKSPACE,
      stdio: "inherit",
    });

    const duration = Date.now() - startTime;
    report.finalization = {
      success: true,
      duration,
    };

    report.summary.totalDuration += duration;

    logSuccess(`Completed in ${(duration / 1000).toFixed(2)}s`);
    return true;
  } catch (err) {
    const duration = Date.now() - startTime;
    const errorMsg = (err as Error).message || String(err);

    report.finalization = {
      success: false,
      duration,
      error: errorMsg,
    };

    report.summary.totalDuration += duration;

    logError(`Failed: ${errorMsg}`);
    return false;
  }
}

async function main() {
  logHeader("🚀 CONVEX → SUPABASE MIGRATION WORKFLOW");

  console.log("\n📋 Migration Plan:");
  steps.forEach((s, i) => {
    const status = s.skip ? "⏭️  SKIP" : s.optional ? "✓ OPTIONAL" : "✓ REQUIRED";
    console.log(`   [${i + 1}] ${s.name.padEnd(30)} ${status}`);
  });

  const doFinalize = !ARGS.includes("--no-finalize");
  console.log(
    `   [${steps.length + 1}] Finalize Migration${!doFinalize ? " (SKIPPED)" : " "}`.padEnd(
      40
    )
  );

  console.log("\n🔄 Starting migration...");

  // Run each step
  let success = true;
  for (let i = 0; i < steps.length; i++) {
    if (!(await runStep(steps[i], i))) {
      success = false;
      break;
    }
  }

  // Finalization
  if (success) {
    if (!(await runFinalization())) {
      success = false;
    }
  }

  // Final report
  logHeader("📊 MIGRATION REPORT");

  console.log(`\n⏱️  Total Duration: ${(report.summary.totalDuration / 1000).toFixed(2)}s`);
  console.log(`\n✅ Successful: ${report.summary.successful}/${report.summary.totalSteps}`);
  console.log(`❌ Failed: ${report.summary.failed}/${report.summary.totalSteps}`);

  if (report.steps.some((s) => !s.success)) {
    console.log("\n⚠️  Failed Steps:");
    report.steps
      .filter((s) => !s.success)
      .forEach((s) => {
        console.log(`   - ${s.name}: ${s.error}`);
      });
  }

  // Save final report
  const reportPath = path.join(WORKSPACE, `migration_report_${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf-8");
  console.log(`\n📄 Full report: ${reportPath}`);

  if (success) {
    console.log("\n" + "=".repeat(60));
    console.log("🎉 MIGRATION COMPLETE!");
    console.log("=".repeat(60));
    console.log(
      "\n✨ Your Convex data has been successfully migrated to Supabase."
    );
    console.log("✨ Review the reports above and test your application thoroughly.\n");
  } else {
    console.log(
      "\n⚠️  Migration encountered errors. Review the report and fix issues before retrying.\n"
    );
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
