import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
// import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '@crm/ui';
import { ArrowLeft, Mail, Phone, Building, MessageSquare, Target } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: customer, isLoading, error } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => apiClient.getCustomer(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !customer?.data) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Customer not found</p>
        <Link to="/customers" className="text-primary hover:underline">
          Back to customers
        </Link>
      </div>
    );
  }

  const customerData = customer.data;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'secondary';
      case 'blocked':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source.toLowerCase()) {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link to="/customers">
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
                      </button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{customerData.name}</h1>
          <p className="text-gray-600">Customer Details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Customer Information</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-2xl font-medium text-white">
                    {customerData.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-semibold">{customerData.name}</h2>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(customerData.status)}`}>
                      {customerData.status}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSourceColor(customerData.source)}`}>
                      {customerData.source}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1">
                    {customerData.email && (
                      <div className="flex items-center text-gray-600">
                        <Mail className="h-4 w-4 mr-2" />
                        {customerData.email}
                      </div>
                    )}
                    {customerData.phone && (
                      <div className="flex items-center text-gray-600">
                        <Phone className="h-4 w-4 mr-2" />
                        {customerData.phone}
                      </div>
                    )}
                    {customerData.company && (
                      <div className="flex items-center text-gray-600">
                        <Building className="h-4 w-4 mr-2" />
                        {customerData.company}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {customerData.tags && customerData.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {customerData.tags.map((tag: string, index: number) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {customerData.notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Notes</h3>
                  <p className="text-gray-600">{customerData.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Messages */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Recent Messages ({customerData._count?.messages || 0})
              </h3>
            </div>
            <div>
              {customerData.messages && customerData.messages.length > 0 ? (
                <div className="space-y-4">
                  {customerData.messages.map((message: any) => (
                    <div
                      key={message.id}
                      className="p-4 border rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${message.direction === 'INBOUND' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                            {message.direction}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{message.platform}</span>
                          {message.sentiment && (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              message.sentiment === 'POSITIVE' ? 'bg-green-100 text-green-800' :
                              message.sentiment === 'NEGATIVE' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {message.sentiment}
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(message.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-900">{message.content}</p>
                      {message.leadScore && (
                        <div className="mt-2 text-sm text-gray-600">
                          Lead Score: {message.leadScore}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No messages yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Statistics</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Messages</span>
                <span className="font-semibold">{customerData._count?.messages || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Leads</span>
                <span className="font-semibold">{customerData._count?.leads || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Member Since</span>
                <span className="font-semibold">
                  {new Date(customerData.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Leads */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Leads ({customerData._count?.leads || 0})
              </h3>
            </div>
            <div>
              {customerData.leads && customerData.leads.length > 0 ? (
                <div className="space-y-3">
                  {customerData.leads.map((lead: any) => (
                    <div key={lead.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{lead.status}</span>
                        <span className="text-sm font-semibold">Score: {lead.score}</span>
                      </div>
                      <p className="text-sm text-gray-600">{lead.source}</p>
                      {lead.notes && (
                        <p className="text-xs text-gray-500 mt-1">{lead.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No leads yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
