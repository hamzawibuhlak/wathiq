import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowsApi, CreateWorkflowData, UpdateWorkflowData } from '@/api/workflows.api';
import toast from 'react-hot-toast';

// List of workflows
export function useWorkflows() {
    return useQuery({
        queryKey: ['workflows'],
        queryFn: () => workflowsApi.getAll(),
        staleTime: 1000 * 60 * 5,
    });
}

// Single workflow
export function useWorkflow(id: string) {
    return useQuery({
        queryKey: ['workflows', id],
        queryFn: () => workflowsApi.getById(id),
        enabled: !!id,
    });
}

// Available triggers
export function useWorkflowTriggers() {
    return useQuery({
        queryKey: ['workflows', 'triggers'],
        queryFn: () => workflowsApi.getTriggers(),
        staleTime: 1000 * 60 * 60, // 1 hour - static data
    });
}

// Available actions
export function useWorkflowActions() {
    return useQuery({
        queryKey: ['workflows', 'actions'],
        queryFn: () => workflowsApi.getActions(),
        staleTime: 1000 * 60 * 60, // 1 hour - static data
    });
}

// Execution history
export function useWorkflowExecutions(id: string) {
    return useQuery({
        queryKey: ['workflows', id, 'executions'],
        queryFn: () => workflowsApi.getExecutionHistory(id),
        enabled: !!id,
    });
}

// Create workflow
export function useCreateWorkflow() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateWorkflowData) => workflowsApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflows'] });
            toast.success('تم إنشاء سير العمل بنجاح');
        },
        onError: () => {
            toast.error('حدث خطأ أثناء إنشاء سير العمل');
        },
    });
}

// Update workflow
export function useUpdateWorkflow(id: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: UpdateWorkflowData) => workflowsApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflows'] });
            queryClient.invalidateQueries({ queryKey: ['workflows', id] });
            toast.success('تم تحديث سير العمل بنجاح');
        },
        onError: () => {
            toast.error('حدث خطأ أثناء تحديث سير العمل');
        },
    });
}

// Toggle workflow active
export function useToggleWorkflow() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => workflowsApi.toggleActive(id),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['workflows'] });
            toast.success((response as any).message || 'تم تغيير حالة سير العمل');
        },
        onError: () => {
            toast.error('حدث خطأ أثناء تغيير حالة سير العمل');
        },
    });
}

// Manual trigger
export function useManualTriggerWorkflow() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, triggerData }: { id: string; triggerData: Record<string, any> }) => 
            workflowsApi.manualTrigger(id, triggerData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflows'] });
            toast.success('تم تشغيل سير العمل بنجاح');
        },
        onError: () => {
            toast.error('حدث خطأ أثناء تشغيل سير العمل');
        },
    });
}

// Delete workflow
export function useDeleteWorkflow() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => workflowsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflows'] });
            toast.success('تم حذف سير العمل بنجاح');
        },
        onError: () => {
            toast.error('حدث خطأ أثناء حذف سير العمل');
        },
    });
}
