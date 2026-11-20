import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Barcode,
  Bold,
  Box,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  Eye,
  FileCheck,
  FileText,
  Globe,
  HelpCircle,
  ImagePlus,
  IndianRupee,
  Info,
  Italic,
  Layers,
  Link2,
  List,
  ListOrdered,
  Maximize2,
  Monitor,
  MoreHorizontal,
  Package,
  Pencil,
  Percent,
  Plus,
  RotateCcw,
  Ruler,
  Save,
  Search,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Table as TableIcon,
  Tag,
  Trash2,
  Truck,
  Underline,
  Upload,
  Wrench,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { categoryOptions } from "@/data/phase2Data";
import { formatINR } from "@/data/mockData";
import { Button, Checkbox, EmptyState, SectionCard, SelectField, SortIcon, StatusBadge } from "@/components/admin/Primitives";
import type {
  B2BPriceTier,
  ConfiguratorOption,
  DownloadableDoc,
  MediaItem,
  ProductApprovalStatus,
  ProductRecord,
  ProductType,
  ProductVariant,
  ProductVisibility,
  PublicationStatus,
  SalesMode,
  ShippingCrate,
} from "@/types/admin";

type ProductView =
  | { mode: "list" }
  | { mode: "form"; productId: string | null }
  | { mode: "details"; productId: string };

type StepNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

const salesModeOptions: SalesMode[] = [
  "Buy Now",
  "Request a Quote",
  "Hybrid",
  "Booking with Advance",
];

const productTypeOptions: ProductType[] = [
  "Simple",
  "Variable",
  "Made-to-Order",
  "Bundle",
  "Service",
];

const gameTypeOptions = [
  "Snooker",
  "Pool (US 8-ball)",
  "English Pool",
  "Carom Billiards",
  "Multi-game",
];

const customerSegmentOptions = [
  "Home / Villa",
  "Commercial Club",
  "Hotel & Hospitality",
  "Professional Player",
];

const productBadgeOptions = [
  "Handcrafted",
  "Tournament Grade",
  "Limited Edition",
  "Made in Hyderabad",
  "WPBSA Spec",
  "BCA Certified",
];

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

// Part 3 Technical Specification Templates (with installation moved exclusively to Step 8)
const tableSizeCalculations: Record<string, { playingArea: string; externalDims: string; roomFt: string }> = {
  "12 ft": {
    playingArea: '3569 × 1778 mm (140.5" × 70")',
    externalDims: "3820 × 2035 mm",
    roomFt: "22 ft × 16 ft (6.7m × 4.9m)",
  },
  "10 ft": {
    playingArea: '2946 × 1473 mm (116" × 58")',
    externalDims: "3180 × 1710 mm",
    roomFt: "20 ft × 15 ft (6.1m × 4.6m)",
  },
  "9 ft": {
    playingArea: '2540 × 1270 mm (100" × 50")',
    externalDims: "2780 × 1510 mm",
    roomFt: "18.5 ft × 14.5 ft (5.6m × 4.4m)",
  },
  "8 ft": {
    playingArea: '2240 × 1120 mm (88" × 44")',
    externalDims: "2480 × 1360 mm",
    roomFt: "17.5 ft × 13.5 ft (5.3m × 4.1m)",
  },
  "7 ft": {
    playingArea: '1980 × 990 mm (78" × 39")',
    externalDims: "2220 × 1230 mm",
    roomFt: "16.5 ft × 13 ft (5.0m × 4.0m)",
  },
  "6 ft": {
    playingArea: '1828 × 914 mm (72" × 36")',
    externalDims: "2050 × 1150 mm",
    roomFt: "15.5 ft × 12.5 ft (4.7m × 3.8m)",
  },
};

const defaultCategorySpecs: Record<
  string,
  { key: string; label: string; placeholder: string; options?: string[]; defaultStorefront?: boolean; defaultFilter?: boolean }[]
> = {
  Tables: [
    {
      key: "Table size",
      label: "Table Size",
      placeholder: "e.g. 12 ft",
      options: ["12 ft", "10 ft", "9 ft", "8 ft", "7 ft", "6 ft"],
      defaultStorefront: true,
      defaultFilter: true,
    },
    {
      key: "Playing area",
      label: "Playing Area (Calculated)",
      placeholder: '3569 × 1778 mm (140.5" × 70")',
      defaultStorefront: true,
      defaultFilter: false,
    },
    {
      key: "Overall dimensions",
      label: "Overall External Dimensions",
      placeholder: "3820 × 2035 mm",
      defaultStorefront: true,
      defaultFilter: false,
    },
    {
      key: "Bed height",
      label: "Bed Height (to cushion top)",
      placeholder: "851–876 mm (WPBSA standard)",
      options: ["851–876 mm (WPBSA Spec)", "800–850 mm", "820 mm standard"],
      defaultStorefront: true,
      defaultFilter: false,
    },
    {
      key: "Slate thickness",
      label: "Slate Thickness",
      placeholder: "45 mm (Championship)",
      options: ["45 mm (Championship)", "40 mm", "30 mm", "25 mm", "50 mm Ultra-Heavy"],
      defaultStorefront: true,
      defaultFilter: true,
    },
    {
      key: "Slate pieces",
      label: "Slate Pieces",
      placeholder: "5-Piece Precision Honed",
      options: ["5-Piece Precision Diamond Honed", "3-Piece", "1-Piece Single Slab"],
      defaultStorefront: true,
      defaultFilter: false,
    },
    {
      key: "Slate origin",
      label: "Slate Origin",
      placeholder: "Italian (Ligurian)",
      options: ["Italian (Ligurian Slate)", "Brazilian Slate", "Indian (Rajasthan) Slate", "Chinese (Jiujiang) Slate"],
      defaultStorefront: true,
      defaultFilter: true,
    },
    {
      key: "Bed heating",
      label: "Bed Heating System",
      placeholder: "Yes / No",
      options: ["Integrated Thermostatic Bed Heating (Yes)", "None (No)"],
      defaultStorefront: true,
      defaultFilter: true,
    },
    {
      key: "Frame wood",
      label: "Frame / Cabinet Wood",
      placeholder: "Solid Seasoned Teak",
      options: ["Solid Seasoned Teak", "Solid Mahogany", "English Oak", "American Black Walnut", "Rubberwood / Hardwood"],
      defaultStorefront: true,
      defaultFilter: true,
    },
    {
      key: "Table finish",
      label: "Wood Finish",
      placeholder: "Hand-Rubbed Gloss Mahogany",
      options: ["Hand-Rubbed Gloss Mahogany", "Satin Matt Antique", "High-Gloss Piano Black Lacquer", "Natural Golden Teak Oil"],
      defaultStorefront: true,
      defaultFilter: true,
    },
    {
      key: "Cushion rubber",
      label: "Cushion Rubber",
      placeholder: "Northern Rubber (UK)",
      options: ["Northern Rubber (UK) Championship", "L-77 Match Profile", "K-66 Speed Cushions", "Steel Block Cushions"],
      defaultStorefront: true,
      defaultFilter: true,
    },
    {
      key: "Cloth baize",
      label: "Cloth / Baize",
      placeholder: "Strachan 6811 Pure Wool 30oz",
      options: ["Strachan 6811 Pure Wool 30oz", "Strachan Superfine Tournament", "Iwan Simonis 860", "Hainsworth Match"],
      defaultStorefront: true,
      defaultFilter: true,
    },
    {
      key: "Pocket spec",
      label: "Pocket Specification",
      placeholder: "WPBSA Championship Tournament Template",
      options: ["WPBSA Championship Tournament Template", "Club Standard Template", "Drop Pockets", "Ball Return Track"],
      defaultStorefront: true,
      defaultFilter: false,
    },
    {
      key: "Pocket leather",
      label: "Pocket Leather & Cappings",
      placeholder: "Hand-Stitched English Cowhide with Brass Plates",
      options: ["Hand-Stitched English Cowhide with Brass Plates", "Hand-Dyed Oxblood Leather", "Heavy Duty Molded Vinyl"],
      defaultStorefront: true,
      defaultFilter: false,
    },
    {
      key: "Levelling system",
      label: "Levelling Mechanism",
      placeholder: "8-Point Solid Brass Micro-Levelling System",
      options: ["8-Point Solid Brass Micro-Levelling System", "Multi-Point Heavy Duty Shims", "Adjustable Brass Feet"],
      defaultStorefront: true,
      defaultFilter: false,
    },
    {
      key: "Total weight",
      label: "Total Approximate Weight",
      placeholder: "1,150 kg (approx.)",
      options: ["1,150 kg (approx.)", "900 kg", "650 kg", "450 kg", "320 kg"],
      defaultStorefront: true,
      defaultFilter: false,
    },
  ],
  Cues: [
    {
      key: "Cue type",
      label: "Cue Type",
      placeholder: "3/4 Jointed Snooker Cue",
      options: ["3/4 Jointed Snooker Cue", "1-Piece English Ash", "2-Piece Center Joint", "Break / Jump Pool Cue"],
      defaultStorefront: true,
      defaultFilter: true,
    },
    {
      key: "Cue length",
      label: "Length",
      placeholder: '58 inches (147 cm)',
      options: ['58 inches (147 cm)', '57 inches (145 cm)', '59 inches (150 cm)', '55 inches (Junior)'],
      defaultStorefront: true,
      defaultFilter: true,
    },
    {
      key: "Cue weight",
      label: "Weight",
      placeholder: "18.2 oz",
      options: ["17.5 oz", "18.0 oz", "18.2 oz", "18.5 oz", "19.0 oz", "19.5 oz"],
      defaultStorefront: true,
      defaultFilter: true,
    },
    {
      key: "Tip diameter",
      label: "Tip Diameter",
      placeholder: "9.5 mm",
      options: ["9.5 mm", "9.8 mm", "10.0 mm", "11.5 mm", "13.0 mm"],
      defaultStorefront: true,
      defaultFilter: true,
    },
    {
      key: "Tip brand",
      label: "Tip Brand & Grade",
      placeholder: "Kamui Black Medium",
      options: ["Kamui Black Medium", "Elk Master", "Century Pro G3", "Taom Fusion", "Blue Diamond", "Triangle"],
      defaultStorefront: true,
      defaultFilter: false,
    },
    {
      key: "Ferrule material",
      label: "Ferrule Material",
      placeholder: "Precision Threaded Brass",
      options: ["Precision Threaded Brass", "Titanium Alloy", "Stainless Steel", "Carbon Fiber"],
      defaultStorefront: true,
      defaultFilter: false,
    },
    {
      key: "Shaft wood",
      label: "Shaft Wood & Grade",
      placeholder: "Grade AAA North American Ash",
      options: ["Grade AAA North American Ash (Straight Grain)", "Hard Rock Canadian Maple", "Carbon Fiber Composite"],
      defaultStorefront: true,
      defaultFilter: true,
    },
    {
      key: "Butt wood",
      label: "Butt Wood",
      placeholder: "Solid Gaboon Ebony",
      options: ["Solid Gaboon Ebony", "East Indian Rosewood", "Cocobolo", "Purpleheart", "African Blackwood"],
      defaultStorefront: true,
      defaultFilter: true,
    },
    {
      key: "Splice design",
      label: "Splice Count & Veneers",
      placeholder: "4-Point Hand Spliced Solid Ebony",
      options: ["4-Point Hand Spliced Solid Ebony", "8-Point Butterfly Splicing", "Splice with Maple & Tulipwood Veneers"],
      defaultStorefront: true,
      defaultFilter: false,
    },
    {
      key: "Joint type",
      label: "Joint Mechanism",
      placeholder: "Quick-Release Precision Brass Vacuum Lock",
      options: ["Quick-Release Precision Brass Vacuum Lock", "Radial Pin", "Uni-Loc Quick-Release", "Wood-to-Wood"],
      defaultStorefront: true,
      defaultFilter: false,
    },
    {
      key: "Extension included",
      label: "Extension Included",
      placeholder: '6" Mini Butt + 18–28" Telescopic Extension Included',
      options: ['6" Mini Butt + 18–28" Telescopic Extension Included', 'Mini Butt Only', 'None (Optional Add-on)'],
      defaultStorefront: true,
      defaultFilter: false,
    },
  ],
  "Table Accessories": [
    {
      key: "Cloth grade",
      label: "Grade & Material",
      placeholder: "100% Pure Wool, 30oz Tournament",
      options: ["100% Pure Wool 30oz Tournament", "Strachan Superfine", "Iwan Simonis 860 Worsted", "Pure Phenolic Resin (Balls)"],
      defaultStorefront: true,
      defaultFilter: true,
    },
    {
      key: "Cut dimensions",
      label: "Cut Dimensions / Set Configuration",
      placeholder: "12 FT Bed & 6 Cushion Strips Pre-cut",
      options: ["12 FT Bed & 6 Cushion Strips Pre-cut", "10 FT Bed & Cushions", "Standard 22-Ball Snooker Set (2 1/16\")", "Standard 16-Ball Pool Set (2 1/4\")"],
      defaultStorefront: true,
      defaultFilter: true,
    },
    {
      key: "Surface finish",
      label: "Surface Finish & Nap",
      placeholder: "Directional Short Tournament Nap",
      options: ["Directional Short Tournament Nap", "Napless High-Speed Worsted", "High-Gloss Mirror Polish"],
      defaultStorefront: true,
      defaultFilter: false,
    },
    {
      key: "Compatibility",
      label: "Table Compatibility",
      placeholder: "Standard 10ft & 12ft Snooker Tables",
      options: ["12ft Full Size Snooker Tables", "10ft Club Snooker Tables", "8ft & 9ft Pool Tables", "Universal Accessories"],
      defaultStorefront: true,
      defaultFilter: true,
    },
  ],
  Scoreboards: [
    {
      key: "Display type",
      label: "Display Mechanism",
      placeholder: "Traditional Mahogany Pointer with Brass Railings",
      options: ["Traditional Mahogany Pointer with Brass Railings", "Electronic Ultra-Bright LED with Wireless Remote", "Wireless Touchscreen Match Controller"],
      defaultStorefront: true,
      defaultFilter: true,
    },
    {
      key: "Board dimensions",
      label: "Dimensions",
      placeholder: "90cm × 42cm × 8cm Wall-Mounted",
      defaultStorefront: true,
      defaultFilter: false,
    },
    {
      key: "Timber material",
      label: "Frame / Enclosure Material",
      placeholder: "Solid Seasoned Mahogany with Polished Brass",
      options: ["Solid Seasoned Mahogany & Polished Brass", "Solid Oak Frame", "Brushed Aerospace Aluminum"],
      defaultStorefront: true,
      defaultFilter: true,
    },
    {
      key: "Power supply",
      label: "Power / Control Mechanism",
      placeholder: "Manual Brass Slider / 220V AC Adapter",
      options: ["Manual Slide Mechanism (No Power)", "220V AC Power Adapter + Backup Battery", "Rechargeable Lithium-Ion"],
      defaultStorefront: true,
      defaultFilter: false,
    },
  ],
};

const hsnMasterTable = [
  { code: "9504 20 00", desc: "Billiards, snooker & pool tables, cues and accessories", gstRate: 18 },
  { code: "9504 90 90", desc: "Other sports and game equipment / parts", gstRate: 18 },
  { code: "9403 60 00", desc: "Wooden furniture (cue stands, scoreboard cabinets)", gstRate: 18 },
  { code: "9987 19", desc: "Maintenance, installation & table reclothing services", gstRate: 18 },
  { code: "5901 90 90", desc: "Specialist woollen baize & billiard cloth", gstRate: 12 },
  { code: "Custom", desc: "Enter custom HSN code", gstRate: 18 },
];

const defaultTableConfiguratorOptions: ConfiguratorOption[] = [
  { id: "opt-1", category: "Wood Finish", label: "Hand-Rubbed Dark Mahogany", priceDelta: 0, leadTimeDeltaDays: 0 },
  { id: "opt-2", category: "Wood Finish", label: "Solid Seasoned Golden Teak", priceDelta: 35000, leadTimeDeltaDays: 7 },
  { id: "opt-3", category: "Wood Finish", label: "High-Gloss Piano Black Lacquer", priceDelta: 45000, leadTimeDeltaDays: 10 },
  { id: "opt-4", category: "Cloth Colour", label: "Strachan Tournament Olive Green", priceDelta: 0, leadTimeDeltaDays: 0 },
  { id: "opt-5", category: "Cloth Colour", label: "Heritage Royal Burgundy Baize", priceDelta: 8000, leadTimeDeltaDays: 3 },
  { id: "opt-6", category: "Cloth Colour", label: "Prestige Royal Blue Baize", priceDelta: 8000, leadTimeDeltaDays: 3 },
  { id: "opt-7", category: "Leg Style", label: "Turned & Fluted Traditional Legs (8 pcs)", priceDelta: 0, leadTimeDeltaDays: 0 },
  { id: "opt-8", category: "Leg Style", label: "Hand-Carved Lion's Paw Heritage Legs", priceDelta: 28000, leadTimeDeltaDays: 14 },
  { id: "opt-9", category: "Pocket Leather", label: "Hand-Stitched English Chestnut Cowhide", priceDelta: 0, leadTimeDeltaDays: 0 },
  { id: "opt-10", category: "Pocket Leather", label: "Oxblood Red Hand-Dyed Leather", priceDelta: 6000, leadTimeDeltaDays: 2 },
  { id: "opt-11", category: "Fittings", label: "Solid Polished Brass Corner Plates", priceDelta: 0, leadTimeDeltaDays: 0 },
  { id: "opt-12", category: "Fittings", label: "Mirror Chrome Plated Corner Plates", priceDelta: 12000, leadTimeDeltaDays: 4 },
  { id: "opt-13", category: "Plaque", label: "Personalised Engraved Solid Brass Plaque", priceDelta: 3500, leadTimeDeltaDays: 2 },
];

const defaultTablePackages: ShippingCrate[] = [
  { id: "pkg-1", label: "Crate 1: Italian Slate Slabs (5 pcs diamond honed)", weightKg: 850, lengthCm: 185, widthCm: 75, heightCm: 45 },
  { id: "pkg-2", label: "Crate 2: Solid Wood Frame Rails & Cushion Blocks", weightKg: 160, lengthCm: 370, widthCm: 35, heightCm: 30 },
  { id: "pkg-3", label: "Crate 3: Turned Legs (8 pcs) & Levelling System", weightKg: 95, lengthCm: 90, widthCm: 90, heightCm: 85 },
  { id: "pkg-4", label: "Crate 4: Strachan Cloth, Pocket Leathers & Nets", weightKg: 25, lengthCm: 120, widthCm: 40, heightCm: 30 },
  { id: "pkg-5", label: "Crate 5: Hardware, Bolts, Brass Cappings & Shims", weightKg: 20, lengthCm: 60, widthCm: 40, heightCm: 25 },
];

function makeDraft(): ProductRecord {
  return {
    id: `prod-${Date.now()}`,
    name: "",
    category: "",
    subcategory: "",
    sku: "",
    price: 0,
    salePrice: 0,
    mrp: 0,
    costPrice: 0,
    inventory: 0,
    status: "In stock",
    publication: "Draft",
    brand: "",
    accent: "#c5d6c3",
    initials: "",
    shortDescription: "",
    description: "",
    tax: "GST 18%",
    lowStockThreshold: 2,
    weight: "",
    dimensions: "",
    specs: {},
    featured: false,
    bestseller: false,
    newArrival: false,
    seoTitle: "",
    seoDescription: "",
    slug: "",
    imageCount: 0,

    // Step 01: Product Identity & India Compliance
    productType: "Simple",
    salesMode: "Buy Now",
    modelName: "",
    gtinBarcode: "",
    countryOfOrigin: "India",
    manufacturerDetails: "Hyderabad Cue Sports Pvt Ltd, Plot 42, Road No 36, Jubilee Hills, Hyderabad, Telangana 500033",
    netQuantity: "",
    internalNotes: "",
    approvalStatus: "Draft",

    // Step 02: Category & Organisation
    collection: "",
    gameTypes: ["Snooker"],
    customerSegments: ["Home / Villa", "Commercial Club"],
    productBadges: ["Handcrafted"],
    bestsellerOverride: "auto",
    newArrivalOverride: "auto",

    // Step 03: Specifications
    specVisibility: {},
    customSpecs: [],
    customSpecsList: [],

    // Step 04: Variants & Configuration
    variants: [],
    configuratorOptions: defaultTableConfiguratorOptions,

    // Step 05: Pricing & Tax
    saleStartDate: "",
    saleEndDate: "",
    priceOnRequest: false,
    advanceBookingType: "Percentage",
    advanceBookingValue: 30,
    installationCharge: 0,
    emiEligible: true,
    hsnCode: "9504 20 00",
    hsnGstRate: 18,
    b2bTiers: [
      { minQty: 1, maxQty: 4, discountPercent: 0, customerGroup: "Retail" },
      { minQty: 5, maxQty: 9, discountPercent: 10, customerGroup: "Commercial Club" },
      { minQty: 10, maxQty: 99, discountPercent: 18, customerGroup: "Dealer / Trade" },
    ],
    platformFeeType: "Percentage",
    platformFeeValue: 5,
    feeMode: "on_top",

    // Step 06: Inventory & Tracking
    trackStock: true,
    allowBackorders: false,
    minOrderQuantity: 1,
    maxOrderQuantity: 10,
    productionLeadTime: "6–8 weeks",
    warehouseLocation: "Jubilee Hills Central Warehouse",
    serialTrackingEnabled: true,
    dyeLotNumber: "",
    dyeLotDate: "",

    // Step 07: Description & Media
    images: [],
    primaryImage: "",
    imageAltText: "",
    videoUrl: "",
    mediaItems: [],
    downloadableDocs: [
      {
        id: "doc-1",
        title: "Official Dimension & Specification Sheet",
        type: "Spec Sheet PDF",
        url: "https://hyderabadcuesports.in/docs/hcs-spec-sheet-sample.pdf",
      },
    ],

    // Step 08: Shipping, Delivery & Installation
    shippingSkip: false,
    shippingClass: "Heavy / Oversized",
    deliveryType: "Standard Delivery",
    shippingCharges: "Fixed Charge",
    packages: defaultTablePackages,
    dispatchDays: 3,
    installationModel: "Included",
    installationRequired: true,
    installationType: "Senior Cue Sports Technicians - Laser Bed Levelling & Baize Fitting",
    technicianTeamSize: "3 Technicians",
    onSiteDuration: "1 Full Working Day (8-10 Hours)",
    siteSurveyRequired: false,
    minRoomLengthFt: 22,
    minRoomWidthFt: 16,
    minDoorWidthCm: 90,
    liftAccessRequired: false,
    minFloorLoadRating: "250 kg/m²",
    measurementUnit: "cm",

    // Step 09: Warranty, Returns & Documents
    warrantyInfo: "5-Year Frame & Lifetime Slate Warranty",
    warrantySlate: "Lifetime warranty against slate sagging or structural fracture under indoor play",
    warrantyFrame: "5-Year structural timber warranty against warping, shrinkage or joint defects",
    warrantyCushions: "3-Year Northern Rubber resilience and bounce warranty",
    warrantyCloth: "Initial defect inspection upon handover (normal play wear excluded)",
    warrantyExclusions: "Outdoor exposure, excessive humidity, liquid stains, or uncertified relocations",
    returnEligibility: "Replacement only for verified transit damage or manufacturing defects",
    returnWindowDays: 7,
    restockingFeePercent: 10,
    certificateOfAuthenticity: true,

    // Step 10: Related Products
    autoCompatibilityMatching: true,
    roomBundleItems: [
      "Shadowless 6-Shade Brass Canopy Light",
      "Deluxe 8-Cue Wall Stand (Solid Mahogany)",
      "Aramith 1G Tournament Snooker Ball Set",
      "Traditional Brass Pointer Match Scoreboard",
    ],
    roomBundleDiscount: 10,
    spareParts: [
      "Northern Rubber Replacement Cushion Strips",
      "Strachan 6811 Pre-Cut Replacement Baize",
      "Hand-Stitched Brass Corner Net Pockets",
      "Solid Brass Precision Micro-Levelling Shims",
    ],

    // Step 11: SEO & Schema
    focusKeyword: "",
    canonicalUrl: "",
    searchEngineVisibility: "Index",
    ogImage: "",
    oldSlug: "",

    // Step 12: Review & Publish
    visibility: "Public",
    scheduledPublishAt: "",
  };
}

export default function ProductModule({
  products,
  setProducts,
}: {
  products: ProductRecord[];
  setProducts: React.Dispatch<React.SetStateAction<ProductRecord[]>>;
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

  const bulkDelete = async () => {
    if (!selected.length) return;
    if (!window.confirm(`Delete ${selected.length} selected product${selected.length > 1 ? "s" : ""}?`)) return;
    const toDelete = [...selected];
    setProducts((prev) => prev.filter((product) => !toDelete.includes(product.id)));
    setSelected([]);
    toast.success("Deleting products from catalog...");
    try {
      await Promise.all(
        toDelete.map((id) =>
          fetch(`http://localhost:5000/api/admin/products/${encodeURIComponent(id)}`, {
            method: "DELETE",
          })
        )
      );
      toast.success("Products removed from database and storefront");
    } catch (err) {
      console.error("Bulk delete error:", err);
    }
  };

  const bulkPublish = async (status: PublicationStatus) => {
    if (!selected.length) return;
    const targetIds = [...selected];
    const updated = products.map((product) =>
      targetIds.includes(product.id) ? { ...product, publication: status } : product
    );
    setProducts(updated);
    setSelected([]);
    toast.success(`Updating products to ${status.toLowerCase()}...`);
    try {
      const targets = updated.filter((p) => targetIds.includes(p.id));
      await Promise.all(
        targets.map((prod) =>
          fetch("http://localhost:5000/api/admin/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(prod),
          })
        )
      );
      toast.success(`Products moved to ${status.toLowerCase()} in database and live storefront`);
    } catch (err) {
      console.error("Bulk publish error:", err);
    }
  };

  if (view.mode === "form") {
    const existing = view.productId ? products.find((p) => p.id === view.productId) : undefined;
    return (
      <ProductForm
        key={existing ? `edit-${existing.id}` : "add-new-product"}
        product={existing}
        onBack={() => setView({ mode: "list" })}
        onSave={async (saved) => {
          try {
            const res = await fetch("http://localhost:5000/api/admin/products", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(saved),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
              toast.error(data.message || "Failed to save product to database");
              return;
            }
            const serverSaved: ProductRecord = data.product
              ? {
                  ...saved,
                  id: data.product.id || saved.id,
                  slug: data.product.slug || saved.slug,
                  publication: (data.product.publication_status as PublicationStatus) || saved.publication,
                }
              : saved;

            // Put the newly created / edited product at the very top of the list
            setProducts((prev) => [serverSaved, ...prev.filter((p) => p.id !== serverSaved.id)]);
            setPage(1);
            setPublication("All statuses");
            setView({ mode: "list" });
            toast.success(
              saved.publication === "Draft"
                ? `Draft "${saved.name}" saved and listed on top in products!`
                : `Product "${saved.name}" published live to database & storefront!`
            );
          } catch (err) {
            console.error("Save product error:", err);
            setProducts((prev) => [saved, ...prev.filter((p) => p.id !== saved.id)]);
            setPage(1);
            setPublication("All statuses");
            setView({ mode: "list" });
            toast.success(
              saved.publication === "Draft"
                ? `Draft "${saved.name}" saved locally on top`
                : "Product saved"
            );
          }
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
        onToggle={async () => {
          const next: PublicationStatus = product.publication === "Published" ? "Draft" : "Published";
          const updatedProduct = { ...product, publication: next };
          setProducts((prev) => prev.map((item) => (item.id === product.id ? updatedProduct : item)));
          try {
            await fetch("http://localhost:5000/api/admin/products", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(updatedProduct),
            });
            toast.success(`Product ${next.toLowerCase()} status synced to database and storefront`);
          } catch (err) {
            console.error("Toggle product error:", err);
            toast.success(`Product ${next.toLowerCase()}`);
          }
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
                        onClick={async () => {
                          if (!window.confirm(`Delete ${product.name}?`)) return;
                          setProducts((prev) => prev.filter((item) => item.id !== product.id));
                          toast.success("Product deleted");
                          try {
                            await fetch(`http://localhost:5000/api/admin/products/${encodeURIComponent(product.id)}`, {
                              method: "DELETE",
                            });
                          } catch (err) {
                            console.error("Delete product error:", err);
                          }
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
  { step: 1, title: "01. Product Identity", subtitle: "Sales mode, product type, brand, SKU and India compliance" },
  { step: 2, title: "02. Category & Organisation", subtitle: "Taxonomy, game types, customer segments and badges" },
  { step: 3, title: "03. Specifications", subtitle: "Technical parameters, storefront visibility & filter flags" },
  { step: 4, title: "04. Variants & Configuration", subtitle: "Variant matrix and bespoke made-to-order configurator" },
  { step: 5, title: "05. Pricing & Tax", subtitle: "MRP compliance, cost margin, advance booking, HSN & B2B club tiers" },
  { step: 6, title: "06. Inventory & Tracking", subtitle: "Stock levels, lead times, serial number & cloth dye lot tracking" },
  { step: 7, title: "07. Description & Media", subtitle: "High-resolution photography, rich narrative, video and documents" },
  { step: 8, title: "08. Shipping, Delivery & Installation", subtitle: "Multi-crate breakdown, volumetric weight, room size calculation & assembly" },
  { step: 9, title: "09. Warranty, Returns & Documents", subtitle: "Component warranty, exclusions, return eligibility & authenticity" },
  { step: 10, title: "10. Related Products", subtitle: "Rule-based compatibility, room bundle package & spare parts" },
  { step: 11, title: "11. SEO & Schema", subtitle: "Search indexing, 301 redirect tracker, OG preview & JSON-LD schema" },
  { step: 12, title: "12. Review & Publish", subtitle: "Pre-flight audit checklist, desktop/mobile preview & deployment" },
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
      return new Set(stepMetadata.map((m) => m.step));
    }
    return new Set<StepNumber>();
  });

  // Custom spec inputs
  const [customKey, setCustomKey] = useState("");
  const [customVal, setCustomVal] = useState("");
  const [customGroup, setCustomGroup] = useState<string>("Playing Surface");
  const [customUnit, setCustomUnit] = useState("");

  // Configurator input state (Step 04)
  const [newConfigCategory, setNewConfigCategory] = useState("Wood Finish");
  const [newConfigLabel, setNewConfigLabel] = useState("");
  const [newConfigPrice, setNewConfigPrice] = useState<number | "">("");
  const [newConfigDays, setNewConfigDays] = useState<number | "">("");

  // New Crate Package input state (Step 08)
  const [newPkgLabel, setNewPkgLabel] = useState("");
  const [newPkgWeight, setNewPkgWeight] = useState<number | "">(50);
  const [newPkgL, setNewPkgL] = useState<number | "">(100);
  const [newPkgW, setNewPkgW] = useState<number | "">(50);
  const [newPkgH, setNewPkgH] = useState<number | "">(30);

  // New Spare Part input state (Step 10)
  const [newSparePart, setNewSparePart] = useState("");

  // Device preview toggle (Step 12)
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");

  const set = <K extends keyof ProductRecord>(key: K, value: ProductRecord[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  // Rich Text Editor State & Actions (Step 07)
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

  // Synchronize editor DOM with form.description when Step 07 is mounted
  useEffect(() => {
    if (currentStep === 7 && editorRef.current) {
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

  // Pricing calculations
  const basePrice = form.salePrice && form.salePrice > 0 ? form.salePrice : form.price || 0;
  const mrpVal = Number(form.mrp) || 0;
  const costVal = Number(form.costPrice) || 0;
  const grossProfit = basePrice - costVal;
  const grossMarginPercent = basePrice > 0 ? ((grossProfit / basePrice) * 100).toFixed(1) : "0.0";
  const discountFromMrp =
    mrpVal > basePrice && mrpVal > 0 ? Math.round(((mrpVal - basePrice) / mrpVal) * 100) : 0;

  // Deposit calculation for Booking with Advance
  const advanceDeposit =
    form.salesMode === "Booking with Advance"
      ? form.advanceBookingType === "Percentage"
        ? Math.round((basePrice * (form.advanceBookingValue || 30)) / 100)
        : form.advanceBookingValue || 0
      : 0;
  const remainingBalance = Math.max(0, basePrice - advanceDeposit);

  // Volumetric weight calculation for packages
  const totalPhysicalWeight = (form.packages || []).reduce((acc, p) => acc + (Number(p.weightKg) || 0), 0);
  const totalVolumetricWeight = (form.packages || []).reduce(
    (acc, p) => acc + Math.round(((Number(p.lengthCm) || 0) * (Number(p.widthCm) || 0) * (Number(p.heightCm) || 0)) / 5000),
    0
  );

  // Automatic SKU Pattern Generator
  const generateAutoSku = () => {
    const catCode = form.category ? form.category.slice(0, 3).toUpperCase() : "TBL";
    const typeCode = form.productType ? form.productType.slice(0, 3).toUpperCase() : "SNK";
    const sizeCode = form.specs["Table size"] ? form.specs["Table size"].replace(/[^0-9]/g, "") : "12";
    const rand = Math.floor(100 + Math.random() * 900);
    const newSku = `HCS-${catCode}-${typeCode}-${sizeCode}-${rand}`;
    set("sku", newSku);
    toast.success(`Generated SKU: ${newSku}`);
  };

  // Auto URL Slug Generator + 301 Tracker
  const generateSlug = () => {
    if (!form.name.trim()) {
      toast.error("Please enter a product name first");
      return;
    }
    const newSlug = form.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    if (form.slug && form.slug !== newSlug) {
      set("oldSlug", form.slug);
    }
    set("slug", newSlug);
    if (!form.seoTitle) set("seoTitle", `${form.name} | Hyderabad Cue Sports`);
    toast.success("URL slug generated");
  };

  // Auto-fill Table dimensions & room size when table size is chosen in Step 3
  const handleTableSizeSelect = (val: string) => {
    const nextSpecs: Record<string, string> = { ...form.specs, "Table size": val };
    const calc = tableSizeCalculations[val];
    if (calc) {
      nextSpecs["Playing area"] = calc.playingArea;
      nextSpecs["Overall dimensions"] = calc.externalDims;
      set("dimensions", calc.externalDims);

      // Auto update recommended room size in Step 8
      if (val === "12 ft") {
        set("minRoomLengthFt", 22);
        set("minRoomWidthFt", 16);
      } else if (val === "10 ft") {
        set("minRoomLengthFt", 20);
        set("minRoomWidthFt", 15);
      } else if (val === "9 ft") {
        set("minRoomLengthFt", 18.5);
        set("minRoomWidthFt", 14.5);
      } else if (val === "8 ft") {
        set("minRoomLengthFt", 17.5);
        set("minRoomWidthFt", 13.5);
      } else if (val === "7 ft") {
        set("minRoomLengthFt", 16.5);
        set("minRoomWidthFt", 13);
      } else if (val === "6 ft") {
        set("minRoomLengthFt", 15.5);
        set("minRoomWidthFt", 12.5);
      }
    }
    set("specs", nextSpecs);
    toast.success(`Applied ${val} specs & calculated minimum room clearance`);
  };

  // Add Custom Specification
  const handleAddCustomSpec = () => {
    if (!customKey.trim() || !customVal.trim()) {
      toast.error("Please provide both specification label and value");
      return;
    }
    const newItem = {
      label: customKey.trim(),
      value: customVal.trim(),
      unit: customUnit.trim(),
      group: customGroup,
      showOnStorefront: true,
      useAsFilter: true,
    };
    set("customSpecsList", [...(form.customSpecsList || []), newItem]);
    set("specs", { ...form.specs, [customKey.trim()]: customVal.trim() });
    setCustomKey("");
    setCustomVal("");
    setCustomUnit("");
    toast.success("Custom specification added");
  };

  const handleRemoveCustomSpec = (label: string) => {
    set("customSpecsList", (form.customSpecsList || []).filter((s) => s.label !== label));
    const next = { ...form.specs };
    delete next[label];
    set("specs", next);
    toast.success(`Removed ${label}`);
  };

  // Toggle spec visibility / filter
  const toggleSpecVisibility = (key: string, field: "showOnStorefront" | "useAsFilter") => {
    const current = form.specVisibility?.[key] || { showOnStorefront: true, useAsFilter: true };
    const updated = {
      ...form.specVisibility,
      [key]: {
        ...current,
        [field]: !current[field],
      },
    };
    set("specVisibility", updated);
  };

  // Add Variant
  const handleAddVariant = () => {
    const count = (form.variants || []).length + 1;
    const newVariant: ProductVariant = {
      id: `var-${Date.now()}`,
      name: `${form.name || "Product"} - Option ${count}`,
      sku: `${form.sku || "HCS"}-V${count}`,
      price: form.price || 0,
      inventory: 5,
      availability: "In stock",
    };
    set("variants", [...(form.variants || []), newVariant]);
    toast.success("Variant added");
  };

  const handleRemoveVariant = (variantId: string) => {
    set("variants", (form.variants || []).filter((v) => v.id !== variantId));
  };

  // Add Configurator Option
  const handleAddConfiguratorOption = () => {
    if (!newConfigLabel.trim()) {
      toast.error("Please enter a choice label");
      return;
    }
    const newOpt: ConfiguratorOption = {
      id: `opt-${Date.now()}`,
      category: newConfigCategory,
      label: newConfigLabel.trim(),
      priceDelta: Number(newConfigPrice) || 0,
      leadTimeDeltaDays: Number(newConfigDays) || 0,
    };
    set("configuratorOptions", [...(form.configuratorOptions || []), newOpt]);
    setNewConfigLabel("");
    setNewConfigPrice("");
    setNewConfigDays("");
    toast.success("Configurator option added");
  };

  const handleRemoveConfiguratorOption = (id: string) => {
    set("configuratorOptions", (form.configuratorOptions || []).filter((o) => o.id !== id));
  };

  // Add Shipping Package / Crate
  const handleAddPackage = () => {
    if (!newPkgLabel.trim()) {
      toast.error("Please enter crate label");
      return;
    }
    const newPkg: ShippingCrate = {
      id: `pkg-${Date.now()}`,
      label: newPkgLabel.trim(),
      weightKg: Number(newPkgWeight) || 0,
      lengthCm: Number(newPkgL) || 0,
      widthCm: Number(newPkgW) || 0,
      heightCm: Number(newPkgH) || 0,
    };
    set("packages", [...(form.packages || []), newPkg]);
    setNewPkgLabel("");
    toast.success("Shipping crate added");
  };

  const handleRemovePackage = (id: string) => {
    set("packages", (form.packages || []).filter((p) => p.id !== id));
  };

  // Auto Alt Text Generator for Media
  const handleSuggestAltText = () => {
    if (!form.name.trim()) {
      toast.error("Enter product name first");
      return;
    }
    const suggested = `${form.name} - Handcrafted luxury cue sports equipment, ${form.category || "Tables"}`;
    set("imageAltText", suggested);
    toast.success("Suggested Alt Text generated");
  };

  // Step validation rules for required fields
  const getStepValidationError = (step: StepNumber): string | null => {
    if (step === 1) {
      if (!form.name.trim()) return "Please enter Product Name in Step 01";
      if (!form.sku.trim()) return "Please enter Unique SKU in Step 01";
      if (!form.countryOfOrigin?.trim()) return "Country of Origin is required for India Legal Compliance (Step 01)";
    }
    if (step === 2) {
      if (!form.category || !form.category.trim()) return "Please select a Primary Category in Step 02";
    }
    if (step === 5) {
      if (form.salesMode !== "Request a Quote" && !form.priceOnRequest) {
        if (!form.price || Number(form.price) <= 0) return "Please provide a valid Regular Price in Step 05";
      }
      if (form.mrp && form.price && Number(form.price) > Number(form.mrp)) {
        return `Selling price (₹${form.price}) cannot exceed MRP (₹${form.mrp}) under India Legal Metrology Rules (Step 05)`;
      }
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
    const currentIndex = stepMetadata.findIndex((m) => m.step === currentStep);
    if (currentIndex < stepMetadata.length - 1) {
      setCurrentStep(stepMetadata[currentIndex + 1].step);
    }
  };

  // Previous Step
  const handlePrev = () => {
    if (!getStepValidationError(currentStep)) {
      setCompletedSteps((prev) => new Set(prev).add(currentStep));
    }
    const currentIndex = stepMetadata.findIndex((m) => m.step === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepMetadata[currentIndex - 1].step);
    } else {
      onBack();
    }
  };

  // Final Save / Publish
  const handleSave = (publishStatus: PublicationStatus = form.publication) => {
    const isDraft = publishStatus === "Draft";

    const name = form.name.trim() || (isDraft ? "Untitled Draft Product" : "");
    if (!name) {
      toast.error("Product name is required (Step 01)");
      setCurrentStep(1);
      return;
    }

    const sku = form.sku.trim() || (isDraft ? `HCS-DFT-${Date.now().toString().slice(-6)}` : "");
    if (!sku) {
      toast.error("Unique SKU is required (Step 01)");
      setCurrentStep(1);
      return;
    }

    const category = form.category?.trim() || (isDraft ? "Tables" : "");
    if (!category) {
      toast.error("Primary category is required (Step 02)");
      setCurrentStep(2);
      return;
    }

    if (!isDraft && form.salesMode !== "Request a Quote" && !form.priceOnRequest && (!form.price || form.price <= 0)) {
      toast.error("Regular price is required to publish live (Step 05)");
      setCurrentStep(5);
      return;
    }

    if (form.mrp && form.price && form.price > form.mrp) {
      toast.error(`Selling price cannot exceed MRP (Step 05)`);
      setCurrentStep(5);
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
      name,
      sku,
      category,
      price: form.price || 0,
      publication: publishStatus,
      status: calculatedStatus,
      initials:
        name
          .split(" ")
          .map((w) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase() || "HCS",
      slug: form.slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
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

  // Validation checklist for Step 12
  const validationErrors: string[] = [];
  const validationWarnings: string[] = [];

  if (!form.name.trim()) validationErrors.push("Product Name is missing (Step 01)");
  if (!form.sku.trim()) validationErrors.push("Unique SKU is missing (Step 01)");
  if (!form.countryOfOrigin?.trim()) validationErrors.push("Country of Origin (India Compliance) is missing (Step 01)");
  if (!form.category) validationErrors.push("Primary Category is not selected (Step 02)");
  if (form.salesMode !== "Request a Quote" && !form.priceOnRequest && (!form.price || form.price <= 0)) {
    validationErrors.push("Regular Price must be greater than ₹0 (Step 05)");
  }
  if (form.mrp && form.price && form.price > form.mrp) {
    validationErrors.push(`Selling price (₹${form.price}) exceeds MRP (₹${form.mrp}) (Step 05)`);
  }

  if (!form.images || form.images.length === 0) validationWarnings.push("No product images uploaded yet (Step 07)");
  if (!form.shortDescription) validationWarnings.push("Short description is empty (Step 07)");
  if (form.seoDescription && form.seoDescription.length > 160) {
    validationWarnings.push("Meta description exceeds recommended 160 characters (Step 11)");
  }
  if (!form.warrantySlate && !form.warrantyInfo) validationWarnings.push("Warranty terms not specified (Step 09)");

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
          <div>
            <h1>{product ? `Edit: ${product.name}` : "Add Product"}</h1>
            <div className="wizard-subtitle-badge">
              <span className="badge-pill">{form.productType || "Simple"}</span>
              <span className="badge-pill sales-pill">{form.salesMode || "Buy Now"}</span>
              {form.modelName && <span className="model-text">{form.modelName}</span>}
            </div>
          </div>
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

      {/* HORIZONTAL STEPPER PROGRESS STRIP (01 to 12) */}
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
          <div>
            <h2>{currentMeta.title}</h2>
            <p>{currentMeta.subtitle}</p>
          </div>
          <span className="step-counter-tag">
            Step {currentStep} of {stepMetadata.length}
          </span>
        </div>

        <div className="wizard-step-content">
          {/* =========================================================================
              STEP 01: PRODUCT IDENTITY & INDIA COMPLIANCE
             ========================================================================= */}
          {currentStep === 1 && (
            <div className="step-form-grid">
              {/* Sales Mode Selector */}
              <div className="form-field field-wide">
                <span className="form-label">
                  Sales Mode * (Drives Storefront CTA & Checkout Flow)
                </span>
                <div className="option-pill-grid four-col">
                  {salesModeOptions.map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      className={`pill-card ${form.salesMode === mode ? "selected" : ""}`}
                      onClick={() => set("salesMode", mode)}
                    >
                      <strong>{mode}</strong>
                      <small>
                        {mode === "Buy Now" && "Standard e-commerce checkout with instant payment"}
                        {mode === "Request a Quote" && "Bespoke inquiry CTA; price not mandatory"}
                        {mode === "Hybrid" && "Displays 'From ₹X' + Book Consultation"}
                        {mode === "Booking with Advance" && "Customer pays 30% advance deposit at checkout"}
                      </small>
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Type Selector */}
              <div className="form-field field-wide">
                <span className="form-label">
                  Product Type * (Controls which steps & configurations appear)
                </span>
                <div className="option-pill-grid five-col">
                  {productTypeOptions.map((type) => (
                    <button
                      key={type}
                      type="button"
                      className={`pill-card ${form.productType === type ? "selected" : ""}`}
                      onClick={() => set("productType", type)}
                    >
                      <strong>{type}</strong>
                      <small>
                        {type === "Simple" && "Single standalone item"}
                        {type === "Variable" && "Has choices (tip sizes, colors)"}
                        {type === "Made-to-Order" && "Bespoke table with configurator"}
                        {type === "Bundle" && "Complete room kit / package"}
                        {type === "Service" && "Re-clothing, leveling & assembly"}
                      </small>
                    </button>
                  ))}
                </div>
              </div>

              <Field
                label="Product Name *"
                value={form.name}
                onChange={(val) => {
                  set("name", val);
                  if (!form.slug) {
                    set("slug", val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
                  }
                }}
                placeholder="e.g. Nizam Royal 12ft Tournament Snooker Table"
              />

              <Field
                label="Model / Collection Name"
                value={form.modelName || ""}
                onChange={(val) => set("modelName", val)}
                placeholder="e.g. Nizam Royal 12 / Heritage Masters"
              />

              <SelectForm
                label="Brand"
                value={form.brand}
                options={brandOptions}
                placeholder="Select brand"
                onChange={(val) => set("brand", val)}
              />

              <div className="form-field">
                <div className="custom-spec-header">
                  <span className="form-label">SKU (Stock Keeping Unit) *</span>
                  <button type="button" className="generate-slug-link" onClick={generateAutoSku}>
                    Auto-Generate SKU
                  </button>
                </div>
                <input
                  type="text"
                  value={form.sku}
                  onChange={(e) => set("sku", e.target.value.toUpperCase())}
                  placeholder="e.g. HCS-TBL-SNK-12-001"
                />
              </div>

              <Field
                label="GTIN / EAN / Barcode (Optional)"
                value={form.gtinBarcode || ""}
                onChange={(val) => set("gtinBarcode", val)}
                placeholder="e.g. 8901234567890"
              />

              <SelectForm
                label="Approval / Workflow Status"
                value={form.approvalStatus || form.publication || "Draft"}
                options={["Draft", "In Review", "Scheduled", "Published", "Archived"]}
                onChange={(val) => {
                  set("approvalStatus", val as ProductApprovalStatus);
                  if (val === "Published" || val === "Draft") {
                    set("publication", val as PublicationStatus);
                  }
                }}
              />

              {/* India Compliance Callout Box */}
              <div className="field-wide compliance-section-box">
                <div className="compliance-header">
                  <ShieldCheck size={18} className="text-forest" />
                  <div>
                    <strong>India Legal Metrology & E-Commerce Compliance</strong>
                    <p>Mandatory disclosures required under Consumer Protection (E-Commerce) Rules 2020.</p>
                  </div>
                </div>

                <div className="compliance-grid">
                  <SelectForm
                    label="Country of Origin *"
                    value={form.countryOfOrigin || "India"}
                    options={["India", "United Kingdom", "Belgium", "Italy", "United States", "Japan", "China", "Germany"]}
                    onChange={(val) => set("countryOfOrigin", val)}
                  />

                  <Field
                    label="Net Quantity / Package Contents *"
                    value={form.netQuantity || ""}
                    onChange={(val) => set("netQuantity", val)}
                    placeholder="e.g. 1 Table Frame + 5 Slate Slabs + 1 Baize Cloth + Complete Accessory Set"
                  />

                  <Field
                    label="Manufacturer / Importer Name & Address *"
                    value={form.manufacturerDetails || ""}
                    onChange={(val) => set("manufacturerDetails", val)}
                    placeholder="e.g. Hyderabad Cue Sports Pvt Ltd, Jubilee Hills, Hyderabad 500033"
                    wide
                  />
                </div>
              </div>

              <Field
                label="Internal Admin Notes (Private from Storefront)"
                value={form.internalNotes || ""}
                onChange={(val) => set("internalNotes", val)}
                placeholder="e.g. Timber batch imported from Myanmar (Lot #42). Requires master carpenter approval."
                wide
                textarea
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
                placeholder="Select category"
                onChange={(val) => {
                  set("category", val);
                  const sub = categorySubcategories[val]?.[0] || "";
                  set("subcategory", sub);
                }}
              />

              <SelectForm
                label="Subcategory (Dependent) *"
                value={form.subcategory}
                options={form.category ? currentSubcategories : []}
                placeholder={form.category ? "Select subcategory" : "Select category first"}
                onChange={(val) => set("subcategory", val)}
              />

              <Field
                label="Product Collection (Optional)"
                value={form.collection || ""}
                onChange={(val) => set("collection", val)}
                placeholder="e.g. Nizam Heritage Series, Championship Arena"
                wide
              />

              {/* Game Types Multi-Select */}
              <div className="form-field field-wide">
                <span className="form-label">Game Type Compatibility (Primary Storefront Filter)</span>
                <div className="tags-select-row">
                  {gameTypeOptions.map((game) => {
                    const isSelected = (form.gameTypes || []).includes(game);
                    return (
                      <button
                        key={game}
                        type="button"
                        className={`tag-toggle-btn ${isSelected ? "active" : ""}`}
                        onClick={() => {
                          const current = form.gameTypes || [];
                          set(
                            "gameTypes",
                            isSelected ? current.filter((g) => g !== game) : [...current, game]
                          );
                        }}
                      >
                        {isSelected && <Check size={13} />}
                        {game}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Customer Segment Multi-Select */}
              <div className="form-field field-wide">
                <span className="form-label">Customer Segment (Drives Storefront Landing Pages)</span>
                <div className="tags-select-row">
                  {customerSegmentOptions.map((seg) => {
                    const isSelected = (form.customerSegments || []).includes(seg);
                    return (
                      <button
                        key={seg}
                        type="button"
                        className={`tag-toggle-btn ${isSelected ? "active" : ""}`}
                        onClick={() => {
                          const current = form.customerSegments || [];
                          set(
                            "customerSegments",
                            isSelected ? current.filter((s) => s !== seg) : [...current, seg]
                          );
                        }}
                      >
                        {isSelected && <Check size={13} />}
                        {seg}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Product Badges Multi-Select */}
              <div className="form-field field-wide">
                <span className="form-label">Luxury Product Badges</span>
                <div className="tags-select-row">
                  {productBadgeOptions.map((badge) => {
                    const isSelected = (form.productBadges || []).includes(badge);
                    return (
                      <button
                        key={badge}
                        type="button"
                        className={`tag-toggle-btn badge-btn ${isSelected ? "active" : ""}`}
                        onClick={() => {
                          const current = form.productBadges || [];
                          set(
                            "productBadges",
                            isSelected ? current.filter((b) => b !== badge) : [...current, badge]
                          );
                        }}
                      >
                        {isSelected && <Check size={13} />}
                        {badge}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Automatic Merchandising Flags (Bestseller, New Arrival, Featured) */}
              <div className="field-wide merchandising-box">
                <div className="merchandising-header">
                  <Sparkles size={18} className="text-forest" />
                  <strong>Catalog Badges & Automatic Calculation</strong>
                </div>

                <div className="merch-grid">
                  <div className="merch-card">
                    <div className="merch-title-row">
                      <strong>Bestseller Badge</strong>
                      <span className="calc-status-tag">
                        {form.bestsellerOverride === "force_on"
                          ? "Manual Override: ON"
                          : form.bestsellerOverride === "force_off"
                          ? "Manual Override: OFF"
                          : "Auto: Calculated (Last 90 Days)"}
                      </span>
                    </div>
                    <p>Calculates automatically from sales volume in the trailing 90 days (14+ orders).</p>
                    <SelectForm
                      label="Override"
                      value={form.bestsellerOverride || "auto"}
                      options={["auto", "force_on", "force_off"]}
                      onChange={(val) => {
                        set("bestsellerOverride", val as "auto" | "force_on" | "force_off");
                        set("bestseller", val === "force_on");
                      }}
                    />
                  </div>

                  <div className="merch-card">
                    <div className="merch-title-row">
                      <strong>New Arrival Badge</strong>
                      <span className="calc-status-tag">
                        {form.newArrivalOverride === "force_on"
                          ? "Manual Override: ON"
                          : form.newArrivalOverride === "force_off"
                          ? "Manual Override: OFF"
                          : "Auto: 45 Days Active"}
                      </span>
                    </div>
                    <p>Set automatically for 45 days after publishing live, then gracefully rolls off.</p>
                    <SelectForm
                      label="Override"
                      value={form.newArrivalOverride || "auto"}
                      options={["auto", "force_on", "force_off"]}
                      onChange={(val) => {
                        set("newArrivalOverride", val as "auto" | "force_on" | "force_off");
                        set("newArrival", val === "force_on");
                      }}
                    />
                  </div>

                  <div className="merch-card">
                    <div className="merch-title-row">
                      <strong>Featured Product</strong>
                      <span className="calc-status-tag">{form.featured ? "Featured" : "Standard"}</span>
                    </div>
                    <p>Pinned to homepage hero carousels and top recommendations.</p>
                    <Checkbox
                      checked={!!form.featured}
                      onChange={(checked) => set("featured", checked)}
                      label="Feature this product on Homepage & Highlights"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              STEP 03: SPECIFICATIONS (Technical Parameters & Category Templates)
             ========================================================================= */}
          {currentStep === 3 && (
            <div className="step-form-grid">
              <div className="field-wide spec-instruction-callout">
                <Info size={18} className="text-forest" />
                <div>
                  <strong>Category Specifications Template: {form.category || "Select category in Step 02"}</strong>
                  <p>
                    For each specification, toggle <strong>Show on storefront</strong> and{" "}
                    <strong>Use as filter / comparison</strong>. Variant attributes in Step 04 derive from these specs.
                  </p>
                </div>
              </div>

              {/* Dynamic specs based on selected category */}
              {(defaultCategorySpecs[form.category] || []).map((spec) => {
                const specVal = form.specs[spec.key] || "";
                const vis = form.specVisibility?.[spec.key] || {
                  showOnStorefront: spec.defaultStorefront ?? true,
                  useAsFilter: spec.defaultFilter ?? false,
                };

                return (
                  <div key={spec.key} className="form-field spec-item-card">
                    <div className="spec-label-row">
                      <span className="form-label">{spec.label}</span>
                      <div className="spec-switches">
                        <label title="Show on product storefront page">
                          <input
                            type="checkbox"
                            checked={vis.showOnStorefront}
                            onChange={() => toggleSpecVisibility(spec.key, "showOnStorefront")}
                          />
                          <span>Storefront</span>
                        </label>
                        <label title="Use in facet filters and comparison matrices">
                          <input
                            type="checkbox"
                            checked={vis.useAsFilter}
                            onChange={() => toggleSpecVisibility(spec.key, "useAsFilter")}
                          />
                          <span>Filterable</span>
                        </label>
                      </div>
                    </div>

                    {spec.options ? (
                      <select
                        value={specVal}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (spec.key === "Table size") {
                            handleTableSizeSelect(val);
                          } else {
                            set("specs", { ...form.specs, [spec.key]: val });
                          }
                        }}
                      >
                        <option value="">Select {spec.label}...</option>
                        {spec.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={specVal}
                        placeholder={spec.placeholder}
                        onChange={(e) => set("specs", { ...form.specs, [spec.key]: e.target.value })}
                      />
                    )}
                  </div>
                );
              })}

              {/* Custom Specs List */}
              {(form.customSpecsList || []).map((custom) => (
                <div key={custom.label} className="form-field spec-item-card custom-spec-card">
                  <div className="spec-label-row">
                    <span className="form-label">
                      {custom.label} {custom.unit && `(${custom.unit})`}
                      <small className="group-badge">{custom.group || "Custom"}</small>
                    </span>
                    <button
                      type="button"
                      className="remove-spec-link"
                      onClick={() => handleRemoveCustomSpec(custom.label)}
                    >
                      <Trash2 size={13} /> Remove
                    </button>
                  </div>
                  <input
                    type="text"
                    value={custom.value}
                    onChange={(e) => {
                      const updated = (form.customSpecsList || []).map((item) =>
                        item.label === custom.label ? { ...item, value: e.target.value } : item
                      );
                      set("customSpecsList", updated);
                      set("specs", { ...form.specs, [custom.label]: e.target.value });
                    }}
                  />
                </div>
              ))}

              {/* Add Custom Specification Row */}
              <div className="form-field field-wide add-custom-spec-box">
                <span className="form-label">Add Custom Technical Specification</span>
                <div className="add-spec-inputs-row">
                  <SelectField
                    value={customGroup}
                    onChange={(val) => setCustomGroup(val)}
                    options={[
                      "Playing Surface",
                      "Frame & Cabinet",
                      "Cushions & Rails",
                      "Hardware & Fittings",
                      "Accessories",
                    ]}
                  />
                  <input
                    type="text"
                    placeholder="Spec Label (e.g. Honing Standard)"
                    value={customKey}
                    onChange={(e) => setCustomKey(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g. Diamond Honed ±0.1mm)"
                    value={customVal}
                    onChange={(e) => setCustomVal(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Unit (optional, e.g. mm)"
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value)}
                    style={{ maxWidth: "100px" }}
                  />
                  <Button variant="outline" size="sm" onClick={handleAddCustomSpec}>
                    <Plus size={14} /> Add Spec
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              STEP 04: VARIANTS & CONFIGURATION
             ========================================================================= */}
          {currentStep === 4 && (
            <div className="step-form-grid">
              {form.productType === "Simple" && (
                <div className="field-wide notification-card">
                  <Info size={18} />
                  <div>
                    <strong>Product Type: Simple Product</strong>
                    <p>
                      This item is set as a standalone SKU. You can configure options below or switch Product Type to
                      Variable / Made-to-Order in Step 01.
                    </p>
                  </div>
                </div>
              )}

              {/* Made-to-Order Bespoke Configurator */}
              <div className="field-wide configurator-builder-card">
                <div className="config-header">
                  <SlidersHorizontal size={18} className="text-forest" />
                  <div>
                    <strong>Made-to-Order Bespoke Configurator Options</strong>
                    <p>
                      Allow buyers to customize finishes, cloth colors, leg styles, and plaque engravings with live price
                      (+₹) and lead-time (+days) deltas.
                    </p>
                  </div>
                </div>

                <div className="responsive-table">
                  <table className="config-options-table">
                    <thead>
                      <tr>
                        <th>Option Category</th>
                        <th>Choice / Finish Label</th>
                        <th>Price Delta (+₹)</th>
                        <th>Lead-Time Delta (+Days)</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {(form.configuratorOptions || []).map((opt) => (
                        <tr key={opt.id}>
                          <td>
                            <span className="config-cat-pill">{opt.category}</span>
                          </td>
                          <td>
                            <strong>{opt.label}</strong>
                          </td>
                          <td>
                            {opt.priceDelta > 0 ? (
                              <span className="price-up">+{formatINR(opt.priceDelta)}</span>
                            ) : (
                              <span className="price-std">Standard (+₹0)</span>
                            )}
                          </td>
                          <td>{opt.leadTimeDeltaDays > 0 ? `+${opt.leadTimeDeltaDays} days` : "Standard"}</td>
                          <td>
                            <button
                              type="button"
                              className="delete-row-btn"
                              onClick={() => handleRemoveConfiguratorOption(opt.id)}
                              title="Delete option"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Add Configurator Option Row */}
                <div className="add-config-option-row">
                  <SelectField
                    value={newConfigCategory}
                    onChange={(val) => setNewConfigCategory(val)}
                    options={[
                      "Wood Finish",
                      "Cloth Colour",
                      "Leg Style",
                      "Pocket Leather",
                      "Fittings",
                      "Plaque",
                      "Other",
                    ]}
                  />
                  <input
                    type="text"
                    placeholder="Choice Label (e.g. Piano Black Lacquer)"
                    value={newConfigLabel}
                    onChange={(e) => setNewConfigLabel(e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Price Delta (+₹)"
                    value={newConfigPrice}
                    onChange={(e) => setNewConfigPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  />
                  <input
                    type="number"
                    placeholder="+Days Lead Time"
                    value={newConfigDays}
                    onChange={(e) => setNewConfigDays(e.target.value === "" ? "" : Number(e.target.value))}
                  />
                  <Button size="sm" variant="outline" onClick={handleAddConfiguratorOption}>
                    <Plus size={14} /> Add Option
                  </Button>
                </div>
              </div>

              {/* Standard Variant Matrix */}
              <div className="form-field field-wide variants-container">
                <div className="variants-header">
                  <div>
                    <strong>Product Variant Matrix</strong>
                    <p>Add distinct SKUs with individual pricing, inventory and thumbnail</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleAddVariant}>
                    <Plus size={14} /> Add Variant
                  </Button>
                </div>

                {(form.variants || []).length > 0 ? (
                  <div className="variants-table-wrapper">
                    <table className="data-table">
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
                        {(form.variants || []).map((v) => (
                          <tr key={v.id}>
                            <td>
                              <input
                                type="text"
                                value={v.name}
                                onChange={(e) => {
                                  const updated = (form.variants || []).map((item) =>
                                    item.id === v.id ? { ...item, name: e.target.value } : item
                                  );
                                  set("variants", updated);
                                }}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={v.sku}
                                onChange={(e) => {
                                  const updated = (form.variants || []).map((item) =>
                                    item.id === v.id ? { ...item, sku: e.target.value } : item
                                  );
                                  set("variants", updated);
                                }}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                value={v.price}
                                onChange={(e) => {
                                  const updated = (form.variants || []).map((item) =>
                                    item.id === v.id ? { ...item, price: Number(e.target.value) } : item
                                  );
                                  set("variants", updated);
                                }}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                value={v.inventory}
                                onChange={(e) => {
                                  const updated = (form.variants || []).map((item) =>
                                    item.id === v.id ? { ...item, inventory: Number(e.target.value) } : item
                                  );
                                  set("variants", updated);
                                }}
                              />
                            </td>
                            <td>
                              <select
                                value={v.availability}
                                onChange={(e) => {
                                  const updated = (form.variants || []).map((item) =>
                                    item.id === v.id
                                      ? { ...item, availability: e.target.value as ProductVariant["availability"] }
                                      : item
                                  );
                                  set("variants", updated);
                                }}
                              >
                                <option value="In stock">In stock</option>
                                <option value="Out of stock">Out of stock</option>
                                <option value="Pre-order">Pre-order</option>
                              </select>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="remove-variant-btn"
                                onClick={() => handleRemoveVariant(v.id)}
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
                  <div className="empty-variants-callout">
                    <span>No variants configured. Product will be sold as a single standard item.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              STEP 05: PRICING & TAX (With India Compliance MRP & HSN Master)
             ========================================================================= */}
          {currentStep === 5 && (
            <div className="step-form-grid">
              {/* Compliance MRP vs Selling Price */}
              <div className="field-wide pricing-compliance-card">
                <div className="pricing-compliance-header">
                  <IndianRupee size={18} className="text-forest" />
                  <div>
                    <strong>India Legal Metrology Pricing Compliance</strong>
                    <p>Maximum Retail Price (MRP) must be listed; Selling Price cannot exceed MRP.</p>
                  </div>
                </div>

                <div className="pricing-grid">
                  <Field
                    label="Maximum Retail Price (MRP ₹) *"
                    type="number"
                    value={form.mrp && form.mrp > 0 ? String(form.mrp) : ""}
                    onChange={(val) => set("mrp", val ? Number(val) : 0)}
                    placeholder="e.g. 350000"
                  />

                  <Field
                    label="Regular Selling Price (₹) *"
                    type="number"
                    value={form.price > 0 ? String(form.price) : ""}
                    onChange={(val) => set("price", val ? Number(val) : 0)}
                    placeholder="e.g. 295000"
                    disabled={form.priceOnRequest}
                  />

                  <Field
                    label="Cost Price (₹, Admin Only)"
                    type="number"
                    value={form.costPrice && form.costPrice > 0 ? String(form.costPrice) : ""}
                    onChange={(val) => set("costPrice", val ? Number(val) : 0)}
                    placeholder="e.g. 175000"
                  />
                </div>

                {/* Live Margin & MRP Validation Banner */}
                {form.price > 0 && form.mrp && form.price > form.mrp && (
                  <div className="price-error-banner">
                    <AlertTriangle size={16} />
                    <span>
                      Violation: Selling Price ({formatINR(form.price)}) exceeds MRP ({formatINR(form.mrp)}). By law,
                      selling price must be ≤ MRP.
                    </span>
                  </div>
                )}

                {form.price > 0 && costVal > 0 && (
                  <div className="margin-indicator-row">
                    <span className="profit-text">
                      Estimated Gross Profit: <strong>{formatINR(grossProfit)}</strong>
                    </span>
                    <span className="margin-text">
                      Gross Margin: <strong>{grossMarginPercent}%</strong>
                    </span>
                    {discountFromMrp > 0 && (
                      <span className="discount-tag">{discountFromMrp}% Below MRP</span>
                    )}
                  </div>
                )}
              </div>

              {/* Price on Request & Advance Booking */}
              <div className="field-wide advance-booking-grid">
                <div className="advance-card">
                  <Checkbox
                    checked={!!form.priceOnRequest}
                    onChange={(checked) => set("priceOnRequest", checked)}
                    label="Price on Request (Quote Mode)"
                    description="Hides regular purchase price from storefront and directs customer to quotation consultation."
                  />
                </div>

                <div className="advance-card">
                  <span className="form-label">Advance Booking / Production Deposit</span>
                  <div className="advance-inputs-row">
                    <SelectField
                      value={form.advanceBookingType || "Percentage"}
                      onChange={(val) => set("advanceBookingType", val as "Percentage" | "Fixed")}
                      options={["Percentage", "Fixed"]}
                    />
                    <input
                      type="number"
                      value={String(form.advanceBookingValue ?? 30)}
                      onChange={(e) => set("advanceBookingValue", Number(e.target.value))}
                      placeholder="30"
                    />
                    <span className="unit-label">
                      {form.advanceBookingType === "Percentage" ? "%" : "₹"}
                    </span>
                  </div>
                  {basePrice > 0 && (
                    <small className="deposit-preview-text">
                      Deposit: <strong>{formatINR(advanceDeposit)}</strong> · Balance prior to dispatch:{" "}
                      <strong>{formatINR(remainingBalance)}</strong>
                    </small>
                  )}
                </div>
              </div>

              {/* Installation Charge & EMI Switch */}
              <Field
                label="Installation Charge (Separate Service Line Item ₹)"
                type="number"
                value={form.installationCharge !== undefined ? String(form.installationCharge) : "0"}
                onChange={(val) => set("installationCharge", Number(val))}
                placeholder="0 for Included, or e.g. 15000"
                help="Maintains distinct tax separation between goods and assembly labor"
              />

              <div className="form-field">
                <span className="form-label">Consumer Financing</span>
                <Checkbox
                  checked={!!form.emiEligible}
                  onChange={(checked) => set("emiEligible", checked)}
                  label="Eligible for 0% No-Cost EMI"
                  description="Displays EMI breakdown options (from ₹12,500/mo) on product storefront."
                />
              </div>

              {/* HSN Master Table Selector with Auto GST Rate */}
              <div className="field-wide hsn-master-box">
                <div className="hsn-header">
                  <Tag size={18} className="text-forest" />
                  <strong>HSN Code Master & GST Rate Mapping</strong>
                </div>

                <div className="hsn-inputs-grid">
                  <div className="form-field">
                    <span className="form-label">Select HSN Code</span>
                    <select
                      value={form.hsnCode || "9504 20 00"}
                      onChange={(e) => {
                        const code = e.target.value;
                        const match = hsnMasterTable.find((h) => h.code === code);
                        set("hsnCode", code);
                        if (match) {
                          set("hsnGstRate", match.gstRate);
                          set("tax", `GST ${match.gstRate}%` as ProductRecord["tax"]);
                        }
                      }}
                    >
                      {hsnMasterTable.map((h) => (
                        <option key={h.code} value={h.code}>
                          {h.code} - {h.desc} ({h.gstRate}% GST)
                        </option>
                      ))}
                    </select>
                  </div>

                  <Field
                    label="GST Tax Rate (%)"
                    type="number"
                    value={String(form.hsnGstRate ?? 18)}
                    onChange={(val) => {
                      set("hsnGstRate", Number(val));
                      set("tax", `GST ${val}%` as ProductRecord["tax"]);
                    }}
                    placeholder="18"
                  />
                </div>
              </div>

              {/* B2B / Club Tiered Pricing Matrix */}
              <div className="field-wide b2b-tiers-card">
                <div className="b2b-header">
                  <Layers size={18} className="text-forest" />
                  <div>
                    <strong>Commercial Club & B2B Volume Pricing Breaks</strong>
                    <p>Clubs purchasing 5+ or 10+ tables receive wholesale tiered deductions.</p>
                  </div>
                </div>

                <table className="b2b-table">
                  <thead>
                    <tr>
                      <th>Customer Group</th>
                      <th>Quantity Break</th>
                      <th>Discount (%)</th>
                      <th>Effective Unit Price (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(form.b2bTiers || []).map((tier, idx) => {
                      const discountedPrice = basePrice * (1 - tier.discountPercent / 100);
                      return (
                        <tr key={idx}>
                          <td>
                            <strong>{tier.customerGroup}</strong>
                          </td>
                          <td>
                            {tier.minQty}–{tier.maxQty} units
                          </td>
                          <td>{tier.discountPercent}% OFF</td>
                          <td>
                            <strong>{formatINR(discountedPrice)}</strong>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =========================================================================
              STEP 06: INVENTORY & TRACKING
             ========================================================================= */}
          {currentStep === 6 && (
            <div className="step-form-grid">
              <SelectForm
                label="Availability Status *"
                value={form.status || "In stock"}
                options={["In stock", "Low stock", "Out of stock", "Made to Order", "Pre-Order", "Discontinued"]}
                onChange={(val) => set("status", val as ProductRecord["status"])}
              />

              <Field
                label="Stock Quantity *"
                type="number"
                value={form.inventory > 0 ? String(form.inventory) : ""}
                onChange={(val) => set("inventory", val ? Number(val) : 0)}
                placeholder="e.g. 5"
              />

              <Field
                label="Low Stock Alert Threshold"
                type="number"
                value={form.lowStockThreshold > 0 ? String(form.lowStockThreshold) : ""}
                onChange={(val) => set("lowStockThreshold", val ? Number(val) : 0)}
                placeholder="e.g. 2"
              />

              <Field
                label="Production Lead Time (for Made-to-Order)"
                value={form.productionLeadTime || "6–8 weeks"}
                onChange={(val) => set("productionLeadTime", val)}
                placeholder="e.g. 6–8 weeks"
              />

              <Field
                label="Maximum Order Quantity (MOQ Ceiling)"
                type="number"
                value={String(form.maxOrderQuantity || 10)}
                onChange={(val) => set("maxOrderQuantity", Number(val))}
                placeholder="e.g. 4 (prevents cart hoard on high-ticket tables)"
              />

              <SelectForm
                label="Warehouse / Stock Location"
                value={form.warehouseLocation || "Jubilee Hills Central Warehouse"}
                options={[
                  "Jubilee Hills Central Warehouse",
                  "Gachibowli Logistics Hub",
                  "Uppal Artisan Woodworks Workshop",
                  "Direct Port Consignment",
                ]}
                onChange={(val) => set("warehouseLocation", val)}
              />

              {/* Serial Number & Batch Tracking Switches */}
              <div className="field-wide tracking-switches-grid">
                <div className="tracking-card">
                  <Checkbox
                    checked={!!form.serialTrackingEnabled}
                    onChange={(checked) => set("serialTrackingEnabled", checked)}
                    label="Serial Number Tracking"
                    description="Assigns individual engraved serial numbers for authenticity certificates and warranty lookup."
                  />
                </div>

                <div className="tracking-card">
                  <span className="form-label">Cloth / Baize Dye Lot Tracking</span>
                  <div className="dye-lot-inputs">
                    <input
                      type="text"
                      placeholder="Dye Lot # (e.g. STR-2026-LOT-09)"
                      value={form.dyeLotNumber || ""}
                      onChange={(e) => set("dyeLotNumber", e.target.value)}
                    />
                    <input
                      type="date"
                      value={form.dyeLotDate || ""}
                      onChange={(e) => set("dyeLotDate", e.target.value)}
                    />
                  </div>
                  <small className="help-text">Ensures matching rolls for multi-table club reclothing.</small>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              STEP 07: DESCRIPTION & MEDIA
             ========================================================================= */}
          {currentStep === 7 && (
            <div className="step-form-grid">
              <Field
                label="Short Description (Storefront Card Excerpt)"
                value={form.shortDescription}
                onChange={(val) => set("shortDescription", val.slice(0, 160))}
                placeholder="Concise 1-2 sentence overview for catalog search cards"
                textarea
                wide
                help={`${form.shortDescription.length} / 160 characters`}
              />

              {/* Rich Text Editor */}
              <div className="form-field field-wide rich-editor-container">
                <span className="form-label">Full Product Story & Technical Narrative</span>
                <div className="rich-editor-shell">
                  <div className="rich-editor-toolbar">
                    <div className="toolbar-group">
                      <select
                        className="editor-format-select"
                        value={editorFormat}
                        onChange={(e) => handleFormatChange(e.target.value)}
                      >
                        <option value="Normal text">Normal text</option>
                        <option value="Heading 2">Heading 2</option>
                        <option value="Heading 3">Heading 3</option>
                      </select>
                    </div>
                    <div className="toolbar-divider" />
                    <div className="toolbar-group">
                      <button
                        type="button"
                        className={`toolbar-btn ${isBold ? "active" : ""}`}
                        onClick={() => executeEditorCmd("bold")}
                        title="Bold"
                      >
                        <Bold size={15} />
                      </button>
                      <button
                        type="button"
                        className={`toolbar-btn ${isItalic ? "active" : ""}`}
                        onClick={() => executeEditorCmd("italic")}
                        title="Italic"
                      >
                        <Italic size={15} />
                      </button>
                      <button
                        type="button"
                        className={`toolbar-btn ${isUnderline ? "active" : ""}`}
                        onClick={() => executeEditorCmd("underline")}
                        title="Underline"
                      >
                        <Underline size={15} />
                      </button>
                    </div>
                    <div className="toolbar-divider" />
                    <div className="toolbar-group">
                      <button
                        type="button"
                        className={`toolbar-btn ${isBulletList ? "active" : ""}`}
                        onClick={() => executeEditorCmd("insertUnorderedList")}
                        title="Bullet list"
                      >
                        <List size={15} />
                      </button>
                      <button
                        type="button"
                        className={`toolbar-btn ${isNumList ? "active" : ""}`}
                        onClick={() => executeEditorCmd("insertOrderedList")}
                        title="Numbered list"
                      >
                        <ListOrdered size={15} />
                      </button>
                    </div>
                    <div className="toolbar-divider" />
                    <div className="toolbar-group">
                      <button
                        type="button"
                        className="toolbar-btn"
                        onClick={handleAddLink}
                        title="Insert link"
                      >
                        <Link2 size={15} />
                      </button>
                      <button
                        type="button"
                        className="toolbar-btn"
                        onClick={handleInsertTable}
                        title="Insert specs table"
                      >
                        <TableIcon size={15} />
                      </button>
                    </div>
                  </div>

                  <div
                    ref={editorRef}
                    className="rich-editor-content"
                    contentEditable
                    suppressContentEditableWarning
                    onInput={() => {
                      if (editorRef.current) {
                        set("description", editorRef.current.innerHTML);
                      }
                    }}
                    onKeyUp={updateActiveFormats}
                    onMouseUp={updateActiveFormats}
                    onKeyDown={handleEditorKeyDown}
                  />
                </div>
              </div>

              <Field
                label="Craftsmanship / Demonstration Video URL"
                value={form.videoUrl || ""}
                onChange={(val) => set("videoUrl", val)}
                placeholder="e.g. https://www.youtube.com/watch?v=..."
                wide
              />

              {/* Media Gallery with Tags */}
              <div className="form-field field-wide media-gallery-card">
                <div className="media-header">
                  <div>
                    <strong>High-Resolution Photography Gallery & Media Tags</strong>
                    <p>Tag images as Hero, Detail / Macro, Lifestyle, or Dimension Blueprint</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const url = window.prompt("Enter image URL:", "https://images.unsplash.com/photo-1579546929518-9e396f3cc809");
                      if (url) {
                        set("images", [...(form.images || []), url]);
                        if (!form.primaryImage) set("primaryImage", url);
                        toast.success("Image added to gallery");
                      }
                    }}
                  >
                    <ImagePlus size={14} /> Add Image URL
                  </Button>
                </div>

                <div className="images-tags-grid">
                  {(form.images || []).map((imgUrl, index) => (
                    <div key={index} className="gallery-thumbnail-card">
                      <img src={imgUrl} alt={`Product ${index + 1}`} />
                      <div className="thumb-actions">
                        <select
                          className="media-tag-select"
                          onChange={(e) => toast.success(`Tagged as ${e.target.value}`)}
                        >
                          <option value="Hero">Hero (Cover)</option>
                          <option value="Detail / Macro">Detail / Macro</option>
                          <option value="Lifestyle">Lifestyle (Room)</option>
                          <option value="Dimension Diagram">Dimension Diagram</option>
                          <option value="360° Spin">360° Spin</option>
                        </select>
                        <button
                          type="button"
                          className="remove-img-btn"
                          onClick={() => {
                            const filtered = (form.images || []).filter((_, i) => i !== index);
                            set("images", filtered);
                            if (form.primaryImage === imgUrl) {
                              set("primaryImage", filtered[0] || "");
                            }
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="alt-text-row">
                  <Field
                    label="Image SEO Alt Text"
                    value={form.imageAltText || ""}
                    onChange={(val) => set("imageAltText", val)}
                    placeholder="Descriptive alt text for Google Image search"
                  />
                  <Button variant="outline" size="sm" onClick={handleSuggestAltText}>
                    Suggest Alt Text
                  </Button>
                </div>
              </div>

              {/* Downloadable Documents */}
              <div className="field-wide downloadable-docs-card">
                <div className="docs-header">
                  <FileText size={18} className="text-forest" />
                  <strong>Downloadable PDF Documents (Spec Sheets, Guides, Manuals)</strong>
                </div>

                <div className="docs-list">
                  {(form.downloadableDocs || []).map((doc) => (
                    <div key={doc.id} className="doc-item-row">
                      <FileCheck size={16} className="text-forest" />
                      <div>
                        <strong>{doc.title}</strong>
                        <small>{doc.type} · {doc.url}</small>
                      </div>
                      <button
                        type="button"
                        className="delete-row-btn"
                        onClick={() => {
                          set(
                            "downloadableDocs",
                            (form.downloadableDocs || []).filter((d) => d.id !== doc.id)
                          );
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              STEP 08: SHIPPING, DELIVERY & INSTALLATION (Expanded, NO DUPLICATE)
             ========================================================================= */}
          {currentStep === 8 && (
            <div className="step-form-grid">
              <div className="field-wide">
                <Checkbox
                  card
                  checked={!!form.shippingSkip}
                  onChange={(checked) => set("shippingSkip", checked)}
                  label="Skip shipping configuration for this product"
                  description="Check this for pure digital products, consulting sessions, or localized service labor without physical crating."
                />
              </div>

              {!form.shippingSkip ? (
                <>
                  {/* Multi-package Crates Breakdown */}
                  <div className="field-wide multi-crate-box">
                    <div className="crate-header">
                      <Package size={18} className="text-forest" />
                      <div>
                        <strong>Multi-Package Crate Logistics Breakdown</strong>
                        <p>A full 12ft table ships in 5–7 specialized crates (slates, frame, turned legs, cushions).</p>
                      </div>
                    </div>

                    <table className="crates-table">
                      <thead>
                        <tr>
                          <th>Crate Label</th>
                          <th>Weight (kg)</th>
                          <th>Dimensions (L × W × H cm)</th>
                          <th>Volumetric (kg)</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {(form.packages || []).map((pkg) => {
                          const vol = Math.round((pkg.lengthCm * pkg.widthCm * pkg.heightCm) / 5000);
                          return (
                            <tr key={pkg.id}>
                              <td>
                                <strong>{pkg.label}</strong>
                              </td>
                              <td>{pkg.weightKg} kg</td>
                              <td>
                                {pkg.lengthCm} × {pkg.widthCm} × {pkg.heightCm} cm
                              </td>
                              <td>{vol} kg</td>
                              <td>
                                <button
                                  type="button"
                                  className="delete-row-btn"
                                  onClick={() => handleRemovePackage(pkg.id)}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    <div className="crate-weight-summary">
                      <div>
                        <span>Total Gross Physical Weight:</span>
                        <strong>{totalPhysicalWeight} kg</strong>
                      </div>
                      <div>
                        <span>Total Volumetric Weight:</span>
                        <strong>{totalVolumetricWeight} kg</strong>
                      </div>
                    </div>

                    {/* Add Crate Row */}
                    <div className="add-crate-row">
                      <input
                        type="text"
                        placeholder="Crate Description"
                        value={newPkgLabel}
                        onChange={(e) => setNewPkgLabel(e.target.value)}
                      />
                      <input
                        type="number"
                        placeholder="Weight kg"
                        value={newPkgWeight}
                        onChange={(e) => setNewPkgWeight(e.target.value === "" ? "" : Number(e.target.value))}
                        style={{ width: "90px" }}
                      />
                      <input
                        type="number"
                        placeholder="L cm"
                        value={newPkgL}
                        onChange={(e) => setNewPkgL(e.target.value === "" ? "" : Number(e.target.value))}
                        style={{ width: "70px" }}
                      />
                      <input
                        type="number"
                        placeholder="W cm"
                        value={newPkgW}
                        onChange={(e) => setNewPkgW(e.target.value === "" ? "" : Number(e.target.value))}
                        style={{ width: "70px" }}
                      />
                      <input
                        type="number"
                        placeholder="H cm"
                        value={newPkgH}
                        onChange={(e) => setNewPkgH(e.target.value === "" ? "" : Number(e.target.value))}
                        style={{ width: "70px" }}
                      />
                      <Button size="sm" variant="outline" onClick={handleAddPackage}>
                        <Plus size={14} /> Add Crate
                      </Button>
                    </div>
                  </div>

                  <SelectForm
                    label="Installation Model *"
                    value={form.installationModel || "Included"}
                    options={["Included", "Paid Add-on", "Not Required", "Optional"]}
                    onChange={(val) => {
                      set("installationModel", val as ProductRecord["installationModel"]);
                      set("installationRequired", val === "Included" || val === "Paid Add-on");
                    }}
                  />

                  <Field
                    label="Installation Team & Duration"
                    value={form.onSiteDuration || "1 Full Working Day (3 Senior Technicians)"}
                    onChange={(val) => set("onSiteDuration", val)}
                    placeholder="e.g. 1 Full Working Day, 3 Technicians"
                  />

                  <div className="form-field">
                    <span className="form-label">Pre-Delivery Site Survey</span>
                    <Checkbox
                      checked={!!form.siteSurveyRequired}
                      onChange={(checked) => set("siteSurveyRequired", checked)}
                      label="Site Survey Required Prior to Dispatch"
                      description="Technicians inspect stairway clearances, elevator capacity, and floor load before shipping."
                    />
                  </div>

                  {/* Auto-Calculated Minimum Room Size Callout */}
                  <div className="field-wide room-calculator-box">
                    <div className="room-calc-header">
                      <Ruler size={18} className="text-forest" />
                      <div>
                        <strong>Recommended Playing Room Dimensions (Auto-Calculated)</strong>
                        <p>
                          Based on playing area + 2 × 58" (147cm) cue clearance on all sides for full backward stroke.
                        </p>
                      </div>
                    </div>

                    <div className="room-dimensions-grid">
                      <div className="room-stat-card">
                        <span>Minimum Room Length</span>
                        <strong>{form.minRoomLengthFt || 22} ft (6.7 m)</strong>
                      </div>
                      <div className="room-stat-card">
                        <span>Minimum Room Width</span>
                        <strong>{form.minRoomWidthFt || 16} ft (4.9 m)</strong>
                      </div>
                      <div className="room-stat-card">
                        <span>Door / Stair Width</span>
                        <strong>{form.minDoorWidthCm || 90} cm minimum</strong>
                      </div>
                      <div className="room-stat-card">
                        <span>Floor Load Rating</span>
                        <strong>{form.minFloorLoadRating || "250 kg/m²"}</strong>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="field-wide shipping-skipped-notice">
                  <AlertCircle size={20} />
                  <div>
                    <strong>Shipping configuration is skipped for this product.</strong>
                    <p>No freight crates required.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              STEP 09: WARRANTY, RETURNS & DOCUMENTS (NEW DEDICATED STEP)
             ========================================================================= */}
          {currentStep === 9 && (
            <div className="step-form-grid">
              <div className="field-wide warranty-component-box">
                <div className="warranty-header">
                  <ShieldCheck size={18} className="text-forest" />
                  <div>
                    <strong>Component-by-Component Warranty Breakdown</strong>
                    <p>Specify exact warranties for slate slabs, seasoned timber frame, cushions, and baize cloth.</p>
                  </div>
                </div>

                <div className="warranty-grid">
                  <Field
                    label="Slate Slabs Warranty"
                    value={form.warrantySlate || ""}
                    onChange={(val) => set("warrantySlate", val)}
                    placeholder="e.g. Lifetime warranty against slate fracture or sagging"
                  />

                  <Field
                    label="Frame & Cabinet Timber Warranty"
                    value={form.warrantyFrame || ""}
                    onChange={(val) => set("warrantyFrame", val)}
                    placeholder="e.g. 5-Year warranty against warping or joint defects"
                  />

                  <Field
                    label="Cushion Rubber Warranty"
                    value={form.warrantyCushions || ""}
                    onChange={(val) => set("warrantyCushions", val)}
                    placeholder="e.g. 3-Year Northern Rubber resilience guarantee"
                  />

                  <Field
                    label="Cloth / Baize Coverage"
                    value={form.warrantyCloth || ""}
                    onChange={(val) => set("warrantyCloth", val)}
                    placeholder="e.g. Initial defect inspection warranty (normal playing wear excluded)"
                  />
                </div>
              </div>

              <Field
                label="Warranty Exclusions"
                value={form.warrantyExclusions || ""}
                onChange={(val) => set("warrantyExclusions", val)}
                placeholder="e.g. Damage from outdoor storage, excessive humidity, liquid spills, or non-certified relocations"
                wide
                textarea
              />

              <SelectForm
                label="Return Eligibility Policy *"
                value={form.returnEligibility || "Replacement only for verified transit damage or manufacturing defects"}
                options={[
                  "Returnable (Standard)",
                  "Non-returnable (Custom Made / Bespoke)",
                  "Replacement only for verified transit damage or manufacturing defects",
                ]}
                onChange={(val) => set("returnEligibility", val)}
              />

              <Field
                label="Return Window (Days)"
                type="number"
                value={String(form.returnWindowDays || 7)}
                onChange={(val) => set("returnWindowDays", Number(val))}
                placeholder="7"
              />

              <Field
                label="Restocking Fee (%)"
                type="number"
                value={String(form.restockingFeePercent || 10)}
                onChange={(val) => set("restockingFeePercent", Number(val))}
                placeholder="10"
              />

              <div className="form-field field-wide">
                <Checkbox
                  card
                  checked={!!form.certificateOfAuthenticity}
                  onChange={(checked) => set("certificateOfAuthenticity", checked)}
                  label="Official Certificate of Authenticity & Master Craftsman Seal"
                  description="Issues a digitally verifiable tamper-proof serial plaque and certificate signed by the master builder."
                />
              </div>
            </div>
          )}

          {/* =========================================================================
              STEP 10: RELATED PRODUCTS & COMPLETE ROOM BUNDLE
             ========================================================================= */}
          {currentStep === 10 && (
            <div className="step-form-grid">
              <div className="field-wide">
                <Checkbox
                  card
                  checked={!!form.autoCompatibilityMatching}
                  onChange={(checked) => set("autoCompatibilityMatching", checked)}
                  label="Rule-Based Automatic Compatibility"
                  description="Storefront automatically links matching balls, cues, and lights based on the selected game type and table size."
                />
              </div>

              {/* Complete the Room Bundle Builder */}
              <div className="field-wide bundle-builder-card">
                <div className="bundle-header">
                  <Box size={18} className="text-forest" />
                  <div>
                    <strong>'Complete the Room' Bundle Builder</strong>
                    <p>Combine table, canopy lighting, cue rack, and scoreboards into a discounted package.</p>
                  </div>
                </div>

                <div className="bundle-items-list">
                  {(form.roomBundleItems || []).map((item, idx) => (
                    <div key={idx} className="bundle-item-chip">
                      <Check size={14} className="text-forest" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <Field
                  label="Bundle Package Discount (%)"
                  type="number"
                  value={String(form.roomBundleDiscount || 10)}
                  onChange={(val) => set("roomBundleDiscount", Number(val))}
                  placeholder="10"
                  help="Discount applied when customer adds the complete room kit at checkout"
                />
              </div>

              {/* Spare Parts / Replacements */}
              <div className="field-wide spare-parts-card">
                <div className="spare-header">
                  <Wrench size={18} className="text-forest" />
                  <div>
                    <strong>Consumable Spare Parts & Maintenance Replacements</strong>
                    <p>Replacements and wear items recommended to customers.</p>
                  </div>
                </div>

                <div className="spares-grid">
                  {(form.spareParts || []).map((part, idx) => (
                    <div key={idx} className="spare-part-item">
                      <span>{part}</span>
                      <button
                        type="button"
                        className="delete-spare-btn"
                        onClick={() => {
                          set(
                            "spareParts",
                            (form.spareParts || []).filter((_, i) => i !== idx)
                          );
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="add-spare-part-row">
                  <input
                    type="text"
                    placeholder="New Spare Part (e.g. Brass Pocket Net Leathers)"
                    value={newSparePart}
                    onChange={(e) => setNewSparePart(e.target.value)}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (!newSparePart.trim()) return;
                      set("spareParts", [...(form.spareParts || []), newSparePart.trim()]);
                      setNewSparePart("");
                      toast.success("Spare part added");
                    }}
                  >
                    <Plus size={14} /> Add Part
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              STEP 11: SEO & SCHEMA PREVIEW
             ========================================================================= */}
          {currentStep === 11 && (
            <div className="step-form-grid">
              <Field
                label="SEO Title (Google Title Tag)"
                value={form.seoTitle}
                onChange={(val) => set("seoTitle", val)}
                placeholder="e.g. Nizam Royal 12ft Snooker Table | Hyderabad Cue Sports"
                wide
                help={`${(form.seoTitle || "").length} / 60 recommended characters`}
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
                  placeholder="nizam-royal-12ft-snooker-table"
                />
                {form.oldSlug && form.oldSlug !== form.slug && (
                  <small className="slug-redirect-alert">
                    <RotateCcw size={13} /> 301 Permanent Redirect will automatically point from /products/{form.oldSlug} to /products/{form.slug}.
                  </small>
                )}
              </div>

              <Field
                label="Meta Description"
                value={form.seoDescription}
                onChange={(val) => set("seoDescription", val)}
                placeholder="Concise 150-160 character snippet appearing under your title in Google search results"
                wide
                textarea
                help={`${(form.seoDescription || "").length} / 160 recommended characters`}
              />

              <Field
                label="Focus Keyword"
                value={form.focusKeyword || ""}
                onChange={(val) => set("focusKeyword", val)}
                placeholder="e.g. 12ft snooker table, nizam royal, championship snooker table"
              />

              <SelectForm
                label="Search Engine Visibility"
                value={form.searchEngineVisibility || "Index"}
                options={["Index", "No Index"]}
                onChange={(val) => set("searchEngineVisibility", val as "Index" | "No Index")}
              />

              <Field
                label="Social Share / Open Graph (OG) Image URL"
                value={form.ogImage || form.primaryImage || ""}
                onChange={(val) => set("ogImage", val)}
                placeholder="e.g. https://hyderabadcuesports.in/og/table-12ft.jpg"
                wide
              />

              {/* Google Search Snippet */}
              <div className="field-wide google-snippet-card">
                <span className="google-snippet-eyebrow">Google Search Result Snippet Preview</span>
                <div className="google-snippet-body">
                  <div className="google-url-row">
                    <div className="google-icon-circle">H</div>
                    <div className="google-url-text">
                      <span>hyderabadcuesports.in</span>
                      <small>› products › {form.slug || "product-url-slug"}</small>
                    </div>
                  </div>
                  <h3 className="google-title">{form.seoTitle || form.name || "Product Title Preview"}</h3>
                  <p className="google-desc">
                    {form.seoDescription ||
                      form.shortDescription ||
                      "Handcrafted tournament snooker tables and luxury cues made in Hyderabad. Full WPBSA specs and white-glove installation."}
                  </p>
                </div>
              </div>

              {/* JSON-LD Schema Preview */}
              <div className="field-wide jsonld-preview-card">
                <span className="form-label">Auto-Generated Product Schema (JSON-LD)</span>
                <pre className="jsonld-code">
                  {JSON.stringify(
                    {
                      "@context": "https://schema.org/",
                      "@type": "Product",
                      name: form.name || "Product",
                      image: form.images || [],
                      description: form.shortDescription || "",
                      sku: form.sku || "",
                      mpn: form.sku || "",
                      brand: {
                        "@type": "Brand",
                        name: form.brand || "HCS Studio",
                      },
                      offers: {
                        "@type": "Offer",
                        url: `https://hyderabadcuesports.in/products/${form.slug}`,
                        priceCurrency: "INR",
                        price: basePrice,
                        availability:
                          form.inventory > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                        itemCondition: "https://schema.org/NewCondition",
                      },
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>
          )}

          {/* =========================================================================
              STEP 12: REVIEW & PUBLISH (Validation Checklist & Device Preview)
             ========================================================================= */}
          {currentStep === 12 && (
            <div className="review-summary-container">
              {/* Pre-Flight Validation Checklist */}
              <div className="review-block validation-checklist-card">
                <div className="review-block-header">
                  <strong>Pre-Flight Listing Audit</strong>
                  <span className="validation-counts">
                    {validationErrors.length === 0 ? (
                      <span className="status-pill green">
                        <CheckCircle2 size={13} /> Ready to Deploy
                      </span>
                    ) : (
                      <span className="status-pill red">
                        <AlertCircle size={13} /> {validationErrors.length} Blocking Error(s)
                      </span>
                    )}
                  </span>
                </div>

                {validationErrors.length > 0 && (
                  <div className="errors-list">
                    {validationErrors.map((err, i) => (
                      <div key={i} className="err-row">
                        <AlertCircle size={15} className="text-red" />
                        <span>{err}</span>
                      </div>
                    ))}
                  </div>
                )}

                {validationWarnings.length > 0 && (
                  <div className="warnings-list">
                    {validationWarnings.map((warn, i) => (
                      <div key={i} className="warn-row">
                        <AlertTriangle size={15} className="text-amber" />
                        <span>{warn}</span>
                      </div>
                    ))}
                  </div>
                )}

                {validationErrors.length === 0 && validationWarnings.length === 0 && (
                  <div className="all-clear-banner">
                    <CheckCircle2 size={18} className="text-forest" />
                    <span>All listing fields and compliance checks passed flawlessly!</span>
                  </div>
                )}
              </div>

              {/* Device Preview Switcher (Desktop vs Mobile) */}
              <div className="review-block device-preview-block">
                <div className="review-block-header">
                  <strong>Storefront Live Card Preview</strong>
                  <div className="device-switcher-btns">
                    <button
                      type="button"
                      className={`device-btn ${previewDevice === "desktop" ? "active" : ""}`}
                      onClick={() => setPreviewDevice("desktop")}
                    >
                      <Monitor size={14} /> Desktop View
                    </button>
                    <button
                      type="button"
                      className={`device-btn ${previewDevice === "mobile" ? "active" : ""}`}
                      onClick={() => setPreviewDevice("mobile")}
                    >
                      <Smartphone size={14} /> Mobile Card
                    </button>
                  </div>
                </div>

                <div className={`storefront-card-mockup ${previewDevice}`}>
                  <div className="mock-card-media">
                    {form.primaryImage || form.images?.[0] ? (
                      <img src={form.primaryImage || form.images?.[0]} alt={form.name} />
                    ) : (
                      <div className="mock-placeholder" style={{ background: form.accent }}>
                        {form.initials || "HCS"}
                      </div>
                    )}
                    <div className="mock-badges">
                      {(form.productBadges || []).slice(0, 2).map((b) => (
                        <span key={b} className="badge-tag">
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mock-card-content">
                    <span className="mock-cat">
                      {form.category} · {form.subcategory}
                    </span>
                    <h3 className="mock-title">{form.name || "Untitled Product"}</h3>
                    <p className="mock-desc">{form.shortDescription || "No short description provided."}</p>

                    <div className="mock-price-row">
                      {form.priceOnRequest || form.salesMode === "Request a Quote" ? (
                        <strong className="mock-quote">Price on Request</strong>
                      ) : (
                        <div>
                          <strong className="mock-price">{formatINR(basePrice)}</strong>
                          {mrpVal > basePrice && <span className="mock-mrp">{formatINR(mrpVal)}</span>}
                        </div>
                      )}
                    </div>

                    <button type="button" className="mock-cta-btn">
                      {form.salesMode === "Request a Quote" || form.priceOnRequest
                        ? "Request Bespoke Quote"
                        : form.salesMode === "Booking with Advance"
                        ? `Book with ${formatINR(advanceDeposit)} Advance`
                        : "Buy Now"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Review Section 1: Product Identity */}
              <div className="review-block">
                <div className="review-block-header">
                  <strong>01. Product Identity & Compliance</strong>
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
                    <span>Sales Mode</span>
                    <strong>{form.salesMode}</strong>
                  </div>
                  <div>
                    <span>Product Type</span>
                    <strong>{form.productType}</strong>
                  </div>
                  <div>
                    <span>Country of Origin</span>
                    <strong>{form.countryOfOrigin || "India"}</strong>
                  </div>
                  <div>
                    <span>Net Quantity</span>
                    <strong>{form.netQuantity || "Not specified"}</strong>
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
                    <strong>{form.category || "Not selected"}</strong>
                  </div>
                  <div>
                    <span>Subcategory</span>
                    <strong>{form.subcategory || "Not selected"}</strong>
                  </div>
                  <div>
                    <span>Game Types</span>
                    <strong>{(form.gameTypes || []).join(", ") || "None"}</strong>
                  </div>
                  <div>
                    <span>Customer Segments</span>
                    <strong>{(form.customerSegments || []).join(", ") || "None"}</strong>
                  </div>
                </div>
              </div>

              {/* Review Section 3: Specifications */}
              <div className="review-block">
                <div className="review-block-header">
                  <strong>03. Specifications</strong>
                  <button type="button" onClick={() => handleStepClick(3)}>
                    <Pencil size={13} /> Edit
                  </button>
                </div>
                <div className="review-specs-inline">
                  {Object.keys(form.specs || {}).length > 0 ? (
                    Object.entries(form.specs || {}).map(([k, v]) => (
                      <span key={k} className="review-spec-pill">
                        <strong>{k}:</strong> {v}
                      </span>
                    ))
                  ) : (
                    <span className="muted-cell">None specified</span>
                  )}
                </div>
              </div>

              {/* Review Section 5: Pricing & Tax */}
              <div className="review-block">
                <div className="review-block-header">
                  <strong>05. Pricing & Tax</strong>
                  <button type="button" onClick={() => handleStepClick(5)}>
                    <Pencil size={13} /> Edit
                  </button>
                </div>
                <div className="review-block-grid">
                  <div>
                    <span>MRP</span>
                    <strong>{mrpVal > 0 ? formatINR(mrpVal) : "Not listed"}</strong>
                  </div>
                  <div>
                    <span>Selling Price</span>
                    <strong className="text-forest">
                      {form.priceOnRequest ? "On Request" : formatINR(form.price)}
                    </strong>
                  </div>
                  <div>
                    <span>HSN Code</span>
                    <strong>{form.hsnCode} ({form.hsnGstRate}% GST)</strong>
                  </div>
                  <div>
                    <span>Advance Booking</span>
                    <strong>
                      {form.salesMode === "Booking with Advance" ? formatINR(advanceDeposit) : "Full Payment"}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Final Actions Callout */}
              <div className="final-publish-callout">
                <div>
                  <h4>Deploy Product to Storefront</h4>
                  <p>
                    Publishing makes this product immediately searchable, categorized, and ready for purchase or
                    consultation quotes.
                  </p>
                </div>
                <div className="final-actions-row">
                  <Button variant="outline" size="sm" onClick={() => handleSave("Draft")}>
                    Save as Draft
                  </Button>
                  <Button size="sm" onClick={() => handleSave("Published")}>
                    <Check size={14} /> Publish Product Now
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM WIZARD CONTROLS (Back Arrow / Save as Draft / Continue) */}
        <div className="wizard-bottom-nav">
          <button
            type="button"
            onClick={handlePrev}
            className="wizard-back-btn"
            aria-label="Previous step"
            title={currentStep === 1 ? "Cancel and return to list" : "Previous step"}
          >
            <ArrowLeft size={16} strokeWidth={2.2} />
            <span>{currentStep === 1 ? "Back to Products" : "Previous Step"}</span>
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

            {currentStep !== 12 ? (
              <Button size="sm" onClick={validateAndNext} className="wizard-next-btn">
                Continue <ArrowRight size={14} />
              </Button>
            ) : (
              <Button size="sm" onClick={() => handleSave("Published")} className="wizard-publish-btn">
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
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  wide?: boolean;
  textarea?: boolean;
  help?: string;
  disabled?: boolean;
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
          disabled={disabled}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
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
  placeholder,
  disabled = false,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div className="form-field">
      <span className="form-label">{label}</span>
      <SelectField
        value={value}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );
}
