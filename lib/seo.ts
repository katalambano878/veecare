/**
 * Canonical SEO — meta tags, Open Graph, Twitter, JSON-LD.
 * Code-owned defaults (not CMS). Set NEXT_PUBLIC_APP_URL for production URLs.
 */
import type { Metadata } from 'next';
import {
  APP_TITLE,
  BRAND_NAME,
  SHORT_NAME,
  TAGLINE,
  CONTACT_PHONE_DISPLAY,
  INSTAGRAM_URL,
  TIKTOK_URL,
  SNAPCHAT_URL,
  WHATSAPP_LINK,
  META_DESCRIPTION,
  META_TITLE,
  SITE_URL_DEFAULT,
  SUPPORT_EMAIL,
} from '@/lib/brand';

export const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || SITE_URL_DEFAULT;

/** Social & OG assets — run `npm run generate:seo` after logo updates */
export const SEO_ASSETS = {
  ogImage: '/og-image.png',
  ogImageSquare: '/og-image-square.png',
  twitterCard: '/twitter-card.png',
  logo: '/logo.png',
  faviconDir: '/favicon',
  faviconIco: '/favicon/favicon.ico',
  favicon16: '/favicon/favicon-16x16.png',
  favicon32: '/favicon/favicon-32x32.png',
  favicon48: '/favicon/favicon-48x48.png',
  appleTouchIcon: '/favicon/apple-touch-icon.png',
  icon192: '/favicon/android-chrome-192x192.png',
  icon512: '/favicon/android-chrome-512x512.png',
} as const;

export const DEFAULT_TITLE = META_TITLE;

export const DEFAULT_DESCRIPTION = META_DESCRIPTION;

export const DEFAULT_KEYWORDS = [
  BRAND_NAME,
  'Vee Care Ghana',
  'feminine care Ghana',
  'feminine wellness Accra',
  'women personal care Ghana',
  'hygiene products women',
  'menstrual care Ghana',
  'intimate wash Ghana',
  'self care products Ghana',
  'wellness shop Accra',
  'buy feminine care online Ghana',
  'vee care hera',
];

export type PageSeoKey =
  | 'home'
  | 'shop'
  | 'categories'
  | 'about'
  | 'contact'
  | 'cart'
  | 'wishlist'
  | 'faqs'
  | 'shipping'
  | 'returns'
  | 'privacy'
  | 'terms'
  | 'blog'
  | 'orderTracking';

type PageSeoEntry = {
  title: string;
  description: string;
  keywords?: string[];
  path: string;
  noindex?: boolean;
  ogImage?: string;
};

