import { slugify } from '@/lib/slug';

/** Default stock-keeping unit prefix — override with PRODUCT_SKU_PREFIX in env if needed. */
export const SKU_PREFIX = (process.env.PRODUCT_SKU_PREFIX || 'VEECARE').toUpperCase();

function randomSuffix(length = 4): string {
    return Math.random().toString(36).substring(2, 2 + length).toUpperCase();
}

/** Build a short code from the product name, e.g. "Herbal Yoni Wash" → "HERBALYO" */
function nameCode(productName: string): string {
    const slug = slugify(productName).replace(/-/g, '');
    if (!slug) return 'ITEM';
    return slug.slice(0, 8).toUpperCase();
}

/**
 * Generate a unique-style product SKU.
 * With a name: VEECARE-HERBALYO-A3F2
 * Without:      VEECARE-HP9W-WUQW
 */
export function generateProductSku(productName?: string): string {
    const suffix = randomSuffix(4);
    if (productName?.trim()) {
        return `${SKU_PREFIX}-${nameCode(productName)}-${suffix}`;
    }
    const ts = Date.now().toString(36).toUpperCase().slice(-4);
    return `${SKU_PREFIX}-${ts}-${suffix}`;
}

/** Variant SKU extends the parent, e.g. VEECARE-EWE-A3F2-RED-M */
export function generateVariantSku(
    parentSku: string,
    options?: { color?: string; size?: string },
): string {
    const parts: string[] = [];
    if (options?.color?.trim()) {
        parts.push(slugify(options.color).replace(/-/g, '').slice(0, 4).toUpperCase());
    }
    if (options?.size?.trim()) {
        parts.push(slugify(options.size).replace(/-/g, '').slice(0, 4).toUpperCase());
    }
    if (parts.length === 0) {
        parts.push(randomSuffix(3));
    }
    return `${parentSku}-${parts.join('-')}`;
}
