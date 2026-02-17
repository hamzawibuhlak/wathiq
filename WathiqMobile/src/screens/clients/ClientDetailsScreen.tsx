import React from 'react';
import {
    View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Linking,
} from 'react-native';
import { Text, Surface, Avatar, Divider, Chip } from 'react-native-paper';
import Icon from 'react-native-vector-icons/Feather';
import { useQuery } from '@tanstack/react-query';
import { clientsApi } from '../../api/clients';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { colors } from '../../theme/colors';
import { getInitials } from '../../utils/formatters';

export function ClientDetailsScreen({ route, navigation }: any) {
    const { id } = route.params;

    const { data: client, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['client', id],
        queryFn: () => clientsApi.getById(id).then((r: any) => r.data || r),
    });

    if (isLoading) return <LoadingSpinner />;
    if (!client) return (
        <View style={styles.empty}>
            <Icon name="alert-circle" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>لم يتم العثور على العميل</Text>
        </View>
    );

    const infoRows = [
        { icon: 'mail', label: 'البريد الإلكتروني', value: client.email },
        { icon: 'phone', label: 'الهاتف', value: client.phone },
        { icon: 'credit-card', label: 'رقم الهوية', value: client.nationalId || client.idNumber },
        { icon: 'map-pin', label: 'العنوان', value: client.address },
        { icon: 'briefcase', label: 'نوع العميل', value: client.clientType === 'COMPANY' ? 'شركة' : 'فرد' },
    ].filter(r => r.value);

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        >
            {/* Profile Header */}
            <Surface style={styles.profileCard} elevation={2}>
                <Avatar.Text
                    size={72}
                    label={getInitials(client.name)}
                    style={{ backgroundColor: client.clientType === 'COMPANY' ? '#8B5CF6' : colors.primary }}
                />
                <Text style={styles.name}>{client.name}</Text>
                <Chip
                    icon={() => <Icon name={client.clientType === 'COMPANY' ? 'briefcase' : 'user'} size={14} color={colors.primary} />}
                    style={styles.typeBadge}
                    textStyle={styles.typeBadgeText}
                >
                    {client.clientType === 'COMPANY' ? 'شركة' : 'فرد'}
                </Chip>

                {/* Quick Actions */}
                <View style={styles.actions}>
                    {client.phone && (
                        <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => Linking.openURL(`tel:${client.phone}`)}
                        >
                            <Icon name="phone" size={18} color={colors.white} />
                            <Text style={styles.actionText}>اتصال</Text>
                        </TouchableOpacity>
                    )}
                    {client.email && (
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
                            onPress={() => Linking.openURL(`mailto:${client.email}`)}
                        >
                            <Icon name="mail" size={18} color={colors.white} />
                            <Text style={styles.actionText}>بريد</Text>
                        </TouchableOpacity>
                    )}
                    {client.phone && (
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: '#25D366' }]}
                            onPress={() => Linking.openURL(`https://wa.me/${client.phone.replace(/[^0-9]/g, '')}`)}
                        >
                            <Icon name="message-circle" size={18} color={colors.white} />
                            <Text style={styles.actionText}>واتساب</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </Surface>

            {/* Info Section */}
            <Surface style={styles.section} elevation={1}>
                <Text style={styles.sectionTitle}>معلومات العميل</Text>
                <Divider style={styles.divider} />
                {infoRows.map((row, i) => (
                    <View key={row.label}>
                        <View style={styles.infoRow}>
                            <View style={styles.infoIcon}>
                                <Icon name={row.icon} size={16} color={colors.primary} />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>{row.label}</Text>
                                <Text style={styles.infoValue}>{row.value}</Text>
                            </View>
                        </View>
                        {i < infoRows.length - 1 && <Divider style={styles.divider} />}
                    </View>
                ))}
            </Surface>

            {/* Stats Cards */}
            <View style={styles.statsRow}>
                <Surface style={styles.statCard} elevation={1}>
                    <Icon name="briefcase" size={22} color="#4F46E5" />
                    <Text style={styles.statNumber}>{client.activeCases || client._count?.cases || 0}</Text>
                    <Text style={styles.statLabel}>قضايا نشطة</Text>
                </Surface>
                <Surface style={styles.statCard} elevation={1}>
                    <Icon name="file-text" size={22} color="#F59E0B" />
                    <Text style={styles.statNumber}>{client._count?.invoices || 0}</Text>
                    <Text style={styles.statLabel}>فواتير</Text>
                </Surface>
                <Surface style={styles.statCard} elevation={1}>
                    <Icon name="file" size={22} color="#10B981" />
                    <Text style={styles.statNumber}>{client._count?.documents || 0}</Text>
                    <Text style={styles.statLabel}>مستندات</Text>
                </Surface>
            </View>

            {/* Cases List */}
            {client.cases && client.cases.length > 0 && (
                <Surface style={styles.section} elevation={1}>
                    <Text style={styles.sectionTitle}>القضايا</Text>
                    <Divider style={styles.divider} />
                    {client.cases.map((c: any) => (
                        <TouchableOpacity
                            key={c.id}
                            style={styles.listItem}
                            onPress={() => navigation.navigate('CaseDetails', { id: c.id })}
                        >
                            <Icon name="briefcase" size={16} color={colors.primary} />
                            <Text style={styles.listItemText}>{c.title}</Text>
                            <Icon name="chevron-left" size={16} color={colors.textMuted} />
                        </TouchableOpacity>
                    ))}
                </Surface>
            )}

            {/* Notes */}
            {client.notes && (
                <Surface style={styles.section} elevation={1}>
                    <Text style={styles.sectionTitle}>ملاحظات</Text>
                    <Divider style={styles.divider} />
                    <Text style={styles.notes}>{client.notes}</Text>
                </Surface>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 40 },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyText: { fontSize: 14, color: colors.textMuted, marginTop: 12 },
    profileCard: {
        borderRadius: 20, padding: 24,
        backgroundColor: colors.white, alignItems: 'center', marginBottom: 16,
    },
    name: { fontSize: 20, fontWeight: '700', color: colors.text, marginTop: 12 },
    typeBadge: { marginTop: 8, backgroundColor: colors.primaryLight || '#EEF0FF' },
    typeBadgeText: { fontSize: 12, color: colors.primary },
    actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
    actionBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: colors.primary, borderRadius: 12,
        paddingHorizontal: 16, paddingVertical: 10,
    },
    actionText: { color: colors.white, fontSize: 13, fontWeight: '600' },
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
    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    statCard: {
        flex: 1, borderRadius: 14, padding: 14,
        backgroundColor: colors.white, alignItems: 'center',
    },
    statNumber: { fontSize: 22, fontWeight: '700', color: colors.text, marginTop: 6 },
    statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
    listItem: {
        flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10,
    },
    listItemText: { flex: 1, fontSize: 14, color: colors.text },
    notes: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
});
