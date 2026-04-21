import React, { useState, ChangeEvent, useEffect, useMemo } from 'react';
import { Box, Dialog, Paper, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Pagination, Tooltip } from '@mui/material';
import { Edit as EditIcon, Download as DownloadIcon, Receipt as ReceiptIcon } from '@mui/icons-material';
import { apiClient } from '../../api';
import { PageLayout } from '../../components/PageLayout';
import { EmptyState } from '../../components/EmptyState';
import { AddInvoiceButton, DateField, StyledTable, TableHeaderCell, TableDataRow, ActionIcon, TotalAmount } from './InvoiceStyle';
import { InvoiceRecords, InvoiceResponse } from '../../models/Billing';
import { useInvoiceSearch } from './InvoiceSearch';
import Billing from '../BillingPage/Billing';
import { InvoiceDialog } from '../BillingPage/InvoiceDialog';
import log from '../../utils/logger';
import { formatInrAmount } from '../../utils/formatCurrency';

// Function to get payment mode colors
const getPaymentModeColors = (mode: string) => {
  const modeLower = mode?.toLowerCase() || '';
  switch (modeLower) {
    case 'cash':
      return {
        textColor: '#ffffff',
        bgColor: '#4caf50',
      };
    case 'upi':
      return {
        textColor: '#ffffff',
        bgColor: '#ff9800',
      };
    case 'cheque':
    case 'check':
      return {
        textColor: '#ffffff',
        bgColor: '#2196f3',
      };
    case 'credit':
    case 'credit card':
      return {
        textColor: '#ffffff',
        bgColor: '#424242',
      };
    default:
      return {
        textColor: '#424242',
        bgColor: '#f5f5f5',
      };
  }
};


