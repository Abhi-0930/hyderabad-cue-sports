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
import { applyShopFilters, readShopFilters, ShopToolbar } from "@/components/shop-filters";
import { ProductDetailView } from "@/components/product-detail";
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
              <span>Snooker Tables</span>
            </div>
          </Link>
          <Link href="/shop?category=Cue+Equipment" className="category-showcase-card">
            <div className="category-showcase-media">
              <img src="/images/categories/cat-cue-equipment.jpg" alt="Cue Equipment" />
              <div className="category-showcase-overlay" />
            </div>
            <div className="category-showcase-content">
              <span>Cue Equipment</span>
            </div>
          </Link>
          <Link href="/shop?category=Table+Accessories" className="category-showcase-card">
            <div className="category-showcase-media">
              <img src="/images/categories/cat-table-accessories.jpg" alt="Table Accessories" />
              <div className="category-showcase-overlay" />
            </div>
            <div className="category-showcase-content">
              <span>Table Accessories</span>
            </div>
          </Link>
          <Link href="/shop?category=Scoreboards" className="category-showcase-card">
            <div className="category-showcase-media">
              <img src="/images/categories/cat-scoreboards.jpg" alt="Scoreboards" />
              <div className="category-showcase-overlay" />
            </div>
            <div className="category-showcase-content">
              <span>Scoreboards</span>
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
  // Filters and sort come from the URL (navbar, search, homepage links and
  // the Filters panel all just change the link).
  const searchParams = useSearchParams();
  const filters = readShopFilters(searchParams);
  const [quickProduct, setQuickProduct] = useState<Product | null>(null);
  const [liveProducts, setLiveProducts] = useState<Product[]>(products);

  useEffect(() => {
    fetchStorefrontProducts().then((data) => {
      if (data && data.length > 0) {
        setLiveProducts(data);
      }
    });
  }, []);

  const filterKey = searchParams.toString();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const filteredProducts = useMemo(() => applyShopFilters(liveProducts, filters), [liveProducts, filterKey]);

  return <>
    <section className="shop-section">
      <div className="shop-body"><ShopToolbar allProducts={liveProducts} resultCount={filteredProducts.length} /><div className="shop-layout"><div className="shop-results">{filteredProducts.length > 0 ? <div className="product-grid shop-product-grid">{filteredProducts.map((product) => <ProductCard key={product.id} product={product} onQuickView={setQuickProduct} />)}</div> : <div className="shop-empty"><span className="shop-empty-icon"><Search size={26} /></span><h2>No products here yet</h2><p>Try another category or search for something else.</p><Link href="/shop" className="shop-empty-btn">View all products <ArrowRight size={16} /></Link></div>}</div></div></div></section>
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

  useEffect(() => {
    // Opened another product (size chip, related product): show it straight away
    const local = pid ? products.find((p) => p.id === pid) || (slug ? getProduct(slug) : undefined) : slug ? getProduct(slug) : undefined;
    if (local) setCurrentProduct(local);
    if (slug) {
      fetchStorefrontProductBySlug(slug)
        .then((p) => {
          if (p) {
            setCurrentProduct(p);
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
  return <ProductDetailView product={product} />;
}
