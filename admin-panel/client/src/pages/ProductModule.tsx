import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  CreditCard,
  Eye,
  FileCheck,
  Globe,
  ImagePlus,
  IndianRupee,
  Layers,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  Save,
  Search,
  SlidersHorizontal,
  Sparkles,
  Tag,
  Trash2,
  Truck,
  Upload,
  Wrench,
  X,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link2,
  Table as TableIcon,
  Maximize2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import { categoryOptions } from "@/data/phase2Data";
import { formatINR } from "@/data/mockData";
import { Button, Checkbox, EmptyState, SectionCard, SelectField, SortIcon, StatusBadge } from "@/components/admin/Primitives";
import type { ProductRecord, ProductVariant, PublicationStatus } from "@/types/admin";

type ProductView =
  | { mode: "list" }
  | { mode: "form"; productId: string | null }
  | { mode: "details"; productId: string };

type StepNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 9 | 10;

const brandOptions = [
  "HCS Studio",
  "Riley England",
  "Strachan 6811",
  "Aramith Belgium",
  "Peradon UK",
  "John Parris",
  "Kamui Japan",
  "Northern Rubber",
  "Predator",
  "Other / Custom Brand",
];

const categorySubcategories: Record<string, string[]> = {
  Tables: [
    "12ft Championship Snooker",
    "10ft Club Snooker",
    "8ft Compact / Pool",
    "English Pool Tables",
    "Multi-Game Dining Tables",
  ],
  Cues: [
    "1-Piece English Ash",
    "3/4 Jointed Snooker Cues",
    "2-Piece Center Joint",
    "American Pool Cues",
    "Bespoke Hand-Spliced Cues",
  ],
  "Table Accessories": [
    "Strachan Baize Cloths",
    "Aramith Tournament Balls",
    "Shadowless LED Canopies",
    "Maintenance & Table Irons",
    "Pocket Nets & Leathers",
    "Cushion Rubbers",
  ],
  Scoreboards: [
    "Traditional Mahogany Pointer",
    "Electronic LED Digital",
    "Riley Heritage Wall Mount",
    "Wireless Remote Match Boards",
  ],
};

const defaultCategorySpecs: Record<string, { key: string; label: string; placeholder: string; defaultVal?: string }[]> = {
  Tables: [
    { key: "Table size", label: "Table Size", placeholder: "e.g. 12 FT (366cm x 183cm)", defaultVal: "10 FT" },
    { key: "Slate thickness", label: "Slate Thickness", placeholder: "e.g. 5-piece 45mm Italian Slate", defaultVal: "45mm Italian Slate" },
    { key: "Frame material", label: "Frame Material", placeholder: "e.g. Solid Seasoned Teak / Mahogany", defaultVal: "Solid Seasoned Hardwood" },
    { key: "Cloth type", label: "Cloth Type", placeholder: "e.g. Strachan 6811 Pure Wool 30oz", defaultVal: "Strachan 6811 Pure Wool" },
    { key: "Table finish", label: "Table Finish", placeholder: "e.g. Traditional Hand-Rubbed Gloss Mahogany", defaultVal: "Classic Mahogany Polish" },
    { key: "Number of legs", label: "Number of Legs", placeholder: "e.g. 8 Turned Solid Legs with Brass Levelers", defaultVal: "8 Turned Solid Legs" },
    { key: "Installation", label: "Installation Requirements", placeholder: "e.g. Ground floor / freight elevator, 4-man team", defaultVal: "Professional on-site installation required" },
  ],
  Cues: [
    { key: "Cue length", label: "Cue Length", placeholder: "e.g. Standard 58 inches (147cm)", defaultVal: "58 inches" },
    { key: "Cue weight", label: "Cue Weight", placeholder: "e.g. 18.2 oz", defaultVal: "18.2 oz" },
    { key: "Tip size", label: "Tip Size & Grade", placeholder: "e.g. 9.5mm Laminated Pressed Leather", defaultVal: "9.5mm Pressed Leather" },
    { key: "Shaft wood", label: "Shaft Wood", placeholder: "e.g. Grade AAA North American Ash", defaultVal: "North American Ash" },
    { key: "Joint type", label: "Joint Type", placeholder: "e.g. Quick-release precision brass vacuum joint", defaultVal: "Quick-Release Brass Joint" },
    { key: "Butt splice", label: "Butt Splice", placeholder: "e.g. 4-point hand-spliced solid ebony", defaultVal: "4-Point Hand Spliced" },
  ],
  "Table Accessories": [
    { key: "Cloth grade", label: "Grade / Material", placeholder: "e.g. 100% Pure Wool, 32oz / Phenolic Resin", defaultVal: "100% Pure Wool 30oz" },
    { key: "Cut dimensions", label: "Cut Dimensions / Size", placeholder: "e.g. 12 FT Bed & 6 Cushion Strips", defaultVal: "Bed & Cushion Set" },
    { key: "Surface finish", label: "Surface Finish", placeholder: "e.g. Directional short nap / High-gloss polish", defaultVal: "Directional Wool Nap" },
    { key: "Compatibility", label: "Compatibility", placeholder: "e.g. Standard 10ft & 12ft Snooker Tables", defaultVal: "Universal Snooker Standard" },
  ],
  Scoreboards: [
    { key: "Display type", label: "Display Type", placeholder: "e.g. Traditional Brass Pointer / Ultra-bright LED", defaultVal: "Brass Pointer Rails" },
    { key: "Board dimensions", label: "Board Dimensions", placeholder: "e.g. 90cm × 42cm × 8cm Wall-Mounted", defaultVal: "90cm x 40cm Wall Mount" },
    { key: "Timber / Material", label: "Timber / Frame Material", placeholder: "e.g. Solid Mahogany with Brass Railings", defaultVal: "Solid Mahogany" },
    { key: "Control mechanism", label: "Control Mechanism", placeholder: "e.g. Manual slider pointer / 2.4GHz Remote", defaultVal: "Manual Slider" },
  ],
};

function makeDraft(): ProductRecord {
  return {
    id: `prod-${Date.now()}`,
    name: "",
    category: "Tables",
    subcategory: "10ft Club Snooker",
    sku: "",
    price: 0,
    salePrice: 0,
    inventory: 5,
    status: "In stock",
    publication: "Draft",
    brand: "HCS Studio",
    accent: "#c5d6c3",
    initials: "NP",
    shortDescription: "",
    description: "",
    tax: "GST 18%",
    lowStockThreshold: 2,
    weight: "320 kg",
    dimensions: "10 ft × 5 ft",
    specs: {
      "Table size": "10 FT",
      "Slate thickness": "45mm Italian Slate",
      "Frame material": "Solid Seasoned Hardwood",
      "Cloth type": "Strachan 6811 Pure Wool",
      "Table finish": "Classic Dark Mahogany",
      "Number of legs": "8 Turned Solid Legs",
      "Installation": "Professional on-site installation required",
    },
    featured: false,
    bestseller: false,
    newArrival: false,
    seoTitle: "",
    seoDescription: "",
    slug: "",
    imageCount: 3,

    // Step-by-step additions
    productType: "Physical Product",
    collection: "",
    images: [
      "/images/products/featured-table-12ft.jpg",
      "/images/snooker-hero.jpg",
      "/images/snooker-room.jpg",
    ],
    primaryImage: "/images/products/featured-table-12ft.jpg",
    imageAltText: "",
    videoUrl: "",
    platformFeeType: "Percentage",
    platformFeeValue: 5,
    feeMode: "on_top",
    trackStock: true,
    allowBackorders: false,
    minOrderQuantity: 1,
    variants: [],
    customSpecs: [],
    shippingSkip: false,
    shippingClass: "Heavy / Oversized",
    deliveryType: "Special Delivery",
    installationRequired: true,
    installationType: "White-Glove Leveling & Baize Fitting",
    shippingCharges: "Fixed Charge",
    warrantyInfo: "5-Year Structural Frame Warranty",
    returnEligibility: "Inspection upon delivery; 7-day replacement for manufacturing defects",
    measurementUnit: "cm",
    packageLength: "310",
    packageWidth: "165",
    packageHeight: "85",
    focusKeyword: "",
    canonicalUrl: "",
    searchEngineVisibility: "Index",
  };
}

export default function ProductModule({
  products,
  setProducts,
}: {
  products: ProductRecord[];
  setProducts: (products: ProductRecord[]) => void;
}) {
  const [view, setView] = useState<ProductView>({ mode: "list" });
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All categories");
  const [stock, setStock] = useState("All stock");
  const [publication, setPublication] = useState("All statuses");
  const [sort, setSort] = useState<{ key: keyof ProductRecord; direction: "asc" | "desc" } | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const visibleProducts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = products.filter((product) => {
      const matchesQuery =
        !needle ||
        [product.name, product.sku, product.brand, product.category].join(" ").toLowerCase().includes(needle);
      const matchesCategory = category === "All categories" || product.category === category;
      const matchesStock = stock === "All stock" || product.status === stock;
      const matchesPublication = publication === "All statuses" || product.publication === publication;
      return matchesQuery && matchesCategory && matchesStock && matchesPublication;
    });
    if (!sort) return filtered;
    return [...filtered].sort(
      (a, b) =>
        String(a[sort.key]).localeCompare(String(b[sort.key]), undefined, { numeric: true }) *
        (sort.direction === "asc" ? 1 : -1)
    );
  }, [category, products, publication, query, sort, stock]);

  const paged = visibleProducts.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(visibleProducts.length / pageSize));
  const toggleSort = (key: keyof ProductRecord) =>
    setSort((current) =>
      current?.key === key ? { key, direction: current.direction === "asc" ? "desc" : "asc" } : { key, direction: "asc" }
    );
  const toggleAll = () =>
    setSelected(selected.length === paged.length ? [] : paged.map((product) => product.id));

  const bulkDelete = () => {
    if (!selected.length) return;
    if (!window.confirm(`Delete ${selected.length} selected product${selected.length > 1 ? "s" : ""}?`)) return;
    setProducts(products.filter((product) => !selected.includes(product.id)));
    setSelected([]);
    toast.success("Products deleted");
  };

  const bulkPublish = (status: PublicationStatus) => {
    if (!selected.length) return;
    setProducts(
      products.map((product) => (selected.includes(product.id) ? { ...product, publication: status } : product))
    );
    setSelected([]);
    toast.success(`Products moved to ${status.toLowerCase()}`);
  };

  if (view.mode === "form") {
    const existing = view.productId ? products.find((p) => p.id === view.productId) : undefined;
    return (
      <ProductForm
        product={existing}
        onBack={() => setView({ mode: "list" })}
        onSave={(saved) => {
          setProducts(
            view.productId
              ? products.map((p) => (p.id === saved.id ? saved : p))
              : [saved, ...products]
          );
          setView({ mode: "details", productId: saved.id });
          toast.success(view.productId ? "Product updated successfully" : "Product created successfully");
        }}
      />
    );
  }

  if (view.mode === "details") {
    const product = products.find((item) => item.id === view.productId);
    if (!product)
      return (
        <EmptyState
          title="Product not found"
          description="This product may have been removed or deleted."
        />
      );
    return (
      <ProductDetails
        product={product}
        onBack={() => setView({ mode: "list" })}
        onEdit={() => setView({ mode: "form", productId: product.id })}
        onToggle={() => {
          const next = product.publication === "Published" ? "Draft" : "Published";
          setProducts(products.map((item) => (item.id === product.id ? { ...item, publication: next } : item)));
          toast.success(`Product ${next.toLowerCase()}`);
        }}
      />
    );
  }

  return (
    <div className="resource-page phase2-page customer-module-page">
      <div className="page-heading">
        <div>
          <h1>Products</h1>
        </div>
        <div className="heading-actions">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelected([]);
              toast.success("Product export prepared");
            }}
          >
            <Upload size={15} /> Export
          </Button>
          <Button size="sm" onClick={() => setView({ mode: "form", productId: null })}>
            <Plus size={15} /> Add product
          </Button>
        </div>
      </div>
      <SectionCard
        title="All products"
        action={<span className="table-summary">{products.length} products · Updated just now</span>}
      >
        <div className="table-toolbar phase2-toolbar">
          <div className="toolbar-filters">
            <label className="search-field">
              <Search size={16} />
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Search products, SKU or brand"
              />
            </label>
            <SelectField
              value={category}
              onChange={(value) => {
                setCategory(value);
                setPage(1);
              }}
              options={["All categories", ...categoryOptions]}
            />
            <SelectField
              value={stock}
              onChange={(value) => {
                setStock(value);
                setPage(1);
              }}
              options={["All stock", "In stock", "Low stock", "Out of stock"]}
            />
            <SelectField
              value={publication}
              onChange={(value) => {
                setPublication(value);
                setPage(1);
              }}
              options={["All statuses", "Published", "Draft"]}
            />
          </div>
        </div>

        {selected.length > 0 && (
          <div className="bulk-bar">
            <strong>{selected.length} selected</strong>
            <button onClick={() => bulkPublish("Published")}>Publish</button>
            <button onClick={() => bulkPublish("Draft")}>Move to draft</button>
            <button className="bulk-danger" onClick={bulkDelete}>
              <Trash2 size={14} /> Delete
            </button>
            <button className="bulk-close" onClick={() => setSelected([])}>
              <X size={15} />
            </button>
          </div>
        )}

        <div className="responsive-table">
          <table className="data-table products-table">
            <thead>
              <tr>
                <th>
                  <Checkbox
                    checked={paged.length > 0 && selected.length === paged.length}
                    onChange={toggleAll}
                  />
                </th>
                <SortableHeader label="Product" sort={sort} sortKey="name" onSort={toggleSort} />
                <SortableHeader label="SKU" sort={sort} sortKey="sku" onSort={toggleSort} />
                <SortableHeader label="Category" sort={sort} sortKey="category" onSort={toggleSort} />
                <SortableHeader label="Price" sort={sort} sortKey="price" onSort={toggleSort} />
                <SortableHeader label="Stock" sort={sort} sortKey="inventory" onSort={toggleSort} />
                <SortableHeader label="Status" sort={sort} sortKey="publication" onSort={toggleSort} />
                <th />
              </tr>
            </thead>
            <tbody>
              {paged.map((product) => (
                <tr key={product.id}>
                  <td>
                    <Checkbox
                      checked={selected.includes(product.id)}
                      onChange={() =>
                        setSelected((current) =>
                          current.includes(product.id)
                            ? current.filter((id) => id !== product.id)
                            : [...current, product.id]
                        )
                      }
                    />
                  </td>
                  <td>
                    <button
                      className="product-cell product-link"
                      onClick={() => setView({ mode: "details", productId: product.id })}
                    >
                      <span className="product-swatch" style={{ background: product.accent }}>
                        {product.initials}
                      </span>
                      <span>
                        <strong className="product-row-title">{product.name}</strong>
                        <small>
                          {product.brand} · {product.imageCount} images
                        </small>
                      </span>
                    </button>
                  </td>
                  <td className="muted-cell">{product.sku}</td>
                  <td>
                    {product.category}
                    <small className="table-subtext">{product.subcategory}</small>
                  </td>
                  <td>
                    <strong>{formatINR(product.salePrice || product.price)}</strong>
                    {product.salePrice > 0 && product.salePrice < product.price && (
                      <small className="sale-price">{formatINR(product.price)}</small>
                    )}
                  </td>
                  <td className={product.inventory <= product.lowStockThreshold ? "inventory-low" : ""}>
                    {product.inventory} units
                  </td>
                  <td>
                    <div className="publication-cell">
                      <StatusBadge status={product.status} />
                      <span
                        className={`publication-dot ${
                          product.publication === "Published" ? "published" : "draft"
                        }`}
                      >
                        {product.publication}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="row-action"
                        onClick={() => setView({ mode: "form", productId: product.id })}
                        aria-label={`Edit ${product.name}`}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        className="row-action"
                        onClick={() => setView({ mode: "details", productId: product.id })}
                        aria-label={`View ${product.name}`}
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        className="row-action"
                        onClick={() => {
                          if (!window.confirm(`Delete ${product.name}?`)) return;
                          setProducts(products.filter((item) => item.id !== product.id));
                          toast.success("Product deleted");
                        }}
                        aria-label={`Delete ${product.name}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {paged.length === 0 && (
            <EmptyState
              title="No products found"
              description="Try a different search or filter, or add a new product."
            />
          )}
        </div>
        <div className="table-footer">
          <span>
            Showing {visibleProducts.length ? (page - 1) * pageSize + 1 : 0}–
            {Math.min(page * pageSize, visibleProducts.length)} of {visibleProducts.length}
          </span>
          <div className="pagination">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Previous
            </Button>
            <span>
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

function SortableHeader({
  label,
  sort,
  sortKey,
  onSort,
}: {
  label: string;
  sort: { key: keyof ProductRecord; direction: "asc" | "desc" } | null;
  sortKey: keyof ProductRecord;
  onSort: (key: keyof ProductRecord) => void;
}) {
  return (
    <th>
      <button className="sort-header" onClick={() => onSort(sortKey)}>
        {label}
        <SortIcon direction={sort?.key === sortKey ? sort.direction : null} />
      </button>
    </th>
  );
}

function ProductDetails({
  product,
  onBack,
  onEdit,
  onToggle,
}: {
  product: ProductRecord;
  onBack: () => void;
  onEdit: () => void;
  onToggle: () => void;
}) {
  return (
    <div className="product-detail-page customer-detail-page">
      <button className="back-link" onClick={onBack}>
        <ArrowLeft size={15} /> Back to products
      </button>
      <div className="detail-heading">
        <div>
          <h1>{product.name}</h1>
        </div>
        <div className="heading-actions">
          <Button variant="outline" size="sm" onClick={onToggle}>
            {product.publication === "Published" ? "Move to draft" : "Publish product"}
          </Button>
          <Button size="sm" onClick={onEdit}>
            <Pencil size={15} /> Edit product
          </Button>
        </div>
      </div>
      <div className="detail-grid">
        <SectionCard title="Product overview">
          <div className="detail-hero">
            <div className="detail-product-image" style={{ background: product.accent }}>
              {product.initials}
              <ImagePlus size={17} />
            </div>
            <div>
              <StatusBadge status={product.status} />
              <p className="detail-short">{product.shortDescription || "No short description provided."}</p>
              <p className="detail-description">{product.description || "No full description provided."}</p>
            </div>
          </div>
          <div className="detail-facts">
            <Fact label="Regular price" value={formatINR(product.price)} />
            <Fact label="Sale price" value={product.salePrice ? formatINR(product.salePrice) : "None"} />
            <Fact label="Category" value={`${product.category} / ${product.subcategory || "General"}`} />
            <Fact label="Product Type" value={product.productType || "Physical Product"} />
            <Fact label="Publication" value={product.publication} />
            <Fact label="Inventory" value={`${product.inventory} units (${product.status})`} />
          </div>
        </SectionCard>
        <SectionCard title="Specifications">
          <div className="spec-list">
            {Object.entries(product.specs || {}).map(([key, value]) => (
              <div key={key}>
                <span>{key}</span>
                <strong>{value || "Not specified"}</strong>
              </div>
            ))}
            <div>
              <span>Weight</span>
              <strong>{product.weight || "Not specified"}</strong>
            </div>
            <div>
              <span>Dimensions</span>
              <strong>{product.dimensions || "Not specified"}</strong>
            </div>
          </div>
        </SectionCard>
        <SectionCard title="Search preview">
          <div className="seo-preview">
            <strong>{product.seoTitle || product.name}</strong>
            <span>hyderabadcuesports.in/products/{product.slug || "product-url"}</span>
            <p>{product.seoDescription || product.shortDescription || "Search description preview."}</p>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

/* =========================================================================
   10-STEP DEDICATED WIZARD (Strictly 1 Focused Step at a Time, in Exact Order)
   ========================================================================= */

const stepMetadata: { step: StepNumber; title: string; subtitle: string }[] = [
  { step: 1, title: "01. Product Identity", subtitle: "Define basic product identifiers, unique SKU, brand and type." },
  { step: 2, title: "02. Category & Organisation", subtitle: "Select taxonomy and catalog organization." },
  { step: 3, title: "03. Product Description & Media", subtitle: "Upload high-resolution photography, rich description, and video links." },
  { step: 4, title: "04. Pricing & Platform Fee", subtitle: "Configure regular pricing, discounts, and platform fee sharing model (no tax fields)." },
  { step: 5, title: "05. Inventory & Variants", subtitle: "Manage stock tracking, low stock thresholds, and optional variations." },
  { step: 6, title: "06. Product Specifications", subtitle: "Category-dynamic technical details and custom specifications." },
  { step: 7, title: "07. Shipping & Delivery", subtitle: "Optional freight dimensions, white-glove assembly, and warranty terms." },
  { step: 9, title: "09. SEO & Search Visibility", subtitle: "Search engine indexing, meta tags, and live Google snippet preview." },
  { step: 10, title: "10. Review & Publish", subtitle: "Verify all entered details before deploying product live or saving as draft." },
];

function ProductForm({
  product,
  onBack,
  onSave,
}: {
  product?: ProductRecord;
  onBack: () => void;
  onSave: (product: ProductRecord) => void;
}) {
  const [form, setForm] = useState<ProductRecord>(() => (product ? { ...product } : makeDraft()));
  const [currentStep, setCurrentStep] = useState<StepNumber>(1);
  const [completedSteps, setCompletedSteps] = useState<Set<StepNumber>>(() => {
    if (product) {
      // For existing products, all steps start as completed
      return new Set(stepMetadata.map((m) => m.step));
    }
    return new Set<StepNumber>();
  });
  const [customKey, setCustomKey] = useState("");
  const [customVal, setCustomVal] = useState("");

  const set = <K extends keyof ProductRecord>(key: K, value: ProductRecord[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  // Rich Text Editor State & Actions
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const [editorFormat, setEditorFormat] = useState("Normal text");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isBulletList, setIsBulletList] = useState(false);
  const [isNumList, setIsNumList] = useState(false);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    if (savedRangeRef.current && editorRef.current) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedRangeRef.current);
      }
    }
  };

  const updateActiveFormats = () => {
    saveSelection();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !editorRef.current?.contains(sel.anchorNode)) return;

    const node = sel.anchorNode;
    const el = node ? (node.nodeType === 1 ? (node as HTMLElement) : node.parentElement) : null;
    if (el?.closest("h2")) {
      setEditorFormat("Heading 2");
    } else if (el?.closest("h3")) {
      setEditorFormat("Heading 3");
    } else {
      setEditorFormat("Normal text");
    }

    try {
      setIsBold(document.queryCommandState("bold"));
      setIsItalic(document.queryCommandState("italic"));
      setIsUnderline(document.queryCommandState("underline"));
      setIsBulletList(document.queryCommandState("insertUnorderedList"));
      setIsNumList(document.queryCommandState("insertOrderedList"));
    } catch {}
  };

  // Synchronize editor DOM with form.description when Step 03 is mounted
  useEffect(() => {
    if (currentStep === 3 && editorRef.current) {
      if (!editorRef.current.innerHTML.trim() || editorRef.current.innerHTML !== (form.description || "")) {
        editorRef.current.innerHTML = form.description || "<p><br></p>";
      }
      try {
        document.execCommand("defaultParagraphSeparator", false, "p");
      } catch {}
    }
  }, [currentStep]);

  const executeEditorCmd = (cmd: string, val: string | undefined = undefined) => {
    restoreSelection();
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(cmd, false, val);
    if (editorRef.current) {
      set("description", editorRef.current.innerHTML);
      saveSelection();
    }
    setTimeout(updateActiveFormats, 10);
  };

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const node = sel.anchorNode;
        const el = node ? (node.nodeType === 1 ? (node as HTMLElement) : node.parentElement) : null;
        const headingEl = el?.closest("h2, h3") as HTMLElement | null;

        if (headingEl && editorRef.current?.contains(headingEl)) {
          e.preventDefault();
          const newP = document.createElement("p");
          newP.innerHTML = "<br>";
          if (headingEl.nextSibling) {
            headingEl.parentNode?.insertBefore(newP, headingEl.nextSibling);
          } else {
            headingEl.parentNode?.appendChild(newP);
          }
          const range = document.createRange();
          range.setStart(newP, 0);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
          savedRangeRef.current = range.cloneRange();
          setEditorFormat("Normal text");
          if (editorRef.current) {
            set("description", editorRef.current.innerHTML);
          }
          return;
        }
      }
    }
    setTimeout(updateActiveFormats, 0);
  };

  const handleFormatChange = (format: string) => {
    setEditorFormat(format);
    restoreSelection();
    if (editorRef.current) {
      editorRef.current.focus();
    }

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const node = sel.anchorNode;
    const el = node ? (node.nodeType === 1 ? (node as HTMLElement) : node.parentElement) : null;
    const currentBlock = el?.closest("h2, h3, p, div") as HTMLElement | null;

    if (currentBlock && currentBlock !== editorRef.current && editorRef.current?.contains(currentBlock)) {
      let targetTag = "p";
      if (format === "Heading 2") targetTag = "h2";
      if (format === "Heading 3") targetTag = "h3";

      if (currentBlock.tagName.toLowerCase() !== targetTag) {
        const replacement = document.createElement(targetTag);
        replacement.innerHTML = currentBlock.innerHTML || "<br>";
        currentBlock.parentNode?.replaceChild(replacement, currentBlock);

        const range = document.createRange();
        range.selectNodeContents(replacement);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
        savedRangeRef.current = range.cloneRange();
      }
    } else {
      if (format === "Heading 2") document.execCommand("formatBlock", false, "<h2>");
      else if (format === "Heading 3") document.execCommand("formatBlock", false, "<h3>");
      else document.execCommand("formatBlock", false, "<p>");
    }

    if (editorRef.current) {
      set("description", editorRef.current.innerHTML);
      saveSelection();
    }
  };

  const handleAddLink = () => {
    restoreSelection();
    const url = window.prompt("Enter URL (e.g. https://...):", "https://");
    if (url) {
      executeEditorCmd("createLink", url);
    }
  };

  const handleInsertTable = () => {
    restoreSelection();
    const tableMarkup = `<table style="width:100%; border-collapse:collapse; margin:10px 0; border:1px solid #dce4de;"><thead><tr style="background:#f4faf6;"><th style="border:1px solid #dce4de; padding:6px 10px; text-align:left;">Specification</th><th style="border:1px solid #dce4de; padding:6px 10px; text-align:left;">Details</th></tr></thead><tbody><tr><td style="border:1px solid #dce4de; padding:6px 10px;">Cushion Rubber</td><td style="border:1px solid #dce4de; padding:6px 10px;">Northern Rubber (UK)</td></tr><tr><td style="border:1px solid #dce4de; padding:6px 10px;">Cloth Type</td><td style="border:1px solid #dce4de; padding:6px 10px;">Strachan 6811 Tournament</td></tr></tbody></table><p><br></p>`;
    executeEditorCmd("insertHTML", tableMarkup);
  };

  // Dynamic Subcategories based on Category
  const currentSubcategories = categorySubcategories[form.category] || ["General"];

  // Pricing & Platform Fee calculations
  const basePrice = form.salePrice > 0 ? form.salePrice : form.price;
  const feeValue = Number(form.platformFeeValue) || 0;
  const isPercentage = form.platformFeeType === "Percentage";
  const calculatedFee = isPercentage ? Math.round((basePrice * feeValue) / 100) : feeValue;

  const finalCustomerPrice =
    form.feeMode === "on_top" ? basePrice + calculatedFee : basePrice;

  const sellerPayout =
    form.feeMode === "deducted" ? Math.max(0, basePrice - calculatedFee) : basePrice;

  // URL Slug Auto-generator
  const generateSlug = () => {
    if (!form.name.trim()) {
      toast.error("Please enter a product name first");
      return;
    }
    const slug = form.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    set("slug", slug);
    if (!form.seoTitle) set("seoTitle", `${form.name} | Hyderabad Cue Sports`);
    toast.success("URL slug generated");
  };

  // Add Custom Specification
  const handleAddCustomSpec = () => {
    if (!customKey.trim() || !customVal.trim()) {
      toast.error("Please provide both specification label and value");
      return;
    }
    set("specs", { ...form.specs, [customKey.trim()]: customVal.trim() });
    setCustomKey("");
    setCustomVal("");
    toast.success("Custom specification added");
  };

  // Add Variant
  const handleAddVariant = () => {
    const newVariant: ProductVariant = {
      id: `var-${Date.now()}`,
      name: `${form.name || "Variant"} - Option ${((form.variants || []).length + 1)}`,
      sku: `${form.sku || "SKU"}-V${((form.variants || []).length + 1)}`,
      price: form.price || 0,
      inventory: 5,
      availability: "In stock",
    };
    set("variants", [...(form.variants || []), newVariant]);
    toast.success("Variant added");
  };

  // Remove Variant
  const handleRemoveVariant = (variantId: string) => {
    set("variants", (form.variants || []).filter((v) => v.id !== variantId));
  };

  // Step validation rules for required fields
  const getStepValidationError = (step: StepNumber): string | null => {
    if (step === 1) {
      if (!form.name.trim()) return "Please enter Product Name in Step 01";
      if (!form.sku.trim()) return "Please enter Unique SKU in Step 01";
    }
    if (step === 2) {
      if (!form.category || !form.category.trim()) return "Please select a Primary Category in Step 02";
    }
    if (step === 4) {
      if (!form.price || Number(form.price) <= 0) return "Please provide a valid Regular Price in Step 04";
    }
    return null;
  };

  // Check if a step is genuinely completed and valid
  const isStepDone = (step: StepNumber): boolean => {
    if (step === currentStep) return false;
    if (getStepValidationError(step) !== null) return false;
    return completedSteps.has(step);
  };

  // Step click navigation with prerequisite validation
  const handleStepClick = (targetStep: StepNumber) => {
    if (targetStep === currentStep) return;

    const targetIndex = stepMetadata.findIndex((m) => m.step === targetStep);
    const currentIndex = stepMetadata.findIndex((m) => m.step === currentStep);

    // If navigating backward, always allow
    if (targetIndex < currentIndex) {
      if (!getStepValidationError(currentStep)) {
        setCompletedSteps((prev) => new Set(prev).add(currentStep));
      }
      setCurrentStep(targetStep);
      return;
    }

    // If navigating forward, ensure current step is valid
    const currentError = getStepValidationError(currentStep);
    if (currentError) {
      toast.error(currentError);
      return;
    }

    // Ensure all preceding steps up to targetIndex are valid
    for (let i = 0; i < targetIndex; i++) {
      const stepItem = stepMetadata[i];
      const error = getStepValidationError(stepItem.step);
      if (error) {
        toast.error(error);
        setCurrentStep(stepItem.step);
        return;
      }
    }

    // Mark current step as completed and proceed
    setCompletedSteps((prev) => new Set(prev).add(currentStep));
    setCurrentStep(targetStep);
  };

  // Step Validation before progressing via "Continue"
  const validateAndNext = () => {
    const error = getStepValidationError(currentStep);
    if (error) {
      toast.error(error);
      return;
    }

    setCompletedSteps((prev) => new Set(prev).add(currentStep));

    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(4);
    } else if (currentStep === 4) {
      setCurrentStep(5);
    } else if (currentStep === 5) {
      setCurrentStep(6);
    } else if (currentStep === 6) {
      setCurrentStep(7);
    } else if (currentStep === 7) {
      // Step 08 is removed from wizard (handled dynamically by recommendation service)
      setCurrentStep(9);
    } else if (currentStep === 9) {
      setCurrentStep(10);
    }
  };

  // Previous Step
  const handlePrev = () => {
    if (!getStepValidationError(currentStep)) {
      setCompletedSteps((prev) => new Set(prev).add(currentStep));
    }

    if (currentStep === 1) {
      onBack();
    } else if (currentStep === 2) {
      setCurrentStep(1);
    } else if (currentStep === 3) {
      setCurrentStep(2);
    } else if (currentStep === 4) {
      setCurrentStep(3);
    } else if (currentStep === 5) {
      setCurrentStep(4);
    } else if (currentStep === 6) {
      setCurrentStep(5);
    } else if (currentStep === 7) {
      setCurrentStep(6);
    } else if (currentStep === 9) {
      setCurrentStep(7);
    } else if (currentStep === 10) {
      setCurrentStep(9);
    }
  };

  // Final Save / Publish
  const handleSave = (publishStatus: PublicationStatus = form.publication) => {
    if (!form.name.trim()) {
      toast.error("Product name is required (Step 01)");
      setCurrentStep(1);
      return;
    }
    if (!form.sku.trim()) {
      toast.error("Unique SKU is required (Step 01)");
      setCurrentStep(1);
      return;
    }
    if (!form.category || !form.category.trim()) {
      toast.error("Primary category is required (Step 02)");
      setCurrentStep(2);
      return;
    }
    if (!form.price || form.price <= 0) {
      toast.error("Regular price is required (Step 04)");
      setCurrentStep(4);
      return;
    }

    const calculatedStatus =
      form.inventory === 0
        ? "Out of stock"
        : form.inventory <= form.lowStockThreshold
        ? "Low stock"
        : "In stock";

    const record: ProductRecord = {
      ...form,
      publication: publishStatus,
      status: calculatedStatus,
      initials: form.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "HCS",
      slug: form.slug.trim() || form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      imageCount: (form.images || []).length,
    };

    onSave(record);
  };

  const currentMeta = stepMetadata.find((m) => m.step === currentStep) || stepMetadata[0];
  const stepperStripRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the stepper strip to center the active step
  useEffect(() => {
    if (stepperStripRef.current) {
      const activeNode = stepperStripRef.current.querySelector(".stepper-node.current") as HTMLElement | null;
      if (activeNode) {
        activeNode.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  }, [currentStep]);

  return (
    <div className="product-form-page dedicated-wizard-container">
      <div className="detail-heading">
        <div className="title-with-arrow">
          <button
            type="button"
            className="back-arrow-btn"
            onClick={onBack}
            aria-label="Back"
            title="Back to products"
          >
            <ArrowLeft size={24} strokeWidth={2.3} />
          </button>
          <h1>{product ? `Edit: ${product.name}` : "Add Product"}</h1>
        </div>
        <div className="heading-actions">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSave("Draft")}
            className="save-draft-btn"
          >
            Save as Draft
          </Button>
          <Button
            size="sm"
            onClick={() => handleSave("Published")}
            className="publish-product-btn"
          >
            <Check size={14} /> Publish Product
          </Button>
        </div>
      </div>

      {/* HORIZONTAL STEPPER PROGRESS STRIP */}
      <div className="wizard-stepper-container">
        <div className="wizard-stepper-strip" ref={stepperStripRef}>
          {stepMetadata.map((meta, index) => {
            const isCurrent = currentStep === meta.step;
            const isDone = isStepDone(meta.step);
            return (
              <button
                key={meta.step}
                type="button"
                className={`stepper-node ${isCurrent ? "current" : isDone ? "done" : ""}`}
                onClick={() => handleStepClick(meta.step)}
                title={meta.title}
              >
                <span className="step-circle">
                  {isDone ? <Check size={13} strokeWidth={2.4} /> : String(meta.step).padStart(2, "0")}
                </span>
                <span className="step-label-text">
                  {meta.title.replace(/^\d+\.\s*/, "")}
                </span>
                {index < stepMetadata.length - 1 && <span className="step-arrow" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* FOCUSED SINGLE-CARD STEP CONTAINER */}
      <div className="wizard-step-card">
        <div className="wizard-step-header">
          <h2>{currentMeta.title}</h2>
          <p>{currentMeta.subtitle}</p>
        </div>

        <div className="wizard-step-content">
          {/* =========================================================================
              STEP 01: PRODUCT IDENTITY
             ========================================================================= */}
          {currentStep === 1 && (
            <div className="step-form-grid">
              <Field
                label="Product Name *"
                value={form.name}
                onChange={(val) => {
                  set("name", val);
                  if (!form.slug) {
                    set(
                      "slug",
                      val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
                    );
                  }
                }}
                placeholder="e.g. Riley Clubman 10ft Snooker Table"
              />
              <Field
                label="SKU (Stock Keeping Unit) *"
                value={form.sku}
                onChange={(val) => set("sku", val.toUpperCase())}
                placeholder="e.g. HCS-CLB-10FT"
              />
              <SelectForm
                label="Brand"
                value={form.brand}
                options={brandOptions}
                onChange={(val) => set("brand", val)}
              />
              <SelectForm
                label="Product Type"
                value={form.productType || "Physical Product"}
                options={["Physical Product", "Digital Product", "Service"]}
                onChange={(val) => set("productType", val as ProductRecord["productType"])}
              />
            </div>
          )}

          {/* =========================================================================
              STEP 02: CATEGORY & ORGANISATION
             ========================================================================= */}
          {currentStep === 2 && (
            <div className="step-form-grid">
              <SelectForm
                label="Primary Category *"
                value={form.category}
                options={["Tables", "Cues", "Table Accessories", "Scoreboards"]}
                onChange={(val) => {
                  set("category", val);
                  const sub = categorySubcategories[val]?.[0] || "";
                  set("subcategory", sub);
                }}
              />
              <SelectForm
                label="Subcategory (Dependent) *"
                value={form.subcategory}
                options={currentSubcategories}
                onChange={(val) => set("subcategory", val)}
              />
              <Field
                label="Product Collection (Optional)"
                value={form.collection || ""}
                onChange={(val) => set("collection", val)}
                placeholder="e.g. Tournament Pro Series, Club Commercial, Heritage Woodwork"
                wide
              />
            </div>
          )}

          {/* =========================================================================
              STEP 03: PRODUCT DESCRIPTION & MEDIA
             ========================================================================= */}
          {currentStep === 3 && (
            <div className="step-form-grid">
              <Field
                label="Short Description"
                value={form.shortDescription}
                onChange={(val) => set("shortDescription", val.slice(0, 160))}
                placeholder="Concise 1-2 sentence overview for product listings and search cards"
                textarea
                wide
                help={`${form.shortDescription.length} / 160 characters`}
              />

              <div className="form-field field-wide">
                <span className="form-label">Full Description (Rich Text Editor)</span>
                <div className="rich-editor-shell">
                  <div className="rich-editor-toolbar">
                    <SelectField
                      value={editorFormat}
                      options={["Normal text", "Heading 2", "Heading 3"]}
                      onChange={handleFormatChange}
                      className="editor-select-custom"
                    />
                    <div className="toolbar-divider" />
                    <button
                      type="button"
                      className={`toolbar-btn ${isBold ? "active" : ""}`}
                      title="Bold (Ctrl+B)"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        executeEditorCmd("bold");
                      }}
                    >
                      <Bold size={14} />
                    </button>
                    <button
                      type="button"
                      className={`toolbar-btn ${isItalic ? "active" : ""}`}
                      title="Italic (Ctrl+I)"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        executeEditorCmd("italic");
                      }}
                    >
                      <Italic size={14} />
                    </button>
                    <button
                      type="button"
                      className={`toolbar-btn ${isUnderline ? "active" : ""}`}
                      title="Underline (Ctrl+U)"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        executeEditorCmd("underline");
                      }}
                    >
                      <Underline size={14} />
                    </button>
                    <div className="toolbar-divider" />
                    <button
                      type="button"
                      className={`toolbar-btn ${isBulletList ? "active" : ""}`}
                      title="Bullet List"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        executeEditorCmd("insertUnorderedList");
                      }}
                    >
                      <List size={14} />
                    </button>
                    <button
                      type="button"
                      className={`toolbar-btn ${isNumList ? "active" : ""}`}
                      title="Numbered List"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        executeEditorCmd("insertOrderedList");
                      }}
                    >
                      <ListOrdered size={14} />
                    </button>
                    <button
                      type="button"
                      className="toolbar-btn"
                      title="Add Link"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleAddLink();
                      }}
                    >
                      <Link2 size={14} />
                    </button>
                    <button
                      type="button"
                      className="toolbar-btn"
                      title="Insert Table"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleInsertTable();
                      }}
                    >
                      <TableIcon size={14} />
                    </button>
                  </div>
                  <div
                    ref={editorRef}
                    className="rich-editor-content"
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(e) => set("description", e.currentTarget.innerHTML)}
                    onKeyDown={handleEditorKeyDown}
                    onKeyUp={updateActiveFormats}
                    onMouseUp={updateActiveFormats}
                    onSelect={updateActiveFormats}
                    data-placeholder="Comprehensive product craftsmanship details, slate specifications, timber grain, tournament certifications, and included accessories..."
                  />
                </div>
              </div>

              <div className="form-field field-wide">
                <span className="form-label">Product Images (Multiple Upload)</span>
                <div className="image-upload-row">
                  {/* Upload Dropzone */}
                  <label className="upload-dropzone">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files && files.length > 0) {
                          const newPaths = Array.from(files).map((f) => `/images/products/${f.name}`);
                          set("images", [...(form.images || []), ...newPaths]);
                          toast.success(`${files.length} images uploaded`);
                        }
                      }}
                    />
                    <Upload size={24} className="upload-cloud-icon" />
                    <strong>Upload Images</strong>
                    <small>JPG, PNG, WebP</small>
                  </label>

                  {/* Thumbnails */}
                  {(form.images || []).map((img, idx) => {
                    const isMain = form.primaryImage === img || idx === 0;
                    return (
                      <div key={idx} className={`media-thumb-card ${isMain ? "is-main" : ""}`}>
                        <img
                          src={img}
                          alt={`Product preview ${idx + 1}`}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://images.unsplash.com/photo-1544919982-b61976f0ba43?auto=format&fit=crop&w=400&q=80";
                          }}
                        />
                        {isMain && <span className="main-badge">Primary</span>}
                        <button
                          type="button"
                          className="remove-img-btn"
                          onClick={() => {
                            const filtered = (form.images || []).filter((_, i) => i !== idx);
                            set("images", filtered);
                            if (form.primaryImage === img && filtered.length > 0) {
                              set("primaryImage", filtered[0]);
                            }
                          }}
                        >
                          <X size={13} />
                        </button>
                        {!isMain && (
                          <button
                            type="button"
                            className="set-main-btn"
                            onClick={() => {
                              set("primaryImage", img);
                              toast.success("Set as primary thumbnail");
                            }}
                          >
                            Set Primary
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <Field
                label="Image Alt Text (for SEO & Screen Readers)"
                value={form.imageAltText || ""}
                onChange={(val) => set("imageAltText", val)}
                placeholder="e.g. 10ft Riley Clubman snooker table with English green cloth and polished mahogany frame"
              />
              <Field
                label="Product Video URL (Optional)"
                value={form.videoUrl || ""}
                onChange={(val) => set("videoUrl", val)}
                placeholder="e.g. https://youtube.com/watch?v=..."
              />
            </div>
          )}

          {/* =========================================================================
              STEP 04: PRICING & PLATFORM FEE (Tax Fields Removed)
             ========================================================================= */}
          {currentStep === 4 && (
            <div className="step-form-grid">
              <Field
                label="Regular Price (₹) *"
                type="number"
                value={form.price ? String(form.price) : ""}
                onChange={(val) => set("price", Number(val))}
                placeholder="e.g. 275000"
              />
              <Field
                label="Sale Price (₹, Optional)"
                type="number"
                value={form.salePrice ? String(form.salePrice) : ""}
                onChange={(val) => set("salePrice", Number(val))}
                placeholder="e.g. 249000 (leave 0 if not on sale)"
              />
              <SelectForm
                label="Platform Fee Type"
                value={form.platformFeeType || "Percentage"}
                options={["Percentage", "Fixed"]}
                onChange={(val) => set("platformFeeType", val as "Percentage" | "Fixed")}
              />
              <Field
                label={
                  form.platformFeeType === "Percentage"
                    ? "Platform Fee Value (%)"
                    : "Platform Fee Amount (₹)"
                }
                type="number"
                value={String(form.platformFeeValue ?? 5)}
                onChange={(val) => set("platformFeeValue", Number(val))}
                placeholder="5"
              />

              <div className="form-field field-wide fee-model-choice">
                <span className="form-label">Platform Fee Charging Model</span>
                <div className="fee-radio-grid">
                  <label className={`fee-radio-card ${form.feeMode === "on_top" ? "selected" : ""}`}>
                    <input
                      type="radio"
                      name="feeMode"
                      checked={form.feeMode === "on_top"}
                      onChange={() => set("feeMode", "on_top")}
                    />
                    <div>
                      <strong>Charged on top of product price</strong>
                      <p>
                        The customer pays the fee at checkout. Final Selling Price = Listed Price + Platform Fee.
                      </p>
                    </div>
                  </label>

                  <label className={`fee-radio-card ${form.feeMode === "deducted" ? "selected" : ""}`}>
                    <input
                      type="radio"
                      name="feeMode"
                      checked={form.feeMode === "deducted"}
                      onChange={() => set("feeMode", "deducted")}
                    />
                    <div>
                      <strong>Deducted from seller payout</strong>
                      <p>
                        The customer pays the listed price. The platform fee is deducted before net seller disbursement.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Calculated Preview Box */}
              <div className="field-wide calculation-breakdown-card">
                <div className="calc-header">
                  <Sparkles size={16} className="text-forest" />
                  <strong>Calculated Price & Fee Preview</strong>
                </div>
                <div className="calc-grid">
                  <div>
                    <span>Base Price</span>
                    <strong>{formatINR(basePrice)}</strong>
                  </div>
                  <div>
                    <span>Platform Fee ({isPercentage ? `${feeValue}%` : "Fixed"})</span>
                    <strong>{formatINR(calculatedFee)}</strong>
                  </div>
                  <div className="highlight-cell green-cell">
                    <span>Final Customer Price</span>
                    <strong className="final-price-bold">{formatINR(finalCustomerPrice)}</strong>
                  </div>
                  <div className="highlight-cell">
                    <span>Net Seller Payout</span>
                    <strong>{formatINR(sellerPayout)}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              STEP 05: INVENTORY & VARIANTS
             ========================================================================= */}
          {currentStep === 5 && (
            <div className="step-form-grid">
              <div className="form-field field-wide">
                <Checkbox
                  card
                  checked={!!form.trackStock}
                  onChange={(checked) => set("trackStock", checked)}
                  label="Track inventory quantity for this product"
                  description="Maintains exact inventory counts and triggers low-stock alerts when inventory drops to threshold."
                />
              </div>

              <Field
                label="Stock Quantity *"
                type="number"
                value={String(form.inventory)}
                onChange={(val) => set("inventory", Number(val))}
                placeholder="5"
              />
              <Field
                label="Low Stock Threshold"
                type="number"
                value={String(form.lowStockThreshold)}
                onChange={(val) => set("lowStockThreshold", Number(val))}
                placeholder="2"
              />
              <SelectForm
                label="Availability Status"
                value={
                  form.inventory === 0
                    ? "Out of stock"
                    : form.inventory <= form.lowStockThreshold
                    ? "Low stock"
                    : "In stock"
                }
                options={["In stock", "Low stock", "Out of stock"]}
                onChange={(val) => set("status", val as ProductRecord["status"])}
              />
              <Field
                label="Minimum Order Quantity (MOQ)"
                type="number"
                value={String(form.minOrderQuantity || 1)}
                onChange={(val) => set("minOrderQuantity", Number(val))}
                placeholder="1"
              />

              <div className="form-field field-wide">
                <Checkbox
                  card
                  checked={!!form.allowBackorders}
                  onChange={(checked) => set("allowBackorders", checked)}
                  label="Allow customer backorders when this product is out of stock"
                  description="Shoppers can still complete purchase when local warehouse inventory is zero. Fulfillment occurs upon restock."
                />
              </div>

              {/* Product Variants Table */}
              <div className="form-field field-wide variants-container">
                <div className="variants-header">
                  <div>
                    <strong>Product Variants (Optional)</strong>
                    <p>Add size, cloth colour, weight, or joint configurations</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleAddVariant}>
                    <Plus size={14} /> Add Variant
                  </Button>
                </div>

                {(form.variants || []).length > 0 ? (
                  <div className="variants-table-wrap">
                    <table className="variants-table">
                      <thead>
                        <tr>
                          <th>Variant Name</th>
                          <th>SKU</th>
                          <th>Price (₹)</th>
                          <th>Stock</th>
                          <th>Availability</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {(form.variants || []).map((variant, index) => (
                          <tr key={variant.id}>
                            <td>
                              <input
                                type="text"
                                value={variant.name}
                                onChange={(e) => {
                                  const next = [...(form.variants || [])];
                                  next[index].name = e.target.value;
                                  set("variants", next);
                                }}
                                placeholder="e.g. 10ft Green Cloth"
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={variant.sku}
                                onChange={(e) => {
                                  const next = [...(form.variants || [])];
                                  next[index].sku = e.target.value;
                                  set("variants", next);
                                }}
                                placeholder="HCS-CLB-10FT-GRN"
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                value={variant.price}
                                onChange={(e) => {
                                  const next = [...(form.variants || [])];
                                  next[index].price = Number(e.target.value);
                                  set("variants", next);
                                }}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                value={variant.inventory}
                                onChange={(e) => {
                                  const next = [...(form.variants || [])];
                                  next[index].inventory = Number(e.target.value);
                                  set("variants", next);
                                }}
                              />
                            </td>
                            <td>
                              <SelectField
                                value={variant.availability}
                                options={["In stock", "Out of stock", "Pre-order"]}
                                onChange={(val) => {
                                  const next = [...(form.variants || [])];
                                  next[index].availability = val as ProductVariant["availability"];
                                  set("variants", next);
                                }}
                                className="table-select-compact"
                              />
                            </td>
                            <td>
                              <button
                                type="button"
                                className="row-action"
                                onClick={() => handleRemoveVariant(variant.id)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="variants-empty">
                    <span>No variants configured. Product will be sold as a single standard unit.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              STEP 06: PRODUCT SPECIFICATIONS (Category-Dynamic Specs + Custom)
             ========================================================================= */}
          {currentStep === 6 && (
            <div className="step-form-grid">
              {/* Dynamic specs based on selected category */}
              {(defaultCategorySpecs[form.category] || []).map((spec) => (
                <Field
                  key={spec.key}
                  label={spec.label}
                  value={form.specs[spec.key] ?? spec.defaultVal ?? ""}
                  onChange={(val) => set("specs", { ...form.specs, [spec.key]: val })}
                  placeholder={spec.placeholder}
                />
              ))}

              {/* Any additional custom specs */}
              {Object.entries(form.specs || {})
                .filter(([k]) => !(defaultCategorySpecs[form.category] || []).some((s) => s.key === k))
                .map(([key, value]) => (
                  <div key={key} className="form-field custom-spec-item">
                    <div className="custom-spec-header">
                      <span className="form-label">{key}</span>
                      <button
                        type="button"
                        className="remove-spec-link"
                        onClick={() => {
                          const next = { ...form.specs };
                          delete next[key];
                          set("specs", next);
                          toast.success(`Removed ${key}`);
                        }}
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => set("specs", { ...form.specs, [key]: e.target.value })}
                    />
                  </div>
                ))}

              {/* Add Custom Specification Row */}
              <div className="form-field field-wide add-custom-spec-box">
                <span className="form-label">Add Custom Specification</span>
                <div className="add-spec-inputs">
                  <input
                    type="text"
                    placeholder="Specification Name (e.g. Slate Honing)"
                    value={customKey}
                    onChange={(e) => setCustomKey(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Specification Value (e.g. Diamond Honed Precision Slate)"
                    value={customVal}
                    onChange={(e) => setCustomVal(e.target.value)}
                  />
                  <Button variant="outline" size="sm" onClick={handleAddCustomSpec}>
                    <Plus size={14} /> Add Specification
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              STEP 07: SHIPPING & DELIVERY (Optional Step)
             ========================================================================= */}
          {currentStep === 7 && (
            <div className="step-form-grid">
              <div className="field-wide">
                <Checkbox
                  card
                  checked={!!form.shippingSkip}
                  onChange={(checked) => set("shippingSkip", checked)}
                  label="Skip shipping configuration for this product"
                  description="Enable this when parcel dimensions, weight or custom freight calculations are not applicable (standard store shipping applies)."
                />
              </div>

              {!form.shippingSkip ? (
                <>
                  <Field
                    label="Product Weight"
                    value={form.weight || ""}
                    onChange={(val) => set("weight", val)}
                    placeholder="e.g. 320 kg (for tables) or 18.2 oz (for cues)"
                  />
                  <SelectForm
                    label="Measurement Unit"
                    value={form.measurementUnit || "cm"}
                    options={["cm", "mm", "inches"]}
                    onChange={(val) => set("measurementUnit", val as "cm" | "mm" | "inches")}
                  />
                  <div className="form-field field-wide">
                    <span className="form-label">Package Dimensions (Length × Width × Height)</span>
                    <div className="dimensions-input-row">
                      <input
                        type="text"
                        placeholder="Length"
                        value={form.packageLength || ""}
                        onChange={(e) => set("packageLength", e.target.value)}
                      />
                      <span>×</span>
                      <input
                        type="text"
                        placeholder="Width"
                        value={form.packageWidth || ""}
                        onChange={(e) => set("packageWidth", e.target.value)}
                      />
                      <span>×</span>
                      <input
                        type="text"
                        placeholder="Height"
                        value={form.packageHeight || ""}
                        onChange={(e) => set("packageHeight", e.target.value)}
                      />
                      <span className="unit-label">{form.measurementUnit || "cm"}</span>
                    </div>
                  </div>

                  <SelectForm
                    label="Shipping Class"
                    value={form.shippingClass || "Heavy / Oversized"}
                    options={["Standard", "Heavy / Oversized", "Fragile"]}
                    onChange={(val) => set("shippingClass", val as ProductRecord["shippingClass"])}
                  />
                  <SelectForm
                    label="Delivery Type"
                    value={form.deliveryType || "Special Delivery"}
                    options={["Standard Delivery", "Express Delivery", "Special Delivery"]}
                    onChange={(val) => set("deliveryType", val as ProductRecord["deliveryType"])}
                  />
                  <SelectForm
                    label="Shipping Charges"
                    value={form.shippingCharges || "Fixed Charge"}
                    options={["Free Shipping", "Fixed Charge", "Calculated at Checkout"]}
                    onChange={(val) => set("shippingCharges", val as ProductRecord["shippingCharges"])}
                  />

                  <div className="form-field field-wide">
                    <Checkbox
                      card
                      checked={!!form.installationRequired}
                      onChange={(checked) => set("installationRequired", checked)}
                      label="Professional On-Site Installation Required"
                      description="Requires a specialized cue sports installation team for precision leveling, slating, and baize fitting."
                    />
                  </div>

                  {form.installationRequired && (
                    <Field
                      label="Installation Type & Team"
                      value={form.installationType || ""}
                      onChange={(val) => set("installationType", val)}
                      placeholder="e.g. 4-Man Team On-Site Precision Laser Leveling & Baize Fitting"
                    />
                  )}

                  <Field
                    label="Warranty Information"
                    value={form.warrantyInfo || ""}
                    onChange={(val) => set("warrantyInfo", val)}
                    placeholder="e.g. 5-Year Structural Frame Warranty against warping"
                  />
                  <Field
                    label="Return Eligibility"
                    value={form.returnEligibility || ""}
                    onChange={(val) => set("returnEligibility", val)}
                    placeholder="e.g. 7-Day inspection upon delivery for transit defects"
                  />
                </>
              ) : (
                <div className="field-wide shipping-skipped-notice">
                  <AlertCircle size={20} />
                  <div>
                    <strong>Shipping configuration is skipped for this product.</strong>
                    <p>Default standard store delivery and shipping rates will apply at checkout.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              STEP 09: SEO & SEARCH VISIBILITY
             ========================================================================= */}
          {currentStep === 9 && (
            <div className="step-form-grid">
              <Field
                label="SEO Title"
                value={form.seoTitle}
                onChange={(val) => set("seoTitle", val)}
                placeholder="e.g. Riley Clubman 10ft Snooker Table | Hyderabad Cue Sports"
                wide
              />
              <div className="form-field field-wide">
                <div className="custom-spec-header">
                  <span className="form-label">URL Slug *</span>
                  <button type="button" className="generate-slug-link" onClick={generateSlug}>
                    Generate from Name
                  </button>
                </div>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => set("slug", e.target.value)}
                  placeholder="riley-clubman-10ft-snooker-table"
                />
              </div>
              <Field
                label="Meta Description"
                value={form.seoDescription}
                onChange={(val) => set("seoDescription", val)}
                placeholder="Concise 150-160 character snippet appearing under your title in Google search results"
                wide
                textarea
              />
              <Field
                label="Focus Keyword"
                value={form.focusKeyword || ""}
                onChange={(val) => set("focusKeyword", val)}
                placeholder="e.g. snooker table, riley clubman, 10ft snooker table"
              />
              <SelectForm
                label="Search Engine Visibility"
                value={form.searchEngineVisibility || "Index"}
                options={["Index", "No Index"]}
                onChange={(val) => set("searchEngineVisibility", val as "Index" | "No Index")}
              />
              <Field
                label="Canonical URL (Optional)"
                value={form.canonicalUrl || ""}
                onChange={(val) => set("canonicalUrl", val)}
                placeholder="e.g. https://hyderabadcuesports.in/products/..."
                wide
              />

              {/* Google Snippet Preview */}
              <div className="field-wide google-snippet-card">
                <span className="google-snippet-eyebrow">Google Search Result Preview</span>
                <div className="google-snippet-body">
                  <div className="google-url-row">
                    <div className="google-icon-circle">H</div>
                    <div className="google-url-text">
                      <span>hyderabadcuesports.in</span>
                      <small>› products › {form.slug || "product-url-slug"}</small>
                    </div>
                  </div>
                  <h3 className="google-title">
                    {form.seoTitle || form.name || "Product Title Preview"}
                  </h3>
                  <p className="google-desc">
                    {form.seoDescription ||
                      form.shortDescription ||
                      "Experience championship grade cue sports tables, tournament cues, and authentic Strachan baize cloth handcrafted for clubs and luxury homes."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              STEP 10: REVIEW & PUBLISH (Complete Structured Summary & Inline Edits)
             ========================================================================= */}
          {currentStep === 10 && (
            <div className="review-summary-container">
              {/* Review Section 1: Product Identity */}
              <div className="review-block">
                <div className="review-block-header">
                  <strong>01. Product Identity</strong>
                  <button type="button" onClick={() => handleStepClick(1)}>
                    <Pencil size={13} /> Edit
                  </button>
                </div>
                <div className="review-block-grid">
                  <div>
                    <span>Product Name</span>
                    <strong>{form.name || "Untitled"}</strong>
                  </div>
                  <div>
                    <span>SKU</span>
                    <strong>{form.sku || "Not specified"}</strong>
                  </div>
                  <div>
                    <span>Brand</span>
                    <strong>{form.brand}</strong>
                  </div>
                  <div>
                    <span>Product Type</span>
                    <strong>{form.productType || "Physical Product"}</strong>
                  </div>
                </div>
              </div>

              {/* Review Section 2: Category & Organisation */}
              <div className="review-block">
                <div className="review-block-header">
                  <strong>02. Category & Organisation</strong>
                  <button type="button" onClick={() => handleStepClick(2)}>
                    <Pencil size={13} /> Edit
                  </button>
                </div>
                <div className="review-block-grid">
                  <div>
                    <span>Primary Category</span>
                    <strong>{form.category}</strong>
                  </div>
                  <div>
                    <span>Subcategory</span>
                    <strong>{form.subcategory}</strong>
                  </div>
                  <div>
                    <span>Collection</span>
                    <strong>{form.collection || "None"}</strong>
                  </div>
                  <div>
                    <span>CMS Merchandising</span>
                    <strong>Configured in CMS</strong>
                  </div>
                </div>
              </div>

              {/* Review Section 3: Description & Media */}
              <div className="review-block">
                <div className="review-block-header">
                  <strong>03. Description & Media</strong>
                  <button type="button" onClick={() => handleStepClick(3)}>
                    <Pencil size={13} /> Edit
                  </button>
                </div>
                <div className="review-block-grid">
                  <div>
                    <span>Images</span>
                    <strong>{(form.images || []).length} photos uploaded</strong>
                  </div>
                  <div>
                    <span>Short Description</span>
                    <strong>{form.shortDescription ? "Provided" : "Empty"}</strong>
                  </div>
                  <div>
                    <span>Video URL</span>
                    <strong>{form.videoUrl ? "Provided" : "None"}</strong>
                  </div>
                  <div>
                    <span>Alt Text</span>
                    <strong>{form.imageAltText ? "Set" : "None"}</strong>
                  </div>
                </div>
              </div>

              {/* Review Section 4: Pricing & Platform Fee */}
              <div className="review-block">
                <div className="review-block-header">
                  <strong>04. Pricing & Platform Fee</strong>
                  <button type="button" onClick={() => handleStepClick(4)}>
                    <Pencil size={13} /> Edit
                  </button>
                </div>
                <div className="review-block-grid">
                  <div>
                    <span>Regular Price</span>
                    <strong>{formatINR(form.price)}</strong>
                  </div>
                  <div>
                    <span>Sale Price</span>
                    <strong>{form.salePrice ? formatINR(form.salePrice) : "None"}</strong>
                  </div>
                  <div>
                    <span>Platform Fee</span>
                    <strong>
                      {isPercentage ? `${feeValue}%` : "Fixed"} ({formatINR(calculatedFee)})
                    </strong>
                  </div>
                  <div>
                    <span>Final Customer Price</span>
                    <strong className="text-forest">{formatINR(finalCustomerPrice)}</strong>
                  </div>
                </div>
              </div>

              {/* Review Section 5: Inventory & Variants */}
              <div className="review-block">
                <div className="review-block-header">
                  <strong>05. Inventory & Variants</strong>
                  <button type="button" onClick={() => handleStepClick(5)}>
                    <Pencil size={13} /> Edit
                  </button>
                </div>
                <div className="review-block-grid">
                  <div>
                    <span>Stock Quantity</span>
                    <strong>{form.inventory} units</strong>
                  </div>
                  <div>
                    <span>Low Stock Alert</span>
                    <strong>At {form.lowStockThreshold} units</strong>
                  </div>
                  <div>
                    <span>Tracking</span>
                    <strong>{form.trackStock ? "Enabled" : "Untracked"}</strong>
                  </div>
                  <div>
                    <span>Variants</span>
                    <strong>{(form.variants || []).length} configured</strong>
                  </div>
                </div>
              </div>

              {/* Review Section 6: Specifications */}
              <div className="review-block">
                <div className="review-block-header">
                  <strong>06. Specifications</strong>
                  <button type="button" onClick={() => handleStepClick(6)}>
                    <Pencil size={13} /> Edit
                  </button>
                </div>
                <div className="review-specs-inline">
                  {Object.entries(form.specs || {}).map(([k, v]) => (
                    <span key={k} className="review-spec-pill">
                      <strong>{k}:</strong> {v}
                    </span>
                  ))}
                </div>
              </div>

              {/* Review Section 7: Shipping & Delivery */}
              <div className="review-block">
                <div className="review-block-header">
                  <strong>07. Shipping & Delivery</strong>
                  <button type="button" onClick={() => handleStepClick(7)}>
                    <Pencil size={13} /> Edit
                  </button>
                </div>
                <div className="review-block-grid">
                  <div>
                    <span>Status</span>
                    <strong>{form.shippingSkip ? "Skipped (Default Rates)" : "Configured"}</strong>
                  </div>
                  <div>
                    <span>Weight</span>
                    <strong>{form.weight || "Not specified"}</strong>
                  </div>
                  <div>
                    <span>Shipping Class</span>
                    <strong>{form.shippingClass || "Standard"}</strong>
                  </div>
                  <div>
                    <span>Installation</span>
                    <strong>{form.installationRequired ? "Required" : "Not Required"}</strong>
                  </div>
                </div>
              </div>

              {/* Review Section 9: SEO & Visibility */}
              <div className="review-block">
                <div className="review-block-header">
                  <strong>09. SEO & Search Visibility</strong>
                  <button type="button" onClick={() => handleStepClick(9)}>
                    <Pencil size={13} /> Edit
                  </button>
                </div>
                <div className="review-block-grid">
                  <div>
                    <span>SEO Title</span>
                    <strong>{form.seoTitle || form.name || "Default"}</strong>
                  </div>
                  <div>
                    <span>URL Slug</span>
                    <strong>/products/{form.slug || "slug"}</strong>
                  </div>
                  <div>
                    <span>Indexing</span>
                    <strong>{form.searchEngineVisibility || "Index"}</strong>
                  </div>
                  <div>
                    <span>Focus Keyword</span>
                    <strong>{form.focusKeyword || "None"}</strong>
                  </div>
                </div>
              </div>

              {/* Final Actions Callout */}
              <div className="final-publish-callout">
                <div>
                  <h4>Ready to save or publish this product?</h4>
                  <p>
                    Publishing makes this product immediately active in catalog search, categories, and checkout.
                  </p>
                </div>
                <div className="final-actions-row">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSave("Draft")}
                  >
                    Save as Draft
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSave("Published")}
                  >
                    <Check size={14} /> Publish Product Now
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM WIZARD CONTROLS (Back Arrow / Save as Draft / Next Step) */}
        <div className="wizard-bottom-nav">
          <button
            type="button"
            onClick={handlePrev}
            className="wizard-back-arrow-btn"
            aria-label="Previous step"
            title={currentStep === 1 ? "Cancel and return to list" : "Previous step"}
          >
            <ArrowLeft size={20} strokeWidth={2.2} />
          </button>

          <div className="wizard-right-actions">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSave("Draft")}
              className="save-draft-btn"
            >
              Save as Draft
            </Button>

            {currentStep !== 10 ? (
              <Button
                size="sm"
                onClick={validateAndNext}
                className="wizard-next-btn"
              >
                Continue <ArrowRight size={14} />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => handleSave("Published")}
                className="wizard-publish-btn"
              >
                <Check size={14} /> Publish Product
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   REUSABLE FORM INPUT COMPONENTS
   ========================================================================= */

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  wide = false,
  textarea = false,
  help,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  wide?: boolean;
  textarea?: boolean;
  help?: string;
}) {
  return (
    <label className={`form-field ${wide ? "field-wide" : ""}`}>
      <div className="form-label-row">
        <span className="form-label">{label}</span>
        {help && <small className="field-help-counter">{help}</small>}
      </div>
      {textarea ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={3}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
      )}
    </label>
  );
}

function SelectForm({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="form-field">
      <span className="form-label">{label}</span>
      <SelectField value={value} onChange={onChange} options={options} />
    </div>
  );
}
