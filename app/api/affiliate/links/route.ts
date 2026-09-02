import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAffiliate } from '@/lib/reseller/session';
import { getResellerSettings } from '@/lib/reseller/settings';
import { quoteUnit, readProductAffiliateConfig } from '@/lib/reseller/pricing';
import { randomPublicToken } from '@/lib/reseller/tokens';
import { writeAffiliateAudit } from '@/lib/reseller/audit';

function siteUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || 'https://veecare.shop').replace(/\/+$/, '');
}

export async function GET(req: Request) {
  const auth = await requireAffiliate(req);
  if (!auth.affiliate) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data: links } = await supabaseAdmin
    .from('affiliate_links')
    .select('*, products(name, slug, price, product_images(url, position))')
    .eq('affiliate_id', auth.affiliate.id)
    .order('created_at', { ascending: false });

  const { data: commissions } = await supabaseAdmin
    .from('affiliate_commissions')
    .select('id, order_id, affiliate_amount, commission_amount, selling_amount, order_total, status, orders(metadata)')
    .eq('affiliate_id', auth.affiliate.id);

  const site = siteUrl();
  type LinkRow = {
    id: string;
    public_token: string;
    status: string;
    click_count: number;
    created_at: string;
    markup_type: string;
    custom_selling_price_snapshot: number | null;
    products?: { name: string; slug: string; product_images?: Array<{ url: string; position?: number }> } | Array<{ name: string; slug: string; product_images?: Array<{ url: string; position?: number }> }>;
  };
  type CommissionRow = {
    status: string;
    selling_amount?: number | null;
    order_total: number;
    affiliate_amount?: number | null;
    commission_amount: number;
    orders?: { metadata?: { reseller?: { link_id?: string } } } | null;
  };
  const enriched = ((links || []) as LinkRow[]).map((link) => {
    const product = Array.isArray(link.products) ? link.products[0] : link.products;
    const related = ((commissions || []) as CommissionRow[]).filter((row) => {
      const meta = row.orders?.metadata;
      return meta?.reseller?.link_id === link.id;
    });
    const paid = related.filter((row) => row.status !== 'cancelled');
    const revenue = paid.reduce((sum, row) => sum + Number(row.selling_amount ?? row.order_total ?? 0), 0);
    const earnings = paid.reduce((sum, row) => sum + Number(row.affiliate_amount ?? row.commission_amount ?? 0), 0);
    const images = [...(product?.product_images || [])].sort(
      (a: { position?: number }, b: { position?: number }) => (a.position ?? 0) - (b.position ?? 0)
    );
    return {
      id: link.id,
      public_token: link.public_token,
      status: link.status,
      click_count: link.click_count,
      created_at: link.created_at,
      markup_type: link.markup_type,
      selling_price: link.custom_selling_price_snapshot,
      product_name: product?.name,
      product_slug: product?.slug,
      product_image: images[0]?.url || null,
      url: `${site}/buy/${link.public_token}`,
      pretty_url: product?.slug ? `${site}/a/${auth.affiliate!.code}/${product.slug}` : null,
      orders: paid.length,
      conversion_rate: link.click_count > 0 ? Math.round((paid.length / link.click_count) * 1000) / 10 : 0,
      revenue,
      earnings,
    };
  });

  return NextResponse.json({ links: enriched });
}

