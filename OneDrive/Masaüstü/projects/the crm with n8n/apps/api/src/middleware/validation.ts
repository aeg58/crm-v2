import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';

/**
 * Handle validation errors
 */
export function handleValidationErrors(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array(),
    });
    return;
  }
  next();
}



// Auth validation rules
export const validateRegister = [
  body('email').isEmail().normalizeEmail(),
  body('name').trim().isLength({ min: 2, max: 100 }),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  handleValidationErrors,
];

export const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  handleValidationErrors,
];

// Customer validation rules
export const validateCreateCustomer = [
  body('name').trim().isLength({ min: 1, max: 100 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().isMobilePhone('any'),
  body('company').optional().trim().isLength({ max: 100 }),
  body('source').isIn(['WHATSAPP', 'INSTAGRAM', 'MANUAL', 'OTHER']),
  body('tags').optional().isArray(),
  body('notes').optional().trim().isLength({ max: 1000 }),
  handleValidationErrors,
];

export const validateUpdateCustomer = [
  body('name').optional().trim().isLength({ min: 1, max: 100 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().isMobilePhone('any'),
  body('company').optional().trim().isLength({ max: 100 }),
  body('status').optional().isIn(['ACTIVE', 'INACTIVE', 'BLOCKED']),
  body('tags').optional().isArray(),
  body('notes').optional().trim().isLength({ max: 1000 }),
  handleValidationErrors,
];

// Message validation rules
export const validateCreateMessage = [
  body('customerId').isUUID(),
  body('content').trim().isLength({ min: 1, max: 2000 }),
  body('direction').isIn(['INBOUND', 'OUTBOUND']),
  body('platform').isIn(['WHATSAPP', 'INSTAGRAM', 'MANUAL']),
  body('metadata').optional().isObject(),
  handleValidationErrors,
];

// Lead validation rules
export const validateCreateLead = [
  body('customerId').isUUID(),
  body('score').isInt({ min: 0, max: 100 }),
  body('status').optional().isIn(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST']),
  body('source').trim().isLength({ min: 1, max: 100 }),
  body('notes').optional().trim().isLength({ max: 1000 }),
  handleValidationErrors,
];

export const validateUpdateLead = [
  body('score').optional().isInt({ min: 0, max: 100 }),
  body('status').optional().isIn(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST']),
  body('notes').optional().trim().isLength({ max: 1000 }),
  handleValidationErrors,
];

// Parameter validation
export const validateId = [
  param('id').isUUID(),
  handleValidationErrors,
];

// Query validation
export const validatePagination = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  handleValidationErrors,
];
