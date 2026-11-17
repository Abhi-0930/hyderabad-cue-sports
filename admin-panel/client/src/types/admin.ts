export type NavKey = "dashboard" | "orders" | "products" | "customers" | "categories" | "inventory" | "cms";

export type OrderStatus = "Paid" | "Pending" | "Fulfilled" | "Cancelled";
export type InventoryStatus = "In stock" | "Low stock" | "Out of stock";
export type PublicationStatus = "Published" | "Draft";
export type WorkflowOrderStatus = "Pending" | "Confirmed" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
export type PaymentStatus = "Paid" | "Pending" | "Refunded" | "Partially refunded";
export type AccountStatus = "Active" | "Invited" | "Suspended";
export type ReturnStatus = "Requested" | "Approved" | "Rejected" | "Refunded";

export type Product = {
  id: string;
  name: string;
  category: string;
  sku: string;
  price: number;
  inventory: number;
  status: InventoryStatus;
  accent: string;
  initials: string;
};

export type ProductVariant = {
  id: string;
  name: string;
  sku: string;
  price: number;
  inventory: number;
  availability: "In stock" | "Out of stock" | "Pre-order";
};

export type ProductRecord = Product & {
  salePrice: number;
  publication: PublicationStatus;
  brand: string;
  subcategory: string;
  shortDescription: string;
  description: string;
  tax: "GST 5%" | "GST 12%" | "GST 18%" | "Exempt";
  lowStockThreshold: number;
  weight: string;
  dimensions: string;
  specs: Record<string, string>;
  featured: boolean;
  bestseller: boolean;
  newArrival: boolean;
  seoTitle: string;
  seoDescription: string;
  slug: string;
  imageCount: number;

  // Extended 10-step Add Product fields
  productType?: "Physical Product" | "Digital Product" | "Service";
  collection?: string;
  images?: string[];
  primaryImage?: string;
  imageAltText?: string;
  videoUrl?: string;
  platformFeeType?: "Percentage" | "Fixed";
  platformFeeValue?: number;
  feeMode?: "on_top" | "deducted";
  trackStock?: boolean;
  allowBackorders?: boolean;
  minOrderQuantity?: number;
  variants?: ProductVariant[];
  customSpecs?: { label: string; value: string }[];
  shippingSkip?: boolean;
  shippingClass?: "Standard" | "Heavy / Oversized" | "Fragile";
  deliveryType?: "Standard Delivery" | "Express Delivery" | "Special Delivery";
  installationRequired?: boolean;
  installationType?: string;
  shippingCharges?: "Free Shipping" | "Fixed Charge" | "Calculated at Checkout";
  warrantyInfo?: string;
  returnEligibility?: string;
  measurementUnit?: "cm" | "mm" | "inches";
  packageLength?: string;
  packageWidth?: string;
  packageHeight?: string;
  focusKeyword?: string;
  canonicalUrl?: string;
  searchEngineVisibility?: "Index" | "No Index";
};

export type Category = {
  id: string;
  name: string;
  description: string;
  parentId: string | null;
  slug: string;
  displayOrder: number;
  active: boolean;
  productCount: number;
  imageAccent: string;
  initials: string;
};

export type InventoryRecord = {
  productId: string;
  available: number;
  reserved: number;
  threshold: number;
};

export type StockMovement = {
  id: string;
  productId: string;
  productName: string;
  type: "Stock added" | "Stock removed" | "Manual adjustment";
  quantity: number;
  reason: string;
  date: string;
  by: string;
};

export type Order = {
  id: string;
  customer: string;
  date: string;
  item: string;
  amount: number;
  status: OrderStatus;
  initials: string;
};

export type OrderLine = {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  accent: string;
  initials: string;
};

export type OrderRecord = {
  id: string;
  customerId: string;
  customer: string;
  email: string;
  mobile: string;
  orderDate: string;
  items: OrderLine[];
  subtotal: number;
  gst: number;
  shipping: number;
  total: number;
  paymentStatus: PaymentStatus;
  orderStatus: WorkflowOrderStatus;
  paymentMethod: string;
  transactionId: string;
  billingAddress: string;
  shippingAddress: string;
  courier: string;
  trackingNumber: string;
  timeline: { label: string; detail: string; date: string; done: boolean }[];
};

export type ReturnRequest = {
  id: string;
  orderId: string;
  customer: string;
  product: string;
  reason: string;
  amount: number;
  requestedAt: string;
  status: ReturnStatus;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  orders: number;
  spent: number;
  joined: string;
  segment: "Retail" | "Trade" | "Club";
  initials: string;
};

export type CustomerRecord = Customer & {
  mobile: string;
  status: AccountStatus;
  addresses: { label: string; address: string }[];
  notes: string;
  recentActivity: { label: string; date: string }[];
};

export type NavItem = {
  key: NavKey;
  label: string;
  description: string;
};
