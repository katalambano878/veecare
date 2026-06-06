/**
 * Vee Care — feminine care & wellness (Accra, Ghana)
 * Canonical brand + SEO defaults (code-owned; not overridden by CMS).
 */
export const APP_TITLE = 'Vee Care Hera';
export const BRAND_NAME = 'Vee-Care Hera';
export const SHORT_NAME = 'Vee Care';
export const TAGLINE = 'Feminine Care & Wellness for Every Woman';

export const BRAND_MOTTO =
  'Because your feminine care should be as powerful and natural as you are.';

export const ABOUT_US =
  'At Vee-Care Hera, we are dedicated to evoking a sense of empowerment, unity, and holistic wellbeing for women’s yoni health — through a strong, supportive community and plant-based products customized to address intimate discomfort.';

export const BRAND_MISSION =
  'Our mission is to encourage and provide honest information about feminine hygiene and overall health — empowering women to embrace their sexuality and feminine energy with confidence and knowledge.';

export const BRAND_VISION = 'Empowering women with safe, herbal feminine care.';

export const BRAND_VALUES = [
  'Empowerment',
  'Wellness',
  'Education',
  'Community',
  'Quality',
] as const;

export const FOUNDER_STORY = {
  image: '/about/founder-story.png',
  imageAlt: 'Vee-Care Hera founder — herbal feminine wellness brand, Ghana',
  paragraphs: [
    'Vee-Care Hera was born out of a deep passion for women’s wellness and a desire to provide safe, natural care for feminine health. Founded in 2024, Vee-Care Hera set out to break the silence around intimate care, empowering women to prioritize their hygiene, comfort, and confidence.',
    'The journey started with the belief that every woman deserves products that are not only effective but also gentle and herbal-based — free from harsh chemicals and unnecessary additives. Through research, personal experiences, and countless conversations with women, Vee-Care Hera created a line of herbal feminine care products designed to support the body’s natural balance and promote holistic wellbeing.',
    'More than a brand, Vee-Care Hera is a community — a safe space where women are educated, uplifted, and reminded that self-care is an act of self-love. With every product and every message, we stand for healing, teaching, and empowering women to care for themselves unapologetically.',
  ],
  journeyNote:
    'We are here not just to help you stay on track, but to evolve into who you are meant to be.',
} as const;

export const PRODUCT_FOCUS_AREAS = [
  'Infection care products',
  'Irregular menstrual flow',
  'Low libido',
  'Vaginal dryness',
  'Sweeteners & painful intimacy support',
] as const;

/** Delivery schedule — online orders only; no walk-in shop or pickups */
export const DELIVERY_DAYS = ['Tuesdays', 'Thursdays', 'Saturdays'] as const;
export const DELIVERY_DAYS_DISPLAY = 'Tuesdays, Thursdays & Saturdays';
export const NO_PICKUP_NOTICE =
  'We are an online-only brand — there is no walk-in shop and we do not offer order pickups. All orders are delivered to your address.';

export const BRAND_INTRO = ABOUT_US;

export const BRAND_INTRO_SECONDARY =
  'Shop plant-based feminine care online or connect with us on Instagram, TikTok, and Snapchat. Deliveries go out on Tuesdays, Thursdays, and Saturdays.';

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
  'Plant-based feminine care and a supportive community for women’s yoni health — herbal, honest, and empowering.';

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
    question: 'When do you deliver?',
    answer: `We deliver on ${DELIVERY_DAYS_DISPLAY}. We are online-only — no walk-in shop or order pickups.`,
  },
  {
    question: 'Do you deliver across Ghana?',
    answer:
      'Yes. We deliver nationwide. Delivery cost is confirmed with you after checkout — orders ship on our delivery days.',
  },
  {
    question: 'How can I reach Vee-Care Hera?',
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
  'Vee-Care Hera — plant-based feminine care & yoni wellness in Ghana. Herbal products, honest education & community support. Delivery Tuesdays, Thursdays & Saturdays. WhatsApp support.';

export const META_TITLE =
  'Vee-Care Hera | Plant-Based Feminine Care & Yoni Wellness — Ghana';

export const REFUND_POLICY = {
  title: 'Refund & Returns Policy',
  intro:
    'At Vee-Care Hera, we prioritize customer satisfaction while maintaining hygiene and quality standards. Due to the nature of our products, we have a strict refund and return policy as outlined below.',
  sections: [
    {
      title: 'No refunds on opened or used products',
      body: 'For hygiene and safety reasons, we do not accept returns or issue refunds for products that have been opened, used, or tampered with after delivery.',
    },
    {
      title: 'Returns & refunds for damaged or defective products',
      body: 'If you receive a damaged or defective product, notify us within 24 hours of delivery with clear pictures or videos as proof. We will assess the situation and provide either a replacement or a refund, depending on the severity of the issue.',
    },
    {
      title: 'Order cancellation policy',
      body: 'Orders can only be canceled before dispatch. Once an order has been shipped, no cancellation or refund will be issued.',
    },
    {
      title: 'Delivery issues & non-delivery',
      body: 'If a package is lost due to a mistake on our part, we will send a replacement or issue a refund after verification. If delivery fails due to incorrect details provided by the customer, we will not issue a refund.',
    },
    {
      title: 'Refund processing time',
      body: 'If a refund is approved, it will be processed within 7 business days via the same payment method used for the purchase.',
    },
    {
      title: 'Customer responsibility',
      body: 'Customers are responsible for providing the correct address and ensuring someone is available to receive the package. We do not offer refunds for failed deliveries due to incorrect details or customer unavailability.',
    },
  ],
  contactCta: 'Questions? WhatsApp us at 050 998 1360 or message @vee_care_gh on Instagram.',
} as const;
