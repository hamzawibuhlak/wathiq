import React, { useState } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Searchbar, Chip, FAB, Surface } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/Feather';
import { casesApi } from '../../api/cases';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { colors } from '../../theme/colors';
import { CASE_STATUS_LABELS, CASE_TYPE_LABELS } from '../../utils/constants';
import { formatDate } from '../../utils/formatters';
import { Case } from '../../types/models.types';

const STATUS_COLORS: Record<string, string> = {
    active: '#10B981',
    pending: '#F59E0B',
    closed: '#6B7280',
    archived: '#94A3B8',
};

export function CasesListScreen({ navigation }: any) {
    const [search, setSearch] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

    const { data, isLoading, error, refetch, isRefetching } = useQuery({
        queryKey: ['cases', search, selectedStatus],
        queryFn: async () => {
            const res = await casesApi.getAll({ search: search || undefined, status: selectedStatus || undefined });
            console.log('📦 Cases API response:', JSON.stringify(res).substring(0, 500));
            return res;
        },
        retry: 1,
    });

    // Handle multiple response shapes: { data: [] }, [], { items: [] }, etc.
    const rawData = data as any;
    const cases = Array.isArray(rawData) ? rawData
        : Array.isArray(rawData?.data) ? rawData.data
            : Array.isArray(rawData?.items) ? rawData.items
                : [];

    const renderCase = ({ item }: { item: Case }) => (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('CaseDetails', { id: item.id })}
        >
            <Surface style={styles.caseCard} elevation={1}>
                <View style={styles.caseHeader}>
                    <View style={styles.caseNumberBadge}>
                        <Text style={styles.caseNumber}>{item.caseNumber}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: `${STATUS_COLORS[item.status]}20` }]}>
                        <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[item.status] }]} />
                        <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>
                            {CASE_STATUS_LABELS[item.status] || item.status}
                        </Text>
                    </View>
                </View>

                <Text style={styles.caseTitle} numberOfLines={2}>{item.title}</Text>

                <View style={styles.caseMeta}>
                    {item.caseType && (
                        <View style={styles.metaItem}>
                            <Icon name="tag" size={12} color={colors.textMuted} />
                            <Text style={styles.metaText}>{CASE_TYPE_LABELS[item.caseType] || item.caseType}</Text>
                        </View>
                    )}
                    {item.courtName && (
                        <View style={styles.metaItem}>
                            <Icon name="map-pin" size={12} color={colors.textMuted} />
                            <Text style={styles.metaText}>{item.courtName}</Text>
                        </View>
                    )}
                </View>

                {item.client && (
                    <View style={styles.clientInfo}>
                        <Icon name="user" size={12} color={colors.textSecondary} />
                        <Text style={styles.clientName}>{item.client.name}</Text>
                    </View>
                )}

                {item.nextHearingDate && (
                    <View style={styles.nextHearing}>
                        <Icon name="calendar" size={12} color={colors.primary} />
                        <Text style={styles.nextHearingText}>الجلسة القادمة: {formatDate(item.nextHearingDate)}</Text>
                    </View>
                )}
            </Surface>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Search */}
            <Searchbar
                placeholder="ابحث عن قضية..."
                value={search}
                onChangeText={setSearch}
                style={styles.searchbar}
                inputStyle={styles.searchInput}
            />

            {/* Status Filters */}
            <View style={styles.filters}>
                <Chip
                    selected={!selectedStatus}
                    onPress={() => setSelectedStatus(null)}
                    style={styles.chip}
                    textStyle={styles.chipText}
                >
                    الكل
                </Chip>
                {Object.entries(CASE_STATUS_LABELS).map(([key, label]) => (
                    <Chip
                        key={key}
                        selected={selectedStatus === key}
                        onPress={() => setSelectedStatus(selectedStatus === key ? null : key)}
                        style={styles.chip}
                        textStyle={styles.chipText}
                    >
                        {label}
                    </Chip>
                ))}
            </View>

            {/* Cases List */}
            {error ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                    <Icon name="alert-circle" size={40} color="#EF5350" />
                    <Text style={{ color: '#EF5350', fontWeight: '600', marginTop: 8, fontSize: 16 }}>خطأ في تحميل القضايا</Text>
                    <Text style={{ color: colors.textMuted, marginTop: 4, textAlign: 'center', fontSize: 12 }}>
                        {(error as any)?.message || 'حدث خطأ غير متوقع'}
                    </Text>
                    <Text style={{ color: colors.textMuted, marginTop: 4, textAlign: 'center', fontSize: 10 }}>
                        {(error as any)?.response?.status} — {JSON.stringify((error as any)?.response?.data).substring(0, 150)}
                    </Text>
                    <TouchableOpacity onPress={() => refetch()} style={{ marginTop: 12, backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }}>
                        <Text style={{ color: '#fff', fontWeight: '600' }}>إعادة المحاولة</Text>
                    </TouchableOpacity>
                </View>
            ) : isLoading ? (
                <LoadingSpinner />
            ) : cases.length === 0 ? (
                <EmptyState
                    icon="briefcase"
                    title="لا توجد قضايا"
                    description="أضف قضية جديدة للبدء"
                    actionLabel="إضافة قضية"
                    onAction={() => navigation.navigate('CreateCase')}
                />
            ) : (
                <FlatList
                    data={cases}
                    keyExtractor={(item) => item.id}
                    renderItem={renderCase}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* FAB */}
            <FAB
                icon="plus"
                style={styles.fab}
                onPress={() => navigation.navigate('CreateCase')}
                color={colors.white}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    searchbar: { margin: 16, marginBottom: 8, borderRadius: 12, backgroundColor: colors.white, elevation: 1 },
    searchInput: { fontSize: 14 },
    filters: {
        flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8,
        flexWrap: 'wrap',
    },
    chip: { height: 32 },
    chipText: { fontSize: 12 },
    list: { padding: 16, paddingTop: 8, gap: 12 },
    caseCard: { padding: 16, borderRadius: 14, backgroundColor: colors.white },
    caseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    caseNumberBadge: {
        backgroundColor: colors.primaryBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    },
    caseNumber: { fontSize: 12, fontWeight: '600', color: colors.primary },
    statusBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 12, fontWeight: '500' },
    caseTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8, lineHeight: 24 },
    caseMeta: { flexDirection: 'row', gap: 16, marginBottom: 8 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 12, color: colors.textMuted },
    clientInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
    clientName: { fontSize: 13, color: colors.textSecondary },
    nextHearing: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: colors.primaryBg, padding: 8, borderRadius: 8, marginTop: 4,
    },
    nextHearingText: { fontSize: 12, color: colors.primary, fontWeight: '500' },
    fab: {
        position: 'absolute', bottom: 20, left: 20,
        backgroundColor: colors.primary, borderRadius: 16,
    },
});
