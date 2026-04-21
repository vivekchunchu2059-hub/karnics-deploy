/**
 * Registration Models
 * Type definitions for registration-related data structures
 */

export interface RegisterFormValues {
  username: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  shopName: string;
  shopAddress: string;
  mobileNumber: string;
  email: string;
  makingCharges: number;
  cgst: number;
  sgst: number;
  gstNumber: string;
  panNumber: string;
  logo: File | null;
  profilePicture: File | null;
}

export type RegistrationFormValues = {
  username: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  shopName: string;
  shopAddress: string;
  mobileNumber: string;
  email: string;
  makingCharges: number;
  cgst: number;
  sgst: number;
  gstNumber: string;
  panNumber: string;
  logo: File | null;
  profilePicture: File | null;
};

export type RegistrationRecord = {
  id: number;
  userId: number;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  shopName: string;
  shopAddress: string;
  mobileNumber: string;
  email: string;
  makingCharges: number;
  cgst: number;
  sgst: number;
  gstNumber: string;
  panNumber: string;
  logo?: string;
  profilePicture?: string;
  customerId?: string;
  createdAt: string;
  updatedAt?: string;
};

export interface RegistrationProps {
  open: boolean;
  onClose: () => void;
  onRegisterComplete?: () => void;
}

export type RegistrationViewType = 'register';
