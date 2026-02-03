import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { AuthLayout, AppLayout } from '@/components/layout';

// Loading Fallback
const PageLoader = () => (
    <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
    </div>
);

// Lazy Load Pages for better bundle size
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));

// Cases
const CasesListPage = lazy(() => import('@/pages/cases/CasesListPage'));
const CaseDetailsPage = lazy(() => import('@/pages/cases/CaseDetailsPage'));
const CreateCasePage = lazy(() => import('@/pages/cases/CreateCasePage'));
const EditCasePage = lazy(() => import('@/pages/cases/EditCasePage'));

// Hearings
const CalendarPage = lazy(() => import('@/pages/hearings/CalendarPage'));
const HearingsListPage = lazy(() => import('@/pages/hearings/HearingsListPage'));
const CreateHearingPage = lazy(() => import('@/pages/hearings/CreateHearingPage'));
const EditHearingPage = lazy(() => import('@/pages/hearings/EditHearingPage'));

// Clients
const ClientsListPage = lazy(() => import('@/pages/clients/ClientsListPage'));
const ClientDetailsPage = lazy(() => import('@/pages/clients/ClientDetailsPage'));
const CreateClientPage = lazy(() => import('@/pages/clients/CreateClientPage'));
const EditClientPage = lazy(() => import('@/pages/clients/EditClientPage'));

// Documents
const DocumentsPage = lazy(() => import('@/pages/documents/DocumentsPage'));

// Invoices
const InvoicesListPage = lazy(() => import('@/pages/invoices/InvoicesListPage'));
const InvoiceDetailsPage = lazy(() => import('@/pages/invoices/InvoiceDetailsPage'));
const CreateInvoicePage = lazy(() => import('@/pages/invoices/CreateInvoicePage'));
const EditInvoicePage = lazy(() => import('@/pages/invoices/EditInvoicePage'));

// Settings
const SettingsLayout = lazy(() => import('@/pages/settings/SettingsLayout'));
const ProfilePage = lazy(() => import('@/pages/settings/ProfilePage'));
const UsersPage = lazy(() => import('@/pages/settings/UsersPage'));
const FirmPage = lazy(() => import('@/pages/settings/FirmPage'));
const NotificationsPage = lazy(() => import('@/pages/settings/NotificationsPage'));

// Activity Logs
const ActivityLogsPage = lazy(() => import('@/pages/activity-logs/ActivityLogsPage'));

// 404 Page
const NotFoundPage = () => (
    <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
            <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
            <p className="text-xl text-muted-foreground mb-6">الصفحة غير موجودة</p>
            <a href="/dashboard" className="text-primary hover:underline">
                العودة للرئيسية
            </a>
        </div>
    </div>
);

// Protected Route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated } = useAuthStore();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

// Public Route wrapper (redirect if authenticated)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated } = useAuthStore();

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};

function App() {
    return (
        <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
                <Routes>
                    {/* Auth Routes with AuthLayout */}
                    <Route
                        element={
                            <PublicRoute>
                                <AuthLayout />
                            </PublicRoute>
                        }
                    >
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                    </Route>

                    {/* App Routes with AppLayout */}
                    <Route
                        element={
                            <ProtectedRoute>
                                <AppLayout />
                            </ProtectedRoute>
                        }
                    >
                        {/* Dashboard */}
                        <Route path="/dashboard" element={<DashboardPage />} />

                        {/* Cases */}
                        <Route path="/cases" element={<CasesListPage />} />
                        <Route path="/cases/new" element={<CreateCasePage />} />
                        <Route path="/cases/:id" element={<CaseDetailsPage />} />
                        <Route path="/cases/:id/edit" element={<EditCasePage />} />

                        {/* Hearings */}
                        <Route path="/hearings" element={<HearingsListPage />} />
                        <Route path="/hearings/calendar" element={<CalendarPage />} />
                        <Route path="/hearings/new" element={<CreateHearingPage />} />
                        <Route path="/hearings/:id/edit" element={<EditHearingPage />} />

                        {/* Clients */}
                        <Route path="/clients" element={<ClientsListPage />} />
                        <Route path="/clients/new" element={<CreateClientPage />} />
                        <Route path="/clients/:id" element={<ClientDetailsPage />} />
                        <Route path="/clients/:id/edit" element={<EditClientPage />} />

                        {/* Documents */}
                        <Route path="/documents" element={<DocumentsPage />} />

                        {/* Invoices */}
                        <Route path="/invoices" element={<InvoicesListPage />} />
                        <Route path="/invoices/new" element={<CreateInvoicePage />} />
                        <Route path="/invoices/:id" element={<InvoiceDetailsPage />} />
                        <Route path="/invoices/:id/edit" element={<EditInvoicePage />} />

                        {/* Settings with nested routes */}
                        <Route path="/settings" element={<SettingsLayout />}>
                            <Route index element={<Navigate to="/settings/profile" replace />} />
                            <Route path="profile" element={<ProfilePage />} />
                            <Route path="users" element={<UsersPage />} />
                            <Route path="firm" element={<FirmPage />} />
                            <Route path="notifications" element={<NotificationsPage />} />
                        </Route>

                        {/* Activity Logs */}
                        <Route path="/activity-logs" element={<ActivityLogsPage />} />
                    </Route>

                    {/* Default Routes */}
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </Suspense>
        </BrowserRouter>
    );
}

export default App;
