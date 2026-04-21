import React, { useState, useEffect, useMemo, ChangeEvent } from 'react';
import { InputAdornment, Menu, MenuItem, IconButton, Box, Typography } from '@mui/material';
import { Search as SearchIcon, FilterList as FilterListIcon } from '@mui/icons-material';
import type { UseInventorySearchProps, UseInventorySearchReturn, Product } from './Product';
import { SearchField } from './InventoryWidgets';


/**
 * Custom hook for managing search, filtering and paginating inventory products
 * Filters products based on product name and category fields
 * Manages search query state and automatically resets page when search changes
 */
export const useInventorySearch = ({
  products,
  page,
  onPageChange,
  itemsPerPage = 10,
  searchQuery: externalSearchQuery,
  onSearchChange: externalOnSearchChange,
}: UseInventorySearchProps): UseInventorySearchReturn => {
  const [internalSearchQuery, setInternalSearchQuery] = useState<string>('');
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedFilter, setSelectedFilter] = useState<'product' | 'category' | null>('product');
  
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

  // Filter products based on search query and selected filter column
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return products;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return products.filter((product: Product) => {
      if (selectedFilter === 'product') {
        // Filter by Metal instead of Product name
        const metal = product.metal?.toLowerCase() || '';
        return metal.includes(query);
      } else if (selectedFilter === 'category') {
        const category = product.category?.toLowerCase() || '';
        return category.includes(query);
      } else {
        // No filter selected: search in both Metal and Category using OR logic
        const metal = product.metal?.toLowerCase() || '';
        const category = product.category?.toLowerCase() || '';
        return category.includes(query) || metal.includes(query);
      }
    });
  }, [products, searchQuery, selectedFilter]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Filter menu handlers
  const handleFilterMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterMenuClose = () => {
    setFilterAnchorEl(null);
  };

  const handleMetalFilterSelect = () => {
    setSelectedFilter(selectedFilter === 'product' ? null : 'product');
    onPageChange(1);
  };

  const handleCategoryFilterSelect = () => {
    setSelectedFilter(selectedFilter === 'category' ? null : 'category');
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

  const SearchFieldComponent = React.createElement(
    SearchField,
    {
      placeholder: "Search Metal, Category",
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
          onClick: handleMetalFilterSelect,
          selected: selectedFilter === 'product',
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
        "Metal"
      ),
      React.createElement(
        MenuItem,
        {
          onClick: handleCategoryFilterSelect,
          selected: selectedFilter === 'category',
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
        "Category"
      )
    )
  );

  return {
    searchQuery,
    handleSearchChange,
    filteredProducts,
    paginatedProducts,
    totalPages,
    SearchField: SearchFieldComponent,
    FilterMenu,
    selectedFilter,
  };
};