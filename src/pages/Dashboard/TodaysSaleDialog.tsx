import React, { useEffect, useState } from "react";
import { EmptyState } from "../../components/EmptyState";

interface SaleItem {
  name: string;
  value: number;
  color: string;
  icon: string;
}

interface TodaysSaleDialogProps {
  isOpen: boolean;
  initialTab?: TabId;
  onClose: (activeTab?: TabId) => void;
  date: string;
  stockSplitData: SaleItem[];
  todaySalesData: SaleItem[];
}

type TabId = "stock" | "today";

const TodaysSaleDialog: React.FC<TodaysSaleDialogProps> = ({
  isOpen,
  initialTab = "stock",
  onClose,
  date,
  stockSplitData,
  todaySalesData,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setActiveTab(initialTab);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, initialTab]);

  const handleClose = () => {
    onClose(activeTab);
  };

  if (!isOpen) return null;

  const currentData = activeTab === "stock" ? stockSplitData : todaySalesData;
  const total = currentData.reduce((sum, item) => sum + item.value, 0);
  const isEmpty = currentData.length === 0 || total === 0;

  const formatCurrency = (value: number) => {
    return `₹${value.toLocaleString("en-IN")}`;
  };

  const getCategoryIcon = (name: string, color: string) => {
    const iconSize = "w-8 h-8";
    switch (name.toUpperCase()) {
      case "GOLD":
        return (
          <div
            className="flex items-center justify-center w-14 h-14 rounded-2xl shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
              boxShadow: `0 4px 15px ${color}40`,
            }}
          >
            <svg className={iconSize} viewBox="0 0 24 24" fill="white">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" />
              <path d="M2 17L12 22L22 17" />
              <path d="M2 12L12 17L22 12" />
            </svg>
          </div>
        );
      case "SILVER":
        return (
          <div
            className="flex items-center justify-center w-14 h-14 rounded-2xl shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
              boxShadow: `0 4px 15px ${color}40`,
            }}
          >
            <svg className={iconSize} viewBox="0 0 24 24" fill="white">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" fill="white" fillOpacity="0.3" />
            </svg>
          </div>
        );
      case "PLATINUM":
        return (
          <div
            className="flex items-center justify-center w-14 h-14 rounded-2xl shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
              boxShadow: `0 4px 15px ${color}40`,
            }}
          >
            <svg className={iconSize} viewBox="0 0 24 24" fill="white">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
          </div>
        );
      case "DIAMOND":
        return (
          <div
            className="flex items-center justify-center w-14 h-14 rounded-2xl shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
              boxShadow: `0 4px 15px ${color}40`,
            }}
          >
            <svg className={iconSize} viewBox="0 0 24 24" fill="white">
              <path d="M6 3L2 9L12 22L22 9L18 3H6Z" />
              <path d="M12 9L6 9L12 22L18 9L12 9Z" fill="white" fillOpacity="0.3" />
            </svg>
          </div>
        );
      case "GEMS & STONES":
      case "GEMS":
        return (
          <div
            className="flex items-center justify-center w-14 h-14 rounded-2xl shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
              boxShadow: `0 4px 15px ${color}40`,
            }}
          >
            <svg className={iconSize} viewBox="0 0 24 24" fill="white">
              <path d="M12 2L8 8H16L12 2Z" />
              <path d="M8 8L4 14L12 22L20 14L16 8H8Z" />
              <path d="M8 8L12 22L16 8" fill="white" fillOpacity="0.2" />
            </svg>
          </div>
        );
      default:
        return (
          <div
            className="flex items-center justify-center w-14 h-14 rounded-2xl shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
              boxShadow: `0 4px 15px ${color}40`,
            }}
          >
            <svg className={iconSize} viewBox="0 0 24 24" fill="white">
              <circle cx="12" cy="12" r="10" />
            </svg>
          </div>
        );
    }
  };

  const getSubtitle = () =>
    activeTab === "stock"
      ? `Current stock values (as of ${date})`
      : `Sales by category today (as of ${date})`;

  const getTotalLabel = () =>
    activeTab === "stock" ? "Total Stock Value" : "Total Sales";

  const getEmptyMessage = () =>
    activeTab === "stock"
      ? "No stock data available"
      : "No sales today yet";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn mt-14"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl animate-scaleIn max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - SunarKhata theme */}
        <div className="flex items-center justify-between p-6 border-b border-white/20 text-white rounded-t-3xl flex-shrink-0" style={{ backgroundColor: 'rgba(89, 12, 22, 1)' }}>
          <div>
            <h2 className="text-2xl font-bold">Stock Split & Today&apos;s Sale</h2>
            <p className="text-sm opacity-90 mt-1">{getSubtitle()}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-white/80 uppercase tracking-wide">
                {getTotalLabel()}
              </p>
              <p className="text-xl font-bold">{formatCurrency(total)}</p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors flex-shrink-0"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50/80 px-6 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("stock")}
            className={`px-6 py-4 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              activeTab === "stock"
                ? "border-[rgba(89,12,22,1)] text-white"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            style={activeTab === "stock" ? { backgroundColor: "rgba(89, 12, 22, 1)" } : undefined}
          >
            Stock Split
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("today")}
            className={`px-6 py-4 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              activeTab === "today"
                ? "border-[rgba(89,12,22,1)] text-white"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            style={activeTab === "today" ? { backgroundColor: "rgba(89, 12, 22, 1)" } : undefined}
          >
            Today&apos;s Sale
          </button>
        </div>

        {/* Content */}
        <div
          className="p-8 overflow-y-auto flex-1"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#cbd5e1 transparent" }}
        >
          {isEmpty ? (
            <EmptyState
              title="No data"
              message={getEmptyMessage()}
              minHeight={220}
            />
          ) : (
            <div className="space-y-2">
              {currentData.map((item, index) => (
                <div
                  key={`${activeTab}-${index}-${item.name}`}
                  className="flex items-center justify-between p-4 rounded-2xl hover:shadow-xl transition-all border-2 border-transparent hover:border-gray-200 bg-gradient-to-r from-white via-gray-50/50 to-white group"
                >
                  <div className="flex items-center gap-5">
                    <div className="transform group-hover:scale-110 transition-transform duration-300">
                      {getCategoryIcon(item.name, item.color)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xl font-bold text-[#1f2937] uppercase tracking-wide">
                        {item.name}
                      </span>
                      <span className="text-xs text-[#6b7280] mt-0.5">
                        {item.name === "GOLD" || item.name === "SILVER"
                          ? "Precious Metal"
                          : item.name === "DIAMOND"
                            ? "Gemstone"
                            : "Jewelry"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span
                      className="text-2xl font-bold px-5 py-3 rounded-xl bg-white shadow-md border-2 transition-all group-hover:shadow-lg"
                      style={{
                        color: item.color,
                        borderColor: `${item.color}20`,
                      }}
                    >
                      {formatCurrency(item.value)}
                    </span>
                    {item.value > 0 && total > 0 && (
                      <span className="text-xs text-[#6b7280] mt-1">
                        {((item.value / total) * 100).toFixed(1)}% of total
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TodaysSaleDialog;
