/**
 * Vee Care — feminine care & wellness (Accra, Ghana)
 * Canonical brand + SEO defaults (code-owned; not overridden by CMS).
 */
export const APP_TITLE = 'Vee Care';
export const BRAND_NAME = 'Vee Care';
export const SHORT_NAME = 'Vee Care';
export const TAGLINE = 'Feminine Care & Wellness for Every Woman';

export const BRAND_INTRO =
  'Vee Care is an online feminine care and wellness brand based in Accra, Ghana. We create a calm, supportive space for women’s personal care, hygiene, wellness, confidence, and everyday self-care.';

export const BRAND_INTRO_SECONDARY =
  'Designed to support your comfort, confidence, and everyday wellness — shop online or connect with us on Instagram, TikTok, and Snapchat.';

/** Production URL — set NEXT_PUBLIC_APP_URL in .env.local */
export const SITE_URL_DEFAULT = 'https://veecarehera.com';

export const LOGO_PATH = '/logo.png';
export const OG_IMAGE_PATH = '/og-image.png';

export const CONTACT_ADDRESS = 'Online Store · Accra, Ghana';
export const CONTACT_PHONE = '0509981360';
export const CONTACT_PHONE_DISPLAY = '050 998 1360';
export const CONTACT_PHONE_LINK = 'tel:+233509981360';
export const CONTACT_WHATSAPP = '0509981360';
export const WHATSAPP_LINK = 'https://wa.me/233509981360';

export const INSTAGRAM_HANDLE = '@vee_care_gh';
export const INSTAGRAM_URL = 'https://instagram.com/vee_care_gh';
export const TIKTOK_HANDLE = '@vee_caregh';
export const TIKTOK_URL = 'https://www.tiktok.com/@vee_caregh';
export const SNAPCHAT_HANDLE = 'veecarehera';
export const SNAPCHAT_URL = 'https://www.snapchat.com/add/veecarehera';
export const SNAPCHAT_HANDLES = [SNAPCHAT_HANDLE];

export const SUPPORT_EMAIL = 'hello@veecarehera.com';
export const ADMIN_EMAIL_DEFAULT = 'hello@veecarehera.com';
export const EMAIL_FROM_DEFAULT = 'Vee Care <hello@veecarehera.com>';

export const CURRENCY = 'GHS';
export const CURRENCY_SYMBOL = 'GH₵';
export const SUPABASE_PROJECT_REF = 'YOUR_PROJECT_ID';

export const FONTS = {
  display: 'Cormorant Garamond',
  sans: 'Manrope',
} as const;

/** Official brand palette */
export const COLORS = {
  rose: '#E88BA8',
  blush: '#F6E6E8',
  berry: '#C95D7B',
  lavender: '#DCC9D6',
  ivory: '#FFF9F7',
  cocoa: '#5B4B4B',
} as const;

export const LOGO_CLASS_HEADER = 'h-10 md:h-11 w-auto object-contain';

export const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/shop' },
  { label: 'Categories', href: '/categories' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
] as const;

/** Secondary links shown in the mobile menu */
export const NAV_LINKS_OPTIONAL = [
  { label: 'FAQs', href: '/faqs' },
  { label: 'Shipping', href: '/shipping' },
  { label: 'Returns', href: '/returns' },
] as const;

export const FOOTER_TAGLINE =
  'A modern feminine wellness brand — personal care, hygiene, and self-care for confident everyday women in Ghana.';

/** Hero slider — images in /public/hero/ */
export const HERO_IMAGE_VERSION = '6';

/** Desktop / tablet (≥1024px) — 16:9 landscape */
export const HERO_SLIDES = [
  {
    src: '/hero/hero-slide-1.jpg',
    alt: 'Self-care moment with wellness essentials and feminine care',
  },
  {
    src: '/hero/hero-slide-2.jpg',
    alt: 'Feminine care products — wash, cup, and daily wellness',
  },
  {
    src: '/hero/hero-slide-3.jpg',
    alt: 'Morning wellness ritual — tea, journal, and self-care',
  },
] as const;

/** Mobile only (<1024px) — 9:16 portrait */
export const HERO_SLIDES_MOBILE = [
  {
    src: '/hero/hero-slide-1-mobile.jpg',
    alt: 'Woman enjoying a gentle self-care moment with Vee Care essentials',
  },
  {
    src: '/hero/hero-slide-2-mobile.jpg',
    alt: 'Vee Care feminine wash, menstrual cup, and wellness products flat lay',
  },
  {
    src: '/hero/hero-slide-3-mobile.jpg',
    alt: 'Morning wellness ritual with journal, tea, and feminine care on soft pink bedding',
  },
] as const;

