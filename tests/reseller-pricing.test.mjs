import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function toPesewas(ghs) {
  const n = Number(ghs);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

function fromPesewas(pesewas) {
  return Math.round(pesewas) / 100;
}

function mulRatePesewas(basePesewas, percent) {
  const rate = Number(percent);
  if (!Number.isFinite(rate) || rate <= 0) return 0;
  return Math.round((Math.round(basePesewas) * rate) / 100);
}

function quoteUnit({ basePriceGhs, markupType, markupRate, fixedMarkupGhs, customSellingGhs, minSellingGhs, maxSellingGhs, customPriceAllowed }) {
  const basePesewas = toPesewas(basePriceGhs);
  let markupPesewas = 0;
  if (customPriceAllowed && customSellingGhs != null) {
    let selling = toPesewas(customSellingGhs);
    if (minSellingGhs != null) selling = Math.max(selling, toPesewas(minSellingGhs));
    if (maxSellingGhs != null) selling = Math.min(selling, toPesewas(maxSellingGhs));
    selling = Math.max(selling, basePesewas);
    markupPesewas = selling - basePesewas;
  } else if (markupType === 'fixed') {
    markupPesewas = toPesewas(fixedMarkupGhs);
  } else {
    markupPesewas = mulRatePesewas(basePesewas, markupRate);
  }
  return {
    product_base_price: fromPesewas(basePesewas),
    affiliate_markup_amount: fromPesewas(markupPesewas),
    affiliate_selling_price: fromPesewas(basePesewas + markupPesewas),
  };
}

function allocateDiscount({ baseTotalGhs, markupTotalGhs, requestedDiscountGhs }) {
  const base = toPesewas(baseTotalGhs);
  const markup = Math.max(0, toPesewas(markupTotalGhs));
  const requested = Math.max(0, toPesewas(requestedDiscountGhs));
  const applied = Math.min(requested, markup);
  return {
    discount_applied: fromPesewas(applied),
    affiliate_markup_after_discount: fromPesewas(markup - applied),
    customer_product_total: fromPesewas(base + markup - applied),
    discount_capped: requested > markup,
  };
}

describe('reseller pricing engine', () => {
  it('CASE 1: 10% on 250 → 25 markup, 275 selling', () => {
    const q = quoteUnit({ basePriceGhs: 250, markupType: 'percentage', markupRate: 10 });
    assert.equal(q.product_base_price, 250);
    assert.equal(q.affiliate_markup_amount, 25);
    assert.equal(q.affiliate_selling_price, 275);
  });

  it('CASE 2: fixed 40 on 250 → 290 selling', () => {
    const q = quoteUnit({ basePriceGhs: 250, markupType: 'fixed', fixedMarkupGhs: 40 });
    assert.equal(q.affiliate_markup_amount, 40);
    assert.equal(q.affiliate_selling_price, 290);
  });

  it('CASE 3: quantity 3 at 10%', () => {
    const q = quoteUnit({ basePriceGhs: 250, markupType: 'percentage', markupRate: 10 });
    assert.equal(fromPesewas(toPesewas(q.product_base_price) * 3), 750);
    assert.equal(fromPesewas(toPesewas(q.affiliate_markup_amount) * 3), 75);
    assert.equal(fromPesewas(toPesewas(q.affiliate_selling_price) * 3), 825);
  });

  it('CASE 8/11 floor: selling never below base', () => {
    const q = quoteUnit({
      basePriceGhs: 250,
      markupType: 'percentage',
      markupRate: 10,
      customPriceAllowed: true,
      customSellingGhs: 200,
      minSellingGhs: 275,
    });
    assert.ok(q.affiliate_selling_price >= 250);
    assert.equal(q.affiliate_selling_price, 275);
  });

  it('CASE 17: custom below minimum is raised to minimum', () => {
    const q = quoteUnit({
      basePriceGhs: 250,
      markupType: 'percentage',
      markupRate: 10,
      customPriceAllowed: true,
      customSellingGhs: 260,
      minSellingGhs: 275,
    });
    assert.equal(q.affiliate_selling_price, 275);
  });

  it('CASE 18: custom above maximum is capped', () => {
    const q = quoteUnit({
      basePriceGhs: 250,
      markupType: 'percentage',
      markupRate: 10,
      customPriceAllowed: true,
      customSellingGhs: 400,
      maxSellingGhs: 350,
    });
    assert.equal(q.affiliate_selling_price, 350);
    assert.equal(q.affiliate_markup_amount, 100);
  });

  it('CASE 12: current base 300 with old 10% link uses 300 floor', () => {
    const q = quoteUnit({ basePriceGhs: 300, markupType: 'percentage', markupRate: 10 });
    assert.equal(q.product_base_price, 300);
    assert.equal(q.affiliate_selling_price, 330);
    assert.ok(q.product_base_price >= 300);
  });

  it('never subtracts markup from Vee-care base', () => {
    const q = quoteUnit({ basePriceGhs: 250, markupType: 'percentage', markupRate: 10 });
    assert.notEqual(q.affiliate_selling_price, 225);
    assert.equal(q.product_base_price + q.affiliate_markup_amount, q.affiliate_selling_price);
  });

  it('merchant discount reduces markup first and protects base', () => {
    const allocated = allocateDiscount({
      baseTotalGhs: 250,
      markupTotalGhs: 25,
      requestedDiscountGhs: 40,
    });
    assert.equal(allocated.discount_applied, 25);
    assert.equal(allocated.affiliate_markup_after_discount, 0);
    assert.equal(allocated.customer_product_total, 250);
    assert.equal(allocated.discount_capped, true);
  });

  it('CASE 14 mixed cart: only affiliate items get markup', () => {
    const aff = quoteUnit({ basePriceGhs: 250, markupType: 'percentage', markupRate: 10 });
    const plain = { product_base_price: 80, affiliate_markup_amount: 0, affiliate_selling_price: 80 };
    const customer = aff.affiliate_selling_price + plain.affiliate_selling_price;
    const base = aff.product_base_price + plain.product_base_price;
    assert.equal(base, 330);
    assert.equal(customer, 355);
  });

  it('money precision uses pesewas', () => {
    assert.equal(toPesewas(275.5), 27550);
    assert.equal(fromPesewas(27550), 275.5);
    assert.notEqual(0.1 + 0.2, 0.3);
    assert.equal(fromPesewas(toPesewas(0.1) + toPesewas(0.2)), 0.3);
  });
});
