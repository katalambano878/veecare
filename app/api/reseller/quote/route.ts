import { NextResponse } from 'next/server';
import { getActiveAttributionFromRequest } from '@/lib/reseller/attribution';
import { quoteCheckoutCart } from '@/lib/reseller/quote-order';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const items = Array.isArray(body?.items) ? body.items : [];
  if (!items.length) {
    return NextResponse.json({ attributed: false, items: [] });
  }

  const attribution = await getActiveAttributionFromRequest(req);
  if (!attribution) {
    return NextResponse.json({ attributed: false, items: [] });
  }

  try {
    const quote = await quoteCheckoutCart({ items, attribution });
    return NextResponse.json({
      attributed: Boolean(quote.affiliate),
      affiliateCode: quote.affiliate?.code || null,
      items: quote.lines.map((line) => ({
        product_id: line.product_id,
        variant_name: line.variant_name,
        product_base_price: line.unit_quote.product_base_price,
        affiliate_selling_price: line.unit_quote.affiliate_selling_price,
        affiliate_markup_amount: line.unit_quote.affiliate_markup_amount,
      })),
      customer_subtotal: quote.customer_subtotal,
    });
  } catch (err) {
    // Falls back to base pricing; log so a silent affiliate-pricing outage is visible in container logs.
    console.error('[Reseller Quote] quoteCheckoutCart failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ attributed: false, items: [] });
  }
}
