/**
 * Phase 35: Pre-built Role Templates
 * 5 default templates that can be applied when creating a new role.
 * Each template sets access levels per resource/action.
 */

import { AccessLevel, AccessScope } from '@prisma/client';

export interface RolePermissionTemplate {
    resource: string;
    action: string;
    accessLevel: AccessLevel;
    scope: AccessScope;
}

export interface RoleTemplate {
    name: string;
    nameEn: string;
    description: string;
    color: string;
    icon: string;
    isSystem: boolean;
    permissions: RolePermissionTemplate[];
}

// Helper: create permission entries for a module
function modulePerms(
    resource: string,
    actions: Record<string, { level: AccessLevel; scope?: AccessScope }>,
): RolePermissionTemplate[] {
    return Object.entries(actions).map(([action, { level, scope }]) => ({
        resource,
        action,
        accessLevel: level,
        scope: scope || AccessScope.ALL,
    }));
}

// ─── Helper shortcuts ────────────────────────
const FULL = AccessLevel.FULL;
const EDIT = AccessLevel.EDIT;
const VIEW = AccessLevel.VIEW;
const NONE = AccessLevel.NONE;
const OWN = AccessScope.OWN;
const ASSIGNED = AccessScope.ASSIGNED;
const ALL = AccessScope.ALL;

// ─── 1. محامي أول (Senior Lawyer) ─────────────
const seniorLawyerPerms: RolePermissionTemplate[] = [
    ...modulePerms('cases', {
        view_list: { level: FULL }, view_details: { level: FULL },
        create: { level: FULL }, edit: { level: FULL },
        delete: { level: EDIT, scope: OWN }, assign: { level: FULL },
        change_status: { level: FULL }, add_memo: { level: FULL },
        view_timeline: { level: FULL }, export: { level: FULL },
    }),
    ...modulePerms('clients', {
        view_list: { level: FULL }, view_details: { level: FULL },
        create: { level: FULL }, edit: { level: FULL },
        delete: { level: NONE }, view_financial: { level: VIEW },
        manage_portal: { level: NONE }, export: { level: FULL },
    }),
    ...modulePerms('hearings', {
        view_list: { level: FULL }, view_details: { level: FULL },
        create: { level: FULL }, edit: { level: FULL },
        delete: { level: EDIT, scope: OWN }, change_status: { level: FULL },
        add_notes: { level: FULL },
    }),
    ...modulePerms('documents', {
        view_list: { level: FULL }, view_details: { level: FULL },
        upload: { level: FULL }, download: { level: FULL },
        edit: { level: FULL }, delete: { level: EDIT, scope: OWN },
        manage_templates: { level: NONE }, run_ocr: { level: FULL },
        export: { level: FULL },
    }),
    ...modulePerms('invoices', {
        view_list: { level: VIEW }, view_details: { level: VIEW },
        create: { level: NONE }, edit: { level: NONE },
        delete: { level: NONE }, change_status: { level: NONE },
        record_payment: { level: NONE }, export: { level: VIEW },
        view_reports: { level: VIEW },
    }),
    ...modulePerms('tasks', {
        view_list: { level: FULL }, view_details: { level: FULL },
        create: { level: FULL }, edit: { level: FULL },
        delete: { level: EDIT, scope: OWN }, assign: { level: FULL },
        change_status: { level: FULL }, add_comment: { level: FULL },
    }),
    ...modulePerms('users', {
        view_list: { level: VIEW }, view_details: { level: VIEW },
        create: { level: NONE }, edit: { level: NONE },
        deactivate: { level: NONE }, assign_role: { level: NONE },
        reset_password: { level: NONE },
    }),
    ...modulePerms('reports', {
        view_dashboard: { level: FULL }, view_reports: { level: FULL },
        create: { level: FULL }, export: { level: FULL },
        view_analytics: { level: FULL }, view_performance: { level: VIEW },
    }),
    ...modulePerms('accounting', {
        view_accounts: { level: NONE }, manage_accounts: { level: NONE },
        view_journal: { level: NONE }, create_entry: { level: NONE },
        approve_entry: { level: NONE }, view_receivables: { level: NONE },
        manage_receivables: { level: NONE }, view_payables: { level: NONE },
        manage_payables: { level: NONE }, manage_expenses: { level: NONE },
        view_bank: { level: NONE }, manage_bank: { level: NONE },
        reconcile: { level: NONE }, view_financial_reports: { level: NONE },
    }),
    ...modulePerms('hr', {
        view_employees: { level: NONE }, manage_employees: { level: NONE },
        view_attendance: { level: NONE }, manage_attendance: { level: NONE },
        view_leaves: { level: NONE }, manage_leaves: { level: NONE },
        approve_leaves: { level: NONE }, view_payroll: { level: NONE },
        process_payroll: { level: NONE }, manage_departments: { level: NONE },
    }),
    ...modulePerms('settings', {
        view: { level: NONE }, edit_general: { level: NONE },
        manage_email: { level: NONE }, manage_whatsapp: { level: NONE },
        manage_roles: { level: NONE }, manage_integrations: { level: NONE },
        view_activity_log: { level: NONE }, manage_call_center: { level: NONE },
    }),
];

