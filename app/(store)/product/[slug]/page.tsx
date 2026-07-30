import type { Metadata } from 'next';
import ProductDetailClient from './ProductDetailClient';
import { BRAND_NAME, APP_TITLE } from '@/lib/brand';
import { SEO_ASSETS, SITE_URL } from '@/lib/seo';
import { isSupabaseConfigured } from '@/lib/supabase-config';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  const fallback: Metadata = {
    title: `Product | ${APP_TITLE}`,
    description: `View product details at ${BRAND_NAME}.`,
    openGraph: {
      images: [{ url: `${SITE_URL}${SEO_ASSETS.ogImage}`, width: 1200, height: 630 }],
    },
  };

  if (!isSupabaseConfigured()) return fallback;

  const { data: product } = await supabaseAdmin
    .from('products')
    .select('name, slug, short_description, description, price, seo_title, seo_description, product_images(url, position)')
    .eq('slug', slug)
    .eq('status', 'active')
    .single();

  if (!product) return fallback;

  const title =
    product.seo_title?.trim() ||
    `${product.name} | ${BRAND_NAME}`;
  const description =
    product.seo_description?.trim() ||
    product.short_description?.trim() ||
    product.description?.replace(/<[^>]+>/g, '').slice(0, 160) ||
    `Shop ${product.name} at ${BRAND_NAME} — feminine care & wellness in Ghana. Discreet delivery & WhatsApp support.`;

  const images = [...(product.product_images || [])].sort(
    (a: { position?: number }, b: { position?: number }) => (a.position ?? 0) - (b.position ?? 0)
  );
  const imageUrl = images[0]?.url
    ? images[0].url.startsWith('http')
      ? images[0].url
      : `${SITE_URL}${images[0].url}`
    : `${SITE_URL}${SEO_ASSETS.ogImage}`;

  const canonical = `${SITE_URL}/product/${slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      url: canonical,
      siteName: APP_TITLE,
      title,
      description,
      locale: 'en_GH',
      images: [{ url: imageUrl, width: 1200, height: 630, alt: product.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ProductDetailClient slug={slug} />;
}
