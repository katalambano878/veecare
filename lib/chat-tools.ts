/**
 * Chat assistant tool implementations for the Vee-Care Hera storefront.
 *
 * Each exported function corresponds to one "function-calling" tool the LLM
 * (Groq Llama) can invoke from /api/chat. They all run server-side and
 * query Supabase directly using the schema in
 * supabase/migrations/*_complete_schema.sql.
 *
 * Schema notes (different from generic e-commerce):
 *   - orders.email            (no separate guest_email column)
 *   - orders.total            (no grand_total alias)
 *   - coupons.code/type/value (the "discounts" table does not exist here)
 *   - order_items.product_name (not name_snapshot)
 *   - order_items.unit_price, .total_price (not line_total)
 *
 * Payments use Hubtel (default) or Moolre via /api/payment/* routes.
 */

import { supabaseAdmin } from './supabase-admin';
import { initiateHubtelCheckout, isHubtelConfigured } from './payments/hubtel';
import {
    BRAND_NAME,
    TAGLINE,
    SUPPORT_EMAIL,
    CONTACT_PHONE_DISPLAY,
    CONTACT_PHONE,
    WHATSAPP_LINK,
    DELIVERY_DAYS_DISPLAY,
    NO_PICKUP_NOTICE,
    REFUND_POLICY,
} from './brand';

// ─── Types ──────────────────────────────────────────────────────────────────

export type ChatProduct = {
    id: string;
    name: string;
    slug: string;
    price: number;
    image: string;
    quantity: number;
    maxStock: number;
    moq: number;
    inStock: boolean;
};

export type ChatOrder = {
    id: string;
    order_number: string;
    status: string;
    payment_status: string;
    total: number;
    created_at: string;
    tracking_number?: string;
    items: { name: string; quantity: number; price: number }[];
};

export type ChatCoupon = {
    valid: boolean;
    code: string;
    reason?: string;
    type?: string;
    value?: number;
    minimum_purchase?: number;
    maximum_discount?: number;
    expires?: string;
};

export type ChatTicket = {
    id: string;
    ticket_number: number;
    status: string;
    subject: string;
};

export type ChatReturn = {
    id: string;
    status: string;
    order_number: string;
    reason: string;
};

export type ChatCustomerProfile = {
    name: string;
    email: string;
    total_orders: number;
    total_spent: number;
    last_order_at: string | null;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const PRODUCT_SELECT = `
  id, name, slug, status, description, price, compare_at_price, quantity, moq,
  product_variants(id, name, price, compare_at_price, quantity),
  product_images(url, position)
`;

// ─── String helpers (search-term normalization) ───────────────────────────

function uniqueStrings(arr: string[]): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const s of arr) {
        const norm = s.trim().toLowerCase();
        if (!norm || seen.has(norm)) continue;
        seen.add(norm);
        out.push(norm);
    }
    return out;
}

/**
 * Given a list of words, return them plus simple singular/plural variants so
 * "cars" → ["cars","car"] and "boxes" → ["boxes","boxe","box"].
 * Crude on purpose; covers the 95% of real-world product searches.
 */
function expandStems(words: string[]): string[] {
    const out: string[] = [];
    for (const raw of words) {
        const w = raw.toLowerCase().trim();
        if (w.length < 3) continue;
        out.push(w);
        if (w.endsWith('ies') && w.length > 4) out.push(w.slice(0, -3) + 'y');
        else if (w.endsWith('es') && w.length > 4) out.push(w.slice(0, -2));
        else if (w.endsWith('s') && w.length > 3) out.push(w.slice(0, -1));
        else out.push(w + 's');
    }
    return uniqueStrings(out);
}

// ─── 0. Get Store Categories (ground truth for the AI) ─────────────────────

export interface StoreCategory {
    id: string;
    name: string;
    slug: string;
    description: string | null;
}

export interface CatalogSummaryItem {
    name: string;
    slug: string;
    price: number;
    inStock: boolean;
    categoryName: string | null;
    categorySlug: string | null;
}

/**
 * Returns every active category currently in the database. The chat route
 * injects this list into the system prompt so the AI always grounds its
 * answers about "what do you sell?" / "do you carry X?" in the real catalog
 * rather than guessing from the brand description.
 */
export async function getStoreCategories(supabase: any): Promise<StoreCategory[]> {
    const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, description')
        .eq('status', 'active')
        .order('position', { ascending: true, nullsFirst: false })
        .order('name', { ascending: true });

    if (error) {
        console.error('[ChatTools] getStoreCategories error:', error);
        return [];
    }
    return (data || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description || null,
    }));
}

/**
 * Returns a compact summary of every active product (capped at `limit`,
 * default 60) along with its category so the AI knows the live catalog at
 * a glance. Used to ground answers about whether specific items are
 * available without triggering a full search_products tool call for every
 * yes/no question.
 */
export async function getStoreCatalogSummary(supabase: any, limit = 60): Promise<CatalogSummaryItem[]> {
    const { data, error } = await supabase
        .from('products')
        .select(`
            name, slug, price, quantity,
            category:categories (name, slug)
        `)
        .eq('status', 'active')
        .order('rating_avg', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('[ChatTools] getStoreCatalogSummary error:', error);
        return [];
    }
    return (data || []).map((p: any) => {
        const cat = Array.isArray(p.category) ? p.category[0] : p.category;
        return {
            name: p.name,
            slug: p.slug,
            price: Number(p.price) || 0,
            inStock: (p.quantity ?? 0) > 0,
            categoryName: cat?.name ?? null,
            categorySlug: cat?.slug ?? null,
        };
    });
}

/**
 * Compute the best (lowest) effective price for a product, considering its
 * variants and any compare_at_price set on the product itself.
 */
function effectivePrice(p: any): number {
    const base = Number(p?.price) || 0;
    const variants: any[] = Array.isArray(p?.product_variants) ? p.product_variants : [];
    if (variants.length === 0) {
        return base;
    }
    const variantPrices = variants
        .map((v) => Number(v?.price))
        .filter((n) => Number.isFinite(n) && n > 0);
    if (variantPrices.length === 0) return base;
    return Math.min(...variantPrices);
}

/**
 * Total purchasable stock = main product quantity + sum of variants quantity.
 * The storefront treats either side as available; we mirror that here.
 */
function totalStock(p: any): number {
    const main = Number(p?.quantity) || 0;
    const variants: any[] = Array.isArray(p?.product_variants) ? p.product_variants : [];
    const variantSum = variants.reduce((acc, v) => acc + (Number(v?.quantity) || 0), 0);
    if (variants.length === 0) return main;
    return Math.max(main, variantSum);
}

function firstImage(p: any): string {
    const imgs: any[] = Array.isArray(p?.product_images) ? p.product_images : [];
    const sorted = [...imgs].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    return sorted[0]?.url || '';
}

function mapProduct(p: any): ChatProduct {
    const stock = totalStock(p);
    const moq = Math.max(1, Number(p?.moq) || 1);
    return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: effectivePrice(p),
        image: firstImage(p),
        quantity: stock,
        maxStock: stock,
        moq,
        inStock: stock >= moq,
    };
}

// ─── 1. Search Products ─────────────────────────────────────────────────────

export async function searchProducts(supabase: any, query: string, limit = 4): Promise<ChatProduct[]> {
    const term = (query || '').trim();
    if (!term) return [];

    // 1) Exact phrase match against name / description / brand / tags
    const phraseFilter = `name.ilike.%${term}%,description.ilike.%${term}%,brand.ilike.%${term}%`;
    const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_SELECT)
        .eq('status', 'active')
        .or(phraseFilter)
        .order('rating_avg', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('[ChatTools] searchProducts error:', error);
        return [];
    }

    if (data && data.length > 0) {
        return data.map((p: any) => mapProduct(p));
    }

    // 2) Individual keywords (handles "blue silk shirt" by trying each word).
    // Also tries each word's singular/plural variants so "cars" matches a
    // product description containing "car".
    const words = expandStems(term.toLowerCase().split(/\s+/));
    for (const word of words) {
        const { data: wordData } = await supabase
            .from('products')
            .select(PRODUCT_SELECT)
            .eq('status', 'active')
            .or(`name.ilike.%${word}%,description.ilike.%${word}%,brand.ilike.%${word}%`)
            .order('rating_avg', { ascending: false })
            .limit(limit);
        if (wordData && wordData.length > 0) {
            return wordData.map((p: any) => mapProduct(p));
        }
    }

    // 3) Category name match (e.g. "bags", "fashion", "car", "cars"). Try the
    // term as-is first, then the singular form, then each individual word
    // (also stemmed). This means "do you sell cars" → "cars" → "car" → match
    // against "Imported Car Deals".
    const candidates = uniqueStrings([
        term,
        term.replace(/s$/i, ''),
        ...term.split(/\s+/).filter((w) => w.length >= 3),
        ...term.split(/\s+/).map((w) => w.replace(/s$/i, '')).filter((w) => w.length >= 3),
    ]);

    for (const candidate of candidates) {
        const { data: catMatch } = await supabase
            .from('categories')
            .select('id')
            .eq('status', 'active')
            .ilike('name', `%${candidate}%`)
            .limit(1);

        if (catMatch && catMatch.length > 0) {
            const { data: catProducts } = await supabase
                .from('products')
                .select(PRODUCT_SELECT)
                .eq('status', 'active')
                .eq('category_id', catMatch[0].id)
                .order('rating_avg', { ascending: false })
                .limit(limit);
            if (catProducts && catProducts.length > 0) {
                return catProducts.map((p: any) => mapProduct(p));
            }
        }
    }

    return [];
}

// ─── 2. Get Product for Cart ────────────────────────────────────────────────

export async function getProductForCart(supabase: any, slugOrId: string): Promise<ChatProduct | null> {
    if (!slugOrId?.trim()) return null;
    const trimmed = slugOrId.trim();
    const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed);

    const q = supabase.from('products').select(PRODUCT_SELECT).eq('status', 'active');
    const { data, error } = isId
        ? await q.eq('id', trimmed).maybeSingle()
        : await q.eq('slug', trimmed).maybeSingle();
    if (error || !data) return null;
    return mapProduct(data);
}

export type CartAddResult = {
    success: boolean;
    product?: ChatProduct;
    quantity: number;
    message: string;
};

/** Resolve a product query and validate quantity for chat add-to-cart. */
export async function resolveAddToCart(
    supabase: any,
    query: string,
    requestedQty = 1,
): Promise<CartAddResult> {
    const maxQty = 10;
    const qty = Math.max(1, Math.min(maxQty, Math.floor(requestedQty) || 1));
    const trimmed = (query || '').trim();

    if (!trimmed) {
        return { success: false, quantity: qty, message: 'Please tell me which product to add.' };
    }

    let product = await getProductForCart(supabase, trimmed);
    if (!product) {
        const results = await searchProducts(supabase, trimmed, 3);
        if (results.length === 1) {
            product = results[0];
        } else if (results.length > 1) {
            const exact = results.find(
                (p) =>
                    p.name.toLowerCase() === trimmed.toLowerCase() ||
                    p.slug.toLowerCase() === trimmed.toLowerCase(),
            );
            product = exact || results[0];
        }
    }

    if (!product) {
        return {
            success: false,
            quantity: qty,
            message: `I couldn't find "${trimmed}". Try the exact product name or browse /shop.`,
        };
    }

    if (!product.inStock) {
        return {
            success: false,
            product,
            quantity: qty,
            message: `Sorry, "${product.name}" is currently out of stock.`,
        };
    }

    const addQty = Math.max(product.moq, qty);
    if (addQty > product.maxStock) {
        return {
            success: false,
            product,
            quantity: addQty,
            message: `Only ${product.maxStock} unit${product.maxStock === 1 ? '' : 's'} of "${product.name}" are available.`,
        };
    }

    return {
        success: true,
        product,
        quantity: addQty,
        message: `Added ${addQty} × ${product.name} (GH₵${(product.price * addQty).toFixed(2)}) to your cart.`,
    };
}

// ─── 3. Track Order ─────────────────────────────────────────────────────────

export async function trackOrder(supabase: any, orderNumber: string, email: string): Promise<ChatOrder | null> {
    if (!orderNumber?.trim() || !email?.trim()) return null;
    const num = orderNumber.trim();
    const emailLower = email.trim().toLowerCase();

    const select = `
    id, order_number, status, payment_status, total, created_at, email, user_id,
    metadata,
    order_items(product_name, quantity, unit_price, total_price)
  `;

    let { data: row, error } = await supabase
        .from('orders')
        .select(select)
        .eq('order_number', num)
        .maybeSingle();

    if (!row && /^[0-9a-f-]{36}$/i.test(num)) {
        const r2 = await supabase.from('orders').select(select).eq('id', num).maybeSingle();
        row = r2.data;
        error = r2.error;
    }

    if (error || !row) return null;

    // SECURITY: always verify the requester knows the order's email.
    const orderEmail = (row.email || '').toLowerCase();
    let emailMatches = !!orderEmail && orderEmail === emailLower;

    if (!emailMatches && row.user_id) {
        // For logged-in customers the email column may differ from the profile
        // email. Fall back to the profile.
        const { data: ownerProfile } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', row.user_id)
            .maybeSingle();
        const ownerEmail = (ownerProfile?.email || '').toLowerCase();
        emailMatches = !!ownerEmail && ownerEmail === emailLower;
    }

    if (!emailMatches) return null;

    return {
        id: row.id,
        order_number: row.order_number,
        status: row.status,
        payment_status: row.payment_status || 'pending',
        total: Number(row.total) || 0,
        created_at: row.created_at,
        tracking_number: (row.metadata as any)?.tracking_number || undefined,
        items: (row.order_items || []).map((i: any) => ({
            name: i.product_name || 'Item',
            quantity: i.quantity,
            price: Number(i.unit_price) || 0,
        })),
    };
}

// ─── 4. Get Customer Orders ─────────────────────────────────────────────────

export async function getCustomerOrders(supabase: any, userId: string, limit = 5): Promise<ChatOrder[]> {
    if (!userId) return [];

    const { data, error } = await supabase
        .from('orders')
        .select(
            `
      id, order_number, status, payment_status, total, created_at,
      order_items(product_name, quantity, unit_price, total_price)
    `,
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error || !data) return [];

    return data.map((o: any) => ({
        id: o.id,
        order_number: o.order_number,
        status: o.status,
        payment_status: o.payment_status || 'pending',
        total: Number(o.total) || 0,
        created_at: o.created_at,
        tracking_number: undefined,
        items: (o.order_items || []).map((i: any) => ({
            name: i.product_name || 'Item',
            quantity: i.quantity,
            price: Number(i.unit_price) || 0,
        })),
    }));
}

// ─── 5. Check Coupon ────────────────────────────────────────────────────────

export async function checkCoupon(supabase: any, code: string, cartTotal?: number): Promise<ChatCoupon> {
    const trimmed = (code || '').trim().toUpperCase();
    if (!trimmed) return { valid: false, code: trimmed, reason: 'No code provided.' };

    const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .ilike('code', trimmed)
        .maybeSingle();
    if (error || !data) {
        return { valid: false, code: trimmed, reason: 'This coupon code does not exist.' };
    }

    const isActive = data.is_active !== false;
    const now = new Date();
    const start = data.start_date ? new Date(data.start_date) : null;
    const end = data.end_date ? new Date(data.end_date) : null;
    const usageLimit = data.usage_limit;
    const usageCount = Number(data.usage_count ?? 0);

    const minPurchase = Number(data.minimum_purchase ?? 0) || 0;
    const maxDisc = data.maximum_discount != null ? Number(data.maximum_discount) : undefined;
    // upscalevintage uses an enum: 'percentage' | 'fixed_amount' | 'free_shipping'.
    // Normalize so the UI can render a single label.
    const rawType = data.type as string;
    const type =
        rawType === 'percentage'
            ? 'percentage'
            : rawType === 'fixed_amount'
              ? 'fixed'
              : rawType === 'free_shipping'
                ? 'free_shipping'
                : rawType || 'percentage';
    const value = Number(data.value ?? 0);

    if (!isActive) return { valid: false, code: trimmed, reason: 'This coupon is no longer active.' };
    if (start && start > now) return { valid: false, code: trimmed, reason: 'This coupon is not yet valid.' };
    if (end && end < now) return { valid: false, code: trimmed, reason: 'This coupon has expired.' };
    if (usageLimit != null && usageCount >= Number(usageLimit)) {
        return { valid: false, code: trimmed, reason: 'This coupon has reached its usage limit.' };
    }
    if (cartTotal !== undefined && minPurchase > 0 && cartTotal < minPurchase) {
        return {
            valid: false,
            code: trimmed,
            reason: `Minimum purchase of GH₵${minPurchase.toFixed(2)} required.`,
        };
    }

    return {
        valid: true,
        code: trimmed,
        type,
        value,
        minimum_purchase: minPurchase || undefined,
        maximum_discount: maxDisc,
        expires: data.end_date || undefined,
    };
}

// ─── 6. Create Support Ticket ───────────────────────────────────────────────

export async function createSupportTicket(
    supabase: any,
    params: { userId?: string; email: string; subject: string; description: string; category?: string },
): Promise<ChatTicket | null> {
    const { userId, email, subject, description, category } = params;
    if (!email || !subject || !description) return null;

    try {
        const { data: ticket, error } = await supabase
            .from('support_tickets')
            .insert({
                user_id: userId || null,
                email,
                subject,
                description,
                category: category || 'other',
                status: 'open',
                priority: 'medium',
            })
            .select('id, ticket_number, status, subject')
            .single();

        if (error || !ticket) {
            console.error('[ChatTools] createSupportTicket error:', error);
            return null;
        }

        // Best-effort initial message — table exists in schema but RLS may block
        // anon inserts. Failure here doesn't block ticket creation.
        try {
            await supabase.from('support_messages').insert({
                ticket_id: ticket.id,
                user_id: userId || null,
                message: description,
                is_internal: false,
            });
        } catch {
            /* ignore */
        }

        return {
            id: ticket.id,
            ticket_number: ticket.ticket_number,
            status: ticket.status,
            subject: ticket.subject,
        };
    } catch (e) {
        console.error('[ChatTools] createSupportTicket:', e);
        return null;
    }
}

// ─── 7. Initiate Return ─────────────────────────────────────────────────────

export async function initiateReturn(
    supabase: any,
    params: { userId: string; orderId: string; reason: string; description: string },
): Promise<ChatReturn | null> {
    const { userId, orderId, reason, description } = params;
    if (!userId || !orderId) return null;

    try {
        const { data: order } = await supabase
            .from('orders')
            .select('id, order_number, status, created_at, user_id')
            .eq('id', orderId)
            .maybeSingle();

        if (!order || order.user_id !== userId || order.status !== 'delivered') return null;

        const deliveredDate = new Date(order.created_at);
        const daysSince = (Date.now() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince > 30) return null;

        const { data: ret, error } = await supabase
            .from('return_requests')
            .insert({
                order_id: orderId,
                user_id: userId,
                reason,
                description,
                status: 'pending',
            })
            .select('id, status')
            .single();

        if (error || !ret) {
            console.error('[ChatTools] initiateReturn error:', error);
            return null;
        }

        return { id: ret.id, status: ret.status, order_number: order.order_number, reason };
    } catch (e) {
        console.error('[ChatTools] initiateReturn:', e);
        return null;
    }
}

// ─── 8. Get Recommendations ─────────────────────────────────────────────────

export async function getRecommendations(supabase: any, context?: string): Promise<ChatProduct[]> {
    let q = supabase.from('products').select(PRODUCT_SELECT).eq('status', 'active');
    if (context?.trim()) {
        q = q.or(`name.ilike.%${context.trim()}%,description.ilike.%${context.trim()}%`);
    }
    const { data, error } = await q
        .order('featured', { ascending: false })
        .order('rating_avg', { ascending: false })
        .order('review_count', { ascending: false })
        .limit(8);

    if (error || !data) return [];
    const mapped = data.map((p: any) => mapProduct(p)).filter((p: ChatProduct) => p.inStock);
    return mapped.slice(0, 4);
}

// ─── 9. Get Store Info ──────────────────────────────────────────────────────

const STORE_INFO: Record<string, string> = {
    shipping: `${NO_PICKUP_NOTICE} We deliver nationwide on ${DELIVERY_DAYS_DISPLAY}. Delivery cost depends on your location and is confirmed after checkout. Visit /shipping for the full policy.`,
    returns: `${REFUND_POLICY.intro} No refunds on opened or used products (hygiene). Damaged/defective items: notify us within 24 hours with photos. See /returns for the full policy.`,
    payment: `We accept secure Mobile Money checkout via Moolre (GHS). Guest checkout is supported. We do not accept payment on delivery.`,
    contact: `Reach ${BRAND_NAME}:\n- Email: ${SUPPORT_EMAIL}\n- Phone: ${CONTACT_PHONE_DISPLAY} (+233${CONTACT_PHONE.replace(/^0/, '')})\n- WhatsApp: ${WHATSAPP_LINK}`,
    about: `${BRAND_NAME} — ${TAGLINE} Plant-based feminine care, yoni wellness, and herbal hygiene essentials for women in Ghana.`,
    delivery_times: `Orders ship on ${DELIVERY_DAYS_DISPLAY} after payment is confirmed. Delivery cost is shared with you before dispatch.`,
    hours: `Shop online anytime. For fastest help, use this chat or WhatsApp ${WHATSAPP_LINK}.`,
};

export function getStoreInfo(topic: string): string {
    const key = (topic || '').toLowerCase().replace(/[^a-z_]/g, '');
    const match = Object.keys(STORE_INFO).find((k) => key.includes(k));
    if (match) return STORE_INFO[match];
    return Object.values(STORE_INFO).join('\n\n');
}

// ─── 10. Get Customer Profile ───────────────────────────────────────────────

export async function getCustomerProfile(supabase: any, userId: string): Promise<ChatCustomerProfile | null> {
    if (!userId) return null;

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', userId)
        .maybeSingle();
    if (!profile) return null;

    const { data: orders } = await supabase
        .from('orders')
        .select('total, created_at, payment_status')
        .eq('user_id', userId);

    let totalSpent = 0;
    let orderCount = 0;
    let lastAt: string | null = null;
    for (const o of orders || []) {
        if (o.payment_status === 'paid') {
            totalSpent += Number(o.total) || 0;
            orderCount++;
            if (!lastAt || o.created_at > lastAt) lastAt = o.created_at;
        }
    }

    return {
        name: profile.full_name || profile.email?.split('@')[0] || 'Customer',
        email: profile.email || '',
        total_orders: orderCount,
        total_spent: totalSpent,
        last_order_at: lastAt,
    };
}

// ─── 11. Create Order from Chat ─────────────────────────────────────────────

export type ChatOrderResult = {
    success: boolean;
    orderNumber?: string;
    total?: number;
    paymentUrl?: string;
    message: string;
};

interface ChatOrderItem {
    productId: string;
    quantity: number;
}

interface ChatShippingInfo {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    region: string;
}

const DELIVERY_COSTS: Record<string, number> = {
    standard: 20,
    express: 40,
    pickup: 0,
};

const MAX_ITEMS_PER_ORDER = 20;
const MAX_QUANTITY_PER_ITEM = 10;
const MAX_FIELD_LENGTH = 200;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+\-() ]{7,20}$/;

const orderRateMap = new Map<string, { count: number; resetAt: number }>();
const ORDER_RATE_LIMIT = 3;
const ORDER_RATE_WINDOW_MS = 300_000;

function checkOrderRateLimit(key: string): boolean {
    const now = Date.now();
    const entry = orderRateMap.get(key);
    if (!entry || now > entry.resetAt) {
        orderRateMap.set(key, { count: 1, resetAt: now + ORDER_RATE_WINDOW_MS });
        return true;
    }
    if (entry.count >= ORDER_RATE_LIMIT) return false;
    entry.count++;
    return true;
}

function sanitize(input: string): string {
    return input
        .replace(/[<>]/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '')
        .trim()
        .slice(0, MAX_FIELD_LENGTH);
}

function generateOrderNumber(): string {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `ORD-${ts}-${rand}`;
}

