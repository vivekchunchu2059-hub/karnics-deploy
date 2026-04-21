import React, { useState, ChangeEvent, useEffect } from 'react';
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
  Chip,
  IconButton,
  Collapse,
  Tooltip,
} from '@mui/material';
import {
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import {
  StyledTable,
  TableHeaderCell,
  TableDataRow,
  ExpandedRowContainer,
  InstallmentDetailsCard,
  ActionIcon,
} from '../CustomerStyle';
import { CreditData, CustomerInstallmentData, Installment } from '../../../models/Customers';
import { apiClient } from '../../../api';
import InstallmentScrollableTable from './InstallmentTable';
import { API_ENDPOINTS } from '../../../constants/common';
import { EmptyState } from '../../../components/EmptyState';
import { useNotification } from '../../../services/notificationService';
import { InvoiceDialog } from '../../BillingPage/InvoiceDialog';
import { openInvoicePrintDialog } from '../../BillingPage/Billing';
import type { BillDetails, BillingItem, CustomerDetails, InvoiceTotals } from '../../../models/Billing';
import log from '../../../utils/logger';

interface CreditTabProps {
  searchQuery: string;
  selectedFilter: 'customerName' | 'phone' | null;
}

const truncateStyle = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap' as const,
};

/** Parse DD-MM-YYYY or YYYY-MM-DD to timestamp for calendar comparison (date/month/year). */
function parseDateToTime(dateStr: string): number {
  if (!dateStr || typeof dateStr !== 'string') return NaN;
  const parts = dateStr.trim().split(/[-/]/).map((p) => parseInt(p, 10));
  if (parts.length !== 3 || parts.some((n) => isNaN(n))) return NaN;
  let day: number, month: number, year: number;
  if (parts[0] > 31) {
    year = parts[0];
    month = parts[1] - 1;
    day = parts[2];
  } else {
    day = parts[0];
    month = parts[1] - 1;
    year = parts[2];
  }
  const d = new Date(year, month, day);
  return d.getTime();
}

/** True if dateStrA is strictly after dateStrB by calendar (date, month, year). */
function isDateAfter(dateStrA: string, dateStrB: string): boolean {
  const tA = parseDateToTime(dateStrA);
  const tB = parseDateToTime(dateStrB);
  if (Number.isNaN(tA) || Number.isNaN(tB)) return false;
  return tA > tB;
}

/** Parse currency-like input (e.g. "7,954.12", "₹7,954.12") to number. */
function parseCurrencyNumber(value: string | number | null | undefined): number {
  if (typeof value === 'number') return value;
  if (value == null) return NaN;
  const normalized = String(value).replace(/[^0-9.-]/g, '');
  return Number(normalized);
}

