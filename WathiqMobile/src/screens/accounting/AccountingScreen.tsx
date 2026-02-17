import React from 'react';
import {
    View, StyleSheet, ScrollView, RefreshControl,
} from 'react-native';
import { Text, Surface, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/Feather';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../../services/api.service';
import { colors } from '../../theme/colors';

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(amount || 0);

export function AccountingScreen() {
    const { data, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['accounting-dashboard'],
        queryFn: () => apiService.get('/accounting/dashboard').then((r: any) => r.data || r),
    });

    const stats = data || {};

    const summaryCards = [
        {
            icon: 'trending-up', label: 'الإيرادات', color: '#10B981',
            value: formatCurrency(stats.totalRevenue || stats.revenue || 0),
        },
        {
            icon: 'trending-down', label: 'المصروفات', color: '#EF4444',
            value: formatCurrency(stats.totalExpenses || stats.expenses || 0),
        },
        {
            icon: 'dollar-sign', label: 'صافي الربح', color: '#4F46E5',
            value: formatCurrency((stats.totalRevenue || stats.revenue || 0) - (stats.totalExpenses || stats.expenses || 0)),
        },
        {
            icon: 'clock', label: 'المستحقات المعلقة', color: '#F59E0B',
            value: formatCurrency(stats.outstandingAmount || stats.pendingInvoices || 0),
        },
    ];

    const recentTransactions = stats.recentTransactions || stats.recentEntries || [];

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={isLoading || isRefetching} onRefresh={refetch} />}
        >
            {/* Summary Cards */}
            <View style={styles.grid}>
                {summaryCards.map((card) => (
                    <Surface key={card.label} style={styles.summaryCard} elevation={2}>
                        <View style={[styles.cardIcon, { backgroundColor: `${card.color}12` }]}>
                            <Icon name={card.icon} size={22} color={card.color} />
                        </View>
                        <Text style={styles.cardLabel}>{card.label}</Text>
                        <Text style={[styles.cardValue, { color: card.color }]}>{card.value}</Text>
                    </Surface>
                ))}
            </View>

            {/* Quick Stats */}
            <Surface style={styles.section} elevation={1}>
                <Text style={styles.sectionTitle}>ملخص سريع</Text>
                <Divider style={styles.divider} />
                <View style={styles.quickRow}>
                    <View style={styles.quickItem}>
                        <Icon name="file-text" size={18} color="#4F46E5" />
                        <Text style={styles.quickNumber}>{stats.invoiceCount || stats.totalInvoices || 0}</Text>
                        <Text style={styles.quickLabel}>فاتورة</Text>
                    </View>
                    <View style={styles.quickSep} />
                    <View style={styles.quickItem}>
                        <Icon name="check-circle" size={18} color="#10B981" />
                        <Text style={styles.quickNumber}>{stats.paidInvoices || 0}</Text>
                        <Text style={styles.quickLabel}>مدفوعة</Text>
                    </View>
                    <View style={styles.quickSep} />
                    <View style={styles.quickItem}>
                        <Icon name="alert-circle" size={18} color="#EF4444" />
                        <Text style={styles.quickNumber}>{stats.overdueInvoices || 0}</Text>
                        <Text style={styles.quickLabel}>متأخرة</Text>
                    </View>
                </View>
            </Surface>

            {/* Recent Transactions */}
            <Surface style={styles.section} elevation={1}>
                <Text style={styles.sectionTitle}>آخر المعاملات</Text>
                <Divider style={styles.divider} />
                {recentTransactions.length === 0 ? (
                    <View style={styles.emptySection}>
                        <Icon name="inbox" size={32} color={colors.textMuted} />
                        <Text style={styles.emptyText}>لا توجد معاملات حديثة</Text>
                    </View>
                ) : (
                    recentTransactions.slice(0, 10).map((tx: any, i: number) => (
                        <View key={tx.id || i}>
                            <View style={styles.txRow}>
                                <View style={[
                                    styles.txIcon,
                                    { backgroundColor: tx.type === 'CREDIT' || tx.type === 'income' ? '#10B98115' : '#EF444415' },
                                ]}>
                                    <Icon
                                        name={tx.type === 'CREDIT' || tx.type === 'income' ? 'arrow-down-left' : 'arrow-up-right'}
                                        size={16}
                                        color={tx.type === 'CREDIT' || tx.type === 'income' ? '#10B981' : '#EF4444'}
                                    />
                                </View>
                                <View style={styles.txContent}>
                                    <Text style={styles.txTitle} numberOfLines={1}>
                                        {tx.description || tx.reference || 'معاملة'}
                                    </Text>
                                    <Text style={styles.txDate}>
                                        {new Date(tx.date || tx.createdAt).toLocaleDateString('ar-SA')}
                                    </Text>
                                </View>
                                <Text style={[
                                    styles.txAmount,
                                    { color: tx.type === 'CREDIT' || tx.type === 'income' ? '#10B981' : '#EF4444' },
                                ]}>
                                    {formatCurrency(tx.amount)}
                                </Text>
                            </View>
                            {i < recentTransactions.slice(0, 10).length - 1 && <Divider />}
                        </View>
                    ))
                )}
            </Surface>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 40 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
    summaryCard: {
        width: '48%', flexGrow: 1, borderRadius: 16, padding: 16,
        backgroundColor: colors.white, alignItems: 'center',
    },
    cardIcon: {
        width: 48, height: 48, borderRadius: 14,
        alignItems: 'center', justifyContent: 'center', marginBottom: 10,
    },
    cardLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
    cardValue: { fontSize: 16, fontWeight: '700' },
    section: {
        borderRadius: 16, padding: 16,
        backgroundColor: colors.white, marginBottom: 16,
    },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 8 },
    divider: { marginVertical: 8 },
    quickRow: { flexDirection: 'row', alignItems: 'center' },
    quickItem: { flex: 1, alignItems: 'center', paddingVertical: 8 },
    quickSep: { width: 1, height: 40, backgroundColor: colors.borderLight },
    quickNumber: { fontSize: 20, fontWeight: '700', color: colors.text, marginTop: 4 },
    quickLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
    txRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
    txIcon: {
        width: 36, height: 36, borderRadius: 10,
        alignItems: 'center', justifyContent: 'center',
    },
    txContent: { flex: 1 },
    txTitle: { fontSize: 14, fontWeight: '500', color: colors.text },
    txDate: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
    txAmount: { fontSize: 14, fontWeight: '700' },
    emptySection: { alignItems: 'center', paddingVertical: 24 },
    emptyText: { fontSize: 13, color: colors.textMuted, marginTop: 8 },
});
