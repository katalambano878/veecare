import { Metadata } from 'next';
import {
  APP_TITLE,
  BRAND_NAME,
  TAGLINE,
} from '@/lib/brand';
import {
  buildPageMetadata,
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
  SEO_ASSETS,
  SITE_URL,
  organizationJsonLd,
  websiteJsonLd,
  productJsonLd,
  breadcrumbJsonLd,
  type PageSeoKey,
} from '@/lib/seo';

export type { PageSeoKey };

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  ogType?: 'website' | 'product' | 'article';
  path?: string;
  noindex?: boolean;
}

/** @deprecated Prefer buildPageMetadata(pageKey) from @/lib/seo */
export function generateMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = [],
  ogImage,
  path = '/',
  noindex = false,
}: SEOProps): Metadata {
  return buildPageMetadata('shop', {
    title: title ?? `Shop | ${APP_TITLE}`,
    description,
    keywords: [...keywords],
    path,
    ogImage: ogImage ?? SEO_ASSETS.ogImage,
    noindex,
  });
}

export function generateProductSchema(product: {
  name: string;
  description: string;
  image: string;
  price: number;
  currency?: string;
  sku: string;
  slug?: string;
  rating?: number;
  reviewCount?: number;
  availability?: string;
  brand?: string;
  category?: string;
}) {
  const inStock = product.availability !== 'out_of_stock';
  const base = productJsonLd({
    name: product.name,
    description: product.description,
    image: product.image.startsWith('http') ? product.image : `${SITE_URL}${product.image}`,
    slug: product.slug || product.sku,
    price: product.price,
    currency: product.currency || 'GHS',
    sku: product.sku,
    inStock,
    brand: product.brand || BRAND_NAME,
  });

  if (product.rating && product.reviewCount) {
    (base as Record<string, unknown>).aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  if (product.category) {
    (base as Record<string, unknown>).category = product.category;
  }

  return base;
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return breadcrumbJsonLd(
    items.map((item) => ({
      name: item.name,
      path: item.url.replace(SITE_URL, '') || item.url,
    }))
  );
}

export function generateOrganizationSchema() {
  return organizationJsonLd();
}

export function generateWebsiteSchema() {
  return websiteJsonLd();
}

export function StructuredData({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const items = Array.isArray(data) ? data : [data];
  return (
    <>
      {items.map((schema, i) => (
        <script
          key={`${schema['@type'] as string}-${i}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}

export { buildPageMetadata, TAGLINE, BRAND_NAME, APP_TITLE, DEFAULT_KEYWORDS };
