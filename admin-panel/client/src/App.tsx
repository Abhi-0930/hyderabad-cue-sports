import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
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
import type { NavKey, OrderRecord, ProductRecord } from "./types/admin";

function AdminApp() {
  const [active, setActive] = useState<NavKey>("dashboard");
  const [products, setProducts] = useState<ProductRecord[]>(phase2Products);
  const [orders, setOrders] = useState<OrderRecord[]>(phase3Orders);
  const navigate = (key: NavKey) => setActive(key);
  const content = active === "dashboard" ? <AdminDashboard onViewOrders={() => navigate("orders")} onViewProducts={() => navigate("products")} /> : active === "products" ? <ProductModule products={products} setProducts={setProducts} /> : active === "categories" ? <CategoryModule /> : active === "inventory" ? <InventoryModule products={products} setProducts={setProducts} /> : active === "orders" ? <OrdersModule orders={orders} setOrders={setOrders} /> : active === "customers" ? <CustomerModule /> : active === "cms" ? <CmsModule products={products} /> : <AdminDashboard onViewOrders={() => navigate("orders")} onViewProducts={() => navigate("products")} />;
  return <AdminShell active={active} onNavigate={navigate}>{content}</AdminShell>;
}

function Router() {
  return <Switch><Route path="/" component={AdminApp} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster richColors /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
