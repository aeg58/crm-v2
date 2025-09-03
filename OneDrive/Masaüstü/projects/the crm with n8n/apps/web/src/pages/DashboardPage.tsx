import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@crm/ui';
import { 
  Users, 
  MessageSquare, 
  Target, 
  TrendingUp
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => apiClient.getDashboardStats(),
  });

  const { data: customerChart, isLoading: customerChartLoading } = useQuery({
    queryKey: ['customer-chart'],
    queryFn: () => apiClient.getCustomerChart('7d'),
  });

  const { data: messageChart, isLoading: messageChartLoading } = useQuery({
    queryKey: ['message-chart'],
    queryFn: () => apiClient.getMessageChart('7d'),
  });

  const { data: leadStatusChart, isLoading: leadStatusChartLoading } = useQuery({
    queryKey: ['lead-status-chart'],
    queryFn: () => apiClient.getLeadStatusChart(),
  });

  const { data: customerSourceChart, isLoading: customerSourceChartLoading } = useQuery({
    queryKey: ['customer-source-chart'],
    queryFn: () => apiClient.getCustomerSourceChart(),
  });

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const dashboardStats = stats?.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's what's happening with your CRM.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Total Customers</h3>
            <Users className="h-4 w-4 text-gray-400" />
          </div>
          <div>
            <div className="text-2xl font-bold">{dashboardStats?.totalCustomers || 0}</div>
            <p className="text-xs text-gray-500">
              +{dashboardStats?.newCustomersToday || 0} from yesterday
            </p>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Active Leads</h3>
            <Target className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <div className="text-2xl font-bold">{dashboardStats?.activeLeads || 0}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats?.totalLeads || 0} total leads
            </p>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Messages Today</h3>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <div className="text-2xl font-bold">{dashboardStats?.messagesToday || 0}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats?.totalMessages || 0} total messages
            </p>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Conversion Rate</h3>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <div className="text-2xl font-bold">{dashboardStats?.conversionRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Avg lead score: {dashboardStats?.avgLeadScore || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Growth Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <div>
            <h3>Customer Growth (7 days)</h3>
            <p className="text-sm text-gray-600">New customers added over the past week</p>
          </div>
          <div>
            {customerChartLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={customerChart?.data || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Message Activity Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <div>
            <h3>Message Activity (7 days)</h3>
            <p className="text-sm text-gray-600">Inbound vs outbound messages</p>
          </div>
          <div>
            {messageChartLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={messageChart?.data || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Lead Status Distribution */}
        <div className="bg-white shadow rounded-lg p-6">
          <div>
            <h3>Lead Status Distribution</h3>
            <p className="text-sm text-gray-600">Current status of all leads</p>
          </div>
          <div>
            {leadStatusChartLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={leadStatusChart?.data || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {(leadStatusChart?.data || []).map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Customer Source Distribution */}
        <div className="bg-white shadow rounded-lg p-6">
          <div>
            <h3>Customer Sources</h3>
            <p className="text-sm text-gray-600">Where customers are coming from</p>
          </div>
          <div>
            {customerSourceChartLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={customerSourceChart?.data || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {(customerSourceChart?.data || []).map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
