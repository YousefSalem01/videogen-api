import crypto from 'crypto';
import User from '../models/User';
import { generateTokens, createJWTPayload, verifyRefreshToken } from '../utils/jwt';
import { emailService } from '../utils/email.service';
import { AppError } from '../middleware/errorHandler';
import { AuthResponse } from '../types';

export class AuthService {
  /**
   * Register a new user (step 1 - send verification code)
   */
  async register(name: string, email: string, password: string): Promise<{ message: string; tempUserId: string }> {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isEmailVerified) {
      throw new AppError('User with this email already exists', 400);
    }

    // Generate verification code
    const verificationCode = emailService.generateVerificationCode();
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    let user;
    if (existingUser && !existingUser.isEmailVerified) {
      // Update existing unverified user
      user = existingUser;
      user.name = name;
      user.password = password; // Will be hashed by pre-save hook
      user.emailVerificationCode = verificationCode;
      user.emailVerificationExpires = verificationExpires;
      await user.save();
    } else {
      // Create new user
      user = await User.create({
        name,
        email,
        password,
        plan: 'free',
        isAdmin: false,
        isEmailVerified: false,
        emailVerificationCode: verificationCode,
        emailVerificationExpires: verificationExpires,
      });
    }

    // Send verification code email
    await emailService.sendVerificationCode(email, name, verificationCode);

    return {
      message: 'Verification code sent to your email',
      tempUserId: user._id.toString(),
    };
  }

  /**
   * Verify email with 6-digit code (step 2 - complete registration)
   */
  async verifyEmail(userId: string, code: string): Promise<AuthResponse> {
    const user = await User.findById(userId).select('+emailVerificationCode +emailVerificationExpires');
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.isEmailVerified) {
      throw new AppError('Email already verified', 400);
    }

    if (!user.emailVerificationCode || !user.emailVerificationExpires) {
      throw new AppError('No verification code found. Please request a new one.', 400);
    }

    if (user.emailVerificationExpires < new Date()) {
      throw new AppError('Verification code has expired. Please request a new one.', 400);
    }

    if (user.emailVerificationCode !== code) {
      throw new AppError('Invalid verification code', 400);
    }

    // Mark email as verified and clear verification fields
    user.isEmailVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationExpires = undefined;
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT tokens
    const jwtPayload = createJWTPayload(user);
    const { accessToken, refreshToken } = generateTokens(jwtPayload);

    // Send welcome email
    await emailService.sendWelcomeEmail(user.email, user.name);

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        plan: user.plan,
        isAdmin: user.isAdmin,
        connectedPlatforms: user.connectedPlatforms || [],
        videosGenerated: user.videosGenerated || 0,
      },
      token: accessToken,
      refreshToken,
    };
  }

  /**
   * Resend verification code
   */
  async resendVerificationCode(userId: string): Promise<{ message: string }> {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.isEmailVerified) {
      throw new AppError('Email already verified', 400);
    }

    // Generate new verification code
    const verificationCode = emailService.generateVerificationCode();
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.emailVerificationCode = verificationCode;
    user.emailVerificationExpires = verificationExpires;
    await user.save();

    // Send verification code email
    await emailService.sendVerificationCode(user.email, user.name, verificationCode);

    return { message: 'Verification code sent to your email' };
  }

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    // Find user and include password for validation
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      throw new AppError('Please verify your email before logging in. Check your email for verification code.', 401);
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT tokens
    const jwtPayload = createJWTPayload(user);
    const { accessToken, refreshToken } = generateTokens(jwtPayload);

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        plan: user.plan,
        isAdmin: user.isAdmin,
        connectedPlatforms: user.connectedPlatforms || [],
        videosGenerated: user.videosGenerated || 0,
      },
      token: accessToken,
      refreshToken,
    };
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      plan: user.plan,
      isAdmin: user.isAdmin,
      connectedPlatforms: user.connectedPlatforms || [],
      videosGenerated: user.videosGenerated || 0,
      lastLogin: user.lastLogin?.toISOString(),
      createdAt: user.createdAt?.toISOString(),
    };
  }

  /**
   * Refresh JWT token
   */
  async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new AppError('Invalid refresh token', 401);
    }

    const jwtPayload = createJWTPayload(user);
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(jwtPayload);

    return {
      token: accessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Forgot password - send reset code
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists or not for security
      return { message: 'If an account with that email exists, a password reset code has been sent' };
    }

    if (!user.isEmailVerified) {
      throw new AppError('Please verify your email first before resetting password', 400);
    }

    // Generate reset code
    const resetCode = emailService.generateVerificationCode();
    const resetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Set reset code and expiry
    user.passwordResetCode = resetCode;
    user.passwordResetExpires = resetExpires;
    await user.save();

    // Send reset code email
    await emailService.sendPasswordResetCode(user.email, user.name, resetCode);

    return { message: 'If an account with that email exists, a password reset code has been sent' };
  }

  /**
   * Verify reset code (without resetting password)
   */
  async verifyResetCode(email: string, code: string): Promise<{ message: string }> {
    const user = await User.findOne({
      email,
      passwordResetCode: code,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetCode +passwordResetExpires');

    if (!user) {
      throw new AppError('Invalid or expired reset code', 400);
    }

    return { message: 'Reset code verified successfully' };
  }

  /**
   * Verify reset code and reset password
   */
  async resetPassword(email: string, code: string, newPassword: string): Promise<AuthResponse> {
    // Find user with valid reset code
    const user = await User.findOne({
      email,
      passwordResetCode: code,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetCode +passwordResetExpires');

    if (!user) {
      throw new AppError('Invalid or expired reset code', 400);
    }

    // Update password and clear reset code
    user.password = newPassword;
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    user.lastLogin = new Date();
    await user.save();

    // Generate new JWT tokens
    const jwtPayload = createJWTPayload(user);
    const { accessToken, refreshToken } = generateTokens(jwtPayload);

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        plan: user.plan,
        isAdmin: user.isAdmin,
        connectedPlatforms: user.connectedPlatforms || [],
        videosGenerated: user.videosGenerated || 0,
      },
      token: accessToken,
      refreshToken,
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, name: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    user.name = name;
    await user.save();

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      plan: user.plan,
      isAdmin: user.isAdmin,
      connectedPlatforms: user.connectedPlatforms || [],
      videosGenerated: user.videosGenerated || 0,
      lastLogin: user.lastLogin?.toISOString(),
      createdAt: user.createdAt?.toISOString(),
    };
  }

  /**
   * Change password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw new AppError('Current password is incorrect', 400);
    }

    // Update password
    user.password = newPassword;
    await user.save();
  }

  /**
   * Delete user account
   */
  async deleteAccount(userId: string, password: string): Promise<void> {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify password before deletion
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError('Password is incorrect', 400);
    }

    // Delete user
    await User.findByIdAndDelete(userId);
  }

}

// Export singleton instance
export const authService = new AuthService();
