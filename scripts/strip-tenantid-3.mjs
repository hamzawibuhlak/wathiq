#!/usr/bin/env node
// Third pass: remaining stubborn patterns

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.argv[2];
function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|js|mjs)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) out.push(full);
  }
  return out;
}

const files = walk(ROOT);
let totalChanges = 0, filesChanged = 0;

function transform(src) {
  let s = src;
  const orig = s;

  // === Comments mentioning tenantId — keep them but strip the tenantId word, or remove single-line comments ===
  s = s.replace(/^\s*\/\/[^\n]*tenantId[^\n]*\n/gm, '');
  s = s.replace(/^\s*\*[^\n]*tenantId[^\n]*\n/gm, '');

  // === @CurrentUser('tenantId') tenantId: string,  → remove entire param ===
  s = s.replace(/@CurrentUser\(['"]tenantId['"]\)\s+tenantId\s*:\s*string\s*,?\s*\n?/g, '');

  // === Optional tenantId params: `tenantId?: string` ===
  s = s.replace(/,\s*tenantId\??\s*:\s*string\s*\??/g, '');
  s = s.replace(/\(\s*tenantId\??\s*:\s*string\s*\??\s*,?\s*\)/g, '()');
  s = s.replace(/\(\s*tenantId\??\s*:\s*string\s*\??\s*,\s*/g, '(');

  // === Service call: service.findAll(tenantId, ...) → service.findAll(...) ===
  s = s.replace(/(\w+\.\w+)\(\s*tenantId\s*,\s*/g, '$1(');
  s = s.replace(/(\w+\.\w+)\(\s*tenantId\s*\)/g, '$1()');
  // Same for this.foo(tenantId, ...)
  s = s.replace(/this\.(\w+)\(\s*tenantId\s*,\s*/g, 'this.$1(');
  s = s.replace(/this\.(\w+)\(\s*tenantId\s*\)/g, 'this.$1()');

  // === socket.data.tenantId / client.data.tenantId conditions ===
  s = s.replace(/^\s*if\s*\(\s*socket\.data\?.tenantId\s*===\s*tenantId\s*\)\s*\{[^}]*\}\s*$/gm, '');
  s = s.replace(/^\s*client\.data\.tenantId\s*=\s*tenantId\s*;?\s*$/gm, '');
  s = s.replace(/^\s*if\s*\(\s*!userId\s*\|\|\s*!tenantId\s*\)\s*\{[^}]*\}\s*$/gm, '');

  // === ?.tenantId || '' patterns in object building - replace with '' ===
  s = s.replace(/\?\.tenantId\s*\|\|\s*['"]['"]/g, "?.id || ''");

  // === where: { id: data.tenantId } → just remove the where ===
  s = s.replace(/where\s*:\s*\{\s*id\s*:\s*data\.tenantId\s*\}/g, 'where: {}');

  // === Bare `tenantId` standalone identifier in expressions — risky, skip ===

  // === Remove `tenantId: '...'` literal assignments in seeds/tests ===
  s = s.replace(/^\s*tenantId\s*:\s*['"][^'"]*['"]\s*,?\s*\n/gm, '');

  // === logSearch(tenantId, ...) ===
  s = s.replace(/logSearch\(\s*tenantId\s*,\s*/g, 'logSearch(');

  // === Map<string, ...> where key was tenantId ===
  // Best-effort: leave as is

  // === Multi-blank cleanup ===
  s = s.replace(/\n{3,}/g, '\n\n');

  if (s !== orig) {
    const before = (orig.match(/tenantId/g) || []).length;
    const after = (s.match(/tenantId/g) || []).length;
    totalChanges += (before - after);
  }
  return s;
}

for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  if (!src.includes('tenantId') && !src.includes('TenantId')) continue;
  const out = transform(src);
  if (out !== src) {
    fs.writeFileSync(f, out);
    filesChanged++;
  }
}

console.log(`✓ Files changed: ${filesChanged}`);
console.log(`✓ tenantId references removed: ${totalChanges}`);
