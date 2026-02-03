import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/api/users';
import toast from 'react-hot-toast';

export function useUsers() {
    return useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const response = await usersApi.getAll();
            return response.data;
        },
    });
}

export function useLawyers() {
    return useQuery({
        queryKey: ['lawyers'],
        queryFn: async () => {
            const response = await usersApi.getLawyers();
            // API returns { data: User[] }, and axios response has .data
            // So response.data is already { data: User[] }
            return response.data;
        },
    });
}

export function useCreateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: any) => usersApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('تم إضافة المستخدم بنجاح');
        },
        onError: () => {
            toast.error('حدث خطأ أثناء إضافة المستخدم');
        },
    });
}