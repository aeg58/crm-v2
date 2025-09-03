import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
// import { Button, Input, Card, CardContent, CardHeader, CardTitle, Badge } from '@crm/ui';
import { Search, MessageSquare, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export default function MessagesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');
  const limit = 20;

  const { data, isLoading, error } = useQuery({
    queryKey: ['messages', { search, page, limit, filter }],
    queryFn: () => apiClient.getMessages({ search, page, limit, ...(filter && { direction: filter }) }),
  });

  const messages = data?.data || [];
  const pagination = data?.pagination;

  const getDirectionIcon = (direction: string) => {
    return direction === 'INBOUND' ? (
      <ArrowDownLeft className="h-4 w-4" />
    ) : (
      <ArrowUpRight className="h-4 w-4" />
    );
  };

  const getDirectionColor = (direction: string) => {
    return direction === 'INBOUND' ? 'default' : 'secondary';
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive':
        return 'success';
      case 'negative':
        return 'destructive';
      case 'neutral':
        return 'default';
      default:
        return 'outline';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform?.toLowerCase()) {
      case 'whatsapp':
        return 'success';
      case 'instagram':
        return 'warning';
      case 'manual':
        return 'default';
      default:
        return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading messages: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600 mt-2">View and manage customer conversations</p>
        </div>
      </div>

      {/* Search and Filters */}
              <div className="bg-white shadow rounded-lg p-6">
                  <div className="mb-4">
            <h3 className="text-lg font-semibold">Search & Filter</h3>
                  </div>
                  <div>
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  placeholder="Search messages..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Messages</option>
                <option value="inbound">Inbound</option>
                <option value="outbound">Outbound</option>
              </select>
            </div>
          </div>
                  </div>
              </div>

      {/* Messages List */}
              <div className="bg-white shadow rounded-lg p-6">
                  <div className="mb-4">
            <h3 className="text-lg font-semibold">All Messages ({pagination?.total || 0})</h3>
                  </div>
                  <div>
          <div className="space-y-4">
            {messages.map((message: any) => (
              <div
                key={message.id}
                className="p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="flex items-center space-x-1">
                        {getDirectionIcon(message.direction)}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDirectionColor(message.direction)}`}>
                          {message.direction}
                        </span>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPlatformColor(message.platform)}`}>
                        {message.platform}
                      </span>
                      {message.sentiment && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSentimentColor(message.sentiment)}`}>
                          {message.sentiment}
                        </span>
                      )}
                      {message.leadScore && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Score: {message.leadScore}
                        </span>
                      )}
                    </div>
                    
                    <div className="mb-2">
                      <p className="text-gray-900">{message.content}</p>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          {message.customer?.name || 'Unknown Customer'}
                        </div>
                        {message.customer?.email && (
                          <span>{message.customer.email}</span>
                        )}
                        {message.customer?.phone && (
                          <span>{message.customer.phone}</span>
                        )}
                      </div>
                      <span>
                        {new Date(message.createdAt).toLocaleString()}
                      </span>
                    </div>

                    {message.intent && (
                      <div className="mt-2 text-sm text-gray-600">
                        <strong>Intent:</strong> {message.intent}
                      </div>
                    )}

                    {message.tags && message.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {message.tags.map((tag: string, index: number) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} results
              </div>
              <div className="flex space-x-2">
                <button
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </button>
                <button
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setPage(page + 1)}
                  disabled={page === pagination.totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          )}
                  </div>
              </div>
    </div>
  );
}
