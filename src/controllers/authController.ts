import { Response, NextFunction } from 'express';
import crypto from 'crypto';
import { AuthRequest, AuthResponse } from '../types';
import User from '../models/User';
import { generateTokens, createJWTPayload, verifyRefreshToken } from '../utils/jwt';
import { emailService } from '../utils/email';
import { AppError, asyncHandler } from '../middleware/errorHandler';

/**
 * Register a new user
 * @route POST /api/auth/register
 */
export const register = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { name, email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('User with this email already exists', 400));
  }

  // Create new user
  const user = await User.create({
    name,
    email,
    password,
    plan: 'free',
    isAdmin: false,
  });

  // Generate JWT tokens
  const jwtPayload = createJWTPayload(user);
  const { accessToken, refreshToken } = generateTokens(jwtPayload);

  // Send welcome email
  try {
    await emailService.sendWelcomeEmail(user.email, user.name);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    // Don't fail registration if email fails
  }

  // Prepare response data
  const authResponse: AuthResponse = {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      plan: user.plan,
      isAdmin: user.isAdmin,
      connectedPlatforms: user.connectedPlatforms,
      videosGenerated: user.videosGenerated,
    },
    token: accessToken,
    refreshToken,
  };

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: authResponse,
  });
});

/**
 * Login user
 * @route POST /api/auth/login
 */
export const login = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  // Check if user exists and get password
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return next(new AppError('Invalid email or password', 401));
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return next(new AppError('Invalid email or password', 401));
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  // Generate JWT tokens
  const jwtPayload = createJWTPayload(user);
  const { accessToken, refreshToken } = generateTokens(jwtPayload);

  // Prepare response data
  const authResponse: AuthResponse = {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      plan: user.plan,
      isAdmin: user.isAdmin,
      connectedPlatforms: user.connectedPlatforms,
      videosGenerated: user.videosGenerated,
    },
    token: accessToken,
    refreshToken,
  };

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: authResponse,
  });
});

/**
 * Get current user profile
 * @route GET /api/auth/me
 */
export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;

  res.status(200).json({
    success: true,
    message: 'User profile retrieved successfully',
    data: {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        plan: user.plan,
        isAdmin: user.isAdmin,
        connectedPlatforms: user.connectedPlatforms,
        videosGenerated: user.videosGenerated,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
    },
  });
});

/**
 * Refresh access token
 * @route POST /api/auth/refresh
 */
export const refreshToken = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    return next(new AppError('Refresh token is required', 400));
  }

  try {
    // Verify refresh token
    const decoded = verifyRefreshToken(token);

    // Get user from database
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Generate new tokens
    const jwtPayload = createJWTPayload(user);
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(jwtPayload);

    res.status(200).json({
      success: true,
      message: 'Tokens refreshed successfully',
      data: {
        token: accessToken,
        refreshToken: newRefreshToken,
      },
    });

  } catch (error: any) {
    return next(new AppError('Invalid or expired refresh token', 401));
  }
});

/**
 * Forgot password - send reset email
 * @route POST /api/auth/forgot-password
 */
export const forgotPassword = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { email } = req.body;

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError('No user found with this email address', 404));
  }

  // Generate reset token
  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // Send reset email
  try {
    await emailService.sendPasswordResetEmail(user.email, user.name, resetToken);

    res.status(200).json({
      success: true,
      message: 'Password reset email sent successfully',
    });

  } catch (error) {
    // Clear reset token if email fails
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    console.error('Failed to send password reset email:', error);
    return next(new AppError('Failed to send password reset email. Please try again.', 500));
  }
});

/**
 * Reset password with token
 * @route POST /api/auth/reset-password
 */
export const resetPassword = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { token, password } = req.body;

  // Hash the token to compare with stored version
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // Find user by token and check if token hasn't expired
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) {
    return next(new AppError('Password reset token is invalid or has expired', 400));
  }

  // Set new password
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Send confirmation email
  try {
    await emailService.sendPasswordResetSuccessEmail(user.email, user.name);
  } catch (error) {
    console.error('Failed to send password reset success email:', error);
    // Don't fail the password reset if email fails
  }

  // Generate new JWT tokens
  const jwtPayload = createJWTPayload(user);
  const { accessToken, refreshToken } = generateTokens(jwtPayload);

  // Prepare response data
  const authResponse: AuthResponse = {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      plan: user.plan,
      isAdmin: user.isAdmin,
      connectedPlatforms: user.connectedPlatforms,
      videosGenerated: user.videosGenerated,
    },
    token: accessToken,
    refreshToken,
  };

  res.status(200).json({
    success: true,
    message: 'Password reset successful',
    data: authResponse,
  });
});

/**
 * Update user profile
 * @route PUT /api/auth/profile
 */
export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const user = req.user!;
  const { name } = req.body;

  // Update allowed fields only
  if (name) {
    user.name = name;
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        plan: user.plan,
        isAdmin: user.isAdmin,
        connectedPlatforms: user.connectedPlatforms,
        videosGenerated: user.videosGenerated,
      },
    },
  });
});

/**
 * Change password
 * @route PUT /api/auth/change-password
 */
export const changePassword = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user!._id).select('+password');

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Check current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    return next(new AppError('Current password is incorrect', 400));
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password changed successfully',
  });
});

/**
 * Logout user (client-side token removal)
 * @route POST /api/auth/logout
 */
export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  // In a stateless JWT system, logout is handled client-side by removing the token
  // We can optionally implement token blacklisting here if needed in the future
  
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * Delete user account
 * @route DELETE /api/auth/account
 */
export const deleteAccount = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const user = req.user!;
  const { password } = req.body;

  // Verify password before deletion
  const userWithPassword = await User.findById(user._id).select('+password');
  if (!userWithPassword) {
    return next(new AppError('User not found', 404));
  }

  const isPasswordValid = await userWithPassword.comparePassword(password);
  if (!isPasswordValid) {
    return next(new AppError('Password is incorrect', 400));
  }

  // Delete user account
  await User.findByIdAndDelete(user._id);

  res.status(200).json({
    success: true,
    message: 'Account deleted successfully',
  });
});
