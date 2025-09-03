import { Router } from 'express';
import { MessageController } from '../controllers/message.controller';
import { authenticateToken } from '../middleware/auth';
import {
  validateCreateMessage,
  validateId,
  validatePagination,
} from '../middleware/validation';

const router: Router = Router();

// All routes require authentication
router.use(authenticateToken);

// Message routes
router.get('/', validatePagination, MessageController.getAll);
router.get('/stats', MessageController.getStats);
router.get('/:id', validateId, MessageController.getById);
router.post('/', validateCreateMessage, MessageController.create);
router.put('/:id/analysis', validateId, MessageController.updateAnalysis);
router.delete('/:id', validateId, MessageController.delete);

export default router;
