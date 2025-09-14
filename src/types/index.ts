import { Request } from 'express';
import { Document } from 'mongoose';

export interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  password: string;
  plan: 'free' | 'pro' | 'premium';
  isAdmin: boolean;
  isEmailVerified: boolean;
  emailVerificationCode?: string;
  emailVerificationExpires?: Date;
  passwordResetCode?: string;
  passwordResetExpires?: Date;
  connectedPlatforms: string[];
  videosGenerated: number;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  comparePassword(candidatePassword: string): Promise<boolean>;
  generatePasswordResetToken(): string;
  generateEmailVerificationToken(): string;
}

export interface AuthRequest extends Request {
  user?: IUser;
}

export interface JWTPayload {
  userId: string;
  id: string;
  email: string;
  plan: 'free' | 'pro' | 'premium';
  isAdmin: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    plan: 'free' | 'pro' | 'premium';
    isAdmin: boolean;
    connectedPlatforms: string[];
    videosGenerated: number;
  };
  token: string;
  refreshToken: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  template?: string;
  context?: Record<string, any>;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface CustomError extends Error {
  statusCode: number;
  isOperational: boolean;
}

export interface DatabaseOptions {
  useNewUrlParser: boolean;
  useUnifiedTopology: boolean;
}

export interface RateLimitInfo {
  windowMs: number;
  max: number;
  message: string;
}
