import { useEffect, useMemo, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Check, ChevronDown, ChevronUp, Search, SlidersHorizontal } from "lucide-react";
import type { OrderStatus, InventoryStatus } from "@/types/admin";

export type SelectOption = string | { label: string; value: string };

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

export function Checkbox({
  checked,
  onChange,
  label,
  description,
  id,
  disabled = false,
  card = false,
  className = "",
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  description?: ReactNode;
  id?: string;
  disabled?: boolean;
  card?: boolean;
  className?: string;
}) {
  return (
    <label
      className={`custom-checkbox-wrap ${card ? "is-card" : ""} ${checked ? "is-checked" : ""} ${
        disabled ? "is-disabled" : ""
      } ${className}`}
    >
      <span className="custom-checkbox-control">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="custom-checkbox-input"
        />
        <span className="custom-checkbox-box">
          <Check size={12} strokeWidth={3} className="custom-checkbox-icon" />
        </span>
      </span>
      {(label || description) && (
        <span className="custom-checkbox-content">
          {label && <span className="custom-checkbox-label">{label}</span>}
          {description && <span className="custom-checkbox-desc">{description}</span>}
        </span>
      )}
    </label>
  );
}

export function SearchField({ value, onChange, placeholder = "Search" }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="search-field"><Search size={16} /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-label={placeholder} /></label>;
}

export function SelectField({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  className = "",
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const normalizedOptions = useMemo(() => {
    return options.map((opt) =>
      typeof opt === "string" ? { label: opt, value: opt } : opt
    );
  }, [options]);

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className={`custom-select-container ${isOpen ? "open" : ""} ${disabled ? "disabled" : ""} ${className}`}
    >
      <button
        type="button"
        className="custom-select-trigger"
        onMouseDown={(e) => {
          // Prevent stealing focus/selection from active inputs or contentEditable
          e.preventDefault();
        }}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
      >
        <span className={`custom-select-value ${!selectedOption && !value ? "placeholder" : ""}`}>
          {selectedOption ? selectedOption.label : value || placeholder}
        </span>
        <ChevronDown size={14} className="custom-select-chevron" />
      </button>

      {isOpen && (
        <div className="custom-select-menu" role="listbox">
          {normalizedOptions.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`custom-select-item ${isSelected ? "selected" : ""}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                }}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
              >
                <span className="custom-select-item-label">{opt.label}</span>
                {isSelected && <Check size={14} className="custom-select-check" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function SectionCard({ title, eyebrow, action, children, className = "" }: { title: string; eyebrow?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`section-card ${className}`}><div className="section-card-header"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2>{title}</h2></div>{action}</div>{children}</section>;
}

export function MetricCard({ label, value, change, detail, icon, accent = "forest" }: { label: string; value: string; change: string; detail?: string; icon: ReactNode; accent?: "forest" | "gold" | "ivory" | "red" }) {
  return <article className={`metric-card metric-${accent}`}><div className="metric-card-top"><div className="metric-icon">{icon}</div><span className={change.startsWith("−") ? "metric-change down" : "metric-change"}>{change}</span></div><p className="metric-label">{label}</p><p className="metric-value">{value}</p>{detail && <p className="metric-detail">{detail}</p>}</article>;
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