export const HERO_IMAGE = HERO_SLIDES[0].src;
export const HERO_IMAGE_MOBILE = HERO_SLIDES_MOBILE[0].src;
export const HERO_SLIDE_DURATION_MS = 3000;

export const HOME_CATEGORIES = [
  { id: 'personal-care', name: 'Personal Care', subtitle: 'Gentle daily essentials', slug: 'personal-care', tint: 'from-[#E88BA8]/40 via-[#F6E6E8]/80 to-[#FFF9F7]' },
  { id: 'hygiene', name: 'Hygiene', subtitle: 'Fresh & protected', slug: 'hygiene', tint: 'from-[#DCC9D6]/70 via-[#F6E6E8]/60 to-[#FFF9F7]' },
  { id: 'wellness', name: 'Wellness', subtitle: 'Feel balanced', slug: 'wellness', tint: 'from-[#F6E6E8] via-[#FFF9F7] to-[#DCC9D6]/40' },
  { id: 'self-care', name: 'Self-Care', subtitle: 'Moments for you', slug: 'self-care', tint: 'from-[#C95D7B]/30 via-[#E88BA8]/20 to-[#F6E6E8]' },
  { id: 'comfort', name: 'Comfort', subtitle: 'Soft & supportive', slug: 'comfort', tint: 'from-[#DCC9D6]/90 via-[#F6E6E8]/70 to-[#FFF9F7]' },
  { id: 'bundles', name: 'Curated Kits', subtitle: 'Thoughtful sets', slug: 'bundles', tint: 'from-[#E88BA8]/35 via-[#F6E6E8]/55 to-[#FFF9F7]' },
] as const;

export const SELF_CARE_BENEFITS = [
  {
    icon: 'ri-heart-pulse-line',
    title: 'Emotional comfort',
    description: 'Products and guidance chosen to help you feel seen, supported, and at ease.',
  },
  {
    icon: 'ri-shield-check-line',
    title: 'Trusted hygiene',
    description: 'Carefully selected essentials that support freshness, protection, and peace of mind.',
  },
  {
    icon: 'ri-user-heart-line',
    title: 'Everyday confidence',
    description: 'Wellness-centered picks that help you move through your day feeling assured.',
  },
  {
    icon: 'ri-leaf-line',
    title: 'Calm self-care',
    description: 'Rituals and products that invite rest, softness, and time for yourself.',
  },
] as const;

export const TESTIMONIALS = [
  {
    quote:
      'It feels like a brand that actually understands women. Soft packaging, clear communication, and products I trust.',
    name: 'Ama K.',
    location: 'Accra',
  },
  {
    quote:
      'Ordering on WhatsApp was easy and discreet. The whole experience felt warm, not clinical.',
    name: 'Efua M.',
    location: 'Tema',
  },
  {
    quote:
      'Finally a feminine care shop that feels modern and calming — not loud or overwhelming.',
    name: 'Adwoa S.',
    location: 'Kumasi',
  },
] as const;

export const HOME_FAQ_PREVIEW = [
  {
    question: 'Do you deliver across Ghana?',
    answer:
      'Yes. We deliver nationwide with clear timelines at checkout and updates when your order ships.',
  },
  {
    question: 'How can I reach Vee Care?',
    answer:
      'Message us on WhatsApp, call 050 998 1360, or DM @vee_care_gh on Instagram — we reply with care and discretion.',
  },
  {
    question: 'Are your products discreet?',
    answer:
      'We pack orders thoughtfully and communicate with respect for your privacy at every step.',
  },
] as const;

/** Primary meta description — used site-wide (overrides CMS for SEO). */
export const META_DESCRIPTION =
  'Shop feminine care, hygiene & wellness essentials at Vee Care — Accra, Ghana. Personal care, menstrual products, intimate wash, self-care kits & discreet nationwide delivery. WhatsApp support.';

export const META_TITLE =
  'Vee Care | Feminine Care & Wellness for Every Woman — Ghana';

export const REFUND_POLICY = {
  title: 'Refund policy',
  refundIntro: 'A refund may be approved when one of the following applies:',
  refundReasons: [
    'A defective, damaged, or leaking item was delivered.',
    'There was a mix-up in your order.',
    'You paid for an item that was out of stock.',
    'A package was lost after dispatch (subject to investigation).',
  ],
  exchangeTitle: 'Exchange requirements',
  exchangeBody:
    'Hygiene and personal-care items must be unopened, sealed, and in original packaging. Opened intimate-care products cannot be exchanged for health and safety reasons.',
  exchangeWindow:
    'Please reach out within 24 hours of delivery with your order details and photos if needed.',
  finalNote:
    'We review each request with care and will guide you through the next steps.',
  contactCta: 'Questions? WhatsApp us at 050 998 1360 or message @vee_care_gh on Instagram.',
} as const;
