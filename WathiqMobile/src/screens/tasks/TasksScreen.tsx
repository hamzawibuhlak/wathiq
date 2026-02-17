import React from 'react';
import {
    View, StyleSheet, FlatList, RefreshControl, TouchableOpacity,
} from 'react-native';
import { Text, Searchbar, Surface, Chip } from 'react-native-paper';
import Icon from 'react-native-vector-icons/Feather';
import { colors } from '../../theme/colors';
import { apiService } from '../../services/api.service';
import { useQuery } from '@tanstack/react-query';

const PRIORITY_CONFIG: Record<string, { color: string; label: string }> = {
    LOW: { color: '#66BB6A', label: 'منخفضة' },
    MEDIUM: { color: '#FFA726', label: 'متوسطة' },
    HIGH: { color: '#EF5350', label: 'عالية' },
    URGENT: { color: '#D32F2F', label: 'عاجلة' },
};

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
    TODO: { color: colors.textMuted, label: 'قيد التنفيذ' },
    IN_PROGRESS: { color: '#2196F3', label: 'جاري العمل' },
    DONE: { color: '#4CAF50', label: 'مكتمل' },
};

export function TasksScreen() {
    const [search, setSearch] = React.useState('');

    const { data: tasks = [], isLoading, refetch } = useQuery({
        queryKey: ['tasks'],
        queryFn: () => apiService.get('/tasks').then(r => r.data?.data || r.data || []),
    });

    const filtered = tasks.filter((t: any) =>
        t.title?.toLowerCase().includes(search.toLowerCase())
    );

    const renderItem = ({ item }: any) => {
        const priority = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.MEDIUM;
        const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.TODO;

        return (
            <Surface style={styles.card} elevation={1}>
                <TouchableOpacity style={styles.cardContent}>
                    <View style={[styles.priorityStrip, { backgroundColor: priority.color }]} />
                    <View style={styles.textArea}>
                        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                        <View style={styles.metaRow}>
                            <Chip
                                style={[styles.chip, { backgroundColor: status.color + '20' }]}
                                textStyle={[styles.chipText, { color: status.color }]}
                            >
                                {status.label}
                            </Chip>
                            <Chip
                                style={[styles.chip, { backgroundColor: priority.color + '20' }]}
                                textStyle={[styles.chipText, { color: priority.color }]}
                            >
                                {priority.label}
                            </Chip>
                        </View>
                        {item.assignedTo?.name && (
                            <Text style={styles.assignee}>
                                <Icon name="user" size={11} /> {item.assignedTo.name}
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
                placeholder="بحث في المهام..."
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
                        <Icon name="check-square" size={48} color={colors.textMuted} />
                        <Text style={styles.emptyText}>لا توجد مهام</Text>
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
    card: { borderRadius: 12, marginBottom: 10, backgroundColor: colors.white, overflow: 'hidden' },
    cardContent: { flexDirection: 'row', alignItems: 'center', padding: 14 },
    priorityStrip: { width: 4, height: '100%', borderRadius: 2, marginLeft: 12, position: 'absolute', right: 0, top: 0, bottom: 0 },
    textArea: { flex: 1 },
    title: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 6 },
    metaRow: { flexDirection: 'row', gap: 6 },
    chip: { height: 24 },
    chipText: { fontSize: 10 },
    assignee: { fontSize: 11, color: colors.textSecondary, marginTop: 4 },
    empty: { alignItems: 'center', marginTop: 80 },
    emptyText: { fontSize: 14, color: colors.textMuted, marginTop: 12 },
});
