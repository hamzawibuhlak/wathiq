#!/usr/bin/env node
// Fix syntax errors introduced by tenantId stripping
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

  // Empty `${}` template interpolations - remove the empty placeholder
  s = s.replace(/\$\{\s*\}/g, '');

  // `if ()` empty condition - replace with `if (false)` to disable the block
  s = s.replace(/\bif\s*\(\s*\)\s*\{/g, 'if (false) {');

  // `where: {},` from collapsed Prisma where clauses on findUnique - dangerous, leave for now
  // Orphan `,` on its own line right after `} });` or `}` block end
  s = s.replace(/\}\s*\}\)\s*;\s*\n\s*,\s*\n/g, '} });\n');
  s = s.replace(/\}\)\s*;\s*\n\s*,\s*\n/g, '});\n');

  // Orphan dangling block from `if (X.tenantId) { update(...) }` becoming orphan `, data: {...} });`
  // Remove orphan ",\n    data: {" patterns followed by orphan } });
  // This is risky; skip and let manual fixing handle.

  // `&& ` followed by nothing → just remove dangling `&&`
  s = s.replace(/&&\s*\)/g, ')');
  s = s.replace(/&&\s*\}/g, '}');

  // `|| ` followed by nothing
  s = s.replace(/\|\|\s*\)/g, ')');

  // `!` followed by nothing/space  - typeof guards now broken
  s = s.replace(/\!\s*&&/g, '&&');

  // Empty array/object after destructuring
  s = s.replace(/\{\s*,/g, '{ ');

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
