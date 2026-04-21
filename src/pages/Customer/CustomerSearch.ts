import React, { useState, useEffect, useMemo, ChangeEvent } from 'react';
import {InputAdornment, Menu, MenuItem, IconButton, Box, Typography} from '@mui/material';
import { Search as SearchIcon, FilterList as FilterListIcon } from '@mui/icons-material';
import { SearchField } from './CustomerStyle';
import { CustomerDetails } from '../../models/Billing';

interface CustomerWithSrNo extends CustomerDetails {
  srNo?: number;
  id?: number;
  pincode?: string;
  email?: string;
}

interface UseCustomerSearchProps {
  customers: CustomerWithSrNo[];
  page: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

interface UseCustomerSearchReturn {
  searchQuery: string;
  handleSearchChange: (e: ChangeEvent<HTMLInputElement>) => void;
  filteredCustomers: CustomerWithSrNo[];
  paginatedCustomers: CustomerWithSrNo[];
  totalPages: number;
  SearchField: React.ReactElement;
  FilterMenu: React.ReactElement;
  selectedFilter: 'customerName' | 'phone' | null;
}

/**
 * Custom hook for managing search, filtering and paginating customers
 * Filters customers based on customer name, phone and email fields
 * Manages search query state and automatically resets page when search changes
 */
export const useCustomerSearch = ({
  customers,
  page,
  onPageChange,
  itemsPerPage = 10,
  searchQuery: externalSearchQuery,
  onSearchChange: externalOnSearchChange,
}: UseCustomerSearchProps): UseCustomerSearchReturn => {
  const [internalSearchQuery, setInternalSearchQuery] = useState<string>('');
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedFilter, setSelectedFilter] = useState<'customerName' | 'phone' | null>('customerName');
  
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

  // Filter customers based on search query and selected filter column
  // IMPORTANT: Only search the selected field - never search both fields
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) {
      return customers;
    }
    
    // If no filter is selected, return all customers (don't search)
    if (!selectedFilter) {
      return customers;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return customers.filter((customer: CustomerWithSrNo) => {
      // When customerName filter is selected, ONLY search by customerName
      if (selectedFilter === 'customerName') {
        const customerName = customer.customerName?.toLowerCase() || '';
        return customerName.includes(query);
      } 
      // When phone filter is selected, ONLY search by phone
      else if (selectedFilter === 'phone') {
        const phone = customer.contactNumber?.toLowerCase() || '';
        return phone.includes(query);
      }
      // Default: no match if filter is invalid
      return false;
    });
  }, [customers, searchQuery, selectedFilter]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

  // Filter menu handlers
  const handleFilterMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterMenuClose = () => {
    setFilterAnchorEl(null);
  };

  const handleCustomerNameFilterSelect = () => {
    setSelectedFilter('customerName');
    setFilterAnchorEl(null); // Close menu after selection
    onPageChange(1);
  };

  const handlePhoneFilterSelect = () => {
    setSelectedFilter('phone');
    setFilterAnchorEl(null); // Close menu after selection
    onPageChange(1);
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

  // Get placeholder text based on selected filter
  const getPlaceholder = () => {
    if (selectedFilter === 'customerName') {
      return "Search by Name";
    } else if (selectedFilter === 'phone') {
      return "Search by Phone";
    } else {
      return "Search by Name";
    }
  };

  const SearchFieldComponent = React.createElement(
    SearchField,
    {
      placeholder: getPlaceholder(),
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
          minWidth: 180,
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
          sx: { fontWeight: 600, color: '#424242', mb: 1, fontSize: '12px' },
        },
        "Filter by"
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
          onClick: handlePhoneFilterSelect,
          selected: selectedFilter === 'phone',
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
        "Phone"
      )
    )
  );

  return {
    searchQuery,
    handleSearchChange,
    filteredCustomers,
    paginatedCustomers,
    totalPages,
    SearchField: SearchFieldComponent,
    FilterMenu,
    selectedFilter,
  };
};