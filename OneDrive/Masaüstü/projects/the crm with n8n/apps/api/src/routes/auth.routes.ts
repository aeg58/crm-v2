import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth';
import {
  validateRegister,
  validateLogin,
} from '../middleware/validation';

const router: Router = Router();

// Public routes
router.post('/register', (req, res, next) => {
  if (process.env.ALLOW_SIGNUP !== "true") {
    return res.status(403).json({ message: "Signups disabled" });
  }
  next();
}, validateRegister, AuthController.register);
router.post('/login', validateLogin, AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);

// Protected routes
router.get('/profile', authenticateToken, AuthController.profile);

export default router;
