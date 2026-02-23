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

const REP_DOC_LABELS: Record<string, string> = {
    COMMERCIAL_REG: 'السجل التجاري',
    ARTICLES_OF_ASSOC: 'عقد التأسيس',
    AUTH_LETTER: 'خطاب تفويض',
    POWER_OF_ATTORNEY: 'وكالة',
};

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

    const isCompany = client.clientType === 'COMPANY' || client.clientType === 'company';

    // Build info rows based on type
    const basicInfo = [];
    if (!isCompany) {
        if (client.nationalId) basicInfo.push({ icon: 'credit-card', label: 'رقم الهوية', value: client.nationalId });
        if (client.phone) basicInfo.push({ icon: 'phone', label: 'رقم الجوال', value: client.phone });
        if (client.email) basicInfo.push({ icon: 'mail', label: 'البريد الإلكتروني', value: client.email });
    }

    const companyInfo = [];
    if (isCompany) {
        if (client.brandName) companyInfo.push({ icon: 'tag', label: 'العلامة التجارية', value: client.brandName });
        if (client.unifiedNumber) companyInfo.push({ icon: 'hash', label: 'الرقم الموحد', value: client.unifiedNumber });
        if (client.commercialReg) companyInfo.push({ icon: 'file-text', label: 'رقم السجل التجاري', value: client.commercialReg });
    }

    const repInfo = [];
    if (isCompany) {
        if (client.repName) repInfo.push({ icon: 'user', label: 'اسم الممثل', value: client.repName });
        if (client.repIdentity) repInfo.push({ icon: 'credit-card', label: 'رقم هوية الممثل', value: client.repIdentity });
        if (client.repPhone) repInfo.push({ icon: 'phone', label: 'جوال الممثل', value: client.repPhone });
        if (client.repEmail) repInfo.push({ icon: 'mail', label: 'إيميل الممثل', value: client.repEmail });
        if (client.repDocType) repInfo.push({ icon: 'file', label: 'نوع مستند التمثيل', value: REP_DOC_LABELS[client.repDocType] || client.repDocType });
    }

    const documents = [];
    if (!isCompany && client.nationalIdDoc) documents.push({ label: 'مستند الهوية', url: client.nationalIdDoc });
    if (isCompany) {
        if (client.commercialRegDoc) documents.push({ label: 'مستند السجل التجاري', url: client.commercialRegDoc });
        if (client.nationalAddressDoc) documents.push({ label: 'العنوان الوطني', url: client.nationalAddressDoc });
        if (client.repIdentityDoc) documents.push({ label: 'مستند هوية الممثل', url: client.repIdentityDoc });
        if (client.repDoc) documents.push({ label: 'مستند التمثيل', url: client.repDoc });
    }

    const contactPhone = isCompany ? client.repPhone : client.phone;
    const contactEmail = isCompany ? client.repEmail : client.email;

    const InfoSection = ({ title, icon, rows }: { title: string; icon: string; rows: any[] }) => {
        if (rows.length === 0) return null;
        return (
            <Surface style={styles.section} elevation={1}>
                <View style={styles.sectionHeader}>
                    <Icon name={icon} size={16} color={colors.primary} />
                    <Text style={styles.sectionTitle}>{title}</Text>
                </View>
                <Divider style={styles.divider} />
                {rows.map((row, i) => (
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
                        {i < rows.length - 1 && <Divider style={styles.divider} />}
                    </View>
                ))}
            </Surface>
        );
    };

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
                    style={{ backgroundColor: isCompany ? '#8B5CF6' : colors.primary }}
                />
                <Text style={styles.name}>{client.name}</Text>
                <Chip
                    icon={() => <Icon name={isCompany ? 'briefcase' : 'user'} size={14} color={colors.primary} />}
                    style={styles.typeBadge}
                    textStyle={styles.typeBadgeText}
                >
                    {isCompany ? 'شركة' : 'فرد'}
                </Chip>

                {/* Quick Actions */}
                <View style={styles.actions}>
                    {contactPhone && (
                        <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => Linking.openURL(`tel:${contactPhone}`)}
                        >
                            <Icon name="phone" size={18} color={colors.white} />
                            <Text style={styles.actionText}>اتصال</Text>
                        </TouchableOpacity>
                    )}
                    {contactEmail && (
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
                            onPress={() => Linking.openURL(`mailto:${contactEmail}`)}
                        >
                            <Icon name="mail" size={18} color={colors.white} />
                            <Text style={styles.actionText}>بريد</Text>
                        </TouchableOpacity>
                    )}
                    {contactPhone && (
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: '#25D366' }]}
                            onPress={() => Linking.openURL(`https://wa.me/${contactPhone.replace(/[^0-9]/g, '')}`)}
                        >
                            <Icon name="message-circle" size={18} color={colors.white} />
                            <Text style={styles.actionText}>واتساب</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </Surface>

            {/* Individual Info */}
            {!isCompany && (
                <InfoSection title="معلومات العميل" icon="user" rows={basicInfo} />
            )}

            {/* Company Info */}
            {isCompany && (
                <>
                    <InfoSection title="بيانات المنشأة" icon="briefcase" rows={companyInfo} />
                    <InfoSection title="معلومات ممثل الشركة" icon="user" rows={repInfo} />
                </>
            )}

            {/* Documents */}
            {documents.length > 0 && (
                <Surface style={styles.section} elevation={1}>
                    <View style={styles.sectionHeader}>
                        <Icon name="paperclip" size={16} color={colors.primary} />
                        <Text style={styles.sectionTitle}>المستندات</Text>
                    </View>
                    <Divider style={styles.divider} />
                    {documents.map((doc, i) => (
                        <View key={doc.label}>
                            <TouchableOpacity
                                style={styles.docItem}
                                onPress={() => Linking.openURL(doc.url)}
                            >
                                <View style={styles.docIcon}>
                                    <Icon name="file" size={16} color="#4F46E5" />
                                </View>
                                <Text style={styles.docText}>{doc.label}</Text>
                                <Icon name="external-link" size={14} color={colors.textMuted} />
                            </TouchableOpacity>
                            {i < documents.length - 1 && <Divider style={styles.divider} />}
                        </View>
                    ))}
                </Surface>
            )}

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
    sectionHeader: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
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
    docItem: {
        flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8,
    },
    docIcon: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: '#EEF2FF',
        alignItems: 'center', justifyContent: 'center',
    },
    docText: { flex: 1, fontSize: 14, color: colors.text, fontWeight: '500' },
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
