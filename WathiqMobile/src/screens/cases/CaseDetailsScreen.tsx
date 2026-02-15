import React from 'react';
import { ScrollView, View, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, Surface, Divider, Button } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/Feather';
import { casesApi } from '../../api/cases';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { colors } from '../../theme/colors';
import { CASE_STATUS_LABELS, CASE_TYPE_LABELS } from '../../utils/constants';
import { formatDate, formatDateTime } from '../../utils/formatters';

export function CaseDetailsScreen({ route, navigation }: any) {
    const { id } = route.params;

    const { data: caseData, isLoading, refetch } = useQuery({
        queryKey: ['case', id],
        queryFn: () => casesApi.getById(id),
    });

    const { data: timeline } = useQuery({
        queryKey: ['case-timeline', id],
        queryFn: () => casesApi.getTimeline(id),
    });

    if (isLoading) return <LoadingSpinner />;
    if (!caseData) return <LoadingSpinner message="القضية غير موجودة" />;

    const STATUS_COLORS: Record<string, string> = {
        active: '#10B981', pending: '#F59E0B', closed: '#6B7280', archived: '#94A3B8',
    };
    const statusColor = STATUS_COLORS[caseData.status] || '#6B7280';

    return (
        <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}>
            {/* Header Card */}
            <Surface style={styles.card} elevation={1}>
                <View style={styles.cardHeader}>
                    <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
                        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                        <Text style={[styles.statusText, { color: statusColor }]}>
                            {CASE_STATUS_LABELS[caseData.status] || caseData.status}
                        </Text>
                    </View>
                    <Text style={styles.caseNumber}>{caseData.caseNumber}</Text>
                </View>

                <Text style={styles.caseTitle}>{caseData.title}</Text>

                {caseData.description && (
                    <Text style={styles.description}>{caseData.description}</Text>
                )}

                <Divider style={styles.divider} />

                {/* Info Grid */}
                <View style={styles.infoGrid}>
                    <InfoRow icon="tag" label="نوع القضية" value={CASE_TYPE_LABELS[caseData.caseType] || caseData.caseType} />
                    {caseData.courtName && <InfoRow icon="map-pin" label="المحكمة" value={caseData.courtName} />}
                    {caseData.filingDate && <InfoRow icon="calendar" label="تاريخ التقديم" value={formatDate(caseData.filingDate)} />}
                    {caseData.nextHearingDate && <InfoRow icon="clock" label="الجلسة القادمة" value={formatDate(caseData.nextHearingDate)} />}
                </View>
            </Surface>

            {/* Client Info */}
            {caseData.client && (
                <Surface style={styles.card} elevation={1}>
                    <Text style={styles.sectionTitle}>العميل</Text>
                    <TouchableOpacity style={styles.clientRow}>
                        <View style={styles.clientAvatar}>
                            <Icon name="user" size={18} color={colors.primary} />
                        </View>
                        <View style={styles.clientInfo}>
                            <Text style={styles.clientName}>{caseData.client.name}</Text>
                            {caseData.client.phone && <Text style={styles.clientDetail}>{caseData.client.phone}</Text>}
                        </View>
                        <Icon name="chevron-left" size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                </Surface>
            )}

            {/* Quick Actions */}
            <Surface style={styles.card} elevation={1}>
                <Text style={styles.sectionTitle}>إجراءات</Text>
                <View style={styles.actionsGrid}>
                    <ActionButton icon="file-text" label="ملاحظات" color="#4F46E5" onPress={() => { }} />
                    <ActionButton icon="calendar" label="جلسات" color="#10B981" onPress={() => { }} />
                    <ActionButton icon="folder" label="مستندات" color="#F59E0B" onPress={() => { }} />
                    <ActionButton icon="check-square" label="مهام" color="#8B5CF6" onPress={() => { }} />
                </View>
            </Surface>

            {/* Timeline */}
            {timeline && timeline.length > 0 && (
                <Surface style={[styles.card, { marginBottom: 32 }]} elevation={1}>
                    <Text style={styles.sectionTitle}>الجدول الزمني</Text>
                    {timeline.slice(0, 10).map((entry: any, index: number) => (
                        <View key={entry.id || index} style={styles.timelineItem}>
                            <View style={styles.timelineDot} />
                            {index < Math.min(timeline.length - 1, 9) && <View style={styles.timelineLine} />}
                            <View style={styles.timelineContent}>
                                <Text style={styles.timelineAction}>{entry.action || entry.description}</Text>
                                <Text style={styles.timelineDate}>{formatDateTime(entry.createdAt)}</Text>
                            </View>
                        </View>
                    ))}
                </Surface>
            )}
        </ScrollView>
    );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
    return (
        <View style={styles.infoRow}>
            <View style={styles.infoLabel}>
                <Icon name={icon} size={14} color={colors.textMuted} />
                <Text style={styles.infoLabelText}>{label}</Text>
            </View>
            <Text style={styles.infoValue}>{value}</Text>
        </View>
    );
}

function ActionButton({ icon, label, color, onPress }: { icon: string; label: string; color: string; onPress: () => void }) {
    return (
        <TouchableOpacity style={styles.actionButton} onPress={onPress} activeOpacity={0.7}>
            <View style={[styles.actionIcon, { backgroundColor: `${color}15` }]}>
                <Icon name={icon} size={18} color={color} />
            </View>
            <Text style={styles.actionLabel}>{label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    card: { margin: 16, marginBottom: 0, padding: 16, borderRadius: 14, backgroundColor: colors.white },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 12, fontWeight: '500' },
    caseNumber: { fontSize: 13, color: colors.primary, fontWeight: '600' },
    caseTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 8, lineHeight: 30 },
    description: { fontSize: 14, color: colors.textSecondary, lineHeight: 22, marginBottom: 4 },
    divider: { marginVertical: 14 },
    infoGrid: { gap: 10 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    infoLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    infoLabelText: { fontSize: 13, color: colors.textMuted },
    infoValue: { fontSize: 14, fontWeight: '500', color: colors.text },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 14 },
    clientRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    clientAvatar: {
        width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primaryBg,
        alignItems: 'center', justifyContent: 'center',
    },
    clientInfo: { flex: 1 },
    clientName: { fontSize: 15, fontWeight: '500', color: colors.text },
    clientDetail: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    actionsGrid: { flexDirection: 'row', justifyContent: 'space-around' },
    actionButton: { alignItems: 'center', gap: 8 },
    actionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    actionLabel: { fontSize: 12, color: colors.textSecondary },
    timelineItem: { flexDirection: 'row', gap: 12, position: 'relative', minHeight: 48 },
    timelineDot: {
        width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary,
        marginTop: 4, zIndex: 1,
    },
    timelineLine: {
        position: 'absolute', left: 4, top: 14, width: 2, bottom: 0,
        backgroundColor: colors.borderLight,
    },
    timelineContent: { flex: 1, paddingBottom: 16 },
    timelineAction: { fontSize: 14, fontWeight: '500', color: colors.text },
    timelineDate: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
