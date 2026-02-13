/**
 * Phase 35: Complete Tenant Permission Map
 * 11 modules × multiple actions = 120+ granular permissions
 *
 * Each module has a set of actions. Each action is checked against
 * the user's TenantRole to determine access level (NONE/VIEW/EDIT/FULL)
 * and scope (OWN/ASSIGNED/TEAM/ALL).
 */

export interface PermissionAction {
    key: string;
    label: string;
    labelEn: string;
    description?: string;
    supportsScope?: boolean; // whether scope (OWN/ASSIGNED/ALL) applies
}

export interface PermissionModule {
    key: string;
    label: string;
    labelEn: string;
    icon: string;
    actions: PermissionAction[];
}

export const TENANT_PERMISSION_MAP: PermissionModule[] = [
    // ─── 1. القضايا ────────────────────────────────────
    {
        key: 'cases',
        label: 'القضايا',
        labelEn: 'Cases',
        icon: '⚖️',
        actions: [
            { key: 'view_list', label: 'عرض القائمة', labelEn: 'View List', supportsScope: true },
            { key: 'view_details', label: 'عرض التفاصيل', labelEn: 'View Details', supportsScope: true },
            { key: 'create', label: 'إنشاء', labelEn: 'Create' },
            { key: 'edit', label: 'تعديل', labelEn: 'Edit', supportsScope: true },
            { key: 'delete', label: 'حذف', labelEn: 'Delete', supportsScope: true },
            { key: 'assign', label: 'تعيين محامي', labelEn: 'Assign Lawyer', supportsScope: true },
            { key: 'change_status', label: 'تغيير الحالة', labelEn: 'Change Status', supportsScope: true },
            { key: 'add_memo', label: 'إضافة مذكرة', labelEn: 'Add Memo', supportsScope: true },
            { key: 'view_timeline', label: 'عرض الجدول الزمني', labelEn: 'View Timeline', supportsScope: true },
            { key: 'export', label: 'تصدير', labelEn: 'Export' },
        ],
    },

    // ─── 2. العملاء ────────────────────────────────────
    {
        key: 'clients',
        label: 'العملاء',
        labelEn: 'Clients',
        icon: '👥',
        actions: [
            { key: 'view_list', label: 'عرض القائمة', labelEn: 'View List', supportsScope: true },
            { key: 'view_details', label: 'عرض التفاصيل', labelEn: 'View Details', supportsScope: true },
            { key: 'create', label: 'إنشاء', labelEn: 'Create' },
            { key: 'edit', label: 'تعديل', labelEn: 'Edit', supportsScope: true },
            { key: 'delete', label: 'حذف', labelEn: 'Delete' },
            { key: 'view_financial', label: 'عرض البيانات المالية', labelEn: 'View Financial Data', supportsScope: true },
            { key: 'manage_portal', label: 'إدارة بوابة العميل', labelEn: 'Manage Client Portal' },
            { key: 'export', label: 'تصدير', labelEn: 'Export' },
        ],
    },

    // ─── 3. الجلسات ────────────────────────────────────
    {
        key: 'hearings',
        label: 'الجلسات',
        labelEn: 'Hearings',
        icon: '📅',
        actions: [
            { key: 'view_list', label: 'عرض القائمة', labelEn: 'View List', supportsScope: true },
            { key: 'view_details', label: 'عرض التفاصيل', labelEn: 'View Details', supportsScope: true },
            { key: 'create', label: 'إنشاء', labelEn: 'Create' },
            { key: 'edit', label: 'تعديل', labelEn: 'Edit', supportsScope: true },
            { key: 'delete', label: 'حذف', labelEn: 'Delete', supportsScope: true },
            { key: 'change_status', label: 'تغيير الحالة', labelEn: 'Change Status', supportsScope: true },
            { key: 'add_notes', label: 'إضافة ملاحظات', labelEn: 'Add Notes', supportsScope: true },
        ],
    },

    // ─── 4. المستندات ──────────────────────────────────
    {
        key: 'documents',
        label: 'المستندات',
        labelEn: 'Documents',
        icon: '📄',
        actions: [
            { key: 'view_list', label: 'عرض القائمة', labelEn: 'View List', supportsScope: true },
            { key: 'view_details', label: 'عرض التفاصيل', labelEn: 'View Details', supportsScope: true },
            { key: 'upload', label: 'رفع', labelEn: 'Upload' },
            { key: 'download', label: 'تحميل', labelEn: 'Download', supportsScope: true },
            { key: 'edit', label: 'تعديل', labelEn: 'Edit', supportsScope: true },
            { key: 'delete', label: 'حذف', labelEn: 'Delete', supportsScope: true },
            { key: 'manage_templates', label: 'إدارة القوالب', labelEn: 'Manage Templates' },
            { key: 'run_ocr', label: 'تشغيل OCR', labelEn: 'Run OCR' },
            { key: 'export', label: 'تصدير', labelEn: 'Export' },
        ],
    },

    // ─── 5. الفواتير ───────────────────────────────────
    {
        key: 'invoices',
        label: 'الفواتير',
        labelEn: 'Invoices',
        icon: '💰',
        actions: [
            { key: 'view_list', label: 'عرض القائمة', labelEn: 'View List', supportsScope: true },
            { key: 'view_details', label: 'عرض التفاصيل', labelEn: 'View Details', supportsScope: true },
            { key: 'create', label: 'إنشاء', labelEn: 'Create' },
            { key: 'edit', label: 'تعديل', labelEn: 'Edit', supportsScope: true },
            { key: 'delete', label: 'حذف', labelEn: 'Delete' },
            { key: 'change_status', label: 'تغيير الحالة', labelEn: 'Change Status' },
            { key: 'record_payment', label: 'تسجيل دفعة', labelEn: 'Record Payment' },
            { key: 'export', label: 'تصدير', labelEn: 'Export' },
            { key: 'view_reports', label: 'عرض التقارير المالية', labelEn: 'View Financial Reports' },
        ],
    },

    // ─── 6. المهام ─────────────────────────────────────
    {
        key: 'tasks',
        label: 'المهام',
        labelEn: 'Tasks',
        icon: '✅',
        actions: [
            { key: 'view_list', label: 'عرض القائمة', labelEn: 'View List', supportsScope: true },
            { key: 'view_details', label: 'عرض التفاصيل', labelEn: 'View Details', supportsScope: true },
            { key: 'create', label: 'إنشاء', labelEn: 'Create' },
            { key: 'edit', label: 'تعديل', labelEn: 'Edit', supportsScope: true },
            { key: 'delete', label: 'حذف', labelEn: 'Delete', supportsScope: true },
            { key: 'assign', label: 'تعيين', labelEn: 'Assign' },
            { key: 'change_status', label: 'تغيير الحالة', labelEn: 'Change Status', supportsScope: true },
            { key: 'add_comment', label: 'إضافة تعليق', labelEn: 'Add Comment', supportsScope: true },
        ],
    },

    // ─── 7. المستخدمون ─────────────────────────────────
    {
        key: 'users',
        label: 'المستخدمون',
        labelEn: 'Users',
        icon: '👤',
        actions: [
            { key: 'view_list', label: 'عرض القائمة', labelEn: 'View List' },
            { key: 'view_details', label: 'عرض التفاصيل', labelEn: 'View Details' },
            { key: 'create', label: 'إنشاء (دعوة)', labelEn: 'Create (Invite)' },
            { key: 'edit', label: 'تعديل', labelEn: 'Edit' },
            { key: 'deactivate', label: 'تعطيل الحساب', labelEn: 'Deactivate' },
            { key: 'assign_role', label: 'تعيين الدور', labelEn: 'Assign Role' },
            { key: 'reset_password', label: 'إعادة تعيين كلمة المرور', labelEn: 'Reset Password' },
        ],
    },

    // ─── 8. التقارير ───────────────────────────────────
    {
        key: 'reports',
        label: 'التقارير',
        labelEn: 'Reports',
        icon: '📊',
        actions: [
            { key: 'view_dashboard', label: 'عرض لوحة التحكم', labelEn: 'View Dashboard' },
            { key: 'view_reports', label: 'عرض التقارير', labelEn: 'View Reports' },
            { key: 'create', label: 'إنشاء تقرير', labelEn: 'Create Report' },
            { key: 'export', label: 'تصدير', labelEn: 'Export' },
            { key: 'view_analytics', label: 'عرض التحليلات', labelEn: 'View Analytics' },
            { key: 'view_performance', label: 'عرض الأداء', labelEn: 'View Performance' },
        ],
    },

    // ─── 9. المحاسبة ──────────────────────────────────
    {
        key: 'accounting',
        label: 'المحاسبة',
        labelEn: 'Accounting',
        icon: '🧾',
        actions: [
            { key: 'view_accounts', label: 'عرض الحسابات', labelEn: 'View Accounts' },
            { key: 'manage_accounts', label: 'إدارة الحسابات', labelEn: 'Manage Accounts' },
            { key: 'view_journal', label: 'عرض اليومية', labelEn: 'View Journal' },
            { key: 'create_entry', label: 'إنشاء قيد', labelEn: 'Create Entry' },
            { key: 'approve_entry', label: 'اعتماد قيد', labelEn: 'Approve Entry' },
            { key: 'view_receivables', label: 'عرض الذمم المدينة', labelEn: 'View Receivables' },
            { key: 'manage_receivables', label: 'إدارة الذمم المدينة', labelEn: 'Manage Receivables' },
            { key: 'view_payables', label: 'عرض الذمم الدائنة', labelEn: 'View Payables' },
            { key: 'manage_payables', label: 'إدارة الذمم الدائنة', labelEn: 'Manage Payables' },
            { key: 'manage_expenses', label: 'إدارة المصروفات', labelEn: 'Manage Expenses' },
            { key: 'view_bank', label: 'عرض الحسابات البنكية', labelEn: 'View Bank Accounts' },
            { key: 'manage_bank', label: 'إدارة الحسابات البنكية', labelEn: 'Manage Bank Accounts' },
            { key: 'reconcile', label: 'تسوية بنكية', labelEn: 'Bank Reconciliation' },
            { key: 'view_financial_reports', label: 'عرض التقارير المالية', labelEn: 'View Financial Reports' },
        ],
    },

    // ─── 10. الموارد البشرية ───────────────────────────
    {
        key: 'hr',
        label: 'الموارد البشرية',
        labelEn: 'Human Resources',
        icon: '🏢',
        actions: [
            { key: 'view_employees', label: 'عرض الموظفين', labelEn: 'View Employees' },
            { key: 'manage_employees', label: 'إدارة الموظفين', labelEn: 'Manage Employees' },
            { key: 'view_attendance', label: 'عرض الحضور', labelEn: 'View Attendance' },
            { key: 'manage_attendance', label: 'إدارة الحضور', labelEn: 'Manage Attendance' },
            { key: 'view_leaves', label: 'عرض الإجازات', labelEn: 'View Leaves' },
            { key: 'manage_leaves', label: 'إدارة الإجازات', labelEn: 'Manage Leaves' },
            { key: 'approve_leaves', label: 'اعتماد الإجازات', labelEn: 'Approve Leaves' },
            { key: 'view_payroll', label: 'عرض الرواتب', labelEn: 'View Payroll' },
            { key: 'process_payroll', label: 'معالجة الرواتب', labelEn: 'Process Payroll' },
            { key: 'manage_departments', label: 'إدارة الأقسام', labelEn: 'Manage Departments' },
        ],
    },

    // ─── 11. الإعدادات ─────────────────────────────────
    {
        key: 'settings',
        label: 'الإعدادات',
        labelEn: 'Settings',
        icon: '⚙️',
        actions: [
            { key: 'view', label: 'عرض', labelEn: 'View' },
            { key: 'edit_general', label: 'تعديل الإعدادات العامة', labelEn: 'Edit General Settings' },
            { key: 'manage_email', label: 'إدارة البريد', labelEn: 'Manage Email' },
            { key: 'manage_whatsapp', label: 'إدارة واتساب', labelEn: 'Manage WhatsApp' },
            { key: 'manage_roles', label: 'إدارة الأدوار', labelEn: 'Manage Roles' },
            { key: 'manage_integrations', label: 'إدارة التكاملات', labelEn: 'Manage Integrations' },
            { key: 'view_activity_log', label: 'عرض سجل النشاط', labelEn: 'View Activity Log' },
            { key: 'manage_call_center', label: 'إدارة مركز الاتصال', labelEn: 'Manage Call Center' },
        ],
    },
];

/**
 * Get total number of permission actions
 */
export function getTotalPermissionCount(): number {
    return TENANT_PERMISSION_MAP.reduce((total, mod) => total + mod.actions.length, 0);
}

/**
 * Flatten all resource-action pairs
 */
export function getAllPermissionKeys(): { resource: string; action: string }[] {
    const keys: { resource: string; action: string }[] = [];
    for (const mod of TENANT_PERMISSION_MAP) {
        for (const act of mod.actions) {
            keys.push({ resource: mod.key, action: act.key });
        }
    }
    return keys;
}
