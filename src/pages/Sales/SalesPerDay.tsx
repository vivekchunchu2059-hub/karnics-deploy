import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import { SalesDetailRecord } from '../../models/Sales';
import { useEffect, useState } from 'react';
import { apiClient } from '../../api';
import { API_ENDPOINTS } from '../../constants/common';
import log from '../../utils/logger';

const StyledTable = styled(Table)(({ theme }) => ({
  minWidth: 650,
  '& .MuiTableCell-root': {
    fontSize: '13px',
  },
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  backgroundColor: '#fafafa',
  fontWeight: 600,
  fontSize: '12px',
  color: '#424242',
  padding: '8px 10px',
  borderBottom: '2px solid #e0e0e0',
  whiteSpace: 'nowrap',
}));

interface TableHeaderCellProps {
  children?: React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

const TableHeaderCell: React.FC<TableHeaderCellProps> = ({ children, align, ...props }) => {
  return (
    <StyledTableCell align={align} {...props}>
      {children}
    </StyledTableCell>
  );
};

const TableDataRow = styled(TableRow)(({ theme }) => ({
  '&:hover': {
    backgroundColor: '#f9f9f9',
  },
  '& td': {
    padding: '10px 8px',
    borderBottom: '1px solid #f0f0f0',
  },
}));


interface SalesPerDayProps {
  billDate: string;
  metal: string;
}

const SalesPerDay: React.FC<SalesPerDayProps> = ({ billDate, metal }) => {
  const [salesData, setSalesData] = useState<SalesDetailRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchSalesForDate = async () => {
    try {
      setLoading(true);

      log.info('Fetching sales details...');
      const response = await apiClient.get(API_ENDPOINTS.SALES_DETAILS, {
        params: {
          date: billDate,
          metal,
        },
      });

      log.info('Sales details fetched successfully');
      setSalesData(response.data.data || []);
    } catch (error) {
      log.error('Failed to fetch sales for date:', error);
    
      setSalesData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesForDate();
  }, [billDate, metal]);

  return (
    <TableContainer
      component={Paper}
      sx={{
        maxHeight: '600px',
        overflowY: 'auto',
        overflowX: 'auto',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        boxShadow: 'none',
        '&::-webkit-scrollbar': {
          width: '8px',
          height: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: '#f5f5f5',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#bdbdbd',
          borderRadius: '10px',
          '&:hover': {
            background: '#9e9e9e',
          },
        },
        scrollbarWidth: 'thin',
        scrollbarColor: '#bdbdbd #f5f5f5',
      }}
    >
      <StyledTable stickyHeader>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Item Name</TableHeaderCell>
            <TableHeaderCell align="center">Weight/pcs(gm/ct)</TableHeaderCell>
            <TableHeaderCell align="center">Quantity</TableHeaderCell>
            <TableHeaderCell>Amount</TableHeaderCell>
            <TableHeaderCell>GST </TableHeaderCell>
            <TableHeaderCell>Total Amount</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} align="center">
                Loading sales data...
              </TableCell>
            </TableRow>
          ) : (
            salesData.map((sale, index) => {
              const weight = sale.weight;
              const quantity = sale.quantity;
              return (
                <TableDataRow key={`${sale.itemName}-${index}`}>
                  <TableCell> {sale.itemName || '-'}</TableCell>
                  <TableCell align="center">{weight}</TableCell>
                  <TableCell align="center">{quantity}</TableCell>
                  <TableCell>
                  ₹{Number(sale.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>

                  <TableCell>
                    ₹{Number(sale.gstAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>

                  <TableCell>
                    ₹{Number(sale.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                </TableDataRow>
              );
            })
          )}
        </TableBody>
      </StyledTable>
    </TableContainer>
  );
};

export default SalesPerDay;