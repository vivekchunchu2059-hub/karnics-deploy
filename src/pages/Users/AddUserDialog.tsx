import React, { useState, ChangeEvent } from 'react';
import { Box, DialogContent, DialogActions, IconButton, Alert, InputAdornment } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { StyledDialog, DialogTitleStyled, FormField, SaveButton, CancelButton, FormRow } from './UserWidget';
import { userValidationSchema } from './userValidation';
import { type UserFormData } from '../../models/user';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useFormik } from 'formik';

interface AddUserDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (userData: UserFormData) => Promise<void>;
  isSuperAdmin: boolean;
  superAdminCount: number;
}

const AddUserDialog: React.FC<AddUserDialogProps> = ({
  open,
  onClose,
  onSave,
  isSuperAdmin,
  superAdminCount,
}) => {
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const formik = useFormik<UserFormData>({
    initialValues: {
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  },
  validationSchema: userValidationSchema,
  onSubmit: async (values) => {
    if (!isSuperAdmin) {
      setShowError(true);
      setErrorMessage('Only Super Admin can create users');
      return;
    }

    setSaving(true);
    setShowError(false);

    try {
      await onSave({
        ...values,
        username: values.username.trim(),
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
      });
      formik.resetForm();
      onClose();
    } catch (err: any) {
      setShowError(true);
      setErrorMessage(
        err?.response?.data?.error ||
        err?.message ||
        'Failed to add user.'
      );
    } finally {
      setSaving(false);
    }
  },
});

  return (
    <StyledDialog open={open} onClose={onClose}>
      <DialogTitleStyled>
        Add User
        <IconButton onClick={onClose} sx={{ color: 'rgba(255, 255, 255, 0.9)', padding: '4px' }} >
          <CloseIcon />
        </IconButton>
      </DialogTitleStyled>

      <DialogContent>
        {showError && <Alert severity="error">{errorMessage}</Alert>}

        {!isSuperAdmin && ( 
          <Alert severity="warning" sx={{ mb: 2 }}> Only Super Admin can create users </Alert> )} 
          
        {isSuperAdmin && superAdminCount >= 1 && (
          <Alert severity="info">Maximum of 1 Super Admin users allowed. Currently: {superAdminCount}/1</Alert>
        )}

        <Box component="form" onSubmit={formik.handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <FormField
            fullWidth
            label="Username *"
            name="username"
            placeholder="Enter username"
            value={formik.values.username}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={ formik.touched.username && Boolean(formik.errors.username)}
            helperText={ formik.touched.username && formik.errors.username}
          />

          <FormRow>
            <FormField
              fullWidth
              label="First Name *"
              name="firstName"
              placeholder="Enter first name"
              value={formik.values.firstName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={ formik.touched.firstName && Boolean(formik.errors.firstName)}
              helperText={ formik.touched.firstName && formik.errors.firstName}
            />
            <FormField
              fullWidth
              label="Last Name *"
              name="lastName"
              placeholder="Enter last name"
              value={formik.values.lastName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={ formik.touched.lastName && Boolean(formik.errors.lastName)}
              helperText={ formik.touched.lastName && formik.errors.lastName}
            />
          </FormRow>

          <FormRow>
            <FormField
              fullWidth
              type="email"
              label="Email *"
              name="email"
              placeholder="Enter email address"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={ formik.touched.email && Boolean(formik.errors.email)}
              helperText={ formik.touched.email && formik.errors.email}
            />
            <FormField
              fullWidth
              label="Phone Number *"
              name="phone"
              placeholder="Enter phone number (10 digits)"
              value={formik.values.phone}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={ formik.touched.phone && Boolean(formik.errors.phone)}
              helperText={ formik.touched.phone && formik.errors.phone}
              inputProps={{ maxLength: 10 }}
            />
          </FormRow>

          <FormRow>
            <FormField
              fullWidth
              type={showPassword ? 'text' : 'password'}
              label="Password *"
              name="password"
              placeholder="Enter password (min 8 characters)"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              onCopy={(e: React.ClipboardEvent<HTMLInputElement>) => e.preventDefault()}
              onCut={(e: React.ClipboardEvent<HTMLInputElement>) => e.preventDefault()}
              onPaste={(e: React.ClipboardEvent<HTMLInputElement>) => e.preventDefault()}
              error={ formik.touched.password && Boolean(formik.errors.password)}
              helperText={ formik.touched.password && formik.errors.password}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <FormField
              fullWidth
              type={showConfirmPassword ? 'text' : 'password'}
              label="Confirm Password *"
              name="confirmPassword"
              placeholder="Confirm password"
              value={formik.values.confirmPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              onCopy={(e: React.ClipboardEvent<HTMLInputElement>) => e.preventDefault()}
              onCut={(e: React.ClipboardEvent<HTMLInputElement>) => e.preventDefault()}
              onPaste={(e: React.ClipboardEvent<HTMLInputElement>) => e.preventDefault()}
              error={ formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
              helperText={ formik.touched.confirmPassword && formik.errors.confirmPassword}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                      size="small"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </FormRow>

          <DialogActions sx={{ padding: 0, justifyContent: 'flex-end', gap: 1.5, mt: 1 }}>
            <CancelButton onClick={onClose}>Cancel</CancelButton>
            <SaveButton type="submit" disabled={!isSuperAdmin || saving}>
              {saving ? 'Saving…' : 'Submit'}
            </SaveButton>
          </DialogActions>
        </Box>
      </DialogContent>
    </StyledDialog>
  );
};

export default AddUserDialog;
