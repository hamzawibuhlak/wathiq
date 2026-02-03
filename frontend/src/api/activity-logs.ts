import api from '@/api/client';

export interface ActivityLog {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  tenantId: string;
  createdAt: string;
}

export interface ActivityLogsResponse {
  data: ActivityLog[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ActivityStats {
  total: number;
  last24h: number;
  last7d: number;
  byEntity: { entity: string; count: number }[];
  byAction: { action: string; count: number }[];
  topUsers: { userId: string; userName: string; count: number }[];
}

export const activityLogsApi = {
  getAll: (params: {
    page?: number;
    limit?: number;
    entity?: string;
    action?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }) => api.get<ActivityLogsResponse>('/activity-logs', { params }),

  getStats: () => api.get<{ data: ActivityStats }>('/activity-logs/stats'),

  getByEntity: (entity: string, entityId: string, limit?: number) =>
    api.get<{ data: ActivityLog[] }>(
      `/activity-logs/entity/${entity}/${entityId}`,
      { params: { limit } },
    ),
};
