/**
 * Finalize Convex → Supabase Migration
 * 
 * Cleans up after successful migration:
 * 1. Removes Convex-related files and directories
 * 2. Removes Convex dependencies from package.json
 * 3. Cleans up environment variables
 * 4. Runs TypeScript compilation check
 * 5. Removes compatibility shims (optional)
 * 6. Performs smoke tests (optional)
 * 
 * Usage:
 *   npx ts-node scripts/finalize-migration.ts [--remove-shims] [--smoke-test]
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const WORKSPACE = process.cwd();
const ARGS = process.argv.slice(2);
const REMOVE_SHIMS = ARGS.includes("--remove-shims");
const SMOKE_TEST = ARGS.includes("--smoke-test");

interface FinalizationReport {
  timestamp: string;
  actions: {
    name: string;
    success: boolean;
    message: string;
  }[];
  warnings: string[];
  summary: {
    filesRemoved: number;
    dependenciesRemoved: number;
    success: boolean;
  };
}

const report: FinalizationReport = {
  timestamp: new Date().toISOString(),
  actions: [],
  warnings: [],
  summary: {
    filesRemoved: 0,
    dependenciesRemoved: 0,
    success: true,
  },
};

function addAction(name: string, success: boolean, message: string) {
  report.actions.push({ name, success, message });
  if (!success) {
    report.summary.success = false;
  }
}

function logStep(step: string) {
  console.log(`\n📍 ${step}`);
}

function logSuccess(msg: string) {
  console.log(`   ✅ ${msg}`);
}

function logWarning(msg: string) {
  console.log(`   ⚠️  ${msg}`);
  report.warnings.push(msg);
}

function logError(msg: string) {
  console.log(`   ❌ ${msg}`);
}

/**
 * Remove Convex files/directories
 */
function removeConvexFiles() {
  logStep("Removing Convex files and directories...");

  const convexFilesToRemove = [
    "convex", // Entire convex directory
    "convex.env", // Convex environment file
  ];

  const convexFilesInRoot = fs
    .readdirSync(WORKSPACE)
    .filter(
      (f) =>
        f.startsWith("CONVEX") ||
        f.startsWith("PHASE") ||
        f.startsWith("MIGRATION") ||
        f === "deploy.sh"
    );

  for (const file of convexFilesToRemove) {
    const filePath = path.join(WORKSPACE, file);
    try {
      if (fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          fs.rmSync(filePath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(filePath);
        }
        report.summary.filesRemoved++;
        logSuccess(`Removed ${file}`);
        addAction(`Remove ${file}`, true, "Deleted");
      }
    } catch (err) {
      logError(`Failed to remove ${file}: ${(err as Error).message}`);
      addAction(`Remove ${file}`, false, (err as Error).message);
    }
  }
}

/**
 * Remove Convex dependencies from package.json
 */
function removeConvexDependencies() {
  logStep("Removing Convex dependencies...");

  const packageJsonPath = path.join(WORKSPACE, "package.json");

  try {
    const packageJson = JSON.parse(
      fs.readFileSync(packageJsonPath, "utf-8")
    );

    const convexDeps = [
      "convex",
      "convex-helpers",
      "convex-http-router",
      "@convex-stack/convex",
    ];

    let removed = 0;

    // Check dependencies
    if (packageJson.dependencies) {
      for (const dep of convexDeps) {
        if (dep in packageJson.dependencies) {
          delete packageJson.dependencies[dep];
          logSuccess(`Removed dependency: ${dep}`);
          removed++;
          report.summary.dependenciesRemoved++;
        }
      }
    }

    // Check devDependencies
    if (packageJson.devDependencies) {
      for (const dep of convexDeps) {
        if (dep in packageJson.devDependencies) {
          delete packageJson.devDependencies[dep];
          logSuccess(`Removed devDependency: ${dep}`);
          removed++;
          report.summary.dependenciesRemoved++;
        }
      }
    }

    // Write back
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    addAction("Remove Convex dependencies", true, `Removed ${removed} packages`);
  } catch (err) {
    logError(`Failed to update package.json: ${(err as Error).message}`);
    addAction("Remove Convex dependencies", false, (err as Error).message);
  }
}

/**
 * Clean up environment files
 */
function cleanupEnvFiles() {
  logStep("Cleaning up environment files...");

  const envFiles = [".env", ".env.local", ".env.production"];

  for (const file of envFiles) {
    const filePath = path.join(WORKSPACE, file);
    if (fs.existsSync(filePath)) {
      try {
        let content = fs.readFileSync(filePath, "utf-8");

        // Remove Convex env vars
        const convexVarRegex = /^(CONVEX_|VITE_CONVEX_).*\n?/gm;
        const originalLength = content.length;
        content = content.replace(convexVarRegex, "");

        if (content.length < originalLength) {
          fs.writeFileSync(filePath, content);
          logSuccess(`Cleaned ${file} (removed Convex vars)`);
          addAction(`Clean ${file}`, true, "Removed Convex variables");
        }
      } catch (err) {
        logWarning(
          `Could not clean ${file}: ${(err as Error).message}`
        );
      }
    }
  }
}

