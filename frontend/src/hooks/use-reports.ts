import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportsApi, CreateReportDto, ExportFormat } from '@/api/reports.api';

// === Legacy hooks (backward compatibility) ===

export function useReportsStats() {
    return useQuery({
        queryKey: ['reports', 'dashboard'],
        queryFn: () => reportsApi.getDashboardStats(),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

export function useFinancialReport(startDate?: string, endDate?: string) {
    return useQuery({
        queryKey: ['reports', 'financial', startDate, endDate],
        queryFn: () => reportsApi.getFinancialReport(startDate, endDate),
        staleTime: 1000 * 60 * 5,
    });
}

export function useCasesReport(period: string = 'month') {
    return useQuery({
        queryKey: ['reports', 'cases', period],
        queryFn: () => reportsApi.getCasesReport(period),
        staleTime: 1000 * 60 * 5,
    });
}

export function usePerformanceReport() {
    return useQuery({
        queryKey: ['reports', 'performance'],
        queryFn: () => reportsApi.getPerformanceReport(),
        staleTime: 1000 * 60 * 5,
    });
}

// === New Report Templates hooks ===

export function useReportTemplates() {
    return useQuery({
        queryKey: ['reports', 'templates'],
        queryFn: () => reportsApi.getTemplates(),
        staleTime: 1000 * 60 * 5,
    });
}

export function useReportTemplate(id: string) {
    return useQuery({
        queryKey: ['reports', 'templates', id],
        queryFn: () => reportsApi.getTemplate(id),
        enabled: !!id,
        staleTime: 1000 * 60 * 5,
    });
}

export function useCreateReportTemplate() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (data: CreateReportDto) => reportsApi.createTemplate(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reports', 'templates'] });
        },
    });
}

export function useUpdateReportTemplate() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CreateReportDto> }) => 
            reportsApi.updateTemplate(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reports', 'templates'] });
        },
    });
}

export function useDeleteReportTemplate() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (id: string) => reportsApi.deleteTemplate(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reports', 'templates'] });
        },
    });
}

export function useExecuteReport() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ id, format }: { id: string; format: ExportFormat }) => 
            reportsApi.executeReport(id, format),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reports'] });
        },
    });
}

export function useReportExecution(id: string) {
    return useQuery({
        queryKey: ['reports', 'executions', id],
        queryFn: () => reportsApi.getExecution(id),
        enabled: !!id,
        refetchInterval: (query) => {
            // Poll while status is PENDING or PROCESSING
            const status = query.state.data?.data?.status;
            if (status === 'PENDING' || status === 'PROCESSING') {
                return 2000; // Poll every 2 seconds
            }
            return false;
        },
    });
}
