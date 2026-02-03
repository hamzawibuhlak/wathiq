import { useQuery } from '@tanstack/react-query';
import { searchApi } from '@/api/search.api';
import { useDebounce } from './useDebounce';

export function useGlobalSearch(query: string, type: string = 'all', limit: number = 5) {
    const debouncedQuery = useDebounce(query, 300);

    return useQuery({
        queryKey: ['search', debouncedQuery, type, limit],
        queryFn: () => searchApi.globalSearch(debouncedQuery, type, limit),
        enabled: debouncedQuery.length >= 2,
        staleTime: 1000 * 30, // 30 seconds
    });
}

export function useSearchSuggestions(query: string) {
    const debouncedQuery = useDebounce(query, 200);

    return useQuery({
        queryKey: ['search', 'suggestions', debouncedQuery],
        queryFn: () => searchApi.getSuggestions(debouncedQuery),
        enabled: debouncedQuery.length >= 2,
        staleTime: 1000 * 60, // 1 minute
    });
}
