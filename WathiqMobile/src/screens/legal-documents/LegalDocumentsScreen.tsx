import React from 'react';
import {
    View, StyleSheet, FlatList, RefreshControl, TouchableOpacity,
} from 'react-native';
import { Text, Searchbar, Surface, Chip } from 'react-native-paper';
import Icon from 'react-native-vector-icons/Feather';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../../services/api.service';
import { colors } from '../../theme/colors';

const TYPE_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
    CONTRACT: { icon: 'file-text', color: '#4F46E5', label: 'عقد' },
    PLEADING: { icon: 'edit-3', color: '#F59E0B', label: 'مذكرة' },
    POWER_OF_ATTORNEY: { icon: 'shield', color: '#8B5CF6', label: 'توكيل' },
    MEMO: { icon: 'clipboard', color: '#06B6D4', label: 'مذكرة داخلية' },
    LETTER: { icon: 'mail', color: '#10B981', label: 'خطاب' },
    OTHER: { icon: 'file', color: '#6B7280', label: 'أخرى' },
};

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
    DRAFT: { color: '#9CA3AF', label: 'مسودة' },
    REVIEW: { color: '#F59E0B', label: 'مراجعة' },
    APPROVED: { color: '#10B981', label: 'معتمد' },
    SIGNED: { color: '#4F46E5', label: 'موقّع' },
};

export function LegalDocumentsScreen({ navigation }: any) {
    const [search, setSearch] = React.useState('');

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['legal-documents'],
        queryFn: () => apiService.get('/legal-documents').then((r: any) => r.data?.data || r.data || []),
    });

    const documents = Array.isArray(data) ? data : [];
    const filtered = documents.filter((d: any) =>
        d.title?.toLowerCase().includes(search.toLowerCase()) ||
        d.name?.toLowerCase().includes(search.toLowerCase())
    );

    const renderItem = ({ item }: any) => {
        const typeConfig = TYPE_CONFIG[item.documentType || item.type] || TYPE_CONFIG.OTHER;
        const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.DRAFT;

        return (
            <Surface style={styles.card} elevation={1}>
                <TouchableOpacity style={styles.cardContent}>
                    <View style={[styles.iconBox, { backgroundColor: `${typeConfig.color}12` }]}>
                        <Icon name={typeConfig.icon} size={20} color={typeConfig.color} />
                    </View>
                    <View style={styles.textArea}>
                        <Text style={styles.title} numberOfLines={1}>{item.title || item.name || 'مستند'}</Text>
                        <View style={styles.metaRow}>
                            <Chip
                                style={[styles.chip, { backgroundColor: `${typeConfig.color}12` }]}
                                textStyle={[styles.chipText, { color: typeConfig.color }]}
                            >
                                {typeConfig.label}
                            </Chip>
                            <Chip
                                style={[styles.chip, { backgroundColor: `${statusConfig.color}12` }]}
                                textStyle={[styles.chipText, { color: statusConfig.color }]}
                            >
                                {statusConfig.label}
                            </Chip>
                        </View>
                        {item.case?.title && (
                            <Text style={styles.caseLink} numberOfLines={1}>
                                🔗 {item.case.title}
                            </Text>
                        )}
                    </View>
                    <Icon name="chevron-left" size={18} color={colors.textMuted} />
                </TouchableOpacity>
            </Surface>
        );
    };

    return (
        <View style={styles.container}>
            <Searchbar
                placeholder="بحث في المستندات القانونية..."
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
                        <Text style={styles.emptyText}>لا توجد مستندات قانونية</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    searchbar: { margin: 16, borderRadius: 12, elevation: 1, backgroundColor: colors.white },
    searchInput: { fontSize: 14 },
    list: { paddingHorizontal: 16, paddingBottom: 80 },
    card: { borderRadius: 14, marginBottom: 10, backgroundColor: colors.white },
    cardContent: { flexDirection: 'row', alignItems: 'center', padding: 14 },
    iconBox: {
        width: 44, height: 44, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center', marginLeft: 12,
    },
    textArea: { flex: 1 },
    title: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 6 },
    metaRow: { flexDirection: 'row', gap: 6 },
    chip: { height: 24 },
    chipText: { fontSize: 10 },
    caseLink: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
    empty: { alignItems: 'center', marginTop: 80 },
    emptyText: { fontSize: 14, color: colors.textMuted, marginTop: 12 },
});
