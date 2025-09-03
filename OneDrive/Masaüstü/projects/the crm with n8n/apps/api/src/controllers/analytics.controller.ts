import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../lib/analytics';
import { catchAsync } from '../lib/errors';
import { CacheService, CacheKeys } from '../lib/redis';

export class AnalyticsController {
  private cache: CacheService;

  constructor() {
    this.cache = CacheService.getInstance();
  }

  // Get comprehensive dashboard metrics
  getDashboardMetrics = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const { period = '7d' } = req.query;
    const userId = req.user?.id;

    const metrics = await analyticsService.getDashboardMetrics(userId, period as string);

    res.json({
      success: true,
      data: metrics
    });
  });

  // Get customer journey analytics
  getCustomerJourney = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { customerId } = req.params;

    const journey = await analyticsService.getCustomerJourney(customerId);

    res.json({
      success: true,
      data: journey
    });
  });

  // Get performance metrics
  getPerformanceMetrics = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { period = '7d' } = req.query;

    const metrics = await analyticsService.getPerformanceMetrics(period as string);

    res.json({
      success: true,
      data: metrics
    });
  });

  // Export data
  exportData = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { type, format = 'json' } = req.query;

    if (!type || !['customers', 'leads', 'messages'].includes(type as 'customers' | 'leads' | 'messages')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid export type. Must be customers, leads, or messages'
      });
    }

    const data = await analyticsService.exportData(type as 'customers' | 'leads' | 'messages', format as 'csv' | 'json');

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}_export.csv"`);
      res.send(data);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${type}_export.json"`);
      res.json(JSON.parse(data));
    }
  });

  // Get real-time analytics
  getRealTimeAnalytics = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const cacheKey = 'realtime_analytics';
    
    // Try cache first (1 minute TTL)
    let analytics = await this.cache.get(cacheKey);
    
    if (!analytics) {
      // Calculate real-time metrics
      const now = new Date();
      const lastHour = new Date(now.getTime() - 60 * 60 * 1000);
      
      // This would typically involve more complex real-time calculations
      analytics = {
        activeUsers: Math.floor(Math.random() * 50) + 10, // Placeholder
        messagesLastHour: Math.floor(Math.random() * 100) + 20,
        newLeadsLastHour: Math.floor(Math.random() * 10) + 2,
        averageResponseTime: Math.floor(Math.random() * 300) + 60,
        timestamp: now.toISOString()
      };

      // Cache for 1 minute
      await this.cache.set(cacheKey, analytics, 60);
    }

    res.json({
      success: true,
      data: analytics
    });
  });

  // Get conversion funnel
  getConversionFunnel = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { period = '30d' } = req.query;
    const cacheKey = `conversion_funnel:${period}`;
    
    let funnel = await this.cache.get(cacheKey);
    
    if (!funnel) {
      // Calculate conversion funnel
      funnel = {
        visitors: 1000, // Placeholder
        leads: 150,
        qualified: 75,
        proposals: 30,
        closed: 12,
        conversionRates: {
          visitorToLead: 15,
          leadToQualified: 50,
          qualifiedToProposal: 40,
          proposalToClosed: 40,
          overallConversion: 1.2
        }
      };

      // Cache for 10 minutes
      await this.cache.set(cacheKey, funnel, 600);
    }

    res.json({
      success: true,
      data: funnel
    });
  });

  // Get customer segmentation
  getCustomerSegmentation = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const cacheKey = 'customer_segmentation';
    
    let segmentation = await this.cache.get(cacheKey);
    
    if (!segmentation) {
      segmentation = {
        bySource: {
          whatsapp: 45,
          instagram: 30,
          manual: 20,
          other: 5
        },
        byStatus: {
          active: 70,
          inactive: 25,
          blocked: 5
        },
        byValue: {
          high: 15,
          medium: 35,
          low: 50
        },
        byEngagement: {
          high: 20,
          medium: 40,
          low: 40
        }
      };

      // Cache for 30 minutes
      await this.cache.set(cacheKey, segmentation, 1800);
    }

    res.json({
      success: true,
      data: segmentation
    });
  });

  // Get trend analysis
  getTrendAnalysis = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { metric, period = '30d' } = req.query;
    const cacheKey = `trend_analysis:${metric}:${period}`;
    
    let trends = await this.cache.get(cacheKey);
    
    if (!trends) {
      // Generate trend data (placeholder)
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const data = Array.from({ length: days }, (_, i) => ({
        date: new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        value: Math.floor(Math.random() * 100) + 50
      }));

      trends = {
        metric,
        period,
        data,
        trend: Math.random() > 0.5 ? 'up' : 'down',
        change: Math.floor(Math.random() * 20) + 5
      };

      // Cache for 15 minutes
      await this.cache.set(cacheKey, trends, 900);
    }

    res.json({
      success: true,
      data: trends
    });
  });
}

export default new AnalyticsController();