// ─── 2. محامي مبتدئ (Junior Lawyer) ──────────
const juniorLawyerPerms: RolePermissionTemplate[] = [
    ...modulePerms('cases', {
        view_list: { level: VIEW, scope: ASSIGNED }, view_details: { level: VIEW, scope: ASSIGNED },
        create: { level: NONE }, edit: { level: EDIT, scope: ASSIGNED },
        delete: { level: NONE }, assign: { level: NONE },
        change_status: { level: NONE }, add_memo: { level: EDIT, scope: ASSIGNED },
        view_timeline: { level: VIEW, scope: ASSIGNED }, export: { level: NONE },
    }),
    ...modulePerms('clients', {
        view_list: { level: VIEW, scope: ASSIGNED }, view_details: { level: VIEW, scope: ASSIGNED },
        create: { level: NONE }, edit: { level: NONE },
        delete: { level: NONE }, view_financial: { level: NONE },
        manage_portal: { level: NONE }, export: { level: NONE },
    }),
    ...modulePerms('hearings', {
        view_list: { level: VIEW, scope: ASSIGNED }, view_details: { level: VIEW, scope: ASSIGNED },
        create: { level: NONE }, edit: { level: NONE },
        delete: { level: NONE }, change_status: { level: NONE },
        add_notes: { level: EDIT, scope: ASSIGNED },
    }),
    ...modulePerms('documents', {
        view_list: { level: VIEW, scope: ASSIGNED }, view_details: { level: VIEW, scope: ASSIGNED },
        upload: { level: EDIT }, download: { level: VIEW, scope: ASSIGNED },
        edit: { level: NONE }, delete: { level: NONE },
        manage_templates: { level: NONE }, run_ocr: { level: NONE },
        export: { level: NONE },
    }),
    ...modulePerms('invoices', {
        view_list: { level: NONE }, view_details: { level: NONE },
        create: { level: NONE }, edit: { level: NONE },
        delete: { level: NONE }, change_status: { level: NONE },
        record_payment: { level: NONE }, export: { level: NONE },
        view_reports: { level: NONE },
    }),
    ...modulePerms('tasks', {
        view_list: { level: VIEW, scope: ASSIGNED }, view_details: { level: VIEW, scope: ASSIGNED },
        create: { level: NONE }, edit: { level: EDIT, scope: OWN },
        delete: { level: NONE }, assign: { level: NONE },
        change_status: { level: EDIT, scope: ASSIGNED }, add_comment: { level: EDIT, scope: ASSIGNED },
    }),
    ...modulePerms('users', {
        view_list: { level: VIEW }, view_details: { level: NONE },
        create: { level: NONE }, edit: { level: NONE },
        deactivate: { level: NONE }, assign_role: { level: NONE },
        reset_password: { level: NONE },
    }),
    ...modulePerms('reports', {
        view_dashboard: { level: VIEW }, view_reports: { level: NONE },
        create: { level: NONE }, export: { level: NONE },
        view_analytics: { level: NONE }, view_performance: { level: NONE },
    }),
    ...modulePerms('accounting', {
        view_accounts: { level: NONE }, manage_accounts: { level: NONE },
        view_journal: { level: NONE }, create_entry: { level: NONE },
        approve_entry: { level: NONE }, view_receivables: { level: NONE },
        manage_receivables: { level: NONE }, view_payables: { level: NONE },
        manage_payables: { level: NONE }, manage_expenses: { level: NONE },
        view_bank: { level: NONE }, manage_bank: { level: NONE },
        reconcile: { level: NONE }, view_financial_reports: { level: NONE },
    }),
    ...modulePerms('hr', {
        view_employees: { level: NONE }, manage_employees: { level: NONE },
        view_attendance: { level: NONE }, manage_attendance: { level: NONE },
        view_leaves: { level: NONE }, manage_leaves: { level: NONE },
        approve_leaves: { level: NONE }, view_payroll: { level: NONE },
        process_payroll: { level: NONE }, manage_departments: { level: NONE },
    }),
    ...modulePerms('settings', {
        view: { level: NONE }, edit_general: { level: NONE },
        manage_email: { level: NONE }, manage_whatsapp: { level: NONE },
        manage_roles: { level: NONE }, manage_integrations: { level: NONE },
        view_activity_log: { level: NONE }, manage_call_center: { level: NONE },
    }),
];

