import React, { useState, useEffect, useMemo, ChangeEvent } from 'react';
import {InputAdornment, Menu, MenuItem, IconButton, Box, Typography } from '@mui/material';
import { Search as SearchIcon, FilterList as FilterListIcon } from '@mui/icons-material';
import { SearchField } from './InvoiceStyle';
import { InvoiceRecords } from '../../models/Billing';

export interface UseInvoiceSearchProps {
  invoices: InvoiceRecords[];
  page: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export interface UseInvoiceSearchReturn {
  searchQuery: string;
  handleSearchChange: (e: ChangeEvent<HTMLInputElement>) => void;
  filteredInvoices: InvoiceRecords[];
  paginatedInvoices: InvoiceRecords[];
  totalPages: number;
  SearchField: React.ReactElement;
  FilterMenu: React.ReactElement;
  selectedFilter: 'invoiceNumber' | 'customerName' | 'customerPhone' | null;
}

/**
 * Custom hook for managing search, filtering and paginating invoices
 * Filters invoices based on invoice number, customer name, and customer phone
 * Manages search query state and automatically resets page when search changes
 */
export const useInvoiceSearch = ({
  invoices,
  page,
  onPageChange,
  itemsPerPage = 10,
  searchQuery: externalSearchQuery,
  onSearchChange: externalOnSearchChange,
}: UseInvoiceSearchProps): UseInvoiceSearchReturn => {
  const [internalSearchQuery, setInternalSearchQuery] = useState<string>('');
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedFilter, setSelectedFilter] = useState<'invoiceNumber' | 'customerName' | 'customerPhone' | null>('invoiceNumber');
  
  // Use external search query if provided, otherwise use internal state
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const openFilterMenu = Boolean(filterAnchorEl);

  // Reset to page 1 when search query changes
  useEffect(() => {
    onPageChange(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Handle search input change
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (externalOnSearchChange) {
      externalOnSearchChange(value);
    } else {
      setInternalSearchQuery(value);
    }
  };

  // Filter invoices based on search query and selected filter column
  const filteredInvoices = useMemo(() => {
    if (!searchQuery.trim()) {
      return invoices;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return invoices.filter((invoice: InvoiceRecords) => {
      if (selectedFilter === 'invoiceNumber') {
        const invoiceNumber = (invoice.billDetails?.billNumber || (invoice as any).billNumber || '').toString().toLowerCase();
        return invoiceNumber.includes(query);
      } else if (selectedFilter === 'customerName') {
        const customerName = (invoice.customerDetails?.customerName || (invoice as any).customerName || '').toLowerCase();
        return customerName.includes(query);
      } else if (selectedFilter === 'customerPhone') {
        const customerPhone = (invoice.customerDetails?.contactNumber || (invoice as any).contactNumber || '').toString().toLowerCase();
        return customerPhone.includes(query);
      }
      return false;
    });
  }, [invoices, searchQuery, selectedFilter]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);

  // Filter menu handlers
  const handleFilterMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterMenuClose = () => {
    setFilterAnchorEl(null);
  };

  const handleInvoiceNumberFilterSelect = () => {
    setSelectedFilter(selectedFilter === 'invoiceNumber' ? null : 'invoiceNumber');
    onPageChange(1);
    handleFilterMenuClose();
  };

  const handleCustomerNameFilterSelect = () => {
    setSelectedFilter(selectedFilter === 'customerName' ? null : 'customerName');
    onPageChange(1);
    handleFilterMenuClose();
  };

  const handleCustomerPhoneFilterSelect = () => {
    setSelectedFilter(selectedFilter === 'customerPhone' ? null : 'customerPhone');
    onPageChange(1);
    handleFilterMenuClose();
  };

  const hasActiveFilters = selectedFilter !== null;

  // Filter button component for search field
  const filterButton = React.createElement(
    InputAdornment,
    { position: "end" },
    React.createElement(
      IconButton,
      {
        onClick: handleFilterMenuOpen,
        size: "small",
        sx: {
          color: hasActiveFilters ? '#7c3aed' : '#9e9e9e',
          '&:hover': {
            backgroundColor: 'transparent',
            color: hasActiveFilters ? '#6d28d9' : '#757575',
          },
        },
      },
      React.createElement(FilterListIcon, { sx: { fontSize: 20 } })
    )
  );

  // SearchField component with all logic
  const inputProps: any = {
    startAdornment: React.createElement(
      InputAdornment,
      { position: "start" },
      React.createElement(SearchIcon, { sx: { fontSize: 20, color: '#9e9e9e' } })
    ),
    endAdornment: filterButton,
  };

  const SearchFieldComponent = React.createElement(
    SearchField,
    {
      placeholder: "Search Invoice #, Customer Name, Phone",
      variant: "outlined",
      size: "small",
      value: searchQuery,
      onChange: handleSearchChange,
      slotProps: {
        input: inputProps,
      },
    }
  );

  // Filter Menu component
  const FilterMenu = React.createElement(
    Menu,
    {
      anchorEl: filterAnchorEl,
      open: openFilterMenu,
      onClose: handleFilterMenuClose,
      PaperProps: {
        sx: {
          mt: 1,
          minWidth: 200,
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    React.createElement(
      Box,
      { sx: { px: 2, py: 1 } },
      React.createElement(
        Typography,
        {
          variant: "subtitle2",
          sx: { fontWeight: 600, color: '#2e2d47', mb: 1, fontSize: '12px' },
        },
        "Filter by"
      ),
      React.createElement(
        MenuItem,
        {
          onClick: handleInvoiceNumberFilterSelect,
          selected: selectedFilter === 'invoiceNumber',
          sx: {
            fontSize: '14px',
            '&.Mui-selected': {
              backgroundColor: '#f3f4f6',
              color: '#7c3aed',
            },
            '&:hover': {
              backgroundColor: '#f9fafb',
            },
          },
        },
        "Invoice Number"
      ),
      React.createElement(
        MenuItem,
        {
          onClick: handleCustomerNameFilterSelect,
          selected: selectedFilter === 'customerName',
          sx: {
            fontSize: '14px',
            '&.Mui-selected': {
              backgroundColor: '#f3f4f6',
              color: '#7c3aed',
            },
            '&:hover': {
              backgroundColor: '#f9fafb',
            },
          },
        },
        "Customer Name"
      ),
      React.createElement(
        MenuItem,
        {
          onClick: handleCustomerPhoneFilterSelect,
          selected: selectedFilter === 'customerPhone',
          sx: {
            fontSize: '14px',
            '&.Mui-selected': {
              backgroundColor: '#f3f4f6',
              color: '#7c3aed',
            },
            '&:hover': {
              backgroundColor: '#f9fafb',
            },
          },
        },
        "Customer Phone"
      )
    )
  );

  return {
    searchQuery,
    handleSearchChange,
    filteredInvoices,
    paginatedInvoices,
    totalPages,
    SearchField: SearchFieldComponent,
    FilterMenu,
    selectedFilter,
  };
};

