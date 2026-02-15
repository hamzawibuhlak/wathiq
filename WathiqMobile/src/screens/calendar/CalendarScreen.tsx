import React, { useState } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Surface, Chip } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/Feather';
import { hearingsApi } from '../../api/hearings';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { colors } from '../../theme/colors';
import { HEARING_STATUS_LABELS } from '../../utils/constants';
import { formatDate, formatTime } from '../../utils/formatters';
import { Hearing } from '../../types/models.types';

const STATUS_COLORS: Record<string, string> = {
    SCHEDULED: '#4F46E5',
    COMPLETED: '#10B981',
    POSTPONED: '#F59E0B',
    CANCELLED: '#EF4444',
};

export function CalendarScreen({ navigation }: any) {
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

    const { data: hearings, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['hearings', selectedStatus],
        queryFn: () => hearingsApi.getAll({ status: selectedStatus || undefined }),
    });

    const grouped = groupByDate(hearings || []);

    const renderHearing = (hearing: Hearing) => {
        const statusColor = STATUS_COLORS[hearing.status] || '#6B7280';

        return (
            <TouchableOpacity key={hearing.id} activeOpacity={0.7}>
                <Surface style={styles.hearingCard} elevation={1}>
                    <View style={[styles.colorBar, { backgroundColor: statusColor }]} />
                    <View style={styles.hearingContent}>
                        <View style={styles.hearingHeader}>
                            <Text style={styles.hearingTitle}>{hearing.title}</Text>
                            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
                                <Text style={[styles.statusText, { color: statusColor }]}>
                                    {HEARING_STATUS_LABELS[hearing.status]}
                                </Text>
                            </View>
                        </View>

                        {hearing.time && (
                            <View style={styles.metaRow}>
                                <Icon name="clock" size={13} color={colors.textMuted} />
                                <Text style={styles.metaText}>{hearing.time}</Text>
                            </View>
                        )}
                        {(hearing.location || hearing.courtRoom) && (
                            <View style={styles.metaRow}>
                                <Icon name="map-pin" size={13} color={colors.textMuted} />
                                <Text style={styles.metaText}>{hearing.location || hearing.courtRoom}</Text>
                            </View>
                        )}
                        {hearing.case && (
                            <View style={styles.metaRow}>
                                <Icon name="briefcase" size={13} color={colors.textMuted} />
                                <Text style={styles.metaText}>{hearing.case.title}</Text>
                            </View>
                        )}
                    </View>
                </Surface>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* Status Filters */}
            <View style={styles.filters}>
                <Chip selected={!selectedStatus} onPress={() => setSelectedStatus(null)} style={styles.chip}>الكل</Chip>
                {Object.entries(HEARING_STATUS_LABELS).map(([key, label]) => (
                    <Chip
                        key={key}
                        selected={selectedStatus === key}
                        onPress={() => setSelectedStatus(selectedStatus === key ? null : key)}
                        style={styles.chip}
                    >
                        {label}
                    </Chip>
                ))}
            </View>

            {isLoading ? (
                <LoadingSpinner />
            ) : grouped.length === 0 ? (
                <EmptyState icon="calendar" title="لا توجد جلسات" description="لا توجد جلسات مسجلة حالياً" />
            ) : (
                <FlatList
                    data={grouped}
                    keyExtractor={(item) => item.date}
                    renderItem={({ item }) => (
                        <View>
                            <Text style={styles.dateHeader}>{formatDate(item.date)}</Text>
                            {item.hearings.map(renderHearing)}
                        </View>
                    )}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
                />
            )}
        </View>
    );
}

function groupByDate(hearings: Hearing[]): { date: string; hearings: Hearing[] }[] {
    const map = new Map<string, Hearing[]>();
    for (const h of hearings) {
        const date = h.date.split('T')[0];
        if (!map.has(date)) map.set(date, []);
        map.get(date)!.push(h);
    }
    return Array.from(map.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, hearings]) => ({ date, hearings }));
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    filters: {
        flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8, flexWrap: 'wrap',
    },
    chip: { height: 32 },
    list: { padding: 16, paddingTop: 4, gap: 8 },
    dateHeader: {
        fontSize: 15, fontWeight: '600', color: colors.primary, marginBottom: 8, marginTop: 8,
    },
    hearingCard: {
        flexDirection: 'row', borderRadius: 12, backgroundColor: colors.white,
        overflow: 'hidden', marginBottom: 8,
    },
    colorBar: { width: 4 },
    hearingContent: { flex: 1, padding: 14 },
    hearingHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8,
    },
    hearingTitle: { fontSize: 15, fontWeight: '600', color: colors.text, flex: 1, marginLeft: 8 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    statusText: { fontSize: 11, fontWeight: '500' },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    metaText: { fontSize: 13, color: colors.textSecondary },
});
