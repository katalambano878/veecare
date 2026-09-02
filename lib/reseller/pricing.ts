import { fromPesewas, mulRatePesewas, toPesewas } from './money';

export type MarkupType = 'percentage' | 'fixed' | 'custom';

export type ProductAffiliateConfig = {
  affiliateEnabled: boolean;
  markupType: MarkupType;
  markupRate: number;
  fixedMarkupGhs: number;
  customPriceAllowed: boolean;
  minSellingGhs: number | null;
  maxSellingGhs: number | null;
  recommendedSellingGhs: number | null;
};

export type UnitQuote = {
  product_base_price: number;
  affiliate_markup_rate: number;
  affiliate_markup_amount: number;
  affiliate_selling_price: number;
  markup_type: MarkupType;
};

export const DEFAULT_PRODUCT_AFFILIATE: ProductAffiliateConfig = {
  affiliateEnabled: true,
  markupType: 'percentage',
  markupRate: 10,
  fixedMarkupGhs: 0,
  customPriceAllowed: false,
  minSellingGhs: null,
  maxSellingGhs: null,
  recommendedSellingGhs: null,
};

export function readProductAffiliateConfig(
  metadata: Record<string, unknown> | null | undefined,
  defaults: { markupRate: number; markupType: MarkupType; affiliateEnabled: boolean }
): ProductAffiliateConfig {
  const meta = metadata && typeof metadata === 'object' ? metadata : {};
  const enabled = meta.affiliate_enabled;
  return {
    affiliateEnabled: typeof enabled === 'boolean' ? enabled : defaults.affiliateEnabled,
    markupType:
      meta.affiliate_markup_type === 'fixed' || meta.affiliate_markup_type === 'custom'
        ? meta.affiliate_markup_type
        : defaults.markupType,
    markupRate: Number(meta.affiliate_markup_rate) > 0 ? Number(meta.affiliate_markup_rate) : defaults.markupRate,
    fixedMarkupGhs: Number(meta.affiliate_fixed_markup) > 0 ? Number(meta.affiliate_fixed_markup) : 0,
    customPriceAllowed: meta.affiliate_custom_price_allowed === true,
    minSellingGhs: Number(meta.affiliate_min_selling_price) > 0 ? Number(meta.affiliate_min_selling_price) : null,
    maxSellingGhs: Number(meta.affiliate_max_selling_price) > 0 ? Number(meta.affiliate_max_selling_price) : null,
    recommendedSellingGhs:
      Number(meta.affiliate_default_selling_price) > 0 ? Number(meta.affiliate_default_selling_price) : null,
  };
}

/**
 * Selling price = base + markup. Markup is never taken from Vee-care's base.
 * Custom selling price, if allowed, must stay at or above current base (hard floor).
 */
export function quoteUnit(input: {
  basePriceGhs: number;
  config: ProductAffiliateConfig;
  affiliateDefaultRate: number;
  customSellingGhs?: number | null;
}): UnitQuote {
  const basePesewas = toPesewas(input.basePriceGhs);
  if (basePesewas <= 0) {
    return {
      product_base_price: 0,
      affiliate_markup_rate: 0,
      affiliate_markup_amount: 0,
      affiliate_selling_price: 0,
      markup_type: input.config.markupType,
    };
  }

  const rate = input.config.markupRate > 0 ? input.config.markupRate : input.affiliateDefaultRate;
  let markupPesewas = 0;
  let type: MarkupType = input.config.markupType;

  if (input.config.customPriceAllowed && input.customSellingGhs != null) {
    type = 'custom';
    let selling = toPesewas(input.customSellingGhs);
    if (input.config.minSellingGhs != null) {
      selling = Math.max(selling, toPesewas(input.config.minSellingGhs));
    }
    if (input.config.maxSellingGhs != null) {
      selling = Math.min(selling, toPesewas(input.config.maxSellingGhs));
    }
    selling = Math.max(selling, basePesewas);
    markupPesewas = selling - basePesewas;
  } else if (input.config.markupType === 'fixed') {
    markupPesewas = toPesewas(input.config.fixedMarkupGhs);
  } else {
    type = 'percentage';
    markupPesewas = mulRatePesewas(basePesewas, rate);
  }

  const sellingPesewas = basePesewas + markupPesewas;
  const effectiveRate = basePesewas > 0 ? (markupPesewas * 100) / basePesewas : 0;

  return {
    product_base_price: fromPesewas(basePesewas),
    affiliate_markup_rate: Math.round(effectiveRate * 100) / 100,
    affiliate_markup_amount: fromPesewas(markupPesewas),
    affiliate_selling_price: fromPesewas(sellingPesewas),
    markup_type: type,
  };
}

/** Merchant-funded discounts reduce affiliate markup first. Never reduce Vee-care base. */
export function allocateDiscount(input: {
  baseTotalGhs: number;
  markupTotalGhs: number;
  requestedDiscountGhs: number;
}): {
  discount_applied: number;
  affiliate_markup_after_discount: number;
  customer_product_total: number;
  discount_capped: boolean;
} {
  const base = toPesewas(input.baseTotalGhs);
  const markup = Math.max(0, toPesewas(input.markupTotalGhs));
  const requested = Math.max(0, toPesewas(input.requestedDiscountGhs));
  const applied = Math.min(requested, markup);
  return {
    discount_applied: fromPesewas(applied),
    affiliate_markup_after_discount: fromPesewas(markup - applied),
    customer_product_total: fromPesewas(base + markup - applied),
    discount_capped: requested > markup,
  };
}
