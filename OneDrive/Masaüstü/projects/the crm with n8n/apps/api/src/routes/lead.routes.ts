import { Router } from 'express';
import { LeadController } from '../controllers/lead.controller';
import { authenticateToken } from '../middleware/auth';
import {
  validateCreateLead,
  validateUpdateLead,
  validateId,
  validatePagination,
} from '../middleware/validation';

const router: Router = Router();

// All routes require authentication
router.use(authenticateToken);

// Lead routes
router.get('/', validatePagination, LeadController.getAll);
router.get('/stats', LeadController.getStats);
router.get('/:id', validateId, LeadController.getById);
router.post('/', validateCreateLead, LeadController.create);
router.put('/:id', validateId, validateUpdateLead, LeadController.update);
router.delete('/:id', validateId, LeadController.delete);

export default router;
