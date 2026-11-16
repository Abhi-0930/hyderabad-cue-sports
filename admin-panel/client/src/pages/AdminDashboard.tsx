import { ArrowUpRight, Boxes, IndianRupee, PackageCheck, ShoppingCart, Sparkles, Trophy, UsersRound } from "lucide-react";
import { activity, formatINR, orders, products } from "@/data/mockData";
import { Button, MetricCard, SectionCard, StatusBadge } from "@/components/admin/Primitives";
import { CategoryChart, RevenueBreakdown, SalesTrendChart } from "@/components/admin/Charts";

const activityIcons = { customer: UsersRound, inventory: Boxes, order: PackageCheck, payment: IndianRupee } as const;
const topSellerUnits = [38, 26, 18, 15];

export default function AdminDashboard({ onViewOrders, onViewProducts }: { onViewOrders: () => void; onViewProducts: () => void }) {
  return <div className="dashboard-page">
    <div className="page-heading">
      <div><p className="eyebrow">Friday, 13 November 2026</p><h1>Good morning, Admin Studio</h1><p className="page-subtitle">Here’s the pulse of your cue sports business today.</p></div>
      <div className="heading-actions"><Button variant="outline" size="sm"><Sparkles size={15} /> View store</Button><Button size="sm"><span className="plus-mark">+</span> Add product</Button></div>
    </div>
    <div className="insight-strip"><div className="insight-mark"><Sparkles size={16} /></div><div><strong>November is shaping up nicely.</strong><span>Sales are up 18.4% compared to this time last month.</span></div><button aria-label="Dismiss insight">×</button></div>
    <div className="metric-grid">
      <MetricCard label="Total sales" value={formatINR(546500, true)} change="↑ 18.4%" detail="vs. ₹4.61L last month" icon={<IndianRupee size={18} />} />
      <MetricCard label="Orders" value="169" change="↑ 12.8%" detail="31 more than last month" icon={<ShoppingCart size={18} />} accent="gold" />
      <MetricCard label="Average order value" value={formatINR(3234)} change="↑ 4.9%" detail="vs. ₹3,083 last month" icon={<ArrowUpRight size={18} />} accent="ivory" />
      <MetricCard label="Active customers" value="1,248" change="↑ 8.2%" detail="96 new this month" icon={<UsersRound size={18} />} accent="red" />
      <MetricCard label="Inventory health" value="91%" change="↑ 3.1%" detail="91 of 100 SKUs healthy" icon={<Boxes size={18} />} accent="forest" />
    </div>
    <div className="chart-grid"><SalesTrendChart /><RevenueBreakdown /></div>
    <div className="chart-grid chart-grid-secondary">
      <CategoryChart />
      <SectionCard title="Inventory pulse" eyebrow="8 products need attention" action={<button className="text-action" onClick={onViewProducts}>View all <ArrowUpRight size={14} /></button>}>
        <div className="inventory-list">{products.filter((product) => product.status !== "In stock").slice(0, 4).map((product) => <div className="inventory-item" key={product.id}><span className="product-swatch small-swatch" style={{ background: product.accent }}>{product.initials}</span><div className="inventory-copy"><strong>{product.name}</strong><span>{product.inventory === 0 ? "Restock needed" : `${product.inventory} units remaining`}</span></div><StatusBadge status={product.status} /></div>)}</div>
      </SectionCard>
    </div>
    <div className="lower-grid">
      <SectionCard title="Recent orders" eyebrow="Latest activity" action={<button className="text-action" onClick={onViewOrders}>View all <ArrowUpRight size={14} /></button>}>
        <div className="mini-orders">{orders.slice(0, 4).map((order) => <div className="mini-order" key={order.id}><div className="mini-order-main"><span className="table-avatar avatar-1">{order.initials}</span><div><strong>{order.customer}</strong><span>{order.id} · {order.item}</span></div></div><div className="mini-order-side"><strong>{formatINR(order.amount)}</strong><StatusBadge status={order.status} /></div></div>)}</div>
      </SectionCard>
      <SectionCard title="Top sellers" eyebrow="By units sold">
        <div className="inventory-list">{products.slice(0, 4).map((product, index) => <div className="inventory-item" key={product.id}><span className="top-rank">0{index + 1}</span><span className="product-swatch small-swatch" style={{ background: product.accent }}>{product.initials}</span><div className="inventory-copy"><strong>{product.name}</strong><span>{topSellerUnits[index]} units sold this month</span></div><Trophy size={14} className="trophy-icon" /></div>)}</div>
      </SectionCard>
      <SectionCard title="Activity log" eyebrow="Store events">
        <div className="activity-list">{activity.map((entry) => { const Icon = activityIcons[entry.type as keyof typeof activityIcons]; return <div className="activity-item" key={entry.label}><span className={`activity-icon activity-${entry.type}`}><Icon size={15} /></span><div><strong>{entry.label}</strong><span>{entry.detail}</span></div><time>{entry.time}</time></div>; })}</div>
      </SectionCard>
    </div>
  </div>;
}
