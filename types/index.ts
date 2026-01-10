// User & Auth Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  roleId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

// Case Types
export interface Case {
  id: string;
  title: string;
  description?: string;
  status: string;
  clientId: string;
  client?: Client;
  documents?: Document[];
  appointments?: Appointment[];
  tasks?: Task[];
  invoices?: Invoice[];
  createdAt: string;
  updatedAt: string;
}

// Client Types
export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  cases?: Case[];
  invoices?: Invoice[];
  createdAt: string;
  updatedAt: string;
}

// Document Types
export interface Document {
  id: string;
  name: string;
  path: string;
  caseId: string;
  createdAt: string;
}

// Appointment Types
export interface Appointment {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  caseId: string;
  createdAt: string;
}

// Task Types
export interface Task {
  id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  dueDate?: string;
  caseId: string;
  assigneeId: string;
  assignee?: User;
  createdAt: string;
}

// Invoice Types
export interface Invoice {
  id: string;
  amount: number;
  status: string;
  clientId: string;
  client?: Client;
  caseId: string;
  case?: Case;
  createdAt: string;
  updatedAt: string;
}

// Chat Types
export interface Conversation {
  id: string;
  caseId?: string;
  case?: Case;
  participants: ConversationParticipant[];
  messages?: Message[];
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationParticipant {
  conversationId: string;
  userId: string;
  user: User;
  joinedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender: User;
  content: string;
  attachmentPath?: string;
  readAt?: string;
  deletedAt?: string;
  createdAt: string;
}

// API Response Types
export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
}
