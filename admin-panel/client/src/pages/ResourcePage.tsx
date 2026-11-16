import { Plus, Download } from "lucide-react";
import { Button, SectionCard } from "@/components/admin/Primitives";
import { DataTable } from "@/components/admin/DataTable";
import type { NavKey } from "@/types/admin";

type ResourceKey = Extract<NavKey, "orders" | "customers">;
const pageCopy: Record<ResourceKey, { eyebrow: string; title: string; description: string; action: string }> = {
  orders: { eyebrow: "Commerce", title: "Orders", description: "Track payments, fulfillment, and every cue sports purchase in one place.", action: "Create order" },
  customers: { eyebrow: "Relationships", title: "Customers", description: "Keep a clear view of the players, clubs, and trade partners you serve.", action: "Add customer" },
};

export default function ResourcePage({ resource }: { resource: ResourceKey }) {
  const copy = pageCopy[resource];
  return <div className="resource-page"><div className="page-heading"><div><p className="eyebrow">{copy.eyebrow}</p><h1>{copy.title}</h1><p className="page-subtitle">{copy.description}</p></div><div className="heading-actions"><Button variant="outline" size="sm"><Download size={15} /> Export</Button><Button size="sm"><Plus size={15} /> {copy.action}</Button></div></div><SectionCard title={`All ${resource}`} action={<span className="table-summary">Updated a few seconds ago</span>}><DataTable resource={resource} /></SectionCard></div>;
}
