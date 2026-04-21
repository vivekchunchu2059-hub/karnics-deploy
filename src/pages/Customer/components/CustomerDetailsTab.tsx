import React, { useState, ChangeEvent, useEffect } from 'react';
import {Box, Paper, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Pagination, Tooltip, DialogContent, DialogActions} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { StyledTable, TableHeaderCell, TableDataRow, ActionIcon, customerTruncateStyle, customerEmptyContainerSx, customerPaginationContainerSx, customerPaginationTypographySx, customerPaginationSx, customerDeleteDialogContentSx, customerDeleteIconContainerSx, customerDeleteTitleTypographySx, customerDeleteBodyTypographySx, customerDeleteDialogActionsSx, customerDeleteCancelButtonSx, customerDeleteConfirmButtonSx, customerSuccessDialogContentSx, customerSuccessIconContainerSx, customerSuccessCheckIconSx, customerSuccessTitleTypographySx, customerSuccessBodyTypographySx, customerSuccessDialogActionsSx, customerSuccessOkButtonSx } from '../CustomerStyle';
import { StyledDialog, SaveButton } from '../../Inventory/InventoryWidgets';
import { CustomerDetails } from '../../../models/Billing';
import { apiClient } from '../../../api';
import { API_ENDPOINTS } from '../../../constants/common';
import { EmptyState } from '../../../components/EmptyState';
import CustomerEditDialog from '../CustomerEditDialog';
import log from '../../../utils/logger';

interface CustomerWithSrNo extends CustomerDetails {
  srNo?: number;
  id?: number;
  pincode?: string;
  email?: string;
}

