import axios from 'axios';

// Separate API client for client portal (uses different auth)
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create portal-specific axios instance
const portalApi = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Get token from localStorage (separate from main app)
const getPortalToken = () => localStorage.getItem('portal_token');

// Request interceptor
portalApi.interceptors.request.use((config) => {
    const token = getPortalToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor
portalApi.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('portal_token');
            localStorage.removeItem('portal_client');
            window.location.href = '/portal/login';
        }
        return Promise.reject(error);
    }
);

export interface PortalLoginResponse {
    token: string;
    client: {
        id: string;
        name: string;
        email: string;
        phone: string;
    };
    tenant: {
        id: string;
        name: string;
        logo?: string;
    };
}

export interface PortalCase {
    id: string;
    caseNumber: string;
    title: string;
    caseType: string;
    status: string;
    courtName?: string;
    createdAt: string;
    assignedTo?: {
        name: string;
        email: string;
        phone: string;
    };
    _count?: {
        hearings: number;
        documents: number;
    };
}

export interface PortalInvoice {
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    paidAmount: number;
    status: string;
    dueDate: string;
    createdAt: string;
    case?: {
        caseNumber: string;
        title: string;
    };
}

export interface PortalHearing {
    id: string;
    hearingDate: string;
    courtName: string;
    courtroom?: string;
    status: string;
    notes?: string;
    case?: {
        caseNumber: string;
        title: string;
    };
}

export interface PortalDashboardStats {
    totalCases: number;
    activeCases: number;
    totalInvoices: number;
    pendingInvoices: number;
    upcomingHearings: number;
    pendingAmount: number;
}

export const portalApiClient = {
    // Login
    login: (phone: string, password: string) =>
        portalApi.post<PortalLoginResponse>('/client-portal/login', { phone, password })
            .then((res) => res.data),

    // Change password
    changePassword: (currentPassword: string, newPassword: string) =>
        portalApi.post('/client-portal/change-password', { currentPassword, newPassword })
            .then((res) => res.data),

    // Get profile
    getProfile: () =>
        portalApi.get('/client-portal/profile').then((res) => res.data),

    // Get dashboard stats
    getDashboard: () =>
        portalApi.get<{ data: PortalDashboardStats }>('/client-portal/dashboard')
            .then((res) => res.data.data),

    // Get cases
    getCases: () =>
        portalApi.get<{ data: PortalCase[] }>('/client-portal/my-cases')
            .then((res) => res.data.data),

    // Get case details
    getCaseDetails: (caseId: string) =>
        portalApi.get<{ data: PortalCase }>(`/client-portal/cases/${caseId}`)
            .then((res) => res.data.data),

    // Get invoices
    getInvoices: () =>
        portalApi.get<{ data: PortalInvoice[] }>('/client-portal/my-invoices')
            .then((res) => res.data.data),

    // Get invoice details
    getInvoiceDetails: (invoiceId: string) =>
        portalApi.get<{ data: PortalInvoice }>(`/client-portal/invoices/${invoiceId}`)
            .then((res) => res.data.data),

    // Get documents
    getDocuments: (caseId?: string) =>
        portalApi.get('/client-portal/my-documents', { params: { caseId } })
            .then((res) => res.data.data),

    // Get upcoming hearings
    getUpcomingHearings: () =>
        portalApi.get<{ data: PortalHearing[] }>('/client-portal/upcoming-hearings')
            .then((res) => res.data.data),
};

// Helper functions for portal auth
export const portalAuth = {
    login: (token: string, client: PortalLoginResponse['client']) => {
        localStorage.setItem('portal_token', token);
        localStorage.setItem('portal_client', JSON.stringify(client));
    },
    logout: () => {
        localStorage.removeItem('portal_token');
        localStorage.removeItem('portal_client');
    },
    isAuthenticated: () => !!getPortalToken(),
    getClient: (): PortalLoginResponse['client'] | null => {
        const data = localStorage.getItem('portal_client');
        return data ? JSON.parse(data) : null;
    },
};

export default portalApiClient;
