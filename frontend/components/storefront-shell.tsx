"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Heart,
  Instagram,
  Mail,
  Menu,
  Minus,
  Plus,
  RectangleHorizontal,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Target,
  Trophy,
  Truck,
  UserRound,
  X,
  Zap,
} from "lucide-react";
import { formatInr, Product, products } from "@/lib/products";

type CartItem = Product & { quantity: number };
type StorefrontContextValue = {
  cart: CartItem[];
  wishlist: string[];
  cartOpen: boolean;
  notice: string;
  addToCart: (product: Product, quantity?: number, openSidebar?: boolean) => void;
  updateQuantity: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
  toggleWishlist: (id: string) => void;
  openCart: () => void;
  closeCart: () => void;
  showNotice: (message: string) => void;
};

const StorefrontContext = createContext<StorefrontContextValue | null>(null);

export function useStorefront() {
  const context = useContext(StorefrontContext);
  if (!context) throw new Error("useStorefront must be used inside StorefrontProvider");
  return context;
}

export function StorefrontProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const savedCart = window.localStorage.getItem("snookerboards-cart");
    const savedWishlist = window.localStorage.getItem("snookerboards-wishlist");
    if (savedCart) setCart(JSON.parse(savedCart));
    if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
  }, []);

  useEffect(() => {
    window.localStorage.setItem("snookerboards-cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    window.localStorage.setItem("snookerboards-wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 3200);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const value = useMemo<StorefrontContextValue>(() => ({
    cart,
    wishlist,
    cartOpen,
    notice,
    addToCart: (product, quantity = 1, openSidebar = true) => {
      setCart((current) => {
        const existing = current.find((item) => item.id === product.id);
        if (existing) return current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
        return [...current, { ...product, quantity }];
      });
      if (openSidebar) {
        setCartOpen(true);
      }
      setNotice(`${product.name} added to your bag`);
    },
    updateQuantity: (id, delta) => setCart((current) => current.map((item) => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item)),
    removeFromCart: (id) => setCart((current) => current.filter((item) => item.id !== id)),
    toggleWishlist: (id) => setWishlist((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]),
    openCart: () => setCartOpen(true),
    closeCart: () => setCartOpen(false),
    showNotice: (message) => setNotice(message),
  }), [cart, wishlist, cartOpen, notice]);

  return <StorefrontContext.Provider value={value}>{children}</StorefrontContext.Provider>;
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { cart, openCart, wishlist, showNotice } = useStorefront();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileExpandedCat, setMobileExpandedCat] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const navigationCategories = [
    {
      id: "snooker-tables",
      label: "Snooker Tables",
      iconUrl: "/icons/navbar-icons/billiards.png",
      href: "/shop?category=Snooker+Tables",
      image: "/images/categories/snooker-tables.jpg",
      imageTitle: "12ft Tables | Riley England | Dubai",
      items: [
        { label: "All Snooker Tables", href: "/shop?category=Snooker+Tables" },
        { label: "8 FT Snooker Tables", href: "/shop?category=Snooker+Tables&size=8+FT" },
        { label: "10 FT Snooker Tables", href: "/shop?category=Snooker+Tables&size=10+FT" },
        { label: "12 FT Snooker Tables", href: "/shop?category=Snooker+Tables&size=12+FT" },
        { label: "Tournament Tables", href: "/shop?category=Snooker+Tables&query=tournament" },
      ],
    },
    {
      id: "cue-equipment",
      label: "Cue Equipment",
      iconUrl: "/icons/navbar-icons/pool-cue.png",
      href: "/shop?category=Cues",
      image: "/images/categories/cue-equipment.jpg",
      imageTitle: "Maple Emperor Professional Snooker Cue Set - Baize Master – Cue + Case",
      items: [
        { label: "All Cue Equipment", href: "/shop?category=Cues" },
        { label: "Snooker Cue Sticks", href: "/shop?category=Cues&query=sticks" },
        { label: "Cue Tips", href: "/shop?category=Cues&query=tips" },
        { label: "Cue Chalk", href: "/shop?category=Cues&query=chalk" },
        { label: "Cue Extenders", href: "/shop?category=Cues&query=extender" },
      ],
    },
    {
      id: "table-accessories",
      label: "Table Accessories",
      iconUrl: "/icons/navbar-icons/snooker.png",
      href: "/shop?category=Table+Accessories",
      image: "/images/categories/table-accessories.jpg",
      imageTitle: "Star Champion Tournament Snooker Table - 12 Feet",
      items: [
        { label: "All Table Accessories", href: "/shop?category=Table+Accessories" },
        { label: "Snooker Table Cloth", href: "/shop?category=Table+Accessories&query=cloth" },
        { label: "Snooker Balls", href: "/shop?category=Table+Accessories&query=balls" },
        { label: "Table Lights", href: "/shop?category=Table+Accessories&query=lights" },
        { label: "Table Slates", href: "/shop?category=Table+Accessories&query=slates" },
        { label: "Table Pockets", href: "/shop?category=Table+Accessories&query=pockets" },
      ],
    },
    {
      id: "scoreboards",
      label: "Scoreboards",
      iconUrl: "/icons/navbar-icons/scoreboard.png",
      href: "/shop?category=Scoreboards",
      image: "/images/categories/scoreboards.jpg",
      imageTitle: "Edwardian Mahogany Riley Snooker/Billiards Scoreboard",
      items: [
        { label: "All Scoreboards", href: "/shop?category=Scoreboards" },
        { label: "Manual Points Boards", href: "/shop?category=Scoreboards&query=manual" },
        { label: "Electronic Scoreboards", href: "/shop?category=Scoreboards&query=electronic" },
      ],
    },
  ];

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (search.trim()) {
      router.push(`/shop?query=${encodeURIComponent(search.trim())}`);
    } else {
      router.push("/shop");
    }
  };

  return (
    <>
      {/* 1. Top Announcement Bar */}
      <div className="announcement-bar">
        <div className="announcement-inner">
          <span>HYDERABAD CUE SPORTS</span>
          <span className="announcement-dot">•</span>
          <span>PREMIUM EQUIPMENT &amp; CLUB APPAREL</span>
          <span className="announcement-dot">•</span>
          <span>SERVING CUSTOMERS ACROSS INDIA</span>
        </div>
      </div>

      {/* 2. Middle Row: Main Header */}
      <header className="site-header-main">
        <div className="site-header-container">
          <button
            className="mobile-menu-toggle"
            aria-label="Open navigation menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={22} />
          </button>

          {/* Logo */}
          <Link href="/" className="hcs-brand-logo" aria-label="Hyderabad Cue Sports Home">
            <span className="hcs-badge">HCS</span>
            <div className="hcs-brand-text">
              <span className="hcs-title">HYDERABAD</span>
              <span className="hcs-subtitle">CUE SPORTS</span>
            </div>
          </Link>

          {/* Central Search Bar */}
          <form className="hcs-search-form" onSubmit={submitSearch}>
            <div className="hcs-search-input-wrap">
              <Search size={18} className="hcs-search-icon" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search snooker tables, cues, accessories, scoreboards..."
                aria-label="Search catalog"
              />
            </div>
            <button type="submit" className="hcs-search-btn">
              Search
            </button>
          </form>

          {/* Right Action Icons with Text */}
          <div className="hcs-header-actions">
            <button
              type="button"
              className="hcs-action-item"
              aria-label={`Wishlist (${wishlist.length} saved)`}
              onClick={() => {
                if (wishlist.length === 0) {
                  showNotice("You have not saved any items yet.");
                } else {
                  router.push("/shop");
                }
              }}
            >
              <div className="hcs-action-icon-box">
                <Heart size={21} />
                {wishlist.length > 0 && <span className="hcs-action-badge">{wishlist.length}</span>}
              </div>
              <span className="hcs-action-label">Wishlist</span>
            </button>

            <button
              type="button"
              className="hcs-action-item"
              aria-label="Account"
              onClick={() => showNotice("Customer portal sign-in available soon.")}
            >
              <div className="hcs-action-icon-box">
                <UserRound size={21} />
              </div>
              <span className="hcs-action-label">Account</span>
            </button>

            <button
              type="button"
              className="hcs-action-item"
              aria-label={`Shopping Bag with ${cartCount} items`}
              onClick={openCart}
            >
              <div className="hcs-action-icon-box">
                <ShoppingBag size={21} />
                {cartCount > 0 && <span className="hcs-action-badge">{cartCount}</span>}
              </div>
              <span className="hcs-action-label">Bag</span>
            </button>
          </div>
        </div>
      </header>

      {/* 3. Bottom Category Navigation Bar with Dropdowns */}
      <nav className="category-nav-bar" aria-label="Category navigation">
        <div className="category-nav-container">
          <div className="category-nav-links">
            {navigationCategories.map((cat) => (
              <div
                key={cat.id}
                className="category-nav-dropdown-item"
                onMouseEnter={() => setActiveDropdown(cat.id)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link
                  href={cat.href}
                  className={`category-nav-link ${pathname.includes(cat.href) || activeDropdown === cat.id ? "active" : ""}`}
                >
                  <div className="cat-nav-content">
                    <div className="cat-nav-icon-wrapper">
                      <img
                        src={cat.iconUrl}
                        alt={cat.label}
                        className="cat-nav-flipkart-icon"
                        width={30}
                        height={30}
                      />
                    </div>
                    <div className="cat-nav-label-row">
                      <span className="cat-nav-text">{cat.label}</span>
                      <ChevronDown size={11} className={`cat-chevron ${activeDropdown === cat.id ? "rotated" : ""}`} />
                    </div>
                  </div>
                </Link>

                {activeDropdown === cat.id && (
                  <div className="cat-mega-dropdown">
                    <div className="cat-mega-dropdown-inner">
                      <div className="cat-mega-links-column">
                        <span className="cat-mega-header">{cat.label}</span>
                        <div className="cat-mega-items">
                          {cat.items.map((item) => (
                            <Link
                              key={item.label}
                              href={item.href}
                              className="cat-sublink"
                              onClick={() => setActiveDropdown(null)}
                            >
                              <span>{item.label}</span>
                              <ArrowRight size={13} className="cat-sublink-arrow" />
                            </Link>
                          ))}
                        </div>
                      </div>

                      <div className="cat-mega-preview-card">
                        <div className="cat-preview-image">
                          <img src={cat.image} alt={cat.imageTitle} />
                          <div className="cat-preview-overlay" />
                        </div>
                        <div className="cat-preview-info">
                          <span className="cat-preview-badge">Featured Range</span>
                          <strong>{cat.imageTitle}</strong>
                          <Link
                            href={cat.href}
                            className="cat-preview-link"
                            onClick={() => setActiveDropdown(null)}
                          >
                            Explore Collection <ArrowRight size={12} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="mobile-nav-overlay" onClick={() => setMobileOpen(false)}>
          <aside className="mobile-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="mobile-drawer-top">
              <div className="hcs-brand-logo small">
                <span className="hcs-badge">HCS</span>
                <div className="hcs-brand-text">
                  <span className="hcs-title">HYDERABAD</span>
                  <span className="hcs-subtitle">CUE SPORTS</span>
                </div>
              </div>
              <button className="icon-button" aria-label="Close menu" onClick={() => setMobileOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {/* Mobile Search */}
            <form className="mobile-search-form" onSubmit={(e) => { submitSearch(e); setMobileOpen(false); }}>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tables, cues, scoreboards..."
              />
              <button type="submit" aria-label="Submit search"><Search size={16} /></button>
            </form>

            <div className="mobile-section-heading">Categories</div>
            <div className="mobile-category-accordion">
              {navigationCategories.map((cat) => {
                const isExpanded = mobileExpandedCat === cat.id;
                return (
                  <div key={cat.id} className="mobile-acc-item">
                    <button
                      type="button"
                      className="mobile-acc-trigger"
                      onClick={() => setMobileExpandedCat(isExpanded ? null : cat.id)}
                    >
                      <span className="mobile-acc-label-wrap">
                        <img src={cat.iconUrl} alt="" className="mobile-acc-icon" width={18} height={18} />
                        <span>{cat.label}</span>
                      </span>
                      <ChevronDown size={15} className={`acc-arrow ${isExpanded ? "rotated" : ""}`} />
                    </button>
                    {isExpanded && (
                      <div className="mobile-acc-body">
                        {cat.items.map((sub) => (
                          <Link
                            key={sub.label}
                            href={sub.href}
                            onClick={() => setMobileOpen(false)}
                            className="mobile-acc-sublink"
                          >
                            <span>{sub.label}</span>
                            <ArrowRight size={13} />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mobile-section-heading">Quick Links</div>
            <div className="mobile-quick-links">
              <Link href="/" onClick={() => setMobileOpen(false)}>Home</Link>
              <Link href="/shop" onClick={() => setMobileOpen(false)}>All Products</Link>
            </div>

            <div className="mobile-drawer-footer">
              <a
                href="https://wa.me/919999999999?text=Hi%2C%20I%20have%20an%20enquiry%20regarding%20Hyderabad%20Cue%20Sports"
                target="_blank"
                rel="noopener noreferrer"
                className="mobile-whatsapp-cta"
              >
                <span>WhatsApp Support</span>
              </a>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

export function FloatingWhatsApp() {
  return (
    <a
      href="https://wa.me/919999999999?text=Hi%2C%20I%20have%20an%20enquiry%20regarding%20Hyderabad%20Cue%20Sports"
      target="_blank"
      rel="noopener noreferrer"
      className="floating-whatsapp-btn"
      aria-label="Chat with Hyderabad Cue Sports on WhatsApp"
    >
      <div className="whatsapp-icon-circle">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <path d="M12.031 2C6.495 2 2 6.495 2 12.031c0 1.986.58 3.84 1.584 5.405L2.054 22l4.733-1.498A10.016 10.016 0 0 0 12.03 22c5.536 0 10.031-4.495 10.031-10.031C22.062 6.495 17.567 2 12.031 2zm0 18.297c-1.636 0-3.17-.46-4.48-1.258l-.321-.193-2.8 0.887.896-2.735-.21-.334A8.257 8.257 0 0 1 3.766 12.03c0-4.557 3.708-8.266 8.265-8.266 4.558 0 8.266 3.709 8.266 8.266 0 4.558-3.708 8.266-8.266 8.266zm4.53-6.177c-.248-.124-1.468-.724-1.696-.807-.228-.083-.393-.124-.559.124-.165.248-.642.807-.787.973-.145.165-.29.186-.538.062-.248-.124-1.047-.386-1.995-1.231-.738-.658-1.236-1.472-1.381-1.72-.145-.248-.015-.382.109-.505.112-.111.248-.29.372-.435.124-.145.166-.248.248-.414.083-.166.042-.311-.02-.435-.063-.124-.559-1.347-.766-1.845-.202-.484-.407-.418-.559-.426l-.477-.008c-.165 0-.435.062-.663.311-.228.248-.87 0.85-.87 2.073 0 1.223.89 2.405 1.014 2.571.125.166 1.752 2.675 4.245 3.751.593.256 1.056.409 1.417.524.595.19 1.137.163 1.565.099.477-.072 1.468-.6 1.675-1.18.207-.58.207-1.077.145-1.18-.062-.104-.228-.166-.476-.29z" />
        </svg>
      </div>
      <span className="whatsapp-floating-label">WhatsApp Us</span>
    </a>
  );
}

export function CartDrawer() {
  const { cart, cartOpen, closeCart, updateQuantity, removeFromCart, showNotice } = useStorefront();
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return cartOpen ? <div className="cart-overlay" onClick={closeCart}><aside className="cart-drawer" onClick={(event) => event.stopPropagation()}><div className="cart-drawer-header"><div><span className="eyebrow">Your selection</span><h2>Shopping bag <span>{cart.length}</span></h2></div><button className="icon-button" onClick={closeCart} aria-label="Close shopping bag"><X size={21} /></button></div>{cart.length === 0 ? <div className="cart-empty"><div className="empty-mark"><ShoppingBag size={22} /></div><h3>Your bag is waiting</h3><p>Explore the collection and add something made for the room.</p><Link href="/shop" className="button button-dark" onClick={closeCart}>Shop tables <ArrowRight size={16} /></Link></div> : <><div className="cart-items">{cart.map((item) => <div className="cart-item" key={item.id}><img src={item.image} alt="" /><div className="cart-item-info"><div className="cart-item-row"><div><span className="product-kicker">{item.size} · {item.category}</span><h4>{item.name}</h4></div><button className="remove-button" onClick={() => removeFromCart(item.id)} aria-label={`Remove ${item.name}`}><X size={15} /></button></div><div className="cart-item-bottom"><div className="quantity-control"><button onClick={() => updateQuantity(item.id, -1)} aria-label="Decrease quantity"><Minus size={13} /></button><span>{item.quantity}</span><button onClick={() => updateQuantity(item.id, 1)} aria-label="Increase quantity"><Plus size={13} /></button></div><strong>{formatInr(item.price * item.quantity)}</strong></div></div></div>)}</div><div className="cart-summary"><div className="cart-summary-line"><span>Subtotal</span><strong>{formatInr(subtotal)}</strong></div><p>Demo pricing shown in INR. Delivery, installation and taxes are confirmed at the final catalogue stage.</p><button className="button button-dark button-full" onClick={() => showNotice("Checkout is a demo pathway — connect your preferred commerce backend here.")}>Continue to checkout <ArrowRight size={16} /></button><div className="cart-trust"><ShieldCheck size={16} /><span>Secure demo shopping experience</span></div></div></>}</aside></div> : null;
}

export function ToastNotice() {
  const { notice } = useStorefront();
  return notice ? <div className="toast-notice" role="status"><Zap size={16} />{notice}</div> : null;
}

export function BackToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 520);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return visible ? <button className="back-to-top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Back to top"><ChevronRight size={17} /></button> : null;
}

export function SiteFooter() {
  const { showNotice } = useStorefront();
  return <footer className="site-footer" id="contact"><div className="footer-main container"><div className="footer-brand"><Link href="/" className="wordmark wordmark-light"><span className="wordmark-mark">HCS</span><span><strong>HYDERABAD</strong><em>CUE SPORTS</em></span></Link><p>A considered home for premium snooker tables and the objects that make the game feel like yours.</p><div className="footer-socials"><button aria-label="Instagram"><Instagram size={17} /></button><button aria-label="Email" onClick={() => showNotice("Sample email support: support@example.com")}><Mail size={17} /></button></div></div><div className="footer-column"><h4>Shop</h4><Link href="/shop">All Snooker Tables</Link><Link href="/shop?size=8+FT">8 FT Tables</Link><Link href="/shop?size=10+FT">10 FT Tables</Link><Link href="/shop?size=12+FT">12 FT Tables</Link><Link href="/shop?type=accessory">Accessories</Link></div><div className="footer-column"><h4>Information</h4><Link href="/#about">About Us</Link><button onClick={() => showNotice("Shipping information is placeholder content for this demo.")}>Shipping Information</button><button onClick={() => showNotice("Return policy is placeholder content for this demo.")}>Return Policy</button><button onClick={() => showNotice("Privacy policy is placeholder content for this demo.")}>Privacy Policy</button><button onClick={() => showNotice("Terms are placeholder content for this demo.")}>Terms &amp; Conditions</button></div><div className="footer-column"><h4>Customer Support</h4><button onClick={() => showNotice("Sample WhatsApp support: +91 00000 00000")}>WhatsApp Support</button><button onClick={() => showNotice("Sample email support: support@example.com")}>Email Support</button><button onClick={() => showNotice("FAQ content will be added with the final catalogue.")}>Frequently Asked Questions</button><div className="footer-contact-card"><Truck size={17} /><span>Serving customers across India<br /><small>Direct shipping &amp; professional installation available</small></span></div></div></div><div className="footer-bottom container"><span>© 2026 HYDERABAD CUE SPORTS. Demo brand experience.</span><span className="payment-icons"><span>UPI</span><span>VISA</span><span>•••</span></span><button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Back to top <ChevronRight size={14} /></button></div></footer>;
}

export function ProductCard({ product, onQuickView }: { product: Product; onQuickView: (product: Product) => void }) {
  const { wishlist, toggleWishlist, addToCart } = useStorefront();
  const isSaved = wishlist.includes(product.id);
  return <article className="product-card"><div className="product-image-wrap"><Link href={`/products/${product.slug}`} className="product-image-link"><img src={product.image} alt={product.name} /><span className="image-wash" /></Link>{product.badge && <span className="product-badge">{product.badge}</span>}<button className={`wishlist-button ${isSaved ? "saved" : ""}`} onClick={() => toggleWishlist(product.id)} aria-label={isSaved ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}><Heart size={18} fill={isSaved ? "currentColor" : "none"} /></button><button className="quick-view-button" onClick={() => onQuickView(product)}>Quick view <ArrowRight size={14} /></button></div><div className="product-card-body"><Link href={`/products/${product.slug}`}><span className="product-kicker">{product.size} · {product.category}</span><h3>{product.name}</h3></Link><div className="product-card-meta"><div><strong>{formatInr(product.price)}</strong>{product.compareAt && <del>{formatInr(product.compareAt)}</del>}</div><span className={`availability ${product.availability.toLowerCase().replaceAll(" ", "-")}`}>{product.availability}</span></div><button className="text-button" onClick={() => addToCart(product)}>Add to bag <ArrowRight size={15} /></button></div></article>;
}

export function QuickViewModal({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const { addToCart } = useStorefront();
  if (!product) return null;
  return <div className="modal-overlay" onClick={onClose}><div className="quick-view-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close icon-button" onClick={onClose} aria-label="Close quick view"><X size={20} /></button><div className="quick-view-image"><img src={product.image} alt={product.name} /></div><div className="quick-view-content"><span className="eyebrow">Quick view · Demo product</span><h2>{product.name}</h2><p className="quick-view-price">{formatInr(product.price)}</p><p>{product.description}</p><div className="quick-view-facts"><span><ShieldCheck size={16} />{product.availability}</span><span><Sparkles size={16} />{product.size} playing size</span></div><div className="quick-view-actions"><button className="button button-dark" onClick={() => { addToCart(product); onClose(); }}>Add to bag <ShoppingBag size={16} /></button><Link className="button button-ghost" href={`/products/${product.slug}`} onClick={onClose}>View details <ArrowRight size={16} /></Link></div></div></div></div>;
}

export function SectionHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: React.ReactNode }) {
  return <div className="section-heading"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2>{description && <p>{description}</p>}</div>{action}</div>;
}

export function ArrowLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="arrow-link">{children}<ArrowRight size={16} /></Link>;
}

export function SliderArrows({ onPrev, onNext }: { onPrev?: () => void; onNext?: () => void }) {
  return <div className="slider-arrows"><button className="icon-button" onClick={onPrev} aria-label="Previous"><ChevronLeft size={18} /></button><button className="icon-button" onClick={onNext} aria-label="Next"><ChevronRight size={18} /></button></div>;
}

export const catalogProducts = products;
