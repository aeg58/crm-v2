// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
  role?: 'ADMIN' | 'USER';
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  accessToken: string;
}

// Customer types
export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  source: 'WHATSAPP' | 'INSTAGRAM' | 'MANUAL' | 'OTHER';
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  tags: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCustomerInput {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  source: 'WHATSAPP' | 'INSTAGRAM' | 'MANUAL' | 'OTHER';
  tags?: string[];
  notes?: string;
}

export interface UpdateCustomerInput {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  tags?: string[];
  notes?: string;
}

// Message types
export interface Message {
  id: string;
  customerId: string;
  content: string;
  direction: 'INBOUND' | 'OUTBOUND';
  platform: 'WHATSAPP' | 'INSTAGRAM' | 'MANUAL';
  sentiment?: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  leadScore?: number;
  intent?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  customer?: Customer;
}

export interface CreateMessageInput {
  customerId: string;
  content: string;
  direction: 'INBOUND' | 'OUTBOUND';
  platform: 'WHATSAPP' | 'INSTAGRAM' | 'MANUAL';
  metadata?: Record<string, any>;
}

// Lead types
export interface Lead {
  id: string;
  customerId: string;
  score: number;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'CLOSED_WON' | 'CLOSED_LOST';
  source: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  customer?: Customer;
}

export interface CreateLeadInput {
  customerId: string;
  score: number;
  status?: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'CLOSED_WON' | 'CLOSED_LOST';
  source: string;
  notes?: string;
}

export interface UpdateLeadInput {
  score?: number;
  status?: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'CLOSED_WON' | 'CLOSED_LOST';
  notes?: string;
}

// AI Analysis types
export interface TextAnalysis {
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  score: number;
  intent: string;
  tags: string[];
}

// Webhook types
export interface N8NWebhookPayload {
  platform: 'WHATSAPP' | 'INSTAGRAM';
  customer: {
    id?: string;
    name: string;
    phone?: string;
    email?: string;
  };
  message: {
    content: string;
    direction: 'INBOUND' | 'OUTBOUND';
    timestamp: string;
    metadata?: Record<string, any>;
  };
}

// Dashboard types
export interface DashboardStats {
  totalCustomers: number;
  totalLeads: number;
  totalMessages: number;
  activeLeads: number;
  conversionRate: number;
  avgLeadScore: number;
  messagesToday: number;
  newCustomersToday: number;
}

export interface ChartData {
  name: string;
  value: number;
  date?: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Socket.io types
export interface SocketEvents {
  'message:new': (message: Message) => void;
  'customer:new': (customer: Customer) => void;
  'lead:update': (lead: Lead) => void;
  'dashboard:stats': (stats: DashboardStats) => void;
}

// Query types
export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface CustomerQuery extends PaginationQuery {
  search?: string;
  status?: string;
  source?: string;
  tags?: string[];
}

export interface MessageQuery extends PaginationQuery {
  customerId?: string;
  platform?: string;
  direction?: string;
  sentiment?: string;
}

export interface LeadQuery extends PaginationQuery {
  status?: string;
  minScore?: number;
  maxScore?: number;
}
