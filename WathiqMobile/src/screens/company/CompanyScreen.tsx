import React, { useState, useEffect } from 'react';
import {
    View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Linking, Alert,
} from 'react-native';
import { Text, Surface, Divider, Avatar, TextInput, Button } from 'react-native-paper';
import Icon from 'react-native-vector-icons/Feather';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../services/api.service';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../theme/colors';
import { getInitials } from '../../utils/formatters';

export function CompanyScreen() {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const tenantSlug = user?.tenantSlug || '';
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState<any>({});

    const { data: tenantData, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['tenant-info'],
        queryFn: async () => {
            try {
                const res = await apiService.get('/settings');
                return (res as any).data || res;
            } catch {
                return null;
            }
        },
    });

    const tenant = tenantData || {};

    useEffect(() => {
        if (tenant) {
            setForm({
                companyName: tenant.companyName || tenant.name || '',
                website: tenant.website || '',
                email: tenant.email || user?.email || '',
                phone: tenant.phone || '',
                address: tenant.address || '',
                commercialRegistration: tenant.commercialRegistration || tenant.crNumber || '',
                taxNumber: tenant.taxNumber || tenant.vatNumber || '',
            });
        }
    }, [tenantData]);

    const saveMutation = useMutation({
        mutationFn: (data: any) => apiService.patch('/settings', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tenant-info'] });
            setEditing(false);
            Alert.alert('تم', 'تم حفظ التغييرات بنجاح');
        },
        onError: () => Alert.alert('خطأ', 'حدث خطأ في حفظ التغييرات'),
    });

    const handleSave = () => saveMutation.mutate(form);

    const companyName = form.companyName || tenant.companyName || tenant.name || user?.tenantName || tenantSlug;

    const infoRows = [
        { icon: 'globe', label: 'الموقع الإلكتروني', value: form.website, key: 'website' },
        { icon: 'mail', label: 'البريد الإلكتروني', value: form.email, key: 'email' },
        { icon: 'phone', label: 'الهاتف', value: form.phone, key: 'phone' },
        { icon: 'map-pin', label: 'العنوان', value: form.address, key: 'address' },
        { icon: 'hash', label: 'السجل التجاري', value: form.commercialRegistration, key: 'commercialRegistration' },
        { icon: 'file-text', label: 'الرقم الضريبي', value: form.taxNumber, key: 'taxNumber' },
    ];

    const statsItems = [
        { icon: 'users', label: 'المستخدمين', value: tenant.usersCount || tenant.totalUsers || '—', color: '#4F46E5' },
        { icon: 'briefcase', label: 'القضايا', value: tenant.casesCount || '—', color: '#F59E0B' },
        { icon: 'user-check', label: 'العملاء', value: tenant.clientsCount || '—', color: '#10B981' },
        { icon: 'file', label: 'المستندات', value: tenant.documentsCount || '—', color: '#8B5CF6' },
    ];

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={isLoading || isRefetching} onRefresh={refetch} />}
        >
            {/* Company Header */}
            <Surface style={styles.headerCard} elevation={2}>
                <Avatar.Text
                    size={72}
                    label={getInitials(companyName)}
                    style={{ backgroundColor: colors.primary }}
                />
                <Text style={styles.companyName}>{companyName}</Text>
                {tenant.plan && (
                    <View style={styles.planBadge}>
                        <Icon name="award" size={14} color="#F59E0B" />
                        <Text style={styles.planText}>{tenant.plan}</Text>
                    </View>
                )}
                {tenantSlug && (
                    <TouchableOpacity
                        style={styles.linkBtn}
                        onPress={() => Linking.openURL(`https://bewathiq.com/${tenantSlug}`)}
                    >
                        <Icon name="external-link" size={14} color={colors.primary} />
                        <Text style={styles.linkText}>bewathiq.com/{tenantSlug}</Text>
                    </TouchableOpacity>
                )}
            </Surface>

            {/* Stats */}
            <View style={styles.statsRow}>
                {statsItems.map((stat) => (
                    <Surface key={stat.label} style={styles.statCard} elevation={1}>
                        <Icon name={stat.icon} size={20} color={stat.color} />
                        <Text style={styles.statNumber}>{stat.value}</Text>
                        <Text style={styles.statLabel}>{stat.label}</Text>
                    </Surface>
                ))}
            </View>

            {/* Company Info */}
            <Surface style={styles.section} elevation={1}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>معلومات الشركة</Text>
                    <TouchableOpacity onPress={() => setEditing(!editing)}>
                        <Icon name={editing ? 'x' : 'edit-2'} size={18} color={colors.primary} />
                    </TouchableOpacity>
                </View>
                <Divider style={styles.divider} />

                {editing ? (
                    <View>
                        <TextInput label="اسم الشركة" value={form.companyName} mode="outlined"
                            onChangeText={(v: string) => setForm({ ...form, companyName: v })}
                            style={styles.editInput} outlineColor={colors.border} activeOutlineColor={colors.primary} />
                        {infoRows.map(row => (
                            <TextInput key={row.key} label={row.label} value={row.value || ''} mode="outlined"
                                onChangeText={(v: string) => setForm({ ...form, [row.key]: v })}
                                style={styles.editInput} outlineColor={colors.border} activeOutlineColor={colors.primary} />
                        ))}
                        <Button mode="contained" onPress={handleSave} loading={saveMutation.isPending}
                            disabled={saveMutation.isPending} style={styles.saveBtn} buttonColor={colors.primary}
                            contentStyle={{ paddingVertical: 4 }}>
                            حفظ التغييرات
                        </Button>
                    </View>
                ) : (
                    infoRows.filter(r => r.value).length === 0 ? (
                        <View style={styles.emptySection}>
                            <Icon name="info" size={24} color={colors.textMuted} />
                            <Text style={styles.emptyText}>لا توجد معلومات إضافية</Text>
                            <Text style={styles.emptySubText}>اضغط على أيقونة التعديل لإضافة معلومات</Text>
                        </View>
                    ) : (
                        infoRows.filter(r => r.value).map((row, i, arr) => (
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
                                {i < arr.length - 1 && <Divider style={styles.divider} />}
                            </View>
                        ))
                    )
                )}
            </Surface>

            {/* Subscription */}
            {tenant.subscription && (
                <Surface style={styles.section} elevation={1}>
                    <Text style={styles.sectionTitle}>الاشتراك</Text>
                    <Divider style={styles.divider} />
                    <View style={styles.subRow}>
                        <Text style={styles.subLabel}>الخطة</Text>
                        <Text style={styles.subValue}>{tenant.subscription.plan || tenant.plan || '—'}</Text>
                    </View>
                    <View style={styles.subRow}>
                        <Text style={styles.subLabel}>الحالة</Text>
                        <Text style={[styles.subValue, { color: '#10B981' }]}>
                            {tenant.subscription.status === 'ACTIVE' ? 'نشط' : tenant.subscription.status || '—'}
                        </Text>
                    </View>
                    {tenant.subscription.expiresAt && (
                        <View style={styles.subRow}>
                            <Text style={styles.subLabel}>تاريخ الانتهاء</Text>
                            <Text style={styles.subValue}>
                                {new Date(tenant.subscription.expiresAt).toLocaleDateString('ar-SA')}
                            </Text>
                        </View>
                    )}
                </Surface>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 40 },
    headerCard: {
        borderRadius: 20, padding: 24,
        backgroundColor: colors.white, alignItems: 'center', marginBottom: 16,
    },
    companyName: { fontSize: 22, fontWeight: '700', color: colors.text, marginTop: 12 },
    planBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        marginTop: 8, backgroundColor: '#FEF3C7', paddingHorizontal: 12, paddingVertical: 4,
        borderRadius: 8,
    },
    planText: { fontSize: 12, fontWeight: '600', color: '#F59E0B' },
    linkBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        marginTop: 12, paddingHorizontal: 16, paddingVertical: 8,
        borderRadius: 10, borderWidth: 1, borderColor: colors.primary,
    },
    linkText: { fontSize: 13, color: colors.primary, fontWeight: '500' },
    statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    statCard: {
        flex: 1, borderRadius: 14, padding: 12,
        backgroundColor: colors.white, alignItems: 'center',
    },
    statNumber: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 4 },
    statLabel: { fontSize: 10, color: colors.textSecondary, marginTop: 2 },
    section: { borderRadius: 16, padding: 16, backgroundColor: colors.white, marginBottom: 16 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 4 },
    divider: { marginVertical: 8 },
    emptySection: { alignItems: 'center', paddingVertical: 20 },
    emptyText: { fontSize: 13, color: colors.textMuted, marginTop: 8 },
    emptySubText: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
    infoIcon: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: colors.primaryLight || '#EEF0FF',
        alignItems: 'center', justifyContent: 'center',
    },
    infoContent: { flex: 1 },
    infoLabel: { fontSize: 11, color: colors.textSecondary },
    infoValue: { fontSize: 14, color: colors.text, fontWeight: '500', marginTop: 1 },
    editInput: { marginBottom: 10, backgroundColor: colors.white },
    saveBtn: { marginTop: 8, borderRadius: 10 },
    subRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
    subLabel: { fontSize: 13, color: colors.textSecondary },
    subValue: { fontSize: 13, fontWeight: '600', color: colors.text },
});
