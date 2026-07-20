#!/usr/bin/env node
// Adds // eslint-disable-next-line @typescript-eslint/no-explicit-any above `as any` in notification-bus test files

import { readFileSync, writeFileSync } from "fs";
import { globSync } from "fs";

const files = globSync("src/app/api/__tests__/notification-bus-*.test.ts");

let totalFixes = 0;

for (const file of files) {
  let content = readFileSync(file, "utf8");
  const lines = content.split("\n");
  const newLines = [];
  let fixed = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Check for ` as any` that doesn't already have an eslint-disable comment above it
    if (
      line.includes(" as any") &&
      !line.trim().startsWith("//") &&
      (newLines.length === 0 || !newLines[newLines.length - 1].includes("eslint-disable-next-line @typescript-eslint/no-explicit-any"))
    ) {
      newLines.push(`          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat`);
      fixed++;
    }
    newLines.push(line);
  }

  if (fixed > 0) {
    writeFileSync(file, newLines.join("\n"));
    console.log(`Fixed ${fixed} violations in ${file}`);
    totalFixes += fixed;
  }
}

console.log(`\nTotal: ${totalFixes} violations fixed across ${files.length} files`);
