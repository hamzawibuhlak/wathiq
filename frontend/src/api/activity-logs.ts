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

export interface ActivityLogsParams {
  page?: number;
  limit?: number;
  userId?: string;
  userIds?: string[];
  entity?: string;
  entityId?: string;
  entityIds?: string[];
  action?: string;
  actions?: string[];
  startDate?: string;
  endDate?: string;
}

const toQp = (params: ActivityLogsParams) => {
  const qp: Record<string, any> = { ...params };
  if (params.userIds?.length)   { qp.userIds   = params.userIds.join(',');   delete qp.userId; }
  if (params.entityIds?.length) { qp.entityIds = params.entityIds.join(','); delete qp.entityId; }
  if (params.actions?.length)   { qp.actions   = params.actions.join(',');   delete qp.action; }
  // Remove empty arrays/undefined
  Object.keys(qp).forEach(k => { if (!qp[k] && qp[k] !== 0) delete qp[k]; });
  return qp;
};

export const activityLogsApi = {
  getAll: (params: ActivityLogsParams) =>
    api.get<ActivityLogsResponse>('/activity-logs', { params: toQp(params) }),

  getStats: () => api.get<{ data: ActivityStats }>('/activity-logs/stats'),

  getByEntity: (entity: string, entityId: string, limit?: number) =>
    api.get<{ data: ActivityLog[] }>(
      `/activity-logs/entity/${entity}/${entityId}`,
      { params: { limit } },
    ),

  getExportUrl: (params: Omit<ActivityLogsParams, 'page' | 'limit'>): string => {
    const qp = toQp(params as ActivityLogsParams);
    const search = new URLSearchParams(
      Object.fromEntries(Object.entries(qp).filter(([, v]) => v !== undefined && v !== ''))
    ).toString();
    return `/api/activity-logs/export${search ? '?' + search : ''}`;
  },
};
