import React, { useState } from 'react';
import {
    View, StyleSheet, ScrollView, RefreshControl,
} from 'react-native';
import { Text, Surface, Divider, Chip, SegmentedButtons } from 'react-native-paper';
import Icon from 'react-native-vector-icons/Feather';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../../services/api.service';
import { colors } from '../../theme/colors';

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(amount || 0);

export function AnalyticsScreen() {
    const [period, setPeriod] = useState('month');

    const { data, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['analytics-dashboard', period],
        queryFn: () => apiService.get('/analytics/dashboard', { params: { period } }).then((r: any) => r.data || r),
    });

    const { data: kpiData } = useQuery({
        queryKey: ['analytics-kpi'],
        queryFn: () => apiService.get('/analytics/kpi').then((r: any) => r.data || r),
    });

    const d = data || {};
    const kpi = kpiData || {};
    const cases = d.cases || {};
    const hearings = d.hearings || {};
    const financial = d.financial || {};
    const clients = d.clients || {};

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={isLoading || isRefetching} onRefresh={refetch} />}
        >
            {/* Period Selector */}
            <SegmentedButtons
                value={period}
                onValueChange={setPeriod}
                buttons={[
                    { value: 'week', label: 'أسبوع' },
                    { value: 'month', label: 'شهر' },
                    { value: 'year', label: 'سنة' },
                ]}
                style={styles.periodSelector}
            />

            {/* KPI Summary */}
            <Surface style={styles.kpiCard} elevation={2}>
                <Text style={styles.sectionTitle}>مؤشرات الأداء الرئيسية</Text>
                <Divider style={styles.divider} />
                <View style={styles.kpiGrid}>
                    <View style={styles.kpiItem}>
                        <Icon name="percent" size={18} color="#4F46E5" />
                        <Text style={styles.kpiValue}>{(kpi.closureRate || cases.closureRate || 0).toFixed(0)}%</Text>
                        <Text style={styles.kpiLabel}>معدل الإغلاق</Text>
                    </View>
                    <View style={styles.kpiSep} />
                    <View style={styles.kpiItem}>
                        <Icon name="clock" size={18} color="#F59E0B" />
                        <Text style={styles.kpiValue}>{(kpi.averageCaseDuration || cases.avgCaseDuration || 0).toFixed(0)}</Text>
                        <Text style={styles.kpiLabel}>متوسط مدة القضية (يوم)</Text>
                    </View>
                    <View style={styles.kpiSep} />
                    <View style={styles.kpiItem}>
                        <Icon name="dollar-sign" size={18} color="#10B981" />
                        <Text style={styles.kpiValue}>{(kpi.paymentSuccessRate || 0).toFixed(0)}%</Text>
                        <Text style={styles.kpiLabel}>نسبة التحصيل</Text>
                    </View>
                </View>
            </Surface>

            {/* Cases Stats */}
            <Surface style={styles.section} elevation={1}>
                <View style={styles.sectionHeader}>
                    <Icon name="briefcase" size={18} color="#4F46E5" />
                    <Text style={styles.sectionTitle}>القضايا</Text>
                </View>
                <Divider style={styles.divider} />
                <View style={styles.statsGrid}>
                    <View style={styles.miniStat}>
                        <Text style={[styles.miniValue, { color: '#4F46E5' }]}>{cases.total || cases.totalAllCases || 0}</Text>
                        <Text style={styles.miniLabel}>إجمالي</Text>
                    </View>
                    <View style={styles.miniStat}>
                        <Text style={[styles.miniValue, { color: '#10B981' }]}>{cases.totalClosedCases || cases.recentlyClosed || 0}</Text>
                        <Text style={styles.miniLabel}>مغلقة</Text>
                    </View>
                    <View style={styles.miniStat}>
                        <Text style={[styles.miniValue, { color: '#F59E0B' }]}>{(cases.closureRate || 0).toFixed(0)}%</Text>
                        <Text style={styles.miniLabel}>معدل الإغلاق</Text>
                    </View>
                </View>
                {cases.byStatus && cases.byStatus.length > 0 && (
                    <View style={styles.chipsRow}>
                        {cases.byStatus.map((s: any) => (
                            <Chip key={s.status || s.name} style={styles.analyticChip}>
                                {s.status || s.name}: {s.count || s._count || 0}
                            </Chip>
                        ))}
                    </View>
                )}
            </Surface>

            {/* Hearings Stats */}
            <Surface style={styles.section} elevation={1}>
                <View style={styles.sectionHeader}>
                    <Icon name="calendar" size={18} color="#F59E0B" />
                    <Text style={styles.sectionTitle}>الجلسات</Text>
                </View>
                <Divider style={styles.divider} />
                <View style={styles.statsGrid}>
                    <View style={styles.miniStat}>
                        <Text style={[styles.miniValue, { color: '#4F46E5' }]}>{hearings.total || 0}</Text>
                        <Text style={styles.miniLabel}>إجمالي</Text>
                    </View>
                    <View style={styles.miniStat}>
                        <Text style={[styles.miniValue, { color: '#10B981' }]}>{hearings.upcoming || 0}</Text>
                        <Text style={styles.miniLabel}>قادمة</Text>
                    </View>
                    <View style={styles.miniStat}>
                        <Text style={[styles.miniValue, { color: '#EF4444' }]}>{hearings.today || 0}</Text>
                        <Text style={styles.miniLabel}>اليوم</Text>
                    </View>
                    <View style={styles.miniStat}>
                        <Text style={[styles.miniValue, { color: '#8B5CF6' }]}>{hearings.thisWeek || 0}</Text>
                        <Text style={styles.miniLabel}>هذا الأسبوع</Text>
                    </View>
                </View>
            </Surface>

            {/* Financial Stats */}
            <Surface style={styles.section} elevation={1}>
                <View style={styles.sectionHeader}>
                    <Icon name="credit-card" size={18} color="#10B981" />
                    <Text style={styles.sectionTitle}>المالي</Text>
                </View>
                <Divider style={styles.divider} />
                <View style={styles.financialGrid}>
                    <View style={styles.financialItem}>
                        <Text style={styles.financialLabel}>إجمالي الإيرادات</Text>
                        <Text style={[styles.financialValue, { color: '#10B981' }]}>
                            {formatCurrency(financial.totalRevenue || kpi.totalRevenue || 0)}
                        </Text>
                    </View>
                    <Divider />
                    <View style={styles.financialItem}>
                        <Text style={styles.financialLabel}>المعلق</Text>
                        <Text style={[styles.financialValue, { color: '#F59E0B' }]}>
                            {formatCurrency(financial.pending || kpi.pendingRevenue || 0)}
                        </Text>
                    </View>
                    <Divider />
                    <View style={styles.financialItem}>
                        <Text style={styles.financialLabel}>المتأخر</Text>
                        <Text style={[styles.financialValue, { color: '#EF4444' }]}>
                            {formatCurrency(financial.overdue || kpi.overdueRevenue || 0)}
                        </Text>
                    </View>
                </View>
            </Surface>

            {/* Clients */}
            <Surface style={styles.section} elevation={1}>
                <View style={styles.sectionHeader}>
                    <Icon name="users" size={18} color="#8B5CF6" />
                    <Text style={styles.sectionTitle}>العملاء</Text>
                </View>
                <Divider style={styles.divider} />
                <View style={styles.statsGrid}>
                    <View style={styles.miniStat}>
                        <Text style={[styles.miniValue, { color: '#8B5CF6' }]}>{clients.total || kpi.totalClients || 0}</Text>
                        <Text style={styles.miniLabel}>إجمالي</Text>
                    </View>
                    <View style={styles.miniStat}>
                        <Text style={[styles.miniValue, { color: '#10B981' }]}>{clients.activeClients || kpi.activeClients || 0}</Text>
                        <Text style={styles.miniLabel}>نشط</Text>
                    </View>
                    <View style={styles.miniStat}>
                        <Text style={[styles.miniValue, { color: '#4F46E5' }]}>{(kpi.retentionRate || 0).toFixed(0)}%</Text>
                        <Text style={styles.miniLabel}>الاحتفاظ</Text>
                    </View>
                </View>
            </Surface>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 40 },
    periodSelector: { marginBottom: 16 },
    kpiCard: { borderRadius: 16, padding: 16, marginBottom: 16, backgroundColor: colors.white },
    kpiGrid: { flexDirection: 'row', alignItems: 'center' },
    kpiItem: { flex: 1, alignItems: 'center', paddingVertical: 8 },
    kpiSep: { width: 1, height: 50, backgroundColor: colors.borderLight || '#E5E7EB' },
    kpiValue: { fontSize: 24, fontWeight: '700', color: colors.text, marginTop: 4 },
    kpiLabel: { fontSize: 10, color: colors.textSecondary, marginTop: 2, textAlign: 'center' },
    section: { borderRadius: 16, padding: 16, backgroundColor: colors.white, marginBottom: 16 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 4 },
    divider: { marginVertical: 8 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    miniStat: { width: '25%', alignItems: 'center', paddingVertical: 8 },
    miniValue: { fontSize: 20, fontWeight: '700' },
    miniLabel: { fontSize: 10, color: colors.textSecondary, marginTop: 2 },
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
    analyticChip: { height: 28, backgroundColor: colors.primaryLight || '#EEF0FF' },
    financialGrid: { gap: 8 },
    financialItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
    financialLabel: { fontSize: 13, color: colors.textSecondary },
    financialValue: { fontSize: 15, fontWeight: '700' },
});
