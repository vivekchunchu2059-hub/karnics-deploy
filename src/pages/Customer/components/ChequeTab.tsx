import React, { useState, useEffect, ChangeEvent } from 'react';
import {
  Box,
  Paper,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Pagination,
  Select,
  MenuItem,
  FormControl,
  Tooltip,
} from '@mui/material';
import { StyledTable, TableHeaderCell, TableDataRow } from '../CustomerStyle';
import { apiClient } from '../../../api';
import { API_ENDPOINTS } from '../../../constants/common';
import { CheckStatus, CHECK_STATUS_COLORS, CHECK_STATUS_OPTIONS } from '../../../constants/chequeStatus';
import { EmptyState } from '../../../components/EmptyState';
import log from '../../../utils/logger';

interface ChequeData {
  id: number;
  srNo: number;
  customerName: string;
  contactNumber: string;
  invoiceNumber: string;
  chequeNumber: string;
  status: string;
}

interface ChequeTabProps {
  searchQuery: string;
  selectedFilter: 'customerName' | 'phone' | null;
}

const truncateStyle = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap' as const,
};

const ChequeTab: React.FC<ChequeTabProps> = ({ searchQuery, selectedFilter }) => {
  const [page, setPage] = useState<number>(1);
  const [chequeData, setChequeData] = useState<ChequeData[]>([]);
  const [allChequeData, setAllChequeData] = useState<ChequeData[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [statusSort, setStatusSort] = useState<'pendingFirst' | 'clearedFirst'>('pendingFirst');
  const itemsPerPage = 10;

  // Client-side filtering when search query is present
  const filteredChequeData = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return allChequeData;
    }
    const query = searchQuery.toLowerCase().trim();
    return allChequeData.filter((cheque: ChequeData) => {
      const customerName = cheque.customerName?.toLowerCase() || '';
      const contactNumber = cheque.contactNumber?.toLowerCase() || '';

      // When customer name is selected, ONLY search by name
      if (selectedFilter === 'customerName' || !selectedFilter) {
        return customerName.includes(query);
      }
      // When phone is selected, ONLY search by phone
      if (selectedFilter === 'phone') {
        return contactNumber.includes(query);
      }
      return false;
    });
  }, [allChequeData, searchQuery, selectedFilter]);

  // Sort current page by status: Pending first (default) or Cleared first
  const sortedChequeData = React.useMemo(() => {
    const dataToSort = searchQuery.trim() ? filteredChequeData : chequeData;
    if (!dataToSort || !dataToSort.length) return dataToSort || [];
    const pendingFirst = [...dataToSort].sort((a, b) => {
      const aPending = (a.status || '').toLowerCase() !== 'cleared' ? 0 : 1;
      const bPending = (b.status || '').toLowerCase() !== 'cleared' ? 0 : 1;
      if (aPending !== bPending) return aPending - bPending;
      return 0;
    });
    if (statusSort === 'pendingFirst') return pendingFirst;
    return pendingFirst.reverse();
  }, [chequeData, filteredChequeData, statusSort, searchQuery]);

  const fetchCheques = async () => {
    log.info("Fetching Cheques...");
    try {
      // If searching, fetch all data; otherwise use server-side pagination
      const shouldFetchAll = searchQuery.trim().length > 0;
      const res = await apiClient.get(`${API_ENDPOINTS.INVOICES}/getChequesByCheck`, {
        params: shouldFetchAll ? {
          page: 1,
          limit: 10000, // Large limit to fetch all data when searching
        } : {
          page, 
          limit: itemsPerPage,
        },
      });
      const data = res.data?.data || [];
      log.info("Cheques fetched successfully");
      if (shouldFetchAll) {
        setAllChequeData(data);
      } else {
        setChequeData(data);
        setAllChequeData([]);
        setTotalPages(res.data?.pagination?.totalPages ?? 1);
        setTotalItems(res.data?.pagination?.totalRecords ?? 0);
      }
    } catch (err) {
      log.error("Failed to fetch cheques:", err);
      setChequeData([]);
      setAllChequeData([]);
      setTotalPages(1);
      setTotalItems(0);
    }
  };

  useEffect(() => {
    setPage(1); // Reset to page 1 when search query changes
  }, [searchQuery]);

  useEffect(() => {
    fetchCheques();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchQuery]);

  // Calculate pagination for filtered data
  const paginatedChequeData = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return sortedChequeData || [];
    }
    if (!sortedChequeData || !sortedChequeData.length) return [];
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedChequeData.slice(startIndex, endIndex);
  }, [sortedChequeData, page, searchQuery]);

  // Update total items and pages when filtering
  React.useEffect(() => {
    if (searchQuery.trim()) {
      const filteredLength = filteredChequeData?.length || 0;
      setTotalItems(filteredLength);
      setTotalPages(Math.ceil(filteredLength / itemsPerPage));
    }
  }, [filteredChequeData, searchQuery, itemsPerPage]);

  const handleStatusChange = async (invoiceId: number, newStatus: string) => {
    setUpdatingId(invoiceId);
    try {
      await apiClient.put(`${API_ENDPOINTS.INVOICES}/${invoiceId}/cheque-status`, {
        status: newStatus,
      });
      setChequeData((prev) =>
        prev.map((row) => (row.id === invoiceId ? { ...row, status: newStatus } : row))
      );
      log.info('handleStatusChange response successful');
    } catch (err) {
      log.error('Failed to update cheque status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePageChange = (_event: ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const toggleStatusSort = () => {
    setStatusSort((prev) => (prev === 'pendingFirst' ? 'clearedFirst' : 'pendingFirst'));
  };

  // Get color based on check status value
  const getCheckStatusColor = (status: string | undefined): string => {
    if (!status) return "inherit";
    const statusKey = Object.values(CheckStatus).find((value) => value === status);
    return statusKey ? CHECK_STATUS_COLORS[statusKey as CheckStatus] : "inherit";
  };

  const emptyContainerSx = {
    border: '1px solid #e0e0e0',
    borderTop: 'none',
    borderRadius: '0 0 8px 8px',
    overflow: 'hidden',
  };

  const displayData = searchQuery.trim() ? (paginatedChequeData || []) : (sortedChequeData || []);
  const isEmpty = searchQuery.trim()
    ? (!filteredChequeData || filteredChequeData.length === 0)
    : (!chequeData || chequeData.length === 0);

  return (
    <>
      {isEmpty ? (
        <Box sx={emptyContainerSx}>
          <EmptyState
            title="No cheque records"
            message={searchQuery.trim().length > 0 ? "No Customers found matching your search." : "No cheque records found."}
            minHeight={220}
          />
        </Box>
      ) : (
      <TableContainer
        component={Paper}
        elevation={0}
        sx={emptyContainerSx}
      >
        <StyledTable>
          <TableHead>
            <TableRow>
              <TableHeaderCell>S.No.</TableHeaderCell>
              <TableHeaderCell>Customer Name</TableHeaderCell>
              <TableHeaderCell>Phone Number</TableHeaderCell>
              <TableHeaderCell sx={{ minWidth: 170 }}>Invoice Number</TableHeaderCell>
              <TableHeaderCell>Cheque Number</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
              {displayData.map((cheque, index) => {
                const serialNumber = (page - 1) * itemsPerPage + index + 1;
                return (
                <TableDataRow key={cheque.id}>
                  <TableCell>{serialNumber}</TableCell>
                  {/* Customer Name - fixed width, tooltip with ellipsis */}
                  <TableCell sx={{ fontWeight: 500, maxWidth: 160 }}>
                    <Tooltip
                      title={cheque.customerName || '—'}
                      arrow
                    >
                      <Box sx={{ ...truncateStyle, width: '100%' }}>
                        {cheque.customerName || '—'}
                      </Box>
                    </Tooltip>
                  </TableCell>
                  <TableCell>{cheque.contactNumber}</TableCell>
                  <TableCell sx={{ minWidth: 170, whiteSpace: 'nowrap' }}>{cheque.invoiceNumber}</TableCell>
                  <TableCell>{cheque.chequeNumber}</TableCell>
                  <TableCell>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select
                        value={cheque.status}
                        onChange={(e) => handleStatusChange(cheque.id, e.target.value)}
                        disabled={updatingId === cheque.id}
                        displayEmpty
                        sx={{
                          fontSize: '12px',
                          height: '28px',
                          backgroundColor: 'white',
                          '& .MuiSelect-select': { 
                            py: 0.5,
                            color: getCheckStatusColor(cheque.status),
                          },
                        }}
                      >
                        {CHECK_STATUS_OPTIONS.map((opt) => {
                          const statusKey = Object.values(CheckStatus).find((value) => value === opt);
                          const color = statusKey ? CHECK_STATUS_COLORS[statusKey as CheckStatus] : "inherit";
                          return (
                            <MenuItem key={opt} value={opt} sx={{ fontSize: '12px', color: color }}>
                              {opt}
                            </MenuItem>
                          );
                        })}
                      </Select>
                    </FormControl>
                  </TableCell>
                </TableDataRow>
                );
              })}
          </TableBody>
        </StyledTable>
      </TableContainer>
      )}

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 2,
          mt: 3,
        }}
      >
        <Typography sx={{ fontSize: '13px', color: '#666' }}>
          Showing {chequeData.length > 0 ? (page - 1) * itemsPerPage + 1 : 0} -{' '}
          {Math.min(page * itemsPerPage, totalItems)} of {totalItems} records
        </Typography>
        <Pagination
          count={totalPages}
          page={page}
          onChange={handlePageChange}
          siblingCount={0}
          boundaryCount={1}
          sx={{
            '& .MuiPaginationItem-root': {
              fontSize: '14px',
              minWidth: '32px',
              height: '32px',
              margin: '0 2px',
              border: '1px solid #d3d3d3',
              borderRadius: '4px',
              color: '#424242',
              '&:hover': { backgroundColor: '#f5f5f5' },
              '&.Mui-selected': {
                backgroundColor: '#6b1010',
                color: '#ffffff',
                borderColor: '#2c2c2c',
                '&:hover': { backgroundColor: '#8b1515' },
              },
            },
          }}
        />
      </Box>
    </>
  );
};

export default ChequeTab;