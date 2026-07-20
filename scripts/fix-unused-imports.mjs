#!/usr/bin/env node

/**
 * Batch-fix @typescript-eslint/no-unused-vars violations that are unused imports.
 * Handles multi-line import blocks properly.
 *
 * Usage: node scripts/fix-unused-imports.mjs
 *
 * Approach:
 * 1. Gets all files with no-unused-vars violations via ESLint
 * 2. For each file, reads it and finds import statements (including multi-line)
 * 3. For each unused variable name reported by ESLint, removes it from imports
 * 4. Removes empty import statements (import {} from "..." or import { } from "...")
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync, existsSync } from "fs";

const PROJECT_ROOT = process.cwd();

// 1. Get all files with violations
console.log("Getting ESLint violations...");
const eslintOutput = execSync(
  `npx eslint . --format json 2>/dev/null`,
  { encoding: "utf8", cwd: PROJECT_ROOT, maxBuffer: 10 * 1024 * 1024 }
);
const results = JSON.parse(eslintOutput);

// 2. Build map: filePath -> set of unused variable names
const fileUnusedNames = {};
const fileUnusedLines = {}; // file -> Map of line -> {name, isImport}

let totalViolations = 0;
for (const file of results) {
  const path = file.filePath;
  if (!existsSync(path)) continue;

  const unusedVars = file.messages.filter(
    (m) => m.ruleId === "@typescript-eslint/no-unused-vars"
  );
  if (unusedVars.length === 0) continue;

  if (!fileUnusedNames[path]) fileUnusedNames[path] = new Set();
  if (!fileUnusedLines[path]) fileUnusedLines[path] = new Map();

  for (const v of unusedVars) {
    const nameMatch = v.message.match(/^'([^']+)'/);
    if (!nameMatch) continue;
    const name = nameMatch[1];
    fileUnusedNames[path].add(name);

    // Check if this line looks like an import
    const lineIdx = v.line - 1;
    try {
      const content = readFileSync(path, "utf8");
      const line = content.split("\n")[lineIdx] || "";
      const isImport = line.includes("import ") || line.includes("from ");
      fileUnusedLines[path].set(v.line, { name, isImport, line });
    } catch {
      // skip
    }
    totalViolations++;
  }
}

console.log(`Found ${totalViolations} violations across ${Object.keys(fileUnusedNames).length} files`);

// 3. Process each file
let fixedCount = 0;
let skippedCount = 0;

for (const [filePath, unusedNames] of Object.entries(fileUnusedNames)) {
  let content;
  try {
    content = readFileSync(filePath, "utf8");
  } catch {
    skippedCount += unusedNames.size;
    continue;
  }

  const originalContent = content;
  let modifiedContent = content;

  // For each unused name, try to remove it from import statements
  for (const name of unusedNames) {
    // Pattern 1: Single-line named import: import { A, B, C } from "..."
    // Pattern 2: Multi-line named import (handle the full block)
    // Pattern 3: import type { A } from "..." 
    // We'll find the import statement containing this name
    
    // Try to find the import statement containing this name
    const importRegex = new RegExp(
      `import\\s+(?:type\\s+)?\\{[^}]*?\\b${escapeRegex(name)}\\b[^}]*?\\}\\s*from\\s+["']`,
      's' // dotAll flag to match across lines
    );
    
    const match = modifiedContent.match(importRegex);
    if (!match) {
      // Maybe it's in a destructured import like `import { A as B, C }` where `B` is unused
      // Or maybe it's not an import at all (like a variable assignment)
      skippedCount++;
      continue;
    }

    const matchedText = match[0];
    
    // Extract the content inside { ... }
    const braceContent = matchedText.match(/\{([^}]*)\}/)?.[1];
    if (!braceContent) continue;

    // Split by comma, process each item
    const items = braceContent.split(",").map(s => s.trim()).filter(s => s);
    const newItems = items.filter(item => {
      // Handle `as` aliases: `Foo as Bar` -> the variable name is `Bar`
      const parts = item.split(/\s+as\s+/);
      const varName = parts.length > 1 ? parts[1].trim() : parts[0].trim();
      return varName !== name;
    });

    if (newItems.length === items.length) {
      // Name wasn't in the brace content - skip
      skippedCount++;
      continue;
    }

    // Rebuild the import statement
    if (newItems.length === 0) {
      // Remove the entire import statement
      // Find the full import statement (may span multiple lines)
      const fullImportRegex = new RegExp(
        `import\\s+(?:type\\s+)?\\{[^}]*?\\}\\s*from\\s+["'][^"']*["'];?\\s*\\n?`,
        's'
      );
      modifiedContent = modifiedContent.replace(fullImportRegex, "");
    } else {
      // Replace the content inside { ... }
      const newBraceContent = newItems.join(",\n  ");
      const importWithoutBrace = matchedText.replace(/\{[^}]*\}/, `{\n  ${newBraceContent}\n}`);
      modifiedContent = modifiedContent.replace(matchedText, importWithoutBrace);
    }
    fixedCount++;
  }

  if (modifiedContent !== originalContent) {
    writeFileSync(filePath, modifiedContent, "utf8");
  }
}

console.log(`Fixed: ${fixedCount}, Skipped (not import or couldn't parse): ${skippedCount}`);
console.log("Done!");

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
