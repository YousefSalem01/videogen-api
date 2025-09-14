import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types';

// Get JWT secrets from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';
const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '30d';

/**
 * Generate Access Token
 */
export const generateAccessToken = (payload: JWTPayload): string => {
  try {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRE,
      issuer: 'ai-videogen-api',
      audience: 'ai-videogen-client',
    } as jwt.SignOptions);
  } catch (error) {
    throw new Error('Error generating access token');
  }
};

/**
 * Generate Refresh Token
 */
export const generateRefreshToken = (payload: JWTPayload): string => {
  try {
    return jwt.sign(payload, JWT_REFRESH_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRE,
      issuer: 'ai-videogen-api',
      audience: 'ai-videogen-client',
    } as jwt.SignOptions);
  } catch (error) {
    throw new Error('Error generating refresh token');
  }
};

/**
 * Generate Both Tokens
 */
export const generateTokens = (payload: JWTPayload) => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

/**
 * Verify Access Token
 */
export const verifyAccessToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'ai-videogen-api',
      audience: 'ai-videogen-client',
    }) as JWTPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Access token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid access token');
    } else {
      throw new Error('Error verifying access token');
    }
  }
};

/**
 * Verify Refresh Token
 */
export const verifyRefreshToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'ai-videogen-api',
      audience: 'ai-videogen-client',
    }) as JWTPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    } else {
      throw new Error('Error verifying refresh token');
    }
  }
};

/**
 * Decode Token (without verification)
 */
export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch (error) {
    return null;
  }
};

/**
 * Get Token Expiration Date
 */
export const getTokenExpiration = (token: string): Date | null => {
  try {
    const decoded = jwt.decode(token) as any;
    if (decoded && decoded.exp) {
      return new Date(decoded.exp * 1000);
    }
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Check if Token is Expired
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const expiration = getTokenExpiration(token);
    if (!expiration) return true;
    return expiration < new Date();
  } catch (error) {
    return true;
  }
};

/**
 * Extract Token from Authorization Header
 */
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader) return null;
  
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return authHeader;
};

/**
 * Create JWT Payload from User
 */
export const createJWTPayload = (user: any): JWTPayload => {
  return {
    userId: user._id.toString(),
    id: user._id.toString(),
    email: user.email,
    plan: user.plan,
    isAdmin: user.isAdmin,
  };
};
