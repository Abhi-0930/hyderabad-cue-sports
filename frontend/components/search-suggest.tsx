"use client";

import { FormEvent, ReactNode, RefObject, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Product, products } from "@/lib/products";
import { matchesQuery, searchProducts, tokenize } from "@/lib/search";
import { buildProductUrl, buildShopUrl } from "@/lib/url";

/* ---------------------------------------------------------------
   Search box with Flipkart-style suggestions.
   - Nothing opens on focus; suggestions appear once the user types.
   - Debounced: the list updates 220ms after typing stops, not on
     every keystroke.
   - One plain list: completed search terms "in <Category>" first,
     then matching products, each with a small photo.
   - Keyboard: ↑/↓ to move, Enter to open, Esc to close.
   The panel is portalled to <body> and pinned under the box, so it is
   never clipped by the header's own overflow.
   --------------------------------------------------------------- */

export type SuggestCategory = {
  id: string;
  label: string;
  href: string;
  category: string;
  matches: string[];
  query?: string;
};

const DEBOUNCE_MS = 220;
const MAX_ROWS = 8;
const MAX_CATEGORY_ROWS = 2;

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function productsIn(category: SuggestCategory, list: Product[]) {
  return list.filter((p) => {
    const cat = p.category.toLowerCase();
    const inCategory = category.matches.includes(cat) ||
      (category.matches.includes("cue equipment") && p.tags.includes("cue equipment"));
    return inCategory && (!category.query || matchesQuery(p, category.query));
  });
}

/** Finish the last typed word from words in the catalogue: "snooker tab" → "snooker table" */
function completeQuery(query: string, pool: Product[], extra: string[] = []): string {
  const tokens = tokenize(query);
  const last = tokens[tokens.length - 1];
  if (!last) return query.trim().toLowerCase();
  const words = new Set<string>();
  for (const text of [...pool.flatMap((p) => [p.name, p.category, p.size, ...p.tags]), ...extra]) {
    for (const w of text.toLowerCase().split(/[^a-z0-9]+/)) if (w) words.add(w);
  }
  const best = Array.from(words).filter((w) => w.startsWith(last)).sort((a, b) => a.length - b.length)[0];
  return [...tokens.slice(0, -1), best ?? last].join(" ");
}

type Row =
  | { kind: "category"; key: string; text: string; label: string; image?: string; href: string }
  | { kind: "product"; key: string; text: string; image: string; href: string };

