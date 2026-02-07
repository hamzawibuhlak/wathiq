import api from './client';
import type { ApiResponse } from '@/types';

export type WorkflowTrigger = 
    | 'CASE_CREATED'
    | 'CASE_STATUS_CHANGED'
    | 'HEARING_SCHEDULED'
    | 'HEARING_REMINDER'
    | 'TASK_OVERDUE'
    | 'DOCUMENT_UPLOADED'
    | 'INVOICE_CREATED'
    | 'INVOICE_OVERDUE'
    | 'CLIENT_CREATED'
    | 'MANUAL';

export type ExecutionStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface WorkflowAction {
    type: 'CREATE_TASK' | 'SEND_NOTIFICATION' | 'SEND_EMAIL' | 'SEND_WHATSAPP' | 'UPDATE_STATUS';
    config: Record<string, any>;
}

export interface Workflow {
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
    triggerType: WorkflowTrigger;
    triggerConfig: Record<string, any>;
    actions: WorkflowAction[];
    tenantId: string;
    createdAt: string;
    updatedAt: string;
    _count?: { executions: number };
}

export interface WorkflowExecution {
    id: string;
    workflowId: string;
    status: ExecutionStatus;
    triggerData: Record<string, any>;
    result?: Record<string, any>;
    error?: string;
    startedAt: string;
    completedAt?: string;
}

export interface TriggerOption {
    type: WorkflowTrigger;
    label: string;
    icon: string;
}

export interface ActionOption {
    type: string;
    label: string;
    icon: string;
    config: string[];
}

export interface CreateWorkflowData {
    name: string;
    description?: string;
    triggerType: WorkflowTrigger;
    triggerConfig?: Record<string, any>;
    actions: WorkflowAction[];
    isActive?: boolean;
}

export interface UpdateWorkflowData extends Partial<CreateWorkflowData> {}

export const workflowsApi = {
    getAll: () =>
        api.get<ApiResponse<Workflow[]>>('/workflows').then((res) => res.data),

    getById: (id: string) =>
        api.get<ApiResponse<Workflow>>(`/workflows/${id}`).then((res) => res.data),

    getTriggers: () =>
        api.get<ApiResponse<TriggerOption[]>>('/workflows/triggers').then((res) => res.data),

    getActions: () =>
        api.get<ApiResponse<ActionOption[]>>('/workflows/actions').then((res) => res.data),

    getExecutionHistory: (id: string) =>
        api.get<ApiResponse<WorkflowExecution[]>>(`/workflows/${id}/executions`).then((res) => res.data),

    create: (data: CreateWorkflowData) =>
        api.post<ApiResponse<Workflow>>('/workflows', data).then((res) => res.data),

    update: (id: string, data: UpdateWorkflowData) =>
        api.patch<ApiResponse<Workflow>>(`/workflows/${id}`, data).then((res) => res.data),

    toggleActive: (id: string) =>
        api.patch<ApiResponse<Workflow>>(`/workflows/${id}/toggle`).then((res) => res.data),

    manualTrigger: (id: string, triggerData: Record<string, any>) =>
        api.post<ApiResponse<void>>(`/workflows/${id}/trigger`, triggerData).then((res) => res.data),

    delete: (id: string) =>
        api.delete<ApiResponse<void>>(`/workflows/${id}`).then((res) => res.data),
};

export default workflowsApi;
