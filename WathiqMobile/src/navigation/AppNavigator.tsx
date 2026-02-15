import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
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

// ═══════════════════════════════════════════════════════════
// Cases Stack
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
                options={{ title: 'القضايا' }}
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
// Main Tab Navigator
// ═══════════════════════════════════════════════════════════
const Tab = createBottomTabNavigator();

export function MainTabNavigator() {
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
// Root Stack (includes screens outside tabs)
// ═══════════════════════════════════════════════════════════
const RootStack = createNativeStackNavigator();

export function AppNavigator() {
    return (
        <RootStack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: colors.white },
                headerTitleStyle: { fontSize: 17, fontWeight: '600', color: colors.text },
                headerTintColor: colors.primary,
                headerBackTitle: 'رجوع',
            }}
        >
            <RootStack.Screen
                name="MainTabs"
                component={MainTabNavigator}
                options={{ headerShown: false }}
            />
            <RootStack.Screen
                name="LegalSearch"
                component={LegalSearchScreen}
                options={{ title: 'البحث القانوني' }}
            />
        </RootStack.Navigator>
    );
}
