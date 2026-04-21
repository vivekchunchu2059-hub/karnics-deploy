import React, { useMemo, useState } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { CircularProgress } from "@mui/material";
import { getNiceLakhTicks, formatLakhTick } from "../../utils/salesChartUtils";
import { formatCurrency } from "../../utils/priceCalculation.util";
import { ChartData } from "../../models/Dashboard";
import { APP_COLORS } from "../../constants/colors";

const DEFAULT_SALES_TREND: Array<{ day: string; value: number }> = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
].map((day) => ({ day, value: 0 }));

const DEFAULT_STOCK_SPLIT: Array<ChartData & { percentage?: string }> = [
  { name: "Gold", value: 0, color: APP_COLORS.gold, percentage: "0%" },
  { name: "Silver", value: 0, color: "#9CA3AF", percentage: "0%" },
  { name: "Platinum", value: 0, color: "#92A8D1", percentage: "0%" },
  { name: "Diamond", value: 0, color: "#6CB4EE", percentage: "0%" },
  { name: "Gemstones", value: 0, color: "#88B04B", percentage: "0%" },
  { name: "Other", value: 0, color: "#6b7280", percentage: "0%" },
];

const DEFAULT_CATEGORY_SALES: ChartData[] = [
  { name: "Gold", value: 0, color: APP_COLORS.gold },
  { name: "Silver", value: 0, color: "#9CA3AF" },
  { name: "Platinum", value: 0, color: "#92A8D1" },
  { name: "Diamond", value: 0, color: "#6CB4EE" },
  { name: "Gems & Stones", value: 0, color: "#88B04B" },
  { name: "Gems", value: 0, color: "#6B5B95" },
];

