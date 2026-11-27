"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, Suspense, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Heart,
  Instagram,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  Menu,
  Minus,
  Plus,
  RectangleHorizontal,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Target,
  Trophy,
  Truck,
  UserRound,
  X,
  Zap,
} from "lucide-react";
import { formatInr, Product, products } from "@/lib/products";
import { apiFetch, type AuthUser } from "@/lib/api";
import { buildProductUrl, buildShopUrl, buildLoginUrl } from "@/lib/url";
import { toast } from "sonner";

type CartItem = Product & { quantity: number };
type StorefrontContextValue = {
  cart: CartItem[];
  wishlist: string[];
  cartOpen: boolean;
  notice: string;
  user: AuthUser | null;
  /** openSidebar=false shows a toast instead, unless notify=false (the floating cart bar is the feedback) */
  addToCart: (product: Product, quantity?: number, openSidebar?: boolean, notify?: boolean) => void;
  updateQuantity: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
  toggleWishlist: (id: string) => void;
  openCart: () => void;
  closeCart: () => void;
  setUser: (user: AuthUser | null) => void;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  showNotice: (message: string, type?: "success" | "error" | "info" | "warning") => void;
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
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const savedCart = window.localStorage.getItem("snookerboards-cart");
    const savedWishlist = window.localStorage.getItem("snookerboards-wishlist");
    if (savedCart) setCart(JSON.parse(savedCart));
    if (savedWishlist) setWishlist(JSON.parse(savedWishlist));

    // Check active 30-day session cookie on load
    apiFetch<{ authenticated: boolean; user: AuthUser | null }>("/api/auth/me")
      .then(({ ok, data }) => {
        if (ok && data.authenticated && data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {
        // Backend offline; keep guest browsing active
      });
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

  const broadcastAuth = useCallback((type: "LOGIN" | "LOGOUT", authUser: AuthUser | null) => {
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        const bc = new BroadcastChannel("hcs_auth_channel");
        bc.postMessage({ type, user: authUser });
        bc.close();
      }
      window.localStorage.setItem(
        "hcs_auth_sync",
        JSON.stringify({ type, user: authUser, ts: Date.now() })
      );
    } catch {}
  }, []);

  const handleSetUser = useCallback((nextUser: AuthUser | null) => {
    setUser(nextUser);
    broadcastAuth(nextUser ? "LOGIN" : "LOGOUT", nextUser);
  }, [broadcastAuth]);

  // Synchronize login/logout state in real-time across all open browser tabs
  useEffect(() => {
    if (typeof window === "undefined") return;

    let channel: BroadcastChannel | null = null;
    if ("BroadcastChannel" in window) {
      channel = new BroadcastChannel("hcs_auth_channel");
      channel.onmessage = (event) => {
        if (event.data?.type === "LOGIN") {
          setUser(event.data.user);
        } else if (event.data?.type === "LOGOUT") {
          setUser(null);
        }
      };
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "hcs_auth_sync" && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue);
          if (parsed.type === "LOGIN") setUser(parsed.user);
          if (parsed.type === "LOGOUT") setUser(null);
        } catch {}
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => {
      channel?.close();
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const value = useMemo<StorefrontContextValue>(() => ({
    cart,
    wishlist,
    cartOpen,
    notice,
    user,
    addToCart: (product, quantity = 1, openSidebar = true, notify = true) => {
      setCart((current) => {
        const existing = current.find((item) => item.id === product.id);
        if (existing) return current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
        return [...current, { ...product, quantity }];
      });
      if (openSidebar) {
        setCartOpen(true);
      } else if (notify) {
        toast.success(`Added ${product.name} to bag`, {
          action: {
            label: "View bag",
            onClick: () => setCartOpen(true),
          },
        });
      }
    },
    updateQuantity: (id, delta) => setCart((current) => current.map((item) => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item)),
    removeFromCart: (id) => setCart((current) => current.filter((item) => item.id !== id)),
    toggleWishlist: (id) => {
      setWishlist((current) => {
        const exists = current.includes(id);
        if (exists) {
          toast("Item removed from your wishlist");
          return current.filter((item) => item !== id);
        } else {
          toast.success("Item saved to your wishlist");
          return [...current, id];
        }
      });
    },
    openCart: () => setCartOpen(true),
    closeCart: () => setCartOpen(false),
    setUser: handleSetUser,
    logout: async () => {
      try {
        await apiFetch("/api/auth/logout", { method: "POST" });
      } finally {
        handleSetUser(null);
        toast.success("You have been signed out.");
      }
    },
    logoutAll: async () => {
      try {
        await apiFetch("/api/auth/logout-all", { method: "POST" });
      } finally {
        handleSetUser(null);
        toast.success("Signed out from all devices.");
      }
    },
    showNotice: (message, type = "info") => {
      if (type === "success") {
        toast.success(message);
      } else if (type === "error") {
        toast.error(message);
      } else if (type === "warning") {
        toast.warning(message);
      } else {
        toast.info(message);
      }
    },
  }), [cart, wishlist, cartOpen, notice, user, handleSetUser]);

  return (
    <StorefrontContext.Provider value={value}>
      {children}
    </StorefrontContext.Provider>
  );
}

function SnookerTableIcon({ className = "", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg width="26" height="26" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="2.5" y="7" width="23" height="8" rx="2" stroke={color} strokeWidth="1.8" />
      <line x1="2.5" y1="10.5" x2="25.5" y2="10.5" stroke={color} strokeWidth="1.2" />
      <circle cx="5.5" cy="8.7" r="1.1" fill={color} />
      <circle cx="14" cy="8.7" r="1.1" fill={color} />
      <circle cx="22.5" cy="8.7" r="1.1" fill={color} />
      <path d="M5.5 15V22M7.5 22H3.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M22.5 15V22M24.5 22H20.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CrossedCuesIcon({ className = "", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg width="26" height="26" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <line x1="4.5" y1="4.5" x2="23.5" y2="23.5" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
      <line x1="23.5" y1="4.5" x2="4.5" y2="23.5" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
      <circle cx="14" cy="22" r="1.8" fill={color} />
    </svg>
  );
}

function BallRackIcon({ className = "", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg width="26" height="26" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <polygon points="14,3 3.5,23 24.5,23" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="14" cy="8" r="1.3" fill={color} />
      <circle cx="11.5" cy="12.5" r="1.3" fill={color} />
      <circle cx="16.5" cy="12.5" r="1.3" fill={color} />
      <circle cx="9" cy="17" r="1.3" fill={color} />
      <circle cx="14" cy="17" r="1.3" fill={color} />
      <circle cx="19" cy="17" r="1.3" fill={color} />
      <circle cx="6.8" cy="20.8" r="1.1" fill={color} />
      <circle cx="10.4" cy="20.8" r="1.1" fill={color} />
      <circle cx="14" cy="20.8" r="1.1" fill={color} />
      <circle cx="17.6" cy="20.8" r="1.1" fill={color} />
      <circle cx="21.2" cy="20.8" r="1.1" fill={color} />
    </svg>
  );
}

/* Wall scoreboard: frame, two bead rails and a score window */
function ScoreboardIcon({ className = "", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg width="26" height="26" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="3" y="5" width="22" height="18" rx="2" stroke={color} strokeWidth="1.8" />
      <line x1="6.5" y1="10.5" x2="21.5" y2="10.5" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      <line x1="6.5" y1="17.5" x2="21.5" y2="17.5" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="9" cy="10.5" r="1.5" fill={color} />
      <circle cx="12.5" cy="10.5" r="1.5" fill={color} />
      <circle cx="18" cy="17.5" r="1.5" fill={color} />
      <path d="M11 14H17" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeDasharray="1.5 1.5" />
    </svg>
  );
}

/* Table corner seen from above: two cushion rails meeting at a pocket with its net */
function TablePocketIcon({ className = "", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg width="26" height="26" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M11 3.5H25M3.5 11V25" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M11 9H25M9 11V25" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="7" cy="7" r="4.2" stroke={color} strokeWidth="1.8" />
      <path d="M5 5.5L9 9M5.2 8.6L8.6 5.2" stroke={color} strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

/* Cube of cue chalk with the cupped top where the tip is chalked */
function ChalkIcon({ className = "", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg width="26" height="26" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M14 4L23.5 8.5V19.5L14 24L4.5 19.5V8.5L14 4Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M4.5 8.5L14 13L23.5 8.5M14 13V24" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <ellipse cx="14" cy="8.5" rx="4" ry="1.9" stroke={color} strokeWidth="1.4" />
    </svg>
  );
}

/* Hanging canopy light over the table */
function TableLightIcon({ className = "", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg width="26" height="26" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M14 3V8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M5 16C5.5 11.2 9.2 8.5 14 8.5C18.8 8.5 22.5 11.2 23 16H5Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 20L8 23M14 20V23.5M19 20L20 23" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}


const defaultDeliveryAddresses = [
  { id: "addr-1", title: "1226 University Dr", subtitle: "Banjara Hills, Hyderabad 500034" },
  { id: "addr-2", title: "Plot 42, Road No 36", subtitle: "Jubilee Hills, Hyderabad 500033" },
  { id: "addr-3", title: "Flat 4B, Sree Heights", subtitle: "Road No 12, Banjara Hills 500034" },
  { id: "addr-4", title: "Financial District", subtitle: "Nanakramguda, Gachibowli 500032" },
];

/** Store WhatsApp number (placeholder until the real one is confirmed) — used by every WhatsApp button */
export const WHATSAPP_NUMBER = "919999999999";
export const whatsappUrl = (message = "Hi, I have an enquiry regarding Hyderabad Cue Sports") =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

/* Navbar categories — the product groups Hyderabad Cue Sports sells.
   Each pill links to an existing catalogue category, narrowed by a search word
   where the group is a subset of it (same convention as the dropdown menus).
   Products for "Table Parts" are tagged "table parts" in lib/products.ts. */
type NavCategory = {
  id: string;
  label: string;
  icon: typeof SnookerTableIcon;
  category: string;
  /** ?category= values (lower-case) that count as this pill */
  matches: string[];
  query?: string;
};

const mobileCategories: (NavCategory & { href: string })[] = ([
  { id: "tables", label: "Tables", icon: SnookerTableIcon, category: "Snooker Tables", matches: ["snooker tables"] },
  { id: "table-parts", label: "Table Parts", icon: TablePocketIcon, category: "Table Accessories", matches: ["table accessories"], query: "table parts" },
  { id: "balls", label: "Balls", icon: BallRackIcon, category: "Table Accessories", matches: ["table accessories"], query: "balls" },
  // "Cue Equipment" also pulls in products filed as "Cues" (see ShopPage filter)
  { id: "cues", label: "Cues", icon: CrossedCuesIcon, category: "Cue Equipment", matches: ["cue equipment", "cues"] },
  { id: "cue-accessories", label: "Cue Accessories", icon: ChalkIcon, category: "Cue Equipment", matches: ["cue equipment", "cues"], query: "cue accessories" },
  { id: "scoreboards", label: "Scoreboards", icon: ScoreboardIcon, category: "Scoreboards", matches: ["scoreboards"] },
  { id: "table-lights", label: "Table Lights", icon: TableLightIcon, category: "Table Accessories", matches: ["table accessories"], query: "lights" },
] as NavCategory[]).map((c) => ({
  ...c,
  href: `/shop?${new URLSearchParams(c.query ? { category: c.category, query: c.query } : { category: c.category })}`,
}));

/** Which navbar pill is active. Reads the URL via hooks (not window), so the
 *  server and browser render the same thing and it updates on every navigation. */
function useActiveCategory(): string | null {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  if (pathname !== "/shop") return null;
  const cat = (searchParams.get("category") || "").toLowerCase();
  const query = (searchParams.get("query") || "").toLowerCase();
  return mobileCategories.find((c) => c.matches.includes(cat) && (c.query ?? "") === query)?.id ?? null;
}

function CategoryRailView({ variant, activeId }: { variant: "desktop" | "mobile"; activeId: string | null }) {
  if (variant === "desktop") {
    return (
      <div className="luxury-cat-rail">
        {mobileCategories.map((cat) => {
          const isActive = activeId === cat.id;
          const IconComponent = cat.icon;
          return (
            <Link key={cat.id} href={cat.href} className={`luxury-cat-pill-item ${isActive ? "active" : ""}`} aria-label={cat.label}>
              <div className={`luxury-cat-capsule ${isActive ? "active" : "inactive"}`}>
                <IconComponent color={isActive ? "#ffffff" : "#0b3824"} className="luxury-cat-icon" />
                <span className="luxury-cat-label">{cat.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    );
  }
  return (
    <div className="mobile-cat-rail">
      {mobileCategories.map((cat) => {
        const isActive = activeId === cat.id;
        const IconComponent = cat.icon;
        return (
          <Link key={cat.id} href={cat.href} className={`mobile-cat-item ${isActive ? "active" : ""}`} aria-label={cat.label}>
            {isActive ? (
              <div className="mobile-cat-card active">
                <IconComponent color="#ffffff" className="mobile-cat-card-icon" />
                <span className="mobile-cat-card-label">{cat.label}</span>
              </div>
            ) : (
              <>
                <div className="mobile-cat-card inactive">
                  <IconComponent color="#072a1b" className="mobile-cat-card-icon" />
                </div>
                <span className="mobile-cat-outside-label">{cat.label}</span>
              </>
            )}
          </Link>
        );
      })}
    </div>
  );
}

function ActiveCategoryRail({ variant }: { variant: "desktop" | "mobile" }) {
  return <CategoryRailView variant={variant} activeId={useActiveCategory()} />;
}

/* useSearchParams needs a Suspense boundary; the fallback is the same rail with nothing highlighted */
function CategoryRail({ variant }: { variant: "desktop" | "mobile" }) {
  return (
    <Suspense fallback={<CategoryRailView variant={variant} activeId={null} />}>
      <ActiveCategoryRail variant={variant} />
    </Suspense>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { cart, openCart, wishlist, showNotice, user, logout } = useStorefront();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [mobileExpandedCat, setMobileExpandedCat] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState("1226 University Dr");
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [customPincode, setCustomPincode] = useState("");
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Sticky search: the compact bar (search + account + cart) switches on the moment the
  // header's own search box reaches the bar's search position, so the search box appears
  // to simply stop at the top while the location and category rows scroll away.
  const headerRef = useRef<HTMLDivElement>(null);
  const compactSearchRef = useRef<HTMLFormElement>(null);
  const [showCompactBar, setShowCompactBar] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
      const header = headerRef.current;
      if (!header) return setShowCompactBar(false);
      // Whichever header search is on screen (desktop pill or the mobile one)
      const headerSearch = Array.from(header.querySelectorAll<HTMLElement>(".mobile-pill-search")).find((el) => el.offsetWidth > 0);
      if (!headerSearch) return setShowCompactBar(header.getBoundingClientRect().bottom <= 0);
      // Where the bar's search box sits from the top of the screen (offsetTop ignores transforms)
      const stickTop = compactSearchRef.current?.offsetTop ?? 11;
      setShowCompactBar(headerSearch.getBoundingClientRect().top <= stickTop);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [pathname]);

  if (pathname === "/login") return null;

  const handleAccountClick = (ref: string) => {
    if (!user) {
      router.push(buildLoginUrl({ ref }));
    } else {
      setAccountMenuOpen((prev) => !prev);
    }
  };

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
    router.push(buildShopUrl({ query: search.trim(), ref: "hcs_nav_search" }));
  };

  return (
    <>
      {/* Compact sticky bar: slides down once the main header is out of view */}
      <div className={`hcs-compact-bar ${showCompactBar ? "is-visible" : ""}`} inert={!showCompactBar} aria-hidden={!showCompactBar}>
        <div className="hcs-compact-inner">
          <Link href="/" className="hcs-compact-logo" aria-label="Hyderabad Cue Sports Home">
            <img src="/images/hcs-logo-white.png" alt="Hyderabad Cue Sports" width={120} height={35} />
          </Link>

          <form className="hcs-compact-search" role="search" onSubmit={submitSearch} ref={compactSearchRef}>
            <Search size={19} aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for Snooker Tables, Cues..."
              aria-label="Search catalog"
            />
          </form>

          <div className="hcs-compact-actions">
            <button type="button" className="hcs-compact-btn" aria-label="Account" onClick={() => handleAccountClick("compact_header")}>
              <UserRound size={19} strokeWidth={1.8} />
            </button>
            <button type="button" className="hcs-compact-btn" aria-label={`Cart with ${cartCount} items`} onClick={openCart}>
              <ShoppingCart size={19} strokeWidth={1.8} />
              {cartCount > 0 && <span className="hcs-compact-badge">{cartCount > 99 ? "99+" : cartCount}</span>}
            </button>
          </div>
        </div>
      </div>

      <div className={`hcs-sticky-header ${isScrolled ? "scrolled" : ""}`}>
        {/* Luxury Brand Header (Matching Design Mockup across Desktop and Mobile) */}
        <div className="luxury-header-shell mobile-luxury-header-shell" ref={headerRef}>
          {/* Top Green Hero Bar with Snooker Table Background */}
          {/* Luxury Hero Navigation Shell */}
          <div className="mobile-hero-top">
            <div className="mobile-hero-gradient-overlay" />
            <div className="mobile-hero-content">
              {/* Row 1: Logo on Left, User & Cart Buttons on Right */}
              <div className="mobile-hero-top-row">
                <Link href="/" className="mobile-hero-logo" aria-label="Hyderabad Cue Sports Home">
                  <img
                    src="/images/hcs-logo-white.png"
                    alt="Hyderabad Cue Sports"
                    className="mobile-brand-img"
                    width={150}
                    height={44}
                  />
                </Link>

                <div className="mobile-hero-actions">
                  <button
                    type="button"
                    className="mobile-hero-circle-btn"
                    aria-label="Account"
                    onClick={() => handleAccountClick("mobile_header")}
                  >
                    <UserRound size={19} color="#ffffff" strokeWidth={1.8} />
                  </button>

                  <button
                    type="button"
                    className="mobile-hero-circle-btn mobile-cart-circle"
                    aria-label={`Cart with ${cartCount} items`}
                    onClick={openCart}
                  >
                    <ShoppingCart size={19} color="#ffffff" strokeWidth={1.8} />
                    {cartCount > 0 && (
                      <span className="mobile-hero-badge">{cartCount > 99 ? "99+" : cartCount}</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Row 2: Location Delivery Box (+ Desktop Search Pill) */}
              <div className="mobile-hero-mid-row">
                <div className="mobile-delivery-box">
                  <div className="mobile-delivering-label">
                    <MapPin size={13} className="mobile-map-pin" />
                    <span>Delivering to</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAddressModalOpen(true)}
                    className="mobile-address-toggle"
                    aria-label="Change delivery location"
                  >
                    <span>{selectedAddress}</span>
                    <ChevronDown size={14} strokeWidth={2.5} />
                  </button>
                </div>

                {/* Desktop Search Pill (Hidden on Mobile) */}
                <div className="desktop-search-wrapper">
                  <form className="mobile-pill-search desktop-pill-search" onSubmit={submitSearch}>
                    <Search size={19} className="mobile-search-icon" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search for Snooker Tables, Cues..."
                      aria-label="Search catalog"
                    />
                  </form>
                </div>
              </div>

              {/* Row 3 on Desktop: Horizontal Category Capsule Rail (Hidden on Mobile) */}
              <div className="desktop-cat-rail-container">
                <CategoryRail variant="desktop" />
              </div>
            </div>
          </div>

          {/* Mobile Curved Bottom Sheet (Hidden on Desktop) */}
          <div className="mobile-curved-sheet">
            {/* Mobile Search Pill Bar inside Sheet */}
            <form className="mobile-pill-search" onSubmit={submitSearch}>
              <Search size={19} className="mobile-search-icon" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for Snooker Tables, Cues..."
                aria-label="Search catalog"
              />
            </form>

            {/* Mobile SQUIRCLE Category Cards Rail */}
            <CategoryRail variant="mobile" />
          </div>

        {/* Address Modal Bottom Sheet */}
        {addressModalOpen && (
          <div className="mobile-address-overlay" onClick={() => setAddressModalOpen(false)}>
            <div className="mobile-address-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="mobile-address-header">
                <h3 className="mobile-address-title">Select Delivery Location</h3>
                <button
                  type="button"
                  onClick={() => setAddressModalOpen(false)}
                  className="mobile-modal-close"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mobile-address-list">
                {defaultDeliveryAddresses.map((addr) => {
                  const isSelected = selectedAddress === addr.title;
                  return (
                    <button
                      key={addr.id}
                      type="button"
                      className={`mobile-address-card ${isSelected ? "selected" : ""}`}
                      onClick={() => {
                        setSelectedAddress(addr.title);
                        setAddressModalOpen(false);
                        toast.success(`Delivering to ${addr.title}`);
                      }}
                    >
                      <div className="mobile-address-meta">
                        <span className="mobile-address-line1">{addr.title}</span>
                        <span className="mobile-address-line2">{addr.subtitle}</span>
                      </div>
                      {isSelected && (
                        <div className="mobile-address-check">
                          <Check size={14} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mobile-pincode-row">
                <input
                  type="text"
                  value={customPincode}
                  onChange={(e) => setCustomPincode(e.target.value)}
                  placeholder="Enter locality or pincode..."
                  className="mobile-pincode-input"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customPincode.trim()) {
                      setSelectedAddress(customPincode.trim());
                      setAddressModalOpen(false);
                      toast.success(`Delivering to ${customPincode.trim()}`);
                      setCustomPincode("");
                    }
                  }}
                  className="mobile-pincode-btn"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Account Menu Bottom Sheet */}
        {accountMenuOpen && (
          <div className="mobile-address-overlay" onClick={() => setAccountMenuOpen(false)}>
            <div className="mobile-address-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="mobile-address-header">
                <h3 className="mobile-address-title">Account Menu</h3>
                <button
                  type="button"
                  onClick={() => setAccountMenuOpen(false)}
                  className="mobile-modal-close"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {user ? (
                <div className="mobile-account-details">
                  <div className="mobile-user-card">
                    <strong>{user.fullName || "HCS Member"}</strong>
                    <span>{user.maskedPhone}</span>
                    {user.maskedEmail && <small>{user.maskedEmail}</small>}
                  </div>

                  <div className="mobile-account-links">
                    <Link
                      href="/shop"
                      className="mobile-account-link"
                      onClick={() => setAccountMenuOpen(false)}
                    >
                      Browse Catalog
                    </Link>
                    <button
                      type="button"
                      className="mobile-account-logout-btn"
                      onClick={async () => {
                        setAccountMenuOpen(false);
                        await logout();
                      }}
                    >
                      <LogOut size={16} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mobile-account-guest">
                  <p>Sign in to view your orders, saved addresses, and member privileges.</p>
                  <Link
                    href={buildLoginUrl({ ref: "mobile_sheet" })}
                    className="button button-dark button-full"
                    onClick={() => setAccountMenuOpen(false)}
                  >
                    Sign In / Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      </div>

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

            <div className="mobile-section-heading">Account</div>
            <div className="mobile-drawer-auth">
              {!user ? (
                <Link
                  href={buildLoginUrl({ ref: "hcs_drawer_nav" })}
                  className="mobile-drawer-login-btn"
                  onClick={() => setMobileOpen(false)}
                >
                  <UserRound size={17} />
                  <span>Login</span>
                </Link>
              ) : (
                <div className="mobile-drawer-user">
                  <div className="mobile-drawer-user-info">
                    <UserRound size={17} />
                    <div>
                      <strong>{user.fullName || "HCS Member"}</strong>
                      <span>{user.maskedPhone}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="mobile-drawer-logout-btn"
                    onClick={async () => {
                      setMobileOpen(false);
                      await logout();
                    }}
                  >
                    <LogOut size={15} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>

            <div className="mobile-section-heading">Quick Links</div>
            <div className="mobile-quick-links">
              <Link href="/" onClick={() => setMobileOpen(false)}>Home</Link>
              <Link href="/shop" onClick={() => setMobileOpen(false)}>All Products</Link>
            </div>

            <div className="mobile-drawer-footer">
              <a
                href={whatsappUrl()}
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
  const pathname = usePathname();
  if (pathname === "/login") return null;
  return (
    <a
      href={whatsappUrl()}
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
  return null;
}

/** Zepto/BigBasket-style bar pinned to the bottom while the bag has items:
 *  thumbnails, item count + subtotal, and "View cart" which opens the bag drawer. */
export function FloatingCartBar() {
  const { cart, cartOpen, openCart } = useStorefront();
  const pathname = usePathname();
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const visible = count > 0 && !cartOpen && pathname !== "/login";
  const shownSubtotal = useCountUp(subtotal);

  // Bounce the bar when an added item "lands" (timed to the fly-to-cart animation).
  // Alternating two identical keyframe classes restarts the CSS animation each time.
  const prevCount = useRef(count);
  const [bumps, setBumps] = useState(0);
  useEffect(() => {
    const grew = count > prevCount.current;
    prevCount.current = count;
    if (!grew) return;
    const timer = setTimeout(() => setBumps((n) => n + 1), prefersReducedMotion() ? 0 : FLY_DURATION_MS - 60);
    return () => clearTimeout(timer);
  }, [count]);

  // Lets CSS lift the WhatsApp button above the bar on small screens
  useEffect(() => {
    document.body.toggleAttribute("data-cart-bar", visible);
    return () => document.body.removeAttribute("data-cart-bar");
  }, [visible]);

  if (!visible) return null;
  const thumbs = cart.slice(-3).reverse();
  const bumpClass = bumps === 0 ? "" : bumps % 2 ? "bump-a" : "bump-b";
  return (
    <button type="button" className={`floating-cart-bar ${bumpClass}`} onClick={openCart} aria-label={`View cart: ${count} ${count === 1 ? "item" : "items"}, ${formatInr(subtotal)}`}>
      <span className="fcb-thumbs" aria-hidden="true">
        {thumbs.map((item) => <img key={item.id} src={item.image} alt="" />)}
      </span>
      <span className="fcb-info">
        <strong>
          <span className="fcb-count">
            <span key={count}>{count}</span>
          </span>{" "}
          {count === 1 ? "item" : "items"}
        </strong>
        <span>{formatInr(shownSubtotal)}</span>
      </span>
      <span className="fcb-cta" aria-hidden="true">
        <ArrowRight size={18} strokeWidth={2.4} />
      </span>
    </button>
  );
}

/** Zomato/Swiggy-style "↑ Back to top" pill, centred just under the sticky top bar.
 *  Shows once you're well down the page and start scrolling back up; hides while
 *  scrolling down (so it never covers what you're reading) and near the top. */
const BACK_TO_TOP_SHOW_AFTER = 700; // px scrolled before it can appear
const BACK_TO_TOP_HIDE_BELOW = 400; // always hidden this close to the top

export function BackToTop() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY;
      if (Math.abs(delta) < 4) return; // ignore tiny jitters
      if (y < BACK_TO_TOP_HIDE_BELOW) setVisible(false);
      else if (delta < 0 && y > BACK_TO_TOP_SHOW_AFTER) setVisible(true);
      else if (delta > 0) setVisible(false);
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  if (pathname === "/login") return null;
  return (
    <button
      type="button"
      className={`back-to-top-pill ${visible ? "is-visible" : ""}`}
      onClick={() => {
        setVisible(false);
        window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
      }}
      aria-label="Back to top"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
    >
      <ArrowUp size={15} strokeWidth={2.4} aria-hidden="true" />
      Back to top
    </button>
  );
}

/* Pages that aren't built yet show a short notice instead of a dead link */
const FOOTER_HELP_LINKS = [
  { label: "Shipping information", notice: "Shipping information will be added soon." },
  { label: "Returns & refunds", notice: "Return policy will be added soon." },
  { label: "FAQs", notice: "FAQs will be added soon." },
];
const FOOTER_COMPANY_LINKS = [
  { label: "About us", notice: "About page will be added soon." },
  { label: "Privacy policy", notice: "Privacy policy will be added soon." },
  { label: "Terms & conditions", notice: "Terms will be added soon." },
];
// Placeholder contact details — replace with the real ones
const FOOTER_EMAIL = "support@hyderabadcuesports.com";

export function SiteFooter() {
  const pathname = usePathname();
  const { showNotice } = useStorefront();
  if (pathname === "/login") return null;
  const year = new Date().getFullYear();

  return (
    <footer className="hcs-footer" id="contact">
      <div className="hcs-footer-main">
        <div className="hcs-footer-brand">
          <Link href="/" className="hcs-footer-logo" aria-label="Hyderabad Cue Sports Home">
            <img src="/images/hcs-logo-white.png" alt="Hyderabad Cue Sports" width={150} height={44} />
          </Link>
          <p>Premium snooker tables, cues and accessories — chosen, delivered and set up for players across India.</p>
          <ul className="hcs-footer-contact">
            <li>
              <MessageCircle size={16} aria-hidden="true" />
              <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer">Chat with us on WhatsApp</a>
            </li>
            <li>
              <Mail size={16} aria-hidden="true" />
              <a href={`mailto:${FOOTER_EMAIL}`}>{FOOTER_EMAIL}</a>
            </li>
            <li>
              <MapPin size={16} aria-hidden="true" />
              <span>Hyderabad, Telangana, India</span>
            </li>
          </ul>
          <div className="hcs-footer-socials">
            <button type="button" aria-label="Instagram" onClick={() => showNotice("Instagram page will be linked soon.")}>
              <Instagram size={18} />
            </button>
            <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
              <MessageCircle size={18} />
            </a>
            <a href={`mailto:${FOOTER_EMAIL}`} aria-label="Email">
              <Mail size={18} />
            </a>
          </div>
        </div>

        <nav className="hcs-footer-col" aria-label="Shop">
          <h4>Shop</h4>
          {mobileCategories.map((cat) => (
            <Link key={cat.id} href={cat.href}>{cat.label}</Link>
          ))}
        </nav>

        <nav className="hcs-footer-col" aria-label="Help">
          <h4>Help</h4>
          {FOOTER_HELP_LINKS.map((l) => (
            <button key={l.label} type="button" onClick={() => showNotice(l.notice)}>{l.label}</button>
          ))}
          <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer">Contact us</a>
        </nav>

        <nav className="hcs-footer-col" aria-label="Company">
          <h4>Company</h4>
          {FOOTER_COMPANY_LINKS.map((l) => (
            <button key={l.label} type="button" onClick={() => showNotice(l.notice)}>{l.label}</button>
          ))}
        </nav>
      </div>

      <div className="hcs-footer-bottom">
        <span>© {year} Hyderabad Cue Sports. All rights reserved.</span>
        <span className="hcs-footer-pay" aria-label="Payment methods we accept">
          <span>UPI</span>
          <span>Visa</span>
          <span>Mastercard</span>
          <span>RuPay</span>
        </span>
      </div>
    </footer>
  );
}

/** Product card used on the homepage carousel, the shop grid and "You may also like":
 *  framed photo + heart, name, then price with a compact ADD button. */
export function ProductCard({ product, refTag = "hcs_cat_item" }: { product: Product; refTag?: string; onQuickView?: (product: Product) => void }) {
  const { wishlist, toggleWishlist } = useStorefront();
  const isSaved = wishlist.includes(product.id);
  const productHref = buildProductUrl(product, { ref: refTag });
  return (
    <article className="product-card">
      <div className="product-image-wrap">
        <Link href={productHref} className="product-image-link">
          <img src={product.image} alt={product.name} />
        </Link>
        <button
          className={`wishlist-button ${isSaved ? "saved" : ""}`}
          onClick={() => toggleWishlist(product.id)}
          aria-label={isSaved ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
        >
          <Heart size={19} strokeWidth={1.8} fill={isSaved ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="product-card-body">
        <Link href={productHref} className="product-card-title">
          <h3>{product.name}</h3>
        </Link>
        <div className="product-card-meta">
          <strong>{formatInr(product.price)}</strong>
          <CompactAddButton product={product} />
        </div>
      </div>
    </article>
  );
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** How long the photo takes to fly into the cart bar; the bar bounces when it lands. */
const FLY_DURATION_MS = 700;

/**
 * BigBasket/Zepto-style "fly to cart": a copy of the product photo shrinks and
 * travels in an arc from the card to the floating cart bar's thumbnails.
 * The outer box moves sideways while the inner image rises then drops, so the
 * two motions combine into a curved path.
 */
function flyToCart(source: HTMLImageElement | null | undefined) {
  if (!source || prefersReducedMotion()) return;
  const from = source.getBoundingClientRect();
  if (!from.width || !from.height) return;

  // Aim at the bar's first thumbnail; on the first add the bar isn't mounted yet,
  // so aim where it will appear (bottom centre pill, ~137px wide with one item).
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const thumbs = document.querySelector(".fcb-thumbs")?.getBoundingClientRect();
  const barBottom = vw <= 960 ? 56 : 64; // matches .floating-cart-bar bottom (before safe-area)
  const toX = thumbs ? thumbs.left + 16 : vw / 2 - 68 + 23;
  const toY = thumbs ? thumbs.top + thumbs.height / 2 : vh - barBottom - 23;

  // Small round thumbnail (not the full photo); ends near the bar's 38px thumbnail size
  const size = 56;
  const startX = from.left + from.width / 2;
  const startY = from.top + from.height / 2;
  const dx = toX - startX;
  const dy = toY - startY;
  const lift = Math.min(110, 40 + Math.abs(dy) * 0.2);

  const ghost = document.createElement("div");
  ghost.className = "fly-to-cart-ghost";
  Object.assign(ghost.style, {
    left: `${startX - size / 2}px`,
    top: `${startY - size / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
  });
  const img = document.createElement("img");
  img.src = source.currentSrc || source.src;
  img.alt = "";
  ghost.appendChild(img);
  document.body.appendChild(ghost);

  ghost.animate([{ transform: "translateX(0)" }, { transform: `translateX(${dx}px)` }], {
    duration: FLY_DURATION_MS,
    easing: "cubic-bezier(0.3, 0.6, 0.4, 1)",
  });
  const fall = img.animate(
    [
      { transform: "translateY(0) scale(0.6)", opacity: 0, easing: "cubic-bezier(0.2, 0.6, 0.4, 1)" },
      { transform: "translateY(-6px) scale(1)", opacity: 1, offset: 0.12, easing: "cubic-bezier(0.2, 0.6, 0.4, 1)" },
      { transform: `translateY(${-lift}px) scale(0.95)`, opacity: 1, offset: 0.35, easing: "cubic-bezier(0.5, 0, 0.75, 0.4)" },
      { transform: `translateY(${dy}px) scale(0.6)`, opacity: 0.85 },
    ],
    { duration: FLY_DURATION_MS },
  );
  const cleanup = () => ghost.remove();
  fall.onfinish = cleanup;
  fall.oncancel = cleanup;
  // Backup in case the finish event is delayed (e.g. the tab is in the background)
  window.setTimeout(cleanup, FLY_DURATION_MS + 300);
}

/** Eases a number from its previous value to the new one (for the cart total). */
function useCountUp(value: number, duration = 450) {
  const [display, setDisplay] = useState(value);
  const shownRef = useRef(value);
  useEffect(() => {
    const from = shownRef.current;
    if (from === value) return;
    if (prefersReducedMotion()) {
      shownRef.current = value;
      setDisplay(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(from + (value - from) * eased);
      shownRef.current = next;
      setDisplay(next);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return display;
}

/** Small "ADD" button (Zepto/Blinkit style). Once the item is in the bag it
 *  becomes a − qty + stepper; going below 1 removes it from the bag.
 *  ADD and + send the product photo flying into the cart bar. */
export function CompactAddButton({ product }: { product: Product }) {
  const { cart, addToCart, updateQuantity, removeFromCart } = useStorefront();
  const quantity = cart.find((item) => item.id === product.id)?.quantity ?? 0;

  // Direction of the last change, so the number slides up on + and down on −
  const prevQuantity = useRef(quantity);
  const direction = quantity >= prevQuantity.current ? "up" : "down";
  useEffect(() => {
    prevQuantity.current = quantity;
  }, [quantity]);

  const cardImage = (el: HTMLElement) =>
    el.closest(".product-card")?.querySelector<HTMLImageElement>(".product-image-wrap img");

  if (quantity === 0) {
    return (
      <button
        type="button"
        className="compact-add-btn"
        onClick={(e) => {
          flyToCart(cardImage(e.currentTarget));
          addToCart(product, 1, false, false);
        }}
        aria-label={`Add ${product.name} to bag`}
      >
        <Plus size={14} strokeWidth={2.4} />
        ADD
      </button>
    );
  }

  return (
    <div className="compact-stepper" role="group" aria-label={`${product.name} quantity`}>
      <button
        type="button"
        onClick={() => (quantity === 1 ? removeFromCart(product.id) : updateQuantity(product.id, -1))}
        aria-label={quantity === 1 ? `Remove ${product.name} from bag` : "Decrease quantity"}
      >
        <Minus size={14} strokeWidth={2.4} />
      </button>
      <span className="compact-stepper-qty" aria-live="polite">
        <span key={quantity} className={`qty-roll-${direction}`}>{quantity}</span>
      </span>
      <button
        type="button"
        onClick={(e) => {
          flyToCart(cardImage(e.currentTarget));
          updateQuantity(product.id, 1);
        }}
        aria-label="Increase quantity"
      >
        <Plus size={14} strokeWidth={2.4} />
      </button>
    </div>
  );
}

export function QuickViewModal({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const { addToCart } = useStorefront();
  if (!product) return null;
  const productHref = buildProductUrl(product, { ref: "hcs_quickview" });
  return <div className="modal-overlay" onClick={onClose}><div className="quick-view-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close icon-button" onClick={onClose} aria-label="Close quick view"><X size={20} /></button><div className="quick-view-image"><img src={product.image} alt={product.name} /></div><div className="quick-view-content"><span className="eyebrow">Quick view · Demo product</span><h2>{product.name}</h2><p className="quick-view-price">{formatInr(product.price)}</p><p>{product.description}</p><div className="quick-view-facts"><span><ShieldCheck size={16} />{product.availability}</span><span><Sparkles size={16} />{product.size} playing size</span></div><div className="quick-view-actions"><button className="button button-dark" onClick={() => { addToCart(product); onClose(); }}>Add to bag <ShoppingBag size={16} /></button><Link className="button button-ghost" href={productHref} onClick={onClose}>View details <ArrowRight size={16} /></Link></div></div></div></div>;
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

export { toast } from "sonner";
