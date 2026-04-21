import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Snackbar,
  Alert,
  Button,
  Dialog,
  DialogContent as MuiDialogContent,
  DialogActions,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import {
  validateImageFile,
  STORAGE_PROFILE_IMAGE,
  STORAGE_COMPANY_LOGO,
  STORAGE_COMPANY_NAME,
  PROFILE_LOGO_MAX_SIZE_MB,
} from '../../utils/uploadConstants';
import { getDisplayImageUrl } from '../../utils/registrationImageUrl';
import { getInvoiceTerms, setInvoiceTerms, type InvoiceTermsConfig } from '../../constants/invoiceTerms';
import { apiClient } from '../../api';
import { API_ENDPOINTS } from '../../constants/common';
import {
  StyledDialog,
  DialogHeader,
  DialogContent,
  LeftSection,
  RightSection,
  FormRow,
  FormField,
  FieldLabel,
  StyledTextField,
  ImageUploadSection,
  SectionTitle,
  AvatarContainer,
  StyledAvatar,
  EditIconButton,
  LogoContainer,
  LogoImage,
  BrowseButton,
  FileInputContainer,
  DialogFooter,
  SubmitButton,
  CancelButton,
} from './ProfileWidget';

interface ProfileDialogProps {
  open: boolean;
  onClose: () => void;
}

interface ProfileData {
  firstName: string;
  lastName: string;
  shopName: string;
  shopAddress: string;
  phone: string;
  email: string;
  gstNumber: string;
  panNumber: string;
}

