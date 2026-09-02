import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAffiliate } from '@/lib/reseller/session';
import { getResellerSettings } from '@/lib/reseller/settings';
import { quoteUnit, readProductAffiliateConfig } from '@/lib/reseller/pricing';

export async function GET(req: Request) {
  const auth = await requireAffiliate(req);
  if (!auth.affiliate) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const settings = await getResellerSettings();
  const { data: products } = await supabaseAdmin
    .from('products')
    .select('id, name, slug, price, quantity, status, metadata, product_images(url, position)')
    .eq('status', 'active')
    .order('name');

  const rate = Number(auth.affiliate.commission_rate) || settings.defaultMarkupRate;
  const list = ((products || []) as Array<{
    id: string;
    name: string;
    slug: string;
    price: number;
    quantity: number;
    status: string;
    metadata: Record<string, unknown> | null;
    product_images?: Array<{ url: string; position?: number }>;
  }>)
    .map((product) => {
      const config = readProductAffiliateConfig(product.metadata as Record<string, unknown>, {
        markupRate: rate,
        markupType: settings.defaultMarkupType,
        affiliateEnabled: settings.affiliateSellingEnabled,
      });
      if (!config.affiliateEnabled || !settings.affiliateSellingEnabled) return null;
      const quote = quoteUnit({
        basePriceGhs: Number(product.price) || 0,
        config,
        affiliateDefaultRate: rate,
      });
      const images = [...(product.product_images || [])].sort(
        (a: { position?: number }, b: { position?: number }) => (a.position ?? 0) - (b.position ?? 0)
      );
      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        image: images[0]?.url || null,
        stock: Number(product.quantity) || 0,
        available: (Number(product.quantity) || 0) > 0,
        customPriceAllowed: config.customPriceAllowed && settings.customPricingEnabled,
        minSellingGhs: config.minSellingGhs,
        maxSellingGhs: config.maxSellingGhs,
        recommendedSellingGhs: config.recommendedSellingGhs,
        markupType: config.markupType,
        ...quote,
      };
    })
    .filter(Boolean);

  return NextResponse.json({ products: list, markupRate: rate });
}
