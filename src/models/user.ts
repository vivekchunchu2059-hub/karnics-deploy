/**
 * User model definitions
 */

export interface UserRole {
  id: number;
  role: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  status: 'Active' | 'Inactive';
  roles: UserRole[];
  firstName?: string;
  lastName?: string;
  phone?: string;
  username?: string;
}

export interface UserFormData {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

