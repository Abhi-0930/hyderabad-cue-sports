"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowRight, Check, ChevronDown, ChevronLeft, ChevronRight, Heart, Loader2, Minus, Plus, Ruler, Search, ShieldCheck, ShoppingBag, ShoppingCart, Sparkles, Star, Truck, X } from "lucide-react";
import { accessoryCategories, accessoryDeals, collectionCards, formatInr, getProduct, Product, products, fetchStorefrontProducts, fetchStorefrontProductBySlug } from "@/lib/products";
import { ArrowLink, ProductCard, QuickViewModal, SectionHeading, SliderArrows, useStorefront } from "@/components/storefront-shell";
import { AnimatedAddToCart } from "@/components/animated-add-to-cart";
import { PromoBannerCarousel } from "@/components/promo-banner-carousel";
import { ShopByEquipment } from "@/components/shop-by-equipment";
import { ConsultationPanel, CustomerReviews, NewsletterSignup, ShopBySize } from "@/components/home-sections";
import { buildProductUrl, verifyProductUrlSignature } from "@/lib/url";

export function HomePage() {
  const [quickProduct, setQuickProduct] = useState<Product | null>(null);
  const { showNotice } = useStorefront();
  const sliderRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [featuredProductsList, setFeaturedProductsList] = useState<Product[]>(() => products.slice(0, 8));

  useEffect(() => {
    fetchStorefrontProducts().then((all) => {
      if (all && all.length > 0) {
        setFeaturedProductsList(all.slice(0, 8));
      }
    });
  }, []);

  const updateScrollButtons = () => {
    if (!sliderRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
    setCanScrollLeft(scrollLeft > 15);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 15);
  };

  useEffect(() => {
    updateScrollButtons();
    const el = sliderRef.current;
    if (!el) return;

    el.addEventListener("scroll", updateScrollButtons, { passive: true });
    window.addEventListener("resize", updateScrollButtons);

    return () => {
      el.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, []);

  const slide = (direction: "left" | "right") => {
    if (!sliderRef.current) return;
    // Card widths are fluid (4 per row on desktop), so move by one full view
    const offset = sliderRef.current.clientWidth;
    sliderRef.current.scrollBy({
      left: direction === "left" ? -offset : offset,
      behavior: "smooth"
    });
  };

  return <>
    <section className="hero-section">
      <div className="hero-media">
        <img src="/images/snooker-hero.jpg" alt="Professional snooker table in an elegant room" />
        <div className="hero-media-fade" />
      </div>
      <div className="hero-content container">
        <div className="hero-copy">
          <h1>
            Where every<br />
            shot begins with<br />
            <em>excellence.</em>
          </h1>
          <div className="hero-actions">
            <Link href="/shop?category=Snooker+Tables" className="button button-dark">
              Shop Tables <ArrowRight size={15} />
            </Link>
            <Link href="/shop" className="button button-light">
              Shop Equipment
            </Link>
          </div>
        </div>
      </div>
    </section>

    <section className="category-showcase-section">
      <div className="container">
        <div className="category-showcase-grid">
          <Link href="/shop?category=Snooker+Tables" className="category-showcase-card">
            <div className="category-showcase-media">
              <img src="/images/categories/cat-snooker-tables.jpg" alt="Snooker Tables" />
              <div className="category-showcase-overlay" />
            </div>
            <div className="category-showcase-content">
              <span>Snooker Tables <ArrowRight size={15} /></span>
            </div>
          </Link>
          <Link href="/shop?category=Cue+Equipment" className="category-showcase-card">
            <div className="category-showcase-media">
              <img src="/images/categories/cat-cue-equipment.jpg" alt="Cue Equipment" />
              <div className="category-showcase-overlay" />
            </div>
            <div className="category-showcase-content">
              <span>Cue Equipment <ArrowRight size={15} /></span>
            </div>
          </Link>
          <Link href="/shop?category=Table+Accessories" className="category-showcase-card">
            <div className="category-showcase-media">
              <img src="/images/categories/cat-table-accessories.jpg" alt="Table Accessories" />
              <div className="category-showcase-overlay" />
            </div>
            <div className="category-showcase-content">
              <span>Table Accessories <ArrowRight size={15} /></span>
            </div>
          </Link>
          <Link href="/shop?category=Scoreboards" className="category-showcase-card">
            <div className="category-showcase-media">
              <img src="/images/categories/cat-scoreboards.jpg" alt="Scoreboards" />
              <div className="category-showcase-overlay" />
            </div>
            <div className="category-showcase-content">
              <span>Scoreboards <ArrowRight size={15} /></span>
            </div>
          </Link>
        </div>
      </div>
    </section>

    <section className="featured-products-section">
      <div className="featured-products-container">
        <div className="featured-header">
          <h2 className="featured-title">Featured Products</h2>
          <Link href="/shop" className="featured-view-all" aria-label="View all featured products">
            <ChevronRight size={22} className="view-all-arrow" />
          </Link>
        </div>

        {/* 1-Row Continuous Gesture Sliding Container with Desktop Arrow Controls */}
        <div className="featured-slider-wrapper">
          <button
            className={`featured-slide-nav prev ${canScrollLeft ? "visible" : "hidden"}`}
            onClick={() => slide("left")}
            aria-label="Slide previous products"
            tabIndex={canScrollLeft ? 0 : -1}
          >
            <ChevronLeft size={20} />
          </button>

          <div className="featured-cards-grid" ref={sliderRef}>
            {featuredProductsList.map((product) => (
              <ProductCard key={product.id} product={product} refTag="hcs_hp_featured" />
            ))}
          </div>

          <button
            className={`featured-slide-nav next ${canScrollRight ? "visible" : "hidden"}`}
            onClick={() => slide("right")}
            aria-label="Slide next products"
            tabIndex={canScrollRight ? 0 : -1}
          >
            <ChevronRight size={20} />
          </button>
        </div>


      </div>
    </section>

    {/* Promotional Banner Card Carousel */}
    <PromoBannerCarousel />

    {/* Shop by Equipment (Amazon & Flipkart Inspired Equipment Rail with Arrows) */}
    <ShopByEquipment />

    {/* Everything You Need For The Game - Amazon-Style Deals Quadrant */}
    <section className="accessories-section">
      <div className="container">
        <div className="amazon-deals-container">
          <div className="amazon-deals-header">
            <h2 className="amazon-deals-title">Everything you need for the game</h2>
            <Link href="/shop?type=accessory" className="amazon-deals-arrow-link" aria-label="Explore all accessories">
              <ChevronRight size={22} className="amazon-deals-arrow" />
            </Link>
          </div>

          <div className="amazon-deals-grid">
            {accessoryDeals.map((item) => (
              <Link href={item.link} className="amazon-deal-card" key={item.id}>
                <div className="amazon-deal-media">
                  <img src={item.image} alt={item.name} />
                </div>
                <div className="amazon-deal-body">
                  <h3 className="amazon-deal-name">{item.name}</h3>
                  <span className="amazon-deal-subtext">{item.subtitle}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>

    <section className="statement-banner"><div className="statement-banner-image"><img src="/images/snooker-detail.jpg" alt="Close view of a professional snooker table" /></div><div className="statement-banner-content"><h2>Create your perfect <em>snooker space.</em></h2><p>Explore premium snooker tables for homes, clubs and professional playing environments.</p><Link href="/shop" className="statement-banner-cta">Explore collection <ArrowRight size={17} /></Link></div></section>

    <ShopBySize />
    <CustomerReviews />
    <ConsultationPanel />
    <NewsletterSignup />
    <QuickViewModal product={quickProduct} onClose={() => setQuickProduct(null)} />
  </>;
}

export function ShopPage() {
  // No filter sidebar: what's shown comes only from the link (navbar pills,
  // search, homepage cards), so a plain /shop always means "all products".
  const searchParams = useSearchParams();
  const category = searchParams.get("category") ?? "all";
  const size = searchParams.get("size") ?? "all";
  const type = searchParams.get("type") ?? "all";
  const query = (searchParams.get("query") ?? "").toLowerCase();
  const [sort, setSort] = useState("featured");
  const [quickProduct, setQuickProduct] = useState<Product | null>(null);
  const [liveProducts, setLiveProducts] = useState<Product[]>(products);

  useEffect(() => {
    fetchStorefrontProducts().then((data) => {
      if (data && data.length > 0) {
        setLiveProducts(data);
      }
    });
  }, []);

  const filteredProducts = useMemo(() => {
    let result = liveProducts.filter((product) => {
      const matchesQuery = !query || `${product.name} ${product.category} ${product.size} ${product.tags.join(" ")}`.toLowerCase().includes(query);
      const matchesSize = size === "all" || product.size === size;
      const matchesType = type === "all" || product.type === type;
      const matchesCategory = category === "all" ||
        product.category.toLowerCase() === category.toLowerCase() ||
        (category.toLowerCase() === "cue equipment" && (product.category.toLowerCase() === "cues" || product.tags.includes("cue equipment")));
      return matchesQuery && matchesSize && matchesType && matchesCategory;
    });
    if (sort === "low") result = [...result].sort((a, b) => a.price - b.price);
    if (sort === "high") result = [...result].sort((a, b) => b.price - a.price);
    if (sort === "new") result = [...result].reverse();
    return result;
  }, [category, liveProducts, query, size, sort, type]);

  return <>
    <section className="shop-hero"><div className="container shop-hero-inner"><div><span className="eyebrow">The collection · Official catalogue</span><h1>Explore our <em>cue sports collection.</em></h1><p>Premium snooker tables, cue equipment, table accessories, and scoreboards crafted for players across India.</p></div><div className="shop-hero-stat"><span>01 — 16</span><strong>Official<br />catalog range</strong></div></div></section>
    <section className="shop-section section"><div className="container"><div className="shop-toolbar"><div><span className="result-count">Showing {filteredProducts.length} of {liveProducts.length} products</span>{query && <span className="query-chip">Search: {query}<X size={12} /></span>}</div><div className="toolbar-actions"><label className="sort-control"><span>Sort by</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">Featured</option><option value="low">Price: Low to High</option><option value="high">Price: High to Low</option><option value="new">Newest Arrivals</option></select><ChevronDown size={15} /></label></div></div><div className="shop-layout"><div className="shop-results">{filteredProducts.length > 0 ? <div className="product-grid shop-product-grid">{filteredProducts.map((product) => <ProductCard key={product.id} product={product} onQuickView={setQuickProduct} />)}</div> : <div className="empty-state"><div className="empty-state-mark"><Search size={24} /></div><span className="eyebrow">No matching pieces</span><h2>Nothing in this frame.</h2><p>Try a different category or search to see more of our collection.</p><Link href="/shop" className="button button-dark">View all products <ArrowRight size={16} /></Link></div>}</div></div></div></section>
    <section className="shop-note"><div className="container shop-note-inner"><Sparkles size={18} /><p><strong>Every product, price and specification on this page is illustrative demo content.</strong> The catalogue is designed to be edited when final business information is available.</p></div></section>
    <QuickViewModal product={quickProduct} onClose={() => setQuickProduct(null)} />
  </>;
}

export function ProductPage({
  slug,
  pid,
  isTampered,
  signature,
}: {
  slug?: string;
  pid?: string;
  isTampered?: boolean;
  signature?: string;
}) {
  const [currentProduct, setCurrentProduct] = useState<Product | undefined>(() => {
    return pid
      ? products.find((p) => p.id === pid) || (slug ? getProduct(slug) : undefined)
      : slug
      ? getProduct(slug)
      : undefined;
  });

  const [loading, setLoading] = useState(!currentProduct);
  const [tamperedState, setTamperedState] = useState(Boolean(isTampered));
  const { addToCart } = useStorefront();
  const [selectedImage, setSelectedImage] = useState(currentProduct?.image ?? "");

  useEffect(() => {
    if (slug) {
      fetchStorefrontProductBySlug(slug)
        .then((p) => {
          if (p) {
            setCurrentProduct(p);
            setSelectedImage(p.image);
            if (signature && !verifyProductUrlSignature(p.id, p.slug, signature)) {
              setTamperedState(true);
            }
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [slug, pid, signature]);

  const product = currentProduct;
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("details");

  if (tamperedState) {
    return (
      <section className="not-found section">
        <div className="container">
          <span className="eyebrow">Security Warning · Link Modified</span>
          <h1>Invalid or modified product link</h1>
          <p>
            The query parameters on this link do not match our verified catalogue signature.
            To protect your checkout security, please access the product from our authentic range.
          </p>
          <Link href="/shop" className="button button-dark">
            Browse Authentic Products <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    );
  }

  if (loading && !product) {
    return (
      <div className="container" style={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>
        <Loader2 size={28} className="hcs-spin" />
      </div>
    );
  }

  if (!product) return <section className="not-found section"><div className="container"><span className="eyebrow">404 · Product not found</span><h1>This frame is still being set.</h1><p>The product you are looking for is not part of the demo catalogue.</p><Link href="/shop" className="button button-dark">Back to collection <ArrowRight size={16} /></Link></div></section>;
  const gallery = product.gallery?.length ? product.gallery : [product.image, "/images/snooker-room.jpg", "/images/snooker-detail.jpg"];
  const related = products.filter((item) => item.id !== product.id && item.type === product.type).slice(0, 3);
  return <>
    <div className="product-breadcrumb container"><Link href="/">Home</Link><ArrowRight size={13} /><Link href="/shop">Collection</Link><ArrowRight size={13} /><span>{product.name}</span></div>
    <section className="product-detail-section"><div className="container product-detail-layout"><div className="product-gallery"><div className="product-gallery-main"><img src={selectedImage} alt={product.name} /><span className="gallery-demo-label">Demo imagery</span></div><div className="product-thumbnails">{gallery.map((image, index) => <button key={`${image}-${index}`} className={selectedImage === image ? "active" : ""} onClick={() => setSelectedImage(image)}><img src={image} alt={`${product.name} view ${index + 1}`} /></button>)}</div></div><div className="product-detail-copy"><div className="detail-topline"><span className="eyebrow">{product.category} · {product.size}</span><button className="icon-button detail-heart" aria-label="Save product"><Heart size={19} /></button></div><h1>{product.name}</h1><div className="detail-rating"><span className="testimonial-stars"><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /></span><span>Sample rating display · demo only</span></div><div className="detail-price-row"><strong>{formatInr(product.price)}</strong>{product.compareAt && <del>{formatInr(product.compareAt)}</del>}<span className="detail-demo">Demo price</span></div><p className="detail-description">{product.description}</p><div className="detail-select"><label htmlFor="size">Playing size</label><div className="select-wrap"><select id="size" defaultValue={product.size}><option>{product.size}</option><option>10 FT · sample option</option><option>12 FT · sample option</option></select><ChevronDown size={16} /></div><small>Size options are illustrative and can be connected to the final catalogue.</small></div><div className="detail-purchase-row"><div className="quantity-control quantity-control-large"><button onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease quantity"><Minus size={15} /></button><span>{quantity}</span><button onClick={() => setQuantity(quantity + 1)} aria-label="Increase quantity"><Plus size={15} /></button></div><AnimatedAddToCart onAdd={() => addToCart(product, quantity, false)} label="Add to bag" addedLabel="Added to bag" className="button-grow" /></div><div className="detail-service-grid"><div><ShieldCheck size={17} /><span><strong>{product.availability}</strong><small>Sample availability</small></span></div><div><Truck size={17} /><span><strong>India-wide service</strong><small>Delivery details to confirm</small></span></div><div><Ruler size={17} /><span><strong>Room planning</strong><small>Ask about sample guidance</small></span></div></div></div></div></section>
    <section className="product-info-section"><div className="container"><div className="product-tabs"><button className={activeTab === "details" ? "active" : ""} onClick={() => setActiveTab("details")}>Product details</button><button className={activeTab === "specs" ? "active" : ""} onClick={() => setActiveTab("specs")}>Specifications</button><button className={activeTab === "delivery" ? "active" : ""} onClick={() => setActiveTab("delivery")}>Delivery &amp; support</button></div><div className="product-info-panel">{activeTab === "details" && <div className="info-columns"><div><span className="eyebrow">A considered centrepiece</span><h2>Made for the room around the game.</h2></div><div><p>{product.description}</p><ul>{product.details.map((detail) => <li key={detail}><Check size={15} />{detail}</li>)}</ul></div></div>}{activeTab === "specs" && <div className="spec-table">{product.specs.map((spec) => <div key={spec.label}><span>{spec.label}</span><strong>{spec.value}</strong></div>)}</div>}{activeTab === "delivery" && <div className="info-columns"><div><span className="eyebrow">Service promise</span><h2>Details to be shaped with you.</h2></div><div><p>Shipping, installation, return and support details shown here are placeholders for the client demonstration and should be replaced with the final business policy.</p><ul><li><Check size={15} />Sample support pathway</li><li><Check size={15} />Sample delivery planning</li><li><Check size={15} />Final policy copy to be added</li></ul></div></div>}</div></div></section>
    <section className="section related-section"><div className="container"><SectionHeading eyebrow="Continue exploring" title="You may also like" /><div className="product-grid">{related.map((item) => <ProductCard key={item.id} product={item} onQuickView={() => undefined} />)}</div></div></section>
  </>;
}