const PAGE_SEO: Record<PageSeoKey, PageSeoEntry> = {
  home: {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    keywords: DEFAULT_KEYWORDS,
    path: '/',
  },
  shop: {
    title: `Shop Feminine Care & Wellness`,
    description: `Browse feminine wash, pads, menstrual cups, hygiene essentials & self-care at ${BRAND_NAME}. Curated for women in Ghana — discreet packaging, secure checkout & nationwide delivery.`,
    keywords: ['shop feminine care Ghana', 'buy wellness products', 'hygiene online Ghana'],
    path: '/shop',
  },
  categories: {
    title: 'Shop by Category',
    description: `Explore personal care, hygiene, wellness, comfort & curated kits at ${BRAND_NAME}. Find the right feminine care products for your routine — shipped across Ghana.`,
    keywords: ['feminine care categories', 'personal care Ghana', 'wellness categories'],
    path: '/categories',
  },
  about: {
    title: 'About Vee Care',
    description: `${BRAND_NAME} is a calm, modern feminine wellness brand in Accra, Ghana — supporting women with personal care, hygiene, confidence & everyday self-care.`,
    keywords: ['about Vee Care', 'feminine wellness brand Ghana'],
    path: '/about',
  },
  contact: {
    title: 'Contact Us',
    description: `Reach ${BRAND_NAME} on WhatsApp, phone (050 998 1360), or Instagram @vee_care_gh. We're here for product questions, orders & caring support — Accra, Ghana.`,
    keywords: ['contact Vee Care', 'WhatsApp feminine care Ghana'],
    path: '/contact',
  },
  cart: {
    title: 'Your Cart',
    description: `Review items in your ${BRAND_NAME} cart before checkout.`,
    path: '/cart',
    noindex: true,
  },
  wishlist: {
    title: 'Wishlist',
    description: `Your saved feminine care & wellness favourites at ${BRAND_NAME}.`,
    path: '/wishlist',
    noindex: true,
  },
  faqs: {
    title: 'FAQs',
    description: `Answers about ordering, delivery across Ghana, returns, product care & privacy when shopping with ${BRAND_NAME}.`,
    keywords: ['Vee Care FAQ', 'delivery Ghana', 'returns feminine care'],
    path: '/faqs',
  },
  shipping: {
    title: 'Shipping & Delivery',
    description: `Delivery timelines, nationwide shipping & order tracking for ${BRAND_NAME} — feminine care & wellness delivered across Ghana.`,
    path: '/shipping',
  },
  returns: {
    title: 'Returns & Refunds',
    description: `${BRAND_NAME} returns & refund policy for hygiene and personal-care items — clear, respectful guidance for exchanges and order issues.`,
    path: '/returns',
  },
  privacy: {
    title: 'Privacy Policy',
    description: `How ${BRAND_NAME} collects, uses & protects your personal information when you shop feminine care & wellness online in Ghana.`,
    path: '/privacy',
  },
  terms: {
    title: 'Terms & Conditions',
    description: `Terms for shopping at ${BRAND_NAME} — orders, payments, delivery, returns & use of our feminine care & wellness store in Ghana.`,
    path: '/terms',
  },
  blog: {
    title: 'Wellness Journal',
    description: `Tips, stories & updates on feminine wellness, self-care & everyday confidence from ${BRAND_NAME} — Ghana.`,
    path: '/blog',
  },
  orderTracking: {
    title: 'Track Your Order',
    description: `Track your ${BRAND_NAME} order with your order number and email — feminine care & wellness delivery status in Ghana.`,
    path: '/order-tracking',
    noindex: true,
  },
};

function absoluteUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${p}`;
}

function absoluteImage(path: string): string {
  return absoluteUrl(path);
}

const OG_LOCALE = 'en_GH';

export function buildPageMetadata(
  key: PageSeoKey,
  overrides?: Partial<{
    title: string;
    description: string;
    path: string;
    keywords: string[];
    ogImage: string;
    noindex: boolean;
  }>
): Metadata {
  const page = PAGE_SEO[key];
  const title = overrides?.title ?? page.title;
  const description = overrides?.description ?? page.description;
  const path = overrides?.path ?? page.path;
  const canonical = absoluteUrl(path);
  const noindex = overrides?.noindex ?? page.noindex;
  const ogImagePath = overrides?.ogImage ?? page.ogImage ?? SEO_ASSETS.ogImage;
  const keywords = overrides?.keywords ?? page.keywords;
  const ogImageUrl = absoluteImage(ogImagePath);

  return {
    title,
    description,
    keywords,
    alternates: { canonical },
    robots: noindex
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        },
    openGraph: {
      type: 'website',
      locale: OG_LOCALE,
      title,
      description,
      url: canonical,
      siteName: APP_TITLE,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${BRAND_NAME} — feminine care & wellness in Ghana`,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

