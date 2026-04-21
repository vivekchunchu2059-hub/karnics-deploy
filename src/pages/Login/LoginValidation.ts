import * as Yup from 'yup';
import { passwordRegex, userIdRegex, phoneRegex, singleDigitRegex } from '../../utils/regex';

export const validationSchema = Yup.object({
  username: Yup.string()
    .required('Username is required')
    .matches(userIdRegex, 'Username can only contain alphanumeric characters'),
  password: Yup.string()
    .trim("Remove extra spaces at the beginning or end")
    .strict(true)
    .matches(
      passwordRegex,
      'Password must contain uppercase, lowercase, a number, a symbol, at least 8 characters, and no spaces'
    )
    .required('Password is required'),
});

export const forgotPasswordValidationSchema = Yup.object({
  email: Yup.string()
    .required('Email is required')
    .email('Please enter a valid email address'),
  mobileNumber: Yup.string()
    .required('Mobile number is required')
    .matches(phoneRegex, 'Mobile number must be exactly 10 digits')
    .test('no-spaces', 'Mobile number cannot contain spaces', (value) => !value || !/\s/.test(value)),
});

export const changePasswordValidationSchema = Yup.object({
  currentPassword: Yup.string()
    .required('Current password is required'),
  newPassword: Yup.string()
    .required('New password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(
      passwordRegex,
      'Password must contain uppercase, lowercase, a number, a symbol, at least 8 characters, and no spaces'
    ),
  confirmPassword: Yup.string()
    .required('Confirm password is required')
    .matches(
      passwordRegex,
      'Password must contain uppercase, lowercase, a number, a symbol, at least 8 characters, and no spaces'
    )
    .oneOf([Yup.ref('newPassword')], 'Passwords must match'),
});

export const otpValidationSchema = Yup.object({
  otp1: Yup.string()
    .required('OTP is required')
    .matches(singleDigitRegex, 'Must be a digit'),
  otp2: Yup.string()
    .required('OTP is required')
    .matches(singleDigitRegex, 'Must be a digit'),
  otp3: Yup.string()
    .required('OTP is required')
    .matches(singleDigitRegex, 'Must be a digit'),
  otp4: Yup.string()
    .required('OTP is required')
    .matches(singleDigitRegex, 'Must be a digit'),
});
