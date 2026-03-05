import React, { useState, useRef, useEffect } from 'react';
import {
    View, StyleSheet, FlatList, KeyboardAvoidingView, Platform,
    TouchableOpacity, TextInput as RNTextInput,
} from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/Feather';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../services/api.service';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../theme/colors';
import { getInitials } from '../../utils/formatters';

export function ChatConversationScreen({ route }: any) {
    const { id, name } = route.params || {};
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const [message, setMessage] = useState('');
    const flatListRef = useRef<FlatList>(null);

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['chat-messages', id],
        queryFn: () => apiService.get(`/chat/conversations/${id}/messages`).then((r: any) => r.data || []),
        refetchInterval: 5000,
    });

    const messages = Array.isArray(data) ? data : [];

    const sendMutation = useMutation({
        mutationFn: (content: string) =>
            apiService.post(`/chat/conversations/${id}/messages`, { content }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chat-messages', id] });
            queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
            setMessage('');
        },
    });

    const handleSend = () => {
        const text = message.trim();
        if (!text) return;
        sendMutation.mutate(text);
    };

    const renderMessage = ({ item }: any) => {
        const isMe = item.senderId === user?.id || item.sender?.id === user?.id;
        return (
            <View style={[styles.msgWrapper, isMe ? styles.msgRight : styles.msgLeft]}>
                {!isMe && (
                    <Avatar.Text
                        size={28}
                        label={getInitials(item.sender?.name || 'م')}
                        style={{ backgroundColor: '#8B5CF6' }}
                    />
                )}
                <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
                    {!isMe && <Text style={styles.senderName}>{item.sender?.name || 'مستخدم'}</Text>}
                    <Text style={[styles.msgText, isMe && { color: '#fff' }]}>
                        {item.content}
                    </Text>
                    <Text style={[styles.msgTime, isMe && { color: '#ffffff99' }]}>
                        {new Date(item.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={90}
        >
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={renderMessage}
                contentContainerStyle={styles.list}
                inverted={false}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Icon name="message-circle" size={48} color={colors.textMuted} />
                        <Text style={styles.emptyText}>لا توجد رسائل بعد</Text>
                        <Text style={styles.emptySubText}>ابدأ المحادثة بإرسال رسالة</Text>
                    </View>
                }
            />

            <View style={styles.inputBar}>
                <RNTextInput
                    style={styles.input}
                    placeholder="اكتب رسالة..."
                    placeholderTextColor={colors.textMuted}
                    value={message}
                    onChangeText={setMessage}
                    multiline
                    textAlign="right"
                />
                <TouchableOpacity
                    style={[styles.sendBtn, !message.trim() && { opacity: 0.4 }]}
                    onPress={handleSend}
                    disabled={!message.trim() || sendMutation.isPending}
                >
                    <Icon name="send" size={20} color="#fff" />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    list: { padding: 16, paddingBottom: 8 },
    msgWrapper: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 12 },
    msgRight: { justifyContent: 'flex-end' },
    msgLeft: { justifyContent: 'flex-start' },
    bubble: { maxWidth: '75%', borderRadius: 16, padding: 12 },
    bubbleMe: { backgroundColor: colors.primary, borderBottomLeftRadius: 4 },
    bubbleOther: { backgroundColor: colors.white, borderBottomRightRadius: 4 },
    senderName: { fontSize: 11, fontWeight: '600', color: colors.primary, marginBottom: 4 },
    msgText: { fontSize: 14, color: colors.text, lineHeight: 20 },
    msgTime: { fontSize: 10, color: colors.textMuted, marginTop: 4, textAlign: 'left' },
    empty: { alignItems: 'center', marginTop: 80 },
    emptyText: { fontSize: 16, fontWeight: '600', color: colors.textMuted, marginTop: 16 },
    emptySubText: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
    inputBar: {
        flexDirection: 'row', alignItems: 'flex-end', gap: 8,
        padding: 12, paddingBottom: Platform.OS === 'ios' ? 28 : 12,
        backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: '#f0f0f0',
    },
    input: {
        flex: 1, backgroundColor: '#F3F4F6', borderRadius: 20,
        paddingHorizontal: 16, paddingVertical: 10, fontSize: 14,
        maxHeight: 100, color: colors.text,
    },
    sendBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: colors.primary,
        alignItems: 'center', justifyContent: 'center',
    },
});
