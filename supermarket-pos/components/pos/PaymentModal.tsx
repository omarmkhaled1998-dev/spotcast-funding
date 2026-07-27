"use client";

import { useState, useRef, useEffect } from "react";
import { useLang } from "@/lib/language-context";
import { X, Banknote, CreditCard, Smartphone, Printer, CheckCircle2 } from "lucide-react";

type CartItem = {
  id: string; nameAr: string; nameEn: string; price: number; quantity: number;
};

type Sale = {
  id: string; receiptNo: number; total: number; paymentMethod: string;
  amountPaid: number; change: number; createdAt: string;
  items: { nameAr: string; nameEn: string; price: number; quantity: number; total: number }[];
};

type Props = {
  total: number;
  cart: CartItem[];
  subtotal: number;
  discountAmt: number;
  onClose: () => void;
  onConfirm: (method: string, amountPaid: number) => Promise<Sale | null>;
};

const PAYMENT_METHODS = [
  { key: "CASH", labelAr: "نقداً", labelEn: "Cash", icon: Banknote },
  { key: "CARD", labelAr: "بطاقة", labelEn: "Card", icon: CreditCard },
  { key: "MOBILE", labelAr: "محفظة", labelEn: "Mobile", icon: Smartphone },
] as const;

export default function PaymentModal({ total, cart, subtotal, discountAmt, onClose, onConfirm }: Props) {
  const { tr, lang } = useLang();
  const [method, setMethod] = useState<"CASH" | "CARD" | "MOBILE">("CASH");
  const [amountPaid, setAmountPaid] = useState(total.toFixed(2));
  const [loading, setLoading] = useState(false);
  const [sale, setSale] = useState<Sale | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.select();
  }, []);

  const paid = parseFloat(amountPaid) || 0;
  const change = Math.max(0, paid - total);
  const canPay = method !== "CASH" || paid >= total;

  async function handleConfirm() {
    setLoading(true);
    const result = await onConfirm(method, paid);
    setLoading(false);
    if (result) setSale(result);
  }

  function handlePrint() {
    window.print();
  }

  const name = (item: { nameAr: string; nameEn: string }) =>
    lang === "ar" ? item.nameAr : item.nameEn;

  if (sale) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
          {/* Success Header */}
          <div className="bg-green-500 text-white p-6 text-center">
            <CheckCircle2 size={48} className="mx-auto mb-2" />
            <h2 className="text-xl font-bold">{tr.saleSuccess}</h2>
          </div>

          {/* Receipt */}
          <div className="p-6 space-y-4 print-receipt">
            <div className="text-center border-b border-dashed pb-4">
              <div className="font-bold text-lg">{tr.storeName}</div>
              <div className="text-sm text-slate-500">{tr.receipt} #{sale.receiptNo}</div>
              <div className="text-xs text-slate-400">
                {new Date(sale.createdAt).toLocaleString(lang === "ar" ? "ar-EG" : "en-US")}
              </div>
            </div>

            <div className="space-y-1 text-sm">
              {sale.items.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-slate-700">{name(item)} × {item.quantity}</span>
                  <span className="font-medium">{item.total.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed pt-3 space-y-1 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>{tr.subtotal}</span><span>{subtotal.toFixed(2)} {tr.currency}</span>
              </div>
              {discountAmt > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>- {tr.discount}</span><span>- {discountAmt.toFixed(2)} {tr.currency}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-1">
                <span>{tr.total}</span>
                <span className="text-green-600">{sale.total.toFixed(2)} {tr.currency}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>{tr.amountPaid}</span><span>{sale.amountPaid.toFixed(2)} {tr.currency}</span>
              </div>
              <div className="flex justify-between font-semibold text-green-700">
                <span>{tr.change}</span><span>{sale.change.toFixed(2)} {tr.currency}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 p-4 border-t border-slate-100 no-print">
            <button
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-slate-300 rounded-xl text-sm font-medium hover:bg-slate-50"
            >
              <Printer size={16} /> {tr.print}
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-bold"
            >
              {tr.newSale}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 text-lg">{tr.paymentMethod}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Order Summary */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-1 text-sm">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between text-slate-600">
                <span>{name(item)} × {item.quantity}</span>
                <span>{(item.price * item.quantity).toFixed(2)} {tr.currency}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-base pt-2 border-t border-slate-200 text-slate-900">
              <span>{tr.total}</span>
              <span className="text-green-600">{total.toFixed(2)} {tr.currency}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <div className="text-sm font-medium text-slate-700 mb-2">{tr.paymentMethod}</div>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map(({ key, labelAr, labelEn, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setMethod(key)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                    method === key
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <Icon size={22} />
                  <span>{lang === "ar" ? labelAr : labelEn}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Amount Paid (cash only) */}
          {method === "CASH" && (
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">{tr.amountPaid}</label>
              <input
                ref={inputRef}
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-lg font-bold text-end focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              <div className="flex justify-between mt-2 text-sm">
                <span className="text-slate-500">{tr.change}</span>
                <span className={`font-bold ${change >= 0 ? "text-green-600" : "text-red-500"}`}>
                  {change.toFixed(2)} {tr.currency}
                </span>
              </div>
            </div>
          )}

          {/* Confirm Button */}
          <button
            disabled={!canPay || loading}
            onClick={handleConfirm}
            className="w-full py-3.5 bg-green-500 hover:bg-green-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors text-base"
          >
            {loading ? tr.loading : `${tr.confirmPayment} — ${total.toFixed(2)} ${tr.currency}`}
          </button>
        </div>
      </div>
    </div>
  );
}
