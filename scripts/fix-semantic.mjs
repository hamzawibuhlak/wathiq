#!/usr/bin/env node
// Fix semantic errors: dangling prisma.tenant calls, include:{tenant}, etc.
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
let filesChanged = 0;

function transform(src) {
  let s = src;
  const orig = s;

  // === Remove include: { tenant: ... } blocks ===
  // Multi-line: include: {\n  tenant: { select: {...} },\n  ... } - replace tenant prop
  s = s.replace(/^\s*tenant\s*:\s*\{[^}]*\}\s*,?\s*$/gm, '');
  s = s.replace(/^\s*tenant\s*:\s*true\s*,?\s*$/gm, '');

  // === Remove user.tenant / *.tenant property access in destructuring & access ===
  // `const { tenant, ...rest } = user` → `const { ...rest } = user`
  s = s.replace(/\{\s*tenant\s*,/g, '{');
  s = s.replace(/,\s*tenant\s*\}/g, ' }');
  s = s.replace(/\{\s*tenant\s*\}/g, '{}');

  // === Remove .tenant property access lines that are isolated ===
  // Avoid removing valid code; only target patterns like `user.tenant.something`
  // Replace `xxxx.tenant?.id` with `null`
  s = s.replace(/\w+\.tenant\?\.id/g, 'null');
  s = s.replace(/\w+\.tenant\.id/g, 'null');
  s = s.replace(/\w+\.tenant\?\.\w+/g, 'null');
  s = s.replace(/\w+\.tenant\.\w+/g, 'null');

  // === Remove prisma.tenant.findUnique/findFirst/create/etc calls ===
  // These return undefined now. Replace with dummy result.
  s = s.replace(/await\s+this\.prisma\.tenant\.\w+\(\{[^}]*\}\)/g, 'null');
  s = s.replace(/this\.prisma\.tenant\.\w+\(\{[^}]*\}\)/g, 'null');

  // === Remove `role === UserRole.SUPER_ADMIN` checks ===
  s = s.replace(/\w+\.role\s*===\s*UserRole\.SUPER_ADMIN/g, 'false');
  s = s.replace(/\w+\s*===\s*UserRole\.SUPER_ADMIN/g, 'false');
  s = s.replace(/UserRole\.SUPER_ADMIN\s*===\s*\w+(\.\w+)?/g, 'false');

  // === Remove role === 'SUPER_ADMIN' string checks ===
  s = s.replace(/\w+(\.\w+)?\s*===\s*['"]SUPER_ADMIN['"]/g, 'false');

  // === Remove `select: { tenant: ... }` ===
  // Already handled above

  if (s !== orig) {
    filesChanged++;
    return s;
  }
  return src;
}

for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const out = transform(src);
  if (out !== src) fs.writeFileSync(f, out);
}

console.log(`✓ Files changed: ${filesChanged}`);
