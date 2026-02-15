// API Base URL — matches Wathiq production
export const API_BASE_URL = 'https://bewathiq.com/api';

// Status labels (Arabic)
export const CASE_STATUS_LABELS: Record<string, string> = {
    active: 'نشطة',
    pending: 'قيد الانتظار',
    closed: 'مغلقة',
    archived: 'مؤرشفة',
};

export const CASE_TYPE_LABELS: Record<string, string> = {
    CRIMINAL: 'جنائية',
    CIVIL: 'مدنية',
    COMMERCIAL: 'تجارية',
    LABOR: 'عمالية',
    FAMILY: 'أسرية',
    ADMINISTRATIVE: 'إدارية',
    OTHER: 'أخرى',
};

export const HEARING_STATUS_LABELS: Record<string, string> = {
    SCHEDULED: 'مجدولة',
    COMPLETED: 'مكتملة',
    POSTPONED: 'مؤجلة',
    CANCELLED: 'ملغاة',
};

export const INVOICE_STATUS_LABELS: Record<string, string> = {
    DRAFT: 'مسودة',
    SENT: 'مرسلة',
    PAID: 'مدفوعة',
    OVERDUE: 'متأخرة',
    CANCELLED: 'ملغاة',
};

export const TASK_PRIORITY_LABELS: Record<string, string> = {
    LOW: 'منخفضة',
    MEDIUM: 'متوسطة',
    HIGH: 'عالية',
    URGENT: 'عاجلة',
};

export const TASK_STATUS_LABELS: Record<string, string> = {
    TODO: 'قيد التنفيذ',
    IN_PROGRESS: 'جاري العمل',
    DONE: 'مكتمل',
};
