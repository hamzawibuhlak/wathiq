'use client';

import { useEffect, useState, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { chatService } from '@/lib/api/chat';
import { useAuthStore } from '@/lib/stores/authStore';
import type { Conversation, Message } from '@/types';

const POLLING_INTERVAL = 5000; // 5 seconds

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const user = useAuthStore((state) => state.user);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadConversations();
    return () => {
      stopPolling();
    };
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
      startPolling(selectedConversation);
    } else {
      stopPolling();
    }
    return () => stopPolling();
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Stop polling when tab/window is not visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else if (selectedConversation) {
        startPolling(selectedConversation);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [selectedConversation]);

  const loadConversations = async () => {
    try {
      const data = await chatService.getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const data = await chatService.getMessages(conversationId);
      setMessages(data.reverse());
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const startPolling = (conversationId: string) => {
    stopPolling();
    // Only start polling if conversation is selected and page is visible
    if (!document.hidden) {
      pollingIntervalRef.current = setInterval(() => {
        loadMessages(conversationId);
      }, POLLING_INTERVAL);
    }
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || sending) return;

    setSending(true);
    try {
      await chatService.sendMessage({
        conversationId: selectedConversation,
        content: newMessage,
      });
      setNewMessage('');
      await loadMessages(selectedConversation);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find((p) => p.userId !== user?.id)?.user;
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] flex gap-4" dir="rtl">
        {/* Conversations List */}
        <div className="w-80 bg-white rounded-lg shadow overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">المحادثات</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                لا توجد محادثات
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {conversations.map((conversation) => {
                  const otherUser = getOtherParticipant(conversation);
                  return (
                    <button
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation.id)}
                      className={`w-full px-4 py-3 text-right hover:bg-gray-50 transition-colors ${
                        selectedConversation === conversation.id
                          ? 'bg-blue-50'
                          : ''
                      }`}
                    >
                      <div className="font-medium text-gray-900">
                        {otherUser?.name || 'مستخدم'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {otherUser?.role?.name}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 bg-white rounded-lg shadow flex flex-col">
          {selectedConversation ? (
            <>
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  {getOtherParticipant(
                    conversations.find((c) => c.id === selectedConversation)!
                  )?.name || 'محادثة'}
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  يتم تحديث الرسائل تلقائياً كل {POLLING_INTERVAL / 1000} ثوانٍ
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => {
                  const isOwn = message.senderId === user?.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-md px-4 py-2 rounded-lg ${
                          isOwn
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            isOwn ? 'text-blue-100' : 'text-gray-500'
                          }`}
                        >
                          {new Date(message.createdAt).toLocaleTimeString('ar-SA', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <form
                onSubmit={handleSendMessage}
                className="px-6 py-4 border-t border-gray-200"
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="اكتب رسالتك..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {sending ? 'جاري الإرسال...' : 'إرسال'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              اختر محادثة لبدء المراسلة
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
