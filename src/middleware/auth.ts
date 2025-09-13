import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { verifyAccessToken, extractTokenFromHeader } from '../utils/jwt';
import User from '../models/User';

/**
 * Middleware to protect routes - requires valid JWT token
 */
export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Get user from database
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. User not found.',
      });
    }

    // Keep middleware fast and side-effect free

    // Add user to request object
    req.user = user;
    next();

  } catch (error: any) {
    console.error('Auth middleware error:', error.message);
    
    if (error.message === 'Access token expired') {
      return res.status(401).json({
        success: false,
        message: 'Access token expired. Please refresh your token.',
        code: 'TOKEN_EXPIRED',
      });
    }

    if (error.message === 'Invalid access token') {
      return res.status(401).json({
        success: false,
        message: 'Invalid access token.',
        code: 'INVALID_TOKEN',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Access denied. Invalid token.',
    });
  }
};

/**
 * Middleware to check if user is admin
 */
export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Authentication required.',
    });
  }

  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.',
    });
  }

  next();
};

/**
 * Middleware to check if user has specific plan
 */
export const requirePlan = (requiredPlan: 'free' | 'pro' | 'premium') => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Authentication required.',
      });
    }

    const planHierarchy = { free: 0, pro: 1, premium: 2 };
    const userPlanLevel = planHierarchy[req.user.plan];
    const requiredPlanLevel = planHierarchy[requiredPlan];

    if (userPlanLevel < requiredPlanLevel) {
      return res.status(403).json({
        success: false,
        message: `Access denied. ${requiredPlan} plan or higher required.`,
        userPlan: req.user.plan,
        requiredPlan,
      });
    }

    next();
  };
};

/**
 * Middleware to check if user has connected platforms
 */
export const requireConnectedPlatforms = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Authentication required.',
    });
  }

  if (!req.user.connectedPlatforms || req.user.connectedPlatforms.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Please connect at least one social media platform before proceeding.',
    });
  }

  next();
};

/**
 * Optional auth middleware - doesn't fail if no token provided
 */
export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return next(); // Continue without user
    }

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id);
    
    if (user) {
      req.user = user;
    }

    next();

  } catch (error) {
    // Continue without user if token is invalid
    next();
  }
};

/**
 * Middleware to check if user owns resource
 */
export const checkResourceOwnership = (resourceUserIdField: string = 'userId') => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Authentication required.',
      });
    }

    const resourceUserId = req.body[resourceUserIdField] || req.params[resourceUserIdField];
    
    if (!resourceUserId) {
      return res.status(400).json({
        success: false,
        message: 'Resource owner information missing.',
      });
    }

    if (resourceUserId !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.',
      });
    }

    next();
  };
};
