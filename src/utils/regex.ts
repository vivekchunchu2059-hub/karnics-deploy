/**
 * Centralized regular expressions for reuse across the project
 * All validation regex patterns should be defined here
 */

/**
 * Matches names containing only alphabets and spaces
 * Example: "John Doe", "Mary Jane"
 */
export const nameRegex = /^[A-Za-z\s]+$/;

/**
 * Matches email format: local@domain.tld (word chars, hyphens, dots; TLD 2–4 chars)
 * Example: "user.name@example.co.uk"
 */
export const emailIdRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;

/**
 * Matches exactly 10 digits (phone number)
 * Example: "1234567890"
 */
export const phoneRegex = /^[0-9]{10}$/;

/**
 * Matches user IDs containing alphanumeric characters and special characters: @, ., _, -
 * Example: "user123", "admin@test", "user_name"
 */
export const userIdRegex = /^[A-Za-z0-9@._-]+$/;

/**
 * Matches passwords with:
 * - At least one lowercase letter (a–z)
 * - At least one uppercase letter (A–Z)
 * - At least one digit
 * - At least one symbol (any non–letter/digit except whitespace, e.g. @ # ! $)
 * - Minimum 8 characters, no spaces
 * Example: "Admin@01#", "Password123!"
 */
export const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s])\S{8,}$/;

/**
 * Matches GST Number format: 2 digits + 5 uppercase letters + 4 digits + 1 uppercase letter + 3 alphanumeric
 * Example: "27AABCU9603R1ZX"
 */
export const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{3}$/;

/**
 * Matches PAN Number format: 5 uppercase letters + 4 digits + 1 uppercase letter
 * Example: "ABCDE1234F"
 */
export const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

/**
 * Matches usernames containing alphanumeric characters and special characters: underscore, dot, dash
 * Example: "user_name", "admin.test", "user-123"
 */
export const usernameRegex = /^[A-Za-z0-9._-]+$/;

/**
 * Matches a single digit (0-9). Used for OTP input fields.
 */
export const singleDigitRegex = /^\d$/;
