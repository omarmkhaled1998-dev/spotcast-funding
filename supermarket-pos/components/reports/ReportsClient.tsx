"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/language-context";
import { TrendingUp, ShoppingBag, BarChart3, DollarSign } from "lucide-react";

type ReportData = {
  today: { revenue: number; orders: number; average: number };
  overall: { revenue: number; orders: number };
  topProducts: { productId: string; nameAr: string; nameEn: string; _sum: { quantity: number | null; total: number | null } }[];
};

export default function ReportsClient() {
  const { tr, lang } = useLang();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading) return <div className="p-6 text-slate-400">{tr.loading}</div>;
  if (!data) return <div className="p-6 text-red-500">{tr.error}</div>;

  const maxRevenue = Math.max(...data.topProducts.map((p) => p._sum.total || 0), 1);

  const StatCard = ({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) => (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
      <div>
        <div className="text-sm text-slate-500">{label}</div>
        <div className="text-2xl font-bold text-slate-900 mt-0.5">{value}</div>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">{tr.reports}</h1>

      {/* Today Stats */}
      <div>
        <h2 className="text-base font-semibold text-slate-700 mb-3">{tr.dailySales}</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={DollarSign} label={tr.totalRevenue} value={`${data.today.revenue.toFixed(2)} ${tr.currency}`} color="bg-green-500" />
          <StatCard icon={ShoppingBag} label={tr.totalOrders} value={data.today.orders.toString()} color="bg-blue-500" />
          <StatCard icon={TrendingUp} label={tr.averageOrder} value={`${data.today.average.toFixed(2)} ${tr.currency}`} color="bg-purple-500" />
          <StatCard icon={BarChart3} label={lang === "ar" ? "إجمالي كل الوقت" : "All Time Revenue"} value={`${data.overall.revenue.toFixed(2)} ${tr.currency}`} color="bg-amber-500" />
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="text-base font-semibold text-slate-800 mb-4">{tr.topProducts}</h2>
        {data.topProducts.length === 0 ? (
          <div className="text-slate-400 text-sm py-8 text-center">{tr.noData}</div>
        ) : (
          <div className="space-y-3">
            {data.topProducts.map((p, i) => {
              const pName = lang === "ar" ? p.nameAr : p.nameEn;
              const revenue = p._sum.total || 0;
              const qty = p._sum.quantity || 0;
              const barWidth = (revenue / maxRevenue) * 100;
              return (
                <div key={p.productId} className="flex items-center gap-3">
                  <div className="w-6 text-center text-sm font-bold text-slate-400">#{i + 1}</div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-slate-800">{pName}</span>
                      <span className="text-xs text-slate-500">{qty} {tr.pieces} · {revenue.toFixed(2)} {tr.currency}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Overall Summary */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="text-base font-semibold text-slate-800 mb-3">
          {lang === "ar" ? "ملخص عام" : "Overall Summary"}
        </h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="p-4 bg-slate-50 rounded-xl">
            <div className="text-slate-500">{lang === "ar" ? "إجمالي المبيعات" : "Total Sales"}</div>
            <div className="text-xl font-bold text-slate-900 mt-1">{data.overall.orders}</div>
          </div>
          <div className="p-4 bg-green-50 rounded-xl">
            <div className="text-slate-500">{tr.totalRevenue}</div>
            <div className="text-xl font-bold text-green-700 mt-1">{data.overall.revenue.toFixed(2)} {tr.currency}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
