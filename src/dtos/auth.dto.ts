/**
 * Data Transfer Objects (DTOs) for Auth endpoints
 * These define the structure of request/response data
 */

export interface RegisterRequestDto {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface RefreshTokenRequestDto {
  refreshToken: string;
}

export interface ForgotPasswordRequestDto {
  email: string;
}

export interface VerifyEmailRequestDto {
  userId: string;
  code: string;
}

export interface ResendVerificationRequestDto {
  userId: string;
}

export interface VerifyResetCodeRequestDto {
  email: string;
  code: string;
}

export interface ResetPasswordRequestDto {
  email: string;
  code: string;
  password: string;
}

export interface UpdateProfileRequestDto {
  name: string;
}

export interface ChangePasswordRequestDto {
  currentPassword: string;
  newPassword: string;
}

export interface DeleteAccountRequestDto {
  password: string;
}

export interface UserResponseDto {
  id: string;
  name: string;
  email: string;
  plan: 'free' | 'pro' | 'premium';
  isAdmin: boolean;
  connectedPlatforms: string[];
  videosGenerated: number;
  lastLogin?: string;
  createdAt?: string;
}

export interface AuthResponseDto {
  user: UserResponseDto;
  token: string;
  refreshToken: string;
}

export interface RefreshTokenResponseDto {
  token: string;
  refreshToken: string;
}

export interface ApiResponseDto<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}
