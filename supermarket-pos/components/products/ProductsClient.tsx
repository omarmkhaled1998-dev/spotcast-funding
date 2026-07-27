"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/language-context";
import { Plus, Search, Edit2, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import ProductForm from "./ProductForm";

type Category = { id: string; nameAr: string; nameEn: string; color: string };
type Product = {
  id: string; barcode?: string | null; nameAr: string; nameEn: string;
  price: number; cost?: number | null; unit: string; stock: number;
  minStock: number; isActive: boolean; categoryId?: string | null;
  category?: Category | null;
};

export default function ProductsClient() {
  const { tr, lang } = useLang();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [prods, cats] = await Promise.all([
      fetch("/api/products?activeOnly=false").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ]);
    setProducts(Array.isArray(prods) ? prods : []);
    setCategories(Array.isArray(cats) ? cats : []);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm(tr.confirmDelete)) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success(tr.success); fetchAll(); }
    else toast.error(tr.error);
  }

  const filtered = products.filter((p) =>
    !search ||
    p.nameAr.includes(search) ||
    p.nameEn.toLowerCase().includes(search.toLowerCase()) ||
    (p.barcode || "").includes(search)
  );

  const name = (p: Product) => lang === "ar" ? p.nameAr : p.nameEn;
  const catName = (c?: Category | null) => !c ? tr.noCategory : (lang === "ar" ? c.nameAr : c.nameEn);

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{tr.products}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{filtered.length} {lang === "ar" ? "منتج" : "products"}</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium text-sm transition-colors"
        >
          <Plus size={18} /> {tr.addProduct}
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={tr.search + "..."}
          className="w-full ps-9 pe-4 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">{tr.loading}</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">{tr.noData}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-start font-semibold text-slate-600">{tr.productName}</th>
                  <th className="px-4 py-3 text-start font-semibold text-slate-600">{tr.barcode}</th>
                  <th className="px-4 py-3 text-start font-semibold text-slate-600">{tr.category}</th>
                  <th className="px-4 py-3 text-start font-semibold text-slate-600">{tr.price}</th>
                  <th className="px-4 py-3 text-start font-semibold text-slate-600">{tr.stock}</th>
                  <th className="px-4 py-3 text-start font-semibold text-slate-600">{tr.active}</th>
                  <th className="px-4 py-3 text-start font-semibold text-slate-600">{tr.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{name(p)}</div>
                      <div className="text-xs text-slate-400">{lang === "ar" ? p.nameEn : p.nameAr}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-xs">{p.barcode || "—"}</td>
                    <td className="px-4 py-3">
                      {p.category ? (
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: p.category.color }}
                        >
                          {catName(p.category)}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">{tr.noCategory}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-green-600">
                      {p.price.toFixed(2)} {tr.currency}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={p.stock <= 0 ? "text-red-600 font-semibold" : p.stock <= p.minStock ? "text-amber-600 font-semibold" : "text-slate-700"}>
                          {p.stock} {p.unit}
                        </span>
                        {p.stock <= 0 && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">{tr.outOfStock}</span>}
                        {p.stock > 0 && p.stock <= p.minStock && (
                          <AlertTriangle size={14} className="text-amber-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                        {p.isActive ? (lang === "ar" ? "نشط" : "Active") : (lang === "ar" ? "غير نشط" : "Inactive")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setEditing(p); setShowForm(true); }}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <ProductForm
          product={editing}
          categories={categories}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); fetchAll(); }}
        />
      )}
    </div>
  );
}
