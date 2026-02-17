import React, { useState } from 'react';
import {
    View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput as RNTextInput,
} from 'react-native';
import { Text, Surface, Avatar, Searchbar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/Feather';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../../services/api.service';
import { colors } from '../../theme/colors';
import { getInitials } from '../../utils/formatters';

function timeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'الآن';
    if (diff < 3600) return `${Math.floor(diff / 60)} د`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} س`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} ي`;
    return date.toLocaleDateString('ar-SA');
}

export function ChatScreen({ navigation }: any) {
    const [search, setSearch] = useState('');

    const { data, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['chat-conversations'],
        queryFn: () => apiService.get('/chat/conversations').then((r: any) => r.data || []),
    });

    const conversations = Array.isArray(data) ? data : [];
    const filtered = conversations.filter((c: any) =>
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.lastMessage?.content?.toLowerCase().includes(search.toLowerCase())
    );

    const renderConversation = ({ item }: any) => {
        const isGroup = item.type === 'GROUP';
        const unread = item.unreadCount || 0;
        const lastMsg = item.lastMessage;

        return (
            <TouchableOpacity
                style={styles.row}
                onPress={() => navigation.navigate('ChatConversation', { id: item.id, name: item.name })}
            >
                <View style={styles.avatarWrapper}>
                    {isGroup ? (
                        <View style={[styles.groupAvatar, { backgroundColor: '#8B5CF6' }]}>
                            <Icon name="users" size={20} color={colors.white} />
                        </View>
                    ) : (
                        <Avatar.Text
                            size={48}
                            label={getInitials(item.name || 'م')}
                            style={{ backgroundColor: colors.primary }}
                        />
                    )}
                    {item.isOnline && <View style={styles.onlineDot} />}
                </View>

                <View style={styles.textArea}>
                    <View style={styles.nameRow}>
                        <Text style={[styles.name, unread > 0 && styles.nameBold]} numberOfLines={1}>
                            {item.name || 'محادثة'}
                        </Text>
                        <Text style={styles.time}>
                            {lastMsg?.createdAt ? timeAgo(lastMsg.createdAt) : ''}
                        </Text>
                    </View>
                    <View style={styles.msgRow}>
                        <Text style={[styles.lastMsg, unread > 0 && styles.lastMsgUnread]} numberOfLines={1}>
                            {lastMsg?.content || 'لا توجد رسائل بعد'}
                        </Text>
                        {unread > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{unread}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <Searchbar
                placeholder="بحث في المحادثات..."
                value={search}
                onChangeText={setSearch}
                style={styles.searchbar}
                inputStyle={styles.searchInput}
            />

            <FlatList
                data={filtered}
                keyExtractor={(item) => item.id}
                renderItem={renderConversation}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={isLoading || isRefetching} onRefresh={refetch} />}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Icon name="message-circle" size={48} color={colors.textMuted} />
                        <Text style={styles.emptyText}>لا توجد محادثات</Text>
                        <Text style={styles.emptySubText}>ابدأ محادثة جديدة مع أحد أعضاء الفريق</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    searchbar: {
        margin: 16, marginBottom: 8, borderRadius: 12,
        backgroundColor: colors.white, elevation: 1,
    },
    searchInput: { fontSize: 14 },
    list: { paddingBottom: 80 },
    row: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 16, paddingVertical: 12,
        borderBottomWidth: 0.5, borderBottomColor: colors.borderLight || '#f0f0f0',
    },
    avatarWrapper: { position: 'relative' },
    groupAvatar: {
        width: 48, height: 48, borderRadius: 24,
        alignItems: 'center', justifyContent: 'center',
    },
    onlineDot: {
        position: 'absolute', bottom: 2, right: 2,
        width: 12, height: 12, borderRadius: 6,
        backgroundColor: '#10B981', borderWidth: 2, borderColor: colors.white,
    },
    textArea: { flex: 1 },
    nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    name: { fontSize: 15, color: colors.text, flex: 1 },
    nameBold: { fontWeight: '700' },
    time: { fontSize: 11, color: colors.textMuted, marginRight: 4 },
    msgRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    lastMsg: { fontSize: 13, color: colors.textSecondary, flex: 1 },
    lastMsgUnread: { fontWeight: '600', color: colors.text },
    badge: {
        backgroundColor: colors.primary, borderRadius: 10,
        minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: 6,
    },
    badgeText: { color: colors.white, fontSize: 11, fontWeight: '700' },
    empty: { alignItems: 'center', marginTop: 80 },
    emptyText: { fontSize: 16, fontWeight: '600', color: colors.textMuted, marginTop: 16 },
    emptySubText: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
});
