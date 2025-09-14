import { Router } from 'express';
import {
  register,
  verifyEmail,
  resendVerification,
  login,
  getMe,
  refreshToken,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  updateProfile,
  changePassword,
  logout,
  deleteAccount,
} from '../controllers/auth.controller';
import { protect } from '../middleware/auth';
import {
  validateRegister,
  validateLoginData,
  validateForgotPasswordData,
  validateResetPasswordData,
  requireContentType,
  sanitizeRequestBody,
} from '../middleware/validation';

const router = Router();

/**
 * Public Routes (No authentication required)
 */

// Register new user (step 1)
router.post(
  '/register',
  requireContentType('application/json'),
  validateRegister,
  register
);

// Verify email with code (step 2)
router.post(
  '/verify-email',
  requireContentType('application/json'),
  sanitizeRequestBody(['userId', 'code']),
  verifyEmail
);

// Resend verification code
router.post(
  '/resend-verification',
  requireContentType('application/json'),
  sanitizeRequestBody(['userId']),
  resendVerification
);

// Login user
router.post(
  '/login',
  requireContentType('application/json'),
  validateLoginData,
  login
);

// Refresh access token
router.post(
  '/refresh',
  requireContentType('application/json'),
  sanitizeRequestBody(['refreshToken']),
  refreshToken
);

// Forgot password
router.post(
  '/forgot-password',
  requireContentType('application/json'),
  validateForgotPasswordData,
  forgotPassword
);

// Verify reset code
router.post(
  '/verify-reset-code',
  requireContentType('application/json'),
  sanitizeRequestBody(['email', 'code']),
  verifyResetCode
);

// Reset password with code
router.post(
  '/reset-password',
  requireContentType('application/json'),
  sanitizeRequestBody(['email', 'code', 'password']),
  resetPassword
);

/**
 * Protected Routes (Authentication required)
 */

// Get current user profile
router.get('/me', protect, getMe);

// Update user profile
router.put(
  '/profile',
  protect,
  requireContentType('application/json'),
  sanitizeRequestBody(['name']),
  updateProfile
);

// Change password
router.put(
  '/change-password',
  protect,
  requireContentType('application/json'),
  sanitizeRequestBody(['currentPassword', 'newPassword']),
  changePassword
);

// Logout user
router.post('/logout', protect, logout);

// Delete user account
router.delete(
  '/account',
  protect,
  requireContentType('application/json'),
  sanitizeRequestBody(['password']),
  deleteAccount
);

export default router;
