import { useEffect, useState } from "react";
import { toast, Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AdminLogin, { type AdminUser } from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import ProductModule from "./pages/ProductModule";
import CategoryModule from "./pages/CategoryModule";
import InventoryModule from "./pages/InventoryModule";
import OrdersModule from "./pages/OrdersModule";
import CustomerModule from "./pages/CustomerModule";
import CmsModule from "./pages/CmsModule";
import { phase2Products } from "./data/phase2Data";
import { phase3Orders } from "./data/phase3Data";
import { AdminShell } from "./components/admin/AdminShell";
import { useRealtimeOrders } from "./hooks/useRealtimeOrders";
import type { NavKey, OrderRecord, ProductRecord } from "./types/admin";
import { API_BASE } from "@/lib/api";

function AdminApp() {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    try {
      const saved = localStorage.getItem("hcs_admin_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [active, setActive] = useState<NavKey>("dashboard");
  const [products, setProducts] = useState<ProductRecord[]>(phase2Products);
  const [orders, setOrders] = useState<OrderRecord[]>(phase3Orders);

  // Fetch live products from PostgreSQL backend on mount
  useEffect(() => {
    const fetchAdminProducts = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/products`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            setProducts(json.data);
          }
        }
      } catch (err) {
        console.warn("Could not load products from backend, using cached products:", err);
      }
    };
    fetchAdminProducts();
  }, []);

  // Zero-polling real-time order listener via Supabase Realtime WebSocket stream
  useRealtimeOrders({
    onNewOrder: (newOrder) => {
      setOrders((current) => [newOrder as OrderRecord, ...current]);
    },
    onUpdateOrder: (updated) => {
      setOrders((current) =>
        current.map((order) => (order.id === updated.id ? { ...order, ...updated } : order))
      );
    },
  });

  // Background verification of active PostgreSQL admin session
  useEffect(() => {
    if (!adminUser) return;
    const verifySession = async () => {
      try {
        const headers: Record<string, string> = {};
        if (adminUser.token) {
          headers["Authorization"] = `Bearer ${adminUser.token}`;
        }
        const res = await fetch(`${API_BASE}/api/admin/me`, {
          credentials: "include",
          headers,
        });
        if (!res.ok) {
          localStorage.removeItem("hcs_admin_user");
          setAdminUser(null);
        }
      } catch {
        // network temporarily offline, keep local state
      }
    };
    verifySession();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/api/admin/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {}
    localStorage.removeItem("hcs_admin_user");
    setAdminUser(null);
    toast.success("Signed out successfully.");
  };

  // Strict Authentication Gate: Show Login Screen when unauthenticated
  if (!adminUser) {
    return (
      <AdminLogin
        onLogin={(user) => {
          setAdminUser(user);
          toast.success(`Welcome back, ${user.fullName || "Admin"}!`);
        }}
      />
    );
  }

  const navigate = (key: NavKey) => setActive(key);
  const content =
    active === "dashboard" ? (
      <AdminDashboard onViewOrders={() => navigate("orders")} onViewProducts={() => navigate("products")} />
    ) : active === "products" ? (
      <ProductModule products={products} setProducts={setProducts} />
    ) : active === "categories" ? (
      <CategoryModule />
    ) : active === "inventory" ? (
      <InventoryModule products={products} setProducts={setProducts} />
    ) : active === "orders" ? (
      <OrdersModule orders={orders} setOrders={setOrders} />
    ) : active === "customers" ? (
      <CustomerModule />
    ) : active === "cms" ? (
      <CmsModule products={products} />
    ) : (
      <AdminDashboard onViewOrders={() => navigate("orders")} onViewProducts={() => navigate("products")} />
    );

  return (
    <AdminShell
      active={active}
      onNavigate={navigate}
      adminUser={adminUser}
      onLogout={handleLogout}
    >
      {content}
    </AdminShell>
  );
}

function Router() {
  return <Switch><Route path="/" component={AdminApp} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster richColors /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
