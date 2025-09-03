import { Request, Response } from 'express';
import { prisma } from '../lib/database';
import { DashboardStats, ChartData } from '@crm/types';

export class DashboardController {
  /**
   * Get dashboard statistics
   */
  static async getStats(req: Request, res: Response): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        totalCustomers,
        totalLeads,
        totalMessages,
        activeLeads,
        messagesToday,
        newCustomersToday,
        avgLeadScore,
        closedWonLeads,
        totalLeadsForConversion,
      ] = await Promise.all([
        prisma.customer.count(),
        prisma.lead.count(),
        prisma.message.count(),
        prisma.lead.count({
          where: {
            status: {
              in: ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION'],
            },
          },
        }),
        prisma.message.count({
          where: {
            createdAt: {
              gte: today,
            },
          },
        }),
        prisma.customer.count({
          where: {
            createdAt: {
              gte: today,
            },
          },
        }),
        prisma.lead.aggregate({
          _avg: {
            score: true,
          },
        }),
        prisma.lead.count({
          where: {
            status: 'CLOSED_WON',
          },
        }),
        prisma.lead.count({
          where: {
            status: {
              in: ['CLOSED_WON', 'CLOSED_LOST'],
            },
          },
        }),
      ]);

      const conversionRate = totalLeadsForConversion > 0 
        ? (closedWonLeads / totalLeadsForConversion) * 100 
        : 0;

      const stats: DashboardStats = {
        totalCustomers,
        totalLeads,
        totalMessages,
        activeLeads,
        conversionRate: Math.round(conversionRate * 100) / 100,
        avgLeadScore: Math.round((avgLeadScore._avg.score || 0) * 100) / 100,
        messagesToday,
        newCustomersToday,
      };

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Get chart data for customers over time
   */
  static async getCustomerChart(req: Request, res: Response): Promise<void> {
    try {
      const { period = '7d' } = req.query;
      
      let daysBack = 7;
      if (period === '30d') daysBack = 30;
      if (period === '90d') daysBack = 90;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);
      startDate.setHours(0, 0, 0, 0);

      const customers = await prisma.customer.findMany({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        select: {
          createdAt: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      // Group by date
      const chartData: ChartData[] = [];
      const dateMap = new Map<string, number>();

      for (let i = 0; i < daysBack; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateKey = date.toISOString().split('T')[0];
        dateMap.set(dateKey, 0);
      }

      customers.forEach(customer => {
        const dateKey = customer.createdAt.toISOString().split('T')[0];
        if (dateMap.has(dateKey)) {
          dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + 1);
        }
      });

      dateMap.forEach((count, date) => {
        chartData.push({
          name: date,
          value: count,
          date,
        });
      });

      res.json({
        success: true,
        data: chartData,
      });
    } catch (error) {
      console.error('Get customer chart error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Get chart data for messages over time
   */
  static async getMessageChart(req: Request, res: Response): Promise<void> {
    try {
      const { period = '7d' } = req.query;
      
      let daysBack = 7;
      if (period === '30d') daysBack = 30;
      if (period === '90d') daysBack = 90;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);
      startDate.setHours(0, 0, 0, 0);

      const messages = await prisma.message.findMany({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        select: {
          createdAt: true,
          direction: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      // Group by date and direction
      const chartData: ChartData[] = [];
      const dateMap = new Map<string, { inbound: number; outbound: number }>();

      for (let i = 0; i < daysBack; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateKey = date.toISOString().split('T')[0];
        dateMap.set(dateKey, { inbound: 0, outbound: 0 });
      }

      messages.forEach(message => {
        const dateKey = message.createdAt.toISOString().split('T')[0];
        if (dateMap.has(dateKey)) {
          const data = dateMap.get(dateKey)!;
          if (message.direction === 'INBOUND') {
            data.inbound++;
          } else {
            data.outbound++;
          }
        }
      });

      dateMap.forEach((data, date) => {
        chartData.push(
          {
            name: `${date} - Inbound`,
            value: data.inbound,
            date,
          },
          {
            name: `${date} - Outbound`,
            value: data.outbound,
            date,
          }
        );
      });

      res.json({
        success: true,
        data: chartData,
      });
    } catch (error) {
      console.error('Get message chart error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Get lead status distribution
   */
  static async getLeadStatusChart(req: Request, res: Response): Promise<void> {
    try {
      const leadStats = await prisma.lead.groupBy({
        by: ['status'],
        _count: {
          id: true,
        },
      });

      const chartData: ChartData[] = leadStats.map(stat => ({
        name: stat.status,
        value: stat._count.id,
      }));

      res.json({
        success: true,
        data: chartData,
      });
    } catch (error) {
      console.error('Get lead status chart error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Get customer source distribution
   */
  static async getCustomerSourceChart(req: Request, res: Response): Promise<void> {
    try {
      const customerStats = await prisma.customer.groupBy({
        by: ['source'],
        _count: {
          id: true,
        },
      });

      const chartData: ChartData[] = customerStats.map(stat => ({
        name: stat.source,
        value: stat._count.id,
      }));

      res.json({
        success: true,
        data: chartData,
      });
    } catch (error) {
      console.error('Get customer source chart error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
}
