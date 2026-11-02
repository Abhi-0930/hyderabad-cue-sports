export type ProductType = "table" | "accessory";

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
    id: "ash-cue",
    slug: "heritage-ash-snooker-cue",
    name: "Heritage Ash Snooker Cue",
    category: "Cues",
    type: "accessory",
    size: "One size",
    price: 12500,
    image: "/images/snooker-detail.jpg",
    availability: "In stock",
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
