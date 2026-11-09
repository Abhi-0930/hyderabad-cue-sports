"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowRight, Check, ChevronDown, ChevronLeft, ChevronRight, Filter, Heart, Minus, Plus, Ruler, Search, ShieldCheck, ShoppingBag, ShoppingCart, Sparkles, Star, Truck, X } from "lucide-react";
import { accessoryCategories, collectionCards, formatInr, getProduct, Product, products } from "@/lib/products";
import { ArrowLink, ProductCard, QuickViewModal, SectionHeading, SliderArrows, useStorefront } from "@/components/storefront-shell";

export function HomePage() {
  const [quickProduct, setQuickProduct] = useState<Product | null>(null);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const { showNotice, addToCart, wishlist, toggleWishlist } = useStorefront();
  const sliderRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

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
    const cardWidth = 285;
    const offset = sliderRef.current.clientWidth > 700 ? cardWidth * 2 : cardWidth;
    sliderRef.current.scrollBy({
      left: direction === "left" ? -offset : offset,
      behavior: "smooth"
    });
  };

  const submitNewsletter = (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    showNotice("Thank you — you are on the demo list.");
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
      {/* Corner Decorative Waves with Gold Trim */}
      <svg className="featured-corner-tl" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M0 0 H180 C130 35 75 75 25 115 C10 132 0 148 0 160 Z" fill="#113a27" />
        <path d="M180 0 C130 35 75 75 25 115 C10 132 0 148 0 160" stroke="#c6a15b" strokeWidth="2.5" />
      </svg>
      <svg className="featured-corner-br" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M200 160 H20 C70 125 125 85 175 45 C190 28 200 12 200 0 Z" fill="#113a27" />
        <path d="M20 160 C70 125 125 85 175 45 C190 28 200 12 200 0" stroke="#c6a15b" strokeWidth="2.5" />
      </svg>

      <div className="container featured-products-container">
        {/* Header with Centered — FEATURED PRODUCTS — and View All → */}
        <div className="featured-header">
          <div className="featured-title-wrap">
            <span className="featured-gold-rule" />
            <h2 className="featured-title">FEATURED PRODUCTS</h2>
            <span className="featured-gold-rule" />
          </div>
          <Link href="/shop" className="featured-view-all">
            View All <ArrowRight size={14} />
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
            {products.slice(0, 8).map((product) => {
              const isSaved = wishlist.includes(product.id);
              return (
                <div key={product.id} className="featured-product-card">
                  <div className="featured-card-media">
                    <Link href={`/products/${product.slug}`} className="featured-media-link">
                      <img src={product.image} alt={product.name} />
                    </Link>
                    <button
                      className={`featured-wishlist-btn ${isSaved ? "saved" : ""}`}
                      onClick={() => toggleWishlist(product.id)}
                      aria-label={isSaved ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
                    >
                      <Heart size={16} fill={isSaved ? "#d12c2c" : "none"} color={isSaved ? "#d12c2c" : "#2b332d"} />
                    </button>
                  </div>

                  <div className="featured-card-body">
                    <h3 className="featured-product-name">
                      <Link href={`/products/${product.slug}`}>{product.name}</Link>
                    </h3>
                    <div className="featured-product-price">
                      {formatInr(product.price)}
                    </div>
                    <div className="featured-stock-badge">
                      <span className="stock-dot" /> In Stock
                    </div>

                    <div className="featured-card-actions">
                      <button
                        className="featured-add-cart-btn button-full"
                        onClick={() => addToCart(product)}
                      >
                        <ShoppingCart size={15} /> Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
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

        {/* Pagination Dots */}
        <div className="featured-pagination-dots" aria-hidden="true">
          <span className="dot dot-active" />
          <span className="dot" />
          <span className="dot" />
        </div>
      </div>
    </section>

    <section className="editorial-section" id="about"><div className="editorial-image"><img src="/images/snooker-room.jpg" alt="Elegant modern snooker room" /></div><div className="editorial-copy"><span className="eyebrow">The Hyderabad Cue Sports point of view</span><h2>Built around the game. <em>Designed for excellence.</em></h2><p>We believe the best playing rooms are made of more than measurements. They are shaped by proportion, material, light and the feeling that the next frame could be the one you remember.</p><div className="editorial-points"><div><span className="point-number">01</span><div><strong>Thoughtful product selection</strong><p>Curated sample pieces with a clear sense of place.</p></div></div><div><span className="point-number">02</span><div><strong>Professional playing experience</strong><p>Designed around the ritual and rhythm of the game.</p></div></div><div><span className="point-number">03</span><div><strong>Quality-focused design</strong><p>A calm visual language for serious spaces.</p></div></div><div><span className="point-number">04</span><div><strong>Customer-centric support</strong><p>A considered hand at every stage of the journey.</p></div></div></div><Link href="/#contact" className="text-button">Meet the brand <ArrowRight size={16} /></Link></div></section>

    <section className="section accessories-section"><div className="container"><SectionHeading eyebrow="Finish the room" title="Everything you need for the game" description="A preview of the accessories that bring the playing experience together." action={<ArrowLink href="/shop?type=accessory">Explore accessories</ArrowLink>} /><div className="accessory-rail">{accessoryCategories.map((category) => <Link href="/shop?type=accessory" className="accessory-card" key={category.label}><div className="accessory-image"><img src={category.image} alt="" /></div><div className="accessory-card-copy"><strong>{category.label}</strong><span>{category.note}</span><ArrowRight size={15} /></div></Link>)}</div></div></section>

    <section className="statement-banner"><div className="statement-banner-image"><img src="/images/snooker-detail.jpg" alt="Close view of a professional snooker table" /></div><div className="statement-banner-content container"><span className="eyebrow">Make space for the game</span><h2>Create your perfect <em>snooker space.</em></h2><p>Explore premium snooker tables for homes, clubs and professional playing environments.</p><Link href="/shop" className="button button-light">Explore collection <ArrowRight size={16} /></Link></div></section>

    <section className="section testimonials-section"><div className="container"><SectionHeading eyebrow="Words from the room" title="A quiet confidence in every detail" description="Sample testimonials for demonstration only — replace with verified customer feedback before launch." /><div className="testimonials-grid"><blockquote><div className="testimonial-stars"><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /></div><p>“The proportions, the finish, the way the table settles into the room — this is the feeling we wanted.”</p><footer><span className="testimonial-avatar">AR</span><span><strong>Sample client name</strong><small>Illustrative testimonial · Delhi</small></span></footer></blockquote><blockquote><div className="testimonial-stars"><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /></div><p>“A more considered way to shop for the centrepiece of the playing room. Everything feels calm and clear.”</p><footer><span className="testimonial-avatar">MK</span><span><strong>Sample client name</strong><small>Illustrative testimonial · Mumbai</small></span></footer></blockquote><div className="testimonial-aside"><span className="eyebrow">The standard we are setting</span><strong>Make the room feel ready before the first break.</strong><ArrowLink href="/shop">Browse the range</ArrowLink></div></div></div></section>

    <section className="newsletter-section"><div className="container newsletter-inner"><div><span className="eyebrow">Stay in the frame</span><h2>Stay connected with <em>Hyderabad Cue Sports.</em></h2><p>Get updates about new collections, products and announcements.</p></div>{subscribed ? <div className="newsletter-success"><Check size={18} /><strong>You’re on the list.</strong><span>We’ll keep the next frame close.</span></div> : <form className="newsletter-form" onSubmit={submitNewsletter}><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Your email address" aria-label="Email address" required /><button type="submit" className="button button-dark">Subscribe <ArrowRight size={16} /></button><small>Demo form · no email is sent</small></form>}</div></section>
    <QuickViewModal product={quickProduct} onClose={() => setQuickProduct(null)} />
  </>;
}

function FilterGroup({ title, children, open = true }: { title: string; children: React.ReactNode; open?: boolean }) {
  return <details className="filter-group" open={open}><summary>{title}<ChevronDown size={16} /></summary><div className="filter-group-body">{children}</div></details>;
}

export function ShopPage() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") ?? "all";
  const initialSize = searchParams.get("size") ?? "all";
  const initialType = searchParams.get("type") ?? "all";
  const query = (searchParams.get("query") ?? "").toLowerCase();
  const [size, setSize] = useState(initialSize);
  const [type, setType] = useState(initialType);
  const [category, setCategory] = useState(initialCategory);
  const [availability, setAvailability] = useState("all");
  const [price, setPrice] = useState("all");
  const [sort, setSort] = useState("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [quickProduct, setQuickProduct] = useState<Product | null>(null);

  // Sync state if URL query params change (e.g. clicking top navbar links)
  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat) setCategory(cat);
    const sz = searchParams.get("size");
    if (sz) setSize(sz);
    const tp = searchParams.get("type");
    if (tp) setType(tp);
  }, [searchParams]);

  const filteredProducts = useMemo(() => {
    let result = products.filter((product) => {
      const matchesQuery = !query || `${product.name} ${product.category} ${product.size} ${product.tags.join(" ")}`.toLowerCase().includes(query);
      const matchesSize = size === "all" || product.size === size;
      const matchesType = type === "all" || product.type === type;
      const matchesCategory = category === "all" ||
        product.category.toLowerCase() === category.toLowerCase() ||
        (category.toLowerCase() === "cue equipment" && (product.category.toLowerCase() === "cues" || product.tags.includes("cue equipment")));
      const matchesAvailability = availability === "all" || product.availability === availability;
      const matchesPrice = price === "all" || (
        price === "under-5k" ? product.price < 5000 :
        price === "5k-50k" ? product.price >= 5000 && product.price <= 50000 :
        price === "50k-200k" ? product.price > 50000 && product.price <= 200000 :
        product.price > 200000
      );
      return matchesQuery && matchesSize && matchesType && matchesCategory && matchesAvailability && matchesPrice;
    });
    if (sort === "low") result = [...result].sort((a, b) => a.price - b.price);
    if (sort === "high") result = [...result].sort((a, b) => b.price - a.price);
    if (sort === "new") result = [...result].reverse();
    return result;
  }, [availability, category, price, query, size, sort, type]);

  const clearFilters = () => { setSize("all"); setType("all"); setCategory("all"); setAvailability("all"); setPrice("all"); };
  const activeFilterCount = [size !== "all", type !== "all", category !== "all", availability !== "all", price !== "all"].filter(Boolean).length;

  return <>
    <section className="shop-hero"><div className="container shop-hero-inner"><div><span className="eyebrow">The collection · Official catalogue</span><h1>Explore our <em>cue sports collection.</em></h1><p>Premium snooker tables, cue equipment, table accessories, and scoreboards crafted for players across India.</p></div><div className="shop-hero-stat"><span>01 — 16</span><strong>Official<br />catalog range</strong></div></div></section>
    <section className="shop-section section"><div className="container"><div className="shop-toolbar"><div><span className="result-count">Showing {filteredProducts.length} of {products.length} products</span>{query && <span className="query-chip">Search: {query}<X size={12} /></span>}</div><div className="toolbar-actions"><button className="filter-toggle" onClick={() => setFiltersOpen((open) => !open)}><Filter size={16} /> Filters {activeFilterCount > 0 && <span>{activeFilterCount}</span>}</button><label className="sort-control"><span>Sort by</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">Featured</option><option value="low">Price: Low to High</option><option value="high">Price: High to Low</option><option value="new">Newest Arrivals</option></select><ChevronDown size={15} /></label></div></div><div className={`shop-layout ${filtersOpen ? "mobile-filters-open" : ""}`}><aside className="filter-sidebar"><div className="filter-sidebar-header"><div><span className="eyebrow">Refine</span><h3>Filter collection</h3></div><button className="clear-filters" onClick={clearFilters}>Clear all</button></div><FilterGroup title="Product category"><label className="radio-label"><input type="radio" name="category" checked={category === "all"} onChange={() => setCategory("all")} />All products<span /></label><label className="radio-label"><input type="radio" name="category" checked={category.toLowerCase() === "snooker tables"} onChange={() => setCategory("Snooker Tables")} />Snooker tables<span /></label><label className="radio-label"><input type="radio" name="category" checked={category.toLowerCase() === "cues" || category.toLowerCase() === "cue equipment"} onChange={() => setCategory("Cues")} />Cue equipment<span /></label><label className="radio-label"><input type="radio" name="category" checked={category.toLowerCase() === "table accessories"} onChange={() => setCategory("Table Accessories")} />Table accessories<span /></label><label className="radio-label"><input type="radio" name="category" checked={category.toLowerCase() === "scoreboards"} onChange={() => setCategory("Scoreboards")} />Scoreboards<span /></label><label className="radio-label"><input type="radio" name="category" checked={category.toLowerCase() === "hoodies"} onChange={() => setCategory("Hoodies")} />Hoodies<span /></label><label className="radio-label"><input type="radio" name="category" checked={category.toLowerCase() === "t-shirts"} onChange={() => setCategory("T-Shirts")} />T-Shirts<span /></label><label className="radio-label"><input type="radio" name="category" checked={category.toLowerCase() === "cue cases"} onChange={() => setCategory("Cue Cases")} />Cue cases<span /></label></FilterGroup><FilterGroup title="Table size"><label className="check-label"><input type="checkbox" checked={size === "8 FT"} onChange={() => setSize(size === "8 FT" ? "all" : "8 FT")} /><span className="custom-check"><Check size={12} /></span>8 FT</label><label className="check-label"><input type="checkbox" checked={size === "10 FT"} onChange={() => setSize(size === "10 FT" ? "all" : "10 FT")} /><span className="custom-check"><Check size={12} /></span>10 FT</label><label className="check-label"><input type="checkbox" checked={size === "12 FT"} onChange={() => setSize(size === "12 FT" ? "all" : "12 FT")} /><span className="custom-check"><Check size={12} /></span>12 FT</label></FilterGroup><FilterGroup title="Price range"><label className="radio-label"><input type="radio" name="price" checked={price === "all"} onChange={() => setPrice("all")} />All prices<span /></label><label className="radio-label"><input type="radio" name="price" checked={price === "under-5k"} onChange={() => setPrice("under-5k")} />Under ₹5,000<span /></label><label className="radio-label"><input type="radio" name="price" checked={price === "5k-50k"} onChange={() => setPrice("5k-50k")} />₹5,000 — ₹50,000<span /></label><label className="radio-label"><input type="radio" name="price" checked={price === "50k-200k"} onChange={() => setPrice("50k-200k")} />₹50,000 — ₹2,00,000<span /></label><label className="radio-label"><input type="radio" name="price" checked={price === "over-200k"} onChange={() => setPrice("over-200k")} />Over ₹2,00,000<span /></label></FilterGroup><FilterGroup title="Availability"><label className="radio-label"><input type="radio" name="availability" checked={availability === "all"} onChange={() => setAvailability("all")} />All availability<span /></label><label className="radio-label"><input type="radio" name="availability" checked={availability === "In stock"} onChange={() => setAvailability("In stock")} />In stock<span /></label><label className="radio-label"><input type="radio" name="availability" checked={availability === "Made to order"} onChange={() => setAvailability("Made to order")} />Made to order<span /></label><label className="radio-label"><input type="radio" name="availability" checked={availability === "Low stock"} onChange={() => setAvailability("Low stock")} />Low stock<span /></label></FilterGroup></aside><div className="shop-results">{filteredProducts.length > 0 ? <div className="product-grid shop-product-grid">{filteredProducts.map((product) => <ProductCard key={product.id} product={product} onQuickView={setQuickProduct} />)}</div> : <div className="empty-state"><div className="empty-state-mark"><Search size={24} /></div><span className="eyebrow">No matching pieces</span><h2>Nothing in this frame.</h2><p>Try a different size, category or price range to see more of our collection.</p><button className="button button-dark" onClick={clearFilters}>Clear filters <ArrowRight size={16} /></button></div>}</div></div></div></section>
    <section className="shop-note"><div className="container shop-note-inner"><Sparkles size={18} /><p><strong>Every product, price and specification on this page is illustrative demo content.</strong> The catalogue is designed to be edited when final business information is available.</p></div></section>
    <QuickViewModal product={quickProduct} onClose={() => setQuickProduct(null)} />
  </>;
}

export function ProductPage({ slug }: { slug: string }) {
  const product = getProduct(slug);
  const { addToCart } = useStorefront();
  const [selectedImage, setSelectedImage] = useState(product?.image ?? "");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("details");
  if (!product) return <section className="not-found section"><div className="container"><span className="eyebrow">404 · Product not found</span><h1>This frame is still being set.</h1><p>The product you are looking for is not part of the demo catalogue.</p><Link href="/shop" className="button button-dark">Back to collection <ArrowRight size={16} /></Link></div></section>;
  const gallery = product.gallery?.length ? product.gallery : [product.image, "/images/snooker-room.jpg", "/images/snooker-detail.jpg"];
  const related = products.filter((item) => item.id !== product.id && item.type === product.type).slice(0, 3);
  return <>
    <div className="product-breadcrumb container"><Link href="/">Home</Link><ArrowRight size={13} /><Link href="/shop">Collection</Link><ArrowRight size={13} /><span>{product.name}</span></div>
    <section className="product-detail-section"><div className="container product-detail-layout"><div className="product-gallery"><div className="product-gallery-main"><img src={selectedImage} alt={product.name} /><span className="gallery-demo-label">Demo imagery</span></div><div className="product-thumbnails">{gallery.map((image, index) => <button key={`${image}-${index}`} className={selectedImage === image ? "active" : ""} onClick={() => setSelectedImage(image)}><img src={image} alt={`${product.name} view ${index + 1}`} /></button>)}</div></div><div className="product-detail-copy"><div className="detail-topline"><span className="eyebrow">{product.category} · {product.size}</span><button className="icon-button detail-heart" aria-label="Save product"><Heart size={19} /></button></div><h1>{product.name}</h1><div className="detail-rating"><span className="testimonial-stars"><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /></span><span>Sample rating display · demo only</span></div><div className="detail-price-row"><strong>{formatInr(product.price)}</strong>{product.compareAt && <del>{formatInr(product.compareAt)}</del>}<span className="detail-demo">Demo price</span></div><p className="detail-description">{product.description}</p><div className="detail-select"><label htmlFor="size">Playing size</label><div className="select-wrap"><select id="size" defaultValue={product.size}><option>{product.size}</option><option>10 FT · sample option</option><option>12 FT · sample option</option></select><ChevronDown size={16} /></div><small>Size options are illustrative and can be connected to the final catalogue.</small></div><div className="detail-purchase-row"><div className="quantity-control quantity-control-large"><button onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease quantity"><Minus size={15} /></button><span>{quantity}</span><button onClick={() => setQuantity(quantity + 1)} aria-label="Increase quantity"><Plus size={15} /></button></div><button className="button button-dark button-grow" onClick={() => addToCart(product, quantity)}>Add to bag <ShoppingBag size={17} /></button></div><div className="detail-service-grid"><div><ShieldCheck size={17} /><span><strong>{product.availability}</strong><small>Sample availability</small></span></div><div><Truck size={17} /><span><strong>India-wide service</strong><small>Delivery details to confirm</small></span></div><div><Ruler size={17} /><span><strong>Room planning</strong><small>Ask about sample guidance</small></span></div></div></div></div></section>
    <section className="product-info-section"><div className="container"><div className="product-tabs"><button className={activeTab === "details" ? "active" : ""} onClick={() => setActiveTab("details")}>Product details</button><button className={activeTab === "specs" ? "active" : ""} onClick={() => setActiveTab("specs")}>Specifications</button><button className={activeTab === "delivery" ? "active" : ""} onClick={() => setActiveTab("delivery")}>Delivery &amp; support</button></div><div className="product-info-panel">{activeTab === "details" && <div className="info-columns"><div><span className="eyebrow">A considered centrepiece</span><h2>Made for the room around the game.</h2></div><div><p>{product.description}</p><ul>{product.details.map((detail) => <li key={detail}><Check size={15} />{detail}</li>)}</ul></div></div>}{activeTab === "specs" && <div className="spec-table">{product.specs.map((spec) => <div key={spec.label}><span>{spec.label}</span><strong>{spec.value}</strong></div>)}</div>}{activeTab === "delivery" && <div className="info-columns"><div><span className="eyebrow">Service promise</span><h2>Details to be shaped with you.</h2></div><div><p>Shipping, installation, return and support details shown here are placeholders for the client demonstration and should be replaced with the final business policy.</p><ul><li><Check size={15} />Sample support pathway</li><li><Check size={15} />Sample delivery planning</li><li><Check size={15} />Final policy copy to be added</li></ul></div></div>}</div></div></section>
    <section className="section related-section"><div className="container"><SectionHeading eyebrow="Continue exploring" title="You may also like" description="Related pieces from the illustrative collection." /><div className="product-grid">{related.map((item) => <ProductCard key={item.id} product={item} onQuickView={() => undefined} />)}</div></div></section>
  </>;
}
