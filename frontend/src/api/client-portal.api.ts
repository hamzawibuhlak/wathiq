import api from './client';

// Client Portal API - This uses a separate client for the portal
// For now, we'll add admin endpoints for managing portal access

export interface PortalCredentials {
    message: string;
    temporaryPassword: string;
}

export const clientPortalAdminApi = {
    // Enable portal access for a client
    enableAccess: (clientId: string) =>
        api.post<PortalCredentials>(`/client-portal/enable/${clientId}`).then((res) => res.data),

    // Disable portal access for a client
    disableAccess: (clientId: string) =>
        api.post<{ message: string }>(`/client-portal/disable/${clientId}`).then((res) => res.data),
};

export default clientPortalAdminApi;
