import type { Customer, Order, Product } from "@/types/admin";

export const products: Product[] = [
  { id: "prod-1", name: "HCS Heritage Cue — 3/4 Joint", category: "Cues", sku: "HCS-HER-34", price: 18990, inventory: 8, status: "Low stock", accent: "#d8b66d", initials: "HC" },
  { id: "prod-2", name: "Aramith Tournament Pro 57.2mm", category: "Balls", sku: "ARA-TOUR-572", price: 12490, inventory: 24, status: "In stock", accent: "#ccddd5", initials: "AP" },
  { id: "prod-3", name: "Riley Clubman 7ft Table", category: "Tables", sku: "RLY-CLB-7FT", price: 184900, inventory: 3, status: "Low stock", accent: "#c5d6c3", initials: "RC" },
  { id: "prod-4", name: "Strachan 6811 Championship Cloth", category: "Cloth", sku: "STR-6811-GRN", price: 8990, inventory: 16, status: "In stock", accent: "#8fb29e", initials: "SC" },
  { id: "prod-5", name: "Peradon Luxury Cue Case", category: "Cases", sku: "PER-LUX-2C", price: 6490, inventory: 0, status: "Out of stock", accent: "#dbbba2", initials: "PL" },
  { id: "prod-6", name: "Master Chalk — Green (Box of 12)", category: "Chalk", sku: "MAS-GRN-12", price: 1490, inventory: 42, status: "In stock", accent: "#b6c8bd", initials: "MC" },
  { id: "prod-7", name: "HCS Precision Tip Tool", category: "Accessories", sku: "HCS-TIP-01", price: 990, inventory: 31, status: "In stock", accent: "#d2d7cf", initials: "PT" },
  { id: "prod-8", name: "Strachan Ironing Cloth Roller", category: "Accessories", sku: "STR-ROL-01", price: 3490, inventory: 6, status: "Low stock", accent: "#c2b98b", initials: "IR" },
];

export const orders: Order[] = [
  { id: "#HCS-1048", customer: "Arjun Rao", date: "Today, 10:24 AM", item: "HCS Heritage Cue", amount: 18990, status: "Paid", initials: "AR" },
  { id: "#HCS-1047", customer: "Cue Culture Hyderabad", date: "Today, 09:16 AM", item: "Riley Clubman 7ft Table", amount: 184900, status: "Pending", initials: "CC" },
  { id: "#HCS-1046", customer: "Meghana S.", date: "Yesterday, 05:42 PM", item: "Aramith Tournament Pro", amount: 12490, status: "Fulfilled", initials: "MS" },
  { id: "#HCS-1045", customer: "Kiran Billiards Club", date: "Yesterday, 02:10 PM", item: "Championship Cloth", amount: 8990, status: "Paid", initials: "KB" },
  { id: "#HCS-1044", customer: "Siddharth Menon", date: "12 Nov, 11:32 AM", item: "Peradon Cue Case", amount: 6490, status: "Cancelled", initials: "SM" },
  { id: "#HCS-1043", customer: "Ananya Kapoor", date: "11 Nov, 04:18 PM", item: "Master Chalk Box", amount: 1490, status: "Fulfilled", initials: "AK" },
];

export const customers: Customer[] = [
  { id: "cust-1", name: "Cue Culture Hyderabad", email: "buying@cueculture.in", orders: 14, spent: 422800, joined: "18 Feb 2024", segment: "Club", initials: "CC" },
  { id: "cust-2", name: "Arjun Rao", email: "arjun.rao@email.com", orders: 8, spent: 86540, joined: "04 Mar 2024", segment: "Retail", initials: "AR" },
  { id: "cust-3", name: "Kiran Billiards Club", email: "admin@kiranbilliards.in", orders: 7, spent: 198450, joined: "22 Apr 2024", segment: "Club", initials: "KB" },
  { id: "cust-4", name: "Meghana S.", email: "meghana.s@email.com", orders: 5, spent: 32780, joined: "13 May 2024", segment: "Retail", initials: "MS" },
  { id: "cust-5", name: "The Green Baize", email: "hello@greenbaize.in", orders: 4, spent: 71900, joined: "29 Jun 2024", segment: "Trade", initials: "GB" },
  { id: "cust-6", name: "Siddharth Menon", email: "sid.menon@email.com", orders: 3, spent: 19640, joined: "09 Jul 2024", segment: "Retail", initials: "SM" },
];

export const salesTrend = [
  { month: "Jun", revenue: 268000, orders: 21 },
  { month: "Jul", revenue: 314000, orders: 26 },
  { month: "Aug", revenue: 286000, orders: 23 },
  { month: "Sep", revenue: 402000, orders: 34 },
  { month: "Oct", revenue: 458000, orders: 39 },
  { month: "Nov", revenue: 512000, orders: 46 },
];

export const categoryPerformance = [
  { category: "Cues", revenue: 208400, share: 38 },
  { category: "Tables", revenue: 136900, share: 25 },
  { category: "Accessories", revenue: 87200, share: 16 },
  { category: "Cloth", revenue: 65300, share: 12 },
  { category: "Balls", revenue: 48700, share: 9 },
];

export const revenueBreakdown = [
  { name: "Cues", value: 38, color: "#164B38" },
  { name: "Tables", value: 25, color: "#C9A451" },
  { name: "Accessories", value: 16, color: "#8FAE9C" },
  { name: "Cloth", value: 12, color: "#D2B879" },
  { name: "Balls", value: 9, color: "#B6C8BD" },
];

export const activity = [
  { label: "New club account created", detail: "Cue Culture Hyderabad", time: "18 min ago", type: "customer" },
  { label: "Inventory received", detail: "24 × Aramith Tournament Pro", time: "1 hr ago", type: "inventory" },
  { label: "Order marked fulfilled", detail: "#HCS-1046 · Meghana S.", time: "2 hrs ago", type: "order" },
  { label: "Payment captured", detail: "#HCS-1048 · ₹18,990", time: "3 hrs ago", type: "payment" },
];

export const formatINR = (value: number, compact = false) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
    notation: compact ? "compact" : "standard",
  }).format(value);
