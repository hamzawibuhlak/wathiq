// ═══════════════════════════════════════════════════════════
// API Response Types
// ═══════════════════════════════════════════════════════════

export interface ApiResponse<T> {
    data: T;
    message?: string;
    success?: boolean;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}

// ═══════════════════════════════════════════════════════════
// Auth
// ═══════════════════════════════════════════════════════════

export interface LoginRequest {
    email: string;
    password: string;
    tenantSlug: string;
}

export interface LoginResponse {
    access_token: string;
    user: User;
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    phone?: string;
    avatar?: string;
    tenantId: string;
    tenantSlug: string;
    tenantName: string;
    permissions?: Record<string, Record<string, string>>;
}

// ═══════════════════════════════════════════════════════════
// Cases
// ═══════════════════════════════════════════════════════════

export type CaseStatus = 'active' | 'pending' | 'closed' | 'archived';
export type CaseType = 'CRIMINAL' | 'CIVIL' | 'COMMERCIAL' | 'LABOR' | 'FAMILY' | 'ADMINISTRATIVE' | 'OTHER';

export interface Case {
    id: string;
    caseNumber: string;
    title: string;
    description?: string;
    status: CaseStatus;
    caseType: CaseType;
    courtName?: string;
    filingDate?: string;
    nextHearingDate?: string;
    clientId: string;
    client?: Client;
    assignedTo?: string;
    assignedUser?: User;
    createdAt: string;
    updatedAt: string;
}

// ═══════════════════════════════════════════════════════════
// Clients
// ═══════════════════════════════════════════════════════════

export type ClientType = 'INDIVIDUAL' | 'COMPANY';

export interface Client {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    nationalId?: string;
    clientType: ClientType;
    address?: string;
    notes?: string;
    activeCases?: number;
    totalCases?: number;
    createdAt: string;
}

// ═══════════════════════════════════════════════════════════
// Hearings
// ═══════════════════════════════════════════════════════════

export type HearingStatus = 'SCHEDULED' | 'COMPLETED' | 'POSTPONED' | 'CANCELLED';

export interface Hearing {
    id: string;
    title: string;
    date: string;
    time?: string;
    location?: string;
    courtRoom?: string;
    status: HearingStatus;
    notes?: string;
    caseId: string;
    case?: Case;
    createdAt: string;
}

// ═══════════════════════════════════════════════════════════
// Documents
// ═══════════════════════════════════════════════════════════

export interface Document {
    id: string;
    title: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    url: string;
    caseId?: string;
    category?: string;
    createdAt: string;
}

// ═══════════════════════════════════════════════════════════
// Invoices
// ═══════════════════════════════════════════════════════════

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface Invoice {
    id: string;
    invoiceNumber: string;
    amount: number;
    status: InvoiceStatus;
    dueDate: string;
    clientId: string;
    client?: Client;
    caseId?: string;
    items?: InvoiceItem[];
    createdAt: string;
}

export interface InvoiceItem {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

// ═══════════════════════════════════════════════════════════
// Tasks
// ═══════════════════════════════════════════════════════════

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Task {
    id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate?: string;
    assignedToId?: string;
    assignedTo?: User;
    caseId?: string;
    createdAt: string;
}

// ═══════════════════════════════════════════════════════════
// Dashboard
// ═══════════════════════════════════════════════════════════

export interface DashboardStats {
    activeCases: number;
    upcomingHearings: number;
    pendingInvoices: number;
    tasks: number;
    recentCases: Case[];
    todayHearings: Hearing[];
}

// ═══════════════════════════════════════════════════════════
// Forms
// ═══════════════════════════════════════════════════════════

export interface FormTemplate {
    id: string;
    title: string;
    description?: string;
    fields: FormField[];
    isPublished: boolean;
    createdAt: string;
}

export interface FormField {
    id: string;
    label: string;
    type: 'text' | 'number' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox' | 'date' | 'file';
    required: boolean;
    options?: string[];
    placeholder?: string;
}

export interface FormSubmission {
    id: string;
    formId: string;
    data: Record<string, any>;
    status: string;
    submittedAt: string;
}
