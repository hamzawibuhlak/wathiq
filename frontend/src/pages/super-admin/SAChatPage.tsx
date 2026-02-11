import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { superAdminApi } from '@/api/superAdmin';
import toast from 'react-hot-toast';

export default function SAChatPage() {
    const [selectedRoom, setSelectedRoom] = useState<any>(null);
    const [message, setMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { data: rooms, refetch: refetchRooms } = useQuery({
        queryKey: ['sa-chat-rooms'],
        queryFn: superAdminApi.getChatRooms,
        refetchInterval: 10000,
    });

    const { data: roomDetail, refetch: refetchRoom } = useQuery({
        queryKey: ['sa-chat-room', selectedRoom?.tenantId],
        queryFn: () => superAdminApi.getChatRoom(selectedRoom.tenantId),
        enabled: !!selectedRoom?.tenantId,
        refetchInterval: 5000,
    });

    const sendMsg = useMutation({
        mutationFn: () => superAdminApi.sendMessage(roomDetail?.id || selectedRoom?.id, message),
        onSuccess: () => { setMessage(''); refetchRoom(); refetchRooms(); },
    });

    const markRead = useMutation({
        mutationFn: (roomId: string) => superAdminApi.markRead(roomId),
        onSuccess: () => refetchRooms(),
    });

    const resolve = useMutation({
        mutationFn: (roomId: string) => superAdminApi.resolveRoom(roomId),
        onSuccess: () => { refetchRooms(); refetchRoom(); toast.success('تم إغلاق المحادثة'); },
    });

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [roomDetail?.messages]);

    useEffect(() => {
        if (selectedRoom && roomDetail?.id) {
            markRead.mutate(roomDetail.id);
        }
    }, [selectedRoom, roomDetail?.id]);

    const statusLabels: Record<string, { label: string; color: string }> = {
        OPEN: { label: 'مفتوح', color: '#4ade80' },
        IN_PROGRESS: { label: 'جاري', color: '#fbbf24' },
        RESOLVED: { label: 'مُحل', color: '#64748b' },
        CLOSED: { label: 'مغلق', color: '#475569' },
    };

    const messages = roomDetail?.messages || [];

    return (
        <div style={{ display: 'flex', height: '100%', direction: 'rtl' }}>
            {/* Rooms List */}
            <div style={{
                width: '320px', borderLeft: '1px solid #1e293b', background: '#0f172a',
                display: 'flex', flexDirection: 'column', flexShrink: 0,
            }}>
                <div style={{ padding: '20px 16px', borderBottom: '1px solid #1e293b' }}>
                    <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: 600, margin: 0 }}>💬 المحادثات</h2>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {(rooms || []).map((room: any) => {
                        const isSelected = selectedRoom?.id === room.id;
                        const st = statusLabels[room.status] || statusLabels.OPEN;
                        return (
                            <div key={room.id}
                                onClick={() => setSelectedRoom(room)}
                                style={{
                                    padding: '14px 16px', borderBottom: '1px solid #1e293b',
                                    cursor: 'pointer', transition: 'background 0.15s',
                                    background: isSelected ? '#1e293b' : 'transparent',
                                }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <span style={{ color: '#fff', fontSize: '13px', fontWeight: 500 }}>
                                        {room.tenant?.name || 'مكتب'}
                                    </span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {room.unreadCount > 0 && (
                                            <span style={{
                                                background: '#4f46e5', color: '#fff', fontSize: '11px',
                                                padding: '1px 7px', borderRadius: '10px', fontWeight: 600,
                                            }}>{room.unreadCount}</span>
                                        )}
                                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: st.color }} />
                                    </div>
                                </div>
                                <p style={{ color: '#64748b', fontSize: '12px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {room.messages?.[0]?.content || 'لا توجد رسائل'}
                                </p>
                                {room.lastMessageAt && (
                                    <p style={{ color: '#334155', fontSize: '11px', margin: '4px 0 0' }}>
                                        {new Date(room.lastMessageAt).toLocaleDateString('ar-SA')}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                    {(!rooms || rooms.length === 0) && (
                        <p style={{ color: '#475569', textAlign: 'center', padding: '40px 16px', fontSize: '13px' }}>
                            لا توجد محادثات بعد
                        </p>
                    )}
                </div>
            </div>

            {/* Chat Window */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#020617' }}>
                {selectedRoom ? (
                    <>
                        {/* Header */}
                        <div style={{
                            padding: '16px 20px', borderBottom: '1px solid #1e293b',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                            <div>
                                <p style={{ color: '#fff', fontSize: '15px', fontWeight: 600, margin: 0 }}>
                                    {roomDetail?.tenant?.name || selectedRoom.tenant?.name}
                                </p>
                                <p style={{ color: '#64748b', fontSize: '12px', margin: '2px 0 0' }}>
                                    {roomDetail?.tenant?.slug || selectedRoom.tenant?.slug}
                                </p>
                            </div>
                            {roomDetail?.status !== 'RESOLVED' && roomDetail?.status !== 'CLOSED' && (
                                <button onClick={() => resolve.mutate(roomDetail?.id || selectedRoom.id)}
                                    style={{
                                        padding: '6px 14px', background: 'rgba(34,197,94,0.2)',
                                        border: '1px solid rgba(34,197,94,0.3)', borderRadius: '8px',
                                        color: '#4ade80', fontSize: '12px', cursor: 'pointer',
                                    }}>✅ تم الحل</button>
                            )}
                        </div>

                        {/* Messages */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {messages.map((msg: any) => (
                                <div key={msg.id} style={{
                                    alignSelf: msg.senderType === 'ADMIN' ? 'flex-start' : 'flex-end',
                                    maxWidth: '70%', padding: '10px 14px',
                                    background: msg.senderType === 'ADMIN' ? '#4f46e5' : '#1e293b',
                                    borderRadius: '14px',
                                }}>
                                    <p style={{ color: '#e2e8f0', fontSize: '14px', margin: 0, lineHeight: '1.5' }}>{msg.content}</p>
                                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', margin: '4px 0 0' }}>
                                        {msg.senderName} · {new Date(msg.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div style={{ padding: '16px 20px', borderTop: '1px solid #1e293b', display: 'flex', gap: '10px' }}>
                            <input value={message} onChange={e => setMessage(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && message.trim()) sendMsg.mutate(); }}
                                placeholder="اكتب رسالة..."
                                style={{
                                    flex: 1, padding: '12px 16px', background: '#1e293b',
                                    border: '1px solid #334155', borderRadius: '12px', color: '#fff',
                                    fontSize: '14px', outline: 'none',
                                }}
                            />
                            <button disabled={!message.trim()} onClick={() => sendMsg.mutate()}
                                style={{
                                    padding: '12px 20px', background: '#4f46e5', border: 'none',
                                    borderRadius: '12px', color: '#fff', fontSize: '14px', cursor: 'pointer',
                                    opacity: message.trim() ? 1 : 0.5,
                                }}>إرسال</button>
                        </div>
                    </>
                ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '48px', marginBottom: '12px' }}>💬</p>
                            <p style={{ color: '#475569', fontSize: '15px' }}>اختر محادثة من القائمة</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