const CreditTab: React.FC<CreditTabProps> = ({ searchQuery, selectedFilter }) => {
  const { showError } = useNotification();
  const [page, setPage] = useState<number>(1);
  const [customerData, setCustomerData] = useState<CreditData[]>([]);
  const [allCustomerData, setAllCustomerData] = useState<CreditData[]>([]);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);

  const itemsPerPage = 10;

  // Hardcoded installment data for demo (row 2 - srNo 2)
  const [installmentData, setInstallmentData] = useState<CustomerInstallmentData | null>(null);

  const [openInvoice, setOpenInvoice] = useState(false);
  const [invoiceInstallmentData, setInvoiceInstallmentData] = useState<CustomerInstallmentData | null>(null);
  const [registrationData, setRegistrationData] = useState<{
    cgst: number;
    sgst: number;
    gstNumber: string;
    makingCharges: number;
    shopName?: string;
    shopAddress?: string;
    mobileNumber?: string;
    email?: string;
    logo?: string;
  } | null>(null);

  const [newInstallment, setNewInstallment] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
  });

  const handleInstallmentData = (customer: CreditData) => {
    if (customer.customerInstallmentData) {
   
      if (installmentData?.invoiceNo === customer.customerInstallmentData.invoiceNo) return;

      setInstallmentData({
        ...customer.customerInstallmentData,
        customerName: customer.customerName,
        phoneNumber: customer.contactNumber,
        address: customer.address,
        email: customer.email,
        customerTitle: customer.customerTitle,
        state: customer.state,
        city: customer.city,
        panAadharType: customer.panAadharType,
        panAadharNumber: customer.panAadharNumber,
      });
    }
  }

  const handleOpenInvoiceDialog = (customer: CreditData) => {
    if (!customer.customerInstallmentData) return;

    // Prefer the already-loaded installmentData state when it matches this customer's invoice,
    // so newly added installments don't disappear after collapse/expand.
    const sourceInstallmentData =
      installmentData &&
      installmentData.invoiceNo === customer.customerInstallmentData.invoiceNo
        ? installmentData
        : customer.customerInstallmentData;

    setInvoiceInstallmentData({
      ...sourceInstallmentData,
      customerName: customer.customerName,
      phoneNumber: customer.contactNumber,
      address: customer.address,
      email: customer.email,
      customerTitle: customer.customerTitle,
      state: customer.state,
      city: customer.city,
      panAadharType: customer.panAadharType,
      panAadharNumber: customer.panAadharNumber,
    });
    setOpenInvoice(true);
  };

  useEffect(() => {
    setExpandedRow(null)
  }, [page])

  useEffect(() => {
    setPage(1); // Reset to page 1 when search query changes
  }, [searchQuery]);

  // Client-side filtering when search query is present
  const filteredCustomerData = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return allCustomerData;
    }
    const query = searchQuery.toLowerCase().trim();
    return allCustomerData.filter((customer: CreditData) => {
      const customerName = customer.customerName?.toLowerCase() || '';
      const contactNumber = customer.contactNumber?.toLowerCase() || '';

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
  }, [allCustomerData, searchQuery, selectedFilter]);

  const getCreditData = async () => {
    log.info("Fetching Credit Data...");
    try {
      // If searching, fetch all data; otherwise use server-side pagination
      const shouldFetchAll = searchQuery.trim().length > 0;
      const response = await apiClient.get(`${API_ENDPOINTS.INVOICES}/getCustomerByCredit`, {
        params: shouldFetchAll ? {
          page: 1,
          limit: 10000, // Large limit to fetch all data when searching
        } : {
          page,
          limit: itemsPerPage,
        },
      });
      const data = response.data;
      log.info("Credit Data fetched successfully");
      const rawData: CreditData[] = data.data || [];
      // When balance is 0 or effectively zero (e.g. rounding), show Cleared
      const BALANCE_CLEARED_THRESHOLD = 0.01;
      const normalizedData = rawData.map((c: CreditData) => {
        const balance = c.customerInstallmentData?.balance;
        const numBalance = balance != null ? Number(String(balance).replace(/,/g, '')) : NaN;
        const isCleared = !Number.isNaN(numBalance) && numBalance < BALANCE_CLEARED_THRESHOLD;
        return {
          ...c,
          status: isCleared ? 'Cleared' : (c.status || 'Pending'),
        };
      });
      
      if (shouldFetchAll) {
        setAllCustomerData(normalizedData);
      } else {
        setCustomerData(normalizedData);
        setAllCustomerData([]);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalItems(data.pagination?.totalItems || 0);
      }
    } catch (error: any) {
      log.error("Failed to fetch credit data:", error);
      setCustomerData([]);
      setAllCustomerData([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
    }
  };

  useEffect(() => {
    getCreditData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchQuery]);

  // Fetch registration data for invoice header (Installment invoice uses it too)
  useEffect(() => {
    const fetchRegistrationData = async () => {
      try {
        const response = await apiClient.get<{ success: boolean; data: any[] }>('/api/registration');
        const registrations = response.data.data || [];
        if (registrations.length === 0) return;
        const latestRegistration = registrations[registrations.length - 1];
        setRegistrationData({
          cgst: Number(latestRegistration.cgst) || 0,
          sgst: Number(latestRegistration.sgst) || 0,
          gstNumber: latestRegistration.gstNumber,
          makingCharges: Number(latestRegistration.makingCharges) || 0,
          shopName: latestRegistration.shopName,
          shopAddress: latestRegistration.shopAddress,
          mobileNumber: latestRegistration.mobileNumber,
          email: latestRegistration.email,
          logo: latestRegistration.logo,
        });
      } catch (error) {
        log.error('Error fetching registration data:', error);
      }
    };
    fetchRegistrationData();
  }, []);

  // Calculate pagination for filtered data
  const paginatedCustomerData = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return customerData;
    }
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredCustomerData.slice(startIndex, endIndex);
  }, [customerData, filteredCustomerData, page, searchQuery]);

  // Update total items and pages when filtering
  React.useEffect(() => {
    if (searchQuery.trim()) {
      setTotalItems(filteredCustomerData.length);
      setTotalPages(Math.ceil(filteredCustomerData.length / itemsPerPage));
    }
  }, [filteredCustomerData, searchQuery, itemsPerPage]);

  const handlePageChange = (_event: ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleExpandClick = (srNo: number) => {
    setExpandedRow(expandedRow === srNo ? null : srNo);
  };

  const formatDate = (date: string) => {
    return new Date(date)
      .toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
      .replace(/\//g, '-');
  }

  const handleAddInstallment = async () => {
    const selectedDate = formatDate(newInstallment.date);

    const amount = parseCurrencyNumber(newInstallment.amount);
    if (!newInstallment.amount || Number.isNaN(amount) || amount <= 0) {
      showError('Please enter a valid amount');
      return;
    }
    // Use small tolerance so paying exact balance (e.g. 0.01) isn't rejected by floating-point
    const balanceNum = parseCurrencyNumber(installmentData?.balance);
    if (Number.isNaN(balanceNum)) {
      showError('Unable to validate installment amount. Please refresh and try again.');
      return;
    }
    if (installmentData && amount > balanceNum + 0.001) {
      showError('Amount cannot exceed balance');
      return;
    }
    if (installmentData) {
      const purchaseDate = formatDate(installmentData.billDate);

      if (!isDateAfter(selectedDate, purchaseDate)) {
        showError('Installment date must be after purchase date.');
        return;
      }
      // New installment date must not be before the latest existing installment date (by calendar)
      const sortedDates = [...installmentData.installments]
        .map((i) => i.date)
        .sort((a, b) => parseDateToTime(a) - parseDateToTime(b));
      const lastInstallmentDate = sortedDates[sortedDates.length - 1];
      const minAllowedDate = lastInstallmentDate || purchaseDate;
      if (!isDateAfter(selectedDate, minAllowedDate)) {
        showError('Installment date must be after the last installment date.');
        return;
      }
      const isDateAlreadyUsed = installmentData.installments.some(
        (inst) => parseDateToTime(inst.date) === parseDateToTime(selectedDate)
      );
      if (isDateAlreadyUsed) {
        showError('Installment already exists for selected date.');
        return;
      }
      const newInstallmentEntry: Installment = {
        installmentNo: installmentData.installments.length + 1,
        date: selectedDate,
        amount: amount.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      };
      try {
        const invoiceId = installmentData.invoiceShort ?? installmentData.invoiceNo;
        await apiClient.post(`api/installments/${invoiceId}`, newInstallmentEntry);
        const newBalance = installmentData.balance - amount;
        setInstallmentData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            installments: [newInstallmentEntry, ...prev.installments],
            balance: newBalance,
          };
        });
        // Keep InvoiceDialog in sync (when opened from the table action) immediately
        setInvoiceInstallmentData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            installments: [newInstallmentEntry, ...prev.installments],
            balance: newBalance,
          };
        });
        setNewInstallment({
          date: new Date().toISOString().split('T')[0],
          amount: '',
        });
        // When balance is 0 or effectively zero, auto-set status to 'Cleared'
        if (newBalance < 0.01) {
          setCustomerData((prev) =>
            prev.map((c: CreditData) => {
              const match = c.customerInstallmentData?.invoiceNo === installmentData.invoiceNo
                || c.invoice === installmentData.invoiceNo
                || c.customerInstallmentData?.invoiceShort === installmentData.invoiceShort;
              if (!match) return c;
              return {
                ...c,
                status: 'Cleared',
                customerInstallmentData: c.customerInstallmentData
                  ? { ...c.customerInstallmentData, balance: 0 }
                  : undefined,
              };
            })
          );
        }
      } catch (error) {
        log.error('Failed to add installment:', error);
      }
    }
  };

  const handleUpdateInstallment = async (invoiceNo: string, installmentNo: number, date: string, amount: string) => {
    if (!installmentData) return;
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showError('Please enter a valid amount');
      return;
    }
    const invoiceId = installmentData.invoiceShort ?? installmentData.invoiceNo;
    try {
      const res = await apiClient.put(
        `api/installments/${invoiceId}/${installmentNo}`,
        { date, amount: numAmount }
      );
      const record = res.data?.data;
      if (record) {
        const updatedBalance = typeof record.balance === 'number' ? record.balance : parseFloat(String(record.balance || 0));
        setInstallmentData((prev) => {
          if (!prev || prev.invoiceNo !== invoiceNo) return prev;
          return {
            ...prev,
            installments: (record.installments || []).map((i: { installmentNo: number; date: string; amount: number | string }) => ({
              installmentNo: i.installmentNo,
              date: i.date,
              amount: typeof i.amount === 'number' ? i.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : String(i.amount),
            })),
            balance: updatedBalance,
          };
        });
        setInvoiceInstallmentData((prev) => {
          if (!prev || prev.invoiceNo !== invoiceNo) return prev;
          return {
            ...prev,
            installments: record.installments,
            balance: updatedBalance,
          };
        });
        // When balance is 0 or effectively zero after update, auto-set status to 'Cleared'
        if (updatedBalance < 0.01 && installmentData) {
          setCustomerData((prev) =>
            prev.map((c: CreditData) => {
              const match = c.customerInstallmentData?.invoiceNo === installmentData.invoiceNo
                || c.invoice === installmentData.invoiceNo
                || c.customerInstallmentData?.invoiceShort === installmentData.invoiceShort;
              if (!match) return c;
              return {
                ...c,
                status: 'Cleared',
                customerInstallmentData: c.customerInstallmentData
                  ? { ...c.customerInstallmentData, balance: 0 }
                  : undefined,
              };
            })
          );
        }
      }
    } catch (err) {
      log.error(err);
      showError('Failed to update installment');
    }
  };

  const emptyContainerSx = {
    border: '1px solid #e0e0e0',
    borderTop: 'none',
    borderRadius: '0 0 8px 8px',
    overflow: 'hidden',
  };

  const displayData = searchQuery.trim() ? paginatedCustomerData : customerData;
  const isEmpty = searchQuery.trim() ? filteredCustomerData.length === 0 : customerData.length === 0;

  return (
    <>
      {isEmpty ? (
        <Box sx={emptyContainerSx}>
          <EmptyState
            title="No credit records"
            message={searchQuery.trim().length > 0 ? "No Customers found matching your search." : "No credit records found."}
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
                <TableHeaderCell sx={{ width: '50px' }}></TableHeaderCell>
                <TableHeaderCell>S.No.</TableHeaderCell>
                <TableHeaderCell>Customer Name</TableHeaderCell>
                <TableHeaderCell>Phone Number</TableHeaderCell>
                <TableHeaderCell sx={{ minWidth: 170 }}>Invoice</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Action</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayData.map((customer: CreditData, index: number) => {
                const serialNumber = (page - 1) * itemsPerPage + index + 1;
                return (
                  <React.Fragment key={index}>
                  <TableDataRow
                    sx={{
                      backgroundColor: expandedRow === index ? '#fef9e7' : 'transparent',
                    }}
                  >
                    <TableCell sx={{ padding: '0 8px' }}>
                      <IconButton
                        size="small"
                        onClick={() => {
                          handleExpandClick(index)
                          handleInstallmentData(customer)
                          // setInstallmentData(credit?.customerInstallmentData)
                        }}
                        sx={{
                          padding: '4px',
                          color: '#757575',
                          '&:hover': {
                            backgroundColor: '#f0f0f0',
                          },
                        }}
                      >
                        {expandedRow === index ? (
                          <KeyboardArrowUpIcon sx={{ fontSize: 20 }} />
                        ) : (
                          <KeyboardArrowDownIcon sx={{ fontSize: 20 }} />
                        )}
                      </IconButton>
                    </TableCell>
                    <TableCell>{serialNumber}</TableCell>
                    {/* Customer Name - fixed width, tooltip with ellipsis */}
                    <TableCell sx={{ fontWeight: 500, maxWidth: 160 }}>
                      <Tooltip
                        title={customer.customerName || '—'}
                        arrow
                      >
                        <Box sx={{ ...truncateStyle, width: '100%' }}>
                          {customer.customerName || '—'}
                        </Box>
                      </Tooltip>
                    </TableCell>
                    <TableCell>{customer.contactNumber}</TableCell>
                    <TableCell sx={{ minWidth: 170, whiteSpace: 'nowrap' }}>{customer.invoice}</TableCell>
                    <TableCell>
                      <Chip
                        label={customer.status}
                        size="small"
                        sx={{
                          backgroundColor: customer.status === 'Cleared' ? '#e8f5e9' : '#fff3e0',
                          color: customer.status === 'Cleared' ? '#4caf50' : '#ff9800',
                          fontWeight: 500,
                          fontSize: '12px',
                          height: '24px',
                          border: 'none',
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ width: '120px' }}>
                      <ActionIcon
                        size="small"
                        onClick={() => handleOpenInvoiceDialog(customer)}
                      >
                        <DownloadIcon sx={{ fontSize: 18 }} />
                      </ActionIcon>
                    </TableCell>
                  </TableDataRow>

                  {/* Expanded Row - Only for Pending status */}
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      sx={{
                        padding: '0 !important',
                        backgroundColor: '#fef9e7',
                        borderBottom: expandedRow === index ? '1px solid #e0e0e0' : 'none',
                      }}
                    >
                      <Collapse in={expandedRow === index} timeout="auto" unmountOnExit>
                        <ExpandedRowContainer>
                          <InstallmentDetailsCard>
                            {/* Header Section */}
                            {
                              installmentData && (
                                <>
                                  <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '24px',
                                    width: '100%',
                                    paddingBottom: '15px',
                                    borderBottom: '1px solid #e0e0e0',
                                  }}>
                                    <Typography sx={{ fontSize: '15px', color: '#666', fontWeight: 500 }}>
                                      Payment by:{' '}
                                      <span style={{ color: '#e74c3c', fontWeight: 600 }}>
                                        {installmentData.paymentBy}
                                      </span>
                                    </Typography>
                                    <Typography sx={{ fontSize: '15px', color: '#666', fontWeight: 600 }}>
                                      Total Purchase Amount:{' '}
                                      <span style={{ color: '#000' }}>
                                        {installmentData.totalPurchaseAmount.toLocaleString('en-IN')}
                                      </span>
                                    </Typography>
                                    <Typography sx={{ fontSize: '15px', color: '#666', fontWeight: 600 }}>
                                      Adv. Amount:
                                      <span style={{ color: '#000' }}>
                                        {installmentData.advAmount.toLocaleString('en-IN')}
                                      </span>
                                    </Typography>
                                    <Typography sx={{ fontSize: '15px', color: '#666', fontWeight: 500 }}>
                                      Invoice#:{' '}
                                      <span style={{ fontWeight: 600, color: '#000' }}>
                                        {installmentData.invoiceNo}
                                      </span>
                                    </Typography>
                                  </Box>
                                  {/* Content Section */}
                                  <Box sx={{ display: 'flex', gap: '30px' }}>
                                    {/* Left Section - Purchased Items */}
                                    <Box sx={{ flex: '0 0 300px' }}>
                                      <Typography sx={{
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        marginBottom: '12px',
                                        color: '#2c2c2c',
                                      }}>
                                        Customer Purchased:
                                      </Typography>
                                      <Box component="ul" sx={{
                                        margin: 0,
                                        paddingLeft: '20px',
                                        listStyle: 'disc',
                                      }}>
                                        {installmentData.purchasedItems.map((item, idx) => (
                                          <li key={idx} style={{
                                            fontSize: '13px',
                                            color: '#424242',
                                            marginBottom: '6px',
                                            lineHeight: '1.5',
                                          }}>
                                            {item}
                                          </li>
                                        ))}
                                      </Box>
                                    </Box>

                                    {/* Right Section - Installments */}
                                    <Box sx={{ flex: 1 }}>
                                      <Typography sx={{
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        color: '#2c2c2c',
                                        marginBottom: '12px',
                                      }}>
                                        Installments
                                      </Typography>
                                      <InstallmentScrollableTable
                                        status={customer.status}
                                        installmentData={installmentData}
                                        newInstallment={newInstallment}
                                        setNewInstallment={setNewInstallment}
                                        handleAddInstallment={handleAddInstallment}
                                        onUpdateInstallment={handleUpdateInstallment}
                                      />
                                    </Box>
                                  </Box>
                                </>
                              )
                            }
                          </InstallmentDetailsCard>
                        </ExpandedRowContainer>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                  </React.Fragment>
                );
              })}
            </TableBody>
          </StyledTable>
        </TableContainer>
      )}

      {/* Pagination */}
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
          Showing {customerData.length > 0 ? (page - 1) * itemsPerPage + 1 : 0} - {Math.min(page * itemsPerPage, totalItems)} of {totalItems} records
          {/* Showing {customerData.length > 0 ? startIndex + 1 : 0} - {Math.min(endIndex, customerData.length)} of {customerData.length} records */}
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
              '&:hover': {
                backgroundColor: '#f5f5f5',
              },
              '&.Mui-selected': {
                backgroundColor: '#6b1010',
                color: '#ffffff',
                borderColor: '#2c2c2c',
                '&:hover': {
                  backgroundColor: '#8b1515',
                },
              },
            },
            '& .MuiPaginationItem-previousNext': {
              fontSize: '16px',
            },
          }}
        />
      </Box>

      {invoiceInstallmentData && (
        <InvoiceDialog
          open={openInvoice}
          onClose={() => setOpenInvoice(false)}
          onPrint={openInvoicePrintDialog}
          billDetails={{
            billNumber: invoiceInstallmentData.invoiceNo,
            billDate: invoiceInstallmentData.billDate,
          }}
          paymentMode="CREDIT"
          customerDetails={{
            customerTitle: '',
            customerName: invoiceInstallmentData.customerName,
            contactNumber: invoiceInstallmentData.phoneNumber,
            address: invoiceInstallmentData.address,
            email: invoiceInstallmentData.email,
            state: invoiceInstallmentData.state,
            city: invoiceInstallmentData.city,
            panAadharType: invoiceInstallmentData.panAadharType ?? '',
            panAadharNumber: invoiceInstallmentData.panAadharNumber,
          }}
          items={
            invoiceInstallmentData.purchasedItems?.map((raw) => {
              // purchasedItems from API are like "N × itemName"
              const match = raw.match(/^(\d+)\s*×\s*(.+)$/);
              const quantity = match ? Math.max(1, parseInt(match[1], 10)) : 1;
              const itemName = match ? match[2].trim() : raw;
              return {
                itemName,
                quantity,
                price: 0,
                makingCharge: 0,
              };
            }) ?? []
          }
          totals={{
            subtotal: invoiceInstallmentData.totalPurchaseAmount ?? 0,
            cgstAmount: 0,
            sgstAmount: 0,
            discount: invoiceInstallmentData.advAmount ?? 0,
            grandTotal: invoiceInstallmentData.totalPurchaseAmount ?? 0,
            balance: invoiceInstallmentData.balance ?? 0,
          }}
          cgstPercent={0}
          sgstPercent={0}
          gstEnabled={false}
          viewMode="installment"
          installments={invoiceInstallmentData.installments.map((inst) => ({
            installmentNo: inst.installmentNo,
            date: inst.date,
            amount: Number(String(inst.amount).replace(/,/g, '')) || 0,
          }))}
          registrationData={registrationData ?? undefined}
        />
      )}
    </>
  );
};

export default CreditTab;