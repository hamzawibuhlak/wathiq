import React from 'react';
import { ScrollView, View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Text, Surface, Avatar, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/Feather';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../theme/colors';
import { getInitials } from '../../utils/formatters';

const ROLE_LABELS: Record<string, string> = {
    OWNER: 'مالك المكتب',
    ADMIN: 'مدير',
    LAWYER: 'محامي',
    SECRETARY: 'سكرتير',
    ACCOUNTANT: 'محاسب',
};

export function ProfileScreen({ navigation }: any) {
    const { user, logout } = useAuthStore();

    const handleLogout = () => {
        Alert.alert(
            'تسجيل الخروج',
            'هل أنت متأكد من تسجيل الخروج؟',
            [
                { text: 'إلغاء', style: 'cancel' },
                { text: 'خروج', style: 'destructive', onPress: () => logout() },
            ],
        );
    };

    return (
        <ScrollView style={styles.container}>
            {/* Profile Header */}
            <Surface style={styles.profileCard} elevation={1}>
                <Avatar.Text
                    size={72}
                    label={getInitials(user?.name || '؟')}
                    style={{ backgroundColor: colors.primary }}
                />
                <Text style={styles.userName}>{user?.name}</Text>
                <Text style={styles.userEmail}>{user?.email}</Text>
                <View style={styles.roleBadge}>
                    <Text style={styles.roleText}>{ROLE_LABELS[user?.role || ''] || user?.role}</Text>
                </View>
                <Text style={styles.tenantName}>{user?.tenantName || user?.tenantSlug}</Text>
            </Surface>

            {/* Menu Items */}
            <Surface style={styles.menuCard} elevation={1}>
                <MenuItem icon="user" label="تعديل الملف الشخصي" onPress={() => { }} />
                <Divider />
                <MenuItem icon="lock" label="تغيير كلمة المرور" onPress={() => { }} />
                <Divider />
                <MenuItem icon="bell" label="إعدادات الإشعارات" onPress={() => { }} />
            </Surface>

            <Surface style={styles.menuCard} elevation={1}>
                <MenuItem icon="folder" label="المستندات" onPress={() => navigation.navigate('DocumentsList')} />
                <Divider />
                <MenuItem icon="file-text" label="النماذج" onPress={() => navigation.navigate('FormsList')} />
                <Divider />
                <MenuItem icon="search" label="البحث القانوني" onPress={() => navigation.navigate('LegalSearch')} />
            </Surface>

            <Surface style={styles.menuCard} elevation={1}>
                <MenuItem icon="info" label="عن التطبيق" onPress={() => { }} color={colors.textSecondary} />
                <Divider />
                <MenuItem icon="log-out" label="تسجيل الخروج" onPress={handleLogout} color={colors.error} />
            </Surface>

            <Text style={styles.version}>وثيق v1.0.0</Text>
        </ScrollView>
    );
}

function MenuItem({ icon, label, onPress, color }: { icon: string; label: string; onPress: () => void; color?: string }) {
    return (
        <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.6}>
            <Icon name={icon} size={18} color={color || colors.text} />
            <Text style={[styles.menuLabel, color ? { color } : null]}>{label}</Text>
            <Icon name="chevron-left" size={16} color={colors.textMuted} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    profileCard: {
        margin: 16, padding: 24, borderRadius: 16, backgroundColor: colors.white, alignItems: 'center',
    },
    userName: { fontSize: 22, fontWeight: '700', color: colors.text, marginTop: 14 },
    userEmail: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
    roleBadge: {
        backgroundColor: colors.primaryBg, paddingHorizontal: 14, paddingVertical: 5,
        borderRadius: 8, marginTop: 10,
    },
    roleText: { fontSize: 13, fontWeight: '500', color: colors.primary },
    tenantName: { fontSize: 13, color: colors.textMuted, marginTop: 8 },
    menuCard: { marginHorizontal: 16, marginBottom: 12, borderRadius: 14, backgroundColor: colors.white },
    menuItem: {
        flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16,
    },
    menuLabel: { flex: 1, fontSize: 15, color: colors.text },
    version: { textAlign: 'center', color: colors.textMuted, fontSize: 12, marginVertical: 20 },
});
