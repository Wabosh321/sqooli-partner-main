// generate_schema_report.js
// Parses final_database_schema.sql and generates a readable markdown report
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseSqlSchema(sqlContent) {
  const tables = [];
  const functions = [];
  
  // Find all CREATE TABLE statements - use simpler parsing
  const lines = sqlContent.split('\n');
  let currentTable = null;
  let inTableDef = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Match CREATE TABLE
    const tableMatch = trimmed.match(/^CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+(\w+)/i);
    if (tableMatch) {
      currentTable = {
        name: tableMatch[1],
        columns: []
      };
      inTableDef = true;
      continue;
    }
    
    // End of table definition
    if (inTableDef && trimmed === ');') {
      if (currentTable) {
        tables.push(currentTable);
      }
      currentTable = null;
      inTableDef = false;
      continue;
    }
    
    // Parse columns if in table definition
    if (inTableDef && currentTable && trimmed && !trimmed.startsWith('--') && !trimmed.startsWith('PRIMARY') && !trimmed.startsWith('CONSTRAINT')) {
      const colMatch = trimmed.match(/^(\w+)\s+(\w+(?:\[\])?(?:\s*,)?)/);
      if (colMatch) {
        let extras = [];
        if (trimmed.includes('PRIMARY KEY')) extras.push('PK');
        if (trimmed.includes('UNIQUE')) extras.push('UNIQUE');
        if (trimmed.includes('NOT NULL')) extras.push('NOT NULL');
        if (trimmed.includes('REFERENCES')) extras.push('FK');
        if (trimmed.includes('DEFAULT')) extras.push('DEFAULT');
        
        currentTable.columns.push({
          name: colMatch[1],
          type: colMatch[2].replace(',', '').trim(),
          extras: extras.join(', ')
        });
      }
    }
  }
  
  // Find CREATE FUNCTION statements
  const funcLines = sqlContent.match(/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+\w+[^;]*;/gi) || [];
  for (const funcDef of funcLines) {
    const match = funcDef.match(/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+(\w+)\s*\((.*?)\)\s+RETURNS\s+(\w+)/i);
    if (match) {
      functions.push({
        name: match[1],
        args: match[2] || '',
        returns: match[3],
        body: ''
      });
    }
  }
  
  return { tables, functions };
}

function generateMarkdown(schema) {
  let md = `# Supabase Database Schema Report\n\n`;
  md += `Generated: ${new Date().toISOString()}\n`;
  md += `Source: final_database_schema.sql\n\n`;
  
  // Tables
  if (schema.tables && schema.tables.length) {
    md += `## Tables (${schema.tables.length})\n\n`;
    for (const table of schema.tables) {
      md += `### ${table.name}\n\n`;
      
      if (table.columns && table.columns.length) {
        md += `| Name | Type | Extras |\n`;
        md += `|---|---|---|\n`;
        for (const col of table.columns) {
          md += `| ${col.name} | ${col.type} | ${col.extras || '-'} |\n`;
        }
        md += `\n`;
      }
    }
  }
  
  // Functions
  if (schema.functions && schema.functions.length) {
    md += `## Functions (${schema.functions.length})\n\n`;
    for (const fn of schema.functions) {
      md += `### ${fn.name}(${fn.args})\n\n`;
      md += `- **Returns:** ${fn.returns}\n\n`;
      if (fn.body) {
        md += `\`\`\`sql\n${fn.body}\n\`\`\`\n\n`;
      }
    }
  }
  
  return md;
}

(async () => {
  try {
    const sqlPath = path.join(__dirname, 'final_database_schema.sql');
    console.log('Reading SQL schema from:', sqlPath);
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
    
    console.log('Parsing schema...');
    const schema = parseSqlSchema(sqlContent);
    
    console.log(`Found ${schema.tables.length} tables and ${schema.functions.length} functions`);
    
    const md = generateMarkdown(schema);
    const outPath = path.join(__dirname, 'supabase_schema_report.md');
    fs.writeFileSync(outPath, md);
    
    console.log(`✅ Wrote comprehensive schema report to ${outPath}`);
    console.log(`\nSummary:\n- Tables: ${schema.tables.length}\n- Functions: ${schema.functions.length}`);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(2);
  }
})();
