import 'server-only';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { validateCouponRecord } from '@/lib/coupons';
import { quoteRedeemDiscount } from '@/lib/loyalty-math';
import { getLoyaltySettings } from '@/lib/loyalty';
import { fromPesewas, toPesewas } from './money';
import { allocateDiscount, quoteUnit, readProductAffiliateConfig, type UnitQuote } from './pricing';
import { getResellerSettings } from './settings';
import { loadActiveAffiliate, type AttributionPayload } from './attribution';

export type CheckoutCartItem = {
  id: string;
  quantity: number;
  variant?: string | null;
  slug?: string;
  name?: string;
  image?: string;
};

export type QuotedLine = {
  product_id: string;
  product_name: string;
  variant_name: string | null;
  quantity: number;
  sku: string | null;
  image: string | null;
  slug: string | null;
  stock: number;
  status: string;
  affiliate_enabled: boolean;
  unit_quote: UnitQuote;
  line_base_amount: number;
  line_markup_amount: number;
  line_selling_amount: number;
};

export type OrderQuote = {
  lines: QuotedLine[];
  subtotal_base_amount: number;
  affiliate_markup_total: number;
  customer_subtotal: number;
  shipping_amount: number;
  discount_amount: number;
  tax_amount: number;
  final_total: number;
  discount_capped: boolean;
  affiliate: {
    id: string;
    code: string;
    commission_rate: number;
  } | null;
  linkId: string | null;
  selfReferralFlag: boolean;
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export async function quoteCheckoutCart(input: {
  items: CheckoutCartItem[];
  attribution: AttributionPayload | null;
  couponCode?: string | null;
  loyaltyPoints?: number;
  customerEmail?: string | null;
  customerPhone?: string | null;
}): Promise<OrderQuote> {
  if (!input.items.length) {
    throw new Error('Cart is empty');
  }

  const settings = await getResellerSettings();
  const affiliate = input.attribution ? await loadActiveAffiliate(input.attribution.affiliateId) : null;
  let linkCustomPrice: number | null = null;
  let linkProductId: string | null = null;

  if (affiliate && input.attribution?.linkId) {
    const { data: link } = await supabaseAdmin
      .from('affiliate_links')
      .select('id, product_id, status, custom_selling_price_snapshot')
      .eq('id', input.attribution.linkId)
      .maybeSingle();
    if (link && link.status === 'active') {
      linkProductId = link.product_id;
      linkCustomPrice =
        link.custom_selling_price_snapshot != null ? Number(link.custom_selling_price_snapshot) : null;
    }
  }

  const ids = input.items.map((item) => item.id).filter(isUuid);
  const slugs = input.items.filter((item) => !isUuid(item.id)).map((item) => item.slug || item.id);

  const { data: byId } = ids.length
    ? await supabaseAdmin
        .from('products')
        .select('id, name, slug, price, sku, quantity, status, metadata, product_variants(id, name, price, quantity, sku), product_images(url, position)')
        .in('id', ids)
    : { data: [] as never[] };

  const { data: bySlug } = slugs.length
    ? await supabaseAdmin
        .from('products')
        .select('id, name, slug, price, sku, quantity, status, metadata, product_variants(id, name, price, quantity, sku), product_images(url, position)')
        .in('slug', slugs)
    : { data: [] as never[] };

  const products = [...(byId || []), ...(bySlug || [])];
  const productById = new Map(products.map((p) => [p.id, p]));
  const productBySlug = new Map(products.map((p) => [p.slug, p]));

  const lines: QuotedLine[] = [];

  for (const item of input.items) {
    const qty = Math.max(1, Math.floor(Number(item.quantity) || 0));
    if (qty < 1) throw new Error('Invalid quantity');

    const product = isUuid(item.id)
      ? productById.get(item.id)
      : productBySlug.get(item.slug || item.id) || productById.get(item.id);
    if (!product) throw new Error(`Product not found: ${item.name || item.id}`);
    if (product.status !== 'active') throw new Error(`${product.name} is unavailable`);

    const variants = (product.product_variants || []) as Array<{
      id: string;
      name: string;
      price: number;
      quantity: number;
      sku: string | null;
    }>;
    const variant = item.variant
      ? variants.find((v) => v.name === item.variant || v.id === item.variant) ||
        variants.find((v) => String(item.variant).includes(v.name))
      : null;
    const basePrice = Number(variant?.price ?? product.price) || 0;
    const stock = Number(variant?.quantity ?? product.quantity) || 0;
    if (stock < qty) {
      throw new Error(`${product.name} does not have enough stock`);
    }

    const images = [...(product.product_images || [])].sort(
      (a: { position?: number }, b: { position?: number }) => (a.position ?? 0) - (b.position ?? 0)
    );
    const config = readProductAffiliateConfig(product.metadata as Record<string, unknown>, {
      markupRate: affiliate ? Number(affiliate.commission_rate) || settings.defaultMarkupRate : settings.defaultMarkupRate,
      markupType: settings.defaultMarkupType,
      affiliateEnabled: settings.affiliateSellingEnabled,
    });

    const applyMarkup =
      !!affiliate &&
      settings.affiliateSellingEnabled &&
      config.affiliateEnabled;

    const custom =
      applyMarkup && linkProductId === product.id && linkCustomPrice != null ? linkCustomPrice : null;

    const unit = applyMarkup
      ? quoteUnit({
          basePriceGhs: basePrice,
          config,
          affiliateDefaultRate: Number(affiliate.commission_rate) || settings.defaultMarkupRate,
          customSellingGhs: custom,
        })
      : {
          product_base_price: basePrice,
          affiliate_markup_rate: 0,
          affiliate_markup_amount: 0,
          affiliate_selling_price: basePrice,
          markup_type: config.markupType,
        };

    if (unit.affiliate_selling_price + 0.0001 < unit.product_base_price) {
      throw new Error('Selling price cannot fall below Vee-care base price');
    }

    lines.push({
      product_id: product.id,
      product_name: product.name,
      variant_name: variant?.name || item.variant || null,
      quantity: qty,
      sku: variant?.sku || product.sku || null,
      image: images[0]?.url || item.image || null,
      slug: product.slug,
      stock,
      status: product.status,
      affiliate_enabled: applyMarkup,
      unit_quote: unit,
      line_base_amount: fromPesewas(toPesewas(unit.product_base_price) * qty),
      line_markup_amount: fromPesewas(toPesewas(unit.affiliate_markup_amount) * qty),
      line_selling_amount: fromPesewas(toPesewas(unit.affiliate_selling_price) * qty),
    });
  }

  const subtotal_base_amount = fromPesewas(lines.reduce((sum, line) => sum + toPesewas(line.line_base_amount), 0));
  const affiliate_markup_total = fromPesewas(lines.reduce((sum, line) => sum + toPesewas(line.line_markup_amount), 0));
  const customer_product = fromPesewas(toPesewas(subtotal_base_amount) + toPesewas(affiliate_markup_total));

  let requestedDiscount = 0;
  if (input.couponCode) {
    const { data: coupon } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .ilike('code', String(input.couponCode).trim())
      .maybeSingle();
    if (coupon) {
      const validated = validateCouponRecord(coupon, customer_product, 0);
      if (validated.valid) {
        requestedDiscount += Number(validated.discountAmount) || 0;
      }
    }
  }

  if (input.loyaltyPoints && input.loyaltyPoints > 0) {
    const loyaltySettings = await getLoyaltySettings();
    requestedDiscount += quoteRedeemDiscount(input.loyaltyPoints, loyaltySettings);
  }

  const allocated =
    affiliate && affiliate_markup_total > 0
      ? allocateDiscount({
          baseTotalGhs: subtotal_base_amount,
          markupTotalGhs: affiliate_markup_total,
          requestedDiscountGhs: requestedDiscount,
        })
      : {
          discount_applied: Math.min(requestedDiscount, customer_product),
          affiliate_markup_after_discount: affiliate_markup_total,
          customer_product_total: Math.max(0, customer_product - requestedDiscount),
          discount_capped: false,
        };

  const email = (input.customerEmail || '').trim().toLowerCase();
  const phone = (input.customerPhone || '').replace(/\D/g, '');
  const affiliateEmail = (affiliate?.email || '').trim().toLowerCase();
  const affiliatePhone = (affiliate?.phone || '').replace(/\D/g, '');
  const selfReferralFlag = Boolean(
    affiliate &&
      ((email && affiliateEmail && email === affiliateEmail) ||
        (phone.length >= 9 && affiliatePhone.length >= 9 && phone.slice(-9) === affiliatePhone.slice(-9)))
  );

  return {
    lines,
    subtotal_base_amount,
    affiliate_markup_total: allocated.affiliate_markup_after_discount,
    customer_subtotal: allocated.customer_product_total,
    shipping_amount: 0,
    discount_amount: allocated.discount_applied,
    tax_amount: 0,
    final_total: fromPesewas(toPesewas(allocated.customer_product_total) + 0),
    discount_capped: allocated.discount_capped,
    affiliate: affiliate
      ? { id: affiliate.id, code: affiliate.code, commission_rate: Number(affiliate.commission_rate) }
      : null,
    linkId: input.attribution?.linkId || null,
    selfReferralFlag,
  };
}