function SalesTrendChart({ data }: { data: Array<{ day: string; value: number }> }) {
  const { domain, ticks } = useMemo(() => getNiceLakhTicks(data), [data]);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 12, fill: "#6b7280" }}
          axisLine={{ stroke: "#e5e7eb" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "#6b7280" }}
          axisLine={{ stroke: "#e5e7eb" }}
          tickLine={false}
          domain={domain}
          ticks={ticks}
          tickFormatter={(value) => formatLakhTick(Number(value))}
        />
        <RechartsTooltip
          formatter={(value: number | undefined) =>
            value != null ? `₹${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}L` : ""
          }
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={APP_COLORS.gold}
          strokeWidth={2.5}
          dot={{ fill: APP_COLORS.gold, r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

const ExpandIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#6b7280]">
    <polyline points="15 3 21 3 21 9" />
    <polyline points="9 21 3 21 3 15" />
    <line x1="21" y1="3" x2="14" y2="10" />
    <line x1="3" y1="21" x2="10" y2="14" />
  </svg>
);

interface DashboardOverviewChartsProps {
  loadingCharts: boolean;
  salesTrendData: Array<{ day: string; value: number }>;
  stockSplitData: Array<ChartData & { percentage?: string }>;
  todaySalesData: Array<{ name: string; value: number; color: string }>;
  categoryMonthlySalesData: ChartData[];
  stockDataGoldValue: number;
  goldPercentage: number;
  onOpenSalesTrend: () => void;
  onOpenMonthSale: () => void;
  onOpenTodaysSale: (selectedTab: StockCardTab) => void;
  stockCardTab: StockCardTab;
  onStockCardTabChange: (tab: StockCardTab) => void;
}

type StockCardTab = "stock" | "today";

const DashboardOverviewCharts: React.FC<DashboardOverviewChartsProps> = ({
  loadingCharts,
  salesTrendData,
  stockSplitData,
  todaySalesData,
  categoryMonthlySalesData,
  stockDataGoldValue,
  goldPercentage,
  onOpenSalesTrend,
  onOpenMonthSale,
  onOpenTodaysSale,
  stockCardTab,
  onStockCardTabChange,
}) => {
  const formatValue = (value: number) => formatCurrency(value);
  const salesTrend = salesTrendData.length ? salesTrendData : DEFAULT_SALES_TREND;
  const stockSplit = stockSplitData.length ? stockSplitData : DEFAULT_STOCK_SPLIT;
  const categorySales = categoryMonthlySalesData.length ? categoryMonthlySalesData : DEFAULT_CATEGORY_SALES;
  const todaySales = todaySalesData;
  const todaySalesTotal = todaySales.reduce((sum, i) => sum + i.value, 0);

  return (
    <div className="mt-8">
      <h2 className="mb-4 text-xl font-semibold text-[#1f2937]">Overview</h2>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Sales Trend Chart */}
        <div className="rounded-2xl bg-white p-6 shadow-[0_8px_26px_rgba(17,24,39,0.08)]">
          <div className="mb-6">
            <h3 className="text-base font-semibold text-[#1f2937]">Sales trend</h3>
          </div>
          <div
            className="rounded-xl bg-[#f9fafb] p-6 h-[280px] flex flex-col cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] relative group"
            onClick={onOpenSalesTrend}
          >
            <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="bg-white rounded-full p-2 shadow-lg">
                <ExpandIcon />
              </div>
            </div>
            <div className="flex-1">
              {loadingCharts ? (
                <div className="flex items-center justify-center h-full">
                  <CircularProgress size={40} />
                </div>
              ) : (
                <SalesTrendChart data={salesTrend} />
              )}
            </div>
          </div>
        </div>

        {/* Stock Split & Today's Sale card with tabs */}
        <div className="rounded-2xl bg-white p-6 shadow-[0_8px_26px_rgba(17,24,39,0.08)]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-[#1f2937]">Stock-Split</h3>
            <div className="flex rounded-lg bg-gray-100 p-0.5">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onStockCardTabChange("stock"); }}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  stockCardTab === "stock" ? "text-white shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
                style={stockCardTab === "stock" ? { backgroundColor: "rgba(89, 12, 22, 1)" } : undefined}
              >
                Stock Split
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onStockCardTabChange("today"); }}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  stockCardTab === "today" ? "text-white shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
                style={stockCardTab === "today" ? { backgroundColor: "rgba(89, 12, 22, 1)" } : undefined}
              >
                Today&apos;s Sale
              </button>
            </div>
          </div>
          <div
            className="rounded-xl bg-[#f9fafb] p-6 h-[330px] flex flex-col cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] relative group"
            onClick={() => onOpenTodaysSale(stockCardTab)}
          >
            <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="bg-white rounded-full p-2 shadow-lg">
                <ExpandIcon />
              </div>
            </div>
            {stockCardTab === "stock" ? (
              <>
                <div className="relative flex-1">
                  {loadingCharts ? (
                    <div className="flex items-center justify-center h-full">
                      <CircularProgress size={40} />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stockSplit}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={85}
                          dataKey="value"
                          paddingAngle={0}
                        >
                          {stockSplit.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: "#fff",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                  {!loadingCharts && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                      <div className="text-2xl font-bold text-[#1f2937]">{goldPercentage}%</div>
                      <div className="text-sm font-medium text-[#6b7280]">
                        {stockDataGoldValue ? formatValue(stockDataGoldValue) : "₹0"}
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs">
                  {stockSplit.map((item, index) => (
                    <div key={index} className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-[#6b7280]">{item.name}</span>
                      <span className="font-semibold text-[#1f2937]">{item.percentage}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="relative flex-1 flex flex-col justify-center">
                  {loadingCharts ? (
                    <div className="flex items-center justify-center h-full">
                      <CircularProgress size={40} />
                    </div>
                  ) : (
                    <>
                      <div className="text-center mb-4">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Total sales today</p>
                        <p className="text-2xl font-bold text-[#1f2937]">{formatValue(todaySalesTotal)}</p>
                      </div>
                      {todaySales.length > 0 ? (
                      <ResponsiveContainer width="100%" height={140}>
                        <PieChart>
                          <Pie
                            data={todaySales}
                            cx="50%"
                            cy="50%"
                            innerRadius={35}
                            outerRadius={55}
                            dataKey="value"
                            paddingAngle={1}
                          >
                            {todaySales.map((entry, index) => (
                              <Cell key={`today-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip
                            formatter={(value: number | undefined) => formatCurrency(value ?? 0)}
                            contentStyle={{
                              backgroundColor: "#fff",
                              border: "1px solid #e5e7eb",
                              borderRadius: "8px",
                              fontSize: "12px",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-[140px] text-sm text-gray-500">
                          No sales today
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs">
                  {todaySales.map((item, index) => (
                    <div key={index} className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-[#6b7280]">{item.name}</span>
                      <span className="font-semibold text-[#1f2937]">{formatValue(item.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Category-wise Monthly Sales Bar Chart */}
        <div className="rounded-2xl bg-white p-6 shadow-[0_8px_26px_rgba(17,24,39,0.08)]">
          <div className="mb-6">
            <h3 className="text-base font-semibold text-[#1f2937]">Category-wise monthly sales</h3>
          </div>
          <div
            className="rounded-xl bg-[#f9fafb] p-6 h-[330px] flex flex-col cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] relative group"
            onClick={onOpenMonthSale}
          >
            <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="bg-white rounded-full p-2 shadow-lg">
                <ExpandIcon />
              </div>
            </div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categorySales}
                  margin={{ top: 5, right: 10, left: -20, bottom: 25 }}
                  barGap={12}
                  barCategoryGap="20%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    axisLine={{ stroke: "#e5e7eb" }}
                    tickLine={false}
                    domain={[0, 80]}
                    ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80]}
                    tickFormatter={(value) => `${value}L`}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    {categorySales.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs">
              {[
                { color: APP_COLORS.gold, label: "Gold" },
                { color: "#9CA3AF", label: "Silver" },
                { color: "#92A8D1", label: "Platinum" },
                { color: "#6CB4EE", label: "Diamond" },
                { color: "#88B04B", label: "Gems & Stones" },
                { color: "#6B5B95", label: "Gems" },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-[#6b7280]">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverviewCharts;
