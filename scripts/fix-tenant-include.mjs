#!/usr/bin/env node
// Remove orphan tenant: {...} blocks in include/select clauses
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.argv[2];
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === 'dist' || e.name.startsWith('.')) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(e.name) && !e.name.endsWith('.d.ts')) out.push(full);
  }
  return out;
}

const files = walk(ROOT);
let changed = 0;

for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  // Remove tenant: { ... possibly multi-line ... },  including nested braces
  const lines = src.split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const m = line.match(/^(\s*)tenant\s*:\s*\{/);
    if (m) {
      // Skip until matching brace
      let depth = 0;
      let j = i;
      do {
        const l = lines[j];
        for (const ch of l) {
          if (ch === '{') depth++;
          else if (ch === '}') depth--;
        }
        j++;
      } while (j < lines.length && depth > 0);
      i = j;
      continue;
    }
    // tenant: true,
    if (/^\s*tenant\s*:\s*true\s*,?\s*$/.test(line)) {
      i++;
      continue;
    }
    out.push(line);
    i++;
  }
  const newSrc = out.join('\n');
  if (newSrc !== src) {
    fs.writeFileSync(f, newSrc);
    changed++;
  }
}
console.log(`✓ Files changed: ${changed}`);