// ─── 3. سكرتير (Secretary) ───────────────────
const secretaryPerms: RolePermissionTemplate[] = [
    ...modulePerms('cases', {
        view_list: { level: VIEW }, view_details: { level: VIEW },
        create: { level: NONE }, edit: { level: NONE },
        delete: { level: NONE }, assign: { level: NONE },
        change_status: { level: NONE }, add_memo: { level: NONE },
        view_timeline: { level: VIEW }, export: { level: NONE },
    }),
    ...modulePerms('clients', {
        view_list: { level: VIEW }, view_details: { level: VIEW },
        create: { level: EDIT }, edit: { level: EDIT },
        delete: { level: NONE }, view_financial: { level: NONE },
        manage_portal: { level: NONE }, export: { level: NONE },
    }),
    ...modulePerms('hearings', {
        view_list: { level: VIEW }, view_details: { level: VIEW },
        create: { level: EDIT }, edit: { level: EDIT },
        delete: { level: NONE }, change_status: { level: NONE },
        add_notes: { level: EDIT },
    }),
    ...modulePerms('documents', {
        view_list: { level: VIEW }, view_details: { level: VIEW },
        upload: { level: EDIT }, download: { level: VIEW },
        edit: { level: NONE }, delete: { level: NONE },
        manage_templates: { level: NONE }, run_ocr: { level: NONE },
        export: { level: NONE },
    }),
    ...modulePerms('invoices', {
        view_list: { level: VIEW }, view_details: { level: VIEW },
        create: { level: EDIT }, edit: { level: NONE },
        delete: { level: NONE }, change_status: { level: NONE },
        record_payment: { level: NONE }, export: { level: VIEW },
        view_reports: { level: NONE },
    }),
    ...modulePerms('tasks', {
        view_list: { level: VIEW }, view_details: { level: VIEW },
        create: { level: EDIT }, edit: { level: EDIT, scope: OWN },
        delete: { level: NONE }, assign: { level: NONE },
        change_status: { level: EDIT, scope: OWN }, add_comment: { level: EDIT },
    }),
    ...modulePerms('users', {
        view_list: { level: VIEW }, view_details: { level: NONE },
        create: { level: NONE }, edit: { level: NONE },
        deactivate: { level: NONE }, assign_role: { level: NONE },
        reset_password: { level: NONE },
    }),
    ...modulePerms('reports', {
        view_dashboard: { level: NONE }, view_reports: { level: NONE },
        create: { level: NONE }, export: { level: NONE },
        view_analytics: { level: NONE }, view_performance: { level: NONE },
    }),
    ...modulePerms('accounting', {
        view_accounts: { level: NONE }, manage_accounts: { level: NONE },
        view_journal: { level: NONE }, create_entry: { level: NONE },
        approve_entry: { level: NONE }, view_receivables: { level: NONE },
        manage_receivables: { level: NONE }, view_payables: { level: NONE },
        manage_payables: { level: NONE }, manage_expenses: { level: NONE },
        view_bank: { level: NONE }, manage_bank: { level: NONE },
        reconcile: { level: NONE }, view_financial_reports: { level: NONE },
    }),
    ...modulePerms('hr', {
        view_employees: { level: NONE }, manage_employees: { level: NONE },
        view_attendance: { level: VIEW }, manage_attendance: { level: NONE },
        view_leaves: { level: VIEW }, manage_leaves: { level: NONE },
        approve_leaves: { level: NONE }, view_payroll: { level: NONE },
        process_payroll: { level: NONE }, manage_departments: { level: NONE },
    }),
    ...modulePerms('settings', {
        view: { level: NONE }, edit_general: { level: NONE },
        manage_email: { level: NONE }, manage_whatsapp: { level: NONE },
        manage_roles: { level: NONE }, manage_integrations: { level: NONE },
        view_activity_log: { level: NONE }, manage_call_center: { level: NONE },
    }),
];

