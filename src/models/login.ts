/**
 * Login Models
 * Type definitions for login-related data structures
 */

export interface LoginProps {
  onLogin: () => void;
}

export interface LoginFormValues {
  username: string;
  password: string;
}

export interface ForgotPasswordFormValues {
  email: string;
  mobileNumber: string;
}

export interface ChangePasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface OTPFormValues {
  otp1: string;
  otp2: string;
  otp3: string;
  otp4: string;
}

export type ViewType = 'login' | 'forgotPassword' | 'forgotPasswordOTP';