/**
 * Remove compatibility shims (optional)
 */
function removeCompatibilityShims() {
  if (!REMOVE_SHIMS) {
    return;
  }

  logStep("Removing compatibility shims...");

  const shimsToRemove = [
    "src/convex", // If there are Convex-related shims in src
    "convex/_generated/api.ts", // Already in convex/ to be removed
  ];

  for (const shimPath of shimsToRemove) {
    const fullPath = path.join(WORKSPACE, shimPath);
    if (fs.existsSync(fullPath)) {
      try {
        fs.rmSync(fullPath, { recursive: true, force: true });
        logSuccess(`Removed shim: ${shimPath}`);
        addAction(`Remove shim: ${shimPath}`, true, "Deleted");
      } catch (err) {
        logWarning(`Could not remove ${shimPath}: ${(err as Error).message}`);
      }
    }
  }
}

/**
 * Run TypeScript compilation check
 */
function checkTypeScript() {
  logStep("Running TypeScript compilation check...");

  try {
    execSync("npx tsc --noEmit", { cwd: WORKSPACE, stdio: "pipe" });
    logSuccess("TypeScript compilation successful");
    addAction("TypeScript check", true, "No compilation errors");
  } catch (err) {
    logError("TypeScript compilation failed");
    logError((err as Error).message);
    addAction(
      "TypeScript check",
      false,
      "Compilation errors detected. See above for details."
    );
  }
}

/**
 * Run smoke tests (optional)
 */
function runSmokeTests() {
  if (!SMOKE_TEST) {
    return;
  }

  logStep("Running smoke tests...");

  // Check if test script exists
  const testScriptPath = path.join(WORKSPACE, "scripts", "smoke-test.ts");

  if (!fs.existsSync(testScriptPath)) {
    logWarning("Smoke test script not found. Skipping.");
    addAction("Smoke tests", false, "Test script not found");
    return;
  }

  try {
    execSync(`npx ts-node ${testScriptPath}`, {
      cwd: WORKSPACE,
      stdio: "inherit",
    });
    logSuccess("Smoke tests passed");
    addAction("Smoke tests", true, "All checks passed");
  } catch (err) {
    logError("Smoke tests failed");
    addAction("Smoke tests", false, "One or more tests failed");
  }
}

/**
 * Main finalization flow
 */
async function main() {
  console.log("=" + "=".repeat(59));
  console.log("🚀 CONVEX → SUPABASE MIGRATION FINALIZATION");
  console.log("=" + "=".repeat(59));

  console.log("\n📋 Options:");
  if (REMOVE_SHIMS) console.log("   ✓ Remove compatibility shims");
  if (SMOKE_TEST) console.log("   ✓ Run smoke tests");
  if (!REMOVE_SHIMS && !SMOKE_TEST)
    console.log(
      "   (Use --remove-shims and/or --smoke-test for more options)"
    );

  // Execute finalization steps
  removeConvexFiles();
  removeConvexDependencies();
  cleanupEnvFiles();
  removeCompatibilityShims();
  checkTypeScript();
  runSmokeTests();

  // Print final report
  console.log("\n" + "=".repeat(60));
  console.log("📊 FINALIZATION REPORT");
  console.log("=".repeat(60));

  console.log(`\n✨ Summary:`);
  console.log(
    `   Files removed:      ${report.summary.filesRemoved}`
  );
  console.log(
    `   Dependencies removed: ${report.summary.dependenciesRemoved}`
  );
  console.log(
    `   Warnings:           ${report.warnings.length}`
  );

  if (report.warnings.length > 0) {
    console.log("\n⚠️  Warnings:");
    report.warnings.forEach((w) => console.log(`   - ${w}`));
  }

  const failedActions = report.actions.filter((a) => !a.success);
  if (failedActions.length > 0) {
    console.log("\n❌ Failed Actions:");
    failedActions.forEach((a) => console.log(`   - ${a.name}: ${a.message}`));
  }

  console.log(
    `\n${report.summary.success ? "✅" : "⚠️"} Status: ${
      report.summary.success
        ? "Finalization successful"
        : "Finalization completed with warnings"
    }`
  );

  // Save report
  const reportPath = path.join(
    WORKSPACE,
    `finalization_report_${Date.now()}.json`
  );
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf-8");
  console.log(`\n📄 Report saved: ${reportPath}\n`);

  if (!report.summary.success) {
    console.log(
      "⚠️  Review the report above and address any critical failures before pushing to production.\n"
    );
  }
}

main().catch((err) => {
  console.error("❌ Fatal error during finalization:", err);
  process.exit(1);
});
