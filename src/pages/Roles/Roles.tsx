import { useState, ChangeEvent, useEffect } from "react";
import { Box, TextField, InputAdornment, FormControlLabel, CircularProgress, Tooltip, Typography } from "@mui/material";
import { Add as Plus, Search as SearchIcon, Security as Shield, People as Users, Settings as SettingsIcon, Close as CloseIcon } from "@mui/icons-material";
import { PageLayout } from "../../components/PageLayout";
import { EmptyState } from "../../components/EmptyState";
import { PageContainer, SearchContainer, SearchFieldWrapper, NewRoleButton, LoadingContainer, RolesGrid, RoleCard, RoleCardContent, RoleCardHeader, RoleCardTitleSection, RoleTitleBox, RoleTitle, StatusChip, RoleDescription, PermissionsChipContainer, PermissionChip, RoleCardFooter, UserCountBox, ActionButtonsBox, EditButton, DeleteButton, DeleteConfirmButton, StyledDialog, DialogTitleStyled, DialogCloseIcon, DialogContentStyled, DialogActionsStyled, DialogActionsCentered, DialogContentCentered, FormField, FormSection, FormFieldWrapper, FormLabel, FormNote, StatusCheckboxContainer, CheckboxStyled, FormControlLabelStyled, PermissionsGrid, SaveButton, CancelButton, AlertStyled, AlertWarning, IconButtonStyled, DeleteConfirmText, SaveButtonWithMinWidth, SuccessIconContainer, SuccessIcon, SuccessTitle, SuccessMessage, DeleteRoleDialogContentStyled, DeleteRoleIconContainer, DeleteRoleConfirmIcon, DeleteRoleConfirmTitle, DeleteRoleConfirmBody, DeleteRoleDialogActionsStyled, DeleteRoleCancelButton, DeleteRoleDeleteButton } from "./roleWidget";
import { apiClient } from "../../api";
import { ALL_PERMISSIONS } from "../../constants/common";
import { Role } from "../../models/Role";
import { isSuperAdminRole, isCurrentUserSuperAdmin } from "../../utils/commonUtil";
import log from '../../utils/logger';

// Count existing superAdmin roles
const countSuperAdminRoles = (rolesList: Role[]): number => {
  return rolesList.filter(role => isSuperAdminRole(role.role)).length;
};

interface User {
  id: number;
  name: string;
  email: string;
  roles: Array<{ id: number; role: string }>;
}

export default function RoleManagementPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentRoleId, setCurrentRoleId] = useState<number | null>(null);
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [roleStatus, setRoleStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [openSuccessDialog, setOpenSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);

  
  // Check if current user is superAdmin
  const isSuperAdmin = isCurrentUserSuperAdmin();

  const currentUserRole = localStorage.getItem('userRole');
const hasNoRoleAssigned = !currentUserRole || currentUserRole.trim() === "";
const isFirstRoleSetup = roles.length === 0;

const canManageRoles = isSuperAdmin || hasNoRoleAssigned || isFirstRoleSetup;

  const filteredRoles = roles.filter((r) =>
    r.role.toLowerCase().includes(search.toLowerCase())
  );

  // Load users from API to calculate user counts
  useEffect(() => {
    const loadUsers = async () => {
      log.info("Fetching users...");
      try {
        const response = await apiClient.get('/api/users', {
          params: { page: 1, limit: 10000 }
        });
        const usersData = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.users)
            ? response.data.users
            : [];
        log.info("Users fetched successfully");
        setUsers(usersData);
      } catch (error) {
        log.error("Failed to fetch users:", error);
        setUsers([]);
      }
    };
    loadUsers();

    // Re-fetch users when page becomes visible again (e.g., after role assignment in Users page)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadUsers();
      }
    };

    // Also listen for window focus to refresh when switching back to this tab
    const handleFocus = () => {
      loadUsers();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Load roles from Roles.json via API on component mount
  useEffect(() => {
    const loadRoles = async () => {
      try {
        log.info("Fetching roles...");
        setLoading(true);
        const response = await apiClient.get('/api/roles');
        const rolesData = Array.isArray(response.data) ? response.data : [];
        log.info("Roles fetched successfully");
        setRoles(rolesData);
      } catch (error) {
        log.error("Failed to fetch roles:", error);
        // If API fails, start with empty array
        setRoles([]);
      } finally {
        setLoading(false);
      }
    };
    loadRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Calculate user count for a specific role
  const getUserCountForRole = (roleId: number, roleName: string): number => {
    return users.filter(user => {
      // Ensure roles is an array
      if (!user.roles || !Array.isArray(user.roles)) {
        return false;
      }
      return user.roles.some(userRole =>
        userRole.id === roleId || userRole.role === roleName
      );
    }).length;
  };

  // Save roles to JSON file
  const saveRolesToFile = async (rolesData: Role[]) => {
    try {
      await apiClient.post('/api/roles', rolesData);
    } catch (error) {
      log.error("Failed to save roles:", error);
      throw error;
    }
  };

  const handleOpenDialog = () => {
    if (!canManageRoles) {
      setErrorMessage("Only superAdmin users can create roles.");
      setShowError(true);
      return;
    }
    setEditMode(false);
    setCurrentRoleId(null);
    setRoleName("");
    setRoleDescription("");
    setSelectedPermissions([]);
    setRoleStatus("ACTIVE");
    setShowError(false);
    setErrorMessage("");
    setOpenDialog(true);
  };

  const handleEditRole = (role: Role) => {
    if (!canManageRoles) {
      setErrorMessage("Only superAdmin users can edit roles.");
      setShowError(true);
      return;
    }
    setEditMode(true);
    setCurrentRoleId(role.id);
    setRoleName(role.role);
    // If description is "No description provided", show empty string so placeholder appears
    setRoleDescription(role.description === "No description provided" ? "" : role.description);
    setSelectedPermissions(role.permissions);
    setRoleStatus(role.status);
    setShowError(false);
    setErrorMessage("");
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditMode(false);
    setCurrentRoleId(null);
    setRoleName("");
    setRoleDescription("");
    setSelectedPermissions([]);
    setRoleStatus("ACTIVE");
    setShowError(false);
    setErrorMessage("");
  };

  const togglePermission = (permission: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    );
  };

  const handleSaveRole = async () => {
    if (!roleName.trim()) {
      setErrorMessage("Role name is required");
      setShowError(true);
      return;
    }

    const normalizedRoleName = roleName.trim().toLowerCase();
    const isDuplicateRoleName = roles.some((r) => {
      if (editMode && currentRoleId && r.id === currentRoleId) return false;
      return r.role.trim().toLowerCase() === normalizedRoleName;
    });

    if (isDuplicateRoleName) {
      setErrorMessage("Role name must be unique");
      setShowError(true);
      return;
    }

    // Check if trying to create a superAdmin role
    if (isSuperAdminRole(roleName)) {
      const existingSuperAdminCount = countSuperAdminRoles(roles);

      // If editing an existing superAdmin role, allow it
      if (editMode && currentRoleId) {
        const currentRole = roles.find(r => r.id === currentRoleId);
        // If the current role being edited is already a superAdmin, allow the edit
        if (currentRole && isSuperAdminRole(currentRole.role)) {
          // Allow edit
        } else {
          // Trying to change a non-superAdmin role to superAdmin
          if (existingSuperAdminCount >= 1) {
            setErrorMessage("Maximum of 1 superAdmin roles allowed. Cannot create more superAdmin roles.");
            setShowError(true);
            return;
          }
        }
      } else {
        // Creating a new superAdmin role
        if (existingSuperAdminCount >= 1) {
          setErrorMessage("Maximum of 1 superAdmin roles allowed. Cannot create more superAdmin roles.");
          setShowError(true);
          return;
        }
      }
    }

    try {
      let updatedRoles: Role[];

      if (editMode && currentRoleId) {
        log.info("Updating role...");
        // Update existing role
        updatedRoles = roles.map(role =>
          role.id === currentRoleId
            ? {
              ...role,
              role: roleName,
              description: roleDescription || "No description provided",
              permissions: selectedPermissions,
              status: roleStatus,
            }
            : role
        );
        log.info("Role updated successfully");
        setSuccessMessage("Role Updated Successfully!");
      } else {
        // Create new role
        const newRole: Role = {
          id: Date.now(),
          role: roleName,
          description: roleDescription || "No description provided",
          users: 0,
          permissions: selectedPermissions,
          status: roleStatus,
        };
        updatedRoles = [...roles, newRole];
        setSuccessMessage("Role Added Successfully!");
      }

      // Update local state
      setRoles(updatedRoles);
      log.info("Roles updated successfully");
      // Save to JSON file
      await saveRolesToFile(updatedRoles);

      setOpenDialog(false);
      setOpenSuccessDialog(true);
      setRoleName("");
      setRoleDescription("");
      setSelectedPermissions([]);
      setRoleStatus("ACTIVE");
      setEditMode(false);
      setCurrentRoleId(null);
      setShowError(false);
      setErrorMessage("");
    } catch (error) {
      log.error("Failed to save role:", error);
      setSuccessMessage("Error saving role. Please try again.");
      setOpenSuccessDialog(true);
    }
  };

  const handleDeleteClick = (role: Role) => {
    if (!canManageRoles) {
      setErrorMessage("Only superAdmin users can delete roles.");
      setShowError(true);
      return;
    }
    setRoleToDelete(role);
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (roleToDelete) {
      try {
        log.info("Deleting role...");
        const updatedRoles = roles.filter(role => role.id !== roleToDelete.id);

        // Update local state
        setRoles(updatedRoles);

        // Save to JSON file
        await saveRolesToFile(updatedRoles);
        log.info("Role deleted successfully");
        setSuccessMessage("Role Deleted Successfully!");
        setOpenSuccessDialog(true);
      } catch (error) {
        log.error("Failed to delete role:", error);
        setSuccessMessage("Error deleting role. Please try again.");
        setOpenSuccessDialog(true);
      }
    }
    setOpenDeleteDialog(false);
    setRoleToDelete(null);
  };

  const handleDeleteCancel = () => {
    setOpenDeleteDialog(false);
    setRoleToDelete(null);
  };

  const handleCloseSuccessDialog = () => {
    setOpenSuccessDialog(false);
    setOpenDialog(false);
    setOpenDeleteDialog(false);
    setEditMode(false);
    setCurrentRoleId(null);
    setRoleToDelete(null);
    setRoleName("");
    setRoleDescription("");
    setSelectedPermissions([]);
    setRoleStatus("ACTIVE");
  };

  return (
    <PageLayout
      title="Role Management"
      icon={<Shield sx={{ fontSize: 26 }} />}
      headerRight={
        <SearchContainer sx={{ marginBottom: 0 }}>
          <SearchFieldWrapper>
            <TextField
              fullWidth
              placeholder="Search roles"
              variant="outlined"
              size="small"
              value={search}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              sx={{
                backgroundColor: 'white',
                '& .MuiOutlinedInput-root': {
                  borderRadius: '5px',
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 20, color: '#9e9e9e' }} />
                  </InputAdornment>
                ),
              }}
            />
          </SearchFieldWrapper>
          <NewRoleButton
            startIcon={<Plus />}
            variant="contained"
            size="small"
            isSuperAdmin={isSuperAdmin}
            onClick={handleOpenDialog}
            disabled={!canManageRoles}
          >
            New Role
          </NewRoleButton>
        </SearchContainer>
      }
    >
      <PageContainer>
        {/* Error Alert */}
        {showError && errorMessage && (
          <AlertStyled
            severity="error"
            onClose={() => {
              setShowError(false);
              setErrorMessage("");
            }}
          >
            {errorMessage}
          </AlertStyled>
        )}

        {/* Access Denied Alert */}
        {!canManageRoles && (
          <AlertWarning severity="warning">
            Only superAdmin users can manage roles. Please contact a superAdmin to create, edit, or delete roles.
          </AlertWarning>
        )}

        {/* Roles Grid */}
        {loading ? (
          <LoadingContainer>
            <CircularProgress />
          </LoadingContainer>
        ) : filteredRoles.length === 0 ? (
          <EmptyState
            title="No roles"
            message={roles.length > 0 && search.trim().length > 0
              ? "No role found matching your search."
              : "No roles found. Create a role to manage permissions."
            }
          />
        ) : (
          <RolesGrid>
            {filteredRoles.map((role) => (
              <RoleCard 
                key={role.id}
                sx={{
                  opacity: isSuperAdminRole(role.role) ? 0.6 : 1
                }}
              >
                <RoleCardContent>
                  <RoleCardHeader>
                    <RoleCardTitleSection>
                      <Shield sx={{ color: 'rgba(89, 12, 22, 1)', fontSize: 18, mt: 0.5 }} />
                      <RoleTitleBox>
                        <RoleTitle as="h2">
                          {role.role}
                        </RoleTitle>
                        <StatusChip label={role.status} size="small" status={role.status} />
                      </RoleTitleBox>
                    </RoleCardTitleSection>
                    <IconButtonStyled size="small">
                      <SettingsIcon sx={{ fontSize: 16, color: 'rgba(89, 12, 22, 1)'}} />
                    </IconButtonStyled>
                  </RoleCardHeader>

                  <RoleDescription as="p">
                    {role.description}
                  </RoleDescription>

                  <PermissionsChipContainer>
                    {role.permissions.map((p: string) => (
                      <PermissionChip
                        key={p}
                        label={p}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </PermissionsChipContainer>

                  <RoleCardFooter>
                    <UserCountBox>
                      <Users sx={{ fontSize: 14 }} /> {getUserCountForRole(role.id, role.role)} users
                    </UserCountBox>
                    <ActionButtonsBox>
                      <Tooltip
                        title={isSuperAdminRole(role.role) ? "Super Admin role cannot be modified" : ""}
                        arrow
                      >
                        <span>
                          <EditButton
                            size="small"
                            variant="outlined"
                            isSuperAdmin={isSuperAdmin}
                            onClick={() => handleEditRole(role)}
                            disabled={!canManageRoles || isSuperAdminRole(role.role)}
                          >
                            Edit
                          </EditButton>
                        </span>
                      </Tooltip>
                      <Tooltip
                        title={isSuperAdminRole(role.role) ? "Super Admin role cannot be modified" : ""}
                        arrow
                      >
                        <span>
                          <DeleteButton
                            size="small"
                            variant="outlined"
                            color="error"
                            isSuperAdmin={isSuperAdmin}
                            onClick={() => handleDeleteClick(role)}
                            disabled={!canManageRoles || isSuperAdminRole(role.role)}
                          >
                            Delete
                          </DeleteButton>
                        </span>
                      </Tooltip>
                    </ActionButtonsBox>
                  </RoleCardFooter>
                </RoleCardContent>
              </RoleCard>
            ))}
          </RolesGrid>
        )}

        {/* Add/Edit Role Dialog */}
        <StyledDialog open={openDialog} onClose={handleCloseDialog}>
          <DialogTitleStyled>
            {editMode ? "Edit Role" : "Create New Role"}
            <DialogCloseIcon onClick={handleCloseDialog}>
              <CloseIcon />
            </DialogCloseIcon>
          </DialogTitleStyled>
          <DialogContentStyled>
            {showError && errorMessage && (
              <AlertStyled severity="error">
                {errorMessage}
              </AlertStyled>
            )}
            <FormSection>
              <FormFieldWrapper sx={{ paddingTop: "8px" }}>
                <FormLabel>
                  Role Name *
                </FormLabel>
                <FormField
                  fullWidth
                  placeholder="Role name (e.g. Admin, Manager)"
                  value={roleName}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    setRoleName(e.target.value);
                    setShowError(false);
                    setErrorMessage("");
                  }}
                />
                {isSuperAdminRole(roleName) && !editMode && (
                  <FormNote>
                    Note: Maximum of 1 superAdmin roles allowed. Currently: {countSuperAdminRoles(roles)}/1
                  </FormNote>
                )}
              </FormFieldWrapper>

              <FormFieldWrapper>
                <FormLabel>
                  Description
                </FormLabel>
                <FormField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Role description"
                  value={roleDescription}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setRoleDescription(e.target.value)}
                />
              </FormFieldWrapper>

              <FormFieldWrapper>
                <FormLabel>
                  Permissions
                </FormLabel>
                <PermissionsGrid>
                  {ALL_PERMISSIONS.map((permission) => (
                    <FormControlLabelStyled
                      key={permission}
                      control={
                        <CheckboxStyled
                          checked={selectedPermissions.includes(permission)}
                          onChange={() => togglePermission(permission)}
                        />
                      }
                      label={permission}
                    />
                  ))}
                </PermissionsGrid>
              </FormFieldWrapper>

              <FormFieldWrapper>
                <FormLabel>
                  Status
                </FormLabel>
                <StatusCheckboxContainer>
                  <FormControlLabel
                    control={
                      <CheckboxStyled
                        checked={roleStatus === "ACTIVE"}
                        onChange={() => setRoleStatus("ACTIVE")}
                      />
                    }
                    label="Active"
                  />
                  <FormControlLabel
                    control={
                      <CheckboxStyled
                        checked={roleStatus === "INACTIVE"}
                        onChange={() => setRoleStatus("INACTIVE")}
                      />
                    }
                    label="Inactive"
                  />
                </StatusCheckboxContainer>
              </FormFieldWrapper>
            </FormSection>
          </DialogContentStyled>
          <DialogActionsStyled>
            <CancelButton onClick={handleCloseDialog}>Cancel</CancelButton>
            <SaveButton onClick={handleSaveRole}>{editMode ? "Update Role" : "Add Role"}</SaveButton>
          </DialogActionsStyled>
        </StyledDialog>

        {/* Delete Confirmation Dialog */}
        <StyledDialog open={openDeleteDialog} onClose={handleDeleteCancel}>
          <DeleteRoleDialogContentStyled>
            <DeleteRoleIconContainer>
              <DeleteRoleConfirmIcon />
            </DeleteRoleIconContainer>

            <DeleteRoleConfirmTitle variant="h6">
              Confirm Delete
            </DeleteRoleConfirmTitle>

            <DeleteRoleConfirmBody>
              Are you sure you want to delete the role{" "}
              <strong>"{roleToDelete?.role}"</strong>? This action cannot be undone.
            </DeleteRoleConfirmBody>
          </DeleteRoleDialogContentStyled>

          <DeleteRoleDialogActionsStyled>
            <DeleteRoleCancelButton onClick={handleDeleteCancel}>
              Cancel
            </DeleteRoleCancelButton>

            <DeleteRoleDeleteButton
              variant="contained"
              onClick={handleDeleteConfirm}
            >
              Delete
            </DeleteRoleDeleteButton>
          </DeleteRoleDialogActionsStyled>
        </StyledDialog>

        {/* Success Dialog */}
        <StyledDialog open={openSuccessDialog} onClose={handleCloseSuccessDialog}>
          <DialogContentCentered>
            <SuccessIconContainer>
              <SuccessIcon />
            </SuccessIconContainer>
            <SuccessTitle variant="h6">
              Success!
            </SuccessTitle>
            <SuccessMessage>
              {successMessage}
            </SuccessMessage>
          </DialogContentCentered>
          <DialogActionsCentered>
            <SaveButtonWithMinWidth onClick={handleCloseSuccessDialog}>
              OK
            </SaveButtonWithMinWidth>
          </DialogActionsCentered>
        </StyledDialog>
      </PageContainer>
    </PageLayout>
  );
}