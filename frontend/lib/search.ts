import type { Product } from "@/lib/products";

/* Shared search matching, used by the search suggestions and the Shop page,
   so what the dropdown suggests is exactly what "See all results" shows.
   A product matches when every typed word appears somewhere in its name,
   category, size or tags ("12 ft table" finds "12 FT Snooker Table"). */

export function tokenize(query: string): string[] {
  return query.toLowerCase().trim().split(/\s+/).filter(Boolean);
}

export function productHaystack(product: Product): string {
  return `${product.name} ${product.category} ${product.size} ${product.tags.join(" ")}`.toLowerCase();
}

export function matchesQuery(product: Product, query: string): boolean {
  const tokens = tokenize(query);
  if (!tokens.length) return true;
  const haystack = productHaystack(product);
  return tokens.every((t) => haystack.includes(t));
}

/** Matching products, best matches first (name matches beat tag matches). */
export function searchProducts(list: Product[], query: string): Product[] {
  const q = query.toLowerCase().trim();
  const tokens = tokenize(q);
  if (!tokens.length) return [];
  const score = (p: Product) => {
    const name = p.name.toLowerCase();
    if (name.startsWith(q)) return 4;
    if (name.includes(q)) return 3;
    if (tokens.every((t) => name.includes(t))) return 2;
    if (tokens.some((t) => name.includes(t))) return 1;
    return 0;
  };
  return list
    .map((p, i) => ({ p, i, s: score(p) }))
    .filter(({ p }) => matchesQuery(p, q))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map(({ p }) => p);
}
