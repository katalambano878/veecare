import type { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { SITE_URL } from '@/lib/seo';
import { captureAffiliateByCode } from '@/lib/reseller/attribution';
import { visitorKey } from '@/lib/reseller/tokens';
import { headers } from 'next/headers';

async function productBySlug(slug: string) {
  const { data } = await supabaseAdmin
    .from('products')
    .select('name, slug, seo_title, seo_description, short_description, description, product_images(url, position)')
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle();
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await productBySlug(slug);
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

export default async function AffiliatePrettyLinkPage({
  params,
}: {
  params: Promise<{ code: string; slug: string }>;
}) {
  const { code, slug } = await params;
  const product = await productBySlug(slug);
  if (!product) notFound();

  const attribution = await captureAffiliateByCode(code);
  if (attribution) {
    const h = await headers();
    await supabaseAdmin.from('affiliate_visits').insert({
      affiliate_id: attribution.affiliateId,
      link_id: attribution.linkId,
      visitor_key: visitorKey(h.get('x-forwarded-for') || '', h.get('user-agent') || ''),
    });
  }

  redirect(`/product/${product.slug}`);
}