/** Root layout metadata — favicons, defaults, verification hooks */
export function buildRootMetadata(): Metadata {
  const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

  const ogUrl = absoluteImage(SEO_ASSETS.ogImage);

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: DEFAULT_TITLE,
      template: `%s | ${APP_TITLE}`,
    },
    description: DEFAULT_DESCRIPTION,
    keywords: DEFAULT_KEYWORDS,
    authors: [{ name: BRAND_NAME, url: SITE_URL }],
    creator: BRAND_NAME,
    publisher: BRAND_NAME,
    applicationName: APP_TITLE,
    category: 'health',
    referrer: 'origin-when-cross-origin',
    formatDetection: { telephone: true, email: false, address: false },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    icons: {
      icon: [
        { url: SEO_ASSETS.faviconIco, sizes: 'any' },
        { url: SEO_ASSETS.favicon16, sizes: '16x16', type: 'image/png' },
        { url: SEO_ASSETS.favicon32, sizes: '32x32', type: 'image/png' },
        { url: SEO_ASSETS.favicon48, sizes: '48x48', type: 'image/png' },
        { url: SEO_ASSETS.icon192, sizes: '192x192', type: 'image/png' },
        { url: SEO_ASSETS.icon512, sizes: '512x512', type: 'image/png' },
      ],
      shortcut: SEO_ASSETS.faviconIco,
      apple: [{ url: SEO_ASSETS.appleTouchIcon, sizes: '180x180', type: 'image/png' }],
    },
    manifest: '/favicon/site.webmanifest',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: SHORT_NAME,
    },
    verification: googleVerification ? { google: googleVerification } : undefined,
    openGraph: {
      type: 'website',
      locale: OG_LOCALE,
      url: SITE_URL,
      siteName: APP_TITLE,
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      images: [
        {
          url: ogUrl,
          width: 1200,
          height: 630,
          alt: `${BRAND_NAME} — feminine care & wellness in Ghana`,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      images: [ogUrl],
    },
    alternates: {
      canonical: SITE_URL,
    },
    other: {
      'geo.region': 'GH-AA',
      'geo.placename': 'Accra',
      'contact:email': SUPPORT_EMAIL,
      'contact:phone_number': CONTACT_PHONE_DISPLAY,
    },
  };
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: APP_TITLE,
    alternateName: BRAND_NAME,
    url: SITE_URL,
    logo: absoluteImage(SEO_ASSETS.logo),
    image: absoluteImage(SEO_ASSETS.ogImage),
    description: DEFAULT_DESCRIPTION,
    email: SUPPORT_EMAIL,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Accra',
      addressCountry: 'GH',
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: CONTACT_PHONE_DISPLAY,
        contactType: 'customer service',
        areaServed: 'GH',
        availableLanguage: ['English'],
      },
    ],
    sameAs: [INSTAGRAM_URL, TIKTOK_URL, SNAPCHAT_URL, WHATSAPP_LINK].filter(Boolean),
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: APP_TITLE,
    alternateName: BRAND_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    inLanguage: 'en-GH',
    publisher: { '@id': `${SITE_URL}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/shop?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function localBusinessJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'HealthAndBeautyBusiness',
    '@id': `${SITE_URL}/#store`,
    name: APP_TITLE,
    image: [absoluteImage(SEO_ASSETS.ogImage), absoluteImage(SEO_ASSETS.logo)],
    url: SITE_URL,
    telephone: CONTACT_PHONE_DISPLAY,
    email: SUPPORT_EMAIL,
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Accra',
      addressRegion: 'Greater Accra',
      addressCountry: 'GH',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 5.6037,
      longitude: -0.187,
    },
    areaServed: { '@type': 'Country', name: 'Ghana' },
    sameAs: [INSTAGRAM_URL, TIKTOK_URL, SNAPCHAT_URL, WHATSAPP_LINK],
  };
}

export function faqPageJsonLd(
  faqs: { question: string; answer: string }[]
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function productJsonLd(product: {
  name: string;
  description: string;
  image: string;
  slug: string;
  price: number;
  currency?: string;
  sku?: string;
  inStock: boolean;
  brand?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image.startsWith('http') ? product.image : absoluteUrl(product.image),
    sku: product.sku || product.slug,
    brand: { '@type': 'Brand', name: product.brand || BRAND_NAME },
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/product/${product.slug}`,
      priceCurrency: product.currency || 'GHS',
      price: product.price,
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: { '@id': `${SITE_URL}/#organization` },
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function itemListJsonLd(items: {
  name: string;
  url: string;
  image?: string;
}[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: item.url.startsWith('http') ? item.url : absoluteUrl(item.url),
      ...(item.image
        ? { image: item.image.startsWith('http') ? item.image : absoluteUrl(item.image) }
        : {}),
    })),
  };
}
