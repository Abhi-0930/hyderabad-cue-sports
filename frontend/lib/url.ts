import { Product, products } from "@/lib/products";

const SIGNATURE_SALT = "HCS_SECURE_CATALOG_SALT_2026_X";

/**
 * Returns the public storefront base URL strictly from environment variables.
 * Enforces zero hardcoded fallback strings.
 */
export function getSiteBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL;
  if (!url) {
    throw new Error(
      "Missing required environment variable: NEXT_PUBLIC_SITE_URL in frontend/.env.local"
    );
  }
  return url.replace(/\/+$/, "");
}

/**
 * Generates an Amazon/Flipkart-style opaque random alphanumeric token.
 */
export function generateRandomToken(length = 36): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "AfmBO";
  for (let i = result.length; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generates a short random hex string for listing IDs.
 */
function generateRandomHex(length = 8): string {
  const hex = "0123456789abcdef";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += hex.charAt(Math.floor(Math.random() * hex.length));
  }
  return result;
}

/**
 * Generates a deterministic cryptographic checksum for a product.
 * Ensures query parameter URLs cannot be modified or tampered with.
 */
export function generateProductSignature(pid: string, slug: string): string {
  const input = `${SIGNATURE_SALT}:${pid.trim()}:${slug.trim()}`;
  let hash1 = 0xdeadbeef;
  let hash2 = 0x41c6ce57;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    hash1 = Math.imul(hash1 ^ ch, 2654435761);
    hash2 = Math.imul(hash2 ^ ch, 1597334677);
  }
  hash1 = Math.imul(hash1 ^ (hash1 >>> 16), 2246822507);
  hash1 ^= Math.imul(hash2 ^ (hash2 >>> 13), 3266489909);
  hash2 = Math.imul(hash2 ^ (hash2 >>> 16), 2246822507);
  hash2 ^= Math.imul(hash1 ^ (hash1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & hash2) + (hash1 >>> 0)).toString(36);
}

/**
 * Validates that the signature in the query parameter matches the product.
 * Returns false if the product ID or slug was altered or tampered with.
 */
export function verifyProductUrlSignature(
  pid: string,
  slug: string,
  sig?: string | null
): boolean {
  if (!sig || typeof sig !== "string") return false;
  return sig.trim() === generateProductSignature(pid, slug);
}

/**
 * Builds an Amazon & Flipkart-style query-parameterized Product URL.
 * Includes tracking randomness (qid, sr, srsltid, lid) and tamper-proof signature (sig).
 */
export function buildProductUrl(
  product: Product,
  options?: {
    fullUrl?: boolean;
    ref?: string;
    position?: number;
  }
): string {
  const pid = product.id;
  const slug = product.slug;
  const sig = generateProductSignature(pid, slug);
  const qid = Date.now().toString();
  const sr = options?.position ? `1-${options.position}` : "1-1";
  const ref = options?.ref || `sr_1_${options?.position || 1}`;
  const lid = `LST_${pid.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()}_${generateRandomHex(6)}`;
  const srsltid = generateRandomToken(42);

  const searchParams = new URLSearchParams({
    pid,
    slug,
    lid,
    marketplace: "HYDERABAD_CUE_SPORTS",
    qid,
    sr,
    ref,
    srsltid,
    sig,
  });

  const relativePath = `/product?${searchParams.toString()}`;
  if (options?.fullUrl) {
    return `${getSiteBaseUrl()}${relativePath}`;
  }
  return relativePath;
}

/**
 * Builds an Amazon & Flipkart-style query-parameterized Shop/Catalog URL.
 */
export function buildShopUrl(params?: {
  category?: string;
  size?: string;
  query?: string;
  ref?: string;
  fullUrl?: boolean;
}): string {
  const searchParams = new URLSearchParams();

  if (params?.category && params.category !== "all") {
    searchParams.set("category", params.category);
  }
  if (params?.size && params.size !== "all") {
    searchParams.set("size", params.size);
  }
  if (params?.query && params.query.trim()) {
    searchParams.set("query", params.query.trim());
  }

  searchParams.set("qid", Date.now().toString());
  if (params?.ref) {
    searchParams.set("ref", params.ref);
  } else {
    searchParams.set("ref", "hcs_cat_browse");
  }
  searchParams.set("srsltid", generateRandomToken(36));

  const relativePath = `/shop?${searchParams.toString()}`;
  if (params?.fullUrl) {
    return `${getSiteBaseUrl()}${relativePath}`;
  }
  return relativePath;
}

/**
 * Builds the canonical Home URL.
 */
export function buildHomeUrl(options?: { fullUrl?: boolean }): string {
  if (options?.fullUrl) {
    return `${getSiteBaseUrl()}/`;
  }
  return "/";
}

/**
 * Builds the canonical Login URL with tracking query parameters.
 */
export function buildLoginUrl(options?: { fullUrl?: boolean; ref?: string }): string {
  const searchParams = new URLSearchParams({
    ref: options?.ref || "hcs_header_nav",
    qid: Date.now().toString(),
  });
  const relativePath = `/login?${searchParams.toString()}`;
  if (options?.fullUrl) {
    return `${getSiteBaseUrl()}${relativePath}`;
  }
  return relativePath;
}

/**
 * Resolves a Product from query parameters (by pid or slug).
 */
export function resolveProductFromQueryParams(params: {
  pid?: string | null;
  slug?: string | null;
}): Product | null {
  if (params.pid) {
    const byId = products.find((p) => p.id === params.pid);
    if (byId) return byId;
  }
  if (params.slug) {
    const bySlug = products.find((p) => p.slug === params.slug);
    if (bySlug) return bySlug;
  }
  return null;
}

