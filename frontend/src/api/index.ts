// Re-export all API modules
export { default as api } from './client';
export { authApi } from './auth.api';
export { dashboardApi } from './dashboard.api';
export { casesApi } from './cases.api';
export { clientsApi } from './clients.api';
export { hearingsApi } from './hearings.api';
export { documentsApi } from './documents.api';
export { invoicesApi } from './invoices.api';
export { profileApi, usersApi, firmApi, notificationsApi } from './settings.api';
export * from './client';
