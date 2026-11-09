export type ProductType = "table" | "accessory" | "apparel";

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  type: ProductType;
  size: string;
  price: number;
  compareAt?: number;
  image: string;
  gallery?: string[];
  badge?: string;
  availability: "In stock" | "Made to order" | "Low stock";
  description: string;
  details: string[];
  specs: { label: string; value: string }[];
  tags: string[];
};

export const products: Product[] = [
  {
    id: "table-12ft-featured",
    slug: "12-ft-tournament-snooker-table",
    name: "12 FT Snooker Table",
    category: "Snooker Tables",
    type: "table",
    size: "12 FT",
    price: 425000,
    image: "/images/products/featured-table-12ft.jpg",
    gallery: ["/images/products/featured-table-12ft.jpg", "/images/snooker-hero.jpg", "/images/snooker-room.jpg"],
    badge: "Tournament",
    availability: "In stock",
    description: "Official 12 FT tournament specification snooker table featuring precision diamond-honed 45mm Italian slate, English Strachan 6811 pure wool baize, hand-carved mahogany underframe, and solid brass pocket irons with genuine leather nets.",
    details: ["Full-size 12 FT x 6 FT regulation tournament dimensions", "5-piece precision diamond-honed 45mm Italian slate", "Handcrafted solid mahogany legs with micro-adjustable brass levelers", "Official Strachan 6811 100% pure wool English baize"],
    specs: [
      { label: "Playing size", value: "12 FT (366cm x 183cm)" },
      { label: "Slate", value: "5-piece 45mm precision Italian slate" },
      { label: "Cloth", value: "Strachan 6811 Tournament Baize" },
      { label: "Timber", value: "Selected plantation mahogany" },
      { label: "Availability", value: "In stock" }
    ],
    tags: ["12 FT", "tables", "tournament", "featured", "snooker tables"]
  },
  {
    id: "cue-stick-featured",
    slug: "professional-snooker-cue-stick",
    name: "Snooker Cue Stick",
    category: "Cue Equipment",
    type: "accessory",
    size: "Standard 58 inch",
    price: 14500,
    image: "/images/products/featured-cue-stick.jpg",
    gallery: ["/images/products/featured-cue-stick.jpg", "/images/categories/cue-equipment.jpg"],
    badge: "Best Seller",
    availability: "In stock",
    description: "Master-crafted hand-spliced ash cue stick with precision balance point, vacuum brass joint, and premium North American ash shaft with distinctive grain arrows.",
    details: ["Grade AAA North American straight-grain ash", "Genuine ebony 4-point hand splice butt", "9.5mm pressed leather tip with brass ferrule", "Quick-release brass vacuum joint"],
    specs: [
      { label: "Length", value: "58 inches (147cm)" },
      { label: "Weight", value: "18.2 oz" },
      { label: "Tip size", value: "9.5mm laminated leather" },
      { label: "Joint", value: "Precision machined brass" }
    ],
    tags: ["cues", "sticks", "cue equipment", "ash cue", "featured"]
  },
  {
    id: "snooker-balls-15-featured",
    slug: "tournament-snooker-balls-set-of-15",
    name: "Snooker Balls (Set of 15)",
    category: "Table Accessories",
    type: "accessory",
    size: "Standard 2 1/16 inch",
    price: 6800,
    image: "/images/products/featured-balls-15.jpg",
    gallery: ["/images/products/featured-balls-15.jpg", "/images/categories/table-accessories.jpg"],
    badge: "Official",
    availability: "In stock",
    description: "Match-grade phenolic resin 15-red snooker ball set engineered for true roll, high impact resistance, and perfect weight uniformity across all balls.",
    details: ["Precision calibrated 2 1/16 inch diameter", "High-density phenolic resin construction", "Scratch-resistant mirror polish finish", "Includes luxury partitioned presentation storage box"],
    specs: [
      { label: "Diameter", value: "2 1/16 inches (52.5mm)" },
      { label: "Material", value: "Pure phenolic resin" },
      { label: "Weight tolerance", value: "±0.5g calibrated balance" },
      { label: "Contents", value: "15 Red match balls" }
    ],
    tags: ["balls", "accessories", "table accessories", "featured", "in stock"]
  },
  {
    id: "table-cloth-featured",
    slug: "premium-wool-snooker-table-cloth",
    name: "Snooker Table Cloth",
    category: "Table Accessories",
    type: "accessory",
    size: "12 FT Bed & Cushions",
    price: 7200,
    image: "/images/products/featured-table-cloth.jpg",
    gallery: ["/images/products/featured-table-cloth.jpg", "/images/categories/table-accessories.jpg"],
    badge: "Fast Pace",
    availability: "In stock",
    description: "Premium fast-paced 100% pure wool snooker bed and cushion baize cloth treated for smooth, predictable ball trajectory and long service life.",
    details: ["100% fine worsted pure wool baize", "Pre-cut for 12 FT bed cloth plus 6 matching cushion strips", "Directional directional nap for true ball control", "Stain and spill resistant treatment"],
    specs: [
      { label: "Material", value: "100% Pure English Wool" },
      { label: "Weight", value: "30 oz / yard" },
      { label: "Cut", value: "Bed cloth + 6 cushion rails" },
      { label: "Compatibility", value: "12 FT, 10 FT, or 8 FT tables" }
    ],
    tags: ["cloth", "baize", "accessories", "table accessories", "featured"]
  },
  {
    id: "classic-12",
    slug: "professional-classic-snooker-table-12-ft",
    name: "Professional Classic Snooker Table",
    category: "Snooker Tables",
    type: "table",
    size: "12 FT",
    price: 289000,
    compareAt: 325000,
    image: "/images/snooker-collection.jpg",
    gallery: ["/images/snooker-collection.jpg", "/images/snooker-detail.jpg", "/images/snooker-room.jpg"],
    badge: "Featured",
    availability: "Made to order",
    description: "A considered centrepiece for serious practice rooms, clubs and private collections. This illustrative demo product pairs classic proportions with a calm, architectural presence.",
    details: ["Illustrative catalogue item for client review", "Available in a choice of sample finish directions", "Delivery and installation pricing to be confirmed"],
    specs: [
      { label: "Playing size", value: "12 FT" },
      { label: "Product type", value: "Full-size snooker table" },
      { label: "Finish shown", value: "Natural oak / forest green" },
      { label: "Availability", value: "Made to order" }
    ],
    tags: ["12 FT", "tables", "featured", "professional"]
  },
  {
    id: "tournament-12",
    slug: "tournament-series-snooker-table-12-ft",
    name: "Tournament Series Snooker Table",
    category: "Snooker Tables",
    type: "table",
    size: "12 FT",
    price: 345000,
    image: "/images/snooker-detail.jpg",
    badge: "New arrival",
    availability: "Made to order",
    description: "A confident tournament-room silhouette for spaces designed around the ritual of the game. Product specifications shown are illustrative and editable.",
    details: ["Sample product for the Hyderabad Cue Sports demo catalogue", "Room planning support can be added to the final service flow", "Final finish, cloth and delivery details to be confirmed"],
    specs: [
      { label: "Playing size", value: "12 FT" },
      { label: "Product type", value: "Tournament-style table" },
      { label: "Finish shown", value: "Walnut / forest green" },
      { label: "Availability", value: "Made to order" }
    ],
    tags: ["12 FT", "tables", "new", "tournament"]
  },
  {
    id: "club-10",
    slug: "premium-club-snooker-table-10-ft",
    name: "Premium Club Snooker Table",
    category: "Snooker Tables",
    type: "table",
    size: "10 FT",
    price: 219000,
    compareAt: 245000,
    image: "/images/snooker-room.jpg",
    badge: "Club favourite",
    availability: "In stock",
    description: "A versatile 10 FT footprint for home lounges, hospitality spaces and compact club settings. A polished demo placeholder awaiting the final technical catalogue.",
    details: ["Sample product for layout and commerce testing", "Suitable for space-planning conversations", "Final material and installation specifications to be supplied"],
    specs: [
      { label: "Playing size", value: "10 FT" },
      { label: "Product type", value: "Club-format table" },
      { label: "Finish shown", value: "Oak / forest green" },
      { label: "Availability", value: "In stock" }
    ],
    tags: ["10 FT", "tables", "club", "featured"]
  },
  {
    id: "compact-8",
    slug: "compact-professional-snooker-table-8-ft",
    name: "Compact Professional Snooker Table",
    category: "Snooker Tables",
    type: "table",
    size: "8 FT",
    price: 149000,
    image: "/images/snooker-collection.jpg",
    availability: "Low stock",
    badge: "Low Stock",
    description: "A more compact playing footprint for rooms where proportion matters. The visual and pricing are illustrative sample content for this demonstration.",
    details: ["Demonstration product with editable content", "Room dimensions should be validated before purchase", "Delivery and installation are placeholders"],
    specs: [
      { label: "Playing size", value: "8 FT" },
      { label: "Product type", value: "Compact professional table" },
      { label: "Finish shown", value: "Natural oak / green cloth" },
      { label: "Availability", value: "Low stock" }
    ],
    tags: ["8 FT", "tables", "compact"]
  },
  {
    id: "hcs-heavyweight-hoodie",
    slug: "hcs-heavyweight-club-hoodie",
    name: "HCS Signature Heavyweight Hoodie",
    category: "Hoodies",
    type: "apparel",
    size: "L",
    price: 2899,
    compareAt: 3499,
    image: "/images/snooker-room.jpg",
    gallery: ["/images/snooker-room.jpg", "/images/snooker-detail.jpg"],
    badge: "Best Seller",
    availability: "In stock",
    description: "Ultra-heavyweight 420 GSM French Terry cotton hoodie with minimalist tonal embroidery of the Hyderabad Cue Sports insignia. Designed for unmatched comfort during long frames.",
    details: ["420 GSM pure heavyweight combed cotton", "Pre-shrunk, fleece-lined interior for structural drape", "Double-layered hood with antique brass eyelets"],
    specs: [
      { label: "Fabric", value: "420 GSM 100% French Terry Cotton" },
      { label: "Fit", value: "Slightly oversized boxy cut" },
      { label: "Colorway", value: "Heritage Forest Green" },
      { label: "Sizes available", value: "S, M, L, XL, XXL" }
    ],
    tags: ["hoodies", "apparel", "best seller", "clothing"]
  },
  {
    id: "hcs-archive-tee",
    slug: "archive-boxy-oversized-t-shirt",
    name: "Archive Cueist Oversized T-Shirt",
    category: "T-Shirts",
    type: "apparel",
    size: "XL",
    price: 1499,
    compareAt: 1899,
    image: "/images/snooker-detail.jpg",
    gallery: ["/images/snooker-detail.jpg", "/images/snooker-collection.jpg"],
    badge: "Low Stock",
    availability: "Low stock",
    description: "260 GSM luxury dense cotton oversized graphic tee celebrating cue sports heritage. Features drop-shoulder proportions and vintage-wash screen printed graphics.",
    details: ["260 GSM single jersey compact yarn cotton", "Drop-shoulder relaxed streetwear silhouette", "High-density ribbed collar that retains shape"],
    specs: [
      { label: "Fabric", value: "260 GSM 100% Ring-spun Cotton" },
      { label: "Fit", value: "Drop-shoulder oversized" },
      { label: "Colorway", value: "Raw Vintage Chalk" },
      { label: "Sizes available", value: "M, L, XL, XXL" }
    ],
    tags: ["t-shirts", "apparel", "oversized", "clothing", "low stock"]
  },
  {
    id: "hcs-club-green-hoodie",
    slug: "club-green-embroidered-hoodie",
    name: "Heritage Club Emblem Hoodie",
    category: "Hoodies",
    type: "apparel",
    size: "M",
    price: 3199,
    compareAt: 3799,
    image: "/images/snooker-collection.jpg",
    badge: "New arrival",
    availability: "In stock",
    description: "Premium snooker club edition hoodie crafted from brushed fleece with high-density gold chest embroidery.",
    details: ["400 GSM heavyweight brushed organic cotton", "Embroidered gold monogram patch", "Ribbed side panels for unrestricted cue movement"],
    specs: [
      { label: "Fabric", value: "400 GSM Organic Cotton" },
      { label: "Fit", value: "Classic relaxed fit" },
      { label: "Colorway", value: "Deep Emerald & Gold" },
      { label: "Sizes available", value: "S, M, L, XL" }
    ],
    tags: ["hoodies", "apparel", "new", "clothing"]
  },
  {
    id: "hcs-monogram-tee",
    slug: "hcs-monogram-oversized-tee",
    name: "HCS Monogram Oversized T-Shirt",
    category: "T-Shirts",
    type: "apparel",
    size: "L",
    price: 1399,
    compareAt: 1699,
    image: "/images/snooker-hero.jpg",
    badge: "Trending",
    availability: "In stock",
    description: "Minimalist streetwear essential with subtle gold micro-print on the chest and high-density branding on the back collar.",
    details: ["250 GSM heavy bio-washed cotton", "Reinforced neckline and double-stitched cuffs", "Breathable for everyday wear"],
    specs: [
      { label: "Fabric", value: "250 GSM Combed Cotton" },
      { label: "Fit", value: "Relaxed boxy fit" },
      { label: "Colorway", value: "Anthracite Black" },
      { label: "Sizes available", value: "S, M, L, XL, XXL" }
    ],
    tags: ["t-shirts", "apparel", "trending", "clothing"]
  },
  {
    id: "ash-cue",
    slug: "heritage-ash-snooker-cue",
    name: "Heritage Ash Snooker Cue",
    category: "Cues",
    type: "accessory",
    size: "One size",
    price: 12500,
    image: "/images/snooker-detail.jpg",
    availability: "In stock",
    badge: "Best Seller",
    description: "A refined accessory placeholder with a tactile, heritage-led feel. Final cue construction details remain editable demo content.",
    details: ["Illustrative accessory listing", "Final wood grade and tip details to be confirmed"],
    specs: [
      { label: "Product type", value: "Snooker cue" },
      { label: "Finish shown", value: "Natural ash" },
      { label: "Availability", value: "In stock" }
    ],
    tags: ["accessories", "cues", "in stock"]
  },
  {
    id: "ball-set",
    slug: "professional-ball-set",
    name: "Professional Ball Set",
    category: "Table Accessories",
    type: "accessory",
    size: "Standard set",
    price: 8900,
    image: "/images/snooker-room.jpg",
    availability: "In stock",
    description: "An illustrative premium ball set listing for the accessories collection. Specifications can be swapped when the final catalogue is approved.",
    details: ["Sample accessory product", "Final composition and packaging details are placeholders"],
    specs: [
      { label: "Product type", value: "Snooker ball set" },
      { label: "Set format", value: "Standard sample set" },
      { label: "Availability", value: "In stock" }
    ],
    tags: ["accessories", "balls", "in stock"]
  },
  {
    id: "cue-case",
    slug: "canvas-leather-cue-case",
    name: "Canvas & Leather Cue Case",
    category: "Cue Cases",
    type: "accessory",
    size: "2-piece",
    price: 6800,
    image: "/images/snooker-detail.jpg",
    availability: "In stock",
    description: "A considered everyday carry piece for the cue collection. This visual and pricing are illustrative until the final product data is supplied.",
    details: ["Sample accessory product", "Final fit and hardware details to be confirmed"],
    specs: [
      { label: "Product type", value: "Cue case" },
      { label: "Format", value: "2-piece sample fit" },
      { label: "Availability", value: "In stock" }
    ],
    tags: ["accessories", "cases", "in stock"]
  },
  {
    id: "baize-master-cue-set",
    slug: "maple-emperor-professional-snooker-cue-set",
    name: "Maple Emperor Professional Cue Set",
    category: "Cues",
    type: "accessory",
    size: "Standard 58 inch",
    price: 16800,
    compareAt: 19500,
    image: "/images/categories/cue-equipment.jpg",
    badge: "Best Seller",
    availability: "In stock",
    description: "Hand-spliced premium ebony and maple professional cue set featuring Baize Master precision balance, mini-butt extender, and luxury hard case.",
    details: ["Grade-A North American ash shaft", "Solid brass quick-release vacuum joint", "Includes 6-inch mini-butt extender and leatherette case"],
    specs: [
      { label: "Length", value: "58 inches" },
      { label: "Tip size", value: "9.5mm pressed leather" },
      { label: "Joint", value: "Quick-release brass" },
      { label: "Weight", value: "18 - 18.5 oz" }
    ],
    tags: ["cues", "sticks", "cue equipment", "baize master", "best seller"]
  },
  {
    id: "riley-edwardian-scoreboard",
    slug: "edwardian-mahogany-riley-snooker-scoreboard",
    name: "Edwardian Mahogany Riley Scoreboard",
    category: "Scoreboards",
    type: "accessory",
    size: "Standard wall mount",
    price: 21500,
    compareAt: 24500,
    image: "/images/categories/scoreboards.jpg",
    badge: "Heritage",
    availability: "In stock",
    description: "Handcrafted solid mahogany Riley-style snooker and billiards scoreboard with antique brass markers and smooth pointer sliders.",
    details: ["Solid polished mahogany timber cabinet", "Engraved metallic numeric track up to 100 points", "Traditional brass slide pointers and frame counters"],
    specs: [
      { label: "Material", value: "Solid Plantation Mahogany" },
      { label: "Format", value: "Manual pointer and slide board" },
      { label: "Mounting", value: "Concealed heavy-duty wall brackets" },
      { label: "Origin", value: "Heritage craftsmanship" }
    ],
    tags: ["scoreboards", "manual", "riley", "heritage", "points board"]
  },
  {
    id: "pro-electronic-scoreboard",
    slug: "electronic-digital-snooker-scoreboard",
    name: "Pro-Match Electronic LED Scoreboard",
    category: "Scoreboards",
    type: "accessory",
    size: "Compact digital",
    price: 28900,
    compareAt: 32000,
    image: "/images/categories/scoreboards.jpg",
    badge: "Tournament",
    availability: "In stock",
    description: "High-contrast dual-player electronic snooker scoreboard with ultra-bright LED digits, wireless remote control, and frame tally counters.",
    details: ["High-visibility 4-inch red and green LED display", "Dual wireless infrared remote controls included", "Built-in break score calculator and match timer"],
    specs: [
      { label: "Display", value: "Ultra-bright anti-glare LED" },
      { label: "Controls", value: "Dual wireless handheld remotes" },
      { label: "Power", value: "220V AC with surge protection" },
      { label: "Features", value: "Current break, frame score, match clock" }
    ],
    tags: ["scoreboards", "electronic", "led", "digital", "tournament"]
  },
  {
    id: "strachan-6811-cloth",
    slug: "strachan-6811-tournament-snooker-cloth",
    name: "Strachan 6811 Tournament Table Cloth",
    category: "Table Accessories",
    type: "accessory",
    size: "12 FT Bed & Cushions",
    price: 26500,
    image: "/images/categories/table-accessories.jpg",
    badge: "Official",
    availability: "In stock",
    description: "The world's leading tournament snooker cloth. 100% pure English wool baize treated with SpillGuard for uniform speed and flawless cue ball control.",
    details: ["Official cloth specification for global cue sports events", "Precision short nap for predictable, true roll", "Pre-cut bed cloth and 6 matching cushion strips"],
    specs: [
      { label: "Composition", value: "100% Pure New Wool" },
      { label: "Weight", value: "32 oz / yd²" },
      { label: "Finish", value: "SpillGuard stain-resistant finish" },
      { label: "Compatibility", value: "Fits full-size 12 FT tournament tables" }
    ],
    tags: ["table accessories", "cloth", "strachan", "official", "12 FT"]
  },
  {
    id: "tournament-table-lights",
    slug: "shadowless-tournament-snooker-lights",
    name: "Tournament Shadowless Table Luminaire",
    category: "Table Accessories",
    type: "accessory",
    size: "Full-table canopy",
    price: 18500,
    image: "/images/categories/table-accessories.jpg",
    badge: "Precision",
    availability: "In stock",
    description: "Engineered canopy lighting system providing uniform, shadowless 5000K daylight illumination across the entire playing surface without glare.",
    details: ["Eliminates player cue and ball shadows completely", "High CRI 95+ flicker-free LED arrays", "Matte black architectural frame with adjustable suspension cables"],
    specs: [
      { label: "Light temperature", value: "5000K Neutral Crisp Daylight" },
      { label: "CRI rating", value: "95+ true ball color accuracy" },
      { label: "Suspension", value: "Dual adjustable steel cables" },
      { label: "Power", value: "Energy-efficient 120W LED" }
    ],
    tags: ["table accessories", "lights", "table lights", "shadowless"]
  }
];

export const collectionCards = [
  { title: "8 FT Snooker Tables", eyebrow: "Compact footprint", description: "A considered scale for rooms where every inch has a point of view.", filter: "8 FT", image: "/images/snooker-collection.jpg" },
  { title: "10 FT Snooker Tables", eyebrow: "Club format", description: "A versatile balance of presence, play and space-conscious design.", filter: "10 FT", image: "/images/snooker-room.jpg" },
  { title: "12 FT Tournament Tables", eyebrow: "Full-size ritual", description: "A statement playing surface for the rooms built around the game.", filter: "12 FT", image: "/images/snooker-detail.jpg" }
];

export const accessoryCategories = [
  { label: "Snooker Cues", note: "Hand-feel, balance and ritual", image: "/images/snooker-detail.jpg" },
  { label: "Snooker Balls", note: "The clean finish to every frame", image: "/images/snooker-room.jpg" },
  { label: "Cue Cases", note: "Carry the craft with care", image: "/images/snooker-collection.jpg" },
  { label: "Cue Accessories", note: "Small details, considered", image: "/images/snooker-detail.jpg" },
  { label: "Table Accessories", note: "Keep the room ready", image: "/images/snooker-room.jpg" }
];

export const formatInr = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

export const getProduct = (slug: string) => products.find((product) => product.slug === slug);
