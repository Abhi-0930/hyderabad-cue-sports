"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { BadgeCheck, ChevronLeft, ChevronRight, MessageCircle, Minus, Plus, ShieldCheck, ShoppingCart, Star, Zap } from "lucide-react";
import { formatInr, Product, products } from "@/lib/products";
import { getProductReviews, summarizeReviews } from "@/lib/reviews";
import { buildProductUrl } from "@/lib/url";
import { mobileCategories, ProductCard, useStorefront, whatsappUrl } from "@/components/storefront-shell";

/* ---------------------------------------------------------------
   Product detail page — gallery, buy box, highlights, description,
   specifications, ratings & reviews and related products.
   --------------------------------------------------------------- */

function Gallery({ product }: { product: Product }) {
  const images = product.gallery?.length ? product.gallery : [product.image];
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const goTo = (index: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
    setActive(index);
  };

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onScroll = () => setActive(Math.round(track.scrollLeft / Math.max(1, track.clientWidth)));
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, []);

  // New product → back to the first photo
  useEffect(() => {
    trackRef.current?.scrollTo({ left: 0 });
    setActive(0);
  }, [product.id]);

  return (
    <div className="pd-gallery">
      {images.length > 1 && (
        <div className="pd-thumbs" role="tablist" aria-label="Product photos">
          {images.map((src, i) => (
            <button key={`${src}-${i}`} type="button" role="tab" aria-selected={active === i} className={active === i ? "is-active" : ""} onClick={() => goTo(i)}>
              <img src={src} alt="" />
            </button>
          ))}
        </div>
      )}
      <div className="pd-main">
        <div className="pd-track" ref={trackRef}>
          {images.map((src, i) => <img key={`${src}-${i}`} src={src} alt={i === 0 ? product.name : `${product.name}, photo ${i + 1}`} draggable={false} />)}
        </div>
        {product.badge && <span className="pd-badge">{product.badge}</span>}
        {images.length > 1 && <>
          <button type="button" className="pd-nav prev" onClick={() => goTo(Math.max(0, active - 1))} disabled={active === 0} aria-label="Previous photo"><ChevronLeft size={20} /></button>
          <button type="button" className="pd-nav next" onClick={() => goTo(Math.min(images.length - 1, active + 1))} disabled={active === images.length - 1} aria-label="Next photo"><ChevronRight size={20} /></button>
          <div className="pd-dots">
            {images.map((_, i) => <button key={i} type="button" className={active === i ? "is-active" : ""} onClick={() => goTo(i)} aria-label={`Show photo ${i + 1}`} />)}
          </div>
        </>}
      </div>
    </div>
  );
}

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="pd-stars" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={size} className={i <= Math.round(value) ? "on" : ""} fill="currentColor" strokeWidth={0} />)}
    </span>
  );
}

function RelatedRail({ title, items }: { title: string; items: Product[] }) {
  const railRef = useRef<HTMLDivElement>(null);
  if (!items.length) return null;
  const slide = (dir: 1 | -1) => railRef.current?.scrollBy({ left: dir * railRef.current.clientWidth, behavior: "smooth" });
  return (
    <section className="pd-section pd-related">
      <div className="pd-section-head">
        <h2>{title}</h2>
        {items.length > 4 && <div className="pd-rail-arrows">
          <button type="button" onClick={() => slide(-1)} aria-label="Scroll left"><ChevronLeft size={18} /></button>
          <button type="button" onClick={() => slide(1)} aria-label="Scroll right"><ChevronRight size={18} /></button>
        </div>}
      </div>
      <div className="pd-rail" ref={railRef}>
        {items.map((item) => <ProductCard key={item.id} product={item} refTag="hcs_pdp_related" />)}
      </div>
    </section>
  );
}

