import React, { useState, ChangeEvent } from 'react';
import { Box, DialogContent, DialogActions, IconButton, Divider, InputAdornment, Alert, Snackbar, } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { apiClient } from '../api';
import { passwordRegex, usernameRegex } from '../utils/regex';
import { StyledDialog, DialogTitleStyled, FormField as UserFormField, SaveButton, CancelButton } from '../pages/Users/UserWidget';
import { FormSection, FormField as LoginFormField } from '../pages/Login/LoginWidgets';
import log from '../utils/logger';

interface ChangePasswordDialogProps {
    open: boolean;
    onClose: () => void;
    userId: number;
    mode: "change" | "forgot";
}

const ChangePasswordDialog: React.FC<ChangePasswordDialogProps> = ({
    open,
    onClose,
    userId,
    mode,
}) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [customerId, setCustomerId] = useState('');
    const [step, setStep] = useState<'verify' | 'reset'>('verify');
    const [username, setUsername] = useState('');
    const [successOpen, setSuccessOpen] = useState(false);

    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // 🔹 Frontend validations
        if (mode === "forgot" && step === 'verify') {
            if (!username || !customerId) {
                setError('All fields are required');
                return;
            }
            if (!usernameRegex.test(username)) {
                setError('Username can contain only letters, numbers, ".", "_" or "-"');
                return;
            }
        }
        if (mode === "change" && !currentPassword) {
            setError('All fields are required');
            return;
          }
          
          if ((mode === "change" || (mode === "forgot" && step === 'reset')) &&
              (!newPassword || !confirmPassword)) {
            setError('All fields are required');
            return;
          }
          
        if (mode === "change" || (mode === "forgot" && step === 'reset')) {
            if (!passwordRegex.test(newPassword)) {
                setError(
                    'Password must contain at least 8 characters: uppercase, lowercase, number, and a symbol (e.g. @ # ! $), no spaces'
                );
                return;
            }

            if (newPassword !== confirmPassword) {
                setError('New password and confirm password do not match');
                return;
            }
        }

        try {
            if (mode === "change") {
                log.info('Password change initiated...');
                const response = await apiClient.post(
                    '/api/users/change-password',
                    { userId, currentPassword, newPassword }
                );
                if (response.data?.success) {
                    log.info('Password change successful');
                    setSuccessOpen(true);
                    handleClose();
                }
            } else if (mode === "forgot") {
                if (step === 'verify') {
                    log.info('Forgot password verification initiated...');
                    const response = await apiClient.post(
                        '/api/users/forgot-password',
                        { username, customerId }
                    );
                    if (response.data?.success) {
                        log.info('Forgot password verification successful');
                        setStep('reset');
                        return;
                    }
                } else {
                    log.info('Forgot password reset initiated...');
                    const response = await apiClient.post(
                        '/api/users/forgot-password',
                        { username, customerId, newPassword }
                    );

                    if (response.data?.success) {
                        log.info('Forgot password reset successful');
                        setSuccessOpen(true);
                        handleClose();
                    }
                }
            }

        } catch (err: any) {
            log.error('Password change failed:', err);
            if (err.response?.data?.error) {
                setError(err.response.data.error);
            }
            else if (err.request) {
                setError('Unable to connect to server');
            }
            else {
                setError('Something went wrong');
            }
        }
    };


    const handleClose = () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setCustomerId('');
        setUsername('');
        setStep('verify');
        setError('');
        onClose();
    };

    return (
        <>
            <StyledDialog open={open} 
            onClose={handleClose}
            PaperProps={{
                sx: mode === "forgot" ? {
                    background: 'rgba(89, 12, 22, 1)',
                    border: '1px solid rgba(89, 12, 22, 0.8)',
                    color: '#ffffff',
                } : {}
            }}
            >
                {/* Title */}
                <DialogTitleStyled
                    sx={mode === "forgot" ? {
                        fontWeight: 500,
                        color: '#ffffff',
                    } : {}}
                >
                    {mode === "change" ? "Change Password" : "Forgot Password"}
                    <IconButton
                        onClick={handleClose}
                        edge="end"
                        size="small"
                        sx={{
                            opacity: 0.8,
                            color: mode === "forgot" ? "#ffffff" : "inherit",
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitleStyled>

                <Divider sx={{ borderColor: 'rgba(0, 0, 0, 0.12)' }} />

                <DialogContent sx={{ padding: mode === "forgot" ? '0' : '24px' }}>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {mode === "forgot" ? (
                        <FormSection>
                            <form
                                onSubmit={handleSubmit}
                                style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
                            >
                            {mode === "forgot" && step === 'verify' && (
                              <>
                                <Box sx={{ fontSize: '14px', color: '#ffffff' }}>
                                  Username
                                </Box>

                                <LoginFormField
                                  fullWidth
                                  placeholder="Enter Username"
                                  value={username}
                                  onChange={(e: ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                                />

                                <Box sx={{ fontSize: '14px', color: '#ffffff' }}>
                                  Customer ID
                                </Box>

                                <LoginFormField
                                  fullWidth
                                  placeholder="Enter Customer ID"
                                  value={customerId}
                                  onChange={(e: ChangeEvent<HTMLInputElement>) => setCustomerId(e.target.value)}
                                />
                              </>
                            )}

                            {mode === "forgot" && step === 'reset' && (
                              <>
                                {/* New Password */}
                                <Box sx={{ fontSize: '14px', fontWeight: 500, color: '#ffffff' }}>
                                    New Password
                                </Box>

                                <LoginFormField
                                    fullWidth
                                    type={showNew ? 'text' : 'password'}
                                    placeholder="Enter New Password "
                                    value={newPassword}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                        setNewPassword(e.target.value)
                                    }
                                    onCopy={(e: React.ClipboardEvent<HTMLInputElement>) => e.preventDefault()}
                                    onCut={(e: React.ClipboardEvent<HTMLInputElement>) => e.preventDefault()}
                                    onPaste={(e: React.ClipboardEvent<HTMLInputElement>) => e.preventDefault()}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowNew(!showNew)}
                                                    edge="end"
                                                    size="small"
                                                    sx={{ color: 'rgba(255, 255, 255, 0.6)' }}
                                                >
                                                    {showNew ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />

                                {/* Confirm New Password */}
                                <Box sx={{ fontSize: '14px', fontWeight: 500, color: '#ffffff' }}>
                                    Confirm New Password
                                </Box>

                                <LoginFormField
                                    fullWidth
                                    type={showConfirm ? 'text' : 'password'}
                                    placeholder="Confirm New Password"
                                    value={confirmPassword}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                        setConfirmPassword(e.target.value)
                                    }
                                    onCopy={(e: React.ClipboardEvent<HTMLInputElement>) => e.preventDefault()}
                                    onCut={(e: React.ClipboardEvent<HTMLInputElement>) => e.preventDefault()}
                                    onPaste={(e: React.ClipboardEvent<HTMLInputElement>) => e.preventDefault()}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowConfirm(!showConfirm)}
                                                    edge="end"
                                                    size="small"
                                                    sx={{ color: 'rgba(255, 255, 255, 0.6)' }}
                                                >
                                                    {showConfirm ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                              </>
                            )}

                            <Divider sx={{ mt: 0.4 }} />

                            {/* Buttons */}
                            <DialogActions
                                sx={{
                                    padding: 0,
                                    justifyContent: 'flex-end',
                                    gap: 1.5,
                                    mt: 0.4,
                                }}
                            >
                                <SaveButton 
                                    type="submit"
                                    sx={{
                                        backgroundColor: 'rgba(89, 12, 22, 1)',
                                        '&:hover': { backgroundColor: 'rgba(89, 12, 22, 1)' },
                                    }}>
                                    Submit
                                </SaveButton>
                                <CancelButton onClick={handleClose}>
                                    Cancel
                                </CancelButton>
                            </DialogActions>
                            </form>
                        </FormSection>
                    ) : (
                        <Box
                            component="form"
                            onSubmit={handleSubmit}
                            sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
                        >
                            {mode === 'change' && (
                                <>
                                    {/* Current Password */}
                                    <Box sx={{ fontSize: '14px' }}>
                                        Current Password
                                    </Box>

                                    <UserFormField
                                        fullWidth
                                        type={showCurrent ? 'text' : 'password'}
                                        placeholder="Enter current password"
                                        value={currentPassword}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                            setCurrentPassword(e.target.value)
                                        }
                                        onCopy={(e: React.ClipboardEvent<HTMLInputElement>) => e.preventDefault()}
                                        onCut={(e: React.ClipboardEvent<HTMLInputElement>) => e.preventDefault()}
                                        onPaste={(e: React.ClipboardEvent<HTMLInputElement>) => e.preventDefault()}
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        onClick={() => setShowCurrent(!showCurrent)}
                                                        edge="end"
                                                        size="small"
                                                    >
                                                        {showCurrent ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </>
                            )}

                            {/* New Password */}
                            <Box sx={{ fontSize: '14px', fontWeight: 500 }}>
                                New Password
                            </Box>

                            <UserFormField
                                fullWidth
                                type={showNew ? 'text' : 'password'}
                                placeholder="Enter New Password "
                                value={newPassword}
                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                    setNewPassword(e.target.value)
                                }
                                onCopy={(e: React.ClipboardEvent<HTMLInputElement>) => e.preventDefault()}
                                onCut={(e: React.ClipboardEvent<HTMLInputElement>) => e.preventDefault()}
                                onPaste={(e: React.ClipboardEvent<HTMLInputElement>) => e.preventDefault()}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowNew(!showNew)}
                                                edge="end"
                                                size="small"
                                            >
                                                {showNew ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            {/* Confirm New Password */}
                            <Box sx={{ fontSize: '14px', fontWeight: 500 }}>
                                Confirm New Password
                            </Box>

                            <UserFormField
                                fullWidth
                                type={showConfirm ? 'text' : 'password'}
                                placeholder="Confirm New Password"
                                value={confirmPassword}
                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                    setConfirmPassword(e.target.value)
                                }
                                onCopy={(e: React.ClipboardEvent<HTMLInputElement>) => e.preventDefault()}
                                onCut={(e: React.ClipboardEvent<HTMLInputElement>) => e.preventDefault()}
                                onPaste={(e: React.ClipboardEvent<HTMLInputElement>) => e.preventDefault()}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowConfirm(!showConfirm)}
                                                edge="end"
                                                size="small"
                                            >
                                                {showConfirm ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            <Divider sx={{ mt: 1 }} />

                            {/* Buttons */}
                            <DialogActions
                                sx={{
                                    padding: 0,
                                    justifyContent: 'flex-end',
                                    gap: 1.5,
                                    mt: 1,
                                }}
                            >
                                <SaveButton
                                    type="submit"
                                    sx={{
                                        backgroundColor: 'rgba(89, 12, 22, 1)',
                                        '&:hover': { backgroundColor: 'rgba(89, 12, 22, 1)' },
                                    }}
                                >
                                    Submit
                                </SaveButton>
                                <CancelButton onClick={handleClose}>
                                    Cancel
                                </CancelButton>
                            </DialogActions>
                        </Box>
                    )}
                </DialogContent>
            </StyledDialog>
            <Snackbar
                open={successOpen}
                autoHideDuration={4000}
                onClose={() => setSuccessOpen(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setSuccessOpen(false)}
                    severity="success"
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    Password updated successfully
                </Alert>
            </Snackbar>
        </>
    );
};

export default ChangePasswordDialog;