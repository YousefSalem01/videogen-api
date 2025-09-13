import { Router } from 'express';
import {
  register,
  login,
  getMe,
  refreshToken,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword,
  logout,
  deleteAccount,
} from '../controllers/authController';
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

// Register new user
router.post(
  '/register',
  requireContentType('application/json'),
  validateRegister,
  register
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

// Reset password
router.post(
  '/reset-password',
  requireContentType('application/json'),
  validateResetPasswordData,
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
