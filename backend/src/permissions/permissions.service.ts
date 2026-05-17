import { Injectable, OnModuleInit, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

// =====================================================================
// MODULE CATALOG — كل وحدات النظام مصنّفة
// =====================================================================
interface ModuleDef {
  key: string;          // المفتاح البرمجي (مثل: "cases")
  labelAr: string;      // الاسم العربي
  category: string;     // التصنيف
  actions: string[];    // الإجراءات المتاحة
}

const ACTION_LABELS: Record<string, string> = {
  create:    'إنشاء',
  read:      'عرض',
  update:    'تعديل',
  delete:    'حذف',
  export:    'تصدير',
  import:    'استيراد',
  approve:   'اعتماد',
  assign:    'تعيين',
  send:      'إرسال',
  configure: 'تكوين',
  manage:    'إدارة كاملة',
};

const CRUD = ['create', 'read', 'update', 'delete'];

const MODULES: ModuleDef[] = [
  // ── إدارة العمل (Work) ──────────────────────────
  { key: 'cases',          labelAr: 'القضايا',         category: 'work',     actions: [...CRUD, 'assign', 'export'] },
  { key: 'hearings',       labelAr: 'الجلسات',         category: 'work',     actions: [...CRUD] },
  { key: 'clients',        labelAr: 'العملاء',         category: 'work',     actions: [...CRUD, 'export'] },
  { key: 'documents',      labelAr: 'المستندات',        category: 'work',     actions: [...CRUD] },
  { key: 'legal-documents',labelAr: 'محرر الوثائق',    category: 'work',     actions: [...CRUD] },
  { key: 'tasks',          labelAr: 'المهام',          category: 'work',     actions: [...CRUD, 'assign'] },
  { key: 'forms',          labelAr: 'النماذج',         category: 'work',     actions: [...CRUD] },
  { key: 'workflows',      labelAr: 'سير العمل',       category: 'work',     actions: [...CRUD] },
  { key: 'legal-library',  labelAr: 'المكتبة القانونية', category: 'work',   actions: [...CRUD, 'manage'] },
  { key: 'ai-search',      labelAr: 'البحث الذكي',     category: 'work',     actions: ['read'] },

  // ── المالية (Finance) ───────────────────────────
  { key: 'invoices',       labelAr: 'الفواتير',         category: 'finance',  actions: [...CRUD, 'approve', 'export'] },
  { key: 'expenses',       labelAr: 'المصروفات',        category: 'finance',  actions: [...CRUD, 'approve'] },
  { key: 'accounting',     labelAr: 'المحاسبة',         category: 'finance',  actions: [...CRUD, 'export'] },

  // ── الموارد البشرية (HR) ────────────────────────
  { key: 'employees',      labelAr: 'الموظفون',        category: 'hr',       actions: [...CRUD] },
  { key: 'attendance',     labelAr: 'الحضور والانصراف',category: 'hr',       actions: [...CRUD] },
  { key: 'leaves',         labelAr: 'الإجازات',        category: 'hr',       actions: [...CRUD, 'approve'] },
  { key: 'payroll',        labelAr: 'الرواتب',         category: 'hr',       actions: [...CRUD, 'approve', 'export'] },

  // ── التواصل (Communications) ────────────────────
  { key: 'messages',       labelAr: 'الرسائل الداخلية', category: 'comms',    actions: [...CRUD] },
  { key: 'chat',           labelAr: 'الدردشة',         category: 'comms',    actions: [...CRUD] },
  { key: 'whatsapp',       labelAr: 'واتساب',          category: 'comms',    actions: [...CRUD, 'send', 'configure'] },
  { key: 'social-inbox',   labelAr: 'صندوق الوارد الموحد', category: 'comms', actions: [...CRUD] },
  { key: 'calls',          labelAr: 'مركز الاتصالات',  category: 'comms',    actions: [...CRUD] },
  { key: 'notifications',  labelAr: 'الإشعارات',       category: 'comms',    actions: [...CRUD] },

  // ── التسويق (Marketing) ─────────────────────────
  { key: 'leads',          labelAr: 'العملاء المحتملون', category: 'marketing', actions: [...CRUD, 'assign'] },
  { key: 'campaigns',      labelAr: 'الحملات',          category: 'marketing', actions: [...CRUD] },
  { key: 'message-campaigns', labelAr: 'الرسائل الجماعية', category: 'marketing', actions: [...CRUD, 'send'] },
  { key: 'telemarketing',  labelAr: 'التسويق الهاتفي',  category: 'marketing', actions: [...CRUD] },
  { key: 'affiliate',      labelAr: 'التسويق بالعمولة', category: 'marketing', actions: [...CRUD] },
  { key: 'ad-results',     labelAr: 'نتائج الإعلانات', category: 'marketing', actions: [...CRUD] },
  { key: 'content-calendar', labelAr: 'تقويم المحتوى', category: 'marketing', actions: [...CRUD] },

  // ── التحليلات (Analytics) ───────────────────────
  { key: 'dashboard',      labelAr: 'لوحة التحكم',     category: 'analytics', actions: ['read'] },
  { key: 'reports',        labelAr: 'التقارير',         category: 'analytics', actions: [...CRUD, 'export'] },
  { key: 'analytics',      labelAr: 'التحليلات المتقدمة', category: 'analytics', actions: ['read', 'export'] },
  { key: 'activity-logs',  labelAr: 'سجل النشاطات',    category: 'analytics', actions: ['read', 'export'] },

  // ── الإعدادات (Settings) ────────────────────────
  { key: 'users',          labelAr: 'المستخدمون',       category: 'settings', actions: [...CRUD] },
  { key: 'permissions',    labelAr: 'الصلاحيات',       category: 'settings', actions: ['read', 'update'] },
  { key: 'firm',           labelAr: 'بيانات المكتب',   category: 'settings', actions: ['read', 'update'] },
  { key: 'theme',          labelAr: 'الهوية البصرية',  category: 'settings', actions: ['read', 'update'] },
  { key: 'email-settings', labelAr: 'إعدادات البريد', category: 'settings', actions: ['read', 'update', 'configure'] },
  { key: 'security',       labelAr: 'الأمان',          category: 'settings', actions: ['read', 'update'] },
  { key: 'import',         labelAr: 'الاستيراد',       category: 'settings', actions: ['import'] },
  { key: 'settings',       labelAr: 'الإعدادات العامة', category: 'settings', actions: ['read', 'update'] },
];

@Injectable()
export class PermissionsService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedPermissions();
  }

  /**
   * Seed all system permissions. Safe to run multiple times.
   * Only updates system permissions — custom ones are left alone.
   */
  private async seedPermissions() {
    for (const mod of MODULES) {
      for (const action of mod.actions) {
        await this.prisma.permission.upsert({
          where: { module_action: { module: mod.key, action } },
          create: {
            name: `${mod.key}.${action}`,
            description: `${ACTION_LABELS[action] || action} - ${mod.labelAr}`,
            module: mod.key,
            action,
            labelAr: `${ACTION_LABELS[action] || action} ${mod.labelAr}`,
            category: mod.category,
            isSystem: true,
          },
          update: {
            // refresh metadata, but keep isSystem true
            labelAr: `${ACTION_LABELS[action] || action} ${mod.labelAr}`,
            category: mod.category,
            description: `${ACTION_LABELS[action] || action} - ${mod.labelAr}`,
          },
        });
      }
    }
    console.log(`✅ Permissions seeded (${MODULES.length} modules)`);
  }

  // ── Permission checks (used by guards) ─────────────────
  async hasPermission(userId: string, permissionName: string): Promise<boolean> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) return false;
    if (user.role === 'OWNER') return true;

    const [module, action] = permissionName.split('.');
    const permission = await this.prisma.permission.findUnique({
      where: { module_action: { module, action } },
    });
    if (!permission) return false;

    const rolePermission = await this.prisma.rolePermission.findUnique({
      where: { role_permissionId: { role: user.role, permissionId: permission.id } },
    });
    return !!rolePermission;
  }

  async getUserPermissions(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId },
      select: { role: true },
    });
    if (!user) return [];

    if (user.role === 'OWNER') {
      const all = await this.prisma.permission.findMany();
      return all.map((p) => p.name);
    }

    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { role: user.role },
      include: { permission: true },
    });
    return rolePermissions.map((rp) => rp.permission.name);
  }

  // ── Assign/Revoke ──────────────────────────────────────
  async assignPermission(role: string, permissionName: string) {
    const [module, action] = permissionName.split('.');
    const permission = await this.prisma.permission.findUnique({
      where: { module_action: { module, action } },
    });
    if (!permission) throw new NotFoundException('الصلاحية غير موجودة');

    return this.prisma.rolePermission.upsert({
      where: { role_permissionId: { role, permissionId: permission.id } },
      create: { role, permissionId: permission.id },
      update: {},
    });
  }

  async revokePermission(role: string, permissionName: string) {
    const [module, action] = permissionName.split('.');
    const permission = await this.prisma.permission.findUnique({
      where: { module_action: { module, action } },
    });
    if (!permission) return;

    await this.prisma.rolePermission.deleteMany({
      where: { role, permissionId: permission.id },
    });
  }

  // ── Bulk operations ────────────────────────────────────
  async bulkAssign(role: string, permissionNames: string[]) {
    for (const name of permissionNames) {
      await this.assignPermission(role, name).catch(() => null);
    }
    return { count: permissionNames.length };
  }

  async bulkRevoke(role: string, permissionNames: string[]) {
    for (const name of permissionNames) {
      await this.revokePermission(role, name).catch(() => null);
    }
    return { count: permissionNames.length };
  }

  async clearRole(role: string) {
    if (role === 'OWNER') {
      throw new BadRequestException('لا يمكن مسح صلاحيات المالك');
    }
    const result = await this.prisma.rolePermission.deleteMany({ where: { role } });
    return { count: result.count };
  }

  // ── CRUD on permissions themselves ─────────────────────
  async createCustomPermission(data: {
    module: string;
    action: string;
    labelAr?: string;
    description?: string;
    category?: string;
  }) {
    const module = data.module.trim().toLowerCase().replace(/\s+/g, '-');
    const action = data.action.trim().toLowerCase().replace(/\s+/g, '-');

    if (!module || !action) {
      throw new BadRequestException('الـ module والـ action مطلوبان');
    }
    if (!/^[a-z0-9-]+$/.test(module) || !/^[a-z0-9-]+$/.test(action)) {
      throw new BadRequestException('يجب استخدام أحرف لاتينية صغيرة وأرقام و - فقط');
    }

    const existing = await this.prisma.permission.findUnique({
      where: { module_action: { module, action } },
    });
    if (existing) {
      throw new ConflictException('هذه الصلاحية موجودة مسبقاً');
    }

    return this.prisma.permission.create({
      data: {
        name: `${module}.${action}`,
        module,
        action,
        labelAr: data.labelAr || `${ACTION_LABELS[action] || action} ${module}`,
        description: data.description,
        category: data.category || 'custom',
        isSystem: false,
      },
    });
  }

  async updatePermission(id: string, data: { labelAr?: string; description?: string; category?: string }) {
    const perm = await this.prisma.permission.findUnique({ where: { id } });
    if (!perm) throw new NotFoundException('الصلاحية غير موجودة');

    return this.prisma.permission.update({
      where: { id },
      data: {
        labelAr: data.labelAr ?? perm.labelAr,
        description: data.description ?? perm.description,
        category: data.category ?? perm.category,
      },
    });
  }

  async deletePermission(id: string) {
    const perm = await this.prisma.permission.findUnique({ where: { id } });
    if (!perm) throw new NotFoundException('الصلاحية غير موجودة');
    if (perm.isSystem) {
      throw new BadRequestException('لا يمكن حذف صلاحية مدمجة في النظام');
    }
    await this.prisma.permission.delete({ where: { id } });
    return { success: true };
  }

  // ── Read APIs ──────────────────────────────────────────
  async getAllPermissions() {
    return this.prisma.permission.findMany({
      orderBy: [{ category: 'asc' }, { module: 'asc' }, { action: 'asc' }],
    });
  }

  async getRolePermissions(role: string) {
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { role },
      include: { permission: true },
    });
    return rolePermissions.map((rp) => rp.permission);
  }

  /**
   * Returns category metadata for the frontend (label + count).
   */
  async getCategories() {
    const grouped = await this.prisma.permission.groupBy({
      by: ['category'],
      _count: true,
    });
    const labels: Record<string, string> = {
      work:      'العمل',
      finance:   'المالية',
      hr:        'الموارد البشرية',
      comms:     'التواصل',
      marketing: 'التسويق',
      analytics: 'التحليلات',
      settings:  'الإعدادات',
      core:      'أساسي',
      custom:    'صلاحيات مخصصة',
    };
    return grouped.map((g) => ({
      key: g.category,
      label: labels[g.category] || g.category,
      count: g._count,
    }));
  }

  async getDefaultPermissionsForRole(role: string) {
    const defaults: Record<string, string[]> = {
      OWNER: ['*.*'],
      ADMIN: ['*.*'],
      LAWYER: [
        'cases.read', 'cases.update', 'cases.create',
        'hearings.create', 'hearings.read', 'hearings.update',
        'clients.read', 'clients.create', 'clients.update',
        'documents.create', 'documents.read', 'documents.update',
        'legal-documents.create', 'legal-documents.read', 'legal-documents.update',
        'tasks.read', 'tasks.update',
        'legal-library.read', 'ai-search.read',
        'whatsapp.send', 'whatsapp.read',
        'invoices.read',
        'dashboard.read',
      ],
      SECRETARY: [
        'cases.read', 'hearings.read', 'clients.read', 'clients.create',
        'documents.read', 'tasks.read', 'tasks.create',
        'invoices.read', 'whatsapp.read', 'whatsapp.send',
        'messages.read', 'messages.create',
        'dashboard.read', 'notifications.read',
      ],
      ACCOUNTANT: [
        'invoices.create', 'invoices.read', 'invoices.update', 'invoices.approve', 'invoices.export',
        'expenses.create', 'expenses.read', 'expenses.update', 'expenses.approve',
        'accounting.create', 'accounting.read', 'accounting.update', 'accounting.export',
        'payroll.read', 'payroll.create', 'payroll.update', 'payroll.export',
        'reports.read', 'reports.export', 'dashboard.read',
      ],
    };
    return defaults[role] || [];
  }

  /**
   * Apply role defaults (used to reset a role).
   * Resolves wildcards (*.*, module.*) against the current permission catalog.
   */
  async applyDefaults(role: string) {
    if (role === 'OWNER') {
      throw new BadRequestException('المالك يملك جميع الصلاحيات تلقائياً');
    }
    const defaults = await this.getDefaultPermissionsForRole(role);
    const allPerms = await this.prisma.permission.findMany();

    const toAssign = new Set<string>();
    for (const def of defaults) {
      if (def === '*.*') {
        allPerms.forEach((p) => toAssign.add(p.name));
        continue;
      }
      const [m, a] = def.split('.');
      if (a === '*') {
        allPerms.filter((p) => p.module === m).forEach((p) => toAssign.add(p.name));
      } else {
        toAssign.add(def);
      }
    }

    await this.clearRole(role);
    return this.bulkAssign(role, Array.from(toAssign));
  }
}
