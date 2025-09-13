import { Request } from 'express';
import { Document } from 'mongoose';

// User Interface
export interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  password: string;
  plan: 'free' | 'pro' | 'premium';
  isAdmin: boolean;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  connectedPlatforms: string[];
  videosGenerated: number;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  generatePasswordResetToken(): string;
  generateEmailVerificationToken(): string;
}

// Auth Request Interface
export interface AuthRequest extends Request {
  user?: IUser;
}

// JWT Payload Interface
export interface JWTPayload {
  id: string;
  email: string;
  plan: string;
  isAdmin: boolean;
}

// API Response Interface
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Auth Response Interface
export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    plan: string;
    isAdmin: boolean;
    connectedPlatforms: string[];
    videosGenerated: number;
  };
  token: string;
  refreshToken: string;
}

// Registration Request
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

// Login Request
export interface LoginRequest {
  email: string;
  password: string;
}

// Forgot Password Request
export interface ForgotPasswordRequest {
  email: string;
}

// Reset Password Request
export interface ResetPasswordRequest {
  token: string;
  password: string;
}

// Email Options Interface
export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  template?: string;
  context?: Record<string, any>;
}

// Validation Error Interface
export interface ValidationError {
  field: string;
  message: string;
}

// Custom Error Interface
export interface CustomError extends Error {
  statusCode: number;
  isOperational: boolean;
}

// Database Connection Options
export interface DatabaseOptions {
  useNewUrlParser: boolean;
  useUnifiedTopology: boolean;
}

// Rate Limit Info
export interface RateLimitInfo {
  windowMs: number;
  max: number;
  message: string;
}
