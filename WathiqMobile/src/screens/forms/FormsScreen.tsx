import React from 'react';
import {
    View, StyleSheet, FlatList, RefreshControl, TouchableOpacity,
} from 'react-native';
import { Text, Searchbar, Surface, Chip, FAB } from 'react-native-paper';
import Icon from 'react-native-vector-icons/Feather';
import { colors } from '../../theme/colors';
import { apiService } from '../../services/api.service';
import { useQuery } from '@tanstack/react-query';

export function FormsScreen({ navigation }: any) {
    const [search, setSearch] = React.useState('');

    const { data: forms = [], isLoading, refetch } = useQuery({
        queryKey: ['forms'],
        queryFn: () => apiService.get('/forms').then((r: any) => r.data?.data || r.data || []),
    });

    const filtered = forms.filter((f: any) =>
        f.title?.toLowerCase().includes(search.toLowerCase())
    );

    const renderItem = ({ item }: any) => (
        <Surface style={styles.card} elevation={1}>
            <TouchableOpacity style={styles.cardContent}>
                <View style={styles.iconBox}>
                    <Icon name="clipboard" size={20} color={colors.primary} />
                </View>
                <View style={styles.textArea}>
                    <Text style={styles.title} numberOfLines={1}>{item.title || 'نموذج'}</Text>
                    <Text style={styles.subtitle}>
                        {item.fields?.length || 0} حقل • {item.isPublished ? 'منشور' : 'مسودة'}
                    </Text>
                </View>
                <Chip
                    style={[styles.chip, { backgroundColor: item.isPublished ? '#4CAF5020' : '#9E9E9E20' }]}
                    textStyle={{ fontSize: 10, color: item.isPublished ? '#4CAF50' : '#9E9E9E' }}
                >
                    {item.isPublished ? 'منشور' : 'مسودة'}
                </Chip>
            </TouchableOpacity>
        </Surface>
    );

    return (
        <View style={styles.container}>
            <Searchbar
                placeholder="بحث في النماذج..."
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
                        <Icon name="clipboard" size={48} color={colors.textMuted} />
                        <Text style={styles.emptyText}>لا توجد نماذج</Text>
                    </View>
                }
            />
            <FAB
                icon="plus"
                label="نموذج جديد"
                style={styles.fab}
                color="#fff"
                onPress={() => navigation.navigate('CreateForm')}
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
    chip: { height: 22 },
    empty: { alignItems: 'center', marginTop: 80 },
    emptyText: { fontSize: 14, color: colors.textMuted, marginTop: 12 },
    fab: {
        position: 'absolute', bottom: 20, left: 20,
        backgroundColor: colors.primary,
    },
});