const Invoices: React.FC = () => {
  const [fromDate, setFromDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [invoices, setInvoices] = useState<InvoiceRecords[]>([]);
  const [allInvoices, setAllInvoices] = useState<InvoiceRecords[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [printOpen, setPrintOpen] = useState<boolean>(false);
  const [billingOpen, setBillingOpen] = useState<boolean>(false);
  const [billingInvoice, setBillingInvoice] = useState<InvoiceRecords | null>(null);
  const [billingRequestNewInvoice, setBillingRequestNewInvoice] = useState<boolean>(false);
  const [registrationData, setRegistrationData] = useState<any>(null);
  const [printData, setPrintData] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const itemsPerPage = 10;

  // Debounce search query to avoid too many operations
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle search query change - reset to page 1 when search changes
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setPage(1);
  };

  
  // Use custom hook for search field and filter logic
  const { SearchField: SearchFieldComponent, FilterMenu, selectedFilter } = useInvoiceSearch({
    invoices: allInvoices,
    page,
    onPageChange: setPage,
    itemsPerPage: 10,
    searchQuery,
    onSearchChange: handleSearchChange,
  });

  useEffect(() => {
    const fetchRegistrationData = async () => {
      try {
        const response = await apiClient.get('/api/registration');
        const registrations = response.data.data || [];
        if (registrations.length > 0) {
          const latest = registrations[registrations.length - 1];
          setRegistrationData(latest);
        }
      } catch (error) {
        log.error("Error fetching registration data:", error);
      }
    };

    fetchRegistrationData();
  }, []);

  
  const loadInvoices = async () => {
    log.info("Loading Invoices...");
    try {
      setLoading(true);

      // If search query exists, fetch all invoices and filter client-side based on selected columns
      if (debouncedSearchQuery.trim()) {
        const response = await apiClient.get<InvoiceResponse>('/api/invoices', {
          params: {
            page: 1,
            limit: 10000, // Get all invoices for client-side filtering
            fromDate,
            toDate: fromDate,
          },
        });
        const data = response.data;
        const allInvoicesData = data.data || [];
        setAllInvoices(allInvoicesData);

        // Apply search query filter based on selected column from hook
        const query = debouncedSearchQuery.toLowerCase().trim();
        let filteredInvoices = allInvoicesData.filter((invoice: InvoiceRecords) => {
          if (selectedFilter === 'invoiceNumber') {
            const invoiceNumber = (invoice.billDetails?.billNumber || (invoice as any).billNumber || '').toString().toLowerCase();
            return invoiceNumber.includes(query);
          } else if (selectedFilter === 'customerName') {
            const customerName = (invoice.customerDetails?.customerName || (invoice as any).customerName || '').toLowerCase();
            return customerName.includes(query);
          } else if (selectedFilter === 'customerPhone') {
            const customerPhone = (invoice.customerDetails?.contactNumber || (invoice as any).contactNumber || '').toString().toLowerCase();
            return customerPhone.includes(query);
          } else {
            // No filter selected - search in all columns
            const invoiceNumber = (invoice.billDetails?.billNumber || (invoice as any).billNumber || '').toString().toLowerCase();
            const customerName = (invoice.customerDetails?.customerName || (invoice as any).customerName || '').toLowerCase();
            const customerPhone = (invoice.customerDetails?.contactNumber || (invoice as any).contactNumber || '').toString().toLowerCase();
            return invoiceNumber.includes(query) || customerName.includes(query) || customerPhone.includes(query);
          }
        });

        // Paginate client-side
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);

        setInvoices(paginatedInvoices);
        setTotalPages(Math.ceil(filteredInvoices.length / itemsPerPage));
        setTotalItems(filteredInvoices.length);
      } else {
        // No search query - use server-side pagination
        const response = await apiClient.get<InvoiceResponse>('/api/invoices', {
          params: {
            page,
            limit: itemsPerPage,
            fromDate,
            toDate: fromDate,
          },
        });
        const data = response.data;
        log.info("Invoices fetched successfully");
        const invoicesData = data.data || [];
        setInvoices(invoicesData);
        setAllInvoices(invoicesData);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalItems(data.pagination?.totalItems || 0);
      }
    } catch (error) {
      log.error("Failed to fetch invoices:", error);
      setInvoices([]);
      setAllInvoices([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearchQuery, fromDate, selectedFilter]);

  const filteredCountLabel = useMemo(
    () => `${totalItems} invoice${totalItems === 1 ? '' : 's'}`,
    [totalItems]
  );

  const handlePageChange = (_event: ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleEdit = (invoice: InvoiceRecords) => {
    setBillingInvoice(invoice);
    setBillingRequestNewInvoice(false);
    setBillingOpen(true);
  };

  const handleGenerateInvoice = () => {
    setBillingInvoice(null);
    setBillingRequestNewInvoice(true);
    setBillingOpen(true);
  };

  const handleCloseBillingDialog = () => {
    setBillingOpen(false);
    setBillingInvoice(null);
    setBillingRequestNewInvoice(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleDownload = (invoice?: InvoiceRecords) => {
    if (!invoice) return;

    const billNumber =
      invoice.billDetails?.billNumber ||
      (invoice as any).billNumber ||
      '';

    const billDate =
      invoice.billDetails?.billDate ||
      (invoice as any).billDate ||
      '';

    setPrintData({
      billDetails: {
        billNumber,
        billDate,
      },
      paymentMode: invoice.paymentDetails?.mode || 'Cash',
      customerDetails: invoice.customerDetails,
      items: invoice.items || [],
      totals: invoice.totals,
      cgstPercent: (invoice as any).cgstPercent || 1.5,
      sgstPercent: (invoice as any).sgstPercent || 1.5,
      gstEnabled: (invoice as any).gstEnabled !== false,
      registrationData,
    });

    setPrintOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    loadInvoices();
  }, [page, debouncedSearchQuery, fromDate, selectedFilter, refreshTrigger]);

  const truncateStyle = {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  };


  return (
    <PageLayout
      title="Invoices"
      icon={<ReceiptIcon sx={{ fontSize: 26 }} />}
      headerRight={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', minWidth: 0, maxWidth: '100%' }}>
          <DateField
            type="date"
            variant="outlined"
            size="small"
            value={fromDate}
            placeholder="Date"
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setPage(1);
              setFromDate(e.target.value);
            }}
            InputLabelProps={{
              shrink: true,
            }}
          />
          {SearchFieldComponent}
          {FilterMenu}
          <AddInvoiceButton onClick={handleGenerateInvoice}>
            Generate Invoice
          </AddInvoiceButton>
        </Box>
      }
    >
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <Typography color="text.secondary">Loading...</Typography>
        </Box>
      ) : invoices.length === 0 ? (
        <EmptyState
          title="No invoices"
          message={debouncedSearchQuery.trim().length > 0 ? "No invoices found matching your search." : "No invoices found. Create one from Billing to see them here."}
        />
      ) : (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            overflow: 'hidden',
            overflowX: 'auto',
            maxWidth: '100%',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <StyledTable>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Invoice S.No.</TableHeaderCell>
                <TableHeaderCell>Invoice Date</TableHeaderCell>
                <TableHeaderCell>Items</TableHeaderCell>
                <TableHeaderCell>Wgt/Qty</TableHeaderCell>
                <TableHeaderCell>Customer Name</TableHeaderCell>
                <TableHeaderCell>Customer Phone</TableHeaderCell>
                <TableHeaderCell>Payment Mode</TableHeaderCell>
                <TableHeaderCell>Total Amount</TableHeaderCell>
                <TableHeaderCell align="center">Action</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {
                invoices.map((invoice) => {
                  const firstItem = invoice.items?.[0];
                  const itemsLabel = firstItem
                    ? `${firstItem.itemName}${invoice.items.length > 1 ? ` +${invoice.items.length - 1}` : ''}`
                    : '—';
                  // Calculate separate totals for grams and carats
                  const weightTotals = invoice.items?.reduce((acc, i) => {
                    if (i.weight == null || i.weight === '') return acc;
                    const weightStr = String(i.weight);
                    const numericWeight = parseFloat(weightStr.replace(/\s*(gm|gms|ct|carat|grams)$/i, '').trim());
                    if (isNaN(numericWeight)) return acc;

                    if (weightStr.match(/\s*ct$/i)) {
                      acc.carats += numericWeight;
                    } else {
                      acc.grams += numericWeight;
                    }
                    return acc;
                  }, { grams: 0, carats: 0 }) ?? { grams: 0, carats: 0 };

                  const totalQuantity = invoice.items
                    ?.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0) ?? 0;

                  // Build weight label based on what units are present
                  let weightLabel = '';
                  if (weightTotals.grams > 0 && weightTotals.carats > 0) {
                    weightLabel = `${weightTotals.grams.toFixed(2)}gm/${weightTotals.carats.toFixed(2)}ct`;
                  } else if (weightTotals.grams > 0) {
                    weightLabel = `${weightTotals.grams.toFixed(2)}gm`;
                  } else if (weightTotals.carats > 0) {
                    weightLabel = `${weightTotals.carats.toFixed(2)}ct`;
                  }

                  const quantityLabel = weightLabel || totalQuantity > 0
                    ? `${weightLabel}${weightLabel && totalQuantity > 0 ? '/' : ''}${totalQuantity > 0 ? totalQuantity + "pcs" : ''}`
                    : '—';
                  const price = invoice.totals?.subtotal ?? 0;
                  const total = invoice.totals?.grandTotal ?? price;
                  const paymentMode = invoice.paymentDetails?.mode || invoice.paymentMode || '—';
                  const displayPaymentMode = paymentMode !== '—'
                    ? (paymentMode.toLowerCase() === 'check' ? 'Cheque' : paymentMode.charAt(0).toUpperCase() + paymentMode.slice(1))
                    : '—';
                  return (
                    <TableDataRow key={invoice.id}>
                      <TableCell sx={{ fontWeight: 500 }}>{invoice.billDetails?.billNumber || (invoice as any).billNumber || '—'}</TableCell>
                      <TableCell>{invoice.billDetails?.billDate || (invoice as any).billDate || '—'}</TableCell>
                      <TableCell sx={{ maxWidth: 150 }}>
                        <Tooltip title={itemsLabel} arrow>
                          <Box sx={{ ...truncateStyle, width: '100%' }}>
                            {itemsLabel}
                          </Box>
                        </Tooltip>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 120 }}>
                        <Tooltip title={quantityLabel || '—'} arrow>
                          <Box sx={{ ...truncateStyle, width: '100%' }}>
                            {quantityLabel || '—'}
                          </Box>
                        </Tooltip>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 160 }}>
                        <Tooltip
                          title={invoice.customerDetails?.customerName || (invoice as any).customerName || '—'}
                          arrow
                        >
                          <Box sx={{ ...truncateStyle, width: '100%' }}>
                            {invoice.customerDetails?.customerName || (invoice as any).customerName || '—'}
                          </Box>
                        </Tooltip>
                      </TableCell>
                      <TableCell>{invoice.customerDetails?.contactNumber || (invoice as any).contactNumber || '—'}</TableCell>
                      <TableCell>
                        {displayPaymentMode !== '—' ? (
                          <Box
                            sx={{
                              textAlign: 'center',
                              display: 'inline-flex',
                              px: 1.5,
                              py: 0.5,
                              borderRadius: '999px',
                              fontSize: '11px',
                              fontWeight: 500,
                              ...(() => {
                                const { textColor, bgColor } = getPaymentModeColors(paymentMode);
                                return {
                                  color: textColor,
                                  backgroundColor: bgColor,
                                };
                              })(),
                            }}
                          >
                            {displayPaymentMode}
                          </Box>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TotalAmount>₹{formatInrAmount(total)}</TotalAmount>
                      <TableCell align="center">
                        <ActionIcon size="small" onClick={() => handleEdit(invoice)}>
                          <EditIcon sx={{ fontSize: 18 }} />
                        </ActionIcon>
                        <ActionIcon size="small" onClick={() => handleDownload(invoice)}>
                          <DownloadIcon sx={{ fontSize: 18 }} />
                        </ActionIcon>
                      </TableCell>
                    </TableDataRow>
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
          mt: 3,
        }}
      >
        <Typography sx={{ mr: 2, fontSize: '13px', color: '#666' }}>
          {filteredCountLabel}
        </Typography>
        <Pagination
          count={totalPages}
          page={page}
          onChange={handlePageChange}
          siblingCount={0}
          boundaryCount={1}
          disabled={loading}
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

      {printData && (
        <InvoiceDialog
          open={printOpen}
          onClose={() => setPrintOpen(false)}
          onPrint={handlePrint}
          {...printData}
        />
      )}

      <Dialog
        open={billingOpen}
        onClose={(event, reason) => {
          if (reason === "backdropClick" || reason === "escapeKeyDown") {
            return; // prevent closing
          }
          handleCloseBillingDialog(); // manual close
        }}
        fullWidth
        maxWidth="lg"
      >
        <Billing
          embedded
          onClose={handleCloseBillingDialog}
          invoice={billingInvoice}
          requestNewInvoice={billingRequestNewInvoice}
          onPrintInvoice={(data) => {
            setPrintData(data);
            setPrintOpen(true);
            setBillingOpen(false); // close billing
            setRefreshTrigger(prev => prev + 1); 
          }}
        />
      </Dialog>
    </PageLayout>
  );
};

export default Invoices;


