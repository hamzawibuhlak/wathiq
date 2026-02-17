import React from 'react';
import {
    View, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { Text, Surface, Switch, Divider, Avatar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/Feather';
import { colors } from '../../theme/colors';
import { useAuthStore } from '../../store/authStore';

export function SettingsScreen() {
    const { user, logout } = useAuthStore();
    const [notifications, setNotifications] = React.useState(true);
    const [darkMode, setDarkMode] = React.useState(false);

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

    const settingsGroups = [
        {
            title: 'الحساب',
            items: [
                { icon: 'user', label: 'الملف الشخصي', value: user?.name || '' },
                { icon: 'mail', label: 'البريد الإلكتروني', value: user?.email || '' },
                { icon: 'phone', label: 'الهاتف', value: user?.phone || 'غير محدد' },
            ],
        },
        {
            title: 'التفضيلات',
            items: [
                {
                    icon: 'bell', label: 'الإشعارات',
                    toggle: true, value: notifications,
                    onToggle: () => setNotifications(!notifications),
                },
                {
                    icon: 'moon', label: 'الوضع الداكن',
                    toggle: true, value: darkMode,
                    onToggle: () => setDarkMode(!darkMode),
                },
            ],
        },
        {
            title: 'الدعم',
            items: [
                { icon: 'help-circle', label: 'مركز المساعدة' },
                { icon: 'info', label: 'حول التطبيق', value: 'v1.0.0' },
            ],
        },
    ];

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Profile Card */}
            <Surface style={styles.profileCard} elevation={2}>
                <Avatar.Text
                    size={60}
                    label={(user?.name || 'U').substring(0, 2)}
                    style={{ backgroundColor: colors.primary }}
                />
                <Text style={styles.name}>{user?.name || 'المستخدم'}</Text>
                <Text style={styles.role}>{user?.role === 'OWNER' ? 'مالك' : user?.role || 'مستخدم'}</Text>
            </Surface>

            {/* Settings Groups */}
            {settingsGroups.map((group) => (
                <View key={group.title} style={styles.group}>
                    <Text style={styles.groupTitle}>{group.title}</Text>
                    <Surface style={styles.groupCard} elevation={1}>
                        {group.items.map((item: any, i: number) => (
                            <React.Fragment key={item.label}>
                                <TouchableOpacity style={styles.row} disabled={item.toggle}>
                                    <Icon name={item.icon} size={18} color={colors.primary} />
                                    <Text style={styles.rowLabel}>{item.label}</Text>
                                    {item.toggle ? (
                                        <Switch
                                            value={item.value}
                                            onValueChange={item.onToggle}
                                            color={colors.primary}
                                        />
                                    ) : (
                                        <Text style={styles.rowValue} numberOfLines={1}>{item.value || ''}</Text>
                                    )}
                                </TouchableOpacity>
                                {i < group.items.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </Surface>
                </View>
            ))}

            {/* Logout */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Icon name="log-out" size={18} color="#EF5350" />
                <Text style={styles.logoutText}>تسجيل الخروج</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 40 },
    profileCard: {
        borderRadius: 20, padding: 24,
        backgroundColor: colors.white, alignItems: 'center', marginBottom: 20,
    },
    name: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 12 },
    role: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    group: { marginBottom: 16 },
    groupTitle: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8, paddingHorizontal: 4 },
    groupCard: { borderRadius: 14, backgroundColor: colors.white, overflow: 'hidden' },
    row: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 14, paddingHorizontal: 16, gap: 12,
    },
    rowLabel: { flex: 1, fontSize: 14, color: colors.text },
    rowValue: { fontSize: 13, color: colors.textSecondary, maxWidth: 160, textAlign: 'left' },
    logoutButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 14, marginTop: 10, gap: 8,
        borderRadius: 14, borderWidth: 1, borderColor: '#EF535030',
        backgroundColor: '#EF535008',
    },
    logoutText: { fontSize: 15, fontWeight: '600', color: '#EF5350' },
});
