import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { AuthLayout, AppLayout } from '@/components/layout';
import { OfflineIndicator } from '@/components/layout/OfflineIndicator';
import { InstallPrompt } from '@/components/InstallPrompt';
import { UpdatePrompt } from '@/components/UpdatePrompt';

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
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
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
const WhatsAppSettingsPage = lazy(() => import('@/pages/settings/WhatsAppSettingsPage'));
const EmailSettingsPage = lazy(() => import('@/pages/settings/EmailSettingsPage'));
const TwoFactorPage = lazy(() => import('@/pages/settings/TwoFactorPage'));
const ImportPage = lazy(() => import('@/pages/settings/ImportPage'));
const CallCenterSettingsPage = lazy(() => import('@/pages/settings/CallCenterSettingsPage'));

// Tenant Roles (Phase 35)
const TenantRolesListPage = lazy(() => import('@/pages/settings/TenantRolesListPage'));
const TenantRoleEditorPage = lazy(() => import('@/pages/settings/TenantRoleEditorPage'));

// Activity Logs
const ActivityLogsPage = lazy(() => import('@/pages/activity-logs/ActivityLogsPage'));

// WhatsApp
const WhatsAppMessagesPage = lazy(() => import('@/pages/whatsapp/WhatsAppMessagesPage'));

// Tasks
const TasksListPage = lazy(() => import('@/pages/tasks/TasksListPage'));
const TaskDetailsPage = lazy(() => import('@/pages/tasks/TaskDetailsPage'));

// Workflows
const WorkflowsListPage = lazy(() => import('@/pages/workflows/WorkflowsListPage'));

// Notifications
const NotificationsListPage = lazy(() => import('@/pages/notifications/NotificationsListPage'));

// Analytics & Reports
const AnalyticsDashboardPage = lazy(() => import('@/pages/analytics/AnalyticsDashboardPage'));
const AdvancedAnalyticsPage = lazy(() => import('@/pages/analytics/AdvancedAnalyticsPage'));
const PerformanceReportPage = lazy(() => import('@/pages/analytics/PerformanceReportPage'));
const ReportsPage = lazy(() => import('@/pages/reports/ReportsPage'));

// Messages
const MessagesPage = lazy(() => import('@/pages/messages/MessagesPage'));

// Internal Chat (Phase 26)
const ChatPage = lazy(() => import('@/pages/chat/ChatPage'));

// Legal Document Editor (Phase 28)
const LegalDocumentsPage = lazy(() => import('@/pages/legal-documents/LegalDocumentsPage'));
const NewDocumentPage = lazy(() => import('@/pages/legal-documents/NewDocumentPage'));
const LegalDocumentEditorPage = lazy(() => import('@/pages/legal-documents/LegalDocumentEditorPage'));

// Marketing Module (Phase 29)
const MarketingLayout = lazy(() => import('@/pages/marketing/MarketingLayout'));
const MarketingDashboard = lazy(() => import('@/pages/marketing/MarketingDashboard'));
const LeadsPage = lazy(() => import('@/pages/marketing/leads/LeadsPage'));
const LeadDetailsPage = lazy(() => import('@/pages/marketing/leads/LeadDetailsPage'));
const TelemarketingPage = lazy(() => import('@/pages/marketing/telemarketing/TelemarketingPage'));
const AffiliatesPage = lazy(() => import('@/pages/marketing/affiliate/AffiliatesPage'));
const CampaignsPage = lazy(() => import('@/pages/marketing/campaigns/CampaignsPage'));
const AdsAnalyticsPage = lazy(() => import('@/pages/marketing/ads-analytics/AdsAnalyticsPage'));
const MessageCampaignsPage = lazy(() => import('@/pages/marketing/message-campaigns/MessageCampaignsPage'));
const ContentCalendarPage = lazy(() => import('@/pages/marketing/content-calendar/ContentCalendarPage'));

// Legal Library (Phase 30)
const LegalLibraryHome = lazy(() => import('@/pages/legal-library/LegalLibraryHome'));
const RegulationsPage = lazy(() => import('@/pages/legal-library/RegulationsPage'));
const RegulationDetailsPage = lazy(() => import('@/pages/legal-library/RegulationDetailsPage'));
const PrecedentsPage = lazy(() => import('@/pages/legal-library/PrecedentsPage'));
const PrecedentDetailsPage = lazy(() => import('@/pages/legal-library/PrecedentDetailsPage'));
const GlossaryPage = lazy(() => import('@/pages/legal-library/GlossaryPage'));
const BookmarksPage = lazy(() => import('@/pages/legal-library/BookmarksPage'));
const LegalAISearchPage = lazy(() => import('@/pages/legal-library/LegalAISearchPage'));

