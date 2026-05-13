#!/usr/bin/env node
// Strip tenantId from all backend TypeScript files
// Handles: @TenantId() decorators, function params, object shorthand,
// Prisma where clauses, type declarations, etc.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.argv[2];
if (!ROOT) {
  console.error('Usage: node strip-tenantid.mjs <root-dir>');
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

  // === Remove imports ===
  // import { TenantId } from '...'
  s = s.replace(/^import\s*\{\s*TenantId\s*\}\s*from\s*['"][^'"]+['"];?\s*$/gm, '');
  // import { TenantId, X } from '...'  -> import { X } from '...'
  s = s.replace(/import\s*\{([^}]*)\}\s*from\s*(['"][^'"]+['"])/g, (m, names, mod) => {
    const cleaned = names
      .split(',')
      .map(n => n.trim())
      .filter(n => n && n !== 'TenantId')
      .join(', ');
    if (!cleaned) return '';
    return `import { ${cleaned} } from ${mod}`;
  });

  // === Remove @TenantId() decorator usage on parameter lines ===
  // Pattern: `@TenantId() tenantId: string,` (with optional whitespace, trailing comma)
  s = s.replace(/^\s*@TenantId\(\)\s+tenantId\s*:\s*string\s*,?\s*$/gm, '');

  // === Remove tenantId param from function signatures ===
  // `, tenantId: string` or `tenantId: string,` or `tenantId: string`
  // Be careful: multi-line params
  s = s.replace(/,\s*tenantId\s*:\s*string\s*\??/g, '');
  s = s.replace(/\(\s*tenantId\s*:\s*string\s*\??\s*,\s*/g, '(');
  s = s.replace(/\(\s*tenantId\s*:\s*string\s*\??\s*\)/g, '()');

  // === Remove tenantId from destructuring `{ tenantId, foo }` ===
  s = s.replace(/\{\s*tenantId\s*,/g, '{');
  s = s.replace(/,\s*tenantId\s*\}/g, ' }');
  s = s.replace(/\{\s*tenantId\s*\}/g, '{}');

  // === Remove standalone `tenantId,` on its own line (object shorthand) ===
  s = s.replace(/^\s*tenantId\s*,\s*$/gm, '');
  s = s.replace(/^\s*tenantId\s*$/gm, '');

  // === Remove tenantId from inline objects {a, tenantId, b} === (covered by above)

  // === Remove tenantId: <expr> property assignments ===
  // tenantId: someVar,
  s = s.replace(/^\s*tenantId\s*:\s*[^,\n}]+,\s*$/gm, '');
  // tenantId: someVar  (last in object)
  s = s.replace(/,\s*tenantId\s*:\s*[^,\n}]+(\s*\})/g, '$1');
  // tenantId: someVar  (only prop)
  s = s.replace(/\{\s*tenantId\s*:\s*[^,\n}]+\s*\}/g, '{}');

  // === Remove `tenant: { connect: { id: tenantId } }` ===
  s = s.replace(/^\s*tenant\s*:\s*\{\s*connect\s*:\s*\{\s*id\s*:\s*tenantId\s*\}\s*\}\s*,?\s*$/gm, '');
  s = s.replace(/,?\s*tenant\s*:\s*\{\s*connect\s*:\s*\{\s*id\s*:\s*tenantId\s*\}\s*\}/g, '');

  // === Remove tenantId in type/interface declarations ===
  s = s.replace(/^\s*tenantId\??\s*:\s*string\s*;?\s*$/gm, '');

  // === Remove standalone uses of user.tenantId / req.user.tenantId ===
  // These are usually inside calls, harder to clean automatically — best-effort
  s = s.replace(/^\s*(req\.user|user|req\.client)\.tenantId\s*,\s*$/gm, '');

  // === Remove `await this.findOne(id, tenantId);` style calls ===
  s = s.replace(/\(([^)]*?),\s*tenantId\s*\)/g, '($1)');
  s = s.replace(/\(\s*tenantId\s*\)/g, '()');

  // === Clean up empty multi-newlines ===
  s = s.replace(/\n{3,}/g, '\n\n');

  // Count changes
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
