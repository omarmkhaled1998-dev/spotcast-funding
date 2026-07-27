"use client";

import { useState } from "react";
import { useLang } from "@/lib/language-context";
import { X } from "lucide-react";
import { toast } from "sonner";

type Category = { id: string; nameAr: string; nameEn: string; color: string };
type Product = {
  id: string; barcode?: string | null; nameAr: string; nameEn: string;
  price: number; cost?: number | null; unit: string; stock: number;
  minStock: number; isActive: boolean; categoryId?: string | null;
};

type Props = {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
};

export default function ProductForm({ product, categories, onClose, onSaved }: Props) {
  const { tr, lang } = useLang();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nameAr: product?.nameAr || "",
    nameEn: product?.nameEn || "",
    barcode: product?.barcode || "",
    categoryId: product?.categoryId || "",
    price: product?.price?.toString() || "",
    cost: product?.cost?.toString() || "",
    unit: product?.unit || "قطعة",
    stock: product?.stock?.toString() || "0",
    minStock: product?.minStock?.toString() || "5",
    isActive: product?.isActive !== false,
  });

  function set(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nameAr || !form.nameEn || !form.price) {
      toast.error(lang === "ar" ? "يرجى تعبئة الحقول المطلوبة" : "Please fill required fields");
      return;
    }
    setLoading(true);
    const url = product ? `/api/products/${product.id}` : "/api/products";
    const method = product ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, categoryId: form.categoryId || null, barcode: form.barcode || null }),
    });
    setLoading(false);
    if (res.ok) { toast.success(tr.success); onSaved(); }
    else {
      const data = await res.json();
      toast.error(data.error || tr.error);
    }
  }

  const catName = (c: Category) => lang === "ar" ? c.nameAr : c.nameEn;

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      {children}
    </div>
  );

  const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="font-bold text-slate-900 text-lg">
            {product ? tr.editProduct : tr.addProduct}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label={tr.productNameAr + " *"}>
              <input value={form.nameAr} onChange={(e) => set("nameAr", e.target.value)} className={inputCls} placeholder="تفاح أحمر" />
            </Field>
            <Field label={tr.productNameEn + " *"}>
              <input value={form.nameEn} onChange={(e) => set("nameEn", e.target.value)} className={inputCls} placeholder="Red Apple" />
            </Field>
          </div>

          <Field label={tr.barcode}>
            <input value={form.barcode} onChange={(e) => set("barcode", e.target.value)} className={inputCls} placeholder="6001234000001" />
          </Field>

          <Field label={tr.category}>
            <select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)} className={inputCls}>
              <option value="">{tr.noCategory}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{catName(c)}</option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <Field label={tr.price + " *"}>
              <input type="number" step="0.01" min="0" value={form.price} onChange={(e) => set("price", e.target.value)} className={inputCls} placeholder="0.00" />
            </Field>
            <Field label={tr.cost}>
              <input type="number" step="0.01" min="0" value={form.cost} onChange={(e) => set("cost", e.target.value)} className={inputCls} placeholder="0.00" />
            </Field>
            <Field label={tr.unit}>
              <input value={form.unit} onChange={(e) => set("unit", e.target.value)} className={inputCls} placeholder="قطعة" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label={tr.stock}>
              <input type="number" step="0.01" min="0" value={form.stock} onChange={(e) => set("stock", e.target.value)} className={inputCls} />
            </Field>
            <Field label={tr.minStock}>
              <input type="number" step="0.01" min="0" value={form.minStock} onChange={(e) => set("minStock", e.target.value)} className={inputCls} />
            </Field>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} className="w-4 h-4 accent-green-500" />
            <span className="text-sm text-slate-700">{tr.active}</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50">
              {tr.cancel}
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 disabled:opacity-70 text-white rounded-xl text-sm font-bold">
              {loading ? tr.loading : tr.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
