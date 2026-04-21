import React, { useEffect, useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import { Person as PersonIcon, AccountBalance as AccountBalanceIcon, CreditCard as CreditCardIcon, People as PeopleIcon } from '@mui/icons-material';
import { PageLayout } from '../../components/PageLayout';
import { SearchBar, TabsContainer } from './CustomerStyle';
import CustomerDetailsTab from './components/CustomerDetailsTab';
import ChequeTab from './components/ChequeTab';
import CreditTab from './components/CreditTab';
import { useCustomerSearch } from './CustomerSearch';

const Customers: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  // Handle search query change
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setPage(1);
  };

  // Use custom hook for search field
  const { SearchField, FilterMenu, selectedFilter } = useCustomerSearch({
    customers: [],
    page,
    onPageChange: setPage,
    itemsPerPage: 10,
    searchQuery,
    onSearchChange: handleSearchChange,
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <PageLayout
      title="Customers"
      icon={<PeopleIcon sx={{ fontSize: 26 }} />}
      headerRight={
        <SearchBar>
          {SearchField}
          {FilterMenu}
        </SearchBar>
      }
    >
      {/* Tabs */}
      <TabsContainer>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{
            borderBottom: '1px solid #e0e0e0',
            '& .MuiTabs-indicator': {
              backgroundColor: 'transparent',
            },
          }}
        >
          <Tab
            icon={<PersonIcon sx={{ fontSize: '18px', mr: 0.5, color: activeTab === 0 ? '#ffffff' : undefined }} />}
            iconPosition="start"
            label="CUSTOMER DETAILS"
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '13px',
              color: activeTab === 0 ? '#ffffff' : '#757575',
              backgroundColor: activeTab === 0 ? 'rgba(89, 12, 22, 1)' : 'transparent',
              border: activeTab === 0 ? '1px solid #e0e0e0' : '1px solid transparent',
              borderBottom: activeTab === 0 ? '1px solid rgba(89, 12, 22, 1)' : '1px solid #e0e0e0',
              borderRadius: '8px 8px 0 0',
              marginBottom: '-1px',
              minHeight: '48px',
              padding: '12px 20px',
              '& .MuiTab-iconWrapper': { color: 'inherit' },
              '&.Mui-selected': { color: '#ffffff', '& .MuiTab-iconWrapper': { color: '#ffffff' } },
              '&:hover': {
                backgroundColor: activeTab === 0 ? 'rgba(89, 12, 22, 1)' : '#f5f5f5',
              },
            }}
          />
          <Tab
            icon={<AccountBalanceIcon sx={{ fontSize: '18px', mr: 0.5, color: activeTab === 1 ? '#ffffff' : undefined }} />}
            iconPosition="start"
            label="CHEQUE"
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '13px',
              color: activeTab === 1 ? '#ffffff' : '#757575',
              backgroundColor: activeTab === 1 ? 'rgba(89, 12, 22, 1)' : 'transparent',
              border: activeTab === 1 ? '1px solid #e0e0e0' : '1px solid transparent',
              borderBottom: activeTab === 1 ? '1px solid rgba(89, 12, 22, 1)' : '1px solid #e0e0e0',
              borderRadius: '8px 8px 0 0',
              marginBottom: '-1px',
              minHeight: '48px',
              padding: '12px 20px',
              '& .MuiTab-iconWrapper': { color: 'inherit' },
              '&.Mui-selected': { color: '#ffffff', '& .MuiTab-iconWrapper': { color: '#ffffff' } },
              '&:hover': {
                backgroundColor: activeTab === 1 ? 'rgba(89, 12, 22, 1)' : '#f5f5f5',
              },
            }}
          />
          <Tab
            icon={<CreditCardIcon sx={{ fontSize: '18px', mr: 0.5, color: activeTab === 2 ? '#ffffff' : undefined }} />}
            iconPosition="start"
            label="CREDIT"
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '13px',
              color: activeTab === 2 ? '#ffffff' : '#757575',
              backgroundColor: activeTab === 2 ? 'rgba(89, 12, 22, 1)' : 'transparent',
              border: activeTab === 2 ? '1px solid #e0e0e0' : '1px solid transparent',
              borderBottom: activeTab === 2 ? '1px solid rgba(89, 12, 22, 1)' : '1px solid #e0e0e0',
              borderRadius: '8px 8px 0 0',
              marginBottom: '-1px',
              minHeight: '48px',
              padding: '12px 20px',
              '& .MuiTab-iconWrapper': { color: 'inherit' },
              '&.Mui-selected': { color: '#ffffff', '& .MuiTab-iconWrapper': { color: '#ffffff' } },
              '&:hover': {
                backgroundColor: activeTab === 2 ? 'rgba(89, 12, 22, 1)' : '#f5f5f5',
              },
            }}
          />
        </Tabs>
      </TabsContainer>

      {/* Tab Content */}
      <Box sx={{ mt: 0 }}>
        {activeTab === 0 && <CustomerDetailsTab searchQuery={searchQuery} selectedFilter={selectedFilter} />}
        {/* @ts-ignore selectedFilter is supported by ChequeTab props */}
        {activeTab === 1 && <ChequeTab searchQuery={searchQuery} selectedFilter={selectedFilter} />}
        {activeTab === 2 && <CreditTab searchQuery={searchQuery} selectedFilter={selectedFilter} />}
      </Box>
    </PageLayout>
  );
};

export default Customers;