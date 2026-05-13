#!/usr/bin/env node
// Second pass: handle remaining tenantId patterns

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.argv[2];
if (!ROOT) {
  console.error('Usage: node strip-tenantid-2.mjs <root-dir>');
  process.exit(1);
}

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
let totalChanges = 0;
let filesChanged = 0;

function transform(src) {
  let s = src;
  const orig = s;

  // === Remove @TenantId() decorator usages (even with formatting variations) ===
  // Multi-line decorator: `@TenantId() tenantId: string` may have a leading newline
  s = s.replace(/@TenantId\(\)\s+tenantId\s*:\s*string\s*,?\s*\n?/g, '');
  // standalone @TenantId() without param
  s = s.replace(/@TenantId\(\)\s*/g, '');

  // === Remove `where: { id: tenantId }` (looking up Tenant by id) → these queries should likely be deleted entirely, but for now replace ===
  s = s.replace(/where\s*:\s*\{\s*id\s*:\s*tenantId\s*\}/g, 'where: {}');

  // === Remove user.tenantId / req.user.tenantId / data.tenantId / etc. expressions ===
  // In function call arguments: `service.foo(x, user.tenantId!)` → `service.foo(x)`
  // First, handle `, <expr>.tenantId!?` in argument lists
  s = s.replace(/,\s*(req\.user|req\.client|user|data|payroll|wf|lead|folder|bookmark|jobTitle|message|client|currentUser|ctx)\.tenantId!?/g, '');
  s = s.replace(/\(\s*(req\.user|req\.client|user|data|payroll|wf|lead|folder|bookmark|jobTitle|message|client|currentUser|ctx)\.tenantId!?\s*,\s*/g, '(');
  s = s.replace(/\(\s*(req\.user|req\.client|user|data|payroll|wf|lead|folder|bookmark|jobTitle|message|client|currentUser|ctx)\.tenantId!?\s*\)/g, '()');

  // === Remove tenant-mismatch checks: `if (!x || x.tenantId !== tenantId)` → `if (!x)` ===
  s = s.replace(/(\!\w+|\!\!\w+)\s*\|\|\s*\w+\.tenantId\s*!==\s*tenantId/g, '$1');

  // === Remove standalone `x.tenantId !== y` style conditions ===
  s = s.replace(/\s*&&\s*\w+\.tenantId\s*!==\s*tenantId/g, '');
  s = s.replace(/\s*\|\|\s*\w+\.tenantId\s*!==\s*tenantId/g, '');

  // === Remove `data.tenantId` arg in service calls ===
  s = s.replace(/\(data\.tenantId\)/g, '()');

  // === Remove `if (data.tenantId) { ... }` blocks - too risky to auto-delete; convert to dead-code check ===
  // Skipping this for safety

  // === Remove compound key references like `tenantId_type`, `role_permissionId_tenantId`, `tenantId_accountNumber` ===
  // These are Prisma compound unique constraints — the new schema dropped tenantId so the key name changed
  // tenantId_type: { tenantId, type } → type: type
  s = s.replace(/(\w+)_tenantId\s*:\s*\{[^}]+\}/g, ''); // role_permissionId_tenantId blocks
  s = s.replace(/tenantId_(\w+)\s*:\s*\{[^}]+\}/g, ''); // tenantId_accountNumber blocks - need careful handling
  // After removal, fix empty where: {} - but actual content lost; mark with TODO
  s = s.replace(/where\s*:\s*\{\s*,/g, 'where: {');
  s = s.replace(/,\s*\}/g, ' }');

  // === Tests/seeds using `const tenantId = 'tenant-1'` ===
  s = s.replace(/^\s*const\s+tenantId\s*=\s*[^;]+;?\s*$/gm, '');

  // === Remove `tenantId: tenantId` or `tenantId: data.tenantId` assignments anywhere remaining ===
  s = s.replace(/^\s*tenantId\s*:\s*[^,\n}]+,?\s*$/gm, '');
  s = s.replace(/,\s*tenantId\s*:\s*[^,\n}]+/g, '');

  // === Remove `data: { ...data, tenantId, ...}` patterns ===
  s = s.replace(/\.\.\.\s*data\s*,\s*tenantId\s*,/g, '...data,');
  s = s.replace(/,\s*tenantId\s*,/g, ',');

  // === Remove `select: { tenantId: true, ... }` ===
  s = s.replace(/\s*tenantId\s*:\s*true\s*,/g, '');
  s = s.replace(/,\s*tenantId\s*:\s*true/g, '');

  // === Remove `tenant: { select: ... }` from select clauses (already cleaned for fields, this is the relation) ===
  // Be conservative; skip

  // === Path-style usages: `path.join(uploadDir, tenantId, ...)` → `path.join(uploadDir, ...)` ===
  s = s.replace(/,\s*tenantId\s*,/g, ',');
  s = s.replace(/,\s*tenantId\s*\)/g, ')');

  // === Cleanup: empty where: {} from earlier substitutions ===
  s = s.replace(/where:\s*\{\s*,\s*/g, 'where: { ');
  s = s.replace(/\{\s*,/g, '{');

  // === Multi-blank-line cleanup ===
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