// ─── 4. محاسب (Accountant) ───────────────────
const accountantPerms: RolePermissionTemplate[] = [
    ...modulePerms('cases', {
        view_list: { level: VIEW }, view_details: { level: VIEW },
        create: { level: NONE }, edit: { level: NONE },
        delete: { level: NONE }, assign: { level: NONE },
        change_status: { level: NONE }, add_memo: { level: NONE },
        view_timeline: { level: NONE }, export: { level: NONE },
    }),
    ...modulePerms('clients', {
        view_list: { level: VIEW }, view_details: { level: VIEW },
        create: { level: NONE }, edit: { level: NONE },
        delete: { level: NONE }, view_financial: { level: FULL },
        manage_portal: { level: NONE }, export: { level: VIEW },
    }),
    ...modulePerms('hearings', {
        view_list: { level: NONE }, view_details: { level: NONE },
        create: { level: NONE }, edit: { level: NONE },
        delete: { level: NONE }, change_status: { level: NONE },
        add_notes: { level: NONE },
    }),
    ...modulePerms('documents', {
        view_list: { level: VIEW }, view_details: { level: VIEW },
        upload: { level: EDIT }, download: { level: VIEW },
        edit: { level: NONE }, delete: { level: NONE },
        manage_templates: { level: NONE }, run_ocr: { level: NONE },
        export: { level: VIEW },
    }),
    ...modulePerms('invoices', {
        view_list: { level: FULL }, view_details: { level: FULL },
        create: { level: FULL }, edit: { level: FULL },
        delete: { level: EDIT }, change_status: { level: FULL },
        record_payment: { level: FULL }, export: { level: FULL },
        view_reports: { level: FULL },
    }),
    ...modulePerms('tasks', {
        view_list: { level: VIEW, scope: ASSIGNED }, view_details: { level: VIEW, scope: ASSIGNED },
        create: { level: NONE }, edit: { level: NONE },
        delete: { level: NONE }, assign: { level: NONE },
        change_status: { level: EDIT, scope: ASSIGNED }, add_comment: { level: EDIT, scope: ASSIGNED },
    }),
    ...modulePerms('users', {
        view_list: { level: VIEW }, view_details: { level: NONE },
        create: { level: NONE }, edit: { level: NONE },
        deactivate: { level: NONE }, assign_role: { level: NONE },
        reset_password: { level: NONE },
    }),
    ...modulePerms('reports', {
        view_dashboard: { level: VIEW }, view_reports: { level: FULL },
        create: { level: EDIT }, export: { level: FULL },
        view_analytics: { level: VIEW }, view_performance: { level: NONE },
    }),
    ...modulePerms('accounting', {
        view_accounts: { level: FULL }, manage_accounts: { level: FULL },
        view_journal: { level: FULL }, create_entry: { level: FULL },
        approve_entry: { level: EDIT }, view_receivables: { level: FULL },
        manage_receivables: { level: FULL }, view_payables: { level: FULL },
        manage_payables: { level: FULL }, manage_expenses: { level: FULL },
        view_bank: { level: FULL }, manage_bank: { level: FULL },
        reconcile: { level: FULL }, view_financial_reports: { level: FULL },
    }),
    ...modulePerms('hr', {
        view_employees: { level: VIEW }, manage_employees: { level: NONE },
        view_attendance: { level: NONE }, manage_attendance: { level: NONE },
        view_leaves: { level: NONE }, manage_leaves: { level: NONE },
        approve_leaves: { level: NONE }, view_payroll: { level: FULL },
        process_payroll: { level: FULL }, manage_departments: { level: NONE },
    }),
    ...modulePerms('settings', {
        view: { level: NONE }, edit_general: { level: NONE },
        manage_email: { level: NONE }, manage_whatsapp: { level: NONE },
        manage_roles: { level: NONE }, manage_integrations: { level: NONE },
        view_activity_log: { level: NONE }, manage_call_center: { level: NONE },
    }),
];

