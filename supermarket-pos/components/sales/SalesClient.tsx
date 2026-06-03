"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/language-context";
import { ReceiptText, X } from "lucide-react";

type SaleItem = {
  id: string; nameAr: string; nameEn: string; price: number; quantity: number; total: number;
};
type Sale = {
  id: string; receiptNo: number; total: number; subtotal: number; discount: number;
  amountPaid: number; change: number; paymentMethod: string; createdAt: string;
  items: SaleItem[];
};

const FILTERS = ["today", "week", "month", "all"] as const;
type Filter = typeof FILTERS[number];

export default function SalesClient() {
  const { tr, lang } = useLang();
  const [sales, setSales] = useState<Sale[]>([]);
  const [filter, setFilter] = useState<Filter>("today");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Sale | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/sales?filter=${filter}`)
      .then((r) => r.json())
      .then((d) => { setSales(Array.isArray(d) ? d : []); setLoading(false); });
  }, [filter]);

  const totalRevenue = sales.reduce((s, sale) => s + sale.total, 0);
  const filterLabel: Record<Filter, string> = { today: tr.today, week: tr.thisWeek, month: tr.thisMonth, all: tr.all };
  const methodLabel: Record<string, string> = { CASH: tr.cash, CARD: tr.card, MOBILE: tr.mobile };
  const name = (item: SaleItem) => lang === "ar" ? item.nameAr : item.nameEn;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{tr.salesHistory}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{sales.length} {lang === "ar" ? "عملية" : "transactions"} · {totalRevenue.toFixed(2)} {tr.currency}</p>
        </div>
        <div className="flex rounded-xl overflow-hidden border border-slate-200 bg-white text-sm">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 font-medium transition-colors ${filter === f ? "bg-green-500 text-white" : "text-slate-600 hover:bg-slate-50"}`}
            >
              {filterLabel[f]}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">{tr.loading}</div>
        ) : sales.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <ReceiptText size={40} className="mx-auto mb-3 opacity-30" />
            <div>{tr.noSales}</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-start font-semibold text-slate-600">{tr.receiptNo}</th>
                  <th className="px-4 py-3 text-start font-semibold text-slate-600">{tr.date}</th>
                  <th className="px-4 py-3 text-start font-semibold text-slate-600">{tr.items}</th>
                  <th className="px-4 py-3 text-start font-semibold text-slate-600">{tr.paymentMethod}</th>
                  <th className="px-4 py-3 text-start font-semibold text-slate-600">{tr.total}</th>
                  <th className="px-4 py-3 text-start font-semibold text-slate-600">{tr.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setSelected(sale)}>
                    <td className="px-4 py-3 font-mono text-slate-700">#{sale.receiptNo}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(sale.createdAt).toLocaleString(lang === "ar" ? "ar-EG" : "en-US")}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{sale.items.length}</td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        {methodLabel[sale.paymentMethod] || sale.paymentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-green-600">{sale.total.toFixed(2)} {tr.currency}</td>
                    <td className="px-4 py-3">
                      <button className="text-xs px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700">
                        {tr.receiptDetails}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Receipt Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">{tr.receipt} #{selected.receiptNo}</h2>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="text-sm text-slate-500">
                {new Date(selected.createdAt).toLocaleString(lang === "ar" ? "ar-EG" : "en-US")}
              </div>

              <div className="space-y-1">
                {selected.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-slate-700">{name(item)} × {item.quantity}</span>
                    <span className="font-medium">{item.total.toFixed(2)} {tr.currency}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed pt-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-slate-600"><span>{tr.subtotal}</span><span>{selected.subtotal.toFixed(2)} {tr.currency}</span></div>
                {selected.discount > 0 && <div className="flex justify-between text-red-500"><span>- {tr.discount}</span><span>- {selected.discount.toFixed(2)} {tr.currency}</span></div>}
                <div className="flex justify-between font-bold text-base"><span>{tr.total}</span><span className="text-green-600">{selected.total.toFixed(2)} {tr.currency}</span></div>
                <div className="flex justify-between text-slate-600"><span>{tr.paymentMethod}</span><span>{methodLabel[selected.paymentMethod]}</span></div>
                <div className="flex justify-between text-slate-600"><span>{tr.amountPaid}</span><span>{selected.amountPaid.toFixed(2)} {tr.currency}</span></div>
                <div className="flex justify-between text-green-700 font-medium"><span>{tr.change}</span><span>{selected.change.toFixed(2)} {tr.currency}</span></div>
              </div>

              <button onClick={() => window.print()} className="w-full py-2.5 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50">
                {tr.print}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
