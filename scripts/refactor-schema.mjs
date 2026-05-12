#!/usr/bin/env node
// Schema refactoring: Multi-tenant -> Single-tenant
// Removes Tenant, TenantRole, Subscription, SuperAdmin models and all tenantId refs

import fs from 'node:fs';
import path from 'node:path';

const SCHEMA = process.argv[2];
if (!SCHEMA) {
  console.error('Usage: node refactor-schema.mjs <path-to-schema.prisma>');
  process.exit(1);
}

const src = fs.readFileSync(SCHEMA, 'utf8');
const lines = src.split('\n');

// === STEP 1: Identify model blocks to delete entirely ===
const MODELS_TO_DELETE = new Set([
  'Tenant',
  'SubscriptionPlan',
  'Subscription',
  'SubscriptionInvoice',
  'SuperAdminUser',
  'CustomRole',
  'SAPermission',
  'TenantNote',
  'SuperAdminChatRoom',
  'SuperAdminChatMessage',
  'SuperAdminAuditLog',
  'TenantIntegration',
  'TenantRole',
  'TenantRolePermission',
  'TenantModuleSettings',
  'ModuleChangeLog',
  'PermissionCache', // tenant-scoped permission cache
]);

const ENUMS_TO_DELETE = new Set([
  'PlanType',
  'SuperAdminRole',
  'AccessScope', // Tenant RBAC
  'AccessLevel', // Advanced RBAC (tenant)
  'ChatSenderType', // Super admin chat
  'ChatRoomStatus', // Super admin chat
]);

// === STEP 2: Process line-by-line ===
const out = [];
let i = 0;
let deletedModels = [];
let deletedEnums = [];

while (i < lines.length) {
  const line = lines[i];
  const modelMatch = line.match(/^model\s+(\w+)\s*\{/);
  const enumMatch = line.match(/^enum\s+(\w+)\s*\{/);

  // Skip deleted models
  if (modelMatch && MODELS_TO_DELETE.has(modelMatch[1])) {
    deletedModels.push(modelMatch[1]);
    // find closing brace
    let depth = 1;
    i++;
    while (i < lines.length && depth > 0) {
      if (lines[i].includes('{')) depth++;
      if (lines[i].includes('}')) depth--;
      i++;
    }
    continue;
  }

  // Skip deleted enums
  if (enumMatch && ENUMS_TO_DELETE.has(enumMatch[1])) {
    deletedEnums.push(enumMatch[1]);
    let depth = 1;
    i++;
    while (i < lines.length && depth > 0) {
      if (lines[i].includes('{')) depth++;
      if (lines[i].includes('}')) depth--;
      i++;
    }
    continue;
  }

  out.push(line);
  i++;
}

let result = out.join('\n');

// === STEP 3: Within remaining models, remove tenantId-related lines ===

// Remove SUPER_ADMIN enum value from UserRole
result = result.replace(/^\s*SUPER_ADMIN\s*$/m, '');

// Remove lines that are pure tenantId field declarations
const removePatterns = [
  // tenantId fields
  /^\s*tenantId\s+String\??\s*$/gm,
  /^\s*tenantId\s+String\??\s+@.*$/gm,
  // tenant relation lines
  /^\s*tenant\s+Tenant\??\s+@relation\([^)]*\)\s*$/gm,
  // tenantRole relations
  /^\s*tenantRoleId\s+String\??\s*$/gm,
  /^\s*tenantRole\s+TenantRole\??\s+@relation\([^)]*\)\s*$/gm,
  // indexes on tenantId
  /^\s*@@index\(\[tenantId[^\]]*\]\)\s*$/gm,
  /^\s*@@index\(\[tenantRoleId[^\]]*\]\)\s*$/gm,
  // unique constraints involving tenantId
  /^\s*@@unique\(\[tenantId[^\]]*\]\)\s*$/gm,
  // relations to deleted models (lines with type Tenant/TenantRole/etc.)
  /^\s*\w+\s+Tenant(\[\])?\s+@relation[^\n]*$/gm,
  /^\s*\w+\s+Tenant(\[\])?\s*$/gm,
  /^\s*\w+\s+TenantRole(\[\])?\s+@relation[^\n]*$/gm,
  /^\s*\w+\s+TenantRole(\[\])?\s*$/gm,
  /^\s*\w+\s+TenantIntegration(\[\])?\s*$/gm,
  /^\s*\w+\s+TenantNote(\[\])?\s*$/gm,
  /^\s*\w+\s+TenantModuleSettings\??\s*$/gm,
  /^\s*\w+\s+ModuleChangeLog(\[\])?\s*$/gm,
  /^\s*\w+\s+Subscription\??\s*$/gm,
  /^\s*\w+\s+SuperAdmin\w*(\[\])?\s*$/gm,
];

for (const pat of removePatterns) {
  result = result.replace(pat, '');
}

// === STEP 4: Clean up empty multiple newlines ===
result = result.replace(/\n{3,}/g, '\n\n');

// === STEP 5: Update header comment ===
result = result.replace(
  /\/\/ Multi-tenant Law Office Management System/,
  '// Single-tenant Law Office Management System'
);

// === STEP 6: Append CompanySettings model ===
const companySettings = `
// =====================================================
// COMPANY SETTINGS (single row - law office configuration)
// =====================================================

model CompanySettings {
  id            String  @id @default(uuid())
  name          String  // اسم المكتب
  nameEn        String?
  email         String?
  phone         String?
  address       String?
  city          String?
  licenseNumber String?
  taxNumber     String?
  commercialReg String?
  website       String?
  logo          String?
  letterheadUrl String?

  // SMTP Email Settings
  smtpHost     String?
  smtpPort     Int?
  smtpUser     String?
  smtpPass     String?
  smtpFrom     String?
  smtpFromName String?
  smtpSecure   Boolean @default(false)
  smtpEnabled  Boolean @default(false)

  // WhatsApp Settings
  whatsappAccessToken   String?
  whatsappPhoneNumberId String?
  whatsappBusinessId    String?
  whatsappWebhookToken  String?
  whatsappEnabled       Boolean @default(false)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("company_settings")
}
`;
result = result.trimEnd() + '\n' + companySettings;

fs.writeFileSync(SCHEMA, result);

console.log('✓ Deleted models:', deletedModels.join(', '));
console.log('✓ Deleted enums:', deletedEnums.join(', '));
console.log('✓ Wrote:', SCHEMA);
console.log('✓ Lines:', result.split('\n').length);
