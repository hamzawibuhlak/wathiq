import React, { useState } from 'react';
import {
    View, StyleSheet, ScrollView, RefreshControl, FlatList, TouchableOpacity,
} from 'react-native';
import { Text, Surface, Divider, Chip, Searchbar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/Feather';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../../services/api.service';
import { colors } from '../../theme/colors';

const LEAD_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    NEW: { label: 'جديد', color: '#3B82F6' },
    CONTACTED: { label: 'تم التواصل', color: '#8B5CF6' },
    QUALIFIED: { label: 'مؤهل', color: '#10B981' },
    PROPOSAL: { label: 'عرض سعر', color: '#F59E0B' },
    WON: { label: 'مكسب', color: '#10B981' },
    LOST: { label: 'خاسر', color: '#EF4444' },
};

export function MarketingScreen({ navigation }: any) {
    const [tab, setTab] = useState<'leads' | 'campaigns'>('leads');
    const [search, setSearch] = useState('');

    const { data: statsData } = useQuery({
        queryKey: ['marketing-stats'],
        queryFn: () => apiService.get('/marketing/leads/stats').then((r: any) => r.data || r),
    });

    const { data: leadsData, isLoading: leadsLoading, refetch: refetchLeads } = useQuery({
        queryKey: ['marketing-leads', search],
        queryFn: () => apiService.get('/marketing/leads', { params: { search: search || undefined } }).then((r: any) => r.data || []),
        enabled: tab === 'leads',
    });

    const { data: campaignsData, isLoading: campaignsLoading, refetch: refetchCampaigns } = useQuery({
        queryKey: ['marketing-campaigns'],
        queryFn: () => apiService.get('/marketing/campaigns').then((r: any) => r.data || []),
        enabled: tab === 'campaigns',
    });

    const stats = statsData || {};
    const leads = Array.isArray(leadsData) ? leadsData : [];
    const campaigns = Array.isArray(campaignsData) ? campaignsData : [];

    const summaryCards = [
        { icon: 'users', label: 'العملاء المحتملين', value: stats.totalLeads || leads.length, color: '#4F46E5' },
        { icon: 'user-check', label: 'المؤهلين', value: stats.qualifiedLeads || 0, color: '#10B981' },
        { icon: 'target', label: 'الحملات', value: stats.totalCampaigns || campaigns.length, color: '#F59E0B' },
        { icon: 'trending-up', label: 'معدل التحويل', value: `${stats.conversionRate || 0}%`, color: '#8B5CF6' },
    ];

    return (
        <View style={styles.container}>
            {/* Stats Grid */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll} contentContainerStyle={styles.statsContent}>
                {summaryCards.map((card) => (
                    <Surface key={card.label} style={styles.statCard} elevation={2}>
                        <View style={[styles.statIcon, { backgroundColor: `${card.color}12` }]}>
                            <Icon name={card.icon} size={18} color={card.color} />
                        </View>
                        <Text style={[styles.statValue, { color: card.color }]}>{card.value}</Text>
                        <Text style={styles.statLabel}>{card.label}</Text>
                    </Surface>
                ))}
            </ScrollView>

            {/* Tab Switch */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, tab === 'leads' && styles.tabActive]}
                    onPress={() => setTab('leads')}
                >
                    <Icon name="users" size={16} color={tab === 'leads' ? colors.primary : colors.textMuted} />
                    <Text style={[styles.tabText, tab === 'leads' && styles.tabTextActive]}>العملاء المحتملين</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, tab === 'campaigns' && styles.tabActive]}
                    onPress={() => setTab('campaigns')}
                >
                    <Icon name="target" size={16} color={tab === 'campaigns' ? colors.primary : colors.textMuted} />
                    <Text style={[styles.tabText, tab === 'campaigns' && styles.tabTextActive]}>الحملات</Text>
                </TouchableOpacity>
            </View>

            {tab === 'leads' && (
                <Searchbar
                    placeholder="بحث عن عميل محتمل..."
                    value={search}
                    onChangeText={setSearch}
                    style={styles.searchbar}
                    inputStyle={styles.searchInput}
                />
            )}

            {/* Content */}
            <FlatList
                data={tab === 'leads' ? leads : campaigns}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl
                        refreshing={tab === 'leads' ? leadsLoading : campaignsLoading}
                        onRefresh={tab === 'leads' ? refetchLeads : refetchCampaigns}
                    />
                }
                renderItem={({ item }) => tab === 'leads' ? (
                    <Surface style={styles.card} elevation={1}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle} numberOfLines={1}>{item.name || item.companyName || 'عميل محتمل'}</Text>
                            <Chip
                                style={[styles.chip, { backgroundColor: `${(LEAD_STATUS_CONFIG[item.status] || LEAD_STATUS_CONFIG.NEW).color}12` }]}
                                textStyle={{ color: (LEAD_STATUS_CONFIG[item.status] || LEAD_STATUS_CONFIG.NEW).color, fontSize: 10 }}
                            >
                                {(LEAD_STATUS_CONFIG[item.status] || LEAD_STATUS_CONFIG.NEW).label}
                            </Chip>
                        </View>
                        {item.email && (
                            <View style={styles.metaRow}>
                                <Icon name="mail" size={12} color={colors.textMuted} />
                                <Text style={styles.metaText}>{item.email}</Text>
                            </View>
                        )}
                        {item.phone && (
                            <View style={styles.metaRow}>
                                <Icon name="phone" size={12} color={colors.textMuted} />
                                <Text style={styles.metaText}>{item.phone}</Text>
                            </View>
                        )}
                        {item.source && (
                            <View style={styles.metaRow}>
                                <Icon name="link" size={12} color={colors.textMuted} />
                                <Text style={styles.metaText}>{item.source}</Text>
                            </View>
                        )}
                    </Surface>
                ) : (
                    <Surface style={styles.card} elevation={1}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle} numberOfLines={1}>{item.name || 'حملة'}</Text>
                            <Chip
                                style={[styles.chip, { backgroundColor: item.status === 'ACTIVE' ? '#10B98112' : '#6B728012' }]}
                                textStyle={{ color: item.status === 'ACTIVE' ? '#10B981' : '#6B7280', fontSize: 10 }}
                            >
                                {item.status === 'ACTIVE' ? 'نشطة' : item.status === 'COMPLETED' ? 'مكتملة' : 'مسودة'}
                            </Chip>
                        </View>
                        {item.type && (
                            <View style={styles.metaRow}>
                                <Icon name="tag" size={12} color={colors.textMuted} />
                                <Text style={styles.metaText}>{item.type}</Text>
                            </View>
                        )}
                        {item.budget && (
                            <View style={styles.metaRow}>
                                <Icon name="dollar-sign" size={12} color={colors.textMuted} />
                                <Text style={styles.metaText}>{item.budget} ر.س</Text>
                            </View>
                        )}
                    </Surface>
                )}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Icon name={tab === 'leads' ? 'users' : 'target'} size={48} color={colors.textMuted} />
                        <Text style={styles.emptyText}>
                            {tab === 'leads' ? 'لا يوجد عملاء محتملين' : 'لا توجد حملات'}
                        </Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    statsScroll: { maxHeight: 120 },
    statsContent: { paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
    statCard: {
        width: 120, borderRadius: 14, padding: 12,
        backgroundColor: colors.white, alignItems: 'center',
    },
    statIcon: {
        width: 36, height: 36, borderRadius: 10,
        alignItems: 'center', justifyContent: 'center', marginBottom: 6,
    },
    statValue: { fontSize: 18, fontWeight: '700' },
    statLabel: { fontSize: 10, color: colors.textSecondary, marginTop: 2, textAlign: 'center' },
    tabs: { flexDirection: 'row', marginHorizontal: 16, gap: 8, marginBottom: 8 },
    tab: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, paddingVertical: 10, borderRadius: 12,
        backgroundColor: colors.white, borderWidth: 1, borderColor: colors.borderLight || '#E5E7EB',
    },
    tabActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight || '#EEF0FF' },
    tabText: { fontSize: 13, color: colors.textMuted },
    tabTextActive: { color: colors.primary, fontWeight: '600' },
    searchbar: { marginHorizontal: 16, marginBottom: 8, borderRadius: 12, elevation: 1, backgroundColor: colors.white },
    searchInput: { fontSize: 14 },
    list: { paddingHorizontal: 16, paddingBottom: 80 },
    card: { borderRadius: 14, padding: 14, marginBottom: 10, backgroundColor: colors.white },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    cardTitle: { fontSize: 15, fontWeight: '600', color: colors.text, flex: 1, marginLeft: 8 },
    chip: { height: 24 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    metaText: { fontSize: 12, color: colors.textSecondary },
    empty: { alignItems: 'center', marginTop: 80 },
    emptyText: { fontSize: 14, color: colors.textMuted, marginTop: 12 },
});
