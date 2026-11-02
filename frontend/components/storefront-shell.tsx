"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Heart,
  Instagram,
  Mail,
  Menu,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
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
  addToCart: (product: Product, quantity?: number) => void;
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
    addToCart: (product, quantity = 1) => {
      setCart((current) => {
        const existing = current.find((item) => item.id === product.id);
        if (existing) return current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
        return [...current, { ...product, quantity }];
      });
      setCartOpen(true);
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
  const { cart, openCart, wishlist } = useStorefront();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const navItems = [
    { label: "Home", href: "/" },
    { label: "Snooker Tables", href: "/shop" },
    { label: "Accessories", href: "/shop?type=accessory" },
    { label: "About Us", href: "/#about" },
    { label: "Contact", href: "/#contact" },
  ];

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    router.push(search.trim() ? `/shop?query=${encodeURIComponent(search.trim())}` : "/shop");
    setSearchOpen(false);
  };

  return (
    <>
      <div className="announcement-bar">
        <div className="announcement-inner">
          <span>Premium Snooker Tables</span><span className="announcement-dot">•</span><span>Crafted for Precision</span><span className="announcement-dot">•</span><span>Serving Customers Across India</span>
        </div>
      </div>
      <header className="site-header">
        <div className="site-header-inner">
          <button className="icon-button mobile-menu-button" aria-label="Open menu" onClick={() => setMobileOpen(true)}><Menu size={21} /></button>
          <Link href="/" className="wordmark" aria-label="Hyderabad Cue Sports home">
            <span className="wordmark-mark">HCS</span>
            <span><strong>HYDERABAD</strong><em>CUE SPORTS</em></span>
          </Link>
          <nav className="desktop-nav" aria-label="Primary navigation">
            {navItems.map((item) => <Link key={item.label} href={item.href} className={pathname === item.href ? "active" : ""}>{item.label}</Link>)}
          </nav>
          <div className="header-actions">
            <button className="icon-button" aria-label="Search" onClick={() => setSearchOpen((open) => !open)}><Search size={20} /></button>
            <button className="icon-button account-button" aria-label="Account"><UserRound size={20} /></button>
            <button className="icon-button bag-button" aria-label={`Shopping bag with ${cartCount} items`} onClick={openCart}>
              <ShoppingBag size={20} />
              {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
            </button>
          </div>
        </div>
        {searchOpen && <div className="search-panel"><form onSubmit={submitSearch}><Search size={19} /><input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tables, cues, accessories..." /><button type="button" onClick={() => setSearchOpen(false)} aria-label="Close search"><X size={19} /></button></form></div>}
      </header>
      {mobileOpen && <div className="mobile-nav-overlay" onClick={() => setMobileOpen(false)}><aside className="mobile-drawer" onClick={(event) => event.stopPropagation()}><div className="mobile-drawer-top"><span className="eyebrow">Navigate</span><button className="icon-button" aria-label="Close menu" onClick={() => setMobileOpen(false)}><X size={20} /></button></div><div className="mobile-nav-links">{navItems.map((item) => <Link key={item.label} href={item.href} onClick={() => setMobileOpen(false)}>{item.label}<ArrowRight size={17} /></Link>)}</div><div className="mobile-nav-note"><Sparkles size={16} /><span>Demo catalogue · edit before launch</span></div><div className="mobile-nav-footer"><span>Wishlist</span><span>{wishlist.length} saved</span></div></aside></div>}
    </>
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
  return <footer className="site-footer" id="contact"><div className="footer-main container"><div className="footer-brand"><Link href="/" className="wordmark wordmark-light"><span className="wordmark-mark">HCS</span><span><strong>HYDERABAD</strong><em>CUE SPORTS</em></span></Link><p>A considered home for premium snooker tables and the objects that make the game feel like yours.</p><div className="footer-socials"><button aria-label="Instagram"><Instagram size={17} /></button><button aria-label="Email" onClick={() => showNotice("Sample email support: support@example.com")}><Mail size={17} /></button></div></div><div className="footer-column"><h4>Shop</h4><Link href="/shop">All Snooker Tables</Link><Link href="/shop?size=8+FT">8 FT Tables</Link><Link href="/shop?size=10+FT">10 FT Tables</Link><Link href="/shop?size=12+FT">12 FT Tables</Link><Link href="/shop?type=accessory">Accessories</Link></div><div className="footer-column"><h4>Information</h4><Link href="/#about">About Us</Link><button onClick={() => showNotice("Shipping information is placeholder content for this demo.")}>Shipping Information</button><button onClick={() => showNotice("Return policy is placeholder content for this demo.")}>Return Policy</button><button onClick={() => showNotice("Privacy policy is placeholder content for this demo.")}>Privacy Policy</button><button onClick={() => showNotice("Terms are placeholder content for this demo.")}>Terms &amp; Conditions</button></div><div className="footer-column"><h4>Customer Support</h4><button onClick={() => showNotice("Sample WhatsApp support: +91 00000 00000")}>WhatsApp Support</button><button onClick={() => showNotice("Sample email support: support@example.com")}>Email Support</button><button onClick={() => showNotice("FAQ content will be added with the final catalogue.")}>Frequently Asked Questions</button><div className="footer-contact-card"><Truck size={17} /><span>Serving customers across India<br /><small>Demo service promise · edit before launch</small></span></div></div></div><div className="footer-bottom container"><span>© 2026 HYDERABAD CUE SPORTS. Demo brand experience.</span><span className="payment-icons"><span>UPI</span><span>VISA</span><span>•••</span></span><button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Back to top <ChevronRight size={14} /></button></div></footer>;
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