export async function POST(req: Request) {
  const auth = await requireAffiliate(req);
  if (!auth.affiliate) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.affiliate.status !== 'active') {
    return NextResponse.json({ error: 'Your account must be approved before you can create links.' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const productId = String(body?.productId || '');
  if (!productId) return NextResponse.json({ error: 'Product is required' }, { status: 400 });

  const settings = await getResellerSettings();
  const { data: product } = await supabaseAdmin
    .from('products')
    .select('id, name, slug, price, status, metadata')
    .eq('id', productId)
    .maybeSingle();
  if (!product || product.status !== 'active') {
    return NextResponse.json({ error: 'Product is not available' }, { status: 400 });
  }

  const rate = Number(auth.affiliate.commission_rate) || settings.defaultMarkupRate;
  const config = readProductAffiliateConfig(product.metadata as Record<string, unknown>, {
    markupRate: rate,
    markupType: settings.defaultMarkupType,
    affiliateEnabled: settings.affiliateSellingEnabled,
  });
  if (!config.affiliateEnabled || !settings.affiliateSellingEnabled) {
    return NextResponse.json({ error: 'This product is not enabled for affiliate selling.' }, { status: 400 });
  }

  const customSelling =
    config.customPriceAllowed && settings.customPricingEnabled && body?.sellingPrice != null
      ? Number(body.sellingPrice)
      : null;
  if (customSelling != null) {
    if (config.minSellingGhs != null && customSelling < config.minSellingGhs) {
      return NextResponse.json({ error: `Minimum selling price is GH₵${config.minSellingGhs}` }, { status: 400 });
    }
    if (config.maxSellingGhs != null && customSelling > config.maxSellingGhs) {
      return NextResponse.json({ error: `Maximum selling price is GH₵${config.maxSellingGhs}` }, { status: 400 });
    }
    if (customSelling < Number(product.price)) {
      return NextResponse.json({ error: 'Selling price cannot be below the Vee-care base price.' }, { status: 400 });
    }
  }

  const quote = quoteUnit({
    basePriceGhs: Number(product.price) || 0,
    config,
    affiliateDefaultRate: rate,
    customSellingGhs: customSelling,
  });

  let token = randomPublicToken(8);
  for (let i = 0; i < 6; i++) {
    const { data: clash } = await supabaseAdmin
      .from('affiliate_links')
      .select('id')
      .eq('public_token', token)
      .maybeSingle();
    if (!clash) break;
    token = randomPublicToken(8);
  }

  const { data: link, error } = await supabaseAdmin
    .from('affiliate_links')
    .insert({
      public_token: token,
      affiliate_id: auth.affiliate.id,
      product_id: product.id,
      markup_type: quote.markup_type,
      markup_rate_snapshot: quote.affiliate_markup_rate,
      fixed_markup_snapshot: config.markupType === 'fixed' ? config.fixedMarkupGhs : null,
      custom_selling_price_snapshot: customSelling,
      status: 'active',
    })
    .select('id, public_token')
    .single();

  if (error || !link) {
    return NextResponse.json({ error: 'Could not create selling link' }, { status: 500 });
  }

  await writeAffiliateAudit({
    actorType: 'affiliate',
    actorId: auth.affiliate.id,
    action: 'link_created',
    targetType: 'affiliate_link',
    targetId: link.id,
    meta: { product_id: product.id, token },
  });

  const site = siteUrl();
  return NextResponse.json({
    success: true,
    link: {
      id: link.id,
      url: `${site}/buy/${link.public_token}`,
      pretty_url: `${site}/a/${auth.affiliate.code}/${product.slug}`,
      quote,
    },
  });
}

export async function PATCH(req: Request) {
  const auth = await requireAffiliate(req);
  if (!auth.affiliate) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => null);
  const id = String(body?.id || '');
  if (!id) return NextResponse.json({ error: 'Link id required' }, { status: 400 });

  const { data: link } = await supabaseAdmin
    .from('affiliate_links')
    .select('id, affiliate_id')
    .eq('id', id)
    .maybeSingle();
  if (!link || link.affiliate_id !== auth.affiliate.id) {
    return NextResponse.json({ error: 'Link not found' }, { status: 404 });
  }

  const { error } = await supabaseAdmin
    .from('affiliate_links')
    .update({ status: 'disabled', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('affiliate_id', auth.affiliate.id);
  if (error) return NextResponse.json({ error: 'Could not disable link' }, { status: 500 });

  await writeAffiliateAudit({
    actorType: 'affiliate',
    actorId: auth.affiliate.id,
    action: 'link_disabled',
    targetType: 'affiliate_link',
    targetId: id,
  });

  return NextResponse.json({ success: true });
}
