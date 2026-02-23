// ═══════════════════════════════════════════════════════════
// Phase 42: Module Registry & Plan Defaults
// ═══════════════════════════════════════════════════════════

export interface FeatureDefinition {
    key: string;
    labelAr: string;
    isCore?: boolean;
}

export interface ModulePage {
    key: string;
    nameAr: string;
    path: string;
}

export interface ModuleDefinition {
    key: string;
    nameAr: string;
    nameEn: string;
    icon: string;
    path: string;
    category: 'core' | 'legal' | 'finance' | 'productivity' | 'analytics' | 'management' | 'communication' | 'premium';
    isCore: boolean;
    isPremium?: boolean;
    defaultEnabled: boolean;
    pages: ModulePage[];
    features: FeatureDefinition[];
}

export const MODULES: Record<string, ModuleDefinition> = {
    DASHBOARD: {
        key: 'dashboard',
        nameAr: 'لوحة المعلومات',
        nameEn: 'Dashboard',
        icon: 'LayoutDashboard',
        path: '/dashboard',
        category: 'core',
        isCore: true,
        defaultEnabled: true,
        pages: [
            { key: 'dashboard.main', nameAr: 'الرئيسية', path: '/dashboard' },
        ],
        features: [
            { key: 'stats', labelAr: 'إحصائيات القضايا والعملاء', isCore: true },
            { key: 'upcoming_hearings', labelAr: 'الجلسات القادمة والمهام المعلقة' },
            { key: 'recent_activity', labelAr: 'آخر النشاطات والتحديثات' },
            { key: 'kpis', labelAr: 'مؤشرات الأداء الرئيسية' },
            { key: 'alerts', labelAr: 'إشعارات وتنبيهات مهمة', isCore: true },
        ],
    },
    CASES: {
        key: 'cases',
        nameAr: 'القضايا',
        nameEn: 'Cases',
        icon: 'Briefcase',
        path: '/cases',
        category: 'legal',
        isCore: false,
        defaultEnabled: true,
        pages: [
            { key: 'cases.list', nameAr: 'قائمة القضايا', path: '/cases' },
            { key: 'cases.details', nameAr: 'تفاصيل القضية', path: '/cases/:id' },
            { key: 'cases.create', nameAr: 'قضية جديدة', path: '/cases/new' },
        ],
        features: [
            { key: 'create_edit', labelAr: 'إنشاء وتعديل القضايا' },
            { key: 'link_clients', labelAr: 'ربط القضايا بالعملاء والمحامين' },
            { key: 'track_status', labelAr: 'تتبع حالة القضية' },
            { key: 'workspace', labelAr: 'مساحة عمل القضية' },
            { key: 'timeline', labelAr: 'التايم لاين والتحديثات' },
            { key: 'archive', labelAr: 'أرشفة وبحث القضايا' },
            { key: 'assign_team', labelAr: 'تعيين المحامين والفريق' },
        ],
    },
    CLIENTS: {
        key: 'clients',
        nameAr: 'العملاء',
        nameEn: 'Clients',
        icon: 'Users',
        path: '/clients',
        category: 'legal',
        isCore: false,
        defaultEnabled: true,
        pages: [
            { key: 'clients.list', nameAr: 'قائمة العملاء', path: '/clients' },
            { key: 'clients.details', nameAr: 'ملف العميل', path: '/clients/:id' },
            { key: 'clients.create', nameAr: 'عميل جديد', path: '/clients/new' },
        ],
        features: [
            { key: 'create_edit', labelAr: 'إضافة وتعديل بيانات العملاء' },
            { key: 'profile', labelAr: 'ملف شامل لكل عميل' },
            { key: 'link_cases', labelAr: 'ربط العملاء بالقضايا والفواتير' },
            { key: 'search_filter', labelAr: 'البحث والفلترة المتقدمة' },
            { key: 'portal', labelAr: 'بوابة العميل' },
            { key: 'contact_log', labelAr: 'سجل التواصل والملاحظات' },
            { key: 'classify', labelAr: 'تصنيف العملاء' },
        ],
    },
    HEARINGS: {
        key: 'hearings',
        nameAr: 'الجلسات',
        nameEn: 'Hearings',
        icon: 'Calendar',
        path: '/hearings',
        category: 'legal',
        isCore: false,
        defaultEnabled: true,
        pages: [
            { key: 'hearings.list', nameAr: 'جدول الجلسات', path: '/hearings' },
            { key: 'hearings.create', nameAr: 'جلسة جديدة', path: '/hearings/new' },
        ],
        features: [
            { key: 'schedule', labelAr: 'جدولة الجلسات وربطها بالقضايا' },
            { key: 'calendar', labelAr: 'تقويم تفاعلي' },
            { key: 'reminders', labelAr: 'تنبيهات قبل موعد الجلسة' },
            { key: 'results', labelAr: 'تسجيل نتائج الجلسات' },
            { key: 'assign_lawyer', labelAr: 'تعيين المحامي الحاضر' },
            { key: 'attachments', labelAr: 'مرفقات وملاحظات الجلسة' },
            { key: 'postponements', labelAr: 'تتبع التأجيلات' },
        ],
    },
    DOCUMENTS: {
        key: 'documents',
        nameAr: 'المستندات',
        nameEn: 'Documents',
        icon: 'FileText',
        path: '/documents',
        category: 'legal',
        isCore: false,
        defaultEnabled: true,
        pages: [
            { key: 'documents.list', nameAr: 'مكتبة المستندات', path: '/documents' },
        ],
        features: [
            { key: 'upload', labelAr: 'رفع وتحميل المستندات' },
            { key: 'classify', labelAr: 'تصنيف المستندات حسب النوع' },
            { key: 'link_cases', labelAr: 'ربط المستندات بالقضايا والعملاء' },
            { key: 'search', labelAr: 'البحث في المستندات' },
            { key: 'versioning', labelAr: 'إدارة الإصدارات' },
            { key: 'share', labelAr: 'مشاركة المستندات مع الفريق' },
            { key: 'multi_format', labelAr: 'دعم صيغ متعددة' },
        ],
    },
    INVOICES: {
        key: 'invoices',
        nameAr: 'الفواتير',
        nameEn: 'Invoices',
        icon: 'Receipt',
        path: '/invoices',
        category: 'finance',
        isCore: false,
        defaultEnabled: true,
        pages: [
            { key: 'invoices.list', nameAr: 'الفواتير', path: '/invoices' },
            { key: 'invoices.create', nameAr: 'فاتورة جديدة', path: '/invoices/new' },
            { key: 'invoices.details', nameAr: 'تفاصيل فاتورة', path: '/invoices/:id' },
        ],
        features: [
            { key: 'create', labelAr: 'إنشاء فواتير احترافية' },
            { key: 'link_cases', labelAr: 'ربط الفواتير بالقضايا والعملاء' },
            { key: 'track_payment', labelAr: 'تتبع حالة الدفع' },
            { key: 'installments', labelAr: 'نظام أقساط مرن' },
            { key: 'export_pdf', labelAr: 'تصدير PDF للفواتير' },
            { key: 'revenue_reports', labelAr: 'تقارير الإيرادات والتحصيل' },
            { key: 'auto_notifications', labelAr: 'إشعارات الدفع التلقائية' },
        ],
    },
    TASKS: {
        key: 'tasks',
        nameAr: 'المهام',
        nameEn: 'Tasks',
        icon: 'CheckSquare',
        path: '/tasks',
        category: 'productivity',
        isCore: false,
        defaultEnabled: true,
        pages: [
            { key: 'tasks.list', nameAr: 'المهام', path: '/tasks' },
        ],
        features: [
            { key: 'create_assign', labelAr: 'إنشاء وتعيين المهام' },
            { key: 'priority_deadline', labelAr: 'تحديد أولويات ومواعيد نهائية' },
            { key: 'track_status', labelAr: 'تتبع حالة المهمة' },
            { key: 'link_cases', labelAr: 'ربط المهام بالقضايا' },
            { key: 'comments', labelAr: 'تعليقات ومناقشات على المهام' },
            { key: 'notifications', labelAr: 'إشعارات تلقائية' },
        ],
    },
    REPORTS: {
        key: 'reports',
        nameAr: 'التقارير والتحليلات',
        nameEn: 'Reports & Analytics',
        icon: 'BarChart2',
        path: '/analytics',
        category: 'analytics',
        isCore: false,
        defaultEnabled: true,
        pages: [
            { key: 'reports.analytics', nameAr: 'التحليلات', path: '/analytics' },
            { key: 'reports.export', nameAr: 'تصدير البيانات', path: '/reports' },
        ],
        features: [
            { key: 'lawyer_performance', labelAr: 'تقرير أداء المحامين' },
            { key: 'case_stats', labelAr: 'إحصائيات القضايا' },
            { key: 'financial', labelAr: 'تقارير مالية' },
            { key: 'hearings_attendance', labelAr: 'تقرير الجلسات والحضور' },
            { key: 'export', labelAr: 'تصدير التقارير (Excel, PDF)' },
            { key: 'charts', labelAr: 'رسوم بيانية تفاعلية' },
            { key: 'time_comparison', labelAr: 'مقارنات زمنية' },
        ],
    },
    TEAM: {
        key: 'team',
        nameAr: 'الفريق',
        nameEn: 'Team',
        icon: 'UserCog',
        path: '/settings/users',
        category: 'management',
        isCore: false,
        defaultEnabled: true,
        pages: [],
        features: [
            { key: 'manage_users', labelAr: 'إضافة وإدارة المستخدمين' },
            { key: 'assign_roles', labelAr: 'تعيين الأدوار' },
            { key: 'permissions', labelAr: 'نظام صلاحيات مرن' },
            { key: 'toggle_accounts', labelAr: 'تعطيل/تفعيل الحسابات' },
            { key: 'activity_log', labelAr: 'سجل نشاط المستخدمين' },
        ],
    },
    MESSAGES: {
        key: 'messages',
        nameAr: 'الرسائل والتواصل',
        nameEn: 'Messages & Communication',
        icon: 'MessageSquare',
        path: '/messages',
        category: 'communication',
        isCore: false,
        defaultEnabled: true,
        pages: [
            { key: 'messages.internal', nameAr: 'الرسائل الداخلية', path: '/messages' },
            { key: 'messages.chat', nameAr: 'المحادثات', path: '/chat' },
        ],
        features: [
            { key: 'internal_messages', labelAr: 'رسائل داخلية بين المستخدمين' },
            { key: 'live_chat', labelAr: 'دردشة فورية' },
            { key: 'file_attach', labelAr: 'إرفاق ملفات في الرسائل' },
            { key: 'notifications', labelAr: 'إشعارات الرسائل الجديدة' },
            { key: 'archive', labelAr: 'أرشفة المحادثات' },
            { key: 'search', labelAr: 'البحث في الرسائل' },
        ],
    },
    ACCOUNTING: {
        key: 'accounting',
        nameAr: 'المحاسبة',
        nameEn: 'Accounting',
        icon: 'Calculator',
        path: '/accounting',
        category: 'finance',
        isCore: false,
        defaultEnabled: true,
        pages: [
            { key: 'accounting.dashboard', nameAr: 'لوحة المحاسبة', path: '/accounting' },
            { key: 'accounting.accounts', nameAr: 'دليل الحسابات', path: '/accounting/accounts' },
            { key: 'accounting.journal', nameAr: 'القيود', path: '/accounting/journal-entries' },
            { key: 'accounting.expenses', nameAr: 'المصروفات', path: '/accounting/expenses' },
        ],
        features: [
            { key: 'chart_of_accounts', labelAr: 'شجرة حسابات كاملة' },
            { key: 'journal_entries', labelAr: 'قيود يومية' },
            { key: 'general_ledger', labelAr: 'دفتر الأستاذ العام' },
            { key: 'trial_balance', labelAr: 'ميزان المراجعة' },
            { key: 'expenses_revenue', labelAr: 'إدارة المصروفات والإيرادات' },
            { key: 'financial_reports', labelAr: 'تقارير مالية' },
            { key: 'cost_centers', labelAr: 'مراكز تكلفة' },
            { key: 'invoice_sync', labelAr: 'ربط مع الفواتير تلقائياً' },
        ],
    },
    HR: {
        key: 'hr',
        nameAr: 'الموارد البشرية',
        nameEn: 'HR Management',
        icon: 'UsersRound',
        path: '/hr',
        category: 'management',
        isCore: false,
        defaultEnabled: true,
        pages: [
            { key: 'hr.employees', nameAr: 'الموظفون', path: '/hr/employees' },
            { key: 'hr.attendance', nameAr: 'الحضور', path: '/hr/attendance' },
            { key: 'hr.leaves', nameAr: 'الإجازات', path: '/hr/leaves' },
            { key: 'hr.payroll', nameAr: 'الرواتب', path: '/hr/payroll' },
        ],
        features: [
            { key: 'employee_records', labelAr: 'سجل الموظفين الكامل' },
            { key: 'attendance', labelAr: 'نظام الحضور والانصراف' },
            { key: 'leaves', labelAr: 'إدارة الإجازات' },
            { key: 'payroll', labelAr: 'مسيّرات الرواتب' },
            { key: 'deductions_allowances', labelAr: 'حساب الاستقطاعات والبدلات' },
            { key: 'hr_reports', labelAr: 'تقارير HR شاملة' },
            { key: 'contracts', labelAr: 'عقود العمل وإدارة المستندات' },
        ],
    },
    FORMS: {
        key: 'forms',
        nameAr: 'النماذج الذكية',
        nameEn: 'Smart Forms',
        icon: 'ClipboardList',
        path: '/forms',
        category: 'premium',
        isCore: false,
        isPremium: true,
        defaultEnabled: false,
        pages: [
            { key: 'forms.list', nameAr: 'النماذج', path: '/forms' },
            { key: 'forms.builder', nameAr: 'بناء نموذج', path: '/forms/new' },
        ],
        features: [
            { key: 'drag_drop_builder', labelAr: 'محرر نماذج سحب وإفلات' },
            { key: 'templates', labelAr: 'قوالب جاهزة' },
            { key: 'auto_fill', labelAr: 'تعبئة تلقائية' },
            { key: 'dynamic_fields', labelAr: 'حقول ديناميكية ومشروطة' },
            { key: 'export_pdf', labelAr: 'تصدير PDF احترافي' },
            { key: 'share_clients', labelAr: 'مشاركة النماذج مع العملاء' },
            { key: 'archive', labelAr: 'أرشيف النماذج المعبأة' },
        ],
    },
    CALL_CENTER: {
        key: 'call_center',
        nameAr: 'مركز الاتصالات',
        nameEn: 'Call Center',
        icon: 'Phone',
        path: '/calls',
        category: 'premium',
        isCore: false,
        isPremium: true,
        defaultEnabled: false,
        pages: [
            { key: 'calls.list', nameAr: 'سجل المكالمات', path: '/calls' },
            { key: 'calls.settings', nameAr: 'إعدادات السنترال', path: '/settings/call-center' },
        ],
        features: [
            { key: 'voip_integration', labelAr: 'ربط مع أنظمة VoIP/SIP' },
            { key: 'call_recording', labelAr: 'تسجيل المكالمات' },
            { key: 'call_log', labelAr: 'سجل المكالمات' },
            { key: 'call_transfer', labelAr: 'تحويل المكالمات' },
            { key: 'ivr', labelAr: 'إعدادات الرد الآلي IVR' },
            { key: 'call_reports', labelAr: 'تقارير المكالمات والأداء' },
            { key: 'link_clients', labelAr: 'ربط المكالمات بالعملاء والقضايا' },
        ],
    },
    WHATSAPP: {
        key: 'whatsapp',
        nameAr: 'واتساب',
        nameEn: 'WhatsApp',
        icon: 'MessageCircle',
        path: '/whatsapp',
        category: 'premium',
        isCore: false,
        isPremium: true,
        defaultEnabled: false,
        pages: [
            { key: 'whatsapp.chats', nameAr: 'المحادثات', path: '/whatsapp' },
        ],
        features: [
            { key: 'connect_number', labelAr: 'ربط رقم واتساب المكتب' },
            { key: 'send_receive', labelAr: 'إرسال واستقبال الرسائل' },
            { key: 'templates', labelAr: 'قوالب رسائل جاهزة' },
            { key: 'bulk_messages', labelAr: 'إرسال رسائل جماعية' },
            { key: 'auto_notifications', labelAr: 'إشعارات تلقائية للعملاء' },
            { key: 'archive', labelAr: 'أرشيف المحادثات' },
            { key: 'link_cases', labelAr: 'ربط المحادثات بالقضايا والعملاء' },
        ],
    },
    LEGAL_AI: {
        key: 'legal_ai',
        nameAr: 'البحث القانوني الذكي',
        nameEn: 'Legal AI Search',
        icon: 'Sparkles',
        path: '/legal-search',
        category: 'premium',
        isCore: false,
        isPremium: true,
        defaultEnabled: false,
        pages: [
            { key: 'legal.search', nameAr: 'البحث القانوني', path: '/legal-search' },
        ],
        features: [
            { key: 'ai_search', labelAr: 'بحث ذكي بالذكاء الاصطناعي' },
            { key: 'regulations_search', labelAr: 'البحث في الأنظمة واللوائح' },
            { key: 'suggestions', labelAr: 'اقتراحات مواد قانونية' },
            { key: 'summarize', labelAr: 'تلخيص المواد القانونية' },
            { key: 'compare', labelAr: 'المقارنة بين النصوص القانونية' },
            { key: 'bookmarks', labelAr: 'حفظ نتائج البحث المفضلة' },
            { key: 'link_cases', labelAr: 'ربط النتائج بالقضايا' },
        ],
    },
    LEGAL_LIBRARY: {
        key: 'legal_library',
        nameAr: 'المكتبة القانونية',
        nameEn: 'Legal Library',
        icon: 'BookOpen',
        path: '/legal-library',
        category: 'legal',
        isCore: false,
        defaultEnabled: true,
        pages: [
            { key: 'legal_library.home', nameAr: 'المكتبة', path: '/legal-library' },
            { key: 'legal_library.regulations', nameAr: 'الأنظمة', path: '/legal-library/regulations' },
            { key: 'legal_library.precedents', nameAr: 'السوابق', path: '/legal-library/precedents' },
        ],
        features: [
            { key: 'regulations', labelAr: 'الأنظمة السعودية الرسمية' },
            { key: 'executive_regs', labelAr: 'اللوائح التنفيذية' },
            { key: 'circulars', labelAr: 'التعاميم والقرارات الوزارية' },
            { key: 'glossary', labelAr: 'المعجم القانوني' },
            { key: 'categorize', labelAr: 'تصنيف حسب الجهة والموضوع' },
            { key: 'full_text_search', labelAr: 'البحث النصي الكامل' },
            { key: 'auto_updates', labelAr: 'تحديثات تلقائية للأنظمة الجديدة' },
        ],
    },
    LEGAL_DOCUMENTS: {
        key: 'legal_documents',
        nameAr: 'محرر المستندات القانونية',
        nameEn: 'Legal Document Editor',
        icon: 'FileText',
        path: '/legal-documents',
        category: 'legal',
        isCore: false,
        defaultEnabled: true,
        pages: [
            { key: 'legal_documents.list', nameAr: 'المستندات', path: '/legal-documents' },
            { key: 'legal_documents.new', nameAr: 'مستند جديد', path: '/legal-documents/new' },
        ],
        features: [
            { key: 'rich_editor', labelAr: 'محرر نصوص غني' },
            { key: 'memo_templates', labelAr: 'قوالب مذكرات جاهزة' },
            { key: 'contract_templates', labelAr: 'قوالب عقود احترافية' },
            { key: 'auto_fill', labelAr: 'تعبئة تلقائية لبيانات القضية/العميل' },
            { key: 'export', labelAr: 'تصدير Word/PDF' },
            { key: 'e_signature', labelAr: 'التوقيع الإلكتروني' },
            { key: 'share_drafts', labelAr: 'مشاركة المسودات مع الفريق' },
            { key: 'track_changes', labelAr: 'تتبع التعديلات' },
        ],
    },
    MARKETING: {
        key: 'marketing',
        nameAr: 'التسويق',
        nameEn: 'Marketing',
        icon: 'Megaphone',
        path: '/marketing',
        category: 'premium',
        isCore: false,
        isPremium: true,
        defaultEnabled: false,
        pages: [
            { key: 'marketing.dashboard', nameAr: 'لوحة التسويق', path: '/marketing' },
            { key: 'marketing.leads', nameAr: 'العملاء المحتملون', path: '/marketing/leads' },
        ],
        features: [
            { key: 'leads', labelAr: 'إدارة العملاء المحتملون' },
            { key: 'source_tracking', labelAr: 'تتبع مصادر العملاء' },
            { key: 'campaigns', labelAr: 'حملات تسويقية' },
            { key: 'telemarketing', labelAr: 'التسويق عبر الهاتف' },
            { key: 'affiliate', labelAr: 'نظام التسويق بالعمولة' },
            { key: 'ad_analytics', labelAr: 'تحليلات نتائج الإعلانات' },
            { key: 'bulk_messaging', labelAr: 'رسائل جماعية' },
            { key: 'content_calendar', labelAr: 'تقويم المحتوى التسويقي' },
        ],
    },
    SETTINGS: {
        key: 'settings',
        nameAr: 'الإعدادات',
        nameEn: 'Settings',
        icon: 'Settings',
        path: '/settings',
        category: 'core',
        isCore: true,
        defaultEnabled: true,
        pages: [],
        features: [
            { key: 'profile', labelAr: 'الملف الشخصي', isCore: true },
            { key: 'notifications_config', labelAr: 'إعدادات الإشعارات', isCore: true },
            { key: 'call_center_config', labelAr: 'إعدادات السنترال' },
            { key: 'team_permissions', labelAr: 'إدارة الفريق والصلاحيات' },
            { key: 'office_config', labelAr: 'إعدادات المكتب العامة' },
        ],
    },
};