// Owner Panel (Phase 27)
const OwnerLayout = lazy(() => import('@/pages/owner/OwnerLayout'));
const OwnerDashboard = lazy(() => import('@/pages/owner/OwnerDashboard'));
const OwnerCompanyPage = lazy(() => import('@/pages/owner/CompanyProfilePage'));
const OwnerUsersPage = lazy(() => import('@/pages/owner/UsersManagementPage'));
const OwnerIntegrationsPage = lazy(() => import('@/pages/owner/IntegrationsPage'));
const OwnerWorkflowsPage = lazy(() => import('@/pages/owner/WorkflowsPage'));
const OwnerBillingPage = lazy(() => import('@/pages/owner/BillingPage'));

// Call Center
const CallCenterPage = lazy(() => import('@/pages/calls/CallCenterPage'));
const CallCenterSetupPage = lazy(() => import('@/pages/calls/CallCenterSetupPage'));

// Accounting
const AccountingDashboardPage = lazy(() => import('@/pages/accounting/AccountingDashboardPage'));
const ChartOfAccountsPage = lazy(() => import('@/pages/accounting/ChartOfAccountsPage'));
const JournalEntriesPage = lazy(() => import('@/pages/accounting/JournalEntriesPage'));
const ExpensesPage = lazy(() => import('@/pages/accounting/ExpensesPage'));

// HR Management
const EmployeesListPage = lazy(() => import('@/pages/hr/EmployeesListPage'));
const EmployeeDetailsPage = lazy(() => import('@/pages/hr/EmployeeDetailsPage'));
const AttendancePage = lazy(() => import('@/pages/hr/AttendancePage'));
const LeaveManagementPage = lazy(() => import('@/pages/hr/LeaveManagementPage'));
const PayrollPage = lazy(() => import('@/pages/hr/PayrollPage'));

// Super Admin — Phase 33
const SuperAdminLoginPage = lazy(() => import('@/pages/super-admin/SuperAdminLoginPage'));
const SALayout = lazy(() => import('@/pages/super-admin/SALayout'));
const SAOverviewPage = lazy(() => import('@/pages/super-admin/SAOverviewPage'));
const SATenantsPage = lazy(() => import('@/pages/super-admin/SATenantsPage'));
const SATenantDetailsPage = lazy(() => import('@/pages/super-admin/SATenantDetailsPage'));
const SAModuleControlPage = lazy(() => import('@/pages/super-admin/SAModuleControlPage'));
const SAChatPage = lazy(() => import('@/pages/super-admin/SAChatPage'));
const SAStaffPage = lazy(() => import('@/pages/super-admin/SAStaffPage'));
const SAAuditLogPage = lazy(() => import('@/pages/super-admin/SAAuditLogPage'));
const RolesListPage = lazy(() => import('@/pages/super-admin/roles/RolesListPage'));
const RoleEditorPage = lazy(() => import('@/pages/super-admin/roles/RoleEditorPage'));
const SALegalContentPage = lazy(() => import('@/pages/super-admin/SALegalContentPage'));
const SAIntegrationsPage = lazy(() => import('@/pages/super-admin/SAIntegrationsPage'));
const AIIntegrationPage = lazy(() => import('@/pages/super-admin/integrations/AIIntegrationPage'));
const SMTPIntegrationPage = lazy(() => import('@/pages/super-admin/integrations/SMTPIntegrationPage'));
const WhatsAppIntegrationPage = lazy(() => import('@/pages/super-admin/integrations/WhatsAppIntegrationPage'));
const CallCenterIntegrationPage = lazy(() => import('@/pages/super-admin/integrations/CallCenterIntegrationPage'));
const CalendarIntegrationPage = lazy(() => import('@/pages/super-admin/integrations/CalendarIntegrationPage'));
const SendGridIntegrationPage = lazy(() => import('@/pages/super-admin/integrations/SendGridIntegrationPage'));

// Email Verification
const VerifyEmailPage = lazy(() => import('@/pages/auth/VerifyEmailPage'));
const PrivacyPolicyPage = lazy(() => import('@/pages/legal/PrivacyPolicyPage').then(m => ({ default: m.PrivacyPolicyPage })));

// Accept Invitation (Public)
const AcceptInvitationPage = lazy(() => import('@/pages/invitations/AcceptInvitationPage'));

// Phase 38: Dynamic Forms
const FormsListPage = lazy(() => import('@/pages/forms/FormsListPage'));
const FormBuilderPage = lazy(() => import('@/pages/forms/FormBuilderPage'));
const FormSubmissionsPage = lazy(() => import('@/pages/forms/FormSubmissionsPage'));
const PublicFormPage = lazy(() => import('@/pages/public/PublicFormPage'));

// Client Portal
const PortalLoginPage = lazy(() => import('@/pages/portal/PortalLoginPage'));
const PortalLayout = lazy(() => import('@/pages/portal/PortalLayout'));
const PortalDashboardPage = lazy(() => import('@/pages/portal/PortalDashboardPage'));
const PortalCasesPage = lazy(() => import('@/pages/portal/PortalCasesPage'));
const PortalInvoicesPage = lazy(() => import('@/pages/portal/PortalInvoicesPage'));
const PortalHearingsPage = lazy(() => import('@/pages/portal/PortalHearingsPage'));

// 404 Page
const NotFoundPage = () => (
    <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
            <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
            <p className="text-xl text-muted-foreground mb-6">الصفحة غير موجودة</p>
            <a href="/login" className="text-primary hover:underline">
                العودة لتسجيل الدخول
            </a>
        </div>
    </div>
);

