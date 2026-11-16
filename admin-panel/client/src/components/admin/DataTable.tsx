import { useMemo, useState } from "react";
import { MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { Button, EmptyState, SearchField, SelectField, SortIcon, StatusBadge, TableToolbar } from "@/components/admin/Primitives";
import type { Customer, Order, Product } from "@/types/admin";
import { customers, formatINR, orders, products } from "@/data/mockData";

type Resource = "orders" | "products" | "customers";
type Props = { resource: Resource };
type SortState = { key: string; direction: "asc" | "desc" } | null;

const initialsClass = (initials: string) => `table-avatar avatar-${initials.charCodeAt(0) % 4}`;

export function DataTable({ resource }: Props) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All statuses");
  const [sort, setSort] = useState<SortState>(null);
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const data = resource === "orders" ? orders : resource === "products" ? products : customers;
  const filtered = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    const rows = data.filter((row) => {
      const haystack = Object.values(row).join(" ").toLowerCase();
      const matchesQuery = !normalized || haystack.includes(normalized);
      const matchesFilter = filter === "All statuses" || Object.values(row).includes(filter);
      return matchesQuery && matchesFilter;
    });
    if (!sort) return rows;
    return [...rows].sort((a, b) => {
      const aValue = String(a[sort.key as keyof typeof a]);
      const bValue = String(b[sort.key as keyof typeof b]);
      return aValue.localeCompare(bValue, undefined, { numeric: true }) * (sort.direction === "asc" ? 1 : -1);
    });
  }, [data, filter, query, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const filterOptions = resource === "orders" ? ["All statuses", "Paid", "Pending", "Fulfilled", "Cancelled"] : resource === "products" ? ["All statuses", "In stock", "Low stock", "Out of stock"] : ["All statuses", "Retail", "Trade", "Club"];
  const updateSort = (key: string) => setSort((current) => current?.key === key ? { key, direction: current.direction === "asc" ? "desc" : "asc" } : { key, direction: "asc" });

  return <div className="data-table-wrap"><TableToolbar><SearchField value={query} onChange={(value) => { setQuery(value); setPage(1); }} placeholder={`Search ${resource}`} /><SelectField value={filter} onChange={(value) => { setFilter(value); setPage(1); }} options={filterOptions} /></TableToolbar><div className="responsive-table"><table className="data-table"><thead>{resource === "orders" ? <tr><SortableHeader label="Order" sort={sort} onSort={updateSort} sortKey="id" /><SortableHeader label="Customer" sort={sort} onSort={updateSort} sortKey="customer" /><SortableHeader label="Date" sort={sort} onSort={updateSort} sortKey="date" /><SortableHeader label="Total" sort={sort} onSort={updateSort} sortKey="amount" /><SortableHeader label="Status" sort={sort} onSort={updateSort} sortKey="status" /><th /></tr> : resource === "products" ? <tr><SortableHeader label="Product" sort={sort} onSort={updateSort} sortKey="name" /><SortableHeader label="Category" sort={sort} onSort={updateSort} sortKey="category" /><SortableHeader label="SKU" sort={sort} onSort={updateSort} sortKey="sku" /><SortableHeader label="Price" sort={sort} onSort={updateSort} sortKey="price" /><SortableHeader label="Inventory" sort={sort} onSort={updateSort} sortKey="inventory" /><SortableHeader label="Status" sort={sort} onSort={updateSort} sortKey="status" /><th /></tr> : <tr><SortableHeader label="Customer" sort={sort} onSort={updateSort} sortKey="name" /><SortableHeader label="Email" sort={sort} onSort={updateSort} sortKey="email" /><SortableHeader label="Orders" sort={sort} onSort={updateSort} sortKey="orders" /><SortableHeader label="Total spent" sort={sort} onSort={updateSort} sortKey="spent" /><SortableHeader label="Segment" sort={sort} onSort={updateSort} sortKey="segment" /><th /></tr>}</thead><tbody>{visible.map((row) => resource === "orders" ? <OrderRow key={row.id} row={row as Order} /> : resource === "products" ? <ProductRow key={row.id} row={row as Product} /> : <CustomerRow key={row.id} row={row as Customer} />)}</tbody></table>{visible.length === 0 && <EmptyState title="No records found" description="Try a different search or filter to see more store records." />}</div><div className="table-footer"><span>Showing {visible.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}</span><div className="pagination"><Button variant="outline" size="sm" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}><ChevronLeft size={15} /></Button><span>Page {page} of {totalPages}</span><Button variant="outline" size="sm" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages}><ChevronRight size={15} /></Button></div></div></div>;
}

function SortableHeader({ label, sort, onSort, sortKey }: { label: string; sort: SortState; onSort: (key: string) => void; sortKey: string }) {
  return <th><button className="sort-header" onClick={() => onSort(sortKey)}>{label}<SortIcon direction={sort?.key === sortKey ? sort.direction : null} /></button></th>;
}

function OrderRow({ row }: { row: Order }) {
  return <tr><td className="strong-cell">{row.id}</td><td><div className="person-cell"><span className={initialsClass(row.initials)}>{row.initials}</span><div><strong>{row.customer}</strong><span>{row.item}</span></div></div></td><td className="muted-cell">{row.date}</td><td className="strong-cell">{formatINR(row.amount)}</td><td><StatusBadge status={row.status} /></td><td><button className="row-action" aria-label={`Actions for ${row.id}`}><MoreHorizontal size={17} /></button></td></tr>;
}

function ProductRow({ row }: { row: Product }) {
  return <tr><td><div className="product-cell"><span className="product-swatch" style={{ background: row.accent }}>{row.initials}</span><div><strong>{row.name}</strong><span>{row.sku}</span></div></div></td><td>{row.category}</td><td className="muted-cell">{row.sku}</td><td className="strong-cell">{formatINR(row.price)}</td><td className={row.inventory < 10 ? "inventory-low" : ""}>{row.inventory} units</td><td><StatusBadge status={row.status} /></td><td><button className="row-action" aria-label={`Actions for ${row.name}`}><MoreHorizontal size={17} /></button></td></tr>;
}

function CustomerRow({ row }: { row: Customer }) {
  return <tr><td><div className="person-cell"><span className={initialsClass(row.initials)}>{row.initials}</span><div><strong>{row.name}</strong><span>Joined {row.joined}</span></div></div></td><td className="muted-cell">{row.email}</td><td>{row.orders}</td><td className="strong-cell">{formatINR(row.spent)}</td><td><span className="segment-label">{row.segment}</span></td><td><button className="row-action" aria-label={`Actions for ${row.name}`}><MoreHorizontal size={17} /></button></td></tr>;
}
