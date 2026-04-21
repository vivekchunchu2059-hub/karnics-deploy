import React, { useEffect, useState, useCallback } from "react";
import { apiClient } from "../../api";
import MonthSaleDialog from "./MonthSaleDialog";
import SalesTrendDialog from "./SalesTrendDialog";
import TodaysSaleDialog from "./TodaysSaleDialog";
import DashboardStocksSection from "./DashboardStocksSection";
import DashboardOverviewCharts from "./DashboardOverviewCharts";
import RecentSalesSection from "./RecentSalesSection";
import { getMetalPricesFromStorage } from "../../utils/priceCalculation.util";
import { API_ENDPOINTS } from "../../constants/common";
import log from '../../utils/logger';
import { ChartData, SalesData, StockTotalsResponse, SalesTotalsResponse } from "../../models/Dashboard";

const Dashboard: React.FC = () => {
  const [stockData, setStockData] = useState<StockTotalsResponse>({
    metals: [],
    totals: { totalUnits: 0, totalWeightKg: 0, totalValue: 0 },
  });
  const [salesTotals, setSalesTotals] = useState<SalesTotalsResponse>({
    totalSales: 0,
    monthlySales: 0,
  });

  const [loadingStock, setLoadingStock] = useState<boolean>(false);
  const [loadingSales, setLoadingSales] = useState<boolean>(false);
  const [isRefreshingPrices, setIsRefreshingPrices] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isChartModalOpen, setIsChartModalOpen] = useState<boolean>(false);
  const [isSalesTrendModalOpen, setIsSalesTrendModalOpen] = useState<boolean>(false);
  const [isTodaysSaleModalOpen, setIsTodaysSaleModalOpen] = useState<boolean>(false);
  const [salesTrendData, setSalesTrendData] = useState<Array<{ day: string; value: number }>>([]);
  const [categoryMonthlySalesData, setCategoryMonthlySalesData] = useState<ChartData[]>([]);
  const [stockSplitData, setStockSplitData] = useState<Array<ChartData & { percentage?: string }>>([]);
  const [stockValues, setStockValues] = useState<Array<{ name: string; value: number; color: string }>>([]);
  const [monthlySalesBreakdown, setMonthlySalesBreakdown] = useState<Array<{ name: string; monthlyBreakdown: Array<{ month: string; value: number }>; color: string }>>([]);
  const [loadingCharts, setLoadingCharts] = useState<boolean>(false);
  const [recentSales, setRecentSales] = useState<SalesData[]>([]);
  const [loadingRecentSales, setLoadingRecentSales] = useState<boolean>(false);
  const [todaySalesData, setTodaySalesData] = useState<Array<{ name: string; value: number; color: string }>>([]);
  type StockCardTab = "stock" | "today";
  const [stockCardTab, setStockCardTab] = useState<StockCardTab>("stock");

  const loadTodaySales = useCallback(async () => {
    log.info("Fetching Today's Sales...");
    try {
      const response = await apiClient.get<{ data: Array<{ name: string; value: number; color: string }> }>(API_ENDPOINTS.DASHBOARD_TODAY_SALES);
      setTodaySalesData(response.data.data || []);
      log.info("Today's Sales fetched successfully");
    } catch (error) {
      log.error("Failed to fetch today's sales:", error);
      setTodaySalesData([]);
    }
  }, []);

  // Load sales trend data (week-wise - last 7 days)
  const loadSalesTrend = useCallback(async () => {
    log.info("Fetching Sales Trend...");
    try {
      const response = await apiClient.get<{
        data: Array<{ day: string; value: number }>;
      }>(API_ENDPOINTS.DASHBOARD_SALES_TREND);

      // Backend already returns grouped + converted to lakhs
      setSalesTrendData(response.data.data || []);
      log.info("Sales Trend fetched successfully");
    } catch (error) {
      log.error("Failed to fetch sales trend:", error);
      setSalesTrendData([]);
    }
  }, []);


  // Load category monthly sales data
  const loadCategoryMonthlySales = useCallback(async () => {
    log.info("Fetching Category Monthly Sales...");
    try {
      const response = await apiClient.get<{ data: ChartData[] }>(API_ENDPOINTS.DASHBOARD_CATEGORY_MONTHLY);
      setCategoryMonthlySalesData(response.data.data);
      log.info("Category Monthly Sales fetched successfully");
    } catch (error) {
      log.error("Failed to fetch category monthly sales:", error);
      setCategoryMonthlySalesData([]);
    }
  }, []);


  // Load monthly sales breakdown by category from invoices
  const loadMonthlySalesBreakdown = useCallback(async (fromDate?: string, toDate?: string) => {
    log.info("Fetching Monthly Sales By Category...");
    try {
      const params: any = {};
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;

      const response = await apiClient.get<{
        data: Array<{ name: string; monthlyBreakdown: Array<{ month: string; value: number }>; color: string }>;
        totalAmount?: number;
        totalGST?: number;
      }>(API_ENDPOINTS.DASHBOARD_MONTHLY_BY_CATEGORY, { params });
      setMonthlySalesBreakdown(response.data.data);
      log.info("Monthly Sales By Category fetched successfully");
    } catch (error) {
      log.error("Failed to fetch monthly sales by category:", error);
      setMonthlySalesBreakdown([]);
    }
  }, []);

  // Load stock split data
  const loadStockSplit = useCallback(async () => {
    log.info("Fetching Stock Split...");
    try {
      const prices = getMetalPricesFromStorage();
      const response = await apiClient.get<{ data: Array<ChartData & { percentage: string }>, totalValue: number }>(API_ENDPOINTS.DASHBOARD_STOCK_SPLIT, {
        params: {
          goldPrice: prices.gold,
          silverPrice: prices.silver,
          platinumPrice: prices.platinum,
        },
      });
      setStockSplitData(response.data.data);
      log.info("Stock Split fetched successfully");
    } catch (error) {
      log.error("Failed to fetch stock split:", error);
      setStockSplitData([]);
    }
  }, []);

  // Load stock values for popup
  const loadStockValues = useCallback(async () => {
    log.info("Fetching Stock Values...");
    try {
      const prices = getMetalPricesFromStorage();
      const response = await apiClient.get<{ data: Array<{ name: string; value: number; color: string }> }>(API_ENDPOINTS.DASHBOARD_STOCK_VALUES, {
        params: {
          goldPrice: prices.gold,
          silverPrice: prices.silver,
          platinumPrice: prices.platinum,
        },
      });
      setStockValues(response.data.data);
      log.info("Stock Values fetched successfully");
    } catch (error) {
      log.error("Failed to fetch stock values:", error);
      setStockValues([]);
    }
  }, []);

  // Load all chart data
  useEffect(() => {
    setLoadingCharts(true);
    Promise.all([
      loadSalesTrend(),
      loadCategoryMonthlySales(),
      loadStockSplit(),
      loadStockValues(),
      loadMonthlySalesBreakdown(),
      loadTodaySales(),
    ]).finally(() => {
      setLoadingCharts(false);
    });
  }, [loadSalesTrend, loadCategoryMonthlySales, loadStockSplit, loadStockValues, loadMonthlySalesBreakdown, loadTodaySales]);

  // Reload stock values when prices update
  useEffect(() => {
    const handleMetalPricesUpdated = () => {
      loadStockValues();
      loadStockSplit();
    };

    window.addEventListener('metalPricesUpdated', handleMetalPricesUpdated);
    return () => {
      window.removeEventListener('metalPricesUpdated', handleMetalPricesUpdated);
    };
  }, [loadStockValues, loadStockSplit]);


  // Load sales totals for selected metal
  const loadSalesTotals = useCallback(async () => {
    log.info("Fetching Sales Totals...");
    try {
      setLoadingSales(true);
      const params: any = {};
      // If a category/metal is selected, filter sales by that metal
      if (selectedCategory) {
        params.metal = selectedCategory;
      }
      const response = await apiClient.get<SalesTotalsResponse>(API_ENDPOINTS.DASHBOARD_SALES, { params });
      setSalesTotals(response.data);
      log.info("Sales Totals fetched successfully");
    } catch (error) {
      log.error("Failed to fetch sales totals:", error);
      setSalesTotals({ totalSales: 0, monthlySales: 0 });
    } finally {
      setLoadingSales(false);
    }
  }, [selectedCategory]);

  // Load stock data with optimized caching
  const loadStock = useCallback(async () => {
    log.info("Fetching Stock...");
    try {
      setLoadingStock(true);

      const prices = getMetalPricesFromStorage();

      const response = await apiClient.get<StockTotalsResponse>(API_ENDPOINTS.DASHBOARD_STOCK, {
        params: {
          goldPrice: prices.gold,
          silverPrice: prices.silver,
          platinumPrice: prices.platinum,
        },
      });
      log.info("Stock fetched successfully");
      setStockData(response.data);
    } catch (error) {
      log.error("Failed to fetch stock:", error);
    } finally {
      setLoadingStock(false);
    }
  }, []);

  // Refresh prices from internet
  const handleRefreshPrices = useCallback(async () => {
    setIsRefreshingPrices(true);
    setIsOffline(false);

    try {
      // Trigger Header's fetch function via custom event
      const refreshEvent = new CustomEvent('refreshMetalPrices');
      window.dispatchEvent(refreshEvent);

      // Wait a bit for prices to update, then reload stock
      setTimeout(() => {
        loadStock();
        setIsRefreshingPrices(false);
      }, 1500);
    } catch (error) {
      log.error('Failed to refresh prices:', error);
      setIsOffline(true);
      setIsRefreshingPrices(false);
    }
  }, [loadStock]);

  // Initial load
  useEffect(() => {
    loadStock();
  }, [loadStock]);

  // Load sales totals - reloads when selected category changes
  useEffect(() => {
    loadSalesTotals();
  }, [loadSalesTotals]);


  // Load recent sales from sales route (same as sales page)
  const loadRecentSales = useCallback(async () => {
    log.info("Fetching Recent Sales...");
    try {
      setLoadingRecentSales(true);

      const response = await apiClient.get<{
        data: SalesData[];
      }>(API_ENDPOINTS.DASHBOARD_RECENT_SALES);

      setRecentSales(response.data.data || []);
      log.info("Recent Sales fetched successfully");
    } catch (error) {
      log.error("Failed to fetch recent sales:", error);
      setRecentSales([]);
    } finally {
      setLoadingRecentSales(false);
    }
  }, []);

  useEffect(() => {
    loadRecentSales();
  }, [loadRecentSales]);

  // Listen for metal prices update event
  useEffect(() => {
    const handleMetalPricesUpdated = () => {
      loadStock();
    };

    window.addEventListener('metalPricesUpdated', handleMetalPricesUpdated);
    return () => {
      window.removeEventListener('metalPricesUpdated', handleMetalPricesUpdated);
    };
  }, [loadStock]);

  const goldStockSplit = stockSplitData.find((item) => item.name === "Gold");
  const goldPercentage =
    goldStockSplit && typeof goldStockSplit.value === "number" ? goldStockSplit.value : 0;
  const stockDataGoldValue = stockData.metals.find((m) => m.name.toLowerCase() === "gold")?.totalValue ?? 0;
  const stockSaleData = stockValues.map((item) => ({
    name: item.name,
    value: item.value,
    color: item.color,
    icon: item.name.toLowerCase(),
  }));
  const getTodaysDate = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, "0");
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const year = today.getFullYear();
    return `${day}-${month}-${year}`;
  };

  return (
    <div className="min-h-screen bg-[#f6f7fb] px-6 py-10 lg:px-12 lg:pl-[320px]">
      <DashboardStocksSection
        stockData={stockData}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        salesTotals={salesTotals}
        loadingSales={loadingSales}
        onRefreshPrices={handleRefreshPrices}
        isRefreshingPrices={isRefreshingPrices}
        isOffline={isOffline}
      />

      <DashboardOverviewCharts
        loadingCharts={loadingCharts}
        salesTrendData={salesTrendData}
        stockSplitData={stockSplitData}
        todaySalesData={todaySalesData}
        categoryMonthlySalesData={categoryMonthlySalesData}
        stockDataGoldValue={stockDataGoldValue}
        goldPercentage={goldPercentage}
        onOpenSalesTrend={() => setIsSalesTrendModalOpen(true)}
        onOpenMonthSale={() => setIsChartModalOpen(true)}
        onOpenTodaysSale={(tab) => {
          setStockCardTab(tab);
          setIsTodaysSaleModalOpen(true);
        }}
        stockCardTab={stockCardTab}
        onStockCardTabChange={setStockCardTab}
      />

      <SalesTrendDialog
        isOpen={isSalesTrendModalOpen}
        onClose={() => setIsSalesTrendModalOpen(false)}
        data={salesTrendData}
      />
      <MonthSaleDialog
        isOpen={isChartModalOpen}
        onClose={() => setIsChartModalOpen(false)}
        data={categoryMonthlySalesData}
        monthlyBreakdown={monthlySalesBreakdown}
        totalStockValue={stockData.totals?.totalValue}
      />
      <TodaysSaleDialog
        isOpen={isTodaysSaleModalOpen}
        initialTab={stockCardTab}
        onClose={(activeTab) => {
          if (activeTab) setStockCardTab(activeTab);
          setIsTodaysSaleModalOpen(false);
        }}
        date={getTodaysDate()}
        stockSplitData={stockSaleData}
        todaySalesData={todaySalesData.map((item) => ({
          name: item.name,
          value: item.value,
          color: item.color,
          icon: item.name.toLowerCase(),
        }))}
      />

      <RecentSalesSection recentSales={recentSales} loadingRecentSales={loadingRecentSales} />
    </div>
  );
};

export default Dashboard;