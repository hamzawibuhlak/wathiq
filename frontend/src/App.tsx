import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { AuthLayout, AppLayout } from '@/components/layout';
import { OfflineIndicator } from '@/components/layout/OfflineIndicator';
import { InstallPrompt } from '@/components/InstallPrompt';
import { UpdatePrompt } from '@/components/UpdatePrompt';

const PageLoader = () => (
    <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
    </div>
);

// Auth
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
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
const AccountLayout = lazy(() => import('@/pages/settings/AccountLayout'));
const ProfilePage = lazy(() => import('@/pages/settings/ProfilePage'));
const UsersPage = lazy(() => import('@/pages/settings/UsersPage'));
const FirmPage = lazy(() => import('@/pages/settings/FirmPage'));
const NotificationsPage = lazy(() => import('@/pages/settings/NotificationsPage'));
const WhatsAppSettingsPage = lazy(() => import('@/pages/settings/WhatsAppSettingsPage'));
const EmailSettingsPage = lazy(() => import('@/pages/settings/EmailSettingsPage'));
const TwoFactorPage = lazy(() => import('@/pages/settings/TwoFactorPage'));
const ImportPage = lazy(() => import('@/pages/settings/ImportPage'));
const CallCenterSettingsPage = lazy(() => import('@/pages/settings/CallCenterSettingsPage'));

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

// Internal Chat
const ChatPage = lazy(() => import('@/pages/chat/ChatPage'));

// Legal Document Editor
const LegalDocumentsPage = lazy(() => import('@/pages/legal-documents/LegalDocumentsPage'));
const NewDocumentPage = lazy(() => import('@/pages/legal-documents/NewDocumentPage'));
const LegalDocumentEditorPage = lazy(() => import('@/pages/legal-documents/LegalDocumentEditorPage'));

// Marketing Module
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

// Legal Library
const LegalLibraryHome = lazy(() => import('@/pages/legal-library/LegalLibraryHome'));
const RegulationsPage = lazy(() => import('@/pages/legal-library/RegulationsPage'));
const RegulationDetailsPage = lazy(() => import('@/pages/legal-library/RegulationDetailsPage'));
const PrecedentsPage = lazy(() => import('@/pages/legal-library/PrecedentsPage'));
const PrecedentDetailsPage = lazy(() => import('@/pages/legal-library/PrecedentDetailsPage'));
const GlossaryPage = lazy(() => import('@/pages/legal-library/GlossaryPage'));
const BookmarksPage = lazy(() => import('@/pages/legal-library/BookmarksPage'));
const LegalAISearchPage = lazy(() => import('@/pages/legal-library/LegalAISearchPage'));

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

const PrivacyPolicyPage = lazy(() => import('@/pages/legal/PrivacyPolicyPage').then(m => ({ default: m.PrivacyPolicyPage })));

// Accept Invitation (Public)
const AcceptInvitationPage = lazy(() => import('@/pages/invitations/AcceptInvitationPage'));

// Dynamic Forms
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

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, _hasHydrated } = useAuthStore();
    if (!_hasHydrated) return <PageLoader />;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, _hasHydrated } = useAuthStore();
    if (!_hasHydrated) return <PageLoader />;
    if (isAuthenticated) return <Navigate to="/dashboard" replace />;
    return <>{children}</>;
};

function App() {
    return (
        <BrowserRouter>
            <InstallPrompt />
            <UpdatePrompt />
            <OfflineIndicator />

            <Suspense fallback={<PageLoader />}>
                <Routes>
                    {/* Auth */}
                    <Route
                        element={
                            <PublicRoute>
                                <AuthLayout />
                            </PublicRoute>
                        }
                    >
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    </Route>

                    <Route path="/privacy" element={<PrivacyPolicyPage />} />

                    {/* App */}
                    <Route
                        element={
                            <ProtectedRoute>
                                <AppLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route path="/dashboard" element={<DashboardPage />} />

                        <Route path="/cases" element={<CasesListPage />} />
                        <Route path="/cases/new" element={<CreateCasePage />} />
                        <Route path="/cases/:id" element={<CaseDetailsPage />} />
                        <Route path="/cases/:id/edit" element={<EditCasePage />} />

                        <Route path="/hearings" element={<HearingsListPage />} />
                        <Route path="/hearings/calendar" element={<CalendarPage />} />
                        <Route path="/hearings/new" element={<CreateHearingPage />} />
                        <Route path="/hearings/:id/edit" element={<EditHearingPage />} />

                        <Route path="/clients" element={<ClientsListPage />} />
                        <Route path="/customers" element={<Navigate to="/clients" replace />} />
                        <Route path="/clients/new" element={<CreateClientPage />} />
                        <Route path="/clients/:id" element={<ClientDetailsPage />} />
                        <Route path="/clients/:id/edit" element={<EditClientPage />} />

                        <Route path="/documents" element={<DocumentsPage />} />

                        <Route path="/invoices" element={<InvoicesListPage />} />
                        <Route path="/invoices/new" element={<CreateInvoicePage />} />
                        <Route path="/invoices/:id" element={<InvoiceDetailsPage />} />
                        <Route path="/invoices/:id/edit" element={<EditInvoicePage />} />

                        <Route path="/settings" element={<SettingsLayout />}>
                            <Route index element={<Navigate to="firm" replace />} />
                            <Route path="users" element={<UsersPage />} />
                            <Route path="firm" element={<FirmPage />} />
                            <Route path="email" element={<EmailSettingsPage />} />
                            <Route path="whatsapp" element={<WhatsAppSettingsPage />} />
                            <Route path="security" element={<TwoFactorPage />} />
                            <Route path="import" element={<ImportPage />} />
                            <Route path="call-center" element={<CallCenterSettingsPage />} />
                        </Route>

                        <Route path="/account" element={<AccountLayout />}>
                            <Route index element={<Navigate to="profile" replace />} />
                            <Route path="profile" element={<ProfilePage />} />
                            <Route path="notifications" element={<NotificationsPage />} />
                        </Route>

                        <Route path="/activity-logs" element={<ActivityLogsPage />} />
                        <Route path="/whatsapp" element={<WhatsAppMessagesPage />} />

                        <Route path="/tasks" element={<TasksListPage />} />
                        <Route path="/tasks/:id" element={<TaskDetailsPage />} />

                        <Route path="/workflows" element={<WorkflowsListPage />} />
                        <Route path="/notifications" element={<NotificationsListPage />} />

                        <Route path="/analytics" element={<AnalyticsDashboardPage />} />
                        <Route path="/analytics/advanced" element={<AdvancedAnalyticsPage />} />
                        <Route path="/analytics/performance" element={<PerformanceReportPage />} />
                        <Route path="/reports" element={<ReportsPage />} />

                        <Route path="/messages" element={<MessagesPage />} />
                        <Route path="/messages/:id" element={<MessagesPage />} />

                        <Route path="/chat" element={<ChatPage />} />

                        <Route path="/legal-documents" element={<LegalDocumentsPage />} />
                        <Route path="/legal-documents/new" element={<NewDocumentPage />} />
                        <Route path="/legal-documents/:id/edit" element={<LegalDocumentEditorPage />} />

                        <Route path="/marketing" element={<MarketingLayout />}>
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

                        <Route path="/calls" element={<CallCenterPage />} />
                        <Route path="/calls/setup" element={<CallCenterSetupPage />} />

                        <Route path="/accounting" element={<AccountingDashboardPage />} />
                        <Route path="/accounting/accounts" element={<ChartOfAccountsPage />} />
                        <Route path="/accounting/journal-entries" element={<JournalEntriesPage />} />
                        <Route path="/accounting/expenses" element={<ExpensesPage />} />

                        <Route path="/hr/employees" element={<EmployeesListPage />} />
                        <Route path="/hr/employees/:id" element={<EmployeeDetailsPage />} />
                        <Route path="/hr/attendance" element={<AttendancePage />} />
                        <Route path="/hr/leaves" element={<LeaveManagementPage />} />
                        <Route path="/hr/payroll" element={<PayrollPage />} />

                        <Route path="/legal-library" element={<LegalLibraryHome />} />
                        <Route path="/legal-library/regulations" element={<RegulationsPage />} />
                        <Route path="/legal-library/regulations/:id" element={<RegulationDetailsPage />} />
                        <Route path="/legal-library/precedents" element={<PrecedentsPage />} />
                        <Route path="/legal-library/precedents/:id" element={<PrecedentDetailsPage />} />
                        <Route path="/legal-library/glossary" element={<GlossaryPage />} />
                        <Route path="/legal-library/bookmarks" element={<BookmarksPage />} />
                        <Route path="/legal-search" element={<LegalAISearchPage />} />

                        <Route path="/forms" element={<FormsListPage />} />
                        <Route path="/forms/new" element={<FormBuilderPage />} />
                        <Route path="/forms/:id" element={<FormBuilderPage />} />
                        <Route path="/forms/:id/submissions" element={<FormSubmissionsPage />} />
                    </Route>

                    {/* Root redirect */}
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />

                    {/* Public Routes */}
                    <Route path="/invitation/:token" element={<AcceptInvitationPage />} />

                    {/* Client Portal */}
                    <Route path="/portal/login" element={<PortalLoginPage />} />
                    <Route path="/portal" element={<PortalLayout />}>
                        <Route index element={<Navigate to="/portal/dashboard" replace />} />
                        <Route path="dashboard" element={<PortalDashboardPage />} />
                        <Route path="cases" element={<PortalCasesPage />} />
                        <Route path="invoices" element={<PortalInvoicesPage />} />
                        <Route path="hearings" element={<PortalHearingsPage />} />
                    </Route>

                    <Route path="/f/:slug" element={<PublicFormPage />} />

                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </Suspense>
        </BrowserRouter>
    );
}

export default App;
