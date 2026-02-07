import api from './client';
import type { ApiResponse, PaginatedResponse } from '@/types';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'BLOCKED' | 'COMPLETED' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Task {
    id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate?: string;
    caseId?: string;
    hearingId?: string;
    assignedToId: string;
    createdById: string;
    tenantId: string;
    tags: string[];
    completedAt?: string;
    parentId?: string;
    createdAt: string;
    updatedAt: string;
    assignedTo?: { id: string; name: string; avatar?: string };
    createdBy?: { id: string; name: string };
    case?: { id: string; title: string; caseNumber: string };
    hearing?: { id: string; hearingDate: string; courtName?: string };
    parent?: { id: string; title: string };
    subtasks?: Task[];
    comments?: TaskComment[];
    _count?: { comments: number; subtasks: number };
}

export interface TaskComment {
    id: string;
    content: string;
    taskId: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
    user?: { id: string; name: string; avatar?: string };
}

export interface TasksFilters {
    search?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assignedToId?: string;
    caseId?: string;
    hearingId?: string;
    overdue?: boolean;
    rootOnly?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface CreateTaskData {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: string;
    caseId?: string;
    hearingId?: string;
    assignedToId: string;
    parentId?: string;
    tags?: string[];
}

export interface UpdateTaskData extends Partial<CreateTaskData> {}

export interface TaskStats {
    total: number;
    todo: number;
    inProgress: number;
    completed: number;
    overdue: number;
    byPriority: Record<string, number>;
    byStatus: Record<string, number>;
}

export const tasksApi = {
    getAll: (filters?: TasksFilters) =>
        api.get<PaginatedResponse<Task>>('/tasks', { params: filters }).then((res) => res.data),

    getById: (id: string) =>
        api.get<ApiResponse<Task>>(`/tasks/${id}`).then((res) => res.data),

    getMyTasks: (filters?: TasksFilters) =>
        api.get<PaginatedResponse<Task>>('/tasks/my', { params: filters }).then((res) => res.data),

    getStats: () =>
        api.get<ApiResponse<TaskStats>>('/tasks/stats').then((res) => res.data),

    create: (data: CreateTaskData) =>
        api.post<ApiResponse<Task>>('/tasks', data).then((res) => res.data),

    update: (id: string, data: UpdateTaskData) =>
        api.patch<ApiResponse<Task>>(`/tasks/${id}`, data).then((res) => res.data),

    delete: (id: string) =>
        api.delete<ApiResponse<void>>(`/tasks/${id}`).then((res) => res.data),

    addComment: (taskId: string, content: string) =>
        api.post<ApiResponse<TaskComment>>(`/tasks/${taskId}/comments`, { content }).then((res) => res.data),

    deleteComment: (commentId: string) =>
        api.delete<ApiResponse<void>>(`/tasks/comments/${commentId}`).then((res) => res.data),

    bulkUpdateStatus: (ids: string[], status: TaskStatus) =>
        api.patch<ApiResponse<{ count: number }>>('/tasks/bulk/status', { ids, status }).then((res) => res.data),

    bulkDelete: (ids: string[]) =>
        api.delete<ApiResponse<{ count: number }>>('/tasks/bulk/delete', { data: { ids } }).then((res) => res.data),
};

export default tasksApi;
