import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { TextField, Box, MenuItem, Select, FormControl, InputLabel } from "@mui/material";
import { apiClient } from "../../api";
import log from '../../utils/logger';

interface CategorySalesData {
  name: string;
  value: number;
  color: string;
  monthlyBreakdown?: Array<{ month: string; value: number }>;
}

interface MonthSaleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  data: CategorySalesData[];
  monthlyBreakdown?: Array<{ name: string; monthlyBreakdown: Array<{ month: string; value: number }>; color: string }>;
  /** Total stock value (current market) for header display */
  totalStockValue?: number;
}

const MonthSaleDialog: React.FC<MonthSaleDialogProps> = ({ isOpen, onClose, data, monthlyBreakdown, totalStockValue }) => {
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [filteredData, setFilteredData] = useState<CategorySalesData[]>(data);
  const [filteredBreakdown, setFilteredBreakdown] = useState<Array<{ name: string; monthlyBreakdown: Array<{ month: string; value: number }>; color: string }> | undefined>(monthlyBreakdown);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [totalGST, setTotalGST] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const months = [
    { value: '', label: 'All Months' },
    { value: '0', label: 'January' },
    { value: '1', label: 'February' },
    { value: '2', label: 'March' },
    { value: '3', label: 'April' },
    { value: '4', label: 'May' },
    { value: '5', label: 'June' },
    { value: '6', label: 'July' },
    { value: '7', label: 'August' },
    { value: '8', label: 'September' },
    { value: '9', label: 'October' },
    { value: '10', label: 'November' },
    { value: '11', label: 'December' },
  ];

  // Handle month filter change
  const handleMonthChange = (monthValue: string) => {
    setSelectedMonth(monthValue);
    if (monthValue) {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const monthIndex = parseInt(monthValue);
      const firstDayOfMonth = new Date(year, monthIndex, 1);
      const lastDayOfMonth = new Date(year, monthIndex + 1, 0);
      
      setFromDate(firstDayOfMonth.toISOString().split('T')[0]);
      setToDate(lastDayOfMonth.toISOString().split('T')[0]);
    }
  };

  // Set default date range to current year
  useEffect(() => {
    if (isOpen) {
      const currentDate = new Date();
      const firstDayOfYear = new Date(currentDate.getFullYear(), 0, 1);
      const lastDayOfYear = new Date(currentDate.getFullYear(), 11, 31);
      
      setFromDate(firstDayOfYear.toISOString().split('T')[0]);
      setToDate(lastDayOfYear.toISOString().split('T')[0]);
      setSelectedMonth('');
    }
  }, [isOpen]);

  // Load filtered data when date range changes
  useEffect(() => {
    if (isOpen && fromDate && toDate) {
      loadFilteredData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, fromDate, toDate]);

  const loadFilteredData = async () => {
    log.info("Fetching Filtered Monthly Sales...");
    try {
      setLoading(true);
      const response = await apiClient.get<{ 
        data: Array<{ name: string; monthlyBreakdown: Array<{ month: string; value: number }>; color: string }>;
        totalAmount: number;
        totalGST: number;
      }>("/api/dashboard/monthly-sales-by-category", {
        params: {
          fromDate,
          toDate,
        },
      });
      setFilteredBreakdown(response.data.data);
      setTotalAmount(response.data.totalAmount || 0);
      setTotalGST(response.data.totalGST || 0);
      log.info("Filtered Monthly Sales fetched successfully");
    } catch (error) {
      log.error("Failed to fetch filtered monthly sales:", error);
      setFilteredBreakdown(monthlyBreakdown);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Use filtered breakdown if available, otherwise use original
  const displayBreakdown = filteredBreakdown || monthlyBreakdown;
  const displayData = filteredData.length > 0 ? filteredData : data;
  
  // Use monthly breakdown if provided, otherwise use aggregated data
  const hasBreakdown = displayBreakdown && displayBreakdown.length > 0;
  
  // If we have monthly breakdown, transform it for the chart
  // Group by month and show all categories for each month
  let chartData: Array<{ month: string; [key: string]: string | number }> = [];
  
  if (hasBreakdown && displayBreakdown[0]?.monthlyBreakdown) {
    const monthAbbrs = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const months = displayBreakdown[0].monthlyBreakdown.map(m => m.month);
    chartData = months.map(month => {
      const monthData: { month: string; [key: string]: string | number } = { month };
      displayBreakdown.forEach(category => {
        const monthValue = category.monthlyBreakdown.find(m => m.month === month);
        // Values already include GST from backend
        monthData[category.name] = monthValue ? monthValue.value : 0;
      });
      return monthData;
    });
  } else {
    // Fallback to simple aggregated view
    chartData = displayData.map(item => ({
      month: item.name,
      [item.name]: item.value,
    }));
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn mt-14"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl animate-scaleIn max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header - SunarKhata theme */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5 border-b border-white/20 text-white rounded-t-3xl" style={{ backgroundColor: 'rgba(89, 12, 22, 1)' }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-6 gap-2">
            <h2 className="text-xl sm:text-2xl font-bold">Category-wise Monthly Sales</h2>
           
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors flex-shrink-0"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        {/* Modal Content - Scrollable */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent' }}>
          {/* Elegant Date Range Picker with Month Filter */}
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            mb: 1, 
            alignItems: 'center',
            p: 2,
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          }}>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Select Month</InputLabel>
              <Select
                value={selectedMonth}
                label="Select Month"
                onChange={(e) => handleMonthChange(e.target.value)}
                sx={{
                  borderRadius: '8px',
                  bgcolor: 'white',
                  '&:hover fieldset': {
                    borderColor: '#7c3aed',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#7c3aed',
                  },
                }}
              >
                {months.map((month) => (
                  <MenuItem key={month.value} value={month.value}>
                    {month.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              type="date"
              label="From Date"
              size="small"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setSelectedMonth('');
              }}
              InputLabelProps={{
                shrink: true,
              }}
              sx={{
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  bgcolor: 'white',
                  '&:hover fieldset': {
                    borderColor: '#7c3aed',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#7c3aed',
                  },
                },
              }}
            />
            <TextField
              type="date"
              label="To Date"
              size="small"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setSelectedMonth('');
              }}
              InputLabelProps={{
                shrink: true,
              }}
              sx={{
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  bgcolor: 'white',
                  '&:hover fieldset': {
                    borderColor: '#7c3aed',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#7c3aed',
                  },
                },
              }}
            />
            {loading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#6b7280' }}>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#D4AF37]"></div>
                <span className="text-sm">Loading...</span>
              </Box>
            )}
          </Box>

          {/* Elegant Total Amount with GST Card - always show (gold, silver, platinum and total as 0 when no data) */}
          <Box sx={{ 
            mb: 2, 
            p: 2, 
            background: 'rgba(89, 12, 22, 1)',
            borderRadius: '12px', 
            boxShadow: '0 10px 25px rgba(89, 12, 22, 0.3)',
            color: 'white',
          }}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex-1 min-w-[120px]">
                <div className="text-[11px] font-medium opacity-90 mb-0.5 uppercase tracking-wide">Subtotal (Excl. GST)</div>
                <div className="text-xl font-bold">
                  ₹{((totalAmount || 0) / 100000).toFixed(2)}L
                </div>
              </div>
              <div className="flex-1 min-w-[120px] text-center">
                <div className="text-[11px] font-medium opacity-90 mb-0.5 uppercase tracking-wide">Total GST</div>
                <div className="text-xl font-bold text-gold">
                  ₹{((totalGST || 0) / 100000).toFixed(2)}L
                </div>
              </div>
              <div className="flex-1 min-w-[120px] text-right">
                <div className="text-[11px] font-medium opacity-90 mb-0.5 uppercase tracking-wide">Grand Total (Incl. GST)</div>
                <div className="text-2xl font-bold text-gold">
                  ₹{(((totalAmount || 0) + (totalGST || 0)) / 100000).toFixed(2)}L
                </div>
              </div>
            </div>
          </Box>
          {/* Compact Legend - Outside gray box, at top, right aligned */}
          <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1.5 mb-2">
            {(hasBreakdown ? displayBreakdown : displayData).map((item, index) => (
              <div key={index} className="flex items-center gap-1.5">
                <span 
                  className="h-3 w-3 rounded-sm flex-shrink-0" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs font-medium text-[#374151]">{item.name}</span>
                {!hasBreakdown && 'value' in item && (
                  <span className="text-xs font-bold text-[#1f2937]">₹{item.value}L</span>
                )}
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-br from-[#f9fafb] to-[#f3f4f6] rounded-xl p-4 shadow-inner">
            <div className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={hasBreakdown ? chartData : displayData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  barGap={hasBreakdown ? 8 : 20}
                  barCategoryGap={hasBreakdown ? "10%" : "15%"}
                >
                  <defs>
                    {(hasBreakdown ? displayBreakdown : displayData).map((entry, index) => (
                      <linearGradient key={index} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={entry.color} stopOpacity={1}/>
                        <stop offset="100%" stopColor={entry.color} stopOpacity={0.7}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" vertical={false} />
                  <XAxis 
                    dataKey={hasBreakdown ? "month" : "name"} 
                    tick={{ fontSize: 14, fill: "#374151", fontWeight: 500 }}
                    axisLine={{ stroke: "#9ca3af", strokeWidth: 2 }}
                    tickLine={{ stroke: "#9ca3af" }}
                    textAnchor="middle"
                    height={50}
                  />
                  <YAxis 
                    tick={{ fontSize: 14, fill: "#374151", fontWeight: 500 }}
                    axisLine={{ stroke: "#9ca3af", strokeWidth: 2 }}
                    tickLine={{ stroke: "#9ca3af" }}
                    domain={[0, 'dataMax']}
                    tickFormatter={(value) => `${value}L`}
                    label={{ 
                      value: 'Sales (in Lakhs)', 
                      angle: -90, 
                      position: 'insideLeft',
                      offset: 0,
                      style: { fill: '#374151', fontWeight: 600, fontSize: 14, textAnchor: 'middle' } 
                    }}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const payloadData = payload[0].payload;
                        const categoryName = payload[0].dataKey as string;
                        const categoryData = hasBreakdown 
                          ? displayBreakdown.find(c => c.name === categoryName)
                          : displayData.find((d: CategorySalesData) => d.name === categoryName);
                        const color = categoryData?.color || '#6b7280';
                        
                        return (
                          <div className="bg-white rounded-xl shadow-2xl border-2 border-gray-100 overflow-hidden">
                            {/* Color accent bar at top */}
                            <div 
                              className="h-1.5 w-full"
                              style={{ backgroundColor: color }}
                            />
                            <div className="px-4 py-3">
                              {/* Category name */}
                              <div className="flex items-center gap-2 mb-2">
                                <div 
                                  className="w-3 h-3 rounded-sm shadow-sm"
                                  style={{ backgroundColor: color }}
                                />
                                <span className="text-sm font-bold text-[#1f2937] tracking-tight">
                                  {hasBreakdown ? `${categoryName} - ${payloadData.month}` : categoryName}
                                </span>
                              </div>
                              
                              {/* Sales value */}
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-xs font-medium text-[#6b7280]">
                                  {hasBreakdown ? 'Monthly Sales:' : 'Total Sales:'}
                                </span>
                                <span className="text-lg font-bold text-[#1f2937]">
                                  ₹{hasBreakdown ? Number(payloadData[categoryName] || 0).toFixed(2) : (payloadData as CategorySalesData).value}L
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                    cursor={{ 
                      fill: "rgba(0, 0, 0, 0.03)",
                      radius: 4
                    }}
                  />
                  {hasBreakdown ? (
                    displayBreakdown.map((entry, index) => (
                      <Bar 
                        key={entry.name}
                        dataKey={entry.name}
                        stackId="a"
                        fill={`url(#gradient-${index})`}
                        radius={index === displayBreakdown.length - 1 ? [8, 8, 0, 0] : [0, 0, 0, 0]}
                        animationDuration={800}
                        animationBegin={0}
                      />
                    ))
                  ) : (
                    <Bar 
                      dataKey="value" 
                      radius={[8, 8, 0, 0]}
                      maxBarSize={80}
                      animationDuration={800}
                      animationBegin={0}
                    >
                      {displayData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={`url(#gradient-${index})`}
                          className="hover:opacity-80 transition-opacity"
                        />
                      ))}
                    </Bar>
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthSaleDialog;