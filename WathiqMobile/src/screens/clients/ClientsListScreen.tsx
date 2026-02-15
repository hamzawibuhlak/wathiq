import React, { useState } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Searchbar, FAB, Surface, Avatar } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/Feather';
import { clientsApi } from '../../api/clients';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { colors } from '../../theme/colors';
import { getInitials } from '../../utils/formatters';
import { Client } from '../../types/models.types';

export function ClientsListScreen({ navigation }: any) {
    const [search, setSearch] = useState('');

    const { data, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['clients', search],
        queryFn: () => clientsApi.getAll({ search: search || undefined }),
    });

    const clients = data?.data || [];

    const renderClient = ({ item }: { item: Client }) => (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('ClientDetails', { id: item.id })}
        >
            <Surface style={styles.clientCard} elevation={1}>
                <Avatar.Text
                    size={44}
                    label={getInitials(item.name)}
                    style={{ backgroundColor: item.clientType === 'COMPANY' ? '#8B5CF6' : colors.primary }}
                />
                <View style={styles.clientInfo}>
                    <Text style={styles.clientName}>{item.name}</Text>
                    <View style={styles.clientMeta}>
                        <Icon name={item.clientType === 'COMPANY' ? 'briefcase' : 'user'} size={12} color={colors.textMuted} />
                        <Text style={styles.metaText}>
                            {item.clientType === 'COMPANY' ? 'شركة' : 'فرد'}
                        </Text>
                        {item.activeCases !== undefined && (
                            <>
                                <Text style={styles.metaDot}>·</Text>
                                <Text style={styles.metaText}>{item.activeCases} قضايا نشطة</Text>
                            </>
                        )}
                    </View>
                    {item.phone && (
                        <View style={styles.clientMeta}>
                            <Icon name="phone" size={12} color={colors.textMuted} />
                            <Text style={styles.metaText}>{item.phone}</Text>
                        </View>
                    )}
                </View>
                <Icon name="chevron-left" size={18} color={colors.textMuted} />
            </Surface>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Searchbar
                placeholder="ابحث عن عميل..."
                value={search}
                onChangeText={setSearch}
                style={styles.searchbar}
                inputStyle={styles.searchInput}
            />

            {isLoading ? (
                <LoadingSpinner />
            ) : clients.length === 0 ? (
                <EmptyState
                    icon="users"
                    title="لا يوجد عملاء"
                    description="أضف عميلاً جديداً للبدء"
                    actionLabel="إضافة عميل"
                    onAction={() => navigation.navigate('CreateClient')}
                />
            ) : (
                <FlatList
                    data={clients}
                    keyExtractor={(item) => item.id}
                    renderItem={renderClient}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
                    showsVerticalScrollIndicator={false}
                />
            )}

            <FAB
                icon="plus"
                style={styles.fab}
                onPress={() => navigation.navigate('CreateClient')}
                color={colors.white}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    searchbar: { margin: 16, marginBottom: 8, borderRadius: 12, backgroundColor: colors.white, elevation: 1 },
    searchInput: { fontSize: 14 },
    list: { padding: 16, paddingTop: 8, gap: 10 },
    clientCard: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        padding: 14, borderRadius: 14, backgroundColor: colors.white,
    },
    clientInfo: { flex: 1 },
    clientName: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 4 },
    clientMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    metaText: { fontSize: 12, color: colors.textMuted },
    metaDot: { color: colors.textMuted, fontSize: 12 },
    fab: {
        position: 'absolute', bottom: 20, left: 20,
        backgroundColor: colors.primary, borderRadius: 16,
    },
});
