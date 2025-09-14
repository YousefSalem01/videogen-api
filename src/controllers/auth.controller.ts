import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { authService } from '../services/auth.service';
import { asyncHandler } from '../middleware/errorHandler';
import {
  RegisterRequestDto,
  LoginRequestDto,
  RefreshTokenRequestDto,
  ForgotPasswordRequestDto,
  VerifyEmailRequestDto,
  ResendVerificationRequestDto,
  VerifyResetCodeRequestDto,
  ResetPasswordRequestDto,
  UpdateProfileRequestDto,
  ChangePasswordRequestDto,
  DeleteAccountRequestDto,
  ApiResponseDto,
  AuthResponseDto,
  UserResponseDto,
  RefreshTokenResponseDto,
} from '../dtos/auth.dto';

/**
 * Register a new user (step 1 - send verification code)
 * @route POST /api/auth/register
 */
export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, email, password }: RegisterRequestDto = req.body;

  const result = await authService.register(name, email, password);

  const response: ApiResponseDto<{ message: string; tempUserId: string }> = {
    success: true,
    message: result.message,
    data: result,
  };

  res.status(201).json(response);
});

/**
 * Verify email with 6-digit code (step 2 - complete registration)
 * @route POST /api/auth/verify-email
 */
export const verifyEmail = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId, code }: VerifyEmailRequestDto = req.body;

  const authResponse = await authService.verifyEmail(userId, code);

  const response: ApiResponseDto<AuthResponseDto> = {
    success: true,
    message: 'Email verified successfully. Welcome!',
    data: authResponse,
  };

  res.status(200).json(response);
});

/**
 * Resend verification code
 * @route POST /api/auth/resend-verification
 */
export const resendVerification = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId }: ResendVerificationRequestDto = req.body;

  const result = await authService.resendVerificationCode(userId);

  const response: ApiResponseDto<{ message: string }> = {
    success: true,
    message: result.message,
    data: result,
  };

  res.status(200).json(response);
});

/**
 * Login user
 * @route POST /api/auth/login
 */
export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password }: LoginRequestDto = req.body;

  const authResponse = await authService.login(email, password);

  const response: ApiResponseDto<AuthResponseDto> = {
    success: true,
    message: 'Login successful',
    data: authResponse,
  };

  res.status(200).json(response);
});

/**
 * Get current user profile
 * @route GET /api/auth/me
 */
export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  const user = await authService.getProfile(userId);

  const response: ApiResponseDto<{ user: UserResponseDto }> = {
    success: true,
    message: 'User profile retrieved successfully',
    data: { user },
  };

  res.status(200).json(response);
});

/**
 * Refresh JWT token
 * @route POST /api/auth/refresh
 */
export const refreshToken = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { refreshToken }: RefreshTokenRequestDto = req.body;

  const tokens = await authService.refreshToken(refreshToken);

  const response: ApiResponseDto<RefreshTokenResponseDto> = {
    success: true,
    message: 'Token refreshed successfully',
    data: tokens,
  };

  res.status(200).json(response);
});

/**
 * Forgot password - send reset code
 * @route POST /api/auth/forgot-password
 */
export const forgotPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email }: ForgotPasswordRequestDto = req.body;

  const result = await authService.forgotPassword(email);

  const response: ApiResponseDto<{ message: string }> = {
    success: true,
    message: result.message,
    data: result,
  };

  res.status(200).json(response);
});

/**
 * Verify reset code
 * @route POST /api/auth/verify-reset-code
 */
export const verifyResetCode = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, code }: VerifyResetCodeRequestDto = req.body;

  const result = await authService.verifyResetCode(email, code);

  const response: ApiResponseDto<{ message: string }> = {
    success: true,
    message: result.message,
    data: result,
  };

  res.status(200).json(response);
});

/**
 * Reset password with code
 * @route POST /api/auth/reset-password
 */
export const resetPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, code, password }: ResetPasswordRequestDto = req.body;

  const authResponse = await authService.resetPassword(email, code, password);

  const response: ApiResponseDto<AuthResponseDto> = {
    success: true,
    message: 'Password reset successful',
    data: authResponse,
  };

  res.status(200).json(response);
});

/**
 * Update user profile
 * @route PUT /api/auth/profile
 */
export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { name }: UpdateProfileRequestDto = req.body;

  const user = await authService.updateProfile(userId, name);

  const response: ApiResponseDto<{ user: UserResponseDto }> = {
    success: true,
    message: 'Profile updated successfully',
    data: { user },
  };

  res.status(200).json(response);
});

/**
 * Change password
 * @route PUT /api/auth/change-password
 */
export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { currentPassword, newPassword }: ChangePasswordRequestDto = req.body;

  await authService.changePassword(userId, currentPassword, newPassword);

  const response: ApiResponseDto = {
    success: true,
    message: 'Password changed successfully',
  };

  res.status(200).json(response);
});

/**
 * Logout user (client-side token removal)
 * @route POST /api/auth/logout
 */
export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  // Since we're using JWT tokens, logout is handled client-side
  // This endpoint exists for consistency and future server-side token blacklisting
  
  const response: ApiResponseDto = {
    success: true,
    message: 'Logout successful',
  };

  res.status(200).json(response);
});

/**
 * Delete user account
 * @route DELETE /api/auth/account
 */
export const deleteAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { password }: DeleteAccountRequestDto = req.body;

  await authService.deleteAccount(userId, password);

  const response: ApiResponseDto = {
    success: true,
    message: 'Account deleted successfully',
  };

  res.status(200).json(response);
});
