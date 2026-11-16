export type CmsSectionType = "Hero Banner" | "Product Carousel" | "Product Grid" | "Category Cards" | "Featured Products" | "Best Sellers" | "New Arrivals" | "Promotional Banner" | "Featured Collection" | "Testimonials" | "Shopping Benefits" | "Newsletter" | "Bulk Enquiry";
export type CmsSection = { id: string; type: CmsSectionType; title: string; subtitle: string; enabled: boolean; background: "Ivory" | "White" | "Forest" | "Gold"; layout: "Full width" | "Two column" | "Cards" | "Carousel"; productIds: string[]; updatedAt: string };
export type CmsBanner = { id: string; name: string; headline: string; subtitle: string; ctaText: string; destination: string; placement: "Homepage hero" | "Homepage promotional" | "Category page"; desktopAccent: string; mobileAccent: string; starts: string; ends: string; active: boolean };
export type CmsPage = { id: string; title: string; slug: string; content: string; seoTitle: string; seoDescription: string; status: "Published" | "Draft"; updatedAt: string };
export type CmsMenuItem = { id: string; label: string; destination: string; location: "Header" | "Footer"; parentId: string | null; order: number; enabled: boolean };

export const defaultCmsSections: CmsSection[] = [
  { id: "sec-1", type: "Hero Banner", title: "Play the game beautifully", subtitle: "Tournament-grade equipment for Hyderabad's cue sports community.", enabled: true, background: "Forest", layout: "Full width", productIds: [], updatedAt: "Just now" },
  { id: "sec-2", type: "Category Cards", title: "Shop by equipment", subtitle: "Everything you need to build a better game room.", enabled: true, background: "Ivory", layout: "Cards", productIds: [], updatedAt: "12 Nov 2026" },
  { id: "sec-3", type: "Featured Products", title: "The HCS edit", subtitle: "A considered collection for serious players.", enabled: true, background: "White", layout: "Carousel", productIds: ["prod-1", "prod-2", "prod-4"], updatedAt: "12 Nov 2026" },
  { id: "sec-4", type: "Promotional Banner", title: "Bring the club home", subtitle: "Professional table delivery and installation across Hyderabad.", enabled: true, background: "Gold", layout: "Two column", productIds: [], updatedAt: "10 Nov 2026" },
  { id: "sec-5", type: "Category Cards", title: "Shop by category", subtitle: "From cues to cloth, find the right fit.", enabled: true, background: "Ivory", layout: "Cards", productIds: [], updatedAt: "10 Nov 2026" },
  { id: "sec-6", type: "Best Sellers", title: "Player favourites", subtitle: "The gear our Hyderabad customers return for.", enabled: true, background: "White", layout: "Carousel", productIds: ["prod-1", "prod-6", "prod-7"], updatedAt: "09 Nov 2026" },
  { id: "sec-7", type: "Featured Collection", title: "Explore snooker cues", subtitle: "Hand-selected cues for confident control.", enabled: true, background: "Forest", layout: "Two column", productIds: ["prod-1"], updatedAt: "08 Nov 2026" },
  { id: "sec-8", type: "Product Grid", title: "Snooker balls & accessories", subtitle: "Small details. Better sessions.", enabled: true, background: "White", layout: "Cards", productIds: ["prod-2", "prod-6", "prod-7"], updatedAt: "08 Nov 2026" },
  { id: "sec-9", type: "Product Grid", title: "Table components & lighting", subtitle: "Build the right environment for play.", enabled: true, background: "Ivory", layout: "Cards", productIds: ["prod-4", "prod-8"], updatedAt: "07 Nov 2026" },
  { id: "sec-10", type: "Featured Collection", title: "Club & professional equipment", subtitle: "Reliable equipment for high-volume rooms.", enabled: true, background: "White", layout: "Two column", productIds: ["prod-3", "prod-4"], updatedAt: "06 Nov 2026" },
  { id: "sec-11", type: "Bulk Enquiry", title: "Outfit your club", subtitle: "Tell us what you are building and our team will help.", enabled: true, background: "Forest", layout: "Two column", productIds: [], updatedAt: "05 Nov 2026" },
  { id: "sec-12", type: "Shopping Benefits", title: "A better way to buy cue sports", subtitle: "Thoughtful service at every step.", enabled: true, background: "Ivory", layout: "Cards", productIds: [], updatedAt: "05 Nov 2026" },
  { id: "sec-13", type: "Testimonials", title: "From the baize", subtitle: "Notes from players and club owners.", enabled: false, background: "White", layout: "Carousel", productIds: [], updatedAt: "04 Nov 2026" },
  { id: "sec-14", type: "Newsletter", title: "Stay in the game", subtitle: "New drops, club stories and match-day tips.", enabled: true, background: "Gold", layout: "Two column", productIds: [], updatedAt: "04 Nov 2026" },
];

export const cmsBanners: CmsBanner[] = [
  { id: "ban-1", name: "November Club Season", headline: "Bring the club home", subtitle: "Professional tables, installed with care across Hyderabad.", ctaText: "Explore tables", destination: "/collections/tables", placement: "Homepage hero", desktopAccent: "#164B38", mobileAccent: "#103729", starts: "2026-11-01T09:00", ends: "2026-11-30T23:59", active: true },
  { id: "ban-2", name: "Cue Care Week", headline: "Tune your game", subtitle: "Save on cue care essentials through 20 November.", ctaText: "Shop accessories", destination: "/collections/cue-accessories", placement: "Homepage promotional", desktopAccent: "#C9A451", mobileAccent: "#D8B66D", starts: "2026-11-14T00:00", ends: "2026-11-20T23:59", active: true },
  { id: "ban-3", name: "Tournament Ready", headline: "Play with precision", subtitle: "Aramith balls and Strachan cloth for serious rooms.", ctaText: "Shop tournament gear", destination: "/collections/professional", placement: "Category page", desktopAccent: "#8FB29E", mobileAccent: "#B6C8BD", starts: "2026-10-01T00:00", ends: "2026-10-31T23:59", active: false },
];

export const cmsPages: CmsPage[] = [
  { id: "page-about", title: "About Us", slug: "about-us", content: "Hyderabad Cue Sports is a considered destination for players, clubs and room builders. We believe better equipment makes more room for better play.", seoTitle: "About Hyderabad Cue Sports", seoDescription: "Meet Hyderabad's cue sports equipment specialists.", status: "Published", updatedAt: "12 Nov 2026" },
  { id: "page-contact", title: "Contact Us", slug: "contact-us", content: "Visit our studio by appointment, call +91 40 4012 8700, or write to hello@hyderabadcuesports.in.", seoTitle: "Contact Hyderabad Cue Sports", seoDescription: "Contact the Hyderabad Cue Sports team for products, installation and club enquiries.", status: "Published", updatedAt: "11 Nov 2026" },
  { id: "page-shipping", title: "Shipping Policy", slug: "shipping-policy", content: "Most accessories leave our studio within 1–2 working days. Table delivery and installation is scheduled with you directly.", seoTitle: "Shipping Policy · Hyderabad Cue Sports", seoDescription: "Learn about accessories, table delivery and installation timelines.", status: "Published", updatedAt: "08 Nov 2026" },
  { id: "page-return", title: "Return Policy", slug: "return-policy", content: "Unused accessories can be requested for return within 7 days. Custom installations and used cloth are not eligible.", seoTitle: "Return Policy · Hyderabad Cue Sports", seoDescription: "Read the return and exchange policy for Hyderabad Cue Sports orders.", status: "Draft", updatedAt: "06 Nov 2026" },
  { id: "page-privacy", title: "Privacy Policy", slug: "privacy-policy", content: "We only use customer information to fulfil orders, improve service and communicate store updates you choose to receive.", seoTitle: "Privacy Policy · Hyderabad Cue Sports", seoDescription: "How Hyderabad Cue Sports handles customer information.", status: "Published", updatedAt: "03 Nov 2026" },
  { id: "page-terms", title: "Terms & Conditions", slug: "terms-conditions", content: "By shopping with HCS, you agree to our payment, delivery, installation and product-use terms.", seoTitle: "Terms & Conditions · Hyderabad Cue Sports", seoDescription: "Store terms for Hyderabad Cue Sports products and services.", status: "Draft", updatedAt: "01 Nov 2026" },
];

export const cmsMenuItems: CmsMenuItem[] = [
  { id: "menu-1", label: "Shop", destination: "/collections/all", location: "Header", parentId: null, order: 1, enabled: true },
  { id: "menu-2", label: "Cues", destination: "/collections/cues", location: "Header", parentId: "menu-1", order: 1, enabled: true },
  { id: "menu-3", label: "Tables", destination: "/collections/tables", location: "Header", parentId: "menu-1", order: 2, enabled: true },
  { id: "menu-4", label: "Accessories", destination: "/collections/cue-accessories", location: "Header", parentId: "menu-1", order: 3, enabled: true },
  { id: "menu-5", label: "Our story", destination: "/pages/about-us", location: "Header", parentId: null, order: 2, enabled: true },
  { id: "menu-6", label: "Contact", destination: "/pages/contact-us", location: "Header", parentId: null, order: 3, enabled: true },
  { id: "menu-7", label: "Shipping policy", destination: "/pages/shipping-policy", location: "Footer", parentId: null, order: 1, enabled: true },
  { id: "menu-8", label: "Returns", destination: "/pages/return-policy", location: "Footer", parentId: null, order: 2, enabled: true },
  { id: "menu-9", label: "Privacy", destination: "/pages/privacy-policy", location: "Footer", parentId: null, order: 3, enabled: true },
];
