import { Router } from 'express';
import { CustomerController } from '../controllers/customer.controller';
import { authenticateToken } from '../middleware/auth';
import {
  validateCreateCustomer,
  validateUpdateCustomer,
  validateId,
  validatePagination,
} from '../middleware/validation';

const router: Router = Router();

// All routes require authentication
router.use(authenticateToken);

// Customer routes
router.get('/', validatePagination, CustomerController.getAll);
router.get('/stats', CustomerController.getStats);
router.get('/:id', validateId, CustomerController.getById);
router.post('/', validateCreateCustomer, CustomerController.create);
router.put('/:id', validateId, validateUpdateCustomer, CustomerController.update);
router.delete('/:id', validateId, CustomerController.delete);

export default router;
