import React, { useState } from 'react';
import {
    View, StyleSheet, ScrollView, FlatList, TouchableOpacity, RefreshControl,
} from 'react-native';
import { Text, Surface, Divider, Avatar, Chip, Searchbar, FAB } from 'react-native-paper';
import Icon from 'react-native-vector-icons/Feather';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../../services/api.service';
import { colors } from '../../theme/colors';
import { getInitials } from '../../utils/formatters';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    ACTIVE: { label: 'نشط', color: '#10B981' },
    ON_LEAVE: { label: 'إجازة', color: '#F59E0B' },
    TERMINATED: { label: 'منتهي', color: '#EF4444' },
    PROBATION: { label: 'تجربة', color: '#3B82F6' },
};

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(amount || 0);

export function HRScreen({ navigation }: any) {
    const [tab, setTab] = useState<'employees' | 'leave' | 'payroll'>('employees');
    const [search, setSearch] = useState('');

    const { data: statsData } = useQuery({
        queryKey: ['hr-stats'],
        queryFn: () => apiService.get('/hr/employees/statistics').then((r: any) => r.data || r),
    });

    const { data: employeesData, isLoading: empLoading, refetch: refetchEmp } = useQuery({
        queryKey: ['hr-employees', search],
        queryFn: () => apiService.get('/hr/employees', { params: { search: search || undefined } }).then((r: any) => r.data || []),
        enabled: tab === 'employees',
    });

    const { data: leaveData, isLoading: leaveLoading, refetch: refetchLeave } = useQuery({
        queryKey: ['hr-leave-requests'],
        queryFn: () => apiService.get('/hr/leave/requests').then((r: any) => r.data || []),
        enabled: tab === 'leave',
    });

    const { data: payrollData, isLoading: payrollLoading, refetch: refetchPayroll } = useQuery({
        queryKey: ['hr-payrolls'],
        queryFn: () => apiService.get('/hr/payroll').then((r: any) => r.data || []),
        enabled: tab === 'payroll',
    });

    const stats = statsData || {};
    const employees = Array.isArray(employeesData) ? employeesData : [];
    const leaveRequests = Array.isArray(leaveData) ? leaveData : [];
    const payrolls = Array.isArray(payrollData) ? payrollData : [];

    const summaryCards = [
        { icon: 'users', label: 'الموظفين', value: stats.totalEmployees || employees.length, color: '#4F46E5' },
        { icon: 'user-check', label: 'نشطين', value: stats.activeEmployees || 0, color: '#10B981' },
        { icon: 'home', label: 'الأقسام', value: stats.totalDepartments || 0, color: '#8B5CF6' },
        { icon: 'calendar', label: 'إجازات معلقة', value: stats.pendingLeaves || 0, color: '#F59E0B' },
    ];

    return (
        <View style={styles.container}>
            {/* Stats */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll} contentContainerStyle={styles.statsContent}>
                {summaryCards.map((card) => (
                    <Surface key={card.label} style={styles.statCard} elevation={2}>
                        <Icon name={card.icon} size={20} color={card.color} />
                        <Text style={[styles.statValue, { color: card.color }]}>{card.value}</Text>
                        <Text style={styles.statLabel}>{card.label}</Text>
                    </Surface>
                ))}
            </ScrollView>

            {/* Tabs */}
            <View style={styles.tabs}>
                {[
                    { key: 'employees', label: 'الموظفين', icon: 'users' },
                    { key: 'leave', label: 'الإجازات', icon: 'calendar' },
                    { key: 'payroll', label: 'الرواتب', icon: 'dollar-sign' },
                ].map((t) => (
                    <TouchableOpacity
                        key={t.key}
                        style={[styles.tab, tab === t.key && styles.tabActive]}
                        onPress={() => setTab(t.key as any)}
                    >
                        <Icon name={t.icon} size={14} color={tab === t.key ? colors.primary : colors.textMuted} />
                        <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {tab === 'employees' && (
                <Searchbar
                    placeholder="بحث عن موظف..."
                    value={search}
                    onChangeText={setSearch}
                    style={styles.searchbar}
                    inputStyle={styles.searchInput}
                />
            )}

            {/* Employees Tab */}
            {tab === 'employees' && (
                <FlatList
                    data={employees}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={empLoading} onRefresh={refetchEmp} />}
                    renderItem={({ item }) => {
                        const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.ACTIVE;
                        return (
                            <Surface style={styles.card} elevation={1}>
                                <View style={styles.cardRow}>
                                    <Avatar.Text
                                        size={44}
                                        label={getInitials(item.name || item.nameAr || '')}
                                        style={{ backgroundColor: colors.primary }}
                                    />
                                    <View style={styles.cardText}>
                                        <Text style={styles.cardTitle}>{item.name || item.nameAr}</Text>
                                        <Text style={styles.cardSubtitle}>{item.position || item.jobTitle || ''}</Text>
                                        <View style={styles.metaRow}>
                                            {item.department?.name && (
                                                <Chip style={styles.smallChip} textStyle={styles.smallChipText}>
                                                    {item.department.name}
                                                </Chip>
                                            )}
                                            <Chip
                                                style={[styles.smallChip, { backgroundColor: `${statusCfg.color}12` }]}
                                                textStyle={[styles.smallChipText, { color: statusCfg.color }]}
                                            >
                                                {statusCfg.label}
                                            </Chip>
                                        </View>
                                    </View>
                                </View>
                            </Surface>
                        );
                    }}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Icon name="users" size={48} color={colors.textMuted} />
                            <Text style={styles.emptyText}>لا يوجد موظفين</Text>
                        </View>
                    }
                />
            )}

            {/* Leave Tab */}
            {tab === 'leave' && (
                <FlatList
                    data={leaveRequests}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={leaveLoading} onRefresh={refetchLeave} />}
                    renderItem={({ item }) => (
                        <Surface style={styles.card} elevation={1}>
                            <View style={styles.cardRow}>
                                <View style={[styles.leaveIcon, {
                                    backgroundColor: item.status === 'APPROVED' ? '#10B98112' :
                                        item.status === 'REJECTED' ? '#EF444412' : '#F59E0B12'
                                }]}>
                                    <Icon
                                        name={item.status === 'APPROVED' ? 'check' : item.status === 'REJECTED' ? 'x' : 'clock'}
                                        size={20}
                                        color={item.status === 'APPROVED' ? '#10B981' : item.status === 'REJECTED' ? '#EF4444' : '#F59E0B'}
                                    />
                                </View>
                                <View style={styles.cardText}>
                                    <Text style={styles.cardTitle}>{item.employee?.name || 'موظف'}</Text>
                                    <Text style={styles.cardSubtitle}>{item.leaveType?.name || item.type || 'إجازة'}</Text>
                                    <Text style={styles.dateText}>
                                        {new Date(item.startDate).toLocaleDateString('ar-SA')} - {new Date(item.endDate).toLocaleDateString('ar-SA')}
                                    </Text>
                                </View>
                            </View>
                        </Surface>
                    )}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Icon name="calendar" size={48} color={colors.textMuted} />
                            <Text style={styles.emptyText}>لا توجد طلبات إجازة</Text>
                        </View>
                    }
                />
            )}

            {/* Payroll Tab */}
            {tab === 'payroll' && (
                <FlatList
                    data={payrolls}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={payrollLoading} onRefresh={refetchPayroll} />}
                    renderItem={({ item }) => (
                        <Surface style={styles.card} elevation={1}>
                            <View style={styles.payrollHeader}>
                                <Text style={styles.cardTitle}>
                                    {item.month}/{item.year}
                                </Text>
                                <Chip
                                    style={[styles.smallChip, {
                                        backgroundColor: item.status === 'PAID' ? '#10B98112' :
                                            item.status === 'APPROVED' ? '#3B82F612' : '#F59E0B12'
                                    }]}
                                    textStyle={[styles.smallChipText, {
                                        color: item.status === 'PAID' ? '#10B981' :
                                            item.status === 'APPROVED' ? '#3B82F6' : '#F59E0B'
                                    }]}
                                >
                                    {item.status === 'PAID' ? 'مدفوع' : item.status === 'APPROVED' ? 'معتمد' : 'معلق'}
                                </Chip>
                            </View>
                            <Text style={styles.payrollAmount}>
                                {formatCurrency(item.totalAmount || item.netSalary || 0)}
                            </Text>
                            <Text style={styles.dateText}>{item.employeeCount || 0} موظف</Text>
                        </Surface>
                    )}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Icon name="dollar-sign" size={48} color={colors.textMuted} />
                            <Text style={styles.emptyText}>لا توجد سجلات رواتب</Text>
                        </View>
                    }
                />
            )}

            <FAB
                icon="plus"
                label="إضافة موظف"
                style={styles.fab}
                color="#fff"
                onPress={() => navigation.navigate('CreateEmployee')}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    statsScroll: { maxHeight: 110 },
    statsContent: { paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
    statCard: {
        width: 100, borderRadius: 14, padding: 12,
        backgroundColor: colors.white, alignItems: 'center',
    },
    statValue: { fontSize: 20, fontWeight: '700', marginTop: 4 },
    statLabel: { fontSize: 10, color: colors.textSecondary, marginTop: 2, textAlign: 'center' },
    tabs: { flexDirection: 'row', marginHorizontal: 16, gap: 6, marginBottom: 8 },
    tab: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 4, paddingVertical: 9, borderRadius: 10,
        backgroundColor: colors.white, borderWidth: 1, borderColor: colors.borderLight || '#E5E7EB',
    },
    tabActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight || '#EEF0FF' },
    tabText: { fontSize: 12, color: colors.textMuted },
    tabTextActive: { color: colors.primary, fontWeight: '600' },
    searchbar: { marginHorizontal: 16, marginBottom: 8, borderRadius: 12, elevation: 1, backgroundColor: colors.white },
    searchInput: { fontSize: 14 },
    list: { paddingHorizontal: 16, paddingBottom: 80 },
    card: { borderRadius: 14, padding: 14, marginBottom: 10, backgroundColor: colors.white },
    cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    cardText: { flex: 1 },
    cardTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
    cardSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    metaRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
    smallChip: { height: 22, backgroundColor: colors.primaryLight || '#EEF0FF' },
    smallChipText: { fontSize: 10 },
    leaveIcon: {
        width: 44, height: 44, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
    },
    dateText: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
    payrollHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    payrollAmount: { fontSize: 18, fontWeight: '700', color: colors.primary },
    empty: { alignItems: 'center', marginTop: 80 },
    emptyText: { fontSize: 14, color: colors.textMuted, marginTop: 12 },
    fab: {
        position: 'absolute', bottom: 20, left: 20,
        backgroundColor: colors.primary,
    },
});
