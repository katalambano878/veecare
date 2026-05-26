/** Server-side cache for storefront API routes (cleared after admin saves). */

let categoriesCache: { data: unknown; timestamp: number } | null = null;
let productsCache: { data: Record<string, unknown>; timestamp: number } | null = null;

export const CATEGORIES_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
export const PRODUCTS_CACHE_TTL = 5 * 60 * 1000;

export function getCategoriesCache() {
  return categoriesCache;
}

export function setCategoriesCache(data: unknown) {
  categoriesCache = { data, timestamp: Date.now() };
}

export function getProductsCache() {
  return productsCache;
}

export function setProductsCacheEntry(key: string, data: unknown) {
  if (!productsCache) {
    productsCache = { data: {}, timestamp: Date.now() };
  }
  productsCache.data[key] = data;
  productsCache.timestamp = Date.now();
}

export function clearStorefrontCache() {
  categoriesCache = null;
  productsCache = null;
}