// Protected Route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, _hasHydrated } = useAuthStore();

    if (!_hasHydrated) {
        return <PageLoader />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

// Public Route wrapper (redirect if authenticated)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, user, _hasHydrated } = useAuthStore();

    if (!_hasHydrated) {
        return <PageLoader />;
    }

    if (isAuthenticated) {
        const slug = user?.tenant?.slug;
        if (user?.role === 'SUPER_ADMIN') return <Navigate to="/super-admin" replace />;
        if (slug && user?.role === 'OWNER') return <Navigate to={`/${slug}/owner`} replace />;
        if (slug) return <Navigate to={`/${slug}/dashboard`} replace />;
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};

// Redirect legacy /dashboard → /:slug/dashboard
const SlugRedirect = () => {
    const { user, isAuthenticated, _hasHydrated } = useAuthStore();
    if (!_hasHydrated) return <PageLoader />;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    const slug = user?.tenant?.slug;
    if (slug) return <Navigate to={`/${slug}/dashboard`} replace />;
    return <Navigate to="/login" replace />;
};

function App() {
    return (
        <BrowserRouter>
            {/* PWA Components */}
            <InstallPrompt />
            <UpdatePrompt />
            <OfflineIndicator />

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
                        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    </Route>

                    {/* Email Verification (standalone, no AuthLayout) */}
                    <Route path="/verify-email" element={<VerifyEmailPage />} />
                    <Route path="/privacy" element={<PrivacyPolicyPage />} />

                    {/* Super Admin — Phase 33 (must be before /:slug) */}
                    <Route path="/super-admin/login" element={<SuperAdminLoginPage />} />
                    <Route path="/super-admin" element={<SALayout />}>
                        <Route index element={<SAOverviewPage />} />
                        <Route path="tenants" element={<SATenantsPage />} />
                        <Route path="tenants/:id" element={<SATenantDetailsPage />} />
                        <Route path="tenants/:id/modules" element={<SAModuleControlPage />} />
                        <Route path="chat" element={<SAChatPage />} />
                        <Route path="staff" element={<SAStaffPage />} />
                        <Route path="roles" element={<RolesListPage />} />
                        <Route path="roles/:id" element={<RoleEditorPage />} />
                        <Route path="audit" element={<SAAuditLogPage />} />
                        <Route path="legal-content" element={<SALegalContentPage />} />
                        <Route path="integrations" element={<SAIntegrationsPage />} />
                        <Route path="integrations/ai" element={<AIIntegrationPage />} />
                        <Route path="integrations/smtp" element={<SMTPIntegrationPage />} />
                        <Route path="integrations/whatsapp" element={<WhatsAppIntegrationPage />} />
                        <Route path="integrations/callcenter" element={<CallCenterIntegrationPage />} />
                        <Route path="integrations/calendar" element={<CalendarIntegrationPage />} />
                        <Route path="integrations/sendgrid" element={<SendGridIntegrationPage />} />
                    </Route>

                    {/* ═══════════════════════════════════════════
                        Slug-based App Routes: /:slug/*
                       ═══════════════════════════════════════════ */}
                    <Route
                        path="/:slug"
                        element={
                            <ProtectedRoute>
                                <AppLayout />
                            </ProtectedRoute>
                        }
                    >
                        {/* Dashboard */}
                        <Route path="dashboard" element={<DashboardPage />} />

                        {/* Cases */}
                        <Route path="cases" element={<CasesListPage />} />
                        <Route path="cases/new" element={<CreateCasePage />} />
                        <Route path="cases/:id" element={<CaseDetailsPage />} />
                        <Route path="cases/:id/edit" element={<EditCasePage />} />

                        {/* Hearings */}
                        <Route path="hearings" element={<HearingsListPage />} />
                        <Route path="hearings/calendar" element={<CalendarPage />} />
                        <Route path="hearings/new" element={<CreateHearingPage />} />
                        <Route path="hearings/:id/edit" element={<EditHearingPage />} />

                        {/* Clients */}
                        <Route path="clients" element={<ClientsListPage />} />
                        <Route path="customers" element={<Navigate to="clients" replace />} />
                        <Route path="clients/new" element={<CreateClientPage />} />
                        <Route path="clients/:id" element={<ClientDetailsPage />} />
                        <Route path="clients/:id/edit" element={<EditClientPage />} />

                        {/* Documents */}
                        <Route path="documents" element={<DocumentsPage />} />

                        {/* Invoices */}
                        <Route path="invoices" element={<InvoicesListPage />} />
                        <Route path="invoices/new" element={<CreateInvoicePage />} />
                        <Route path="invoices/:id" element={<InvoiceDetailsPage />} />
                        <Route path="invoices/:id/edit" element={<EditInvoicePage />} />

                        {/* Settings with nested routes */}
                        <Route path="settings" element={<SettingsLayout />}>
                            <Route index element={<Navigate to="profile" replace />} />
                            <Route path="profile" element={<ProfilePage />} />
                            <Route path="users" element={<UsersPage />} />
                            <Route path="firm" element={<FirmPage />} />
                            <Route path="email" element={<EmailSettingsPage />} />
                            <Route path="whatsapp" element={<WhatsAppSettingsPage />} />
                            <Route path="notifications" element={<NotificationsPage />} />
                            <Route path="security" element={<TwoFactorPage />} />
                            <Route path="import" element={<ImportPage />} />
                            <Route path="call-center" element={<CallCenterSettingsPage />} />
                            <Route path="roles" element={<TenantRolesListPage />} />
                            <Route path="roles/:id" element={<TenantRoleEditorPage />} />
                        </Route>

                        {/* Activity Logs */}
                        <Route path="activity-logs" element={<ActivityLogsPage />} />

                        {/* WhatsApp */}
                        <Route path="whatsapp" element={<WhatsAppMessagesPage />} />

                        {/* Tasks */}
                        <Route path="tasks" element={<TasksListPage />} />
                        <Route path="tasks/:id" element={<TaskDetailsPage />} />

                        {/* Workflows */}
                        <Route path="workflows" element={<WorkflowsListPage />} />

                        {/* Notifications */}
                        <Route path="notifications" element={<NotificationsListPage />} />

                        {/* Analytics & Reports */}
                        <Route path="analytics" element={<AnalyticsDashboardPage />} />
                        <Route path="analytics/advanced" element={<AdvancedAnalyticsPage />} />
                        <Route path="analytics/performance" element={<PerformanceReportPage />} />
                        <Route path="reports" element={<ReportsPage />} />

                        {/* Messages */}
                        <Route path="messages" element={<MessagesPage />} />
                        <Route path="messages/:id" element={<MessagesPage />} />

                        {/* Internal Chat (Phase 26) */}
                        <Route path="chat" element={<ChatPage />} />

                        {/* Legal Document Editor (Phase 28) */}
                        <Route path="legal-documents" element={<LegalDocumentsPage />} />
                        <Route path="legal-documents/new" element={<NewDocumentPage />} />
                        <Route path="legal-documents/:id/edit" element={<LegalDocumentEditorPage />} />

                        {/* Marketing Module (Phase 29) */}
                        <Route path="marketing" element={<MarketingLayout />}>
                            <Route index element={<MarketingDashboard />} />
                            <Route path="leads" element={<LeadsPage />} />
                            <Route path="leads/:id" element={<LeadDetailsPage />} />
                            <Route path="telemarketing" element={<TelemarketingPage />} />
                            <Route path="affiliate" element={<AffiliatesPage />} />
                            <Route path="campaigns" element={<CampaignsPage />} />
                            <Route path="ads-analytics" element={<AdsAnalyticsPage />} />
                            <Route path="messages" element={<MessageCampaignsPage />} />
                            <Route path="calendar" element={<ContentCalendarPage />} />
                        </Route>

                        {/* Call Center */}
                        <Route path="calls" element={<CallCenterPage />} />
                        <Route path="calls/setup" element={<CallCenterSetupPage />} />

                        {/* Accounting */}
                        <Route path="accounting" element={<AccountingDashboardPage />} />
                        <Route path="accounting/accounts" element={<ChartOfAccountsPage />} />
                        <Route path="accounting/journal-entries" element={<JournalEntriesPage />} />
                        <Route path="accounting/expenses" element={<ExpensesPage />} />

                        {/* HR Management */}
                        <Route path="hr/employees" element={<EmployeesListPage />} />
                        <Route path="hr/employees/:id" element={<EmployeeDetailsPage />} />
                        <Route path="hr/attendance" element={<AttendancePage />} />
                        <Route path="hr/leaves" element={<LeaveManagementPage />} />
                        <Route path="hr/payroll" element={<PayrollPage />} />

                        {/* Legal Library (Phase 30) */}
                        <Route path="legal-library" element={<LegalLibraryHome />} />
                        <Route path="legal-library/regulations" element={<RegulationsPage />} />
                        <Route path="legal-library/regulations/:id" element={<RegulationDetailsPage />} />
                        <Route path="legal-library/precedents" element={<PrecedentsPage />} />
                        <Route path="legal-library/precedents/:id" element={<PrecedentDetailsPage />} />
                        <Route path="legal-library/glossary" element={<GlossaryPage />} />
                        <Route path="legal-library/bookmarks" element={<BookmarksPage />} />
                        <Route path="legal-search" element={<LegalAISearchPage />} />

                        {/* Dynamic Forms (Phase 38) */}
                        <Route path="forms" element={<FormsListPage />} />
                        <Route path="forms/new" element={<FormBuilderPage />} />
                        <Route path="forms/:id" element={<FormBuilderPage />} />
                        <Route path="forms/:id/submissions" element={<FormSubmissionsPage />} />

                    </Route>

                    {/* Owner Panel (Phase 27) — standalone layout, outside AppLayout */}
                    <Route
                        path="/:slug/owner"
                        element={
                            <ProtectedRoute>
                                <OwnerLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<OwnerDashboard />} />
                        <Route path="company" element={<OwnerCompanyPage />} />
                        <Route path="users" element={<OwnerUsersPage />} />
                        <Route path="roles" element={<TenantRolesListPage />} />
                        <Route path="roles/:id" element={<TenantRoleEditorPage />} />
                        <Route path="integrations" element={<OwnerIntegrationsPage />} />
                        <Route path="workflows" element={<OwnerWorkflowsPage />} />
                        <Route path="billing" element={<OwnerBillingPage />} />
                    </Route>

                    {/* Legacy redirects — backward compat */}
                    <Route path="/dashboard" element={<SlugRedirect />} />
                    <Route path="/owner" element={<SlugRedirect />} />
                    <Route path="/" element={<SlugRedirect />} />

                    {/* Public Routes - Accept Invitation */}
                    <Route path="/invitation/:token" element={<AcceptInvitationPage />} />

                    {/* Client Portal Routes */}
                    <Route path="/portal/login" element={<PortalLoginPage />} />
                    <Route path="/portal" element={<PortalLayout />}>
                        <Route index element={<Navigate to="/portal/dashboard" replace />} />
                        <Route path="dashboard" element={<PortalDashboardPage />} />
                        <Route path="cases" element={<PortalCasesPage />} />
                        <Route path="invoices" element={<PortalInvoicesPage />} />
                        <Route path="hearings" element={<PortalHearingsPage />} />
                    </Route>



                    {/* Public Form (Phase 38) */}
                    <Route path="/f/:slug" element={<PublicFormPage />} />

                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </Suspense>
        </BrowserRouter>
    );
}

export default App;

