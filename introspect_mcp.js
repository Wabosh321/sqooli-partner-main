// introspect_mcp.js
// Usage: node introspect_mcp.js (reads from .env.local)
import fs from "fs";
import https from "https";
import dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

const projectRef = "heqsfgmrosuupxahdtda";
const supabaseUrl =
  process.env.VITE_SUPABASE_URL || `https://${projectRef}.supabase.co`;
const key =
  process.env.SUPABASE_MCP_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) {
  console.error(
    "Missing SUPABASE_MCP_KEY or SUPABASE_SERVICE_ROLE_KEY env var."
  );
  process.exit(1);
}

function fetchJson(url, headers) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      let body = "";
      res.on("data", (d) => (body += d));
      res.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch (err) {
          reject(
            new Error("Invalid JSON response: " + err.message + "\n" + body)
          );
        }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

function renderMarkdown(schema) {
  let md = `# Supabase MCP Schema Report\n\n`;
  md += `Generated: ${new Date().toISOString()}\n\n`;

  // Tables
  const tables =
    schema.tables ||
    schema._tables ||
    schema.database?.tables ||
    schema.schema?.tables ||
    [];
  if (tables && tables.length) {
    md += `## Tables (${tables.length})\n\n`;
    for (const t of tables) {
      const name = t.name || t.table_name || t.table;
      md += `### ${name}\n\n`;
      const columns = t.columns || t.columns_info || t.fields || [];
      if (columns.length) {
        md += `- **Columns:**\n\n`;
        md += `| Name | Type | Nullable | Default | Extras |\n|---|---|---|---|---|\n`;
        for (const c of columns) {
          const colName = c.name || c.column_name || c.field;
          const colType = c.type || c.data_type || c.pg_type || "";
          const nullable =
            "nullable" in c
              ? String(c.nullable)
              : c.is_nullable || c.nullable === undefined
                ? c.is_nullable || ""
                : "";
          const def = c.default || c.column_default || "";
          let extras = [];
          if (
            (t.primary_keys || []).includes(colName) ||
            (t.primary_key &&
              t.primary_key.includes &&
              t.primary_key.includes(colName))
          )
            extras.push("PK");
          if (
            (t.foreign_keys || []).some(
              (f) =>
                f.column === colName ||
                (f.columns && f.columns.includes && f.columns.includes(colName))
            )
          )
            extras.push("FK");
          md += `| ${colName} | ${colType} | ${nullable} | ${def} | ${extras.join(", ")} |\n`;
        }
        md += `\n`;
      } else {
        md += `- No columns found in response for this table.\n\n`;
      }

      // Primary keys
      const pks = t.primary_keys || t.primary_key || [];
      if (pks && pks.length) {
        md += `- **Primary Keys:** ${Array.isArray(pks) ? pks.join(", ") : pks}\n\n`;
      }

      // Foreign keys
      const fks = t.foreign_keys || t.foreign_key || [];
      if (fks && fks.length) {
        md += `- **Foreign Keys:**\n\n`;
        for (const fk of fks) {
          // normalize
          const col =
            fk.column ||
            fk.columns ||
            (fk.local_columns && fk.local_columns.join(", "));
          const ref =
            fk.references ||
            fk.target ||
            `${fk.referenced_table || fk.foreign_table}.${fk.referenced_column || fk.foreign_column || ""}`;
          md += `  - ${Array.isArray(col) ? col.join(", ") : col} → ${Array.isArray(ref) ? ref.join(", ") : ref}\n`;
        }
        md += `\n`;
      }
    }
  } else {
    md += `## Tables: none found in response.\n\n`;
  }

  // Functions
  const functionsArr =
    schema.functions || schema.routines || schema.procedures || [];
  if (functionsArr && functionsArr.length) {
    md += `## Functions (${functionsArr.length})\n\n`;
    for (const fn of functionsArr) {
      const fname = fn.name || fn.routine_name || fn.function_name;
      const ret = fn.return_type || fn.returns || "";
      const args =
        fn.arguments || fn.params || fn.parameters || fn.arg_types || [];
      md += `### ${fname}\n\n`;
      if (args && args.length) {
        md += `- **Args:** ${Array.isArray(args) ? args.map((a) => (typeof a === "string" ? a : a.name ? `${a.name} ${a.type || a.data_type || ""}` : JSON.stringify(a))).join(", ") : args}\n\n`;
      }
      md += `- **Returns:** ${ret}\n\n`;
      if (fn.definition || fn.body || fn.sql) {
        md +=
          "```sql\n" +
          (fn.definition || fn.body || fn.sql).slice(0, 2000) +
          "\n```\n\n";
      }
    }
  } else {
    md += `## Functions: none found in response.\n\n`;
  }

  // Raw fallback: include top-level keys summary
  md += `---\n\n`;
  md += `## Raw response keys\n\n`;
  md +=
    Object.keys(schema)
      .map((k) => `- ${k}`)
      .join("\n") + "\n";

  return md;
}

(async () => {
  try {
    const headers = {
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    // Try MCP endpoint first
    console.log("Fetching schema from MCP endpoint...");
    const mcpUrl = `https://mcp.supabase.com/mcp?project_ref=${projectRef}`;
    let schema;
    try {
      schema = await fetchJson(mcpUrl, headers);
      console.log("Raw response from MCP:", JSON.stringify(schema, null, 2));
      if (schema.message && schema.message.includes("JWT")) {
        throw new Error("JWT verification failed, trying REST API...");
      }
    } catch (mcpErr) {
      console.log("MCP endpoint failed, trying Management API...");
      // Try Supabase Management API
      const mgmtUrl = `https://api.supabase.com/v1/projects/${projectRef}/database/tables`;
      const mgmtHeaders = {
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      };
      schema = await fetchJson(mgmtUrl, mgmtHeaders);
      console.log(
        "Raw response from Management API:",
        JSON.stringify(schema, null, 2)
      );
    }

    const md = renderMarkdown(schema);
    const out = "supabase_schema_report.md";
    fs.writeFileSync(out, md);
    console.log("Wrote", out);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(2);
  }
})();
