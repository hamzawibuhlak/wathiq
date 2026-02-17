import React from 'react';
import {
    View, StyleSheet, ScrollView, RefreshControl,
} from 'react-native';
import { Text, Surface, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/Feather';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../../services/api.service';
import { colors } from '../../theme/colors';

export function ReportsScreen() {
    const { data, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['reports-summary'],
        queryFn: () => apiService.get('/reports/summary').then((r: any) => r.data || r),
    });

    const stats = data || {};

    const overviewCards = [
        { icon: 'briefcase', label: 'إجمالي القضايا', value: stats.totalCases || 0, color: '#4F46E5' },
        { icon: 'users', label: 'العملاء', value: stats.totalClients || 0, color: '#8B5CF6' },
        { icon: 'calendar', label: 'الجلسات', value: stats.totalHearings || 0, color: '#F59E0B' },
        { icon: 'check-square', label: 'المهام', value: stats.totalTasks || 0, color: '#10B981' },
        { icon: 'file-text', label: 'الفواتير', value: stats.totalInvoices || 0, color: '#06B6D4' },
        { icon: 'file', label: 'المستندات', value: stats.totalDocuments || 0, color: '#EC4899' },
    ];

    const casesByStatus = stats.casesByStatus || [];
    const tasksByStatus = stats.tasksByStatus || [];

    const CASE_STATUS_LABELS: Record<string, string> = {
        ACTIVE: 'نشطة', CLOSED: 'مغلقة', PENDING: 'معلقة',
        ARCHIVED: 'مؤرشفة', DRAFT: 'مسودة',
    };
    const TASK_STATUS_LABELS: Record<string, string> = {
        TODO: 'قيد التنفيذ', IN_PROGRESS: 'جاري العمل', DONE: 'مكتمل',
    };
    const STATUS_COLORS: Record<string, string> = {
        ACTIVE: '#4F46E5', CLOSED: '#10B981', PENDING: '#F59E0B',
        ARCHIVED: '#6B7280', DRAFT: '#9CA3AF',
        TODO: '#6B7280', IN_PROGRESS: '#3B82F6', DONE: '#10B981',
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={isLoading || isRefetching} onRefresh={refetch} />}
        >
            {/* Overview Grid */}
            <Text style={styles.pageTitle}>نظرة عامة</Text>
            <View style={styles.grid}>
                {overviewCards.map((card) => (
                    <Surface key={card.label} style={styles.statCard} elevation={2}>
                        <View style={[styles.statIcon, { backgroundColor: `${card.color}12` }]}>
                            <Icon name={card.icon} size={20} color={card.color} />
                        </View>
                        <Text style={styles.statNumber}>{card.value}</Text>
                        <Text style={styles.statLabel}>{card.label}</Text>
                    </Surface>
                ))}
            </View>

            {/* Cases by Status */}
            {casesByStatus.length > 0 && (
                <Surface style={styles.section} elevation={1}>
                    <Text style={styles.sectionTitle}>القضايا حسب الحالة</Text>
                    <Divider style={styles.divider} />
                    {casesByStatus.map((item: any) => {
                        const total = casesByStatus.reduce((a: number, b: any) => a + (b.count || b._count || 0), 0);
                        const count = item.count || item._count || 0;
                        const pct = total > 0 ? (count / total) * 100 : 0;
                        const color = STATUS_COLORS[item.status] || '#6B7280';
                        return (
                            <View key={item.status} style={styles.barRow}>
                                <Text style={styles.barLabel}>
                                    {CASE_STATUS_LABELS[item.status] || item.status}
                                </Text>
                                <View style={styles.barTrack}>
                                    <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
                                </View>
                                <Text style={[styles.barCount, { color }]}>{count}</Text>
                            </View>
                        );
                    })}
                </Surface>
            )}

            {/* Tasks by Status */}
            {tasksByStatus.length > 0 && (
                <Surface style={styles.section} elevation={1}>
                    <Text style={styles.sectionTitle}>المهام حسب الحالة</Text>
                    <Divider style={styles.divider} />
                    {tasksByStatus.map((item: any) => {
                        const total = tasksByStatus.reduce((a: number, b: any) => a + (b.count || b._count || 0), 0);
                        const count = item.count || item._count || 0;
                        const pct = total > 0 ? (count / total) * 100 : 0;
                        const color = STATUS_COLORS[item.status] || '#6B7280';
                        return (
                            <View key={item.status} style={styles.barRow}>
                                <Text style={styles.barLabel}>
                                    {TASK_STATUS_LABELS[item.status] || item.status}
                                </Text>
                                <View style={styles.barTrack}>
                                    <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
                                </View>
                                <Text style={[styles.barCount, { color }]}>{count}</Text>
                            </View>
                        );
                    })}
                </Surface>
            )}

            {/* Monthly Summary */}
            {stats.monthlySummary && (
                <Surface style={styles.section} elevation={1}>
                    <Text style={styles.sectionTitle}>ملخص الشهر الحالي</Text>
                    <Divider style={styles.divider} />
                    <View style={styles.monthlyGrid}>
                        <View style={styles.monthlyItem}>
                            <Text style={styles.monthlyNumber}>{stats.monthlySummary.newCases || 0}</Text>
                            <Text style={styles.monthlyLabel}>قضايا جديدة</Text>
                        </View>
                        <View style={styles.monthlyItem}>
                            <Text style={styles.monthlyNumber}>{stats.monthlySummary.closedCases || 0}</Text>
                            <Text style={styles.monthlyLabel}>قضايا مغلقة</Text>
                        </View>
                        <View style={styles.monthlyItem}>
                            <Text style={styles.monthlyNumber}>{stats.monthlySummary.hearings || 0}</Text>
                            <Text style={styles.monthlyLabel}>جلسات</Text>
                        </View>
                    </View>
                </Surface>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 40 },
    pageTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
    statCard: {
        width: '31%', flexGrow: 1, borderRadius: 14, padding: 14,
        backgroundColor: colors.white, alignItems: 'center',
    },
    statIcon: {
        width: 40, height: 40, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center', marginBottom: 8,
    },
    statNumber: { fontSize: 22, fontWeight: '700', color: colors.text },
    statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2, textAlign: 'center' },
    section: {
        borderRadius: 16, padding: 16,
        backgroundColor: colors.white, marginBottom: 16,
    },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 8 },
    divider: { marginVertical: 8 },
    barRow: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingVertical: 6,
    },
    barLabel: { width: 70, fontSize: 12, color: colors.textSecondary },
    barTrack: {
        flex: 1, height: 8, borderRadius: 4,
        backgroundColor: colors.borderLight || '#F3F4F6',
        overflow: 'hidden',
    },
    barFill: { height: '100%', borderRadius: 4 },
    barCount: { width: 30, fontSize: 13, fontWeight: '700', textAlign: 'center' },
    monthlyGrid: { flexDirection: 'row' },
    monthlyItem: { flex: 1, alignItems: 'center', paddingVertical: 8 },
    monthlyNumber: { fontSize: 24, fontWeight: '700', color: colors.primary },
    monthlyLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 4 },
});
