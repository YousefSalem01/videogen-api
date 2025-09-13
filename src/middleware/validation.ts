import { Request, Response, NextFunction } from 'express';
import { 
  validateRegistration, 
  validateLogin, 
  validateForgotPassword, 
  validateResetPassword,
  sanitizeEmail,
  sanitizeString
} from '../utils/validation';
import { AppError } from './errorHandler';

/**
 * Middleware to validate registration data
 */
export const validateRegister = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Sanitize inputs
    if (req.body.email) {
      req.body.email = sanitizeEmail(req.body.email);
    }
    if (req.body.name) {
      req.body.name = sanitizeString(req.body.name);
    }

    // Validate data
    const errors = validateRegistration(req.body);
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors,
      });
    }

    next();
  } catch (error) {
    next(new AppError('Validation error', 400));
  }
};

/**
 * Middleware to validate login data
 */
export const validateLoginData = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Sanitize inputs
    if (req.body.email) {
      req.body.email = sanitizeEmail(req.body.email);
    }

    // Validate data
    const errors = validateLogin(req.body);
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors,
      });
    }

    next();
  } catch (error) {
    next(new AppError('Validation error', 400));
  }
};

/**
 * Middleware to validate forgot password data
 */
export const validateForgotPasswordData = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Sanitize inputs
    if (req.body.email) {
      req.body.email = sanitizeEmail(req.body.email);
    }

    // Validate data
    const errors = validateForgotPassword(req.body);
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors,
      });
    }

    next();
  } catch (error) {
    next(new AppError('Validation error', 400));
  }
};

/**
 * Middleware to validate reset password data
 */
export const validateResetPasswordData = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Sanitize inputs
    if (req.body.token) {
      req.body.token = sanitizeString(req.body.token);
    }

    // Validate data
    const errors = validateResetPassword(req.body);
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors,
      });
    }

    next();
  } catch (error) {
    next(new AppError('Validation error', 400));
  }
};

/**
 * Generic request body sanitizer
 */
export const sanitizeRequestBody = (allowedFields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const sanitizedBody: any = {};
      
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          if (typeof req.body[field] === 'string') {
            sanitizedBody[field] = sanitizeString(req.body[field]);
          } else {
            sanitizedBody[field] = req.body[field];
          }
        }
      });
      
      req.body = sanitizedBody;
      next();
    } catch (error) {
      next(new AppError('Request sanitization error', 400));
    }
  };
};

/**
 * Validate request parameters
 */
export const validateParams = (requiredParams: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const missingParams = requiredParams.filter(param => !req.params[param]);
      
      if (missingParams.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Missing required parameters: ${missingParams.join(', ')}`,
        });
      }
      
      next();
    } catch (error) {
      next(new AppError('Parameter validation error', 400));
    }
  };
};

/**
 * Validate query parameters
 */
export const validateQuery = (allowedParams: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const invalidParams = Object.keys(req.query).filter(
        param => !allowedParams.includes(param)
      );
      
      if (invalidParams.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid query parameters: ${invalidParams.join(', ')}`,
        });
      }
      
      next();
    } catch (error) {
      next(new AppError('Query validation error', 400));
    }
  };
};

/**
 * Check request content type
 */
export const requireContentType = (contentType: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.is(contentType)) {
      return res.status(400).json({
        success: false,
        message: `Content-Type must be ${contentType}`,
      });
    }
    next();
  };
};

/**
 * Validate request body size
 */
export const validateBodySize = (maxSizeBytes: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.get('content-length') || '0');
    
    if (contentLength > maxSizeBytes) {
      return res.status(413).json({
        success: false,
        message: `Request body too large. Maximum size is ${maxSizeBytes} bytes`,
      });
    }
    
    next();
  };
};
