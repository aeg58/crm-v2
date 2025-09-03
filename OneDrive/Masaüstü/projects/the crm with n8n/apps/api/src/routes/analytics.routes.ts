import { Router } from 'express';
import AnalyticsController from '../controllers/analytics.controller';
import { authenticateToken } from '../middleware/auth';

const router: Router = Router();

// All analytics routes require authentication
router.use(authenticateToken);

// Dashboard metrics
router.get('/dashboard', AnalyticsController.getDashboardMetrics);

// Customer journey
router.get('/customer-journey/:customerId', AnalyticsController.getCustomerJourney);

// Performance metrics
router.get('/performance', AnalyticsController.getPerformanceMetrics);

// Real-time analytics
router.get('/realtime', AnalyticsController.getRealTimeAnalytics);

// Conversion funnel
router.get('/conversion-funnel', AnalyticsController.getConversionFunnel);

// Customer segmentation
router.get('/segmentation', AnalyticsController.getCustomerSegmentation);

// Trend analysis
router.get('/trends', AnalyticsController.getTrendAnalysis);

// Data export
router.get('/export', AnalyticsController.exportData);

export default router;
