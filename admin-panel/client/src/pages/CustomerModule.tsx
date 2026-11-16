import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Download, Mail, MoreHorizontal, Pencil, Phone, Plus, Search, Save } from "lucide-react";
import { toast } from "sonner";
import { formatINR } from "@/data/mockData";
import { Badge, Button, EmptyState, LoadingState, SectionCard, SelectField, SortIcon } from "@/components/admin/Primitives";
import type { AccountStatus, CustomerRecord } from "@/types/admin";

type CustomerView = { mode: "list" } | { mode: "detail"; customerId: string };

function formatCustomerName(name?: string): string {
  if (!name) return "Customer";
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export default function CustomerModule() {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<CustomerView>({ mode: "list" });
  const [query, setQuery] = useState("");
  const [segment, setSegment] = useState("All segments");
  const [status, setStatus] = useState("All statuses");
  const [sort, setSort] = useState<{ key: "name" | "joined" | "orders" | "spent"; direction: "asc" | "desc" } | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const saved = localStorage.getItem("hcs_admin_user");
      const token = saved ? JSON.parse(saved)?.token : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("http://localhost:5000/api/admin/customers", {
        credentials: "include",
        headers,
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setCustomers(json.data);
      } else {
        setCustomers([]);
      }
    } catch (err) {
      console.error("Failed to load customers from database:", err);
      toast.error("Could not load registered customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleUpdate = async (customerId: string, patch: Partial<CustomerRecord>) => {
    setCustomers((current) =>
      current.map((item) => (item.id === customerId ? { ...item, ...patch } : item))
    );

    try {
      const saved = localStorage.getItem("hcs_admin_user");
      const token = saved ? JSON.parse(saved)?.token : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      await fetch(`http://localhost:5000/api/admin/customers/${customerId}`, {
        method: "PATCH",
        credentials: "include",
        headers,
        body: JSON.stringify(patch),
      });
      toast.success("Customer record updated");
    } catch {
      toast.error("Failed to persist customer updates");
    }
  };

  const filtered = useMemo(() => {
    const needle = query.toLowerCase().trim();
    const result = customers.filter(
      (customer) =>
        (!needle || `${customer.name} ${customer.email} ${customer.mobile}`.toLowerCase().includes(needle)) &&
        (segment === "All segments" || customer.segment === segment) &&
        (status === "All statuses" || customer.status === status)
    );
    if (!sort) return result;
    return [...result].sort(
      (a, b) => String(a[sort.key]).localeCompare(String(b[sort.key]), undefined, { numeric: true }) * (sort.direction === "asc" ? 1 : -1)
    );
  }, [customers, query, segment, sort, status]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const toggleSort = (key: "name" | "joined" | "orders" | "spent") =>
    setSort((current) => (current?.key === key ? { key, direction: current.direction === "asc" ? "desc" : "asc" } : { key, direction: "asc" }));

  if (view.mode === "detail") {
    const customer = customers.find((item) => item.id === view.customerId);
    if (!customer) return <EmptyState title="Customer not found" description="This customer record could not be loaded." />;
    return <CustomerDetails customer={customer} onBack={() => setView({ mode: "list" })} onUpdate={(patch) => handleUpdate(customer.id, patch)} />;
  }

  return (
    <div className="resource-page phase3-page customer-module-page">
      <div className="page-heading">
        <div><h1>Customers</h1></div>
        <div className="heading-actions">
          <Button variant="outline" size="sm" onClick={() => toast.success("Customer export prepared")}>
            <Download size={15} /> Export
          </Button>
          <Button size="sm" onClick={() => toast.success("Customer invitation workspace opened")}>
            <Plus size={15} /> Add customer
          </Button>
        </div>
      </div>
      <SectionCard title="All customers" action={<span className="table-summary">{customers.length} registered customers</span>}>
        <div className="table-toolbar phase2-toolbar">
          <div className="toolbar-filters">
            <label className="search-field">
              <Search size={16} />
              <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search name, email or mobile" />
            </label>
            <SelectField value={segment} onChange={(value) => { setSegment(value); setPage(1); }} options={["All segments", "Retail", "Trade", "Club"]} />
            <SelectField value={status} onChange={(value) => { setStatus(value); setPage(1); }} options={["All statuses", "Active", "Invited", "Suspended"]} />
          </div>
        </div>
        {loading ? (
          <LoadingState label="Loading registered customers from database..." />
        ) : (
          <>
            <div className="responsive-table">
              <table className="data-table customers-table">
                <thead>
                  <tr>
                    <SortableHeader label="Customer" sort={sort} sortKey="name" onSort={toggleSort} />
                    <th>Email</th>
                    <th>Mobile</th>
                    <SortableHeader label="Registered" sort={sort} sortKey="joined" onSort={toggleSort} />
                    <SortableHeader label="Orders" sort={sort} sortKey="orders" onSort={toggleSort} />
                    <SortableHeader label="Total spending" sort={sort} sortKey="spent" onSort={toggleSort} />
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {paged.map((customer) => (
                    <tr key={customer.id}>
                      <td>
                        <button className="person-cell table-link-button" onClick={() => setView({ mode: "detail", customerId: customer.id })}>
                          <span className="table-avatar avatar-1">{customer.initials}</span>
                          <span className="customer-row-name">{formatCustomerName(customer.name)}</span>
                        </button>
                      </td>
                      <td className="muted-cell">{customer.email}</td>
                      <td className="muted-cell">{customer.mobile}</td>
                      <td>{customer.joined}</td>
                      <td className="strong-cell">{customer.orders}</td>
                      <td className="strong-cell">{formatINR(customer.spent)}</td>
                      <td><AccountBadge status={customer.status} /></td>
                      <td>
                        <button className="row-action" onClick={() => setView({ mode: "detail", customerId: customer.id })} aria-label={`View ${customer.name}`}>
                          <MoreHorizontal size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {paged.length === 0 && (
                <EmptyState title="No customers found" description="When users register via the storefront, their accounts will appear here automatically." />
              )}
            </div>
            <div className="table-footer">
              <span>Showing {filtered.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}</span>
              <div className="pagination">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                  <ChevronLeft size={14} />
                </Button>
                <span>Page {page} of {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
                  <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          </>
        )}
      </SectionCard>
    </div>
  );
}

function SortableHeader({ label, sort, sortKey, onSort }: { label: string; sort: { key: "name" | "joined" | "orders" | "spent"; direction: "asc" | "desc" } | null; sortKey: "name" | "joined" | "orders" | "spent"; onSort: (key: "name" | "joined" | "orders" | "spent") => void }) {
  return (
    <th>
      <button className="sort-header" onClick={() => onSort(sortKey)}>
        {label}
        <SortIcon direction={sort?.key === sortKey ? sort.direction : null} />
      </button>
    </th>
  );
}

function AccountBadge({ status }: { status: AccountStatus }) {
  const tone = status === "Active" ? "green" : status === "Invited" ? "gold" : "red";
  return <Badge tone={tone}>{status}</Badge>;
}

function CustomerDetails({ customer, onBack, onUpdate }: { customer: CustomerRecord; onBack: () => void; onUpdate: (patch: Partial<CustomerRecord>) => void }) {
  const [editingNote, setEditingNote] = useState(false);
  const [note, setNote] = useState(customer.notes || "");

  return (
    <div className="customer-detail-page">
      <button className="back-link" onClick={onBack}>
        <ArrowLeft size={15} /> Back to customers
      </button>
      <div className="detail-heading">
        <div><h1>{formatCustomerName(customer.name)}</h1></div>
        <div className="heading-actions">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onUpdate({ status: customer.status === "Active" ? "Suspended" : "Active" });
            }}
          >
            {customer.status === "Active" ? "Suspend account" : "Activate account"}
          </Button>
          <Button size="sm" onClick={() => toast.success("Customer contact workspace ready")}>
            <Pencil size={15} /> Edit customer
          </Button>
        </div>
      </div>
      <div className="customer-summary">
        <div className="customer-identity">
          <span className="customer-avatar">{customer.initials}</span>
          <div>
            <span className="customer-identity-name">{formatCustomerName(customer.name)}</span>
            <span>{customer.segment} account · {customer.mobile}</span>
            <AccountBadge status={customer.status} />
          </div>
        </div>
        <div className="customer-stat">
          <span>Total orders</span>
          <strong>{customer.orders}</strong>
        </div>
        <div className="customer-stat">
          <span>Total spending</span>
          <strong>{formatINR(customer.spent)}</strong>
        </div>
        <div className="customer-actions">
          <button onClick={() => { if (customer.email && customer.email !== "Not provided") window.open(`mailto:${customer.email}`); else toast.error("No email on file"); }}>
            <Mail size={14} /> Email
          </button>
          <button onClick={() => { if (customer.mobile && customer.mobile !== "Not provided") window.open(`tel:${customer.mobile}`); else toast.error("No phone on file"); }}>
            <Phone size={14} /> Call
          </button>
        </div>
      </div>
      <div className="customer-detail-grid">
        <div className="customer-main">
          <SectionCard title="Order history">
            <EmptyState
              title="No orders placed yet"
              description="Orders placed by this customer on the storefront will automatically appear here."
            />
          </SectionCard>
          <SectionCard title="Recent activity">
            <div className="customer-activity">
              {customer.recentActivity.map((activity) => (
                <div key={activity.label}>
                  <span className="activity-dot" />
                  <div>
                    <strong>{activity.label}</strong>
                    <span>{activity.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
        <aside className="customer-side">
          <SectionCard title="Contact information">
            <div className="info-list">
              <div><span>Email</span><strong>{customer.email}</strong></div>
              <div><span>Mobile</span><strong>{customer.mobile}</strong></div>
              <div><span>Segment</span><strong>{customer.segment}</strong></div>
              <div><span>Registered</span><strong>{customer.joined}</strong></div>
            </div>
          </SectionCard>
          <SectionCard title="Saved addresses">
            {customer.addresses && customer.addresses.length > 0 ? (
              <div className="address-list">
                {customer.addresses.map((address) => (
                  <div key={address.label}>
                    <strong>{address.label}</strong>
                    <p>{address.address}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="customer-note" style={{ color: "#8d9991", fontStyle: "italic" }}>
                No delivery addresses added yet.
              </p>
            )}
          </SectionCard>
          <SectionCard
            title="Internal notes"
            action={
              <button className="row-action" onClick={() => setEditingNote(true)} aria-label="Edit internal note">
                <Pencil size={14} />
              </button>
            }
          >
            {editingNote ? (
              <div className="note-editor">
                <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={4} />
                <div>
                  <Button variant="outline" size="sm" onClick={() => setEditingNote(false)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      onUpdate({ notes: note });
                      setEditingNote(false);
                      toast.success("Customer note saved to database");
                    }}
                  >
                    <Save size={13} /> Save
                  </Button>
                </div>
              </div>
            ) : (
              <p className="customer-note">{customer.notes || "No internal notes for this customer."}</p>
            )}
          </SectionCard>
        </aside>
      </div>
    </div>
  );
}
