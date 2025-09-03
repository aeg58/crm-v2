import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticateToken } from '../middleware/auth';

const router: Router = Router();

// All routes require authentication
router.use(authenticateToken);

// Dashboard routes
router.get('/stats', DashboardController.getStats);
router.get('/charts/customers', DashboardController.getCustomerChart);
router.get('/charts/messages', DashboardController.getMessageChart);
router.get('/charts/leads/status', DashboardController.getLeadStatusChart);
router.get('/charts/customers/source', DashboardController.getCustomerSourceChart);

export default router;
