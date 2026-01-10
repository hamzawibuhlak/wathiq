import { apiClient } from './client';
import type { Conversation, Message } from '@/types';

export const chatService = {
  // Conversations
  async getConversations(): Promise<Conversation[]> {
    const response = await apiClient.get<Conversation[]>('/conversations');
    return response.data;
  },

  async getConversation(id: string): Promise<Conversation> {
    const response = await apiClient.get<Conversation>(`/conversations/${id}`);
    return response.data;
  },

  async createConversation(data: {
    participantIds: string[];
    caseId?: string;
  }): Promise<Conversation> {
    const response = await apiClient.post<Conversation>('/conversations', data);
    return response.data;
  },

  // Messages
  async getMessages(conversationId: string, limit = 50): Promise<Message[]> {
    const response = await apiClient.get<Message[]>('/messages', {
      params: { conversationId, limit },
    });
    return response.data;
  },

  async sendMessage(data: {
    conversationId: string;
    content: string;
    file?: File;
  }): Promise<Message> {
    const formData = new FormData();
    formData.append('conversationId', data.conversationId);
    formData.append('content', data.content);
    if (data.file) {
      formData.append('file', data.file);
    }

    const response = await apiClient.post<Message>('/messages', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async markAsRead(messageId: string): Promise<Message> {
    const response = await apiClient.patch<Message>(
      `/messages/${messageId}/read`
    );
    return response.data;
  },

  async getAttachment(messageId: string): Promise<Blob> {
    const response = await apiClient.get(`/messages/${messageId}/attachment`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
