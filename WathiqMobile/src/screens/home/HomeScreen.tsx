import React from 'react';
import {
    ScrollView, View, StyleSheet, RefreshControl, TouchableOpacity,
} from 'react-native';
import { Text, Surface, Avatar, Divider } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/Feather';
import { dashboardApi } from '../../api/cases';
import { useAuthStore } from '../../store/authStore';
import { StatCard } from '../../components/common/StatCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { colors } from '../../theme/colors';
import { CASE_STATUS_LABELS } from '../../utils/constants';
import { formatDate, getInitials } from '../../utils/formatters';

export function HomeScreen({ navigation }: any) {
    const { user } = useAuthStore();
    const { data: stats, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: dashboardApi.getStats,
    });

    if (isLoading) return <LoadingSpinner />;

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        >
            {/* Welcome Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.greeting}>مرحباً،</Text>
                    <Text style={styles.userName}>{user?.name || 'مستخدم'}</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('ProfileTab')}>
                    <Avatar.Text
                        size={48}
                        label={getInitials(user?.name || '؟')}
                        style={{ backgroundColor: colors.primary }}
                    />
                </TouchableOpacity>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <StatCard
                            title="القضايا النشطة"
                            value={stats?.activeCases ?? 0}
                            icon="briefcase"
                            color="#4F46E5"
                            onPress={() => navigation.navigate('CasesTab')}
                        />
                    </View>
                    <View style={styles.statItem}>
                        <StatCard
                            title="الجلسات القادمة"
                            value={stats?.upcomingHearings ?? 0}
                            icon="calendar"
                            color="#10B981"
                            onPress={() => navigation.navigate('CalendarTab')}
                        />
                    </View>
                </View>
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <StatCard
                            title="الفواتير المعلقة"
                            value={stats?.pendingInvoices ?? 0}
                            icon="file-text"
                            color="#F59E0B"
                        />
                    </View>
                    <View style={styles.statItem}>
                        <StatCard
                            title="المهام"
                            value={stats?.tasks ?? 0}
                            icon="check-square"
                            color="#8B5CF6"
                        />
                    </View>
                </View>
            </View>

            {/* Quick Actions */}
            <Surface style={styles.section} elevation={1}>
                <Text style={styles.sectionTitle}>إجراءات سريعة</Text>
                <View style={styles.quickActions}>
                    <QuickAction icon="plus-circle" label="قضية جديدة" color="#4F46E5"
                        onPress={() => navigation.navigate('CasesTab', { screen: 'CreateCase' })} />
                    <QuickAction icon="user-plus" label="عميل جديد" color="#10B981"
                        onPress={() => navigation.navigate('CreateClient')} />
                    <QuickAction icon="search" label="بحث قانوني" color="#8B5CF6"
                        onPress={() => navigation.navigate('LegalSearch')} />
                    <QuickAction icon="file-text" label="النماذج" color="#F59E0B"
                        onPress={() => navigation.navigate('Forms')} />
                </View>
            </Surface>

            {/* Today's Hearings */}
            {stats?.todayHearings && stats.todayHearings.length > 0 && (
                <Surface style={styles.section} elevation={1}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>جلسات اليوم</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('CalendarTab')}>
                            <Text style={styles.seeAll}>عرض الكل</Text>
                        </TouchableOpacity>
                    </View>
                    {stats.todayHearings.map((hearing: any) => (
                        <View key={hearing.id} style={styles.hearingItem}>
                            <View style={styles.hearingTime}>
                                <Icon name="clock" size={14} color={colors.primary} />
                                <Text style={styles.hearingTimeText}>{hearing.time || '—'}</Text>
                            </View>
                            <View style={styles.hearingInfo}>
                                <Text style={styles.hearingTitle}>{hearing.title}</Text>
                                <Text style={styles.hearingLocation}>{hearing.location || hearing.courtRoom || '—'}</Text>
                            </View>
                        </View>
                    ))}
                </Surface>
            )}

            {/* Recent Cases */}
            <Surface style={[styles.section, { marginBottom: 32 }]} elevation={1}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>القضايا الأخيرة</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('CasesTab')}>
                        <Text style={styles.seeAll}>عرض الكل</Text>
                    </TouchableOpacity>
                </View>
                {(stats?.recentCases || []).map((c: any) => (
                    <TouchableOpacity
                        key={c.id}
                        style={styles.caseItem}
                        onPress={() => navigation.navigate('CasesTab', { screen: 'CaseDetails', params: { id: c.id } })}
                    >
                        <View style={styles.caseIcon}>
                            <Icon name="briefcase" size={16} color={colors.primary} />
                        </View>
                        <View style={styles.caseInfo}>
                            <Text style={styles.caseTitle} numberOfLines={1}>{c.title}</Text>
                            <Text style={styles.caseMeta}>
                                {c.caseNumber} · {CASE_STATUS_LABELS[c.status] || c.status}
                            </Text>
                        </View>
                        <Icon name="chevron-left" size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                ))}
                {(!stats?.recentCases || stats.recentCases.length === 0) && (
                    <Text style={styles.emptyText}>لا توجد قضايا بعد</Text>
                )}
            </Surface>
        </ScrollView>
    );
}

// ── Quick Action Button ──
function QuickAction({ icon, label, color, onPress }: { icon: string; label: string; color: string; onPress: () => void }) {
    return (
        <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.7}>
            <View style={[styles.quickActionIcon, { backgroundColor: `${color}15` }]}>
                <Icon name={icon} size={20} color={color} />
            </View>
            <Text style={styles.quickActionLabel}>{label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 20, paddingTop: 16,
    },
    headerLeft: {},
    greeting: { fontSize: 14, color: colors.textSecondary },
    userName: { fontSize: 22, fontWeight: '700', color: colors.text, marginTop: 2 },
    statsGrid: { paddingHorizontal: 16, gap: 10 },
    statsRow: { flexDirection: 'row', gap: 10 },
    statItem: { flex: 1 },
    section: {
        margin: 16, padding: 16, borderRadius: 16, backgroundColor: colors.white,
    },
    sectionHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 14,
    },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
    seeAll: { fontSize: 13, color: colors.primary, fontWeight: '500' },
    quickActions: { flexDirection: 'row', justifyContent: 'space-around' },
    quickAction: { alignItems: 'center', gap: 8 },
    quickActionIcon: {
        width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    },
    quickActionLabel: { fontSize: 11, color: colors.textSecondary, textAlign: 'center' },
    hearingItem: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.borderLight,
    },
    hearingTime: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 60 },
    hearingTimeText: { fontSize: 13, color: colors.primary, fontWeight: '500' },
    hearingInfo: { flex: 1 },
    hearingTitle: { fontSize: 14, fontWeight: '500', color: colors.text },
    hearingLocation: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    caseItem: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight,
    },
    caseIcon: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center',
    },
    caseInfo: { flex: 1 },
    caseTitle: { fontSize: 14, fontWeight: '500', color: colors.text },
    caseMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    emptyText: { textAlign: 'center', color: colors.textMuted, fontSize: 14, padding: 20 },
});