export function SearchBox({
  value,
  onChange,
  categories,
  className,
  formRef,
  inputType = "text",
  placeholder = "Search for Snooker Tables, Cues...",
  leading,
  trailing,
  onDone,
  refTag = "hcs_nav_search",
}: {
  value: string;
  onChange: (value: string) => void;
  categories: SuggestCategory[];
  className: string;
  formRef?: RefObject<HTMLFormElement | null>;
  inputType?: "text" | "search";
  placeholder?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  onDone?: () => void;
  refTag?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const listId = useId();
  const ownFormRef = useRef<HTMLFormElement>(null);
  const anchorRef = formRef ?? ownFormRef;
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [pos, setPos] = useState<{ top: number; left: number; width: number; maxHeight: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const trimmed = value.trim();
  const debounced = useDebouncedValue(trimmed, DEBOUNCE_MS);
  // Clearing the box hides the list at once; typing waits for the pause
  const query = trimmed ? debounced : "";

  const rows: Row[] = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    const found = searchProducts(products, query);

    // "<term> in <Category>" rows for the categories that fit best
    const catRows = categories
      .map((cat) => {
        const inCat = productsIn(cat, products);
        const hits = found.filter((p) => inCat.includes(p));
        const nameHit = cat.label.toLowerCase().includes(q) || tokenize(q).every((t) => cat.label.toLowerCase().includes(t));
        return { cat, inCat, hits, nameHit };
      })
      .filter((c) => c.nameHit || c.hits.length > 0)
      .sort((a, b) => b.hits.length - a.hits.length || Number(b.nameHit) - Number(a.nameHit))
      .slice(0, MAX_CATEGORY_ROWS)
      .map(({ cat, inCat, hits }): Row => {
        const pool = hits.length ? hits : inCat;
        const text = completeQuery(query, pool, [cat.label]);
        // Category without its own search term: keep what was typed; otherwise open the category
        const href = !cat.query && hits.length
          ? buildShopUrl({ category: cat.category, query: text, ref: refTag })
          : cat.href;
        return { kind: "category", key: `c-${cat.id}`, text, label: cat.label, image: pool[0]?.image, href };
      });

    const productRows: Row[] = found
      .slice(0, MAX_ROWS - catRows.length)
      .map((p) => ({ kind: "product", key: `p-${p.id}`, text: p.name, image: p.image, href: buildProductUrl(p, { ref: "hcs_search_suggest" }) }));

    return [...catRows, ...productRows];
  }, [query, categories, refTag]);

  const showPanel = open && rows.length > 0;

  useEffect(() => setActive(-1), [query, open]);

  // Close when the page changes
  useEffect(() => setOpen(false), [pathname]);

  // Keep the panel pinned under the search box
  const place = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.width === 0) return setOpen(false); // box hidden (e.g. swapped for the sticky bar)
    const top = r.bottom + 6;
    setPos({ top, left: r.left, width: r.width, maxHeight: Math.max(220, window.innerHeight - top - 12) });
  }, [anchorRef]);

  useLayoutEffect(() => {
    if (!showPanel) return;
    place();
    window.addEventListener("scroll", place, { passive: true });
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place);
      window.removeEventListener("resize", place);
    };
  }, [showPanel, place]);

  // Click outside closes
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (anchorRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open, anchorRef]);

  // Keep the highlighted row in view
  useEffect(() => {
    if (active < 0) return;
    panelRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const go = (href: string) => {
    setOpen(false);
    inputRef.current?.blur();
    router.push(href);
    onDone?.();
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (showPanel && active >= 0 && rows[active]) return go(rows[active].href);
    go(buildShopUrl({ query: trimmed, ref: refTag }));
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      // Stop the browser's own "clear the search box" so Esc only closes the list
      e.preventDefault();
      setOpen(false);
      return;
    }
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    if (!open) { setOpen(true); return; }
    if (!rows.length) return;
    setActive((i) => e.key === "ArrowDown" ? (i + 1) % rows.length : (i <= 0 ? rows.length - 1 : i - 1));
  };

  const panel = showPanel && pos && mounted ? createPortal(
    <div
      ref={panelRef}
      className="ss-panel"
      style={{ top: pos.top, left: pos.left, width: pos.width, maxHeight: pos.maxHeight }}
      role="listbox"
      id={listId}
      aria-label="Search suggestions"
    >
      {rows.map((row, index) => (
        <div
          key={row.key}
          id={`${listId}-${index}`}
          data-index={index}
          role="option"
          aria-selected={active === index}
          className={`ss-row ${active === index ? "is-active" : ""}`}
          onMouseDown={(e) => e.preventDefault()} // keep focus in the box
          onClick={() => go(row.href)}
        >
          <span className="ss-thumb">{row.image ? <img src={row.image} alt="" /> : <Search size={16} />}</span>
          <span className="ss-text">
            <span className="ss-title">{row.text}</span>
            {row.kind === "category" && <span className="ss-in">in {row.label}</span>}
          </span>
        </div>
      ))}
    </div>,
    document.body,
  ) : null;

  return (
    <>
      <form className={className} role="search" onSubmit={submit} ref={anchorRef as RefObject<HTMLFormElement>}>
        {leading}
        <input
          ref={inputRef}
          type={inputType}
          value={value}
          onChange={(e) => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          aria-label="Search catalog"
          autoComplete="off"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showPanel && active >= 0 ? `${listId}-${active}` : undefined}
        />
        {trailing}
      </form>
      {panel}
    </>
  );
}
