import React from "react";
import { SalesData } from "../../models/Dashboard";
import { EmptyState } from "../../components/EmptyState";

interface RecentSalesSectionProps {
  recentSales: SalesData[];
  loadingRecentSales: boolean;
}

const RecentSalesSection: React.FC<RecentSalesSectionProps> = ({
  recentSales,
  loadingRecentSales,
}) => {
  const sortedRecentSales = React.useMemo(() => {
    const parseDate = (value: string): number => {
      if (!value) return 0;
      const direct = new Date(value).getTime();
      if (!Number.isNaN(direct)) return direct;
      const m = value.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
      if (m) {
        const dd = Number(m[1]);
        const mm = Number(m[2]);
        const yyyy = Number(m[3]);
        return new Date(yyyy, mm - 1, dd).getTime();
      }
      return 0;
    };

    return [...recentSales].sort((a, b) => parseDate(b.date) - parseDate(a.date));
  }, [recentSales]);

  return (
    <div className="mt-6">
      <div className="rounded-2xl bg-white p-6 shadow-[0_8px_26px_rgba(17,24,39,0.08)] border border-gray-100">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-[#1f2937] tracking-tight">Recent Sales</h2>
          <p className="text-xs text-[#6b7280] mt-0.5">Latest 5 transactions</p>
        </div>

        {loadingRecentSales ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-gold" />
          </div>
        ) : recentSales.length === 0 ? (
          <EmptyState
            title="No recent sales"
            message="No recent sales to display."
            minHeight={200}
          />
        ) : (
          <div className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="w-[140px] px-4 py-3 text-left text-xs font-semibold uppercase text-[#2e2d47]">
                    Date
                  </th>
                  <th className="w-[140px] px-4 py-3 text-left text-xs font-semibold uppercase text-[#2e2d47]">
                    Customer
                  </th>
                  <th className="w-[140px] px-4 py-3 text-center text-xs font-semibold uppercase text-[#2e2d47]">
                    Metal
                  </th>
                  <th className="w-[160px] px-4 py-3 text-left text-xs font-semibold uppercase text-[#2e2d47]">
                    Invoice Number
                  </th>
                  <th className="w-[140px] px-4 py-3 text-center text-xs font-semibold uppercase text-[#2e2d47]">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedRecentSales.map((row: SalesData, index: number) => {
                  const itemLower = (row.item || "").toLowerCase();
                  const pillStyle = itemLower.includes("gold")
                    ? "bg-gold-soft text-gold-dark border border-gold"
                    : itemLower.includes("silver")
                    ? "bg-[#C0C0C0]/15 text-[#4b5563] border-[#C0C0C0]"
                    : itemLower.includes("platinum")
                    ? "bg-[#E5E4E2]/20 text-[#6b7280] border-[#E5E4E2]"
                    : itemLower.includes("diamond")
                    ? "bg-[#B9F2FF]/25 text-[#0369a1] border-[#B9F2FF]"
                    : itemLower.includes("gemstone")
                    ? "bg-[#9370DB]/15 text-[#5b21b6] border-[#9370DB]"
                    : "bg-gray-100 text-gray-700 border-gray-200";

                  return (
                    <tr
                      key={row.id ?? `${row.customer}-${index}`}
                      className="group hover:bg-gradient-to-r hover:from-gray-50 hover:to-white transition-all duration-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                    >
                      <td className="px-4 py-4 text-gray-600 tabular-nums whitespace-nowrap">
                        {row.date}
                      </td>
                      <td className="w-[140px] px-4 py-3 truncate">
                        <div className="font-semibold text-gray-900 truncate">{row.customer}</div>
                        <div className="text-xs text-gray-400">
                          {row.isWalkIn
                            ? "Walk-in Customer"
                            : row.isNewCustomer
                            ? "New Customer"
                            : "Returning Customer"}
                        </div>
                      </td>
                      <td className="w-[140px] px-4 py-3 text-center align-middle">
                        <span
                          className={`mx-auto inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-semibold shadow-sm ${pillStyle}`}
                        >
                          {row.item || "—"}
                        </span>
                      </td>
                      <td className="w-[160px] px-4 py-3 font-mono text-xs text-gray-500 truncate">
                        {row.billNumber || "—"}
                      </td>
                      <td className="w-[140px] px-4 py-3 text-center font-semibold text-emerald-700 tabular-nums">
                        {row.price}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentSalesSection;