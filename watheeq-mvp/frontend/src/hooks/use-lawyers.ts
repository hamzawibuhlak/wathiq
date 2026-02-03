import { useQuery } from '@tanstack/react-query';
import api from '@/api/client';

interface Lawyer {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
}

interface LawyersResponse {
    data: Lawyer[];
}

/**
 * Hook to fetch lawyers for dropdown selection
 */
export function useLawyers() {
    return useQuery<LawyersResponse>({
        queryKey: ['lawyers'],
        queryFn: async () => {
            const { data } = await api.get<LawyersResponse>('/users/lawyers');
            return data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}
