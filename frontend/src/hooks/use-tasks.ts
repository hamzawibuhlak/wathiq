import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi, TasksFilters, CreateTaskData, UpdateTaskData, TaskStatus, MentionItem } from '@/api/tasks.api';
import toast from 'react-hot-toast';

// List of tasks
export function useTasks(filters?: TasksFilters) {
    return useQuery({
        queryKey: ['tasks', filters],
        queryFn: () => tasksApi.getAll(filters),
        staleTime: 1000 * 60 * 2, // 2 minutes
    });
}

// Single task
export function useTask(id: string) {
    return useQuery({
        queryKey: ['tasks', id],
        queryFn: () => tasksApi.getById(id),
        enabled: !!id,
    });
}

// My tasks
export function useMyTasks(filters?: TasksFilters) {
    return useQuery({
        queryKey: ['tasks', 'my', filters],
        queryFn: () => tasksApi.getMyTasks(filters),
        staleTime: 1000 * 60 * 2,
    });
}

// Task stats
export function useTaskStats() {
    return useQuery({
        queryKey: ['tasks', 'stats'],
        queryFn: () => tasksApi.getStats(),
        staleTime: 1000 * 60 * 5,
    });
}

// Create task
export function useCreateTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateTaskData) => tasksApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            toast.success('تم إنشاء المهمة بنجاح');
        },
        onError: () => {
            toast.error('حدث خطأ أثناء إنشاء المهمة');
        },
    });
}

// Update task
export function useUpdateTask(id: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: UpdateTaskData) => tasksApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['tasks', id] });
            toast.success('تم تحديث المهمة بنجاح');
        },
        onError: () => {
            toast.error('حدث خطأ أثناء تحديث المهمة');
        },
    });
}

// Quick status update
export function useUpdateTaskStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: TaskStatus }) => 
            tasksApi.update(id, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
        onError: () => {
            toast.error('حدث خطأ أثناء تحديث حالة المهمة');
        },
    });
}

// Delete task
export function useDeleteTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => tasksApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            toast.success('تم حذف المهمة بنجاح');
        },
        onError: () => {
            toast.error('حدث خطأ أثناء حذف المهمة');
        },
    });
}

// Add comment
export function useAddTaskComment(taskId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ content, mentions }: { content: string; mentions?: MentionItem[] }) =>
            tasksApi.addComment(taskId, content, mentions),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks', taskId] });
        },
        onError: () => {
            toast.error('حدث خطأ أثناء إضافة التعليق');
        },
    });
}

// Delete comment
export function useDeleteTaskComment(taskId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (commentId: string) => tasksApi.deleteComment(commentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks', taskId] });
            toast.success('تم حذف التعليق بنجاح');
        },
        onError: () => {
            toast.error('حدث خطأ أثناء حذف التعليق');
        },
    });
}

// Bulk update status
export function useBulkUpdateTaskStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ ids, status }: { ids: string[]; status: TaskStatus }) => 
            tasksApi.bulkUpdateStatus(ids, status),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            toast.success(`تم تحديث ${(response as any).count || 0} مهمة بنجاح`);
        },
        onError: () => {
            toast.error('حدث خطأ أثناء تحديث المهام');
        },
    });
}

// Bulk delete
export function useBulkDeleteTasks() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (ids: string[]) => tasksApi.bulkDelete(ids),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            toast.success(`تم حذف ${(response as any).count || 0} مهمة بنجاح`);
        },
        onError: () => {
            toast.error('حدث خطأ أثناء حذف المهام');
        },
    });
}

// Remove assignee from task
export function useRemoveTaskAssignee(taskId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userId: string) => tasksApi.removeAssignee(taskId, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks', taskId] });
            toast.success('تم إزالة الشخص من المهمة');
        },
        onError: () => {
            toast.error('حدث خطأ أثناء إزالة الشخص');
        },
    });
}
