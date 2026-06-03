"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useLang } from "@/lib/language-context";
import { Search, X, Plus, Minus, Trash2, ShoppingCart } from "lucide-react";
import PaymentModal from "./PaymentModal";
import { toast } from "sonner";

type Category = { id: string; nameAr: string; nameEn: string; color: string; icon?: string | null };
type Product = {
  id: string; barcode?: string | null; nameAr: string; nameEn: string;
  price: number; unit: string; stock: number; isActive: boolean;
  category?: Category | null;
};
type CartItem = Product & { quantity: number; itemDiscount: number };

export default function PosScreen() {
  const { tr, lang } = useLang();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(true);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [prods, cats] = await Promise.all([
      fetch("/api/products?activeOnly=true").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ]);
    setProducts(Array.isArray(prods) ? prods : []);
    setCategories(Array.isArray(cats) ? cats : []);
    setLoading(false);
  }

  // Barcode scanner — detects fast input sequence ending with Enter
  const barcodeBuffer = useRef("");
  const barcodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Only if not focused on an input (except our search box)
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" && e.target !== searchRef.current) return;

      if (e.key === "Enter" && barcodeBuffer.current.length > 2) {
        const code = barcodeBuffer.current;
        barcodeBuffer.current = "";
        if (barcodeTimer.current) clearTimeout(barcodeTimer.current);
        const found = products.find((p) => p.barcode === code);
        if (found) {
          addToCart(found);
          setSearch("");
          toast.success(lang === "ar" ? `تمت إضافة ${found.nameAr}` : `Added ${found.nameEn}`);
        } else {
          toast.error(lang === "ar" ? "المنتج غير موجود" : "Product not found");
        }
        return;
      }

      if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
        if (barcodeTimer.current) clearTimeout(barcodeTimer.current);
        barcodeTimer.current = setTimeout(() => {
          barcodeBuffer.current = "";
        }, 100);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [products, lang]);

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...product, quantity: 1, itemDiscount: 0 }];
    });
  }, []);

  function updateQty(id: string, delta: number) {
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i))
        .filter((i) => i.quantity > 0)
    );
  }

  function removeItem(id: string) {
    setCart((prev) => prev.filter((i) => i.id !== id));
  }

  function clearCart() {
    setCart([]);
    setDiscount(0);
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const discountAmt = (subtotal * discount) / 100;
  const tax = 0;
  const total = subtotal - discountAmt + tax;

  const filteredProducts = products.filter((p) => {
    const matchesCat = !activeCat || p.category?.id === activeCat;
    const matchesSearch =
      !search ||
      p.nameAr.includes(search) ||
      p.nameEn.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode || "").includes(search);
    return matchesCat && matchesSearch;
  });

  async function handleSaleComplete(paymentMethod: string, amountPaid: number) {
    const body = {
      items: cart.map((i) => ({
        productId: i.id,
        nameAr: i.nameAr,
        nameEn: i.nameEn,
        price: i.price,
        quantity: i.quantity,
        discount: i.itemDiscount,
        total: i.price * i.quantity,
      })),
      subtotal,
      discount: discountAmt,
      tax,
      total,
      amountPaid,
      change: Math.max(0, amountPaid - total),
      paymentMethod,
    };

    const res = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const sale = await res.json();
      clearCart();
      setShowPayment(false);
      toast.success(tr.saleSuccess);
      return sale;
    } else {
      toast.error(tr.error);
      return null;
    }
  }

  const name = (p: Product) => (lang === "ar" ? p.nameAr : p.nameEn);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left — Product Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white border-e border-slate-200">
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search size={18} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tr.searchProduct}
              className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 px-4 py-2 overflow-x-auto border-b border-slate-100">
          <button
            onClick={() => setActiveCat(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              !activeCat ? "bg-green-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {tr.allCategories}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCat(activeCat === cat.id ? null : cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                activeCat === cat.id ? "text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              style={activeCat === cat.id ? { backgroundColor: cat.color } : {}}
            >
              {cat.icon && <span>{cat.icon}</span>}
              {lang === "ar" ? cat.nameAr : cat.nameEn}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-slate-400">{tr.loading}</div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-slate-400">{tr.noData}</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.stock <= 0}
                  className={`relative p-3 rounded-xl border text-start transition-all group ${
                    product.stock <= 0
                      ? "border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed"
                      : "border-slate-200 bg-white hover:border-green-400 hover:shadow-md hover:shadow-green-50 active:scale-95"
                  }`}
                >
                  {/* Category color dot */}
                  {product.category && (
                    <div
                      className="w-2 h-2 rounded-full mb-2"
                      style={{ backgroundColor: product.category.color }}
                    />
                  )}
                  <div className="text-sm font-semibold text-slate-800 leading-tight mb-1 line-clamp-2">
                    {name(product)}
                  </div>
                  <div className="text-green-600 font-bold text-base">
                    {product.price.toFixed(2)} {tr.currency}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {tr.stock}: {product.stock} {product.unit}
                  </div>
                  {product.stock <= 0 && (
                    <span className="absolute top-2 end-2 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                      {tr.outOfStock}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right — Cart */}
      <div className="w-[340px] flex flex-col bg-slate-50 shrink-0">
        {/* Cart Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2 font-semibold text-slate-800">
            <ShoppingCart size={18} className="text-green-500" />
            <span>{tr.cart}</span>
            {cart.length > 0 && (
              <span className="bg-green-500 text-white text-xs rounded-full px-2 py-0.5">{cart.length}</span>
            )}
          </div>
          {cart.length > 0 && (
            <button onClick={clearCart} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
              <Trash2 size={13} /> {tr.clearCart}
            </button>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-slate-400 gap-2">
              <ShoppingCart size={32} className="opacity-30" />
              <span className="text-sm">{tr.emptyCart}</span>
              <span className="text-xs">{tr.addProducts}</span>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="bg-white rounded-xl p-3 border border-slate-200">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 leading-tight truncate">{name(item)}</div>
                    <div className="text-xs text-slate-400">{item.price.toFixed(2)} × {item.quantity}</div>
                  </div>
                  <div className="text-green-600 font-bold text-sm ms-2 shrink-0">
                    {(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQty(item.id, -1)}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.id, 1)}
                      className="w-7 h-7 rounded-lg bg-green-100 hover:bg-green-200 flex items-center justify-center text-green-700"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-red-400 hover:text-red-600 p-1"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals */}
        <div className="bg-white border-t border-slate-200 p-4 space-y-3">
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>{tr.subtotal}</span>
              <span>{subtotal.toFixed(2)} {tr.currency}</span>
            </div>

            {/* Discount input */}
            <div className="flex justify-between items-center text-slate-600">
              <span>{tr.discount} (%)</span>
              <input
                type="number"
                min="0"
                max="100"
                value={discount}
                onChange={(e) => setDiscount(Math.min(100, Math.max(0, Number(e.target.value))))}
                className="w-20 text-end border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-400"
              />
            </div>

            {discountAmt > 0 && (
              <div className="flex justify-between text-red-500 text-sm">
                <span>- {tr.discount}</span>
                <span>- {discountAmt.toFixed(2)} {tr.currency}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between font-bold text-lg border-t border-slate-200 pt-3 text-slate-900">
            <span>{tr.total}</span>
            <span className="text-green-600">{total.toFixed(2)} {tr.currency}</span>
          </div>

          <button
            disabled={cart.length === 0}
            onClick={() => setShowPayment(true)}
            className="w-full py-3 bg-green-500 hover:bg-green-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors text-base"
          >
            {tr.pay} — {total.toFixed(2)} {tr.currency}
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <PaymentModal
          total={total}
          cart={cart}
          subtotal={subtotal}
          discountAmt={discountAmt}
          onClose={() => setShowPayment(false)}
          onConfirm={handleSaleComplete}
        />
      )}
    </div>
  );
}
