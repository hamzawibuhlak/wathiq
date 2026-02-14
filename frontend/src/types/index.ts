// =====================
// Common Types
// =====================

export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface ApiResponse<T> {
    data: T;
    message?: string;
}

// =====================
// User & Auth Types
// =====================

export type UserRole = 'OWNER' | 'ADMIN' | 'LAWYER' | 'SECRETARY';

export interface User {
    id: string;
    email: string;
    name: string;
    phone: string | null;
    role: UserRole;
    avatar: string | null;
    isActive: boolean;
    lastLoginAt: string | null;
    createdAt: string;
    updatedAt: string;
    tenantId: string;
    tenant?: Tenant;
}

export interface Tenant {
    id: string;
    name: string;
    nameEn: string | null;
    slug: string;
    email: string | null;
    phone: string | null;
    logo: string | null;
    isActive: boolean;
    planType?: string;
}

export interface LoginRequest {
    email: string;
    password: string;
    companyName?: string;
}

export interface RegisterRequest {
    officeName: string;
    slug: string;
    name: string;
    email: string;
    password: string;
    phone?: string;
    city?: string;
    licenseNumber?: string;
    planType?: string;
}

export interface AuthResponse {
    accessToken: string;
    user: User;
    redirectTo?: string;
    message: string;
}

// =====================
// Client Types
// =====================

export type ClientType = 'INDIVIDUAL' | 'COMPANY' | 'GOVERNMENT';

export interface Client {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    nationalId: string | null;
    companyName: string | null;
    commercialReg: string | null;
    commercialRegDoc: string | null;
    nationalAddressDoc: string | null;
    brandName: string | null;
    unifiedNumber: string | null;
    repName: string | null;
    repPhone: string | null;
    repEmail: string | null;
    repIdentity: string | null;
    repDocType: string | null;
    repDoc: string | null;
    address: string | null;
    city: string | null;
    notes: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    tenantId: string;
    _count?: {
        cases: number;
    };
}

export interface CreateClientRequest {
    name: string;
    email?: string;
    phone?: string;
    nationalId?: string;
    companyName?: string;
    commercialReg?: string;
    address?: string;
    city?: string;
    notes?: string;
    visibleToUserIds?: string[];
    // Enhanced fields
    brandName?: string;
    unifiedNumber?: string;
    commercialRegDoc?: string;
    nationalAddressDoc?: string;
    repName?: string;
    repPhone?: string;
    repEmail?: string;
    repIdentity?: string;
    repDocType?: string;
    repDoc?: string;
}

// =====================
// Case Types
// =====================

export type CaseType = 'CIVIL' | 'CRIMINAL' | 'COMMERCIAL' | 'LABOR' | 'FAMILY' | 'ADMINISTRATIVE' | 'OTHER';
export type CaseStatus = 'OPEN' | 'IN_PROGRESS' | 'SUSPENDED' | 'CLOSED' | 'ARCHIVED';

export interface Case {
    id: string;
    caseNumber: string;
    title: string;
    description: string | null;
    caseType: CaseType;
    status: CaseStatus;
    priority: 'HIGH' | 'MEDIUM' | 'LOW' | null;
    courtName: string | null;
    courtCaseNumber: string | null;
    opposingParty: string | null;
    filingDate: string | null;
    nextHearingDate: string | null;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
    tenantId: string;
    clientId: string;
    assignedToId: string | null;
    createdById: string;
    client?: Client;
    assignedTo?: User;
    createdBy?: User;
    hearings?: Hearing[];
    documents?: Document[];
    invoices?: Invoice[];
    _count?: {
        hearings: number;
        documents: number;
        invoices: number;
    };
}

export interface CreateCaseRequest {
    title: string;
    description?: string;
    caseType: CaseType;
    status?: CaseStatus;
    courtName?: string;
    courtCaseNumber?: string;
    filingDate?: string;
    nextHearingDate?: string;
    clientId: string;
    assignedToId?: string;
    notes?: string;
}

// =====================
// Hearing Types
// =====================

export type HearingStatus = 'SCHEDULED' | 'COMPLETED' | 'POSTPONED' | 'CANCELLED';

export interface Hearing {
    id: string;
    hearingNumber: string;
    hearingDate: string;
    hearingTime?: string | null;
    courtName?: string | null;
    courtroom?: string | null;
    opponentName?: string | null;
    judgeName?: string | null;
    notes: string | null;
    status: HearingStatus;
    createdAt: string;
    updatedAt: string;
    tenantId: string;
    caseId?: string | null;
    case?: Case;
    clientId: string;
    client?: Client;
    assignedToId?: string | null;
    assignedTo?: User;
}

export interface CreateHearingRequest {
    hearingNumber: string;
    hearingDate: string;
    clientId: string;
    caseId?: string;
    assignedToId?: string;
    opponentName?: string;
    courtName?: string;
    judgeName?: string;
    courtroom?: string;
    notes?: string;
    status?: HearingStatus;
}

// =====================
// Document Types
// =====================

export type DocumentType = 'CONTRACT' | 'PLEADING' | 'EVIDENCE' | 'COURT_ORDER' | 'CORRESPONDENCE' | 'OTHER';

export interface Document {
    id: string;
    title: string;
    description: string | null;
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    documentType: DocumentType;
    createdAt: string;
    updatedAt: string;
    tenantId: string;
    caseId: string | null;
    uploadedById: string;
    case?: Case;
    uploadedBy?: User;
}

// =====================
// Invoice Types
// =====================

export type InvoiceStatus = 'DRAFT' | 'PENDING' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface InvoiceItem {
    id?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total?: number;
}

export interface Invoice {
    id: string;
    invoiceNumber: string;
    description: string | null;
    amount: number;
    taxAmount: number;
    totalAmount: number;
    status: InvoiceStatus;
    dueDate: string | null;
    paidAt: string | null;
    paymentProof: string | null;
    createdAt: string;
    updatedAt: string;
    tenantId: string;
    clientId: string;
    caseId: string | null;
    createdById: string;
    client?: Client;
    case?: Case;
    createdBy?: User;
    items?: InvoiceItem[];
}

export interface CreateInvoiceRequest {
    description?: string;
    amount: number;
    dueDate?: string;
    clientId: string;
    caseId?: string;
}

// =====================
// Dashboard Types
// =====================

export interface DashboardStats {
    cases: {
        total: number;
        active: number;
        closed: number;
        byType: Record<string, number>;
        byStatus: Record<string, number>;
    };
    hearings: {
        total: number;
        today: number;
        tomorrow: number;
        thisWeek: number;
        upcoming: number;
    };
    clients: {
        total: number;
        active: number;
        withCases: number;
    };
    invoices: {
        total: number;
        paid: number;
        pending: number;
        overdue: number;
        totalRevenue: number;
        pendingAmount: number;
    };
}
