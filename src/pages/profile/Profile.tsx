import React, { useState, useRef, ChangeEvent, useEffect, useMemo } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import { apiClient } from '../../api';
import type { ProfileData } from '../../models/Profile';
import { STORAGE_COMPANY_LOGO, STORAGE_COMPANY_NAME, STORAGE_PROFILE_IMAGE } from '../../utils/uploadConstants';
import { getDisplayImageUrl } from '../../utils/registrationImageUrl';
import { API_ENDPOINTS } from '../../constants/common';
import { StyledDialog, DialogHeader, DialogContent, LeftSection, RightSection, FormRow, FormField, FieldLabel, StyledTextField, ImageUploadSection, SectionTitle, AvatarContainer, StyledAvatarWithProps, EditIconButton, LogoContainer, LogoImage, BrowseButton, FileInputContainer, DialogFooter, SaveButton, CancelButton, HeaderContainer, DialogTitle, HeaderRightSection, RoleText, CustomerIdBox, CloseButton, StyledEditIcon, HiddenInput, LogoUploadContainer, UploadText, LogoFileNameInput, } from './ProfileWidget';
import { useNotification } from '../../services/notificationService';
import LockIcon from '@mui/icons-material/Lock';
import Tooltip from '@mui/material/Tooltip';
import InputAdornment from '@mui/material/InputAdornment';
import { getProfileValidationSchema } from "./ProfileValidation";
import { useFormik } from 'formik';
import log from '../../utils/logger';

interface ProfileDialogProps {
  open: boolean;
  onClose: () => void;
}

const ProfileDialog: React.FC<ProfileDialogProps> = ({ open, onClose }) => {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const validationSchema = useMemo(
    () => getProfileValidationSchema(isSuperAdmin),
    [isSuperAdmin]
  );
  
  const formik = useFormik<ProfileData>({
    initialValues: {
      username: '',
      firstName: '',
      lastName: '',
      shopName: '',
      shopAddress: '',
      mobileNumber: '',
      email: '',
      panNumber: '',
      gstNumber: '',
      cgst: 0,
      sgst: 0,
      makingCharges: 0,
    },
    validationSchema,
    onSubmit: async (values) => {
      await handleSubmit(values);
    },
    enableReinitialize: true
  });

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [logoImage, setLogoImage] = useState<string>('/mainlogo.png');
  const [logoFileName, setLogoFileName] = useState<string>('');
  const [customerId, setCustomerId] = useState("");
  const { showSuccess } = useNotification();

  // Get user role and logged-in user info from localStorage
  const userRole =
    typeof window !== "undefined"
      ? localStorage.getItem("userRole")
      : null;

  const isSuperAdminFromStorage =
    userRole?.toLowerCase().trim() === "superadmin";

  const showCustomerId = isSuperAdmin;


  const loggedInEmail = typeof window !== 'undefined' ? localStorage.getItem('currentUserEmail') : null;
  const loggedInUsername = typeof window !== 'undefined' ? localStorage.getItem('currentUsername') : null;

  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const logoImageInputRef = useRef<HTMLInputElement>(null);

  // Prefill profile data based on logged-in user
  useEffect(() => {
    if (!open) return;

    const loadProfile = async () => {
      log.info("Profile called...");
      try {
        const username = localStorage.getItem("currentUsername");
        const email = localStorage.getItem("currentUserEmail");

        const response = await apiClient.get("/api/profile", {
          params: { username, email },
        });
        log.info("Profile fetched successfully");
        const { data, isSuperAdmin } = response.data;

        formik.setValues({
          username: data.username || "",
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          shopName: data.shopName || "",
          shopAddress: data.shopAddress || "",
          mobileNumber: data.phone || "",
          email: data.email || "",
          panNumber: data.panNumber || "",
          gstNumber: data.gstNumber || "",
          cgst: Number(data.cgst) || 0,
          sgst: Number(data.sgst) || 0,
          makingCharges: Number(data.makingCharges) || 0,
        });

        if (data.profilePicture) {
          localStorage.setItem(STORAGE_PROFILE_IMAGE, data.profilePicture);
        }
        setProfileImage(data.profilePicture || null);
        setLogoImage(data.logo || "/mainlogo.png");

        setIsSuperAdmin(isSuperAdmin);

        setCustomerId(data.customerId || "");
      } catch (err) {
        log.error("Failed to fetch profile:", err);
      }
    };

    loadProfile();
  }, [open]);


  const handleProfileImageClick = () => {
    profileImageInputRef.current?.click();
  };

  const handleProfileImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoImageClick = () => {
    logoImageInputRef.current?.click();
  };

  const handleLogoImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (values: ProfileData) => {

    const username = loggedInUsername || localStorage.getItem("currentUsername");
    const email = loggedInEmail || localStorage.getItem("currentUserEmail");

    if (profileImage) {
      localStorage.setItem(STORAGE_PROFILE_IMAGE, profileImage);
      window.dispatchEvent(new Event("profileImageUpdated"));
    }

    try {
      log.info("Updating profile...");
      const updatePayload: Record<string, unknown> = {
        username: values.username || username,
        email: values.email || email,
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.mobileNumber,
      };
      // send profile picture for ALL users
      updatePayload.profilePicture =
        profileImage?.startsWith('data:') ? profileImage : undefined;

      if (isSuperAdmin) {
        updatePayload.shopName = formik.values.shopName;
        updatePayload.shopAddress = formik.values.shopAddress;
        updatePayload.panNumber = formik.values.panNumber;
        updatePayload.gstNumber = formik.values.gstNumber;
        updatePayload.cgst = formik.values.cgst;
        updatePayload.sgst = formik.values.sgst;
        updatePayload.makingCharges = formik.values.makingCharges;
        updatePayload.logo =
          logoImage?.startsWith('data:') ? logoImage : undefined;
        updatePayload.isSuperAdmin = true;
      }
      await apiClient.put('/api/profile/update', updatePayload);
      if (isSuperAdmin) {
        if (formik.values.shopName) {
          localStorage.setItem(STORAGE_COMPANY_NAME, formik.values.shopName);
        }
        if (logoImage) {
          localStorage.setItem(STORAGE_COMPANY_LOGO, logoImage);
        }
        await apiClient.put(API_ENDPOINTS.SETTINGS_COMPANY, {
          companyLogo: logoImage?.startsWith('data:') ? logoImage : (localStorage.getItem(STORAGE_COMPANY_LOGO) || ''),
          companyName: formik.values.shopName || '',
        });
        window.dispatchEvent(new Event('profileOrLogoUpdated'));
        window.dispatchEvent(new Event('registrationUpdated'));
      }
    } catch (err) {
      log.error('Failed to update profile', err);
    }
    showSuccess('Profile updated successfully!');
    log.info('Profile updated successfully');
    onClose();
  };

  return (
    <>
      <StyledDialog open={open} onClose={onClose} maxWidth={false}>
        <DialogHeader>
          <HeaderContainer>
            <DialogTitle>Profile</DialogTitle>
            <HeaderRightSection>
              {showCustomerId && customerId && (
                <CustomerIdBox sx={{ marginRight: '50px' }}>
                  Customer ID: {customerId}
                </CustomerIdBox>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', color: 'white' }}>
                <div style={{ fontWeight: 500 }}>
                  {formik.values.username}
                </div>
                <RoleText>
                  {userRole || 'No Role'}
                </RoleText>
              </div>
              <CloseButton
                onClick={onClose}
                size="small"
              >
                <CloseIcon fontSize="small" />
              </CloseButton>
            </HeaderRightSection>
          </HeaderContainer>
        </DialogHeader>

        <DialogContent>
          <LeftSection>
            {isSuperAdmin ? (
              <>
                {/* Username - Read-only */}
                <FormField>
                  <FieldLabel>Username</FieldLabel>
                  <StyledTextField
                    fullWidth
                    placeholder="Enter username"
                    name="username"
                    value={formik.values.username}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    size="small"
                    error={ formik.touched.username && Boolean(formik.errors.username)}
                    helperText={ formik.touched.username && formik.errors.username}
                    InputProps={{
                      readOnly: true,
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Username cannot be edited">
                            <span style={{ display: 'inline-flex' }}>
                              <LockIcon fontSize="small" />
                            </span>
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                    sx={{ backgroundColor: '#e3f2fd' }}
                  />
                </FormField>

                <FormRow>
                  <FormField>
                    <FieldLabel>First Name</FieldLabel>
                    <StyledTextField
                      fullWidth
                      placeholder="Enter first name"
                      name="firstName"
                      value={formik.values.firstName}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      size="small"
                      error={ formik.touched.firstName && Boolean(formik.errors.firstName)}
                      helperText={ formik.touched.firstName && formik.errors.firstName}
                    />
                  </FormField>
                  <FormField>
                    <FieldLabel>Last Name</FieldLabel>
                    <StyledTextField
                      fullWidth
                      placeholder="Enter last name"
                      name="lastName"
                      value={formik.values.lastName}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      size="small"
                      error={ formik.touched.lastName && Boolean(formik.errors.lastName)}
                      helperText={ formik.touched.lastName && formik.errors.lastName}
                    />
                  </FormField>
                </FormRow>

                <FormField>
                  <FieldLabel>Shop Name</FieldLabel>
                  <StyledTextField
                    fullWidth
                    placeholder="Please enter your Shop name"
                    name="shopName"
                    value={formik.values.shopName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    size="small"
                    error={ formik.touched.shopName && Boolean(formik.errors.shopName)}
                    helperText={ formik.touched.shopName && formik.errors.shopName}
                  />
                </FormField>

                <FormField>
                  <FieldLabel>Shop Address</FieldLabel>
                  <StyledTextField
                    fullWidth
                    placeholder="Enter shop address"
                    name="shopAddress"
                    value={formik.values.shopAddress}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    multiline
                    rows={2}
                    error={ formik.touched.shopAddress && Boolean(formik.errors.shopAddress)}
                    helperText={ formik.touched.shopAddress && formik.errors.shopAddress}
                  />
                </FormField>

                <FormRow>
                  <FormField>
                    <FieldLabel>Phone/Mobile Number</FieldLabel>
                    <StyledTextField
                      fullWidth
                      placeholder="ex. 9821249596"
                      name="mobileNumber"
                      value={formik.values.mobileNumber}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      size="small"
                      error={ formik.touched.mobileNumber && Boolean(formik.errors.mobileNumber)}
                      helperText={ formik.touched.mobileNumber && formik.errors.mobileNumber}
                    />
                  </FormField>
                  <FormField>
                    <FieldLabel>Email</FieldLabel>
                    <StyledTextField
                      fullWidth
                      placeholder="ex. yourname@email.com"
                      name="email"
                      value={formik.values.email}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      size="small"
                      error={ formik.touched.email && Boolean(formik.errors.email)}
                      helperText={ formik.touched.email && formik.errors.email}
                    />
                  </FormField>
                </FormRow>

                <FormField>
                  <FieldLabel>PAN Number</FieldLabel>
                  <StyledTextField
                    fullWidth
                    placeholder="ex. ALWPG5809L"
                    name="panNumber"
                    value={formik.values.panNumber}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    size="small"
                    error={ formik.touched.panNumber && Boolean(formik.errors.panNumber)}
                    helperText={ formik.touched.panNumber && formik.errors.panNumber}
                  />
                </FormField>

                {/* GST Number - Read-only */}
                <FormField>
                  <FieldLabel>GST Number</FieldLabel>
                  <StyledTextField
                    fullWidth
                    placeholder="Enter GST number"
                    name="gstNumber"
                    value={formik.values.gstNumber}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    size="small"
                    error={ formik.touched.gstNumber && Boolean(formik.errors.gstNumber)}
                    helperText={ formik.touched.gstNumber && formik.errors.gstNumber}
                    InputProps={{
                      readOnly: true,
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="GST number cannot be edited">
                            <span style={{ display: 'inline-flex' }}>
                              <LockIcon fontSize="small" />
                            </span>
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                    sx={{ backgroundColor: '#e3f2fd' }}
                  />
                </FormField>

                <FormRow>
                  <FormField>
                    <FieldLabel>CGST</FieldLabel>
                    <StyledTextField
                      type="number"
                      fullWidth
                      placeholder="Enter CGST"
                      name="cgst"
                      value={formik.values.cgst === 0 ? '' : String(formik.values.cgst)}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      size="small"
                      error={ formik.touched.cgst && Boolean(formik.errors.cgst)}
                      helperText={ formik.touched.cgst && formik.errors.cgst}
                    />
                  </FormField>
                  <FormField>
                    <FieldLabel>SGST</FieldLabel>
                    <StyledTextField
                      type="number"
                      fullWidth
                      placeholder="Enter SGST"
                      name="sgst"
                      value={formik.values.sgst === 0 ? '' : String(formik.values.sgst)}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      size="small"
                      error={ formik.touched.sgst && Boolean(formik.errors.sgst)}
                      helperText={ formik.touched.sgst && formik.errors.sgst}
                    />
                  </FormField>
                </FormRow>

                <FormField>
                  <FieldLabel>Making Charges</FieldLabel>
                  <StyledTextField
                    type="number"
                    fullWidth
                    placeholder="Enter making charges"
                    name="makingCharges"
                    value={formik.values.makingCharges === 0 ? '' : String(formik.values.makingCharges)}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    size="small"
                    error={ formik.touched.makingCharges && Boolean(formik.errors.makingCharges)}
                    helperText={ formik.touched.makingCharges && formik.errors.makingCharges}
                  />
                </FormField>
              </>
            ) : (
              <>
                {/* Limited fields for non-super-admin */}
                <FormField>
                  <FieldLabel>Username</FieldLabel>
                  <StyledTextField
                    fullWidth
                    placeholder="Enter username"
                    name="username"
                    value={formik.values.username}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    size="small"
                    error={ formik.touched.username && Boolean(formik.errors.username)}
                    helperText={ formik.touched.username && formik.errors.username}
                    InputProps={{
                      readOnly: true,
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Username cannot be edited">
                            <span style={{ display: 'inline-flex' }}>
                              <LockIcon fontSize="small" />
                            </span>
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                    sx={{ backgroundColor: '#e3f2fd' }}
                  />
                </FormField>

                <FormRow>
                  <FormField>
                    <FieldLabel>First Name</FieldLabel>
                    <StyledTextField
                      fullWidth
                      placeholder="Enter first name"
                      name="firstName"
                      value={formik.values.firstName}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      size="small"
                      error={ formik.touched.firstName && Boolean(formik.errors.firstName)}
                      helperText={ formik.touched.firstName && formik.errors.firstName}
                    />
                  </FormField>
                  <FormField>
                    <FieldLabel>Last Name</FieldLabel>
                    <StyledTextField
                      fullWidth
                      placeholder="Enter last name"
                      name="lastName"
                      value={formik.values.lastName}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      size="small"
                      error={ formik.touched.lastName && Boolean(formik.errors.lastName)}
                      helperText={ formik.touched.lastName && formik.errors.lastName}
                    />
                  </FormField>
                </FormRow>

                <FormField>
                  <FieldLabel>Phone/Mobile Number</FieldLabel>
                  <StyledTextField
                    fullWidth
                    placeholder="ex. 9821249596"
                    name="mobileNumber"
                    value={formik.values.mobileNumber}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    size="small"
                    error={ formik.touched.mobileNumber && Boolean(formik.errors.mobileNumber)}
                    helperText={ formik.touched.mobileNumber && formik.errors.mobileNumber}
                  />
                </FormField>

                <FormField>
                  <FieldLabel>Email</FieldLabel>
                  <StyledTextField
                    fullWidth
                    placeholder="ex. yourname@email.com"
                    name="email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    size="small"
                    error={ formik.touched.email && Boolean(formik.errors.email)}
                    helperText={ formik.touched.email && formik.errors.email}
                  />
                </FormField>
              </>
            )}
          </LeftSection>

          <RightSection>
            <ImageUploadSection>
              <SectionTitle>Update Profile image</SectionTitle>
              <AvatarContainer>
                <StyledAvatarWithProps
                  src={getDisplayImageUrl(profileImage) || undefined}
                  alt="Profile"
                  hasImage={!!profileImage}
                >
                  {!profileImage && (formik.values.firstName
                    ? formik.values.firstName.charAt(0).toUpperCase()
                    : 'A')}
                </StyledAvatarWithProps>
                <EditIconButton onClick={handleProfileImageClick}>
                  <StyledEditIcon />
                </EditIconButton>
                <HiddenInput
                  ref={profileImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageChange}
                />
              </AvatarContainer>
            </ImageUploadSection>

            {isSuperAdmin && (
              <LogoContainer>
                <SectionTitle>Update your Logo</SectionTitle>
                <LogoImage src={getDisplayImageUrl(logoImage) || ''} alt="Shop Logo" />
                <LogoUploadContainer>
                  <UploadText>
                    Upload new logo
                  </UploadText>
                  <FileInputContainer>
                    <LogoFileNameInput
                      fullWidth
                      placeholder="No file chosen"
                      value={logoFileName}
                      size="small"
                      InputProps={{
                        readOnly: true,
                      }}
                    />
                    <BrowseButton onClick={handleLogoImageClick}>
                      Browse
                    </BrowseButton>
                  </FileInputContainer>
                  <HiddenInput
                    ref={logoImageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoImageChange}
                  />
                </LogoUploadContainer>
              </LogoContainer>
            )}
          </RightSection>
        </DialogContent>

        <DialogFooter>
          <CancelButton onClick={onClose}>
            Cancel
          </CancelButton>
          <SaveButton onClick={() => formik.handleSubmit()}>
            Save
          </SaveButton>
        </DialogFooter>
      </StyledDialog>
    </>
  );
};

export default ProfileDialog;