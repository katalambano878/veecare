/**
 * In-memory site knowledge for the AI chat assistant (Vee-Care Hera storefront).
 *
 * Consulted by the AI assistant before answering questions about the
 * brand, policies, navigation, etc. so it can give accurate, on-site answers
 * without needing a database round-trip.
 */

import {
    BRAND_NAME,
    TAGLINE,
    SUPPORT_EMAIL,
    CONTACT_PHONE_DISPLAY,
    CONTACT_PHONE,
    WHATSAPP_LINK,
    INSTAGRAM_URL,
    TIKTOK_URL,
    SNAPCHAT_URL,
    CONTACT_ADDRESS,
    DELIVERY_DAYS_DISPLAY,
    NO_PICKUP_NOTICE,
    REFUND_POLICY,
} from './brand';

export interface SiteKnowledgeEntry {
    id: string;
    title: string;
    path: string;
    category: string;
    content: string;
    keywords: string[];
}

export const SITE_KNOWLEDGE: SiteKnowledgeEntry[] = [
    {
        id: 'about-brand',
        title: `About ${BRAND_NAME}`,
        path: '/about',
        category: 'company',
        content: `${BRAND_NAME} — ${TAGLINE} Based in Accra, Ghana with nationwide delivery. We offer plant-based feminine care, yoni wellness, and a supportive community for women. The exact list of categories we carry is fetched live from the database and provided to the assistant in the OUR CATEGORIES section.`,
        keywords: ['about', 'who', 'brand', 'mission', 'company', 'vee care', 'hera', 'feminine', 'wellness', 'yoni'],
    },
    {
        id: 'contact',
        title: 'Contact us',
        path: '/contact',
        category: 'contact',
        content: `Email: ${SUPPORT_EMAIL}. Phone: ${CONTACT_PHONE_DISPLAY} (+233${CONTACT_PHONE.replace(/^0/, '')}). WhatsApp: ${WHATSAPP_LINK}. Instagram: ${INSTAGRAM_URL}. TikTok: ${TIKTOK_URL}. Snapchat: ${SNAPCHAT_URL}. ${CONTACT_ADDRESS}.`,
        keywords: ['contact', 'phone', 'email', 'whatsapp', 'call', 'reach', 'support', 'address', 'location', 'instagram', 'tiktok'],
    },
    {
        id: 'shipping',
        title: 'Shipping & Delivery',
        path: '/shipping',
        category: 'shipping',
        content: `${NO_PICKUP_NOTICE} We deliver nationwide across Ghana on ${DELIVERY_DAYS_DISPLAY}. Delivery cost depends on your location and is confirmed with you after checkout, before dispatch. Orders are packed discreetly.`,
        keywords: ['shipping', 'delivery', 'how long', 'dispatch', 'track package', 'send', 'region', 'tuesday', 'thursday', 'saturday', 'pickup', 'walk-in'],
    },
    {
        id: 'returns',
        title: 'Returns & Refunds',
        path: '/returns',
        category: 'returns',
        content: `${REFUND_POLICY.intro} ${REFUND_POLICY.sections.map((s) => `${s.title}: ${s.body}`).join(' ')} Contact: ${REFUND_POLICY.contactCta}`,
        keywords: ['return', 'refund', 'exchange', 'wrong item', 'damaged', 'defective', 'policy', 'opened', 'used', 'hygiene'],
    },
    {
        id: 'payment',
        title: 'Payment Methods',
        path: '/checkout',
        category: 'payment',
        content: 'Checkout uses Hubtel for secure payments in Ghana Cedis (GHS) — Mobile Money (MTN, Vodafone, AirtelTigo), bank cards, and more. Moolre Mobile Money is also supported. You can also add to cart, checkout, and pay via the AI chat assistant on the site. Guest checkout is available — no account needed. We do not accept payment on delivery.',
        keywords: ['pay', 'payment', 'card', 'momo', 'mobile money', 'hubtel', 'moolre', 'guest checkout', 'how to pay', 'chat checkout', 'add to cart', 'cod', 'cash on delivery'],
    },
    {
        id: 'shop',
        title: 'Shop / Browse products',
        path: '/shop',
        category: 'shopping',
        content: 'Browse all products at /shop with filters by category, price, and more. Product detail pages live at /product/[slug]. Use the search bar in the header for fast lookup.',
        keywords: ['shop', 'browse', 'buy', 'products', 'catalog', 'search', 'filter', 'feminine', 'wash', 'hygiene', 'wellness'],
    },
    {
        id: 'categories',
        title: 'Categories',
        path: '/categories',
        category: 'shopping',
        content: 'Browse all categories at /categories. The current list of categories is provided to the assistant separately in the live OUR CATEGORIES section of the system prompt — never list categories from this static text; always defer to the live list.',
        keywords: ['category', 'categories', 'browse', 'sections', 'personal care', 'hygiene', 'wellness', 'self-care'],
    },
    {
        id: 'track-order',
        title: 'Track order',
        path: '/order-tracking',
        category: 'orders',
        content: 'Track orders at /order-tracking with your order number and email. Logged-in customers can also see all their orders at /account.',
        keywords: ['track', 'order status', 'where is my order', 'delivery status', 'tracking'],
    },
    {
        id: 'account',
        title: 'Account',
        path: '/account',
        category: 'account',
        content: 'Sign in at /auth/login or create a new account at /auth/signup. Manage your profile, addresses and orders at /account.',
        keywords: ['account', 'login', 'sign in', 'signup', 'register', 'password', 'profile', 'orders', 'my account'],
    },
    {
        id: 'cart-checkout',
        title: 'Cart & checkout',
        path: '/cart',
        category: 'shopping',
        content: 'Cart: /cart. Checkout: /checkout. You can also place an order directly here in the chat — just tell the assistant what you want to buy.',
        keywords: ['cart', 'checkout', 'bag', 'pay now', 'order', 'place order'],
    },
    {
        id: 'wishlist',
        title: 'Wishlist',
        path: '/wishlist',
        category: 'shopping',
        content: 'Save your favorite products to your wishlist for later. View it at /wishlist.',
        keywords: ['wishlist', 'favorites', 'saved', 'liked'],
    },
    {
        id: 'faqs',
        title: 'FAQs / Help',
        path: '/faqs',
        category: 'help',
        content: 'Common questions and answers are on /faqs. Need more help? Visit /help or /support.',
        keywords: ['faq', 'help', 'question', 'how do i', 'support', 'discreet', 'privacy'],
    },
    {
        id: 'privacy-terms',
        title: 'Privacy & Terms',
        path: '/privacy',
        category: 'legal',
        content: 'Privacy policy: /privacy. Terms of service: /terms.',
        keywords: ['privacy', 'terms', 'legal', 'data', 'policy', 'discreet'],
    },
    {
        id: 'product-focus',
        title: 'What we help with',
        path: '/shop',
        category: 'shopping',
        content: 'Vee-Care Hera focuses on plant-based feminine care: infection care, irregular menstrual flow, low libido, vaginal dryness, sweeteners, painful intimacy support, hygiene essentials, and self-care wellness products.',
        keywords: ['infection', 'menstrual', 'libido', 'dryness', 'intimacy', 'yoni', 'herbal', 'plant-based', 'feminine wash', 'menstrual cup'],
    },
];

export function searchSiteKnowledge(query: string, maxResults = 3): SiteKnowledgeEntry[] {
    const lower = (query || '').toLowerCase();
    const words = lower.split(/\s+/).filter((w) => w.length > 2);

    const scored = SITE_KNOWLEDGE.map((entry) => {
        let score = 0;
        for (const kw of entry.keywords) {
            if (lower.includes(kw)) score += 10;
            for (const word of words) {
                if (kw.includes(word) || word.includes(kw)) score += 3;
            }
        }
        if (entry.title.toLowerCase().includes(lower)) score += 15;
        for (const word of words) {
            if (entry.title.toLowerCase().includes(word)) score += 5;
        }
        const contentLower = entry.content.toLowerCase();
        for (const word of words) {
            if (contentLower.includes(word)) score += 2;
        }
        return { entry, score };
    });

    return scored
        .filter((s) => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults)
        .map((s) => s.entry);
}

export function getKnowledgeByCategory(category: string): SiteKnowledgeEntry[] {
    return SITE_KNOWLEDGE.filter((e) => e.category === category);
}

export function getSiteMapSummary(): string {
    return `WEBSITE PAGES (help customers navigate):
- / — Homepage, featured collections, wellness hero
- /shop — All products with filters
- /categories — Browse by category
- /product/[slug] — Product detail page
- /cart — Shopping cart
- /checkout — Secure Moolre Mobile Money checkout
- /order-tracking — Order tracking (order number + email)
- /order-success — Post-payment confirmation
- /account — Account, profile, orders (signed in)
- /auth/login, /auth/signup — Authentication
- /wishlist — Saved products
- /about — About ${BRAND_NAME}
- /contact — Contact form & details
- /faqs, /help, /support — Customer help
- /shipping, /returns — Delivery & refund policies
- /privacy, /terms — Legal`;
}
