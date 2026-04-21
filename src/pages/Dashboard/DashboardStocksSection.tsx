import React from "react";
import goldStockIcon from "../../assests/dashboard/goldStock.svg";
import platinumStockIcon from "../../assests/dashboard/platinumStock.svg";
import diamondStockIcon from "../../assests/dashboard/diamondStock.svg";
import gemstonesStockIcon from "../../assests/dashboard/gemstonesStock.svg";
import { formatCurrency } from "../../utils/priceCalculation.util";
import { formatWeight } from "../../utils/weightConversion.util";
import { StockTotalsResponse, SalesTotalsResponse, MetalStock } from "../../models/Dashboard";
import { APP_COLORS } from "../../constants/colors";

const CATEGORY_COLORS: Record<string, string> = {
  gold: APP_COLORS.gold,
  silver: "#9CA3AF",
  platinum: "#A8B2BC",
  diamond: "#22D3EE",
  "gems & stones": "#6EE7B7",
  gems: "#8B5CF6",
  gemstones: "#6EE7B7",
  other: "#6b7280",
};

const DEFAULT_METALS: MetalStock[] = [
  { name: "Gold", color: APP_COLORS.gold, totalUnits: 0, totalWeightKg: 0, totalValue: 0 },
  { name: "Silver", color: "#C0C0C0", totalUnits: 0, totalWeightKg: 0, totalValue: 0 },
  { name: "Platinum", color: "#E5E4E2", totalUnits: 0, totalWeightKg: 0, totalValue: 0 },
  { name: "Diamond", color: "#B9F2FF", totalUnits: 0, totalWeightKg: 0, totalValue: 0 },
  { name: "Gemstones", color: "#9370DB", totalUnits: 0, totalWeightKg: 0, totalValue: 0 },
  { name: "Other", color: "#6b7280", totalUnits: 0, totalWeightKg: 0, totalValue: 0 },
];

function getMetalIcon(name: string, color?: string) {
  const key = name.toLowerCase();
  if (key === "gold") return <img src={goldStockIcon} alt="Gold stock" className="h-7 w-7" />;
  if (key === "silver") return <img src={goldStockIcon} alt="Silver stock" className="h-7 w-7" />;
  if (key === "platinum")
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold" style={{ color }}>
        <img src={platinumStockIcon} alt="Platinum stock" className="h-7 w-7" />
      </div>
    );
  if (key === "diamond")
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold" style={{ color }}>
        <img src={diamondStockIcon} alt="Diamond stock" className="h-7 w-7" />
      </div>
    );
  if (key === "gemstones")
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold" style={{ color }}>
        <img src={gemstonesStockIcon} alt="Gemstones stock" className="h-7 w-7" />
      </div>
    );
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold" style={{ color }}>
      <img src={goldStockIcon} alt="Other stock" className="h-7 w-7" />
    </div>
  );
}

interface DashboardStocksSectionProps {
  stockData: StockTotalsResponse;
  selectedCategory: string | null;
  onSelectCategory: (category: string) => void;
  salesTotals: SalesTotalsResponse;
  loadingSales: boolean;
  onRefreshPrices: () => void;
  isRefreshingPrices: boolean;
  isOffline: boolean;
}

const DashboardStocksSection: React.FC<DashboardStocksSectionProps> = ({
  stockData,
  selectedCategory,
  onSelectCategory,
  salesTotals,
  loadingSales,
}) => {
  const formatValue = (value: number) => formatCurrency(value);
  const metalsForDisplay = stockData.metals.length ? stockData.metals : DEFAULT_METALS;
  const selectedMetal = metalsForDisplay.find((m) => m.name.toLowerCase() === (selectedCategory ?? "").toLowerCase());
  const selectedColor = selectedCategory ? CATEGORY_COLORS[selectedCategory.toLowerCase()] ?? APP_COLORS.gold : APP_COLORS.gold;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold tracking-tight text-[#1d2738]">Stocks & Value</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {metalsForDisplay.map((metal) => {
          const colorKey = metal.name.toLowerCase();
          const cardColor = CATEGORY_COLORS[colorKey] ?? "#9CA3AF";
          return (
            <div
              key={metal.name}
              className="bg-white rounded-2xl shadow-sm overflow-hidden cursor-pointer transition-all hover:shadow-md"
              onClick={() => onSelectCategory(metal.name)}
            >
              <div className="p-5 pb-4">
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: cardColor }}
                  >
                    {getMetalIcon(metal.name, cardColor)}
                  </div>
                  <span className="font-semibold text-base uppercase tracking-wide" style={{ color: cardColor }}>
                    {metal.name}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-[#1d2738]">
                    {formatWeight(metal.totalWeightKg * 1000, metal.name)}
                  </div>
                  <div className="text-base font-semibold text-[#1d2738]">
                    {formatValue(metal.totalValue ?? 0)}
                  </div>
                </div>
              </div>
              <button
                className="w-full py-3 text-white font-medium text-sm flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                style={{ backgroundColor: cardColor }}
              >
                View Details
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5">
                  <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>

      {selectedCategory && selectedMetal && (
        <div className="mb-8">
          <h2 className="text-xl font-bold uppercase tracking-wide mb-4" style={{ color: selectedColor }}>
            {selectedCategory}
          </h2>
          <div className="flex items-start gap-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-[65%]">
              <div className="bg-white rounded-xl p-5 shadow-sm h-[100px] flex flex-col justify-center">
                <div className="text-sm font-medium text-[#6b7280] mb-2">Total stock value</div>
                <div className="text-2xl font-bold text-[#1d2738]">{formatValue(selectedMetal.totalValue ?? 0)}</div>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm h-[100px] flex flex-col justify-center">
                <div className="text-sm font-medium text-[#6b7280] mb-2">Total sale</div>
                <div className="text-2xl font-bold text-[#1d2738]">
                  {loadingSales ? "..." : formatValue(salesTotals.totalSales)}
                </div>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm h-[100px] flex flex-col justify-center">
                <div className="text-sm font-medium text-[#6b7280] mb-2">Monthly sale</div>
                <div className="text-2xl font-bold text-[#1d2738]">
                  {loadingSales ? "..." : formatValue(salesTotals.monthlySales)}
                </div>
              </div>
              {/* <div className="bg-white rounded-xl p-5 shadow-sm h-[100px] flex flex-col justify-center"> */}
                {/* <div className="text-sm font-medium text-[#6b7280] mb-2">Low stock items</div> */}
                {/* <div className="text-2xl font-bold text-[#1d2738]">7</div> */}
              {/* </div> */}
            </div>
        
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardStocksSection;
