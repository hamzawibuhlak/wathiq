import api from './client';

// Export functions that handle authentication and file download

export const exportCases = async (params?: { status?: string; ids?: string[] }) => {
    const response = await api.get('/exports/cases', {
        params: {
            status: params?.status || undefined,
            ids: params?.ids?.join(',') || undefined,
        },
        responseType: 'blob',
    });

    downloadBlob(response.data, `cases-${Date.now()}.xlsx`);
};

export const exportClients = async (params?: { ids?: string[] }) => {
    const response = await api.get('/exports/clients', {
        params: {
            ids: params?.ids?.join(',') || undefined,
        },
        responseType: 'blob',
    });

    downloadBlob(response.data, `clients-${Date.now()}.xlsx`);
};

export const exportHearings = async (params?: { status?: string; ids?: string[] }) => {
    const response = await api.get('/exports/hearings', {
        params: {
            status: params?.status || undefined,
            ids: params?.ids?.join(',') || undefined,
        },
        responseType: 'blob',
    });

    downloadBlob(response.data, `hearings-${Date.now()}.xlsx`);
};

export const exportInvoices = async (params?: { status?: string; ids?: string[] }) => {
    const response = await api.get('/exports/invoices', {
        params: {
            status: params?.status || undefined,
            ids: params?.ids?.join(',') || undefined,
        },
        responseType: 'blob',
    });

    downloadBlob(response.data, `invoices-${Date.now()}.xlsx`);
};

export const exportFinancialReport = async (params?: { startDate?: string; endDate?: string }) => {
    const response = await api.get('/exports/financial-report', {
        params: {
            startDate: params?.startDate || undefined,
            endDate: params?.endDate || undefined,
        },
        responseType: 'blob',
    });

    downloadBlob(response.data, `financial-report-${Date.now()}.xlsx`);
};

// Helper function to download blob as file
function downloadBlob(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}
