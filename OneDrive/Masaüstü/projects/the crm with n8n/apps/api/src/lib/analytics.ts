import { prisma } from './database';
import { CacheService, CacheKeys } from './redis';
import { performance } from 'perf_hooks';

// Analytics Service Class
export class AnalyticsService {
  private cache: CacheService;

  constructor() {
    this.cache = CacheService.getInstance();
  }

  // Dashboard Metrics
  async getDashboardMetrics(userId: string, period: string = '7d'): Promise<DashboardMetrics> {
    const cacheKey = CacheKeys.dashboard(userId, period);
    
    // Try cache first
    const cached = await this.cache.get<DashboardMetrics>(cacheKey);
    if (cached) return cached;

    const start = performance.now();
    
    try {
      const [conversionRate, avgResponseTime, customerLTV, churnRate, leadQuality] = await Promise.all([
        this.calculateConversionRate(period),
        this.calculateAverageResponseTime(period),
        this.calculateCustomerLifetimeValue(period),
        this.calculateChurnRate(period),
        this.getLeadQualityBreakdown(period)
      ]);

      const metrics: DashboardMetrics = {
        conversionRate,
        averageResponseTime: avgResponseTime,
        customerLifetimeValue: customerLTV,
        churnRate,
        leadQuality,
        totalCustomers: await this.getTotalCustomers(),
        totalLeads: await this.getTotalLeads(),
        totalMessages: await this.getTotalMessages(period),
        revenue: await this.calculateRevenue(period)
      };

      // Cache for 5 minutes
      await this.cache.set(cacheKey, metrics, 300);
      
      const duration = performance.now() - start;
      console.log(`Dashboard metrics calculated in ${duration.toFixed(2)}ms`);
      
      return metrics;
    } catch (error) {
      console.error('Error calculating dashboard metrics:', error);
      throw error;
    }
  }

  // Conversion Rate
  private async calculateConversionRate(period: string): Promise<number> {
    const dateFilter = this.getDateFilter(period);
    
    const [totalLeads, convertedLeads] = await Promise.all([
      prisma.lead.count({
        where: {
          createdAt: dateFilter
        }
      }),
      prisma.lead.count({
        where: {
          createdAt: dateFilter,
          status: 'CLOSED_WON'
        }
      })
    ]);

    return totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
  }

  // Average Response Time
  private async calculateAverageResponseTime(period: string): Promise<number> {
    const dateFilter = this.getDateFilter(period);
    
    const messages = await prisma.message.findMany({
      where: {
        createdAt: dateFilter,
        direction: 'INBOUND'
      },
      orderBy: { createdAt: 'asc' },
      include: { customer: true }
    });

    let totalResponseTime = 0;
    let responseCount = 0;

    for (let i = 0; i < messages.length - 1; i++) {
      const currentMessage = messages[i];
      const nextMessage = messages[i + 1];

      if (currentMessage.direction === 'INBOUND' && nextMessage.direction === 'OUTBOUND' &&
          currentMessage.customerId === nextMessage.customerId) {
        const responseTime = nextMessage.createdAt.getTime() - currentMessage.createdAt.getTime();
        totalResponseTime += responseTime;
        responseCount++;
      }
    }

    return responseCount > 0 ? totalResponseTime / responseCount : 0;
  }

  // Customer Lifetime Value
  private async calculateCustomerLifetimeValue(period: string): Promise<number> {
    const dateFilter = this.getDateFilter(period);
    
    const customers = await prisma.customer.findMany({
      where: {
        createdAt: dateFilter
      },
      include: {
        leads: {
          where: { status: 'CLOSED_WON' }
        }
      }
    });

    const totalValue = customers.reduce((sum, customer) => {
      return sum + customer.leads.reduce((leadSum, lead) => leadSum + (lead.score || 0), 0);
    }, 0);

    return customers.length > 0 ? totalValue / customers.length : 0;
  }

  // Churn Rate
  private async calculateChurnRate(period: string): Promise<number> {
    const dateFilter = this.getDateFilter(period);
    const previousPeriodFilter = this.getPreviousPeriodFilter(period);
    
    const [currentCustomers, previousCustomers] = await Promise.all([
      prisma.customer.count({
        where: { createdAt: dateFilter }
      }),
      prisma.customer.count({
        where: { createdAt: previousPeriodFilter }
      })
    ]);

    return previousCustomers > 0 ? ((previousCustomers - currentCustomers) / previousCustomers) * 100 : 0;
  }

  // Lead Quality Breakdown
  private async getLeadQualityBreakdown(period: string): Promise<LeadQuality> {
    const dateFilter = this.getDateFilter(period);
    
    const leads = await prisma.lead.findMany({
      where: { createdAt: dateFilter }
    });

    const hot = leads.filter(lead => (lead.score || 0) >= 80).length;
    const warm = leads.filter(lead => (lead.score || 0) >= 60 && (lead.score || 0) < 80).length;
    const cold = leads.filter(lead => (lead.score || 0) < 60).length;

    return { hot, warm, cold };
  }

