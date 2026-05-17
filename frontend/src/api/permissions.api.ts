import { apiGet, apiPost } from './client';
import api from './client';

export interface Permission {
    id: string;
    name: string;        // e.g., "cases.create"
    description: string;
    module: string;      // e.g., "cases"
    action: string;      // e.g., "create"
}

export interface PermissionsResponse {
    data: Permission[];
}

export interface MyPermissionsResponse {
    data: string[];      // array of permission names
}

const BASE = '/permissions';

export const permissionsApi = {
    getMyPermissions: () =>
        apiGet<MyPermissionsResponse>(`${BASE}/my-permissions`),

    getAllPermissions: () =>
        apiGet<PermissionsResponse>(`${BASE}/all`),

    getRolePermissions: (role: string) =>
        apiGet<MyPermissionsResponse>(`${BASE}/role/${role}`),

    getDefaultPermissions: (role: string) =>
        apiGet<MyPermissionsResponse>(`${BASE}/defaults/${role}`),

    assignPermission: (role: string, permission: string) =>
        apiPost<{ message: string }>(`${BASE}/assign`, { role, permission }),

    revokePermission: (role: string, permission: string) =>
        api.delete<{ message: string }>(`${BASE}/revoke`, { data: { role, permission } }).then(r => r.data),
};

export default permissionsApi;
