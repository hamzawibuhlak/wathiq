import React, { useState } from 'react';
import {
    View, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform,
} from 'react-native';
import { Text, Avatar, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { useAuthStore } from '../store/authStore';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';

interface NavItem {
    icon: string;
    label: string;
    screen: string;
}

interface NavGroup {
    id: string;
    title: string;
    icon: string;
    items: NavItem[];
}

// Navigation structure matching the web Sidebar.tsx exactly
const navGroups: NavGroup[] = [
    {
        id: 'work',
        title: 'إدارة العمل',
        icon: 'briefcase',
        items: [
            { icon: 'users', label: 'العملاء', screen: 'ClientsTab' },
            { icon: 'briefcase', label: 'القضايا', screen: 'CasesTab' },
            { icon: 'calendar', label: 'الجلسات', screen: 'CalendarTab' },
            { icon: 'file', label: 'المستندات', screen: 'Documents' },
            { icon: 'check-square', label: 'المهام', screen: 'Tasks' },
            { icon: 'edit', label: 'محرر الوثائق', screen: 'LegalDocuments' },
            { icon: 'book-open', label: 'المكتبة القانونية', screen: 'LegalLibrary' },
            { icon: 'zap', label: 'البحث الذكي', screen: 'LegalSearch' },
            { icon: 'clipboard', label: 'النماذج', screen: 'Forms' },
        ],
    },
    {
        id: 'communication',
        title: 'التواصل',
        icon: 'message-square',
        items: [
            { icon: 'message-circle', label: 'الدردشة الداخلية', screen: 'Chat' },
        ],
    },
    {
        id: 'marketing',
        title: 'التسويق',
        icon: 'volume-2',
        items: [
            { icon: 'target', label: 'التسويق', screen: 'Marketing' },
        ],
    },
    {
        id: 'analytics',
        title: 'التحليلات',
        icon: 'bar-chart-2',
        items: [
            { icon: 'bar-chart-2', label: 'التقارير والإحصائيات', screen: 'Analytics' },
            { icon: 'download', label: 'تصدير البيانات', screen: 'Reports' },
        ],
    },
    {
        id: 'hr',
        title: 'الموارد البشرية',
        icon: 'users',
        items: [
            { icon: 'users', label: 'الموظفون', screen: 'HR' },
        ],
    },
    {
        id: 'finance',
        title: 'المالية',
        icon: 'credit-card',
        items: [
            { icon: 'file-text', label: 'الفواتير', screen: 'Invoices' },
            { icon: 'dollar-sign', label: 'المحاسبة', screen: 'Accounting' },
        ],
    },
    {
        id: 'settings',
        title: 'الإعدادات',
        icon: 'settings',
        items: [
            { icon: 'user', label: 'الملف الشخصي', screen: 'ProfileTab' },
            { icon: 'bell', label: 'الإشعارات', screen: 'Notifications' },
        ],
    },
];

export function DrawerContent(props: DrawerContentComponentProps) {
    const insets = useSafeAreaInsets();
    const { user, logout } = useAuthStore();
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

    const currentRoute = props.state.routes[props.state.index]?.name;

    const toggleGroup = (id: string) => {
        setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const navigateTo = (screen: string) => {
        // Tab screens need nested navigation: Main (stack) → TabsHome (tabs) → screen
        const tabScreens = ['HomeTab', 'CasesTab', 'CalendarTab', 'ClientsTab', 'ProfileTab'];
        if (tabScreens.includes(screen)) {
            props.navigation.navigate('Main', {
                screen: 'TabsHome',
                params: { screen },
            });
        } else {
            // Standalone screens are direct children of the Main stack
            props.navigation.navigate('Main', { screen });
        }
        props.navigation.closeDrawer();
    };

    const handleLogout = () => {
        Alert.alert(
            'تسجيل الخروج',
            'هل أنت متأكد من تسجيل الخروج؟',
            [
                { text: 'إلغاء', style: 'cancel' },
                { text: 'خروج', style: 'destructive', onPress: () => logout() },
            ]
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* User Header */}
            <View style={styles.header}>
                <Avatar.Text
                    size={48}
                    label={(user?.name || 'U').substring(0, 2)}
                    style={{ backgroundColor: colors.primary }}
                />
                <View style={styles.headerInfo}>
                    <Text style={styles.userName} numberOfLines={1}>{user?.name || 'المستخدم'}</Text>
                    <Text style={styles.userRole}>
                        {user?.role === 'OWNER' ? 'مالك المكتب' : user?.role || 'مستخدم'}
                    </Text>
                </View>
            </View>

            <Divider style={styles.divider} />

            {/* Nav Groups */}
            <ScrollView style={styles.nav} showsVerticalScrollIndicator={false}>
                {/* ═══ Dashboard (standalone, like web) ═══ */}
                <TouchableOpacity
                    style={[styles.dashboardItem, currentRoute === 'MainTabs' && styles.dashboardItemActive]}
                    onPress={() => navigateTo('HomeTab')}
                >
                    <Icon name="grid" size={18} color={currentRoute === 'MainTabs' ? '#fff' : colors.primary} />
                    <Text style={[styles.dashboardLabel, currentRoute === 'MainTabs' && styles.dashboardLabelActive]}>لوحة التحكم</Text>
                </TouchableOpacity>

                <View style={styles.separator} />

                {navGroups.map((group) => (
                    <View key={group.id} style={styles.group}>
                        <TouchableOpacity
                            style={styles.groupHeader}
                            onPress={() => toggleGroup(group.id)}
                        >
                            <Icon name={group.icon} size={16} color={colors.textSecondary} />
                            <Text style={styles.groupTitle}>{group.title}</Text>
                            <Icon
                                name={collapsed[group.id] ? 'chevron-down' : 'chevron-up'}
                                size={14}
                                color={colors.textMuted}
                            />
                        </TouchableOpacity>

                        {!collapsed[group.id] && group.items.map((item) => {
                            const isActive = currentRoute === item.screen ||
                                (item.screen === 'HomeTab' && currentRoute === 'MainTabs');

                            return (
                                <TouchableOpacity
                                    key={item.screen}
                                    style={[styles.navItem, isActive && styles.navItemActive]}
                                    onPress={() => navigateTo(item.screen)}
                                >
                                    <Icon
                                        name={item.icon}
                                        size={18}
                                        color={isActive ? colors.primary : colors.textSecondary}
                                    />
                                    <Text style={[
                                        styles.navLabel,
                                        isActive && styles.navLabelActive,
                                    ]}>
                                        {item.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ))}
            </ScrollView>

            {/* صفحة الشركة (standalone at bottom, like web) */}
            <TouchableOpacity
                style={styles.companyRow}
                onPress={() => navigateTo('Company')}
            >
                <Icon name="globe" size={18} color="#10B981" />
                <Text style={styles.companyText}>صفحة الشركة</Text>
            </TouchableOpacity>

            {/* Logout */}
            <Divider style={styles.divider} />
            <TouchableOpacity style={styles.logoutRow} onPress={handleLogout}>
                <Icon name="log-out" size={18} color="#EF5350" />
                <Text style={styles.logoutText}>تسجيل الخروج</Text>
            </TouchableOpacity>

            <View style={{ height: insets.bottom + 8 }} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 12,
    },
    headerInfo: { flex: 1 },
    userName: { fontSize: 16, fontWeight: '700', color: colors.text },
    userRole: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    divider: { marginHorizontal: 16 },
    nav: { flex: 1, paddingHorizontal: 12 },
    group: { marginTop: 12 },
    groupHeader: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 8, paddingHorizontal: 8, gap: 8,
    },
    groupTitle: {
        flex: 1, fontSize: 12, fontWeight: '600',
        color: colors.textSecondary, textTransform: 'uppercase',
    },
    navItem: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 10, paddingHorizontal: 12,
        borderRadius: 10, gap: 10, marginVertical: 1,
    },
    navItemActive: {
        backgroundColor: colors.primaryLight || '#EEF0FF',
    },
    navLabel: { fontSize: 14, color: colors.text },
    navLabelActive: { color: colors.primary, fontWeight: '600' },
    dashboardItem: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 12, paddingHorizontal: 14,
        borderRadius: 12, gap: 10, marginTop: 4,
        backgroundColor: colors.primaryLight || '#EEF0FF',
    },
    dashboardItemActive: {
        backgroundColor: colors.primary,
    },
    dashboardLabel: {
        fontSize: 15, fontWeight: '600', color: colors.primary,
    },
    dashboardLabelActive: {
        color: '#fff',
    },
    separator: {
        height: 1, backgroundColor: colors.borderLight || '#E5E7EB',
        marginVertical: 8, marginHorizontal: 4,
    },
    companyRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 12, paddingHorizontal: 20, gap: 10,
        marginHorizontal: 12, marginBottom: 4,
        borderRadius: 12,
        backgroundColor: '#ECFDF5',
        borderWidth: 1,
        borderColor: '#A7F3D0',
    },
    companyText: { fontSize: 14, fontWeight: '600', color: '#059669' },
    logoutRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 14, paddingHorizontal: 20, gap: 10,
    },
    logoutText: { fontSize: 14, fontWeight: '600', color: '#EF5350' },
});