  // Revenue Calculation
  private async calculateRevenue(period: string): Promise<number> {
    const dateFilter = this.getDateFilter(period);
    
    const leads = await prisma.lead.findMany({
      where: {
        createdAt: dateFilter,
        status: 'CLOSED_WON'
      }
    });

    return leads.reduce((sum, lead) => sum + (lead.score || 0), 0);
  }

  // Total Counts
  private async getTotalCustomers(): Promise<number> {
    return prisma.customer.count();
  }

  private async getTotalLeads(): Promise<number> {
    return prisma.lead.count();
  }

  private async getTotalMessages(period: string): Promise<number> {
    const dateFilter = this.getDateFilter(period);
    return prisma.message.count({
      where: { createdAt: dateFilter }
    });
  }

  // Advanced Analytics
  async getCustomerJourney(customerId: string): Promise<CustomerJourney> {
    const cacheKey = `customer_journey:${customerId}`;
    const cached = await this.cache.get<CustomerJourney>(cacheKey);
    if (cached) return cached;

    const [customer, messages, leads] = await Promise.all([
      prisma.customer.findUnique({
        where: { id: customerId }
      }),
      prisma.message.findMany({
        where: { customerId },
        orderBy: { createdAt: 'asc' }
      }),
      prisma.lead.findMany({
        where: { customerId },
        orderBy: { createdAt: 'asc' }
      })
    ]);

    const journey: CustomerJourney = {
      customer,
      touchpoints: messages.map(msg => ({
        type: 'message',
        timestamp: msg.createdAt,
        data: msg
      })),
      leadProgression: leads.map(lead => ({
        type: 'lead',
        timestamp: lead.createdAt,
        data: lead
      })),
      totalInteractions: messages.length,
      averageResponseTime: this.calculateAverageResponseTimeForCustomer(messages),
      sentimentTrend: this.calculateSentimentTrend(messages)
    };

    await this.cache.set(cacheKey, journey, 600); // Cache for 10 minutes
    return journey;
  }

  // Performance Analytics
  async getPerformanceMetrics(period: string): Promise<PerformanceMetrics> {
    const dateFilter = this.getDateFilter(period);
    
    const [responseTimeStats, messageVolume, peakHours] = await Promise.all([
      this.getResponseTimeStats(dateFilter),
      this.getMessageVolume(dateFilter),
      this.getPeakHours(dateFilter)
    ]);

    return {
      responseTimeStats,
      messageVolume,
      peakHours,
      agentPerformance: await this.getAgentPerformance(dateFilter)
    };
  }

  // Export Data
  async exportData(type: 'customers' | 'leads' | 'messages', format: 'csv' | 'json'): Promise<string> {
    let data: any[] = [];

    switch (type) {
      case 'customers':
        data = await prisma.customer.findMany({
          include: {
            messages: true,
            leads: true
          }
        });
        break;
      case 'leads':
        data = await prisma.lead.findMany({
          include: {
            customer: true
          }
        });
        break;
      case 'messages':
        data = await prisma.message.findMany({
          include: {
            customer: true
          }
        });
        break;
    }

    if (format === 'csv') {
      return this.convertToCSV(data);
    } else {
      return JSON.stringify(data, null, 2);
    }
  }

  // Helper Methods
  private getDateFilter(period: string) {
    const now = new Date();
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    return {
      gte: new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    };
  }

  private getPreviousPeriodFilter(period: string) {
    const now = new Date();
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const start = new Date(now.getTime() - days * 2 * 24 * 60 * 60 * 1000);
    const end = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return {
      gte: start,
      lt: end
    };
  }

  private calculateAverageResponseTimeForCustomer(messages: any[]): number {
    // Implementation for calculating average response time
    return 0; // Placeholder
  }

  private calculateSentimentTrend(messages: any[]): any[] {
    // Implementation for calculating sentiment trend
    return []; // Placeholder
  }

  private async getResponseTimeStats(dateFilter: any): Promise<any> {
    // Implementation for response time statistics
    return {}; // Placeholder
  }

  private async getMessageVolume(dateFilter: any): Promise<any> {
    // Implementation for message volume analysis
    return {}; // Placeholder
  }

  private async getPeakHours(dateFilter: any): Promise<any> {
    // Implementation for peak hours analysis
    return {}; // Placeholder
  }

  private async getAgentPerformance(dateFilter: any): Promise<any> {
    // Implementation for agent performance metrics
    return {}; // Placeholder
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        return typeof value === 'string' ? `"${value}"` : value;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  }
}

// Type Definitions
export interface DashboardMetrics {
  conversionRate: number;
  averageResponseTime: number;
  customerLifetimeValue: number;
  churnRate: number;
  leadQuality: LeadQuality;
  totalCustomers: number;
  totalLeads: number;
  totalMessages: number;
  revenue: number;
}

export interface LeadQuality {
  hot: number;
  warm: number;
  cold: number;
}

export interface CustomerJourney {
  customer: any;
  touchpoints: any[];
  leadProgression: any[];
  totalInteractions: number;
  averageResponseTime: number;
  sentimentTrend: any[];
}

export interface PerformanceMetrics {
  responseTimeStats: any;
  messageVolume: any;
  peakHours: any;
  agentPerformance: any;
}

// Analytics Service Instance
export const analyticsService = new AnalyticsService();