export async function createChatOrder(
    supabaseFallback: any,
    params: {
        items: ChatOrderItem[];
        shipping: ChatShippingInfo;
        deliveryMethod: string;
        paymentMethod: string;
        userId?: string | null;
    },
): Promise<ChatOrderResult> {
    // Use service-role client so we can write to orders/order_items/payments
    // regardless of the (possibly anon) chat caller's RLS.
    let admin: any = supabaseFallback;
    try {
        admin = supabaseAdmin;
    } catch {
        admin = supabaseFallback;
    }

    const { items, shipping, deliveryMethod, paymentMethod, userId } = params;

    if (!items?.length) {
        return { success: false, message: 'No items provided. Please add products to your cart first.' };
    }
    if (items.length > MAX_ITEMS_PER_ORDER) {
        return { success: false, message: `Too many items. Maximum ${MAX_ITEMS_PER_ORDER} items per order.` };
    }
    if (
        !shipping.firstName ||
        !shipping.lastName ||
        !shipping.email ||
        !shipping.phone ||
        !shipping.address ||
        !shipping.city ||
        !shipping.region
    ) {
        return {
            success: false,
            message:
                'Missing shipping information. Please provide first name, last name, email, phone, address, city, and region.',
        };
    }
    if (!EMAIL_RE.test(shipping.email)) return { success: false, message: 'Please provide a valid email address.' };
    if (!PHONE_RE.test(shipping.phone)) return { success: false, message: 'Please provide a valid phone number.' };

    for (const item of items) {
        if (!UUID_RE.test(item.productId)) {
            return { success: false, message: 'Invalid product reference. Please try again.' };
        }
        if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_QUANTITY_PER_ITEM) {
            return { success: false, message: `Invalid quantity. Must be between 1 and ${MAX_QUANTITY_PER_ITEM}.` };
        }
    }

    if (!['standard', 'express', 'pickup'].includes(deliveryMethod)) {
        return { success: false, message: 'Invalid delivery method.' };
    }
    if (!['hubtel', 'moolre', 'cod'].includes(paymentMethod)) {
        return { success: false, message: 'Invalid payment method. Use Hubtel, Moolre Mobile Money, or Cash on Delivery.' };
    }

    const rateLimitKey = shipping.email.toLowerCase().trim();
    if (!checkOrderRateLimit(rateLimitKey)) {
        return { success: false, message: 'Too many orders placed recently. Please wait a few minutes before trying again.' };
    }

    const sanitizedShipping: ChatShippingInfo = {
        firstName: sanitize(shipping.firstName),
        lastName: sanitize(shipping.lastName),
        email: shipping.email.toLowerCase().trim().slice(0, MAX_FIELD_LENGTH),
        phone: shipping.phone.replace(/[^0-9+\-() ]/g, '').slice(0, 20),
        address: sanitize(shipping.address),
        city: sanitize(shipping.city),
        region: sanitize(shipping.region),
    };

    const shippingCost = DELIVERY_COSTS[deliveryMethod];

    try {
        const productIds = items.map((i) => i.productId);
        const { data: products, error: prodError } = await admin
            .from('products')
            .select(PRODUCT_SELECT)
            .in('id', productIds)
            .eq('status', 'active');

        if (prodError || !products?.length) {
            return { success: false, message: 'Could not find the requested products. They may no longer be available.' };
        }

        const productMap = new Map<string, any>(products.map((p: any) => [p.id, p]));

        for (const item of items) {
            const p = productMap.get(item.productId);
            if (!p) return { success: false, message: `Product not found: ${item.productId}` };
            const stock = totalStock(p);
            if (stock < item.quantity) {
                return {
                    success: false,
                    message: `Sorry, "${p.name}" only has ${stock} units in stock, but you requested ${item.quantity}.`,
                };
            }
        }

        let subtotal = 0;
        const lineDetails: { product: any; variant: any | null; qty: number; unit: number }[] = [];

        for (const item of items) {
            const p = productMap.get(item.productId)!;
            const variants: any[] = Array.isArray(p.product_variants) ? p.product_variants : [];
            // Pick the cheapest variant by default, mirroring the storefront's
            // "default option" UX. Falls back to the product price.
            const sortedVars = [...variants].sort((a: any, b: any) => Number(a.price) - Number(b.price));
            const v = sortedVars[0] || null;
            const unit = v ? Number(v.price) : Number(p.price);
            if (!Number.isFinite(unit) || unit <= 0) {
                return { success: false, message: `Product "${p.name}" has no valid price.` };
            }
            subtotal += unit * item.quantity;
            lineDetails.push({ product: p, variant: v, qty: item.quantity, unit });
        }

        const total = subtotal + shippingCost;
        const orderNumber = generateOrderNumber();

        const shippingAddress = {
            firstName: sanitizedShipping.firstName,
            lastName: sanitizedShipping.lastName,
            fullName: `${sanitizedShipping.firstName} ${sanitizedShipping.lastName}`.trim(),
            address1: sanitizedShipping.address,
            address2: '',
            city: sanitizedShipping.city,
            state: sanitizedShipping.region,
            region: sanitizedShipping.region,
            country: 'Ghana',
            postalCode: '',
            phone: sanitizedShipping.phone,
            email: sanitizedShipping.email,
        };

        const { data: order, error: orderError } = await admin
            .from('orders')
            .insert({
                order_number: orderNumber,
                user_id: userId || null,
                email: sanitizedShipping.email,
                phone: sanitizedShipping.phone,
                status: 'pending',
                payment_status: 'pending',
                currency: 'GHS',
                subtotal,
                tax_total: 0,
                shipping_total: shippingCost,
                discount_total: 0,
                total,
                shipping_method: deliveryMethod,
                payment_method: paymentMethod,
                payment_provider: paymentMethod === 'cod' ? null : paymentMethod,
                shipping_address: shippingAddress,
                billing_address: shippingAddress,
                notes: `Chat checkout — delivery: ${deliveryMethod}, pay: ${paymentMethod}`,
            })
            .select('id')
            .single();

        if (orderError || !order) {
            console.error('[ChatTools] createChatOrder order insert:', orderError);
            return { success: false, message: 'Failed to create order. Please try checkout on the website.' };
        }

        const orderItems = lineDetails.map((row) => ({
            order_id: order.id,
            product_id: row.product.id,
            variant_id: row.variant?.id || null,
            product_name: row.product.name,
            variant_name: row.variant?.name || null,
            sku: row.variant?.sku || null,
            unit_price: row.unit,
            quantity: row.qty,
            total_price: row.unit * row.qty,
        }));

        const { error: itemsError } = await admin.from('order_items').insert(orderItems);
        if (itemsError) {
            console.error('[ChatTools] order_items:', itemsError);
            return { success: false, message: 'Failed to add items to order. Please try again.' };
        }

        if (paymentMethod === 'cod') {
            return {
                success: true,
                orderNumber,
                total,
                message: `Order ${orderNumber} placed! Total GH₵${total.toFixed(2)} (incl. GH₵${shippingCost.toFixed(2)} delivery). Cash on delivery — our team will confirm.`,
            };
        }

        const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
        const customerName = `${sanitizedShipping.firstName} ${sanitizedShipping.lastName}`.trim();

        try {
            if (paymentMethod === 'hubtel') {
                if (!isHubtelConfigured()) {
                    return {
                        success: true,
                        orderNumber,
                        total,
                        message: `Order ${orderNumber} created (GH₵${total.toFixed(2)}), but Hubtel is not configured. Please complete checkout from the cart page or contact ${SUPPORT_EMAIL}.`,
                    };
                }

                const hubtelResult = await initiateHubtelCheckout({
                    orderRef: orderNumber,
                    amount: total,
                    customerName,
                    customerEmail: sanitizedShipping.email,
                    customerPhone: sanitizedShipping.phone,
                    baseUrl,
                });

                if (hubtelResult.success && hubtelResult.checkoutUrl) {
                    await admin
                        .from('orders')
                        .update({
                            metadata: {
                                payment_method: 'hubtel',
                                payment_provider: 'hubtel',
                                hubtel_client_reference: hubtelResult.clientReference,
                            },
                        })
                        .eq('id', order.id);

                    return {
                        success: true,
                        orderNumber,
                        total,
                        paymentUrl: hubtelResult.checkoutUrl,
                        message: `Order ${orderNumber} is ready. Total GH₵${total.toFixed(2)} (incl. GH₵${shippingCost.toFixed(2)} delivery). Complete payment with the secure Hubtel link below (Mobile Money, card & more).`,
                    };
                }

                return {
                    success: true,
                    orderNumber,
                    total,
                    message: `Order ${orderNumber} created (GH₵${total.toFixed(2)}), but we could not open Hubtel checkout. Try paying from your cart or contact ${SUPPORT_EMAIL}.`,
                };
            }

            // Moolre Mobile Money flow
            const moolreApiUser = process.env.MOOLRE_API_USER;
            const moolreApiPubkey = process.env.MOOLRE_API_PUBKEY;
            const moolreAccountNumber = process.env.MOOLRE_ACCOUNT_NUMBER;

            if (!moolreApiUser || !moolreApiPubkey || !moolreAccountNumber) {
                return {
                    success: true,
                    orderNumber,
                    total,
                    message: `Order ${orderNumber} created (GH₵${total.toFixed(2)}), but Moolre is not configured. Please complete checkout from the cart page or contact ${SUPPORT_EMAIL}.`,
                };
            }

            const uniqueRef = `${orderNumber}-R${Date.now()}`;
            const payload: Record<string, unknown> = {
                type: 1,
                amount: total.toString(),
                email: process.env.MOOLRE_MERCHANT_EMAIL || sanitizedShipping.email,
                externalref: uniqueRef,
                callback: `${baseUrl}/api/payment/moolre/callback`,
                redirect: `${baseUrl}/order-success?order=${encodeURIComponent(orderNumber)}&payment_success=true`,
                reusable: '0',
                currency: 'GHS',
                accountnumber: moolreAccountNumber,
                metadata: {
                    customer_email: sanitizedShipping.email,
                    original_order_number: orderNumber,
                },
            };
            if (process.env.MOOLRE_CALLBACK_SECRET) {
                payload.secret = process.env.MOOLRE_CALLBACK_SECRET;
            }

            const response = await fetch('https://api.moolre.com/embed/link', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-USER': moolreApiUser,
                    'X-API-PUBKEY': moolreApiPubkey,
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (result.status === 1 && result.data?.authorization_url) {
                return {
                    success: true,
                    orderNumber,
                    total,
                    paymentUrl: result.data.authorization_url,
                    message: `Order ${orderNumber} is ready. Total GH₵${total.toFixed(2)} (incl. GH₵${shippingCost.toFixed(2)} delivery). Complete Mobile Money payment with the secure Moolre link below.`,
                };
            }

            return {
                success: true,
                orderNumber,
                total,
                message: `Order ${orderNumber} created (GH₵${total.toFixed(2)}), but we could not open Moolre. Try paying from your cart or contact ${SUPPORT_EMAIL}.`,
            };
        } catch (payErr: unknown) {
            console.error('[ChatTools] Payment error:', payErr);
            return {
                success: true,
                orderNumber,
                total,
                message: `Order ${orderNumber} created (GH₵${total.toFixed(2)}), but the payment link failed. Use checkout on the site.`,
            };
        }
    } catch (err: any) {
        console.error('[ChatTools] createChatOrder:', err);
        return { success: false, message: 'Something went wrong. Please use the checkout page on the website.' };
    }
}

// Exported so the rule-based fallback in the chat route can reuse it
export { BRAND_NAME, TAGLINE, SUPPORT_EMAIL, CONTACT_PHONE_DISPLAY, WHATSAPP_LINK };
