import { ApiResponse, PaginatedResponse } from '@crm/types';

const API_BASE_URL = '/api';

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('accessToken');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('accessToken', token);
    } else {
      localStorage.removeItem('accessToken');
    }
  }

  makeHeaders(token?: string | null): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = this.makeHeaders(this.token);

    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, clear it
        this.setToken(null);
        window.location.href = '/login';
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request<ApiResponse<{ user: any; accessToken: string }>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(email: string, name: string, password: string, role?: string) {
    return this.request<ApiResponse<{ user: any; accessToken: string }>>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, name, password, role }),
    });
  }

  async refreshToken() {
    return this.request<ApiResponse<{ accessToken: string }>>('/auth/refresh', {
      method: 'POST',
    });
  }

  async logout() {
    return this.request<ApiResponse>('/auth/logout', {
      method: 'POST',
    });
  }

  async getProfile() {
    return this.request<ApiResponse<any>>('/auth/profile');
  }

  // Customer endpoints
  async getCustomers(params?: Record<string, any>) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }
    const query = searchParams.toString();
    return this.request<PaginatedResponse<any>>(`/customers${query ? `?${query}` : ''}`);
  }

  async getCustomer(id: string) {
    return this.request<ApiResponse<any>>(`/customers/${id}`);
  }

  async createCustomer(data: any) {
    return this.request<ApiResponse<any>>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCustomer(id: string, data: any) {
    return this.request<ApiResponse<any>>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCustomer(id: string) {
    return this.request<ApiResponse>(`/customers/${id}`, {
      method: 'DELETE',
    });
  }

  async getCustomerStats() {
    return this.request<ApiResponse<any>>('/customers/stats');
  }

  // Message endpoints
  async getMessages(params?: Record<string, any>) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }
    const query = searchParams.toString();
    return this.request<PaginatedResponse<any>>(`/messages${query ? `?${query}` : ''}`);
  }

  async getMessage(id: string) {
    return this.request<ApiResponse<any>>(`/messages/${id}`);
  }

  async createMessage(data: any) {
    return this.request<ApiResponse<any>>('/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMessageStats() {
    return this.request<ApiResponse<any>>('/messages/stats');
  }

  // Lead endpoints
  async getLeads(params?: Record<string, any>) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }
    const query = searchParams.toString();
    return this.request<PaginatedResponse<any>>(`/leads${query ? `?${query}` : ''}`);
  }

  async getLead(id: string) {
    return this.request<ApiResponse<any>>(`/leads/${id}`);
  }

  async createLead(data: any) {
    return this.request<ApiResponse<any>>('/leads', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateLead(id: string, data: any) {
    return this.request<ApiResponse<any>>(`/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteLead(id: string) {
    return this.request<ApiResponse>(`/leads/${id}`, {
      method: 'DELETE',
    });
  }

  async getLeadStats() {
    return this.request<ApiResponse<any>>('/leads/stats');
  }

  // Dashboard endpoints
  async getDashboardStats() {
    return this.request<ApiResponse<any>>('/dashboard/stats');
  }

  async getCustomerChart(period?: string) {
    const query = period ? `?period=${period}` : '';
    return this.request<ApiResponse<any>>(`/dashboard/charts/customers${query}`);
  }

  async getMessageChart(period?: string) {
    const query = period ? `?period=${period}` : '';
    return this.request<ApiResponse<any>>(`/dashboard/charts/messages${query}`);
  }

  async getLeadStatusChart() {
    return this.request<ApiResponse<any>>('/dashboard/charts/leads/status');
  }

  async getCustomerSourceChart() {
    return this.request<ApiResponse<any>>('/dashboard/charts/customers/source');
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
