import React, { useEffect, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getNiceLakhTicks } from "../../utils/salesChartUtils";
import { APP_COLORS } from "../../constants/colors";

interface SalesTrendData {
  day: string;
  value: number;
}

interface SalesTrendDialogProps {
  isOpen: boolean;
  onClose: () => void;
  data: SalesTrendData[];
}

const SalesTrendDialog: React.FC<SalesTrendDialogProps> = ({ isOpen, onClose, data }) => {
  const { domain, ticks } = useMemo(() => getNiceLakhTicks(data), [data]);
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

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn mt-14 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl my-8 animate-scaleIn max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header - SunarKhata theme */}
        <div className="flex items-center justify-between p-6 border-b border-white/20 text-white rounded-t-3xl flex-shrink-0" style={{ backgroundColor: 'rgba(89, 12, 22, 1)' }}>
          <h2 className="text-2xl font-bold">Sales Trend (Weekly - Last 7 Days)</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        {/* Modal Content - Scrollable */}
        <div className="p-8 overflow-y-auto flex-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent' }}>
          {/* Compact Legend - Outside gray box, at top, right aligned */}
          <div className="flex items-center justify-end gap-2 mb-4">
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-0.5 rounded" style={{ backgroundColor: APP_COLORS.gold }} />
              <span className="text-xs font-medium text-[#374151]">Daily Sales</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#f9fafb] to-[#f3f4f6] rounded-2xl p-8 shadow-inner">
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={data} 
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <defs>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={APP_COLORS.gold} stopOpacity={0.8}/>
                      <stop offset="100%" stopColor={APP_COLORS.gold} stopOpacity={1}/>
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" vertical={false} />
                  <XAxis 
                    dataKey="day" 
                    tick={{ fontSize: 14, fill: "#374151", fontWeight: 500 }}
                    axisLine={{ stroke: "#9ca3af", strokeWidth: 2 }}
                    tickLine={{ stroke: "#9ca3af" }}
                    label={{ 
                      value: 'Days', 
                      position: 'insideBottom',
                      offset: -10,
                      style: { fill: '#374151', fontWeight: 600, fontSize: 14 } 
                    }}
                  />
                  <YAxis 
                    tick={{ fontSize: 14, fill: "#374151", fontWeight: 500 }}
                    axisLine={{ stroke: "#9ca3af", strokeWidth: 2 }}
                    tickLine={{ stroke: "#9ca3af" }}
                    domain={domain}
                    ticks={ticks}
                    tickFormatter={(value) => `${Number.isInteger(Number(value)) ? value : Math.round(Number(value))}L`}
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
                        const data = payload[0].payload;
                        
                        return (
                          <div className="bg-white rounded-xl shadow-2xl border-2 border-gray-100 overflow-hidden">
                            {/* Color accent bar at top */}
                            <div className="h-1.5 w-full bg-[rgba(89,12,22,1)]" />
                            <div className="px-4 py-3">
                              {/* Day name */}
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-3 h-3 rounded-full bg-[rgba(89,12,22,1)] shadow-sm" />
                                <span className="text-sm font-bold text-[#1f2937] tracking-tight">
                                  {data.day}
                                </span>
                              </div>
                              
                              {/* Sales value */}
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-xs font-medium text-[#6b7280]">
                                  Daily Sales:
                                </span>
                                <span className="text-lg font-bold text-[#1f2937]">
                                  ₹{Number(data.value).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}L
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                    cursor={{ 
                      stroke: APP_COLORS.gold,
                      strokeWidth: 1,
                      strokeDasharray: "5 5"
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="url(#lineGradient)"
                    strokeWidth={3.5}
                    dot={{ 
                      fill: APP_COLORS.gold, 
                      r: 5,
                      strokeWidth: 2,
                      stroke: '#fff'
                    }}
                    activeDot={{ 
                      r: 8,
                      fill: APP_COLORS.gold,
                      strokeWidth: 3,
                      stroke: '#fff',
                      filter: 'url(#glow)'
                    }}
                    animationDuration={1000}
                    animationBegin={0}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesTrendDialog;