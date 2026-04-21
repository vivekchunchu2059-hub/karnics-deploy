import { Box, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, MenuItem, Select, FormControl, InputLabel, Chip, Button, Tooltip } from "@mui/material";
import { PersonAdd as UserPlusIcon, Close as CloseIcon } from "@mui/icons-material";
import { User } from "../../models/user";
import { Role } from "../../models/Role";
import { isSuperAdminRole } from "../../utils/commonUtil";
import { StyledTable, TableHeaderCell, TableDataRow, StyledTableCellData, StyledTableCellBold, StyledTypographyCell } from "./UserWidget";

interface UserTableDialogProps {
  users: User[];
  roles: Role[];
  selectedRole: Record<number, string>;
  loading: boolean;
  loggedInEmail: string | null;
  isSuperAdmin: boolean;
  superAdminCount: number;
  onRoleChange: (userId: number, roleName: string) => void;
  onRoleAssign: (userId: number) => void;
  onRoleRemove: (userId: number, roleId: number) => void;
  onStatusChange: (userId: number, newStatus: 'Active' | 'Inactive') => void;
}

export default function UserTableDialog({
  users,
  roles,
  selectedRole,
  loading,
  loggedInEmail,
  isSuperAdmin,
  superAdminCount,
  onRoleChange,
  onRoleAssign,
  onRoleRemove,
  onStatusChange,
}: UserTableDialogProps) {
  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        backgroundColor: '#ffffff',
      }}
    >
      <StyledTable>
        <TableHead>
          <TableRow>
            <TableHeaderCell>User Name</TableHeaderCell>
            <TableHeaderCell>First Name</TableHeaderCell>
            <TableHeaderCell>Last Name</TableHeaderCell>
            <TableHeaderCell>Email</TableHeaderCell>
            <TableHeaderCell>Phone Number</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Assigned Roles</TableHeaderCell>
            <TableHeaderCell align="center">Assign Role</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => {
            const isSelf = !!(loggedInEmail && user.email === loggedInEmail);
            const hasSuperAdminRole = user.roles && user.roles.length > 0 && (user.roles[0].role === 'superAdmin' || user.roles[0].role === 'SuperAdmin' || user.roles[0].role === 'Super Admin');
            return (
              <TableDataRow key={user.id}>
                <StyledTableCellBold>
                  {user.username || '-'}
                </StyledTableCellBold>
                <StyledTableCellData>{user.firstName || '-'}</StyledTableCellData>
                <StyledTableCellData>{user.lastName || '-'}</StyledTableCellData>
                <StyledTableCellData>{user.email}</StyledTableCellData>
                <StyledTableCellData>{user.phone || '-'}</StyledTableCellData>
                <TableCell>
                  <FormControl size="small" sx={{ minWidth: 100 }}>
                    <Select
                      value={user.status || 'Active'}
                      onChange={(e) => onStatusChange(user.id, e.target.value as 'Active' | 'Inactive')}
                      disabled={loading || !isSuperAdmin || hasSuperAdminRole}
                      sx={{
                        fontSize: '12px',
                        height: '28px',
                        '& .MuiSelect-select': {
                          padding: '4px 32px 4px 12px',
                        },
                      }}
                    >
                      <MenuItem value="Active" sx={{ fontSize: '12px' }}>Active</MenuItem>
                      <MenuItem value="Inactive" sx={{ fontSize: '12px' }}>Inactive</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {user.roles && user.roles.length > 0 ? (
                      <Tooltip title={isSelf ? "You cannot change your own role" : ""}>
                        <Chip
                          key={user.roles[0].id}
                          label={user.roles[0].role}
                          onDelete={isSuperAdmin && !isSelf && !isSuperAdminRole(user.roles[0].role) ? () => onRoleRemove(user.id, user.roles[0].id) : undefined}
                          deleteIcon={isSuperAdmin && !isSelf && !isSuperAdminRole(user.roles[0].role) ? <CloseIcon /> : undefined}
                          color="secondary"
                          variant="outlined"
                          size="small"
                        />
                      </Tooltip>
                    ) : (
                      <StyledTypographyCell variant="body2" color="text.secondary">
                        No role assigned
                      </StyledTypographyCell>
                    )}
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                      <InputLabel sx={{ fontSize: '12px' }}>Select role</InputLabel>
                      <Select
                        value={selectedRole[user.id] || (user.roles && user.roles.length > 0 ? user.roles[0].role : "") || ""}
                        label="Select role"
                        onChange={(e) => onRoleChange(user.id, e.target.value)}
                        disabled={loading || !isSuperAdmin || hasSuperAdminRole}
                        sx={{
                          fontSize: '12px',
                          height: '28px',
                          '& .MuiSelect-select': {
                            padding: '4px 32px 4px 12px',
                          },
                        }}
                      >
                        {roles.length === 0 && !loading ? (
                          <MenuItem disabled sx={{ fontSize: '12px' }}>No roles available</MenuItem>
                        ) : (
                          roles.map((role) => (
                            <MenuItem 
                              key={role.id} 
                              value={role.role} 
                              disabled={isSuperAdminRole(role.role) && superAdminCount >= 1}
                              sx={{ fontSize: '12px' }}
                            >
                              {role.role}
                            </MenuItem>
                          ))
                        )}
                      </Select>
                    </FormControl>

                    <span>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => onRoleAssign(user.id)}
                        sx={{ 
                          minWidth: 32,
                          height: '28px',
                          padding: '4px 8px',
                        }}
                        disabled={loading || !isSuperAdmin || hasSuperAdminRole || !selectedRole[user.id] || (user.roles && user.roles.length > 0 && selectedRole[user.id] === user.roles[0].role)}
                      >
                        <UserPlusIcon sx={{ fontSize: '16px' }} />
                      </Button>
                    </span>
                  </Box>
                </TableCell>
              </TableDataRow>
            );
          })}
        </TableBody>
      </StyledTable>
    </TableContainer>
  );
}