interface CustomerResponse {
  data: CustomerWithSrNo[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

interface CustomerDetailsTabProps {
  searchQuery: string;
  selectedFilter: 'customerName' | 'phone' | null;
}

const CustomerDetailsTab: React.FC<CustomerDetailsTabProps> = ({ searchQuery, selectedFilter }) => {
  const [page, setPage] = useState<number>(1);
  const [customers, setCustomers] = useState<CustomerWithSrNo[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
  const [customerToDelete, setCustomerToDelete] = useState<CustomerWithSrNo | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [openEditDialog, setOpenEditDialog] = useState<boolean>(false);
  const [customerToEdit, setCustomerToEdit] = useState<CustomerWithSrNo | null>(null);
  const [openSuccessDialog, setOpenSuccessDialog] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const itemsPerPage = 10;

  const loadCustomers = async () => {
    log.info("Fetching Customers...");
    try {
      setLoading(true);
      const response = await apiClient.get<CustomerResponse>(API_ENDPOINTS.CUSTOMERS, {
        params: {
          page,
          limit: itemsPerPage,
          search: searchQuery.trim() || undefined,
        },
      });
      const data = response.data;
      log.info("Customers fetched successfully");
      const rawCustomers = data.data || [];

      // Apply additional client-side filtering based on selected filter
      let filtered = rawCustomers;
      const trimmedQuery = searchQuery.trim().toLowerCase();
      if (trimmedQuery && selectedFilter) {
        filtered = rawCustomers.filter((customer: CustomerWithSrNo) => {
          if (selectedFilter === 'customerName') {
            const name = customer.customerName?.toLowerCase() || '';
            return name.includes(trimmedQuery);
          }
          if (selectedFilter === 'phone') {
            const phone = customer.contactNumber?.toLowerCase() || '';
            return phone.includes(trimmedQuery);
          }
          return false;
        });
      }
      
      setCustomers(filtered);

      // Recalculate totals based on filtered data so "no match" behaves correctly
      const total = filtered.length;
      setTotalItems(total);
      setTotalPages(Math.max(1, Math.ceil(total / itemsPerPage)));
    } catch (error: any) {
      log.error("Failed to fetch customers:", error);
      setCustomers([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1); // Reset to page 1 when search query changes
  }, [searchQuery]);

  useEffect(() => {
    loadCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchQuery]);

  const handlePageChange = (_event: ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleEditClick = (customer: CustomerWithSrNo) => {
    setCustomerToEdit(customer);
    setOpenEditDialog(true);
  };

  const handleEditClose = () => {
    setOpenEditDialog(false);
    setCustomerToEdit(null);
  };

  const handleEditSave = async (payload: Partial<CustomerDetails>) => {
    if (!customerToEdit) {
      return;
    }

    const customerId = customerToEdit.id || customerToEdit.srNo;
    if (!customerId) {
      handleEditClose();
      return;
    }

    try {
      log.info("Updating Customer...");
      await apiClient.put(`${API_ENDPOINTS.CUSTOMERS}/${customerId}`, payload);
      handleEditClose();
      await loadCustomers();
      log.info("Customer updated successfully");
    } catch (error) {
      log.error("Failed to update customer:", error);
    }
  };

  const handleDeleteClick = (customer: CustomerWithSrNo) => {
    setCustomerToDelete(customer);
    setOpenDeleteDialog(true);
  };

  const handleDeleteCancel = () => {
    setOpenDeleteDialog(false);
    setCustomerToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!customerToDelete) {
      return;
    }

    const customerId = customerToDelete.id || customerToDelete.srNo;
    if (!customerId) {
      handleDeleteCancel();
      return;
    }

    try {
      log.info("Deleting Customer...");
      setDeleting(true);
      await apiClient.delete(`${API_ENDPOINTS.CUSTOMERS}/${customerId}`);
      handleDeleteCancel();
      await loadCustomers();
      setSuccessMessage('Customer deleted successfully.');
      setOpenSuccessDialog(true);
      log.info("Customer deleted successfully");
    } catch (error) {
      log.error("Failed to delete customer:", error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {!loading && customers.length === 0 ? (
        <Box sx={customerEmptyContainerSx}>
          <EmptyState
            title="No customers"
            message={searchQuery.trim().length > 0 ? "No Customers found matching your search." : "No customers found."}
            minHeight={220}
          />
        </Box>
      ) : (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={customerEmptyContainerSx}
        >
          <StyledTable>
          <TableHead>
            <TableRow>
              <TableHeaderCell>S.No.</TableHeaderCell>
              <TableHeaderCell>Customer Name</TableHeaderCell>
              <TableHeaderCell>Address</TableHeaderCell>
              <TableHeaderCell>City</TableHeaderCell>
              <TableHeaderCell>Phone Number</TableHeaderCell>
              <TableHeaderCell>Email</TableHeaderCell>
              <TableHeaderCell align="center">Action</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <Typography>Loading...</Typography>
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer, index) => {
                const serialNumber = (page - 1) * itemsPerPage + index + 1;
                return (
                <TableDataRow key={customer.srNo || customer.id || index}>
                  <TableCell>{serialNumber}</TableCell>
                  {/* Customer Name - fixed width, tooltip with ellipsis */}
                  <TableCell sx={{ fontWeight: 500, maxWidth: 160 }}>
                    <Tooltip
                      title={customer.customerName || '—'}
                      arrow
                    >
                      <Box sx={{ ...customerTruncateStyle, width: '100%' }}>
                        {customer.customerName || '—'}
                      </Box>
                    </Tooltip>
                  </TableCell>
                  {/* Address - slightly wider than name/email, tooltip with ellipsis */}
                  <TableCell sx={{ maxWidth: 220 }}>
                    <Tooltip
                      title={customer.address || '—'}
                      arrow
                    >
                      <Box sx={{ ...customerTruncateStyle, width: '100%' }}>
                        {customer.address || '—'}
                      </Box>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip
                      title={customer.city || '—'}
                      arrow
                    >
                      <Box sx={customerTruncateStyle}>
                        {customer.city || '—'}
                      </Box>
                    </Tooltip>
                  </TableCell>
                  <TableCell>{customer.contactNumber || '—'}</TableCell>
                  {/* Email - same width as name, tooltip with ellipsis */}
                  <TableCell sx={{ maxWidth: 160 }}>
                    <Tooltip
                      title={customer.email || '—'}
                      arrow
                    >
                      <Box sx={{ ...customerTruncateStyle, width: '100%' }}>
                        {customer.email || '—'}
                      </Box>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    <ActionIcon
                      size="small"
                      onClick={() => handleEditClick(customer)}
                    >
                      <EditIcon sx={{ fontSize: 18 }} />
                    </ActionIcon>
                    <ActionIcon
                      size="small"
                      onClick={() => handleDeleteClick(customer)}
                    >
                      <DeleteIcon sx={{ fontSize: 18 }} />
                    </ActionIcon>
                  </TableCell>
                </TableDataRow>
                );
              }) )}
            </TableBody>
          </StyledTable>
        </TableContainer>
      )}

      {/* Pagination */}
      <Box sx={customerPaginationContainerSx}>
        <Typography sx={customerPaginationTypographySx}>
          Showing {customers.length > 0 ? (page - 1) * itemsPerPage + 1 : 0} - {Math.min(page * itemsPerPage, totalItems)} of {totalItems} customers
        </Typography>
        <Pagination
          count={totalPages}
          page={page}
          onChange={handlePageChange}
          siblingCount={0}
          boundaryCount={1}
          disabled={loading}
          sx={customerPaginationSx}
        />
      </Box>

      <CustomerEditDialog
        open={openEditDialog}
        customer={customerToEdit}
        onClose={handleEditClose}
        onSave={handleEditSave}
      />

      {/* Delete Confirmation Dialog */}
      <StyledDialog open={openDeleteDialog} onClose={handleDeleteCancel}>
        <DialogContent sx={customerDeleteDialogContentSx}>
          <Box sx={customerDeleteIconContainerSx}>
            <DeleteIcon sx={{ color: '#c62828', fontSize: 30 }} />
          </Box>

          <Typography variant="h6" sx={customerDeleteTitleTypographySx}>
            Confirm Delete
          </Typography>

          <Typography sx={customerDeleteBodyTypographySx}>
            Are you sure you want to delete the customer{' '}
            <strong>"{customerToDelete?.customerName || 'this customer'}"</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>

        <DialogActions sx={customerDeleteDialogActionsSx}>
          <SaveButton
            onClick={handleDeleteCancel}
            sx={customerDeleteCancelButtonSx}
            disabled={deleting}
          >
            Cancel
          </SaveButton>

          <SaveButton
            onClick={handleDeleteConfirm}
            sx={customerDeleteConfirmButtonSx}
            disabled={deleting}
          >
            Delete
          </SaveButton>
        </DialogActions>
      </StyledDialog>

      {/* Success Dialog */}
      <StyledDialog
        open={openSuccessDialog}
        onClose={() => setOpenSuccessDialog(false)}
      >
        <DialogContent sx={customerSuccessDialogContentSx}>
          <Box sx={customerSuccessIconContainerSx}>
            <Box sx={customerSuccessCheckIconSx} />
          </Box>

          <Typography variant="h6" sx={customerSuccessTitleTypographySx}>
            Success!
          </Typography>

          <Typography sx={customerSuccessBodyTypographySx}>
            {successMessage}
          </Typography>
        </DialogContent>
        <DialogActions sx={customerSuccessDialogActionsSx}>
          <SaveButton
            onClick={() => setOpenSuccessDialog(false)}
            sx={customerSuccessOkButtonSx}
          >
            OK
          </SaveButton>
        </DialogActions>
      </StyledDialog>
    </>
  );
};

export default CustomerDetailsTab;