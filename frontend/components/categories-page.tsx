"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import { Product, products } from "@/lib/products";
import { buildProductUrl } from "@/lib/url";
import { mobileCategories } from "@/components/storefront-shell";
import { applyShopFilters, readShopFilters } from "@/components/shop-filters";

/* ---------------------------------------------------------------
   All Categories — Flipkart-style two panes:
   left: category rail (For You + every navbar category)
   right: sections of photo tiles for the selected category.
   The selected category is kept in the link (?c=tables) so back works.
   --------------------------------------------------------------- */

const FOR_YOU = "for-you";
const TABLE_SIZES = ["8 FT", "10 FT", "12 FT"];

/** Same products the Shop page shows for that category link */
function productsFor(href: string): Product[] {
  const params = new URLSearchParams(href.split("?")[1] ?? "");
  return applyShopFilters(products, readShopFilters(params));
}

const isBestSeller = (p: Product) =>
  (p.badge ?? "").toLowerCase() === "best seller" || p.tags.some((t) => t.toLowerCase() === "best seller");

function Tile({ href, image, label, ribbon }: { href: string; image?: string; label: string; ribbon?: string }) {
  return (
    <Link href={href} className="ac-tile">
      <span className="ac-tile-img">
        {image && <img src={image} alt="" />}
        {ribbon && <span className="ac-ribbon">{ribbon}</span>}
      </span>
      <span className="ac-tile-label">{label}</span>
    </Link>
  );
}

function ViewAllTile({ href }: { href: string }) {
  return (
    <Link href={href} className="ac-tile">
      <span className="ac-tile-img ac-view-all"><ArrowRight size={26} strokeWidth={1.8} /></span>
      <span className="ac-tile-label">View all</span>
    </Link>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="ac-section">
      <h2>{title}</h2>
      <div className="ac-grid">{children}</div>
    </section>
  );
}

export function AllCategoriesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const paneRef = useRef<HTMLDivElement>(null);

  const ids = [FOR_YOU, ...mobileCategories.map((c) => c.id)];
  const fromUrl = searchParams.get("c");
  const [selected, setSelected] = useState(fromUrl && ids.includes(fromUrl) ? fromUrl : FOR_YOU);

  useEffect(() => {
    if (fromUrl && ids.includes(fromUrl)) setSelected(fromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromUrl]);

  const choose = (id: string) => {
    setSelected(id);
    paneRef.current?.scrollTo({ top: 0 });
    router.replace(id === FOR_YOU ? pathname : `${pathname}?c=${id}`, { scroll: false });
  };

  const rail = useMemo(() => mobileCategories.map((cat) => {
    const items = productsFor(cat.href);
    return { cat, items, image: items[0]?.image };
  }), []);

  const current = rail.find((r) => r.cat.id === selected);

  return (
    <div className="ac-page">
      <div className="ac-head"><h1>All Categories</h1></div>
      <div className="ac-body">
        <nav className="ac-rail" aria-label="Categories">
          <button type="button" className={`ac-rail-item ${selected === FOR_YOU ? "is-active" : ""}`} onClick={() => choose(FOR_YOU)} aria-current={selected === FOR_YOU}>
            <span className="ac-rail-img ac-rail-icon"><Sparkles size={24} strokeWidth={1.8} /></span>
            <span className="ac-rail-label">For You</span>
          </button>
          {rail.map(({ cat, image }) => (
            <button key={cat.id} type="button" className={`ac-rail-item ${selected === cat.id ? "is-active" : ""}`} onClick={() => choose(cat.id)} aria-current={selected === cat.id}>
              <span className="ac-rail-img">{image && <img src={image} alt="" />}</span>
              <span className="ac-rail-label">{cat.label}</span>
            </button>
          ))}
        </nav>

        <div className="ac-pane" ref={paneRef}>
          {selected === FOR_YOU && <>
            <Section title="Popular categories">
              {rail.map(({ cat, image }) => <Tile key={cat.id} href={cat.href} image={image} label={cat.label} />)}
              <ViewAllTile href="/shop" />
            </Section>

            <Section title="Best sellers">
              {products.filter(isBestSeller).map((p) => <Tile key={p.id} href={buildProductUrl(p, { ref: "hcs_categories" })} image={p.image} label={p.name} ribbon="Best seller" />)}
            </Section>

            <Section title="Snooker tables by size">
              {TABLE_SIZES.map((size) => {
                const table = products.find((p) => p.type === "table" && p.size === size);
                return <Tile key={size} href={`/shop?${new URLSearchParams({ category: "Snooker Tables", size })}`} image={table?.image} label={`${size} tables`} />;
              })}
            </Section>
          </>}

          {current && <>
            {current.cat.id === "tables" && (
              <Section title="Shop by size">
                {TABLE_SIZES.map((size) => {
                  const table = current.items.find((p) => p.size === size);
                  return <Tile key={size} href={`/shop?${new URLSearchParams({ category: "Snooker Tables", size })}`} image={table?.image} label={size} />;
                })}
              </Section>
            )}

            <Section title={current.cat.label}>
              {current.items.map((p) => <Tile key={p.id} href={buildProductUrl(p, { ref: "hcs_categories" })} image={p.image} label={p.name} ribbon={p.badge} />)}
              <ViewAllTile href={current.cat.href} />
            </Section>
          </>}
        </div>
      </div>
    </div>
  );
}
