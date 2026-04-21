import * as Yup from 'yup';
import {gstRegex, usernameRegex, passwordRegex, phoneRegex, emailIdRegex} from '../../utils/regex'; 

export const registerValidationSchema = Yup.object({
  // Username validation - Allow alphabets, numbers, hyphen, and spaces between words
  username: Yup.string()
    .required('Username is required')
    .matches(usernameRegex, 'Username can only contain alphabets, numbers, hyphens, and spaces between words')
    .min(3, 'Username must be at least 3 characters'),

  // Password validation - Use passwordRegex from regex.ts
  password: Yup.string()
    .trim("Remove extra spaces at the beginning or end")
    .strict(true)
    .required('Password is required')
    .matches(
      passwordRegex,
      'Password must contain at least one lowercase letter, one uppercase letter, one number, one symbol (e.g. @ # ! $), at least 8 characters, and no spaces'
    ),

  // Confirm Password validation
  confirmPassword: Yup.string()
    .trim("Remove extra spaces at the beginning or end")
    .strict(true)
    .matches(
      passwordRegex,
      'Password must contain at least one lowercase letter, one uppercase letter, one number, one symbol (e.g. @ # ! $), at least 8 characters, and no spaces'
    )
    .required('Confirm password is required')
    .oneOf([Yup.ref('password')], 'Passwords must match'),

  // First Name validation
  firstName: Yup.string()
    .trim("Remove extra spaces at the beginning or end")
    .strict(true)
    .required('First name is required')
    .min(2, 'First name must be at least 2 characters'),

  // Last Name validation
  lastName: Yup.string()
    .trim("Remove extra spaces at the beginning or end")
    .strict(true)
    .required('Last name is required')
    .min(2, 'Last name must be at least 2 characters'),

  // Shop Name - MANDATORY: required + proper name validation
  shopName: Yup.string()
    .required('Shop name is required')
    .min(3, 'Shop name must be at least 3 characters')
    .test('not-empty', 'Shop name cannot be empty', (value) => {
      return value !== undefined && value !== null && value.trim().length > 0;
    }),

  // Shop Address - required but allow any characters, no restrictions
  shopAddress: Yup.string()
    .nullable()
    .notRequired()
    .required('Shop address is required'),

  // Mobile Number - MANDATORY: required + only numeric input (0-9), no alphabets or special characters
  mobileNumber: Yup.string()
  .trim("Remove extra spaces at the beginning or end")
  .strict(true)
  .required('Mobile number is required')
  .matches(phoneRegex, 'Mobile number must be exactly 10 digits'),

  // Email - OPTIONAL: validate format only if user enters value
  email: Yup.string()
  .trim("Remove extra spaces at the beginning or end")
  .strict(true)
  .nullable()
  .notRequired()
  .matches(emailIdRegex, {
    message: 'Please enter a valid email address',
    excludeEmptyString: true,
  }),

  // Making Charges - required (no specific format validation mentioned)
  makingCharges: Yup.string()
    .required('Making charges is required'),

  // CGST - required (no specific format validation mentioned)
  cgst: Yup.string()
    .required('CGST is required'),

  // SGST - required (no specific format validation mentioned)
  sgst: Yup.string()
    .required('SGST is required'),

  // GST Number - MANDATORY: required + must follow GST format/length
  gstNumber: Yup.string()
    .trim("Remove extra spaces at the beginning or end")
    .strict(true)
    .required('GST number is required')
    .matches(gstRegex, 'GST number must be exactly 15 alphanumeric characters (e.g., 27ABCDE1234F1Z5)'),

  // PAN Number - MANDATORY: required + must follow PAN format/length
  panNumber: Yup.string()
    .trim("Remove extra spaces at the beginning or end")
    .strict(true)
    .notRequired(),
    //.matches(panRegex, 'PAN number must be in valid format (e.g., ALWPG5809L)'),

  // Logo - optional file upload
  logo: Yup.mixed()
    .nullable()
    .notRequired(),

  // Profile Picture - optional file upload
  profilePicture: Yup.mixed()
    .nullable()
    .notRequired(),
});
