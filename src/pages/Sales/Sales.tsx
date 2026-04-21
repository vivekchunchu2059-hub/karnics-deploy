import React, { useState, ChangeEvent, useEffect } from 'react';
import { Box, Paper, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Pagination, MenuItem, Collapse } from '@mui/material';
import { KeyboardArrowDown as KeyboardArrowDownIcon, KeyboardArrowRight as KeyboardArrowRightIcon, TrendingUp as TrendingUpIcon, } from '@mui/icons-material';
import log from '../../utils/logger';
import { PageLayout } from '../../components/PageLayout';
import { EmptyState } from '../../components/EmptyState';
import { FilterBar, StyledSelect, FilterField, StyledTable, TableHeaderCell, TableDataRow, ExpandIconButton, TotalAmountCell } from './SalesStyle';
import { SalesSummaryRecord } from '../../models/Sales';
import { apiClient } from '../../api';
import { API_ENDPOINTS } from '../../constants/common';
import SalesPerDay from './SalesPerDay';

interface SalesResponse {
  data: any[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

const Sales: React.FC = () => {
  const [page, setPage] = useState<number>(1);
  const [metalFilter, setMetalFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [salesData, setSalesData] = useState<SalesSummaryRecord[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);


  const itemsPerPage = 10; 
  const loadSales = async () => {
    try {
      setLoading(true);
      log.info('Fetching sales records...');
      const response = await apiClient.get<SalesResponse>(API_ENDPOINTS.SALES, {
        params: {
          page,
          limit: itemsPerPage,
          fromDate: dateFilter || undefined,
          toDate: dateFilter || undefined,
          metal: metalFilter || undefined,
        },
      });
      const data = response.data;
      log.info('Sales data fetched successfully');
      setSalesData(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalItems(data.pagination?.totalItems || 0);
    } catch (error) {
      log.error('Failed to fetch sales records:', error);
      setSalesData([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  // Load data when page, date, metal filter, or debounced search query changes
  // This ensures lazy loading - only fetches 10 records per page when dependencies change
  useEffect(() => {
    setExpandedRow(null);
    loadSales();
  }, [page, dateFilter, metalFilter,]);

  const handlePageChange = (_event: ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };


  // Handle row expansion/collapse
  const handleRowClick = (index: number, billDate?: string, metal?: string) => {
    if (!billDate || !metal) return;

    if (expandedRow === index) {
      setExpandedRow(null);
      return;
    }

    setExpandedRow(index);
  };

  return (
    <PageLayout
      title="Sales"
      icon={<TrendingUpIcon sx={{ fontSize: 26 }} />}
      headerRight={
        <FilterBar>
          <StyledSelect
            value={metalFilter}
            onChange={(e) => {
              setPage(1);
              setMetalFilter(e.target.value as string);
            }}
            displayEmpty
          >
            <MenuItem value="">All Metals</MenuItem>
            <MenuItem value="Gold">Gold</MenuItem>
            <MenuItem value="Silver">Silver</MenuItem>
            <MenuItem value="Diamond">Diamond</MenuItem>
            <MenuItem value="Gemstones">Gemstones</MenuItem>
            <MenuItem value="Platinum">Platinum</MenuItem>
            <MenuItem value="Other">Other</MenuItem>
          </StyledSelect>
          <FilterField
            type="date"
            placeholder="Date"
            variant="outlined"
            size="small"
            value={dateFilter}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setPage(1);
              setDateFilter(e.target.value);
            }}
            InputLabelProps={{
              shrink: true,
            }}
          />
        </FilterBar>
      }
    >
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <Typography color="text.secondary">Loading...</Typography>
        </Box>
      ) : salesData.length === 0 ? (
        <EmptyState
          title="No sales"
          message="No sales records found for the selected filters."
        />
      ) : (
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        <StyledTable>
          <TableHead>
            <TableRow>
              <TableHeaderCell width="40px"></TableHeaderCell>
              <TableHeaderCell>Sales Date</TableHeaderCell>
              <TableHeaderCell>Metal</TableHeaderCell>
              <TableHeaderCell>Weight/Quantity</TableHeaderCell>
              <TableHeaderCell>Amount</TableHeaderCell>
              <TableHeaderCell>GST</TableHeaderCell>
              <TableHeaderCell>Total Amount</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {
              salesData.map((sale, index) => {
                const isExpanded = expandedRow === index;
                const billDate = sale.billDate;

                return (
                  <React.Fragment key={index}>
                    <TableDataRow
                      sx={{
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: '#f5f5f5',
                        },
                      }}
                      onClick={() => handleRowClick(index, billDate, sale.metal)}
                    >
                      <TableCell>
                        <ExpandIconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(index, billDate, sale.metal);
                          }}
                        >
                          {isExpanded ? (
                            <KeyboardArrowDownIcon fontSize="small" />
                          ) : (
                            <KeyboardArrowRightIcon fontSize="small" />
                          )}
                        </ExpandIconButton>
                      </TableCell>
                      <TableCell>{billDate || '—'}</TableCell>
                      <TableCell>{sale.metal || '—'}</TableCell>
                      <TableCell>{sale.weightQuantity || '—'}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>
                        ₹{Number(sale.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>

                      <TableCell>
                        ₹{Number(sale.gstDeduction || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>

                      <TotalAmountCell>
                        ₹{Number(sale.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TotalAmountCell>
                    </TableDataRow>
                    <TableRow>
                      <TableCell
                        style={{ paddingBottom: 0, paddingTop: 0 }}
                        colSpan={8}
                      >
                        <Collapse
                          in={isExpanded}
                          timeout="auto"
                          unmountOnExit
                        >
                          <Box sx={{ margin: 2 }}>
                            {isExpanded && billDate && sale.metal && (
                              <SalesPerDay
                                billDate={billDate}
                                metal={sale.metal}
                              />
                            )}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              })
            }
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
          Showing {salesData.length > 0 ? (page - 1) * itemsPerPage + 1 : 0} - {Math.min(page * itemsPerPage, totalItems)} of {totalItems} sales
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
    </PageLayout>
  );
};

export default Sales;