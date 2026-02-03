import { useQuery } from '@tanstack/react-query';
import { activityLogsApi } from '@/api/activity-logs';

export function useActivityLogs(params: {
  page?: number;
  limit?: number;
  entity?: string;
  action?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ['activity-logs', params],
    queryFn: () => activityLogsApi.getAll(params),
  });
}

export function useActivityStats() {
  return useQuery({
    queryKey: ['activity-logs', 'stats'],
    queryFn: () => activityLogsApi.getStats(),
  });
}

export function useEntityActivityLogs(
  entity: string,
  entityId: string,
  limit = 10,
) {
  return useQuery({
    queryKey: ['activity-logs', 'entity', entity, entityId],
    queryFn: () => activityLogsApi.getByEntity(entity, entityId, limit),
    enabled: !!entity && !!entityId,
  });
}
