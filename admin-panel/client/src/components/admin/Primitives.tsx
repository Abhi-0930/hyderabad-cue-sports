import type { ButtonHTMLAttributes, ReactNode } from "react";
import { ChevronDown, ChevronUp, Search, SlidersHorizontal } from "lucide-react";
import type { OrderStatus, InventoryStatus } from "@/types/admin";

export function Button({ children, variant = "primary", size = "md", className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "outline" | "danger"; size?: "sm" | "md" }) {
  return <button className={`ui-button ui-button-${variant} ui-button-${size} ${className}`} {...props}>{children}</button>;
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "green" | "gold" | "red" | "neutral" | "blue" }) {
  return <span className={`status-badge status-${tone}`}><span className="status-dot" />{children}</span>;
}

export function StatusBadge({ status }: { status: OrderStatus | InventoryStatus }) {
  const tone = status === "Paid" || status === "Fulfilled" || status === "In stock" ? "green" : status === "Pending" || status === "Low stock" ? "gold" : status === "Cancelled" || status === "Out of stock" ? "red" : "neutral";
  return <Badge tone={tone}>{status}</Badge>;
}

export function SearchField({ value, onChange, placeholder = "Search" }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="search-field"><Search size={16} /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-label={placeholder} /></label>;
}

export function SelectField({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[] }) {
  return <label className="select-field"><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select><ChevronDown size={14} /></label>;
}

export function SectionCard({ title, eyebrow, action, children, className = "" }: { title: string; eyebrow?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`section-card ${className}`}><div className="section-card-header"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2>{title}</h2></div>{action}</div>{children}</section>;
}

export function MetricCard({ label, value, change, detail, icon, accent = "forest" }: { label: string; value: string; change: string; detail: string; icon: ReactNode; accent?: "forest" | "gold" | "ivory" | "red" }) {
  return <article className={`metric-card metric-${accent}`}><div className="metric-card-top"><div className="metric-icon">{icon}</div><span className={change.startsWith("−") ? "metric-change down" : "metric-change"}>{change}</span></div><p className="metric-label">{label}</p><p className="metric-value">{value}</p><p className="metric-detail">{detail}</p></article>;
}

export function SortIcon({ direction }: { direction: "asc" | "desc" | null }) {
  return direction === "asc" ? <ChevronUp size={14} /> : direction === "desc" ? <ChevronDown size={14} /> : <span className="sort-neutral">↕</span>;
}

export function TableToolbar({ children, filterLabel = "Filters" }: { children: ReactNode; filterLabel?: string }) {
  return <div className="table-toolbar"><div className="toolbar-filters"><button className="filter-button"><SlidersHorizontal size={15} />{filterLabel}</button>{children}</div></div>;
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="empty-state"><div className="empty-state-mark">—</div><h3>{title}</h3><p>{description}</p></div>;
}

export function LoadingState({ label = "Loading your store" }: { label?: string }) {
  return <div className="loading-state"><span className="loading-spinner" />{label}</div>;
}

export function Tabs({ items, value, onChange }: { items: { label: string; value: string }[]; value: string; onChange: (value: string) => void }) {
  return <div className="tabs" role="tablist">{items.map((item) => <button key={item.value} className={`tab ${value === item.value ? "tab-active" : ""}`} role="tab" aria-selected={value === item.value} onClick={() => onChange(item.value)}>{item.label}</button>)}</div>;
}

export function DropdownActions({ label = "Actions", children }: { label?: string; children: ReactNode }) {
  return <details className="dropdown-actions"><summary>{label}<ChevronDown size={14} /></summary><div className="dropdown-menu">{children}</div></details>;
}
