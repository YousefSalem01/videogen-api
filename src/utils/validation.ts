import { ValidationError } from '../types';

/**
 * Validation utility functions
 */

/**
 * Validate Email Format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

/**
 * Validate Password Strength
 */
export const validatePassword = (password: string): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!password) {
    errors.push({ field: 'password', message: 'Password is required' });
    return errors;
  }

  if (password.length < 6) {
    errors.push({ field: 'password', message: 'Password must be at least 6 characters long' });
  }

  if (password.length > 128) {
    errors.push({ field: 'password', message: 'Password cannot be more than 128 characters long' });
  }

  // Check for at least one letter and one number (optional for basic validation)
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);

  if (!hasLetter || !hasNumber) {
    errors.push({ 
      field: 'password', 
      message: 'Password should contain at least one letter and one number' 
    });
  }

  return errors;
};

/**
 * Validate Name
 */
export const validateName = (name: string): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!name || name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Name is required' });
    return errors;
  }

  const trimmedName = name.trim();

  if (trimmedName.length < 2) {
    errors.push({ field: 'name', message: 'Name must be at least 2 characters long' });
  }

  if (trimmedName.length > 50) {
    errors.push({ field: 'name', message: 'Name cannot be more than 50 characters long' });
  }

  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  const nameRegex = /^[a-zA-Z\s'-]+$/;
  if (!nameRegex.test(trimmedName)) {
    errors.push({ 
      field: 'name', 
      message: 'Name can only contain letters, spaces, hyphens, and apostrophes' 
    });
  }

  return errors;
};

/**
 * Validate Registration Data
 */
export const validateRegistration = (data: any): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Validate name
  if (!data.name) {
    errors.push({ field: 'name', message: 'Name is required' });
  } else {
    errors.push(...validateName(data.name));
  }

  // Validate email
  if (!data.email) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!isValidEmail(data.email)) {
    errors.push({ field: 'email', message: 'Please provide a valid email address' });
  }

  // Validate password
  if (!data.password) {
    errors.push({ field: 'password', message: 'Password is required' });
  } else {
    errors.push(...validatePassword(data.password));
  }

  return errors;
};

/**
 * Validate Login Data
 */
export const validateLogin = (data: any): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Validate email
  if (!data.email) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!isValidEmail(data.email)) {
    errors.push({ field: 'email', message: 'Please provide a valid email address' });
  }

  // Validate password
  if (!data.password) {
    errors.push({ field: 'password', message: 'Password is required' });
  }

  return errors;
};

/**
 * Validate Forgot Password Data
 */
export const validateForgotPassword = (data: any): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Validate email
  if (!data.email) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!isValidEmail(data.email)) {
    errors.push({ field: 'email', message: 'Please provide a valid email address' });
  }

  return errors;
};

/**
 * Validate Reset Password Data
 */
export const validateResetPassword = (data: any): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Validate token
  if (!data.token) {
    errors.push({ field: 'token', message: 'Reset token is required' });
  }

  // Validate password
  if (!data.password) {
    errors.push({ field: 'password', message: 'New password is required' });
  } else {
    errors.push(...validatePassword(data.password));
  }

  return errors;
};

/**
 * Sanitize String Input
 */
export const sanitizeString = (input: string): string => {
  if (!input) return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
};

/**
 * Sanitize Email Input
 */
export const sanitizeEmail = (email: string): string => {
  if (!email) return '';
  
  return email
    .trim()
    .toLowerCase()
    .substring(0, 254); // RFC 5321 limit
};

/**
 * Check if string contains only allowed characters
 */
export const containsOnlyAllowedChars = (input: string, allowedPattern: RegExp): boolean => {
  return allowedPattern.test(input);
};

/**
 * Validate Object Keys
 */
export const validateRequiredFields = (data: any, requiredFields: string[]): ValidationError[] => {
  const errors: ValidationError[] = [];

  requiredFields.forEach(field => {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      errors.push({ 
        field, 
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} is required` 
      });
    }
  });

  return errors;
};

/**
 * Validate Plan Type
 */
export const isValidPlan = (plan: string): boolean => {
  const validPlans = ['free', 'pro', 'premium'];
  return validPlans.includes(plan);
};

/**
 * Validate Platform Type
 */
export const isValidPlatform = (platform: string): boolean => {
  const validPlatforms = ['youtube', 'instagram', 'tiktok', 'facebook'];
  return validPlatforms.includes(platform);
};

/**
 * Clean and validate object for database insertion
 */
export const cleanObject = (obj: any, allowedFields: string[]): any => {
  const cleanedObj: any = {};
  
  allowedFields.forEach(field => {
    if (obj[field] !== undefined && obj[field] !== null) {
      if (typeof obj[field] === 'string') {
        cleanedObj[field] = sanitizeString(obj[field]);
      } else {
        cleanedObj[field] = obj[field];
      }
    }
  });
  
  return cleanedObj;
};
