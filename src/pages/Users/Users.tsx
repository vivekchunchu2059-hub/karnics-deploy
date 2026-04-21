import { useState, ChangeEvent, useEffect } from "react";
import { Box, Typography, CircularProgress, Snackbar, Alert, DialogContent, DialogActions, Pagination } from "@mui/material";
import { PersonAdd as UserPlusIcon, Warning as WarningIcon } from "@mui/icons-material";
import { apiClient } from "../../api";
import { Role } from "../../models/Role";
import { User } from "../../models/user";
import { isSuperAdminRole } from "../../utils/commonUtil";
import AddUserDialog from "./AddUserDialog";
import UserTableDialog from "./UserTableDialog";
import AddProductButton from "../../components/Button/Button";
import { SearchBar, SearchField, StyledDialog, SaveButton, CancelButton } from "./UserWidget";
import { PageLayout } from "../../components/PageLayout";
import { EmptyState } from "../../components/EmptyState";
import PersonIcon from "@mui/icons-material/Person";
import { usersPageStyles } from "./UserWidget";
import RoleUpgradePopup from "../../components/popup/RoleUpgradePopup";
import { useNavigate } from "react-router-dom";
import log from '../../utils/logger';

export default function UserRoleTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<Record<number, string>>({});
  const [openAddUserDialog, setOpenAddUserDialog] = useState(false);
  const [currentRole, setCurrentRole] = useState<string | null>(
    typeof window !== 'undefined'
      ? localStorage.getItem('userRole')
      : null
  );
  const [roleLimitToast, setRoleLimitToast] = useState(false);
  const [openRoleConfirmDialog, setOpenRoleConfirmDialog] = useState(false);
  const [pendingRoleChange, setPendingRoleChange] = useState<{ userId: number; roleName: string } | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showRoleUpgradePopup, setShowRoleUpgradePopup] = useState(false);
  const navigate = useNavigate();


  // Get logged-in user email
  const loggedInEmail = typeof window !== 'undefined' ? localStorage.getItem('currentUserEmail') : null;


  useEffect(() => {
    const flag = localStorage.getItem("roleUpgradePending");
    if (flag === "true") {
      setShowRoleUpgradePopup(true);
    }
  }, []);


  const handleRoleUpgradeConfirm = () => {
    localStorage.removeItem("roleUpgradePending");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userRole");
    localStorage.removeItem("currentUserRole");
    localStorage.removeItem("currentUser");
    setShowRoleUpgradePopup(false);

    // redirect 
    window.location.href = "/login";
  }


  // Listen for role changes
  useEffect(() => {
    const syncRole = () => {
      const newRole = localStorage.getItem('userRole');
      setCurrentRole(newRole);
    };

    window.addEventListener('userRoleUpdated', syncRole);

    return () => {
      window.removeEventListener('userRoleUpdated', syncRole);
    };
  }, []);

  const isSuperAdmin = isSuperAdminRole(currentRole || "");
  // Count Super Admin users
  const countSuperAdminUsers = (): number => {
    return users.filter(user => {
      if (user.roles && user.roles.length > 0) {
        return user.roles.some(role => isSuperAdminRole(role.role));
      }
      return false;
    }).length;
  };

  const superAdminCount = countSuperAdminUsers();

  const canManageRoles =
    isSuperAdmin || superAdminCount === 0;


  // Load all users from API (for sorting, then pagination will be applied client-side)
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        // Get all users to apply sorting logic first, then paginate client-side
        log.info('Fetching users...');
        const response = await apiClient.get('/api/users', {
          params: { page: 1, limit: 10000 }
        });

        // Handle paginated response format
        const responseData = response.data;
        const usersData = responseData.users || (Array.isArray(responseData) ? responseData : []);

        // Get total items from response for pagination calculation
        const totalCount = responseData.total !== undefined ? responseData.total : usersData.length;
        log.info('Users fetched successfully');
        setTotalItems(totalCount);

        // Transform users data to include roles array and status (if not present)
        const transformedUsers = usersData.map((user: any) => {
          // Extract firstName and lastName from name if available, or use separate fields
          const nameParts = user.name ? user.name.split(' ') : [];
          const firstName = user.firstName || nameParts[0] || '';
          const lastName = user.lastName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '');

          return {
            id: user.id,
            name: user.name || '',
            email: user.email || '',
            status: user.status || 'Active',
            roles: user.roles || [],
            username: user.username || '',
            firstName: firstName,
            lastName: lastName,
            phone: user.phone || '',
          };
        });

        setUsers(transformedUsers);

        // Initialize selectedRole with current roles
        const initialSelectedRoles: Record<number, string> = {};
        transformedUsers.forEach((user: User) => {
          if (user.roles && user.roles.length > 0) {
            initialSelectedRoles[user.id] = user.roles[0].role;
          }
        });
        setSelectedRole(initialSelectedRoles);
      } catch (error) {
        log.error('Failed to fetch users:', error);
        // If API fails, start with empty array
        setUsers([]);
        setTotalPages(1);
        setTotalItems(0);
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load roles from API on component mount and when page becomes visible
  useEffect(() => {
    const loadRoles = async () => {
      try {
        log.info('Fetching roles...');
        const response = await apiClient.get('/api/roles');
        const rolesData = Array.isArray(response.data) ? response.data : [];
        log.info('Roles fetched successfully');
        setRoles(rolesData);
      } catch (error) {
        log.error('Failed to fetch roles:', error);
        // If API fails, start with empty array
        setRoles([]);
      }
    };
    loadRoles();

    // Reload roles when page becomes visible (e.g., when navigating from Roles page)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadRoles();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save users to API
  const saveUsersToFile = async (usersData: User[]) => {
    try {
      // Get original users to preserve all fields (with high limit to get all users)
     
      const response = await apiClient.get('/api/users', {
        params: { page: 1, limit: 10000 }
      });
      const responseData = response.data;
      const originalUsers = responseData.users || (Array.isArray(responseData) ? responseData : []);
    

      // Merge role assignments and status with original user data
      const updatedUsers = originalUsers.map((originalUser: any) => {
        const updatedUser = usersData.find(u => u.id === originalUser.id);
        if (updatedUser) {
          return {
            ...originalUser,
            roles: updatedUser.roles || [],
            status: updatedUser.status || 'Active',
          };
        }
        // If user not found in updated data, keep original but ensure roles and status fields exist
        return {
          ...originalUser,
          roles: originalUser.roles || [],
          status: originalUser.status || 'Active',
        };
      });

      log.info('Saving users updates...');
      const saveResponse = await apiClient.post('/api/users', updatedUsers);
      log.info('Users updated successfully');
    } catch (error) {
      log.error('Failed to update users:', error);
      throw error;
    }
  };

  const assignRole = async (userId: number) => {
    // Only SuperAdmin can change roles
    if (!canManageRoles) {
      return;
    }

    const roleName = selectedRole[userId];
    if (!roleName) return;

    const roleToAdd = roles.find((r) => r.role === roleName);
    if (!roleToAdd) return;

    // Prevent role change if user already has SuperAdmin role
    const targetUser = users.find((u) => u.id === userId);
    if (targetUser && targetUser.roles && targetUser.roles.length > 0) {
      const currentRole = targetUser.roles[0].role;
      if (currentRole.trim().toLowerCase() === 'superadmin') {
        return; // stop role change
      }
    }

    // Open confirmation dialog before role change
    if (targetUser) {
      setPendingRoleChange({ userId, roleName });
      setOpenRoleConfirmDialog(true);
      return;
    }
  };

  const proceedWithRoleAssignment = async (userId: number, roleName: string) => {

    const roleToAdd = roles.find((r) => r.role === roleName);
    if (!roleToAdd) return;

    // Check Super Admin count limit before assigning
    if (isSuperAdminRole(roleName)) {
      const superAdminCount = users.filter((u) => {
        if (u.id === userId) return false; // Exclude current user from count
        if (u.roles && u.roles.length > 0) {
          return u.roles.some((role) => isSuperAdminRole(role.role));
        }
        return false;
      }).length;

      // If assigning Super Admin and we already have 1 (excluding current user), block it
      if (superAdminCount >= 1) {
        // setRoleLimitToast(true);
        return;
      }
    }

    // Replace existing role with new role (only one role per user)
    const updatedUsers = users.map((u) =>
      u.id === userId
        ? {
          ...u,
          roles: [{ id: roleToAdd.id, role: roleToAdd.role }]
        }
        : u
    );

    // Update local state
    setUsers(updatedUsers);

    // Save to file
    try {
      await saveUsersToFile(updatedUsers);

      const loggedInEmail = localStorage.getItem("currentUserEmail");

      if (isSuperAdminRole(roleName) && loggedInEmail) {
        const targetUser = updatedUsers.find(
          (u) => u.id === userId
        );

        if (targetUser && targetUser.email === loggedInEmail) {
          localStorage.setItem("roleUpgradePending", "true");
          setShowRoleUpgradePopup(true);
        }
      }

      // Refresh users list from API to ensure Role page count updates
      try {
        log.info('Refreshing users list after role assignment...');
        const refreshResponse = await apiClient.get('/api/users', {
          params: { page: 1, limit: 10000 }
        });
        const refreshResponseData = refreshResponse.data;
        const refreshedUsersData = refreshResponseData.users || (Array.isArray(refreshResponseData) ? refreshResponseData : []);
        log.info('Users refreshed successfully');

        // Transform refreshed users data
        const transformedRefreshedUsers = refreshedUsersData.map((user: any) => {
          const nameParts = user.name ? user.name.split(' ') : [];
          const firstName = user.firstName || nameParts[0] || '';
          const lastName = user.lastName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '');

          return {
            id: user.id,
            name: user.name || '',
            email: user.email || '',
            status: user.status || 'Active',
            roles: user.roles || [],
            username: user.username || '',
            firstName: firstName,
            lastName: lastName,
            phone: user.phone || '',
          };
        });

        setUsers(transformedRefreshedUsers);

        const currentUserString = localStorage.getItem("currentUser");

        if (currentUserString) {
          const currentUser = JSON.parse(currentUserString);

          if (String(currentUser.id) === String(userId)) {

            const refreshedUser = transformedRefreshedUsers.find(
              (u: User) => String(u.id) === String(userId)
            );

            if (refreshedUser) {
              const updatedCurrentUser = {
                ...currentUser,
                roles: refreshedUser.roles || [],
              };

              localStorage.setItem(
                "currentUser",
                JSON.stringify(updatedCurrentUser)
              );

              window.dispatchEvent(new Event("userRoleUpdated"));

            }
          }
        }

        // Update selectedRole with refreshed roles
        const refreshedSelectedRoles: Record<number, string> = {};
        transformedRefreshedUsers.forEach((user: User) => {
          if (user.roles && user.roles.length > 0) {
            refreshedSelectedRoles[user.id] = user.roles[0].role;
          }
        });
        setSelectedRole(refreshedSelectedRoles);
      } catch (refreshError) {
        log.error('Failed to refresh users list:', refreshError);
        // Continue with optimistic update if refresh fails
      }
    } catch (error) {
      log.error('Failed to save users after role assignment:', error);
      // Revert on error
      setUsers(users);
    }

    // Clear the selected role for this user
    setSelectedRole((prev) => ({
      ...prev,
      [userId]: "",
    }));
  };

  const handleConfirmRoleChange = async () => {
    if (pendingRoleChange) {
      await proceedWithRoleAssignment(pendingRoleChange.userId, pendingRoleChange.roleName);
      setOpenRoleConfirmDialog(false);
      setPendingRoleChange(null);
    }
  };

  const handleCancelRoleChange = () => {
    setOpenRoleConfirmDialog(false);
    setPendingRoleChange(null);
  };

  const removeRole = async (userId: number, roleId: number) => {
    const updatedUsers = users.map((u) =>
      u.id === userId
        ? { ...u, roles: u.roles.filter((r) => r.id !== roleId) }
        : u
    );

    // Update local state
    setUsers(updatedUsers);

    // Save to file
    try {
      await saveUsersToFile(updatedUsers);
    } catch (error) {
      log.error('Failed to save users after role removal:', error);
      // Revert on error
      setUsers(users);
    }
  };

  // Filter and sort users: Super Admins first, then others sorted by creation (latest first)
  // Pagination is applied AFTER sorting
  const filteredAndSortedUsers = (() => {
    // First apply search filter
    const searchFiltered = users.filter(
      (u) =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    // Separate Super Admins and other users
    const superAdmins = searchFiltered.filter((user) => {
      if (user.roles && user.roles.length > 0) {
        return user.roles.some((role) => isSuperAdminRole(role.role));
      }
      return false;
    });

    const others = searchFiltered.filter((user) => {
      if (user.roles && user.roles.length > 0) {
        return !user.roles.some((role) => isSuperAdminRole(role.role));
      }
      return true; // Users with no roles are considered "others"
    });

    // Sort others by id descending (higher id = newer user = latest first)
    const sortedOthers = others.sort((a, b) => b.id - a.id);

    // Combine: Super Admins first, then sorted others
    return [...superAdmins, ...sortedOthers];
  })();

  // Calculate total pages based on sorted/filtered users
  const limit = 10;
  const sortedTotalPages = Math.ceil(filteredAndSortedUsers.length / limit);

  // Update totalPages state when sorted list changes
  useEffect(() => {
    setTotalPages(sortedTotalPages);
  }, [filteredAndSortedUsers.length]);

  // Apply pagination to sorted users
  const filteredUsers = (() => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return filteredAndSortedUsers.slice(startIndex, endIndex);
  })();

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    // Reset to page 1 when search changes
    setPage(1);
  };

  const handleRoleChange = (userId: number, val: string) => {
    setSelectedRole((prev) => ({
      ...prev,
      [userId]: val,
    }));
  };

  const handleStatusChange = async (userId: number, newStatus: 'Active' | 'Inactive') => {
    // Only SuperAdmin can change status
    if (!canManageRoles) {
      return;
    }

    const updatedUsers = users.map((u) =>
      u.id === userId
        ? { ...u, status: newStatus }
        : u
    );

    // Update local state
    setUsers(updatedUsers);

    // Save to file
    try {
      await saveUsersToFile(updatedUsers);
    } catch (error) {
      log.error('Failed to save users after status change:', error);
      // Revert on error
      setUsers(users);
    }
  };


  // Handle adding new user
  const handleAddUser = async (userData: {
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
  }) => {
    try {
      log.info('Adding new user...');
      await apiClient.post('/api/users/add', userData);
      // Just reload users from backend
      const reloadResponse = await apiClient.get('/api/users', {
        params: { page: 1, limit: 10000 }
      });

      const reloadResponseData = reloadResponse.data;
      const reloadedUsers =
        reloadResponseData.users || [];

      const transformedUsers = reloadedUsers.map((user: any) => ({
        id: user.id,
        name: user.name || '',
        email: user.email || '',
        status: user.status || 'Active',
        roles: user.roles || [],
        username: user.username || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
      }));
      log.info('New user added successfully');
      setUsers(transformedUsers);
    } catch (error) {
      log.error('Failed to add new user:', error);
      throw error;
    }
  };

  return (
    <PageLayout
      title="Users"
      icon={<PersonIcon sx={{ fontSize: 26 }} />}
      headerRight={
        <SearchBar>
          <SearchField
            placeholder="Search users by name or email"
            value={search}
            onChange={handleSearchChange}
          />
          <AddProductButton
            onClick={() => setOpenAddUserDialog(true)}
            startIcon={<UserPlusIcon />}
          >
            Add User
          </AddProductButton>
        </SearchBar>
      }>
          {loading ? (
            <Box sx={usersPageStyles.loadingBox}>
              <CircularProgress />
            </Box>
          ) : filteredUsers.length === 0 ? (
            <EmptyState
              title="No users"
              message={search ? "No users found matching your search." : "No users available. Add a user to get started."}
            />
          ) : (
        <>
          <UserTableDialog
            users={filteredUsers}
            roles={roles}
            selectedRole={selectedRole}
            loading={loading}
            loggedInEmail={loggedInEmail}
            isSuperAdmin={canManageRoles}
            superAdminCount={countSuperAdminUsers()}
            onRoleChange={handleRoleChange}
            onRoleAssign={assignRole}
            onRoleRemove={removeRole}
            onStatusChange={handleStatusChange}
          />

          {/* Pagination */}
          {!loading && totalPages > 0 && (
            <Box sx={usersPageStyles.paginationContainer}>
              <Typography sx={usersPageStyles.paginationTypography}>
                Showing {filteredUsers.length} {filteredUsers.length === 1 ? 'record' : 'records'}
                {totalItems > 0 && (
                  <> (indices {((page - 1) * 10) + 1}-{Math.min(page * 10, totalItems)} of {totalItems})</>
                )}
              </Typography>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, value) => setPage(value)}
                siblingCount={0}
                boundaryCount={1}
                disabled={loading}
                sx={usersPageStyles.paginationSx}
              />
            </Box>
          )}
        </>
      )}

      <AddUserDialog
        open={openAddUserDialog}
        onClose={() => setOpenAddUserDialog(false)}
        onSave={handleAddUser}
        isSuperAdmin={canManageRoles}
        superAdminCount={countSuperAdminUsers()}
      />

      <Snackbar
        open={roleLimitToast}
        autoHideDuration={3000}
        onClose={() => setRoleLimitToast(false)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        sx={usersPageStyles.snackbarSx}
      >
        <Alert severity="warning" variant="filled">
          Only one Super Admin is allowed
        </Alert>
      </Snackbar>

      {/* Role Change Confirmation Dialog */}
      <StyledDialog open={openRoleConfirmDialog} onClose={handleCancelRoleChange}>
        <DialogContent sx={usersPageStyles.dialogContentSx}>
          <Box sx={usersPageStyles.warningIconBox}>
            <WarningIcon sx={usersPageStyles.warningIconSx} />
          </Box>
          <Typography
            variant="h6"
            sx={usersPageStyles.dialogTitleTypography}
          >
            Confirm Role Change
          </Typography>
          <Typography sx={usersPageStyles.dialogBodyTypography}>
            {pendingRoleChange && (() => {
              const targetUser = users.find((u) => u.id === pendingRoleChange.userId);
              const username = targetUser?.username || targetUser?.name || 'this user';
              return `Are you sure you want to change the role of ${username}?`;
            })()}
          </Typography>
        </DialogContent>
        <DialogActions sx={usersPageStyles.dialogActionsSx}>
          <CancelButton
            onClick={handleCancelRoleChange}
            sx={usersPageStyles.dialogButtonSx}
          >
            Cancel
          </CancelButton>
          <SaveButton
            onClick={handleConfirmRoleChange}
            sx={usersPageStyles.dialogButtonSx}
          >
            Confirm
          </SaveButton>
        </DialogActions>
      </StyledDialog>
      <RoleUpgradePopup
        open={showRoleUpgradePopup}
        onConfirm={handleRoleUpgradeConfirm}
      />
    </PageLayout>
  );
}