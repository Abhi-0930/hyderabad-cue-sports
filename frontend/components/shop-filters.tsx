"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowDownWideNarrow, ArrowUpNarrowWide, SlidersHorizontal, ThumbsUp, TrendingUp, X } from "lucide-react";
import type { Product } from "@/lib/products";
import { matchesQuery } from "@/lib/search";
import { mobileCategories } from "@/components/storefront-shell";

/* ---------------------------------------------------------------
   Shop filters + sorting. Everything lives in the URL, so a filtered
   or sorted list can be shared, and back/forward work as expected.
   --------------------------------------------------------------- */

export const SORT_OPTIONS = [
  { id: "relevance", label: "Relevance", icon: ThumbsUp },
  { id: "bestsellers", label: "Best sellers", icon: TrendingUp },
  { id: "price-asc", label: "Price: Low to High", icon: ArrowUpNarrowWide },
  { id: "price-desc", label: "Price: High to Low", icon: ArrowDownWideNarrow },
] as const;

export type SortId = (typeof SORT_OPTIONS)[number]["id"];

export const PRICE_RANGES = [
  { id: "0-10000", label: "Under ₹10,000", min: 0, max: 10000 },
  { id: "10000-25000", label: "₹10,000 – ₹25,000", min: 10000, max: 25000 },
  { id: "25000-100000", label: "₹25,000 – ₹1,00,000", min: 25000, max: 100000 },
  { id: "100000-", label: "Above ₹1,00,000", min: 100000, max: Infinity },
] as const;

const TABLE_SIZES = ["8 FT", "10 FT", "12 FT"];

export type ShopFilters = {
  category: string; // "all" or a ?category= value
  query: string; // lower-case search text (also used by navbar categories)
  size: string;
  type: string;
  price: string;
  inStock: boolean;
  sort: SortId;
};

export function readShopFilters(params: URLSearchParams | { get(name: string): string | null }): ShopFilters {
  const sort = params.get("sort");
  return {
    category: params.get("category") ?? "all",
    query: (params.get("query") ?? "").toLowerCase(),
    size: params.get("size") ?? "all",
    type: params.get("type") ?? "all",
    price: params.get("price") ?? "all",
    inStock: params.get("stock") === "1",
    sort: SORT_OPTIONS.some((o) => o.id === sort) ? (sort as SortId) : "relevance",
  };
}

const isBestSeller = (p: Product) =>
  (p.badge ?? "").toLowerCase() === "best seller" || p.tags.some((t) => t.toLowerCase() === "best seller");

export function applyShopFilters(list: Product[], f: ShopFilters): Product[] {
  const range = PRICE_RANGES.find((r) => r.id === f.price);
  const filtered = list.filter((product) => {
    const matchesSearch = matchesQuery(product, f.query);
    const matchesSize = f.size === "all" || product.size === f.size;
    const matchesType = f.type === "all" || product.type === f.type;
    const cat = f.category.toLowerCase();
    const matchesCategory = f.category === "all" ||
      product.category.toLowerCase() === cat ||
      (cat === "cue equipment" && (product.category.toLowerCase() === "cues" || product.tags.includes("cue equipment")));
    const matchesPrice = !range || (product.price >= range.min && product.price < range.max);
    const matchesStock = !f.inStock || product.availability !== "Made to order";
    return matchesSearch && matchesSize && matchesType && matchesCategory && matchesPrice && matchesStock;
  });

  if (f.sort === "price-asc") return [...filtered].sort((a, b) => a.price - b.price);
  if (f.sort === "price-desc") return [...filtered].sort((a, b) => b.price - a.price);
  if (f.sort === "bestsellers") return [...filtered].sort((a, b) => Number(isBestSeller(b)) - Number(isBestSeller(a)));
  return filtered;
}

/** Which navbar category the current category + query stand for (or null) */
function categoryIdFor(f: ShopFilters): string | null {
  if (f.category === "all") return f.type === "all" && !f.query ? "all" : null;
  const cat = f.category.toLowerCase();
  return mobileCategories.find((c) => c.matches.includes(cat) && (c.query ?? "") === f.query)?.id ?? null;
}

const navQueries = new Set(mobileCategories.map((c) => c.query).filter(Boolean) as string[]);

function countActive(f: ShopFilters) {
  return Number(f.category !== "all" || f.type !== "all") + Number(f.size !== "all") + Number(f.price !== "all") + Number(f.inStock);
}

type Draft = { categoryId: string | null; size: string; price: string; inStock: boolean };

export function ShopToolbar({ allProducts, resultCount }: { allProducts: Product[]; resultCount: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = readShopFilters(searchParams);
  const activeCount = countActive(current);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>({ categoryId: null, size: "all", price: "all", inStock: false });

  const push = (params: URLSearchParams) => {
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const setSort = (sort: SortId) => {
    const params = new URLSearchParams(searchParams.toString());
    if (sort === "relevance") params.delete("sort");
    else params.set("sort", sort);
    push(params);
  };

  const openPanel = () => {
    setDraft({ categoryId: categoryIdFor(current), size: current.size, price: current.price, inStock: current.inStock });
    setOpen(true);
  };

  /** URL the draft would produce (keeps sort and any plain search text) */
  const draftParams = (d: Draft) => {
    const params = new URLSearchParams(searchParams.toString());
    const nav = mobileCategories.find((c) => c.id === d.categoryId);
    if (d.categoryId !== null) {
      // A category was picked in the panel: it replaces the link's category/type
      params.delete("type");
      params.delete("category");
      if (params.get("query") && navQueries.has(params.get("query")!.toLowerCase())) params.delete("query");
      if (nav) {
        params.set("category", nav.category);
        if (nav.query) params.set("query", nav.query);
        else params.delete("query");
      }
    }
    if (d.size === "all") params.delete("size"); else params.set("size", d.size);
    if (d.price === "all") params.delete("price"); else params.set("price", d.price);
    if (d.inStock) params.set("stock", "1"); else params.delete("stock");
    return params;
  };

  const previewCount = useMemo(
    () => (open ? applyShopFilters(allProducts, readShopFilters(draftParams(draft))).length : 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open, draft, allProducts, searchParams],
  );

  const apply = () => {
    push(draftParams(draft));
    setOpen(false);
  };

  const clearAll = () => setDraft({ categoryId: "all", size: "all", price: "all", inStock: false });

  // Esc closes; page behind doesn't scroll while the panel is open
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const chip = (selected: boolean, label: string, onClick: () => void, key?: string) => (
    <button key={key ?? label} type="button" className={`sf-option ${selected ? "is-selected" : ""}`} aria-pressed={selected} onClick={onClick}>
      {label}
    </button>
  );

  return <>
    <div className="shop-filterbar">
      <button type="button" className={`shop-filter-btn ${activeCount ? "has-active" : ""}`} onClick={openPanel} aria-haspopup="dialog">
        <SlidersHorizontal size={16} />
        Filters
        {activeCount > 0 && <span className="shop-filter-count">{activeCount}</span>}
      </button>
      <span className="shop-filterbar-divider" aria-hidden="true" />
      <div className="shop-sort-chips" role="group" aria-label="Sort products">
        {SORT_OPTIONS.map((o) => (
          <button key={o.id} type="button" className={`shop-sort-chip ${current.sort === o.id ? "is-active" : ""}`} aria-pressed={current.sort === o.id} onClick={() => setSort(o.id)}>
            <o.icon size={14} strokeWidth={2} className="shop-sort-icon" aria-hidden="true" />
            {o.label}
          </button>
        ))}
      </div>
      <span className="shop-result-count">{resultCount} {resultCount === 1 ? "product" : "products"}</span>
    </div>

    {open && (
      <div className="sf-root" role="dialog" aria-modal="true" aria-label="Filters">
        <div className="sf-backdrop" onClick={() => setOpen(false)} />
        <div className="sf-panel">
          <div className="sf-head">
            <h2>Filters</h2>
            <button type="button" className="sf-close" onClick={() => setOpen(false)} aria-label="Close filters"><X size={20} /></button>
          </div>

          <div className="sf-body">
            <section className="sf-group">
              <h3>Category</h3>
              <div className="sf-options">
                {chip(draft.categoryId === "all", "All products", () => setDraft((d) => ({ ...d, categoryId: "all" })), "all")}
                {mobileCategories.map((c) => chip(draft.categoryId === c.id, c.label, () => setDraft((d) => ({ ...d, categoryId: c.id })), c.id))}
              </div>
            </section>

            <section className="sf-group">
              <h3>Table size</h3>
              <div className="sf-options">
                {chip(draft.size === "all", "Any size", () => setDraft((d) => ({ ...d, size: "all" })), "any")}
                {TABLE_SIZES.map((s) => chip(draft.size === s, s, () => setDraft((d) => ({ ...d, size: s }))))}
              </div>
            </section>

            <section className="sf-group">
              <h3>Price</h3>
              <div className="sf-options">
                {chip(draft.price === "all", "Any price", () => setDraft((d) => ({ ...d, price: "all" })), "any")}
                {PRICE_RANGES.map((r) => chip(draft.price === r.id, r.label, () => setDraft((d) => ({ ...d, price: r.id })), r.id))}
              </div>
            </section>

            <section className="sf-group">
              <h3>Availability</h3>
              <label className="sf-switch">
                <span>Ready to ship only</span>
                <input type="checkbox" checked={draft.inStock} onChange={(e) => setDraft((d) => ({ ...d, inStock: e.target.checked }))} />
                <span className="sf-switch-track" aria-hidden="true" />
              </label>
            </section>
          </div>

          <div className="sf-foot">
            <button type="button" className="sf-clear" onClick={clearAll}>Clear all</button>
            <button type="button" className="sf-apply" onClick={apply}>
              Show {previewCount} {previewCount === 1 ? "product" : "products"}
            </button>
          </div>
        </div>
      </div>
    )}
  </>;
}
