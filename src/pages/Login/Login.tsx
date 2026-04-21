import React, { useState, useEffect } from 'react';
import { Box, IconButton, InputAdornment } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { Formik, Form, Field, FormikHelpers } from 'formik';
import iconSunarKhata from '../../assests/icons/mainlogo.png';
import { LoginContainer, LoginCard, TopSection, FormSection, WelcomeText, WelcomeLine, RegisterLine, ForgotPasswordLink, SignInTitle, FormField, SubmitButton, LinksContainer, LinkText, ErrorMessage, BackgroundImage, LogoImageContainer } from './LoginWidgets';
import { validationSchema } from './LoginValidation';
import Registration from './Registration';
import { apiClient } from '../../api';
import { LoginProps, LoginFormValues, ViewType } from '../../models/login';
import ChangePasswordDialog from '../../components/ChangePassword';
import log from '../../utils/logger';

// Background images (placeholder URLs - replace with actual jewelry images)
const backgroundImages = [
  '/login1.png',
  '/login2.svg',
  '/login3.svg',
];

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [currentView, setCurrentView] = useState<ViewType>('login');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showRegistration, setShowRegistration] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotDialog, setShowForgotDialog] = useState(false);

  // Rotate background images every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const loginInitialValues: LoginFormValues = {
    username: '',
    password: '',
  };

  const handleLoginSubmit = async (
    values: LoginFormValues,
    { setFieldError }: FormikHelpers<LoginFormValues>
  ) => {
    log.info("Logging in...");
    try {
      // Fetch users from API to find the logged-in user
      // Use high limit to get all users for login validation
      const response = await apiClient.post('/api/login/login', {
        username: values.username,
        password: values.password,
      });
      log.info("Login response fetched successfully");
      const user = response.data.user;

      if (user) {
        // Store token immediately so subsequent API calls (roles, users) are authenticated
        if (response.data.token) {
          localStorage.setItem('authToken', response.data.token);
        }

        // Check if user status is Inactive
        if (user.status === 'Inactive') {
          setFieldError('username', 'Your account is inactive. Contact Super Admin.');
          return;
        }

        // Check if user has no role assigned and superAdmin exists
        const hasNoRole = !user.roles || user.roles.length === 0;
        if (hasNoRole) {
          try {
            // Fetch all users to check if superAdmin exists
            const usersResponse = await apiClient.get('/api/users', {
              params: { page: 1, limit: 10000 },
            });
            const usersData = usersResponse.data?.users || [];
            
            // Check if any user has superAdmin role
            const superAdminExists = usersData.some((u: any) => {
              if (u.roles && u.roles.length > 0) {
                const roleName = u.roles[0].role?.toLowerCase();
                return roleName === 'superadmin' || roleName === 'super admin';
              }
              return false;
            });

            if (superAdminExists) {
              setFieldError('username', 'No role assigned to you. Please contact Super Admin.');
              return;
            }
          } catch (error) {
            log.error('Error checking for superAdmin:', error);
            // Continue with login if check fails (don't block login due to API error)
          }
        }

        // Check if user's assigned role exists and is active
        if (user.roles && user.roles.length > 0) {
          const userRoleName = user.roles[0].role;

          // Fetch roles to check role status
          try {
            const rolesResponse = await apiClient.get('/api/roles');
            const rolesData = Array.isArray(rolesResponse.data) ? rolesResponse.data : [];
            const matchedRole = rolesData.find((r: any) => r.role === userRoleName);

            // Check if the assigned role has been deleted (doesn't exist in roles.json)
            if (!matchedRole) {
              setFieldError('username', 'Your assigned role has been deleted. Please contact Super Admin.');
              return;
            }

            // Check if the assigned role is inactive
            if (matchedRole.status === 'INACTIVE') {
              setFieldError('username', 'Your assigned role is currently inactive. Please contact the Super Admin.');
              return;
            }
          } catch (error) {
            log.error('Error fetching roles during login:', error);
            // Continue with login if roles fetch fails (don't block login due to API error)
          }
        }

        // Store user role and session in localStorage
        localStorage.removeItem('userRole');
        localStorage.removeItem('currentUserRole');

        let roleFromDB = '';

        if (user.roles && user.roles.length > 0) {
          roleFromDB = user.roles[0].role;
        }
        
        // If user has no role assigned, set to "No Role Assigned" so roleAccess.ts can grant access
        // This allows users to access all pages when no superAdmin exists
        if (!roleFromDB || roleFromDB.trim() === '') {
          roleFromDB = 'No Role Assigned';
        }
        
        // Normalize Super Admin casing/spacing to single canonical value
        if (roleFromDB === 'Super Admin') {
          roleFromDB = 'superAdmin';
        }

        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userRole', roleFromDB);
        localStorage.setItem('currentUserRole', roleFromDB);
        localStorage.setItem('userEmail', user.email || '');
        localStorage.setItem('currentUserId', user.id.toString());
        localStorage.setItem('currentUserEmail', user.email || '');
        localStorage.setItem('currentUsername', user.username || values.username);
        if (response.data.token) {
          localStorage.setItem('authToken', response.data.token);
        }
        // Notify App (and other listeners) so currentRole state updates before navigation
        window.dispatchEvent(new Event('userRoleUpdated'));
        onLogin();
      } else {
        setFieldError('username', 'Login failed. Invalid response from server.');
      }
    } catch (error: any) {
      log.error('Error during login:', error);
      const backendErrorMessage = error?.response?.data?.error;
      if (backendErrorMessage) {
        const errorMessageLower = backendErrorMessage.toLowerCase();
        if (errorMessageLower.includes('password')) {
          setFieldError('password', backendErrorMessage);
        } else {
          setFieldError('username', backendErrorMessage);
        }
      } else {
        setFieldError('username', 'Login failed. Please try again.');
      }
    }
  };


  const renderLogin = () => (
    <>
      <TopSection>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '10px' }}>
          <WelcomeLine className="left" />
          <WelcomeText sx={{ marginBottom: '0px', '&::before, &::after': { display: 'none' } }}>
            WELCOME TO
          </WelcomeText>
          <WelcomeLine className="right" />
        </Box>

        <LogoImageContainer>
          <img src={iconSunarKhata} alt="Sunarkhata Logo" />
        </LogoImageContainer>
        <SignInTitle>Sign in to your Account</SignInTitle>
      </TopSection>

      <FormSection>
        <Formik
          initialValues={loginInitialValues}
          validationSchema={validationSchema}
          onSubmit={handleLoginSubmit}
        >
          {({ errors, touched, isSubmitting }) => (
            <Form>
              <Field
                name="username"
                as={FormField}
                fullWidth
                label="Username"
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
                <ErrorMessage>{errors.username}</ErrorMessage>
              )}

              <Field
                name="password"
                as={FormField}
                fullWidth
                label="Password"
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
                        {showPassword ? (
                          <VisibilityOff sx={{ fontSize: '18px' }} />
                        ) : (
                          <Visibility sx={{ fontSize: '18px' }} />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              {touched.password && errors.password && (
                <ErrorMessage>{errors.password}</ErrorMessage>
              )}
              <ForgotPasswordLink onClick={() => setShowForgotDialog(true)}>
                Forgot Password?
              </ForgotPasswordLink>

              <SubmitButton fullWidth type="submit" disabled={isSubmitting}>
                Submit

              </SubmitButton>

            </Form>
          )}
        </Formik>

        <LinksContainer>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <RegisterLine className="left" />
            <LinkText onClick={() => setShowRegistration(true)}>Register</LinkText>
            <RegisterLine className="right" />
          </Box>
        </LinksContainer>
      </FormSection>
    </>
  );


  return (
    <LoginContainer>
      {/* Rotating Background Images */}
      {backgroundImages.map((image, index) => (
        <BackgroundImage
          key={index}
          isActive={index === currentImageIndex}
          style={{ backgroundImage: `url(${image})` }}
        />
      ))}

      <LoginCard>
        {currentView === 'login' && renderLogin()}
      </LoginCard>

      <ChangePasswordDialog
        open={showForgotDialog}
        onClose={() => setShowForgotDialog(false)}
        userId={0}
        mode="forgot"
      />

      <Registration
        open={showRegistration}
        onClose={() => setShowRegistration(false)}
        onRegisterComplete={() => {
          setShowRegistration(false);
          onLogin();
        }}
      />
    </LoginContainer>
  );
};

export default Login;