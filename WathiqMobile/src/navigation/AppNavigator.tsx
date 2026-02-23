import React from 'react';
import { TouchableOpacity } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { colors } from '../theme/colors';

// ── Screens ──
import { HomeScreen } from '../screens/home/HomeScreen';
import { CasesListScreen } from '../screens/cases/CasesListScreen';
import { CaseDetailsScreen } from '../screens/cases/CaseDetailsScreen';
import { ClientsListScreen } from '../screens/clients/ClientsListScreen';
import { CalendarScreen } from '../screens/calendar/CalendarScreen';
import { LegalSearchScreen } from '../screens/legal/LegalSearchScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { DocumentsScreen } from '../screens/documents/DocumentsScreen';
import { TasksScreen } from '../screens/tasks/TasksScreen';
import { InvoicesScreen } from '../screens/invoices/InvoicesScreen';
import { FormsScreen } from '../screens/forms/FormsScreen';
import { LegalLibraryScreen } from '../screens/legal/LegalLibraryScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';

// ── New Detail Screens ──
import { ClientDetailsScreen } from '../screens/clients/ClientDetailsScreen';
import { CreateClientScreen } from '../screens/clients/CreateClientScreen';
import { HearingDetailsScreen } from '../screens/calendar/HearingDetailsScreen';
import { CreateHearingScreen } from '../screens/calendar/CreateHearingScreen';

// ── New Sections ──
import { NotificationsScreen } from '../screens/notifications/NotificationsScreen';
import { AccountingScreen } from '../screens/accounting/AccountingScreen';
import { ReportsScreen } from '../screens/reports/ReportsScreen';
import { LegalDocumentsScreen } from '../screens/legal-documents/LegalDocumentsScreen';

// ── Phase 2 Sections ──
import { ChatScreen } from '../screens/chat/ChatScreen';
import { MarketingScreen } from '../screens/marketing/MarketingScreen';
import { AnalyticsScreen } from '../screens/analytics/AnalyticsScreen';
import { HRScreen } from '../screens/hr/HRScreen';
import { CompanyScreen } from '../screens/company/CompanyScreen';

// ── Drawer ──
import { DrawerContent } from './DrawerContent';

// ── Shared header hamburger button ──
function HamburgerButton() {
    const navigation = useNavigation();
    return (
        <TouchableOpacity
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            style={{ paddingHorizontal: 14 }}
        >
            <Icon name="menu" size={22} color={colors.text} />
        </TouchableOpacity>
    );
}

// ═══════════════════════════════════════════════════════════
// Cases Stack (nested inside CasesTab)
// ═══════════════════════════════════════════════════════════
const CasesStack = createNativeStackNavigator();

function CasesStackNavigator() {
    return (
        <CasesStack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: colors.white },
                headerTitleStyle: { fontSize: 17, fontWeight: '600', color: colors.text },
                headerTintColor: colors.primary,
                headerBackTitle: 'رجوع',
            }}
        >
            <CasesStack.Screen
                name="CasesList"
                component={CasesListScreen}
                options={{
                    title: 'القضايا',
                    headerRight: () => <HamburgerButton />,
                }}
            />
            <CasesStack.Screen
                name="CaseDetails"
                component={CaseDetailsScreen}
                options={{ title: 'تفاصيل القضية' }}
            />
        </CasesStack.Navigator>
    );
}

// ═══════════════════════════════════════════════════════════
// Main Tab Navigator (core screens)
// ═══════════════════════════════════════════════════════════
const Tab = createBottomTabNavigator();

function MainTabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    const icons: Record<string, string> = {
                        HomeTab: 'home',
                        CasesTab: 'briefcase',
                        CalendarTab: 'calendar',
                        ClientsTab: 'users',
                        ProfileTab: 'user',
                    };
                    return <Icon name={icons[route.name] || 'circle'} size={22} color={color} />;
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textMuted,
                tabBarStyle: {
                    backgroundColor: colors.white,
                    borderTopColor: colors.borderLight,
                    paddingBottom: 6,
                    paddingTop: 6,
                    height: 60,
                },
                tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
                headerStyle: { backgroundColor: colors.white },
                headerTitleStyle: { fontSize: 17, fontWeight: '600', color: colors.text },
                headerTintColor: colors.primary,
                headerRight: () => <HamburgerButton />,
            })}
        >
            <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: 'الرئيسية', headerTitle: 'وثيق' }} />
            <Tab.Screen name="CasesTab" component={CasesStackNavigator} options={{ title: 'القضايا', headerShown: false }} />
            <Tab.Screen name="CalendarTab" component={CalendarScreen} options={{ title: 'الجلسات' }} />
            <Tab.Screen name="ClientsTab" component={ClientsListScreen} options={{ title: 'العملاء' }} />
            <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'حسابي' }} />
        </Tab.Navigator>
    );
}

// ═══════════════════════════════════════════════════════════
// Screen Stack inside the Drawer (tabs + standalone screens)
// ═══════════════════════════════════════════════════════════
const ScreenStack = createNativeStackNavigator();

function DrawerScreensStack() {
    return (
        <ScreenStack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: colors.white },
                headerTitleStyle: { fontSize: 17, fontWeight: '600', color: colors.text },
                headerTintColor: colors.primary,
                headerBackTitle: 'رجوع',
            }}
        >
            <ScreenStack.Screen name="TabsHome" component={MainTabNavigator} options={{ headerShown: false }} />
            <ScreenStack.Screen name="Documents" component={DocumentsScreen} options={{ title: 'المستندات' }} />
            <ScreenStack.Screen name="Tasks" component={TasksScreen} options={{ title: 'المهام' }} />
            <ScreenStack.Screen name="Invoices" component={InvoicesScreen} options={{ title: 'الفواتير' }} />
            <ScreenStack.Screen name="Forms" component={FormsScreen} options={{ title: 'النماذج' }} />
            <ScreenStack.Screen name="LegalLibrary" component={LegalLibraryScreen} options={{ title: 'المكتبة القانونية' }} />
            <ScreenStack.Screen name="LegalSearch" component={LegalSearchScreen} options={{ title: 'البحث الذكي' }} />
            <ScreenStack.Screen name="Settings" component={SettingsScreen} options={{ title: 'الإعدادات' }} />

            {/* Detail Screens */}
            <ScreenStack.Screen name="ClientDetails" component={ClientDetailsScreen} options={{ title: 'تفاصيل العميل' }} />
            <ScreenStack.Screen name="CreateClient" component={CreateClientScreen} options={{ title: 'إضافة عميل' }} />
            <ScreenStack.Screen name="HearingDetails" component={HearingDetailsScreen} options={{ title: 'تفاصيل الجلسة' }} />
            <ScreenStack.Screen name="CreateHearing" component={CreateHearingScreen} options={{ title: 'إضافة جلسة' }} />

            {/* New Sections */}
            <ScreenStack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'الإشعارات' }} />
            <ScreenStack.Screen name="Accounting" component={AccountingScreen} options={{ title: 'المحاسبة' }} />
            <ScreenStack.Screen name="Reports" component={ReportsScreen} options={{ title: 'التقارير' }} />
            <ScreenStack.Screen name="LegalDocuments" component={LegalDocumentsScreen} options={{ title: 'المستندات القانونية' }} />

            {/* Phase 2 Sections */}
            <ScreenStack.Screen name="Chat" component={ChatScreen} options={{ title: 'التواصل' }} />
            <ScreenStack.Screen name="Marketing" component={MarketingScreen} options={{ title: 'التسويق' }} />
            <ScreenStack.Screen name="Analytics" component={AnalyticsScreen} options={{ title: 'التحليلات' }} />
            <ScreenStack.Screen name="HR" component={HRScreen} options={{ title: 'الموارد البشرية' }} />
            <ScreenStack.Screen name="Company" component={CompanyScreen} options={{ title: 'الشركة' }} />
        </ScreenStack.Navigator>
    );
}

// ═══════════════════════════════════════════════════════════
// Drawer Navigator (outermost navigator)
// ═══════════════════════════════════════════════════════════
const Drawer = createDrawerNavigator();

export function AppNavigator() {
    return (
        <Drawer.Navigator
            drawerContent={(props) => <DrawerContent {...props} />}
            screenOptions={{
                drawerPosition: 'right',
                headerShown: false,
                drawerStyle: { width: 280 },
            }}
        >
            <Drawer.Screen name="Main" component={DrawerScreensStack} />
        </Drawer.Navigator>
    );
}
