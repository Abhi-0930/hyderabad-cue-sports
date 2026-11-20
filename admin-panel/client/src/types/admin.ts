export type NavKey = "dashboard" | "orders" | "products" | "customers" | "categories" | "inventory" | "cms";

export type OrderStatus = "Paid" | "Pending" | "Fulfilled" | "Cancelled";
export type InventoryStatus = "In stock" | "Low stock" | "Out of stock";
export type PublicationStatus = "Published" | "Draft";
export type WorkflowOrderStatus = "Pending" | "Confirmed" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
export type PaymentStatus = "Paid" | "Pending" | "Refunded" | "Partially refunded";
export type AccountStatus = "Active" | "Invited" | "Suspended";
export type ReturnStatus = "Requested" | "Approved" | "Rejected" | "Refunded";

export type ProductType = "Simple" | "Variable" | "Made-to-Order" | "Bundle" | "Service" | "Physical Product" | "Digital Product";
export type SalesMode = "Buy Now" | "Request a Quote" | "Hybrid" | "Booking with Advance";
export type ProductApprovalStatus = "Draft" | "In Review" | "Scheduled" | "Published" | "Archived";
export type ProductVisibility = "Public" | "Hidden" | "B2B Only";

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
  image?: string;
};

export type ConfiguratorOption = {
  id: string;
  category: string;
  label: string;
  priceDelta: number;
  leadTimeDeltaDays: number;
};

export type B2BPriceTier = {
  minQty: number;
  maxQty: number;
  discountPercent: number;
  customerGroup: string;
};

export type ShippingCrate = {
  id: string;
  label: string;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
};

export type MediaItem = {
  url: string;
  tag: "Hero" | "Detail / Macro" | "Lifestyle" | "Dimension Diagram" | "360° Spin";
  altText: string;
};

export type DownloadableDoc = {
  id: string;
  title: string;
  type: string;
  url: string;
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

  // Extended 12-step Wizard Fields
  productType?: ProductType;
  salesMode?: SalesMode;
  modelName?: string;
  gtinBarcode?: string;
  countryOfOrigin?: string;
  manufacturerDetails?: string;
  netQuantity?: string;
  internalNotes?: string;
  approvalStatus?: ProductApprovalStatus;

  // Category & Organisation
  collection?: string;
  gameTypes?: string[];
  customerSegments?: string[];
  productBadges?: string[];
  bestsellerOverride?: "auto" | "force_on" | "force_off";
  newArrivalOverride?: "auto" | "force_on" | "force_off";

  // Specifications
  specVisibility?: Record<string, { showOnStorefront: boolean; useAsFilter: boolean }>;
  customSpecs?: { label: string; value: string }[];
  customSpecsList?: {
    label: string;
    value: string;
    unit?: string;
    group?: string;
    showOnStorefront?: boolean;
    useAsFilter?: boolean;
  }[];

  // Variants & Configurator
  variants?: ProductVariant[];
  configuratorOptions?: ConfiguratorOption[];

  // Pricing, Tax & India Compliance
  mrp?: number;
  costPrice?: number;
  saleStartDate?: string;
  saleEndDate?: string;
  priceOnRequest?: boolean;
  advanceBookingType?: "Percentage" | "Fixed";
  advanceBookingValue?: number;
  installationCharge?: number;
  emiEligible?: boolean;
  hsnCode?: string;
  hsnGstRate?: number;
  b2bTiers?: B2BPriceTier[];
  platformFeeType?: "Percentage" | "Fixed";
  platformFeeValue?: number;
  feeMode?: "on_top" | "deducted";

  // Inventory & Tracking
  trackStock?: boolean;
  allowBackorders?: boolean;
  minOrderQuantity?: number;
  maxOrderQuantity?: number;
  productionLeadTime?: string;
  warehouseLocation?: string;
  serialTrackingEnabled?: boolean;
  dyeLotNumber?: string;
  dyeLotDate?: string;

  // Description & Media
  images?: string[];
  primaryImage?: string;
  imageAltText?: string;
  videoUrl?: string;
  mediaItems?: MediaItem[];
  downloadableDocs?: DownloadableDoc[];

  // Shipping, Delivery & Installation
  shippingSkip?: boolean;
  shippingClass?: "Standard" | "Heavy / Oversized" | "Fragile";
  deliveryType?: "Standard Delivery" | "Express Delivery" | "Special Delivery";
  installationRequired?: boolean;
  installationType?: string;
  shippingCharges?: "Free Shipping" | "Fixed Charge" | "Calculated at Checkout";
  packages?: ShippingCrate[];
  dispatchDays?: number;
  installationModel?: "Included" | "Paid Add-on" | "Not Required" | "Optional";
  technicianTeamSize?: string;
  onSiteDuration?: string;
  siteSurveyRequired?: boolean;
  minRoomLengthFt?: number;
  minRoomWidthFt?: number;
  minDoorWidthCm?: number;
  liftAccessRequired?: boolean;
  minFloorLoadRating?: string;
  measurementUnit?: "cm" | "mm" | "inches";
  packageLength?: string;
  packageWidth?: string;
  packageHeight?: string;

  // Warranty, Returns & Documents
  warrantyInfo?: string;
  warrantySlate?: string;
  warrantyFrame?: string;
  warrantyCushions?: string;
  warrantyCloth?: string;
  warrantyExclusions?: string;
  returnEligibility?: string;
  returnWindowDays?: number;
  restockingFeePercent?: number;
  certificateOfAuthenticity?: boolean;

  // Related Products
  autoCompatibilityMatching?: boolean;
  roomBundleItems?: string[];
  roomBundleDiscount?: number;
  spareParts?: string[];

  // SEO & Schema
  focusKeyword?: string;
  canonicalUrl?: string;
  searchEngineVisibility?: "Index" | "No Index";
  ogImage?: string;
  oldSlug?: string;

  // Review & Publish
  visibility?: ProductVisibility;
  scheduledPublishAt?: string;
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
