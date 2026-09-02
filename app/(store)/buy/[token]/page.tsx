import type { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { SITE_URL } from '@/lib/seo';
import { captureAffiliateByLinkToken } from '@/lib/reseller/attribution';
import { visitorKey } from '@/lib/reseller/tokens';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const { data: link } = await supabaseAdmin
    .from('affiliate_links')
    .select('products(name, slug, seo_title, seo_description, short_description, description, product_images(url, position))')
    .eq('public_token', token.trim().toUpperCase())
    .maybeSingle();
  const product = Array.isArray(link?.products) ? link?.products[0] : link?.products;
  if (!product) return { robots: { index: false, follow: false } };
  const images = [...(product.product_images || [])].sort(
    (a: { position?: number }, b: { position?: number }) => (a.position ?? 0) - (b.position ?? 0)
  );
  const image = images[0]?.url;
  const title = product.seo_title || product.name;
  const description =
    product.seo_description ||
    product.short_description ||
    product.description?.replace(/<[^>]+>/g, '').slice(0, 160) ||
    product.name;
  const canonical = `${SITE_URL}/product/${product.slug}`;
  return {
    title,
    description,
    robots: { index: false, follow: true },
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      images: image ? [{ url: image.startsWith('http') ? image : `${SITE_URL}${image}` }] : undefined,
    },
  };
}

export default async function BuyLinkPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const captured = await captureAffiliateByLinkToken(token);
  if (!captured) {
    const { data: link } = await supabaseAdmin
      .from('affiliate_links')
      .select('products(slug)')
      .eq('public_token', token.trim().toUpperCase())
      .maybeSingle();
    const product = Array.isArray(link?.products) ? link?.products[0] : link?.products;
    if (product?.slug) redirect(`/product/${product.slug}`);
    notFound();
  }

  const h = await headers();
  await supabaseAdmin.from('affiliate_visits').insert({
    affiliate_id: captured.attribution.affiliateId,
    link_id: captured.attribution.linkId,
    visitor_key: visitorKey(h.get('x-forwarded-for') || '', h.get('user-agent') || ''),
  });

  redirect(`/product/${captured.productSlug}`);
}