// ═══════════════════════════════════════════════════════════
// Plan Defaults
// ═══════════════════════════════════════════════════════════

const BASIC_MODULES = [
    'dashboard', 'cases', 'clients', 'hearings',
    'documents', 'invoices', 'tasks', 'team',
    'messages', 'legal_library', 'legal_documents',
    'settings',
];

const PROFESSIONAL_MODULES = [
    ...BASIC_MODULES,
    'accounting', 'hr', 'reports', 'forms',
    'call_center', 'whatsapp',
];

const ENTERPRISE_MODULES = Object.values(MODULES).map(m => m.key);

export const PLAN_DEFAULTS: Record<string, string[]> = {
    BASIC: BASIC_MODULES,
    PROFESSIONAL: PROFESSIONAL_MODULES,
    ENTERPRISE: ENTERPRISE_MODULES,
};

/**
 * Returns default module + feature settings for a given plan.
 * All features of an enabled module are enabled by default.
 */
export function getDefaultModulesByPlan(plan: string): Record<string, { enabled: boolean; features: Record<string, boolean> }> {
    const enabledModules = PLAN_DEFAULTS[plan] || BASIC_MODULES;
    const result: Record<string, { enabled: boolean; features: Record<string, boolean> }> = {};

    Object.values(MODULES).forEach(m => {
        const moduleEnabled = enabledModules.includes(m.key);
        const features: Record<string, boolean> = {};
        m.features.forEach(f => {
            features[f.key] = moduleEnabled; // all features follow module default
        });
        result[m.key] = { enabled: moduleEnabled, features };
    });

    return result;
}

/**
 * Returns module defaults for new registration:
 * Only isCore modules (Dashboard, Settings) are enabled.
 * All other modules and features are disabled.
 * Super Admin must activate modules for each tenant.
 */
export function getRegistrationDefaults(): Record<string, { enabled: boolean; features: Record<string, boolean> }> {
    const result: Record<string, { enabled: boolean; features: Record<string, boolean> }> = {};

    Object.values(MODULES).forEach(m => {
        const moduleEnabled = m.isCore; // only core modules enabled
        const features: Record<string, boolean> = {};
        m.features.forEach(f => {
            // only core features of core modules are enabled
            features[f.key] = moduleEnabled && (f.isCore || false);
        });
        result[m.key] = { enabled: moduleEnabled, features };
    });

    return result;
}