// ─── 5. متدرب (Intern) ──────────────────────
const internPerms: RolePermissionTemplate[] = [
    ...modulePerms('cases', {
        view_list: { level: VIEW, scope: ASSIGNED }, view_details: { level: VIEW, scope: ASSIGNED },
        create: { level: NONE }, edit: { level: NONE },
        delete: { level: NONE }, assign: { level: NONE },
        change_status: { level: NONE }, add_memo: { level: NONE },
        view_timeline: { level: VIEW, scope: ASSIGNED }, export: { level: NONE },
    }),
    ...modulePerms('clients', {
        view_list: { level: VIEW, scope: ASSIGNED }, view_details: { level: VIEW, scope: ASSIGNED },
        create: { level: NONE }, edit: { level: NONE },
        delete: { level: NONE }, view_financial: { level: NONE },
        manage_portal: { level: NONE }, export: { level: NONE },
    }),
    ...modulePerms('hearings', {
        view_list: { level: VIEW, scope: ASSIGNED }, view_details: { level: VIEW, scope: ASSIGNED },
        create: { level: NONE }, edit: { level: NONE },
        delete: { level: NONE }, change_status: { level: NONE },
        add_notes: { level: NONE },
    }),
    ...modulePerms('documents', {
        view_list: { level: VIEW, scope: ASSIGNED }, view_details: { level: VIEW, scope: ASSIGNED },
        upload: { level: NONE }, download: { level: VIEW, scope: ASSIGNED },
        edit: { level: NONE }, delete: { level: NONE },
        manage_templates: { level: NONE }, run_ocr: { level: NONE },
        export: { level: NONE },
    }),
    ...modulePerms('invoices', {
        view_list: { level: NONE }, view_details: { level: NONE },
        create: { level: NONE }, edit: { level: NONE },
        delete: { level: NONE }, change_status: { level: NONE },
        record_payment: { level: NONE }, export: { level: NONE },
        view_reports: { level: NONE },
    }),
    ...modulePerms('tasks', {
        view_list: { level: VIEW, scope: ASSIGNED }, view_details: { level: VIEW, scope: ASSIGNED },
        create: { level: NONE }, edit: { level: NONE },
        delete: { level: NONE }, assign: { level: NONE },
        change_status: { level: EDIT, scope: OWN }, add_comment: { level: EDIT, scope: ASSIGNED },
    }),
    ...modulePerms('users', {
        view_list: { level: NONE }, view_details: { level: NONE },
        create: { level: NONE }, edit: { level: NONE },
        deactivate: { level: NONE }, assign_role: { level: NONE },
        reset_password: { level: NONE },
    }),
    ...modulePerms('reports', {
        view_dashboard: { level: NONE }, view_reports: { level: NONE },
        create: { level: NONE }, export: { level: NONE },
        view_analytics: { level: NONE }, view_performance: { level: NONE },
    }),
    ...modulePerms('accounting', {
        view_accounts: { level: NONE }, manage_accounts: { level: NONE },
        view_journal: { level: NONE }, create_entry: { level: NONE },
        approve_entry: { level: NONE }, view_receivables: { level: NONE },
        manage_receivables: { level: NONE }, view_payables: { level: NONE },
        manage_payables: { level: NONE }, manage_expenses: { level: NONE },
        view_bank: { level: NONE }, manage_bank: { level: NONE },
        reconcile: { level: NONE }, view_financial_reports: { level: NONE },
    }),
    ...modulePerms('hr', {
        view_employees: { level: NONE }, manage_employees: { level: NONE },
        view_attendance: { level: NONE }, manage_attendance: { level: NONE },
        view_leaves: { level: NONE }, manage_leaves: { level: NONE },
        approve_leaves: { level: NONE }, view_payroll: { level: NONE },
        process_payroll: { level: NONE }, manage_departments: { level: NONE },
    }),
    ...modulePerms('settings', {
        view: { level: NONE }, edit_general: { level: NONE },
        manage_email: { level: NONE }, manage_whatsapp: { level: NONE },
        manage_roles: { level: NONE }, manage_integrations: { level: NONE },
        view_activity_log: { level: NONE }, manage_call_center: { level: NONE },
    }),
];