export function ProductDetailView({ product }: { product: Product }) {
  const { addToCart } = useStorefront();
  const [quantity, setQuantity] = useState(1);
  const reviews = useMemo(() => getProductReviews(product), [product]);
  const summary = useMemo(() => summarizeReviews(reviews), [reviews]);

  useEffect(() => setQuantity(1), [product.id]);

  const discount = product.compareAt && product.compareAt > product.price
    ? Math.round(((product.compareAt - product.price) / product.compareAt) * 100)
    : 0;

  // Navbar category this product belongs to (for the breadcrumb)
  const productText = `${product.name} ${product.tags.join(" ")}`.toLowerCase();
  const navCategory = mobileCategories.find((c) => c.matches.includes(product.category.toLowerCase()) && c.query && productText.includes(c.query))
    ?? mobileCategories.find((c) => c.matches.includes(product.category.toLowerCase()) && !c.query)
    ?? mobileCategories.find((c) => c.matches.includes(product.category.toLowerCase()));

  // Other sizes of the same kind of table, linked to real products
  const sizeOptions = useMemo(() => {
    if (product.type !== "table") return [];
    const bySize = new Map<string, Product>();
    for (const p of products) {
      if (p.category !== product.category) continue;
      if (p.size === product.size) bySize.set(p.size, product);
      else if (!bySize.has(p.size)) bySize.set(p.size, p);
    }
    return Array.from(bySize.entries()).sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
  }, [product]);

  const similar = useMemo(
    () => products.filter((p) => p.id !== product.id && p.category === product.category).slice(0, 10),
    [product],
  );
  const alsoLike = useMemo(
    () => products.filter((p) => p.id !== product.id && p.category !== product.category).slice(0, 10),
    [product],
  );

  const stock = product.availability === "In stock"
    ? { cls: "in", label: "In stock" }
    : product.availability === "Low stock"
      ? { cls: "low", label: "Only a few left" }
      : { cls: "order", label: "Made to order" };

  return (
    <div className="pd-page">
      <nav className="pd-breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <ChevronRight size={13} />
        <Link href={navCategory?.href ?? "/shop"}>{navCategory?.label ?? product.category}</Link>
        <ChevronRight size={13} />
        <span aria-current="page">{product.name}</span>
      </nav>

      <section className="pd-top">
        <Gallery product={product} />

        <div className="pd-buy">
          <Link href={navCategory?.href ?? "/shop"} className="pd-category">{product.category}</Link>
          <h1 className="pd-title">{product.name}</h1>

          {summary.total > 0 && (
            <a href="#reviews" className="pd-rating-row">
              <span className="pd-rating-pill">{summary.average.toFixed(1)} <Star size={12} fill="currentColor" strokeWidth={0} /></span>
              <span>{summary.total} ratings &amp; reviews</span>
            </a>
          )}

          <div className="pd-price-block">
            <div className="pd-price-row">
              {discount > 0 && <span className="pd-discount">{discount}% off</span>}
              <strong className="pd-price">{formatInr(product.price)}</strong>
            </div>
            {product.compareAt && discount > 0 && <span className="pd-mrp">M.R.P.: <del>{formatInr(product.compareAt)}</del></span>}
            <span className="pd-tax">Inclusive of all taxes</span>
          </div>

          <div className={`pd-stock ${stock.cls}`}><span className="pd-stock-dot" />{stock.label}</div>

          {sizeOptions.length > 1 && (
            <div className="pd-option">
              <span className="pd-option-label">Table size: <strong>{product.size}</strong></span>
              <div className="pd-option-chips">
                {sizeOptions.map(([size, p]) => size === product.size
                  ? <span key={size} className="pd-chip is-selected" aria-current="true">{size}</span>
                  : <Link key={size} href={buildProductUrl(p, { ref: "hcs_pdp_size" })} className="pd-chip">{size}</Link>)}
              </div>
            </div>
          )}

          <div className="pd-actions">
            <div className="pd-qty" aria-label="Quantity">
              <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1} aria-label="Decrease quantity"><Minus size={16} /></button>
              <span aria-live="polite">{quantity}</span>
              <button type="button" onClick={() => setQuantity((q) => Math.min(10, q + 1))} aria-label="Increase quantity"><Plus size={16} /></button>
            </div>
            <button type="button" className="pd-add" onClick={() => addToCart(product, quantity, false)}>
              <ShoppingCart size={18} /> Add to cart
            </button>
            <button type="button" className="pd-buy-now" onClick={() => addToCart(product, quantity, true, false)}>
              <Zap size={18} /> Buy now
            </button>
          </div>

          <ul className="pd-assurance">
            <li><ShieldCheck size={18} /><span>Secure payments</span></li>
            <li><BadgeCheck size={18} /><span>Genuine products</span></li>
            <li><MessageCircle size={18} /><a href={whatsappUrl(`Hi, I have a question about ${product.name}`)} target="_blank" rel="noopener noreferrer">Ask an expert</a></li>
          </ul>

          {product.details.length > 0 && (
            <div className="pd-highlights">
              <h2>Highlights</h2>
              <ul>{product.details.map((d) => <li key={d}>{d}</li>)}</ul>
            </div>
          )}
        </div>
      </section>

      <section className="pd-section pd-info">
        <div className="pd-info-block">
          <h2>Product description</h2>
          <p>{product.description}</p>
        </div>
        {product.specs.length > 0 && (
          <div className="pd-info-block">
            <h2>Specifications</h2>
            <dl className="pd-specs">
              {product.specs.map((s) => <div key={s.label}><dt>{s.label}</dt><dd>{s.value}</dd></div>)}
            </dl>
          </div>
        )}
      </section>

      {summary.total > 0 && (
        <section className="pd-section pd-reviews" id="reviews">
          <div className="pd-section-head"><h2>Ratings &amp; reviews</h2></div>
          <div className="pd-reviews-layout">
            <div className="pd-review-summary">
              <div className="pd-review-score">
                <strong>{summary.average.toFixed(1)}</strong>
                <Stars value={summary.average} size={18} />
                <span>{summary.total} ratings &amp; reviews</span>
              </div>
              <div className="pd-review-bars">
                {summary.counts.map(({ star, count }) => (
                  <div key={star} className="pd-review-bar">
                    <span>{star} <Star size={11} fill="currentColor" strokeWidth={0} /></span>
                    <div className="pd-bar-track"><div className={`pd-bar-fill s${star}`} style={{ width: `${(count / summary.total) * 100}%` }} /></div>
                    <span className="pd-bar-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="pd-review-list">
              {reviews.map((r) => (
                <article key={r.id} className="pd-review">
                  <div className="pd-review-top">
                    <span className={`pd-review-pill ${r.rating >= 4 ? "good" : r.rating === 3 ? "ok" : "bad"}`}>{r.rating} <Star size={11} fill="currentColor" strokeWidth={0} /></span>
                    <h3>{r.title}</h3>
                  </div>
                  <p>{r.body}</p>
                  <div className="pd-review-meta">
                    <span className="pd-review-avatar" aria-hidden="true">{r.name.charAt(0)}</span>
                    <span>{r.name}</span>
                    <span className="pd-dot" aria-hidden="true" />
                    <span>{r.city}</span>
                    <span className="pd-dot" aria-hidden="true" />
                    <time dateTime={r.date}>{new Date(r.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</time>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <RelatedRail title="Similar products" items={similar} />
      <RelatedRail title="You may also like" items={alsoLike} />
    </div>
  );
}
