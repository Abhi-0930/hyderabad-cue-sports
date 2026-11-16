import { useState, type ReactNode } from "react";
import { Bell, ChevronDown, CircleHelp, Command, FolderTree, LayoutDashboard, Menu, Package, PanelLeftClose, PanelLeftOpen, Search, ShoppingBag, Boxes, Users, X, LayoutTemplate, LogOut } from "lucide-react";
import type { NavItem, NavKey } from "@/types/admin";
import type { AdminUser } from "@/pages/AdminLogin";

const navItems: NavItem[] = [
  { key: "dashboard", label: "Home", description: "Store overview" },
  { key: "orders", label: "Orders", description: "Manage sales" },
  { key: "products", label: "Products", description: "Catalog & inventory" },
  { key: "categories", label: "Categories", description: "Store taxonomy" },
  { key: "inventory", label: "Inventory", description: "Stock controls" },
  { key: "customers", label: "Customers", description: "Customer records" },
  { key: "cms", label: "Website CMS", description: "Storefront content" },
];

const iconFor: Record<NavKey, typeof LayoutDashboard> = { dashboard: LayoutDashboard, orders: ShoppingBag, products: Package, categories: FolderTree, inventory: Boxes, customers: Users, cms: LayoutTemplate };

export function AdminShell({
  active,
  onNavigate,
  adminUser,
  onLogout,
  children,
}: {
  active: NavKey;
  onNavigate: (key: NavKey) => void;
  adminUser?: AdminUser;
  onLogout: () => void;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const initials = adminUser?.fullName ? adminUser.fullName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "AD";

  return <div className="admin-app"><aside className={`sidebar ${collapsed ? "sidebar-collapsed" : ""} ${mobileOpen ? "sidebar-mobile-open" : ""}`}><div className="brand-lockup"><div className="brand-mark">HC<span /></div><div className="brand-copy"><strong>Hyderabad</strong><span>Cue Sports</span></div><button className="mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={18} /></button></div><div className="store-switcher"><div className="store-avatar">H</div><div className="store-switcher-copy"><strong>HCS Main Store</strong></div><ChevronDown size={15} /></div><nav className="side-nav">{navItems.map((item) => { const Icon = iconFor[item.key]; return <button key={item.key} className={`side-nav-item ${active === item.key ? "active" : ""}`} onClick={() => { onNavigate(item.key); setMobileOpen(false); }} title={collapsed ? item.label : undefined}><Icon size={18} /><span className="nav-item-copy"><strong>{item.label}</strong></span>{item.key === "orders" && <span className="nav-count">8</span>}{item.key === "inventory" && <span className="nav-count nav-count-warn">3</span>}</button>; })}</nav><div className="sidebar-bottom"><button className="side-nav-item"><CircleHelp size={18} /><span className="nav-item-copy"><strong>Help centre</strong></span></button><button className="side-nav-item side-nav-logout" onClick={onLogout} title="Sign out of Admin Panel"><LogOut size={18} /><span className="nav-item-copy"><strong>Sign out</strong></span></button><div className="sidebar-user"><span className="profile-avatar">{initials}</span><span className="nav-item-copy"><strong>{adminUser?.fullName || "Administrator"}</strong></span></div></div><button className="collapse-button" onClick={() => setCollapsed((value) => !value)}>{collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}<span>{collapsed ? "Expand" : "Collapse menu"}</span></button></aside><div className="main-shell"><header className="topbar"><button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={20} /></button><div className="breadcrumbs"><span className="crumb-muted">HCS Main Store</span><span>/</span><strong>{navItems.find((item) => item.key === active)?.label}</strong></div><div className="topbar-actions"><label className="global-search"><Search size={16} /><input placeholder="Search your store" /><kbd><Command size={11} />K</kbd></label><button className="icon-button"><Bell size={17} /><i /></button><button className="top-profile" onClick={onLogout} title="Click to Sign Out"><span>{initials}</span><LogOut size={14} style={{ opacity: 0.7 }} /></button></div></header><main className="page-content">{children}</main></div>{mobileOpen && <button className="sidebar-scrim" onClick={() => setMobileOpen(false)} aria-label="Close navigation overlay" />}</div>;
}