// ─── Export all templates ────────────────────
export const ROLE_TEMPLATES: RoleTemplate[] = [
    {
        name: 'محامي أول',
        nameEn: 'Senior Lawyer',
        description: 'صلاحيات كاملة للقضايا والمهام مع وصول محدود للإعدادات والمالية',
        color: '#6366f1',
        icon: 'scale',
        isSystem: true,
        permissions: seniorLawyerPerms,
    },
    {
        name: 'محامي مبتدئ',
        nameEn: 'Junior Lawyer',
        description: 'وصول محدود للقضايا المعينة فقط مع صلاحيات عرض أساسية',
        color: '#8b5cf6',
        icon: 'book-open',
        isSystem: true,
        permissions: juniorLawyerPerms,
    },
    {
        name: 'سكرتير',
        nameEn: 'Secretary',
        description: 'صلاحيات إدارية: إدخال بيانات العملاء والجلسات وتنظيم المهام',
        color: '#06b6d4',
        icon: 'clipboard',
        isSystem: true,
        permissions: secretaryPerms,
    },
    {
        name: 'محاسب',
        nameEn: 'Accountant',
        description: 'صلاحيات كاملة للمحاسبة والفواتير مع عرض محدود لبقية الأقسام',
        color: '#10b981',
        icon: 'calculator',
        isSystem: true,
        permissions: accountantPerms,
    },
    {
        name: 'متدرب',
        nameEn: 'Intern',
        description: 'عرض القضايا والمهام المعينة فقط بدون صلاحيات تعديل',
        color: '#f59e0b',
        icon: 'graduation-cap',
        isSystem: true,
        permissions: internPerms,
    },
];
