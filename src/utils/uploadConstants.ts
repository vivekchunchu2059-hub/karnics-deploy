// Shared limits for profile/logo uploads (header, sidebar, profile dialog)
export const PROFILE_LOGO_MAX_SIZE_MB = 1;
export const PROFILE_LOGO_MAX_SIZE_BYTES = PROFILE_LOGO_MAX_SIZE_MB * 1024 * 1024;
export const PROFILE_LOGO_ACCEPT = 'image/jpeg,image/jpg,image/png';
export const PROFILE_LOGO_VALID_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

export const validateImageFile = (
  file: File
): { valid: boolean; error?: string } => {
  if (!PROFILE_LOGO_VALID_TYPES.includes(file.type)) {
    return { valid: false, error: 'Please select a JPEG or PNG image.' };
  }
  if (file.size > PROFILE_LOGO_MAX_SIZE_BYTES) {
    return {
      valid: false,
      error: `Image must be under ${PROFILE_LOGO_MAX_SIZE_MB}MB (current: ${(file.size / 1024 / 1024).toFixed(2)}MB).`,
    };
  }
  return { valid: true };
};

// localStorage keys for profile/company branding
export const STORAGE_PROFILE_IMAGE = 'profileImage';
export const STORAGE_COMPANY_LOGO = 'companyLogo';
export const STORAGE_COMPANY_NAME = 'companyName';
