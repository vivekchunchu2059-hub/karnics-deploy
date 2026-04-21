import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Dialog, IconButton, InputAdornment } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import BusinessIcon from '@mui/icons-material/Business';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { Formik, Form, Field, FormikHelpers } from 'formik';
import iconSunarKhata from '../../assests/icons/mainlogo.png';
import { RegistrationModalContainer, RegistrationModalHeader, RegistrationModalTitle, RegistrationCloseButton, RegistrationFormRow, RegistrationFormColumn, RegistrationFormField, FileUploadContainer, FileUploadLabel, FileUploadBox, FileUploadButton, RegistrationButtonContainer, RegistrationSubmitButton, RegistrationCancelButton, IconContainer, SectionHeader, RegistrationDivider } from './LoginWidgets';
import { registerValidationSchema } from './registrationValidation';
import { RegisterFormValues, RegistrationProps, RegistrationViewType } from '../../models/Registration';
import RegistrationPopup from "../../components/popup/RegistrationPopup";
import { handleRegisterWithCustomerId } from './registrationHandler';

const Registration: React.FC<RegistrationProps> = ({ open, onClose, onRegisterComplete }) => {
  const navigate = useNavigate();
  const [currentView] = useState<RegistrationViewType>('register');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [popupOpen, setPopupOpen] = useState(false);
  const [popupType, setPopupType] = useState<"customer" | "server" | "success" | "missingFields" | "noCustomerId" | "customerIdBadRequest" | "duplicateCustomer" | "duplicateGst" | "ipAddressError" | "serviceUnavailable" | null>(null);
  const [generatedCustomerId, setGeneratedCustomerId] = useState<string | null>(null);

  const registerInitialValues: RegisterFormValues = {
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    shopName: '',
    shopAddress: '',
    mobileNumber: '',
    email: '',
    makingCharges: 0,
    cgst: 0,
    sgst: 0,
    gstNumber: '',
    panNumber: '',
    logo: null,
    profilePicture: null,
  };


  // Wrapper function to call the extracted registration handler
  const handleRegistration = async (
    values: RegisterFormValues,
    formikHelpers: FormikHelpers<RegisterFormValues>
  ) => {
    await handleRegisterWithCustomerId(values, formikHelpers, {
      setPopupType,
      setPopupOpen,
      setGeneratedCustomerId,
    });
  };

  const handleNumericInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: string,
    setFieldValue: any
  ) => {
    const value = e.target.value;
    // Allow only numeric values and decimal point: /^[0-9]*\.?[0-9]*$/
    if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
      setFieldValue(fieldName, value);
    }
  };

  const handleClose = () => {
    // setCurrentView('register');
    onClose();
  };

  const renderRegister = () => (
    <Dialog 
      open={open && currentView === 'register'} 
      maxWidth="lg" 
      fullWidth
      onClose={handleClose}
      PaperProps={{
        sx: {
          borderRadius: '16px',
          padding: '0',
          maxWidth: '1000px',
        }
      }}
    >
      <RegistrationModalContainer>
        <RegistrationModalHeader>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <img src={iconSunarKhata} alt="Sunarkhata Logo" style={{ width: '40px', height: '40px' }} />
            <RegistrationModalTitle>SunarKhata</RegistrationModalTitle>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Typography sx={{ fontSize: '18px', fontWeight: 500, color: '#ffffff' }}>
              User Registration
            </Typography>
            <RegistrationCloseButton onClick={handleClose}>
              <CloseIcon />
            </RegistrationCloseButton>
          </Box>
        </RegistrationModalHeader>

        <Formik
          initialValues={registerInitialValues}
          validationSchema={registerValidationSchema}
          onSubmit={handleRegistration}
        >
          {({ errors, touched, isSubmitting, setFieldValue, values }) => (
            <Form>
              <RegistrationFormRow>
                {/* Left Column */}
                <RegistrationFormColumn>
                  <SectionHeader>
                    <IconContainer>
                      <PersonIcon />
                    </IconContainer>
                  </SectionHeader>

                  <Box>
                    <Field
                      name="username"
                      as={RegistrationFormField}
                      fullWidth
                      label="Create Username"
                      placeholder="Please enter your username"
                      error={touched.username && !!errors.username}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                    {touched.username && errors.username && (
                      <Typography sx={{ fontSize: '11px', color: '#ff6b6b', marginTop: '4px' }}>
                        {errors.username}
                      </Typography>
                    )}
                  </Box>

                  <Box>
                    <Field
                      name="password"
                      as={RegistrationFormField}
                      fullWidth
                      label="Create Password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Please enter your password"
                      onCopy={(e: React.ClipboardEvent<HTMLInputElement>) => e.preventDefault()}
                      onCut={(e: React.ClipboardEvent<HTMLInputElement>) => e.preventDefault()}
                      onPaste={(e: React.ClipboardEvent<HTMLInputElement>) => e.preventDefault()}
                      error={touched.password && !!errors.password}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon sx={{ fontSize: '18px' }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                              sx={{ color: '#9e9e9e', padding: '4px' }}
                              size="small"
                            >
                              {showPassword ? <VisibilityOff sx={{ fontSize: '18px' }} /> : <Visibility sx={{ fontSize: '18px' }} />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                    {touched.password && errors.password && (
                      <Typography sx={{ fontSize: '11px', color: '#ff6b6b', marginTop: '4px' }}>
                        {errors.password}
                      </Typography>
                    )}
                  </Box>

                  <Box>
                    <Field
                      name="confirmPassword"
                      as={RegistrationFormField}
                      fullWidth
                      label="Confirm Password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Please confirm your password"
                      onCopy={(e: React.ClipboardEvent<HTMLInputElement>) => e.preventDefault()}
                      onCut={(e: React.ClipboardEvent<HTMLInputElement>) => e.preventDefault()}
                      onPaste={(e: React.ClipboardEvent<HTMLInputElement>) => e.preventDefault()}
                      error={touched.confirmPassword && !!errors.confirmPassword}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon sx={{ fontSize: '18px' }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              edge="end"
                              sx={{ color: '#9e9e9e', padding: '4px' }}
                              size="small"
                            >
                              {showConfirmPassword ? <VisibilityOff sx={{ fontSize: '18px' }} /> : <Visibility sx={{ fontSize: '18px' }} />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                    {touched.confirmPassword && errors.confirmPassword && (
                      <Typography sx={{ fontSize: '11px', color: '#ff6b6b', marginTop: '4px' }}>
                        {errors.confirmPassword}
                      </Typography>
                    )}
                  </Box>
                </RegistrationFormColumn>

                {/* Dashed Divider */}
                <RegistrationDivider />

                {/* Right Column */}
                <RegistrationFormColumn>
                  <SectionHeader>
                    <IconContainer>
                      <BusinessIcon />
                    </IconContainer>
                  </SectionHeader>

                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <Box>
                      <Field
                        name="firstName"
                        as={RegistrationFormField}
                        fullWidth
                        label="First Name"
                        placeholder=""
                        error={touched.firstName && !!errors.firstName}
                      />
                      {touched.firstName && errors.firstName && (
                        <Typography sx={{ fontSize: '11px', color: '#ff6b6b', marginTop: '4px' }}>
                          {errors.firstName}
                        </Typography>
                      )}
                    </Box>
                    <Box>
                      <Field
                        name="lastName"
                        as={RegistrationFormField}
                        fullWidth
                        label="Last Name"
                        placeholder=""
                        error={touched.lastName && !!errors.lastName}
                      />
                      {touched.lastName && errors.lastName && (
                        <Typography sx={{ fontSize: '11px', color: '#ff6b6b', marginTop: '4px' }}>
                          {errors.lastName}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  <Box>
                    <Field
                      name="shopName"
                      as={RegistrationFormField}
                      fullWidth
                      label="Shop Name"
                      placeholder="Please enter your Shop name"
                      error={touched.shopName && !!errors.shopName}
                    />
                    {touched.shopName && errors.shopName && (
                      <Typography sx={{ fontSize: '11px', color: '#ff6b6b', marginTop: '4px' }}>
                        {errors.shopName}
                      </Typography>
                    )}
                  </Box>

                  <Box>
                    <Field
                      name="shopAddress"
                      as={RegistrationFormField}
                      fullWidth
                      label="Shop Address"
                      placeholder=""
                      multiline
                      rows={2}
                      error={touched.shopAddress && !!errors.shopAddress}
                    />
                    {touched.shopAddress && errors.shopAddress && (
                      <Typography sx={{ fontSize: '11px', color: '#ff6b6b', marginTop: '4px' }}>
                        {errors.shopAddress}
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <Box>
                      <Field
                        name="mobileNumber"
                        as={RegistrationFormField}
                        fullWidth
                        label="Phone/Mobile Number"
                        placeholder="ex. 9821249596"
                        error={touched.mobileNumber && !!errors.mobileNumber}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PhoneIcon />
                            </InputAdornment>
                          ),
                        }}
                      />
                      {touched.mobileNumber && errors.mobileNumber && (
                        <Typography sx={{ fontSize: '11px', color: '#ff6b6b', marginTop: '4px' }}>
                          {errors.mobileNumber}
                        </Typography>
                      )}
                    </Box>
                    <Box>
                      <Field
                        name="email"
                        as={RegistrationFormField}
                        fullWidth
                        label="Email"
                        placeholder="ex. yourname@email.com"
                        error={touched.email && !!errors.email}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <EmailIcon />
                            </InputAdornment>
                          ),
                        }}
                      />
                      {touched.email && errors.email && (
                        <Typography sx={{ fontSize: '11px', color: '#ff6b6b', marginTop: '4px' }}>
                          {errors.email}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <Box>
                      <Field
                        name="makingCharges"
                        as={RegistrationFormField}
                        fullWidth
                        label="Making Charges"
                        placeholder="ex. 3000"
                        value={values.makingCharges === 0 ? '' : String(values.makingCharges)}
                        error={touched.makingCharges && !!errors.makingCharges}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                          handleNumericInputChange(e, 'makingCharges', setFieldValue)
                        }
                        inputProps={{ inputMode: 'decimal' }}
                      />
                      {touched.makingCharges && errors.makingCharges && (
                        <Typography sx={{ fontSize: '11px', color: '#ff6b6b', marginTop: '4px' }}>
                          {errors.makingCharges}
                        </Typography>
                      )}
                    </Box>
                    <Box>
                      <Field
                        name="gstNumber"
                        as={RegistrationFormField}
                        fullWidth
                        label="GST Number"
                        placeholder="ex. 27ABCDE1234F1Z5"
                        error={touched.gstNumber && !!errors.gstNumber}
                      />
                      {touched.gstNumber && errors.gstNumber && (
                        <Typography sx={{ fontSize: '11px', color: '#ff6b6b', marginTop: '4px' }}>
                          {errors.gstNumber}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <Box>
                      <Field
                        name="cgst"
                        as={RegistrationFormField}
                        fullWidth
                        label="CGST"
                        placeholder="ex. 1.5"
                        value={values.cgst === 0 ? '' : String(values.cgst)}
                        error={touched.cgst && !!errors.cgst}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                          handleNumericInputChange(e, 'cgst', setFieldValue)
                        }
                        InputProps={{
                          inputProps: { inputMode: 'decimal' },
                          endAdornment: (
                            <InputAdornment position="end">
                              %
                            </InputAdornment>
                          ),
                        }}
                      />
                      {touched.cgst && errors.cgst && (
                        <Typography sx={{ fontSize: '11px', color: '#ff6b6b', marginTop: '4px' }}>
                          {errors.cgst}
                        </Typography>
                      )}
                    </Box>
                    <Box>
                      <Field
                        name="sgst"
                        as={RegistrationFormField}
                        fullWidth
                        label="SGST"
                        placeholder="ex. 1.5"
                        value={(values.sgst === 0 || (typeof values.sgst === 'string' && values.sgst === '')) ? '' : String(values.sgst)}
                        error={touched.sgst && !!errors.sgst}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                          handleNumericInputChange(e, 'sgst', setFieldValue)
                        }
                        InputProps={{
                          inputProps: { inputMode: 'decimal' },
                          endAdornment: (
                            <InputAdornment position="end">
                              %
                            </InputAdornment>
                          ),
                        }}
                      />
                      {touched.sgst && errors.sgst && (
                        <Typography sx={{ fontSize: '11px', color: '#ff6b6b', marginTop: '4px' }}>
                          {errors.sgst}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  <Box>
                    <Field
                      name="panNumber"
                      as={RegistrationFormField}
                      fullWidth
                      label="PAN Number"
                      placeholder="ex. ALWPG5809L"
                      error={touched.panNumber && !!errors.panNumber}
                    />
                    {touched.panNumber && errors.panNumber && (
                      <Typography sx={{ fontSize: '11px', color: '#ff6b6b', marginTop: '4px' }}>
                        {errors.panNumber}
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <FileUploadContainer>
                      <FileUploadLabel>Upload Logo</FileUploadLabel>
                      <FileUploadBox 
                        onClick={() => document.getElementById('logo-upload')?.click()}
                      >
                        <Typography sx={{ fontSize: '13px', color: values.logo ? '#2c2c2c' : '#b0b0b0' }}>
                          {values.logo ? values.logo.name : ''}
                        </Typography>
                        <FileUploadButton>Browse</FileUploadButton>
                      </FileUploadBox>
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setFieldValue('logo', e.target.files[0]);
                          }
                        }}
                      />
                    </FileUploadContainer>

                    <FileUploadContainer>
                      <FileUploadLabel>Upload Profile Picture</FileUploadLabel>
                      <FileUploadBox 
                        onClick={() => document.getElementById('profile-upload')?.click()}
                      >
                        <Typography sx={{ fontSize: '13px', color: values.profilePicture ? '#2c2c2c' : '#b0b0b0' }}>
                          {values.profilePicture ? values.profilePicture.name : ''}
                        </Typography>
                        <FileUploadButton>Browse</FileUploadButton>
                      </FileUploadBox>
                      <input
                        id="profile-upload"
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setFieldValue('profilePicture', e.target.files[0]);
                          }
                        }}
                      />
                    </FileUploadContainer>
                  </Box>
                </RegistrationFormColumn>
              </RegistrationFormRow>

              <RegistrationButtonContainer>
                <RegistrationCancelButton type="button" onClick={handleClose}>
                  Cancel
                </RegistrationCancelButton>
                <RegistrationSubmitButton type="submit" disabled={isSubmitting}>
                  Submit
                </RegistrationSubmitButton>
              </RegistrationButtonContainer>
            </Form>
          )}
        </Formik>
      </RegistrationModalContainer>
    </Dialog>
  );



  return (
    <>
      {open && renderRegister()}
      
      <RegistrationPopup
        open={popupOpen}
        type={popupType}
        customerId={generatedCustomerId}
        onClose={() => {
          const currentPopupType = popupType;
        
          setPopupOpen(false);
        
          setTimeout(() => {
            setPopupType(null);
          }, 250);
        
          if (currentPopupType === "success") {
            onClose();
          }
        }}
      />
    </>
  );
};

export default Registration;