import React from 'react';
import {
    View, StyleSheet, FlatList, RefreshControl, TouchableOpacity,
} from 'react-native';
import { Text, Searchbar, Surface, Chip, FAB } from 'react-native-paper';
import Icon from 'react-native-vector-icons/Feather';
import { colors } from '../../theme/colors';
import { apiService } from '../../services/api.service';
import { useQuery } from '@tanstack/react-query';

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: string }> = {
    DRAFT: { color: colors.textMuted, label: 'مسودة', icon: 'edit' },
    SENT: { color: '#2196F3', label: 'مرسلة', icon: 'send' },
    PAID: { color: '#4CAF50', label: 'مدفوعة', icon: 'check-circle' },
    OVERDUE: { color: '#EF5350', label: 'متأخرة', icon: 'alert-circle' },
    CANCELLED: { color: '#9E9E9E', label: 'ملغاة', icon: 'x-circle' },
};

export function InvoicesScreen({ navigation }: any) {
    const [search, setSearch] = React.useState('');

    const { data: invoices = [], isLoading, refetch } = useQuery({
        queryKey: ['invoices'],
        queryFn: () => apiService.get('/invoices').then((r: any) => r.data?.data || r.data || []),
    });

    const filtered = invoices.filter((inv: any) =>
        inv.invoiceNumber?.includes(search) ||
        inv.client?.name?.toLowerCase().includes(search.toLowerCase())
    );

    const formatAmount = (amount: number) =>
        new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(amount || 0);

    const renderItem = ({ item }: any) => {
        const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.DRAFT;

        return (
            <Surface style={styles.card} elevation={1}>
                <TouchableOpacity style={styles.cardContent}>
                    <View style={[styles.iconBox, { backgroundColor: status.color + '20' }]}>
                        <Icon name={status.icon} size={20} color={status.color} />
                    </View>
                    <View style={styles.textArea}>
                        <Text style={styles.title}>#{item.invoiceNumber || '---'}</Text>
                        <Text style={styles.subtitle} numberOfLines={1}>
                            {item.client?.name || 'بدون عميل'}
                        </Text>
                    </View>
                    <View style={styles.amountArea}>
                        <Text style={styles.amount}>{formatAmount(item.total)}</Text>
                        <Chip
                            style={[styles.chip, { backgroundColor: status.color + '15' }]}
                            textStyle={[styles.chipText, { color: status.color }]}
                        >
                            {status.label}
                        </Chip>
                    </View>
                </TouchableOpacity>
            </Surface>
        );
    };

    return (
        <View style={styles.container}>
            <Searchbar
                placeholder="بحث في الفواتير..."
                value={search}
                onChangeText={setSearch}
                style={styles.searchbar}
                inputStyle={styles.searchInput}
            />
            <FlatList
                data={filtered}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Icon name="file-text" size={48} color={colors.textMuted} />
                        <Text style={styles.emptyText}>لا توجد فواتير</Text>
                    </View>
                }
            />
            <FAB
                icon="plus"
                label="فاتورة جديدة"
                style={styles.fab}
                color="#fff"
                onPress={() => navigation.navigate('CreateInvoice')}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    searchbar: { margin: 16, borderRadius: 12, elevation: 1, backgroundColor: colors.white },
    searchInput: { fontSize: 14 },
    list: { paddingHorizontal: 16, paddingBottom: 80 },
    card: { borderRadius: 12, marginBottom: 10, backgroundColor: colors.white },
    cardContent: { flexDirection: 'row', alignItems: 'center', padding: 14 },
    iconBox: {
        width: 40, height: 40, borderRadius: 10,
        alignItems: 'center', justifyContent: 'center', marginLeft: 12,
    },
    textArea: { flex: 1 },
    title: { fontSize: 15, fontWeight: '600', color: colors.text },
    subtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    amountArea: { alignItems: 'flex-start' },
    amount: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 4 },
    chip: { height: 22 },
    chipText: { fontSize: 10 },
    empty: { alignItems: 'center', marginTop: 80 },
    emptyText: { fontSize: 14, color: colors.textMuted, marginTop: 12 },
    fab: {
        position: 'absolute', bottom: 20, left: 20,
        backgroundColor: colors.primary,
    },
});
