"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/language-context";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Category = {
  id: string; nameAr: string; nameEn: string; color: string; icon?: string | null;
  _count?: { products: number };
};

const COLORS = ["#22c55e","#3b82f6","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#f97316","#ec4899","#64748b"];

export default function CategoriesClient() {
  const { tr, lang } = useLang();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ nameAr: "", nameEn: "", color: COLORS[0], icon: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetch("/api/categories").then((r) => r.json()).then((d) => { setCategories(Array.isArray(d) ? d : []); setLoading(false); }); }, []);

  function openForm(cat?: Category) {
    if (cat) { setEditing(cat); setForm({ nameAr: cat.nameAr, nameEn: cat.nameEn, color: cat.color, icon: cat.icon || "" }); }
    else { setEditing(null); setForm({ nameAr: "", nameEn: "", color: COLORS[0], icon: "" }); }
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nameAr || !form.nameEn) { toast.error(lang === "ar" ? "أدخل الاسمين" : "Enter both names"); return; }
    setSaving(true);
    const url = editing ? `/api/categories/${editing.id}` : "/api/categories";
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, icon: form.icon || null }) });
    setSaving(false);
    if (res.ok) {
      toast.success(tr.success);
      setShowForm(false);
      const updated = await fetch("/api/categories").then((r) => r.json());
      setCategories(Array.isArray(updated) ? updated : []);
    } else toast.error(tr.error);
  }

  async function handleDelete(id: string) {
    if (!confirm(tr.confirmDelete)) return;
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success(tr.success); setCategories((c) => c.filter((x) => x.id !== id)); }
    else toast.error(tr.error);
  }

  const name = (c: Category) => lang === "ar" ? c.nameAr : c.nameEn;
  const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400";

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{tr.categories}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{categories.length} {lang === "ar" ? "فئة" : "categories"}</p>
        </div>
        <button onClick={() => openForm()} className="flex items-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium text-sm">
          <Plus size={18} /> {tr.addCategory}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400">{tr.loading}</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-2" style={{ backgroundColor: cat.color }} />
              <div className="p-4">
                <div className="text-2xl mb-2">{cat.icon || "📦"}</div>
                <div className="font-semibold text-slate-900 text-sm">{name(cat)}</div>
                <div className="text-xs text-slate-400 mt-0.5">{lang === "ar" ? cat.nameEn : cat.nameAr}</div>
                {cat._count !== undefined && (
                  <div className="text-xs text-slate-500 mt-2">{cat._count.products} {lang === "ar" ? "منتج" : "products"}</div>
                )}
                <div className="flex gap-2 mt-3">
                  <button onClick={() => openForm(cat)} className="flex-1 text-xs py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center gap-1">
                    <Edit2 size={12} /> {tr.edit}
                  </button>
                  <button onClick={() => handleDelete(cat.id)} className="flex-1 text-xs py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center gap-1">
                    <Trash2 size={12} /> {tr.delete}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">{editing ? tr.editCategory : tr.addCategory}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">{tr.categoryNameAr} *</label>
                <input value={form.nameAr} onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))} className={inputCls} placeholder="خضروات وفواكه" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">{tr.categoryNameEn} *</label>
                <input value={form.nameEn} onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))} className={inputCls} placeholder="Fruits & Vegetables" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">{tr.icon} (emoji)</label>
                <input value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))} className={inputCls} placeholder="🍎" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">{tr.color}</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <button key={c} type="button" onClick={() => setForm((f) => ({ ...f, color: c }))}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${form.color === c ? "border-slate-900 scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 hover:bg-slate-50">{tr.cancel}</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-bold">{saving ? tr.loading : tr.save}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
