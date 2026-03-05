import React, { useState, useCallback } from 'react';
import {
    View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Linking, Alert,
} from 'react-native';
import { Text, Searchbar, FAB, Chip, Surface } from 'react-native-paper';
import Icon from 'react-native-vector-icons/Feather';
import { colors } from '../../theme/colors';
import { apiService } from '../../services/api.service';
import { useQuery } from '@tanstack/react-query';

const BASE_URL = 'https://bewathiq.com/api';

export function DocumentsScreen({ navigation }: any) {
    const [search, setSearch] = useState('');

    const { data: documents = [], isLoading, refetch } = useQuery({
        queryKey: ['documents'],
        queryFn: () => apiService.get('/documents').then((r: any) => r.data || []),
    });

    const filtered = documents.filter((d: any) =>
        d.name?.toLowerCase().includes(search.toLowerCase()) ||
        d.title?.toLowerCase().includes(search.toLowerCase())
    );

    const handleOpenDocument = useCallback((item: any) => {
        navigation.navigate('DocumentViewer', { document: item });
    }, [navigation]);

    const getTypeIcon = (type: string) => {
        switch (type?.toLowerCase()) {
            case 'contract': return 'file-text';
            case 'pleading': return 'edit-3';
            case 'evidence': return 'paperclip';
            default: return 'file';
        }
    };

    const renderItem = ({ item }: any) => (
        <Surface style={styles.card} elevation={1}>
            <TouchableOpacity style={styles.cardContent} onPress={() => handleOpenDocument(item)}>
                <View style={styles.iconBox}>
                    <Icon name={getTypeIcon(item.type)} size={20} color={colors.primary} />
                </View>
                <View style={styles.textArea}>
                    <Text style={styles.title} numberOfLines={1}>{item.name || item.title || 'مستند'}</Text>
                    <Text style={styles.subtitle} numberOfLines={1}>
                        {item.case?.title ? `القضية: ${item.case.title}` : 'بدون قضية'}
                    </Text>
                </View>
                <Icon name="chevron-left" size={18} color={colors.textMuted} />
            </TouchableOpacity>
        </Surface>
    );

    return (
        <View style={styles.container}>
            <Searchbar
                placeholder="بحث في المستندات..."
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
                        <Icon name="file" size={48} color={colors.textMuted} />
                        <Text style={styles.emptyText}>لا توجد مستندات</Text>
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
    card: { borderRadius: 12, marginBottom: 10, backgroundColor: colors.white },
    cardContent: { flexDirection: 'row', alignItems: 'center', padding: 14 },
    iconBox: {
        width: 40, height: 40, borderRadius: 10,
        backgroundColor: colors.primaryLight || '#EEF0FF',
        alignItems: 'center', justifyContent: 'center', marginLeft: 12,
    },
    textArea: { flex: 1 },
    title: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 2 },
    subtitle: { fontSize: 12, color: colors.textSecondary },
    empty: { alignItems: 'center', marginTop: 80 },
    emptyText: { fontSize: 14, color: colors.textMuted, marginTop: 12 },
});
