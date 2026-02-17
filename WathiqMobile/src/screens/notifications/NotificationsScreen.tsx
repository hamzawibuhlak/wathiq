import React from 'react';
import {
    View, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
} from 'react-native';
import { Text, Surface } from 'react-native-paper';
import Icon from 'react-native-vector-icons/Feather';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../services/api.service';
import { colors } from '../../theme/colors';

const TYPE_CONFIG: Record<string, { icon: string; color: string }> = {
    CASE_UPDATE: { icon: 'briefcase', color: '#4F46E5' },
    HEARING_REMINDER: { icon: 'calendar', color: '#F59E0B' },
    TASK_ASSIGNED: { icon: 'check-square', color: '#10B981' },
    INVOICE_PAID: { icon: 'credit-card', color: '#8B5CF6' },
    DOCUMENT_UPLOADED: { icon: 'file', color: '#06B6D4' },
    MESSAGE: { icon: 'message-circle', color: '#EC4899' },
    SYSTEM: { icon: 'bell', color: '#6B7280' },
};

function timeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'الآن';
    if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
    if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
    if (diff < 604800) return `منذ ${Math.floor(diff / 86400)} يوم`;
    return new Date(dateStr).toLocaleDateString('ar-SA');
}

export function NotificationsScreen() {
    const queryClient = useQueryClient();

    const { data, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['notifications'],
        queryFn: () => apiService.get('/notifications').then((r: any) => r.data?.data || r.data || []),
    });

    const notifications = Array.isArray(data) ? data : [];

    const markAsRead = useMutation({
        mutationFn: (id: string) => apiService.patch(`/notifications/${id}/read`, {}),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    });

    const markAllRead = useMutation({
        mutationFn: () => apiService.patch('/notifications/read-all', {}),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    });

    const unreadCount = notifications.filter((n: any) => !n.isRead && !n.readAt).length;

    const renderItem = ({ item }: any) => {
        const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.SYSTEM;
        const isUnread = !item.isRead && !item.readAt;

        return (
            <TouchableOpacity onPress={() => !item.isRead && markAsRead.mutate(item.id)}>
                <Surface style={[styles.card, isUnread && styles.cardUnread]} elevation={isUnread ? 2 : 1}>
                    <View style={[styles.iconBox, { backgroundColor: `${config.color}15` }]}>
                        <Icon name={config.icon} size={20} color={config.color} />
                    </View>
                    <View style={styles.textArea}>
                        <Text style={[styles.title, isUnread && styles.titleUnread]} numberOfLines={2}>
                            {item.title || item.message}
                        </Text>
                        {item.body && item.body !== item.title && (
                            <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
                        )}
                        <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
                    </View>
                    {isUnread && <View style={styles.unreadDot} />}
                </Surface>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header Actions */}
            {unreadCount > 0 && (
                <TouchableOpacity
                    style={styles.markAllBtn}
                    onPress={() => markAllRead.mutate()}
                >
                    <Icon name="check-circle" size={16} color={colors.primary} />
                    <Text style={styles.markAllText}>تعيين الكل كمقروء ({unreadCount})</Text>
                </TouchableOpacity>
            )}

            <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={isLoading || isRefetching} onRefresh={refetch} />}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Icon name="bell-off" size={48} color={colors.textMuted} />
                        <Text style={styles.emptyText}>لا توجد إشعارات</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    markAllBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 20, paddingVertical: 12,
        backgroundColor: colors.primaryLight || '#EEF0FF',
    },
    markAllText: { fontSize: 13, fontWeight: '600', color: colors.primary },
    list: { paddingHorizontal: 16, paddingVertical: 8, paddingBottom: 80 },
    card: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 14, padding: 14, marginBottom: 8,
        backgroundColor: colors.white,
    },
    cardUnread: {
        backgroundColor: '#FAFBFF',
        borderLeftWidth: 3, borderLeftColor: colors.primary,
    },
    iconBox: {
        width: 44, height: 44, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center', marginLeft: 12,
    },
    textArea: { flex: 1 },
    title: { fontSize: 14, color: colors.text, marginBottom: 2 },
    titleUnread: { fontWeight: '700' },
    body: { fontSize: 12, color: colors.textSecondary, marginBottom: 4, lineHeight: 18 },
    time: { fontSize: 11, color: colors.textMuted },
    unreadDot: {
        width: 8, height: 8, borderRadius: 4,
        backgroundColor: colors.primary, marginRight: 4,
    },
    empty: { alignItems: 'center', marginTop: 80 },
    emptyText: { fontSize: 14, color: colors.textMuted, marginTop: 12 },
});
