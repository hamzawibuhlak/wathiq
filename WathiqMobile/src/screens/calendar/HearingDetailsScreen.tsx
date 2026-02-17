import React from 'react';
import {
    View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert,
} from 'react-native';
import { Text, Surface, Divider, Chip } from 'react-native-paper';
import Icon from 'react-native-vector-icons/Feather';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hearingsApi } from '../../api/hearings';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { colors } from '../../theme/colors';
import { formatDate, formatTime } from '../../utils/formatters';
import { HEARING_STATUS_LABELS } from '../../utils/constants';

const STATUS_COLORS: Record<string, string> = {
    SCHEDULED: '#4F46E5',
    COMPLETED: '#10B981',
    POSTPONED: '#F59E0B',
    CANCELLED: '#EF4444',
};

export function HearingDetailsScreen({ route, navigation }: any) {
    const { id } = route.params;
    const queryClient = useQueryClient();

    const { data: hearing, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['hearing', id],
        queryFn: () => hearingsApi.getById(id).then((r: any) => r.data || r),
    });

    const statusMutation = useMutation({
        mutationFn: ({ status }: { status: string }) => hearingsApi.update(id, { status } as any),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hearing', id] });
            queryClient.invalidateQueries({ queryKey: ['hearings'] });
        },
    });

    const handleStatusChange = (newStatus: string) => {
        Alert.alert(
            'تغيير الحالة',
            `هل تريد تغيير حالة الجلسة إلى "${HEARING_STATUS_LABELS[newStatus]}"؟`,
            [
                { text: 'إلغاء', style: 'cancel' },
                { text: 'تأكيد', onPress: () => statusMutation.mutate({ status: newStatus }) },
            ]
        );
    };

    if (isLoading) return <LoadingSpinner />;
    if (!hearing) return (
        <View style={styles.empty}>
            <Icon name="alert-circle" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>لم يتم العثور على الجلسة</Text>
        </View>
    );

    const statusColor = STATUS_COLORS[hearing.status] || '#6B7280';

    const infoItems = [
        { icon: 'calendar', label: 'التاريخ', value: formatDate(hearing.date) },
        { icon: 'clock', label: 'الوقت', value: hearing.time || formatTime(hearing.date) },
        { icon: 'map-pin', label: 'المحكمة', value: hearing.court || hearing.location },
        { icon: 'home', label: 'القاعة', value: hearing.courtRoom },
        { icon: 'briefcase', label: 'القضية', value: hearing.case?.title },
        { icon: 'user', label: 'القاضي', value: hearing.judge },
    ].filter(r => r.value);

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        >
            {/* Header Card */}
            <Surface style={styles.headerCard} elevation={2}>
                <View style={[styles.statusBar, { backgroundColor: statusColor }]} />
                <View style={styles.headerContent}>
                    <Text style={styles.title}>{hearing.title}</Text>
                    <Chip
                        style={[styles.statusChip, { backgroundColor: `${statusColor}15` }]}
                        textStyle={{ color: statusColor, fontSize: 12, fontWeight: '600' }}
                    >
                        {HEARING_STATUS_LABELS[hearing.status] || hearing.status}
                    </Chip>
                </View>
            </Surface>

            {/* Info Section */}
            <Surface style={styles.section} elevation={1}>
                <Text style={styles.sectionTitle}>معلومات الجلسة</Text>
                <Divider style={styles.divider} />
                {infoItems.map((item, i) => (
                    <View key={item.label}>
                        <TouchableOpacity
                            style={styles.infoRow}
                            onPress={item.label === 'القضية' && hearing.case?.id
                                ? () => navigation.navigate('CaseDetails', { id: hearing.case.id })
                                : undefined}
                        >
                            <View style={styles.infoIcon}>
                                <Icon name={item.icon} size={16} color={colors.primary} />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>{item.label}</Text>
                                <Text style={styles.infoValue}>{item.value}</Text>
                            </View>
                            {item.label === 'القضية' && hearing.case?.id && (
                                <Icon name="chevron-left" size={16} color={colors.textMuted} />
                            )}
                        </TouchableOpacity>
                        {i < infoItems.length - 1 && <Divider style={styles.divider} />}
                    </View>
                ))}
            </Surface>

            {/* Notes */}
            {hearing.notes && (
                <Surface style={styles.section} elevation={1}>
                    <Text style={styles.sectionTitle}>ملاحظات</Text>
                    <Divider style={styles.divider} />
                    <Text style={styles.notes}>{hearing.notes}</Text>
                </Surface>
            )}

            {/* Result / Outcome */}
            {hearing.result && (
                <Surface style={styles.section} elevation={1}>
                    <Text style={styles.sectionTitle}>النتيجة</Text>
                    <Divider style={styles.divider} />
                    <Text style={styles.notes}>{hearing.result}</Text>
                </Surface>
            )}

            {/* Status Actions */}
            <Surface style={styles.section} elevation={1}>
                <Text style={styles.sectionTitle}>تحديث الحالة</Text>
                <Divider style={styles.divider} />
                <View style={styles.statusActions}>
                    {Object.entries(HEARING_STATUS_LABELS).map(([key, label]) => {
                        const isActive = hearing.status === key;
                        const color = STATUS_COLORS[key] || '#6B7280';
                        return (
                            <TouchableOpacity
                                key={key}
                                style={[
                                    styles.statusBtn,
                                    { borderColor: color },
                                    isActive && { backgroundColor: `${color}15` },
                                ]}
                                onPress={() => !isActive && handleStatusChange(key)}
                                disabled={isActive}
                            >
                                {isActive && <Icon name="check" size={14} color={color} />}
                                <Text style={[styles.statusBtnText, { color }]}>{label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </Surface>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 40 },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyText: { fontSize: 14, color: colors.textMuted, marginTop: 12 },
    headerCard: {
        borderRadius: 16, overflow: 'hidden',
        backgroundColor: colors.white, marginBottom: 16,
    },
    statusBar: { height: 4 },
    headerContent: { padding: 20 },
    title: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 10 },
    statusChip: { alignSelf: 'flex-start' },
    section: {
        borderRadius: 16, padding: 16,
        backgroundColor: colors.white, marginBottom: 16,
    },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 8 },
    divider: { marginVertical: 8 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
    infoIcon: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: colors.primaryLight || '#EEF0FF',
        alignItems: 'center', justifyContent: 'center',
    },
    infoContent: { flex: 1 },
    infoLabel: { fontSize: 11, color: colors.textSecondary },
    infoValue: { fontSize: 14, color: colors.text, fontWeight: '500', marginTop: 1 },
    notes: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
    statusActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    statusBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        borderWidth: 1.5, borderRadius: 10,
        paddingHorizontal: 14, paddingVertical: 8,
    },
    statusBtnText: { fontSize: 13, fontWeight: '600' },
});