const ProfileDialog: React.FC<ProfileDialogProps> = ({ open, onClose }) => {
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    shopName: '',
    shopAddress: '',
    phone: '',
    email: '',
    gstNumber: '',
    panNumber: '',
  });

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [logoImage, setLogoImage] = useState<string>('');
  const [logoFileName, setLogoFileName] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [imageError, setImageError] = useState<string>('');
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [termsEdit, setTermsEdit] = useState<InvoiceTermsConfig>(() => getInvoiceTerms());

  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const logoImageInputRef = useRef<HTMLInputElement>(null);

  // Load from localStorage when dialog opens
  useEffect(() => {
    if (open) {
      setProfileImage(localStorage.getItem(STORAGE_PROFILE_IMAGE));
      setLogoImage(localStorage.getItem(STORAGE_COMPANY_LOGO) || '');
      setProfileData((prev) => ({
        ...prev,
        shopName: localStorage.getItem(STORAGE_COMPANY_NAME) || prev.shopName,
      }));
    }
  }, [open]);

  const openTermsModal = () => {
    setTermsEdit(getInvoiceTerms());
    setTermsModalOpen(true);
  };

  const saveTerms = () => {
    setInvoiceTerms(termsEdit);
    setTermsModalOpen(false);
  };

  const handleInputChange = (field: keyof ProfileData) => (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    setProfileData({
      ...profileData,
      [field]: e.target.value,
    });
  };

  const handleProfileImageClick = () => {
    profileImageInputRef.current?.click();
  };

  const handleProfileImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const result = validateImageFile(file);
    if (!result.valid) {
      setImageError(result.error || 'Invalid file');
      return;
    }
    setImageError('');
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleLogoImageClick = () => {
    logoImageInputRef.current?.click();
  };

  const handleLogoImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const result = validateImageFile(file);
    if (!result.valid) {
      setImageError(result.error || 'Invalid file');
      return;
    }
    setImageError('');
    setLogoFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (profileImage) {
      localStorage.setItem(STORAGE_PROFILE_IMAGE, profileImage);
    }
    if (logoImage) {
      localStorage.setItem(STORAGE_COMPANY_LOGO, logoImage);
    }
    if (profileData.shopName) {
      localStorage.setItem(STORAGE_COMPANY_NAME, profileData.shopName);
    }
    // Persist logo and company name to server so they are stored and available for PDF etc.
    try {
      await apiClient.put(API_ENDPOINTS.SETTINGS_COMPANY, {
        companyLogo: logoImage || undefined,
        companyName: profileData.shopName || '',
      });
    } catch (err) {
    }
    window.dispatchEvent(new Event('profileOrLogoUpdated'));
    setShowSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const handleCancel = () => {
    setImageError('');
    onClose();
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
  };

  return (
    <>
      <StyledDialog open={open} onClose={onClose} maxWidth={false}>
        <DialogHeader>
          <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#212121' }}>
            Profile
          </Typography>
          <IconButton 
            onClick={onClose} 
            size="small" 
            sx={{ 
              color: '#9e9e9e',
              '&:hover': {
                backgroundColor: '#f5f5f5',
                color: '#757575',
              }
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogHeader>

        <DialogContent>
          <LeftSection>
            <FormRow>
              <FormField>
                <FieldLabel>First Name</FieldLabel>
                <StyledTextField
                  fullWidth
                  placeholder="Enter first name"
                  value={profileData.firstName}
                  onChange={handleInputChange('firstName')}
                  size="small"
                />
              </FormField>
              <FormField>
                <FieldLabel>Last Name</FieldLabel>
                <StyledTextField
                  fullWidth
                  placeholder="Enter last name"
                  value={profileData.lastName}
                  onChange={handleInputChange('lastName')}
                  size="small"
                />
              </FormField>
            </FormRow>

            <FormField>
              <FieldLabel>Shop Name</FieldLabel>
              <StyledTextField
                fullWidth
                placeholder="Please enter your Shop name"
                value={profileData.shopName}
                onChange={handleInputChange('shopName')}
                size="small"
              />
            </FormField>

            <FormField>
              <FieldLabel>Shop Address</FieldLabel>
              <StyledTextField
                fullWidth
                placeholder="Enter shop address"
                value={profileData.shopAddress}
                onChange={handleInputChange('shopAddress')}
                multiline
                rows={2}
              />
            </FormField>

            <FormRow>
              <FormField>
                <FieldLabel>Phone/Mobile Number</FieldLabel>
                <StyledTextField
                  fullWidth
                  placeholder="ex. 9821249596"
                  value={profileData.phone}
                  onChange={handleInputChange('phone')}
                  size="small"
                />
              </FormField>
              <FormField>
                <FieldLabel>Email</FieldLabel>
                <StyledTextField
                  fullWidth
                  placeholder="ex. yourname@email.com"
                  value={profileData.email}
                  onChange={handleInputChange('email')}
                  size="small"
                />
              </FormField>
            </FormRow>

            <FormRow>
              <FormField>
                <FieldLabel>GST Number</FieldLabel>
                <StyledTextField
                  fullWidth
                  placeholder="ex. 27ABCDE1234F1Z5"
                  value={profileData.gstNumber}
                  onChange={handleInputChange('gstNumber')}
                  size="small"
                />
              </FormField>
              <FormField>
                <FieldLabel>PAN Number</FieldLabel>
                <StyledTextField
                  fullWidth
                  placeholder="ex. ALWPG5809L"
                  value={profileData.panNumber}
                  onChange={handleInputChange('panNumber')}
                  size="small"
                />
              </FormField>
            </FormRow>
          </LeftSection>

          <RightSection>
            <ImageUploadSection>
              <SectionTitle>Update Profile image (JPEG/PNG, max {PROFILE_LOGO_MAX_SIZE_MB}MB)</SectionTitle>
              {imageError && (
                <Typography variant="caption" sx={{ color: 'error.main' }}>{imageError}</Typography>
              )}
              <AvatarContainer>
                <StyledAvatar
                  src={getDisplayImageUrl(profileImage) || undefined}
                  alt="Profile"
                  sx={{
                    backgroundColor: profileImage ? 'transparent' : '#e3f2fd',
                    fontSize: '40px',
                    fontWeight: 600,
                    color: '#1976d2',
                  }}
                >
                  {!profileImage && (profileData.firstName
                    ? profileData.firstName.charAt(0).toUpperCase()
                    : 'A')}
                </StyledAvatar>
                <EditIconButton onClick={handleProfileImageClick}>
                  <EditIcon sx={{ fontSize: '18px', color: '#ffffff' }} />
                </EditIconButton>
                <input
                  ref={profileImageInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  style={{ display: 'none' }}
                  onChange={handleProfileImageChange}
                />
              </AvatarContainer>
            </ImageUploadSection>

            <LogoContainer>
              <SectionTitle>Update your Logo (JPEG/PNG, max {PROFILE_LOGO_MAX_SIZE_MB}MB)</SectionTitle>
              {logoImage ? (
                <LogoImage src={getDisplayImageUrl(logoImage) || ''} alt="Shop Logo" />
              ) : (
                <Box sx={{ width: 160, height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="caption" color="textSecondary">No logo</Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', width: '100%', px: 2 }}>
                <Typography sx={{ fontSize: '13px', color: '#757575', fontWeight: 400 }}>
                  Upload new logo
                </Typography>
                <FileInputContainer>
                  <StyledTextField
                    fullWidth
                    placeholder="No file chosen"
                    value={logoFileName}
                    size="small"
                    InputProps={{
                      readOnly: true,
                    }}
                    sx={{
                      '& .MuiOutlinedInput-input': {
                        padding: '8px 12px',
                        fontSize: '13px',
                      }
                    }}
                  />
                  <BrowseButton onClick={handleLogoImageClick}>
                    Browse
                  </BrowseButton>
                </FileInputContainer>
                <input
                  ref={logoImageInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  style={{ display: 'none' }}
                  onChange={handleLogoImageChange}
                />
              </Box>
            </LogoContainer>

            <Box sx={{ mt: 2 }}>
              <SectionTitle>Invoice Terms &amp; Conditions</SectionTitle>
              <Typography sx={{ fontSize: '13px', color: '#757575', mb: 1 }}>
                Customise terms shown on invoices. Each jeweller can set their own.
              </Typography>
              <Button variant="outlined" size="small" onClick={openTermsModal}>
                Edit terms
              </Button>
            </Box>
          </RightSection>
        </DialogContent>

        <Dialog open={termsModalOpen} onClose={() => setTermsModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderBottom: '1px solid #e0e0e0', backgroundColor: '#fff' }}>
            <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#212121' }}>Invoice Terms &amp; Conditions</Typography>
            <IconButton size="small" onClick={() => setTermsModalOpen(false)} sx={{ color: '#757575' }}>
              <CloseIcon />
            </IconButton>
          </Box>
          <MuiDialogContent sx={{ pt: 2 }}>
            <FormField sx={{ mb: 2 }}>
              <FieldLabel>Terms section title</FieldLabel>
              <StyledTextField
                fullWidth
                size="small"
                value={termsEdit.title}
                onChange={(e) => setTermsEdit((t) => ({ ...t, title: e.target.value }))}
                placeholder="e.g. Terms and Conditions"
              />
            </FormField>
            <FormField sx={{ mb: 2 }}>
              <FieldLabel>Part 1 title (e.g. Product &amp; quality)</FieldLabel>
              <StyledTextField
                fullWidth
                size="small"
                value={termsEdit.part1Title}
                onChange={(e) => setTermsEdit((t) => ({ ...t, part1Title: e.target.value }))}
              />
            </FormField>
            <FormField sx={{ mb: 2 }}>
              <FieldLabel>Part 1 items (one per line)</FieldLabel>
              <StyledTextField
                fullWidth
                multiline
                rows={4}
                size="small"
                value={termsEdit.part1Items.join('\n')}
                onChange={(e) => setTermsEdit((t) => ({ ...t, part1Items: e.target.value.split('\n').filter(Boolean) }))}
                placeholder="One term per line"
              />
            </FormField>
            <FormField sx={{ mb: 2 }}>
              <FieldLabel>Part 2 title (e.g. Transaction &amp; policies)</FieldLabel>
              <StyledTextField
                fullWidth
                size="small"
                value={termsEdit.part2Title}
                onChange={(e) => setTermsEdit((t) => ({ ...t, part2Title: e.target.value }))}
              />
            </FormField>
            <FormField>
              <FieldLabel>Part 2 items (one per line)</FieldLabel>
              <StyledTextField
                fullWidth
                multiline
                rows={4}
                size="small"
                value={termsEdit.part2Items.join('\n')}
                onChange={(e) => setTermsEdit((t) => ({ ...t, part2Items: e.target.value.split('\n').filter(Boolean) }))}
                placeholder="One term per line"
              />
            </FormField>
          </MuiDialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
            <Button onClick={() => setTermsModalOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={saveTerms}>Save</Button>
          </DialogActions>
        </Dialog>

        <DialogFooter>
          <CancelButton onClick={handleCancel}>
            Cancel
          </CancelButton>
          <SubmitButton onClick={handleSubmit}>
            Submit
          </SubmitButton>
        </DialogFooter>
      </StyledDialog>

      <Snackbar
        open={showSuccess}
        autoHideDuration={2000}
        onClose={handleSuccessClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ mt: 8 }}
      >
        <Alert
          onClose={handleSuccessClose}
          severity="success"
          variant="filled"
          sx={{
            width: '100%',
            minWidth: '350px',
            backgroundColor: '#4caf50',
            color: '#ffffff',
            fontSize: '15px',
            fontWeight: 500,
            boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4)',
            '& .MuiAlert-icon': {
              color: '#ffffff',
            },
          }}
        >
          Profile updated successfully!
        </Alert>
      </Snackbar>
    </>
  );
};

export default ProfileDialog;