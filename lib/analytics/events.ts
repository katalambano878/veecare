'use client';

import { hasMarketingConsent } from './consent';
import { randomEventId } from './event-id';
import { refreshMetaCookies } from './attribution';
import { getPublicPixelId, trackPixel } from './meta-pixel';
import { STORE_CURRENCY, type AddToCartPayload, type CheckoutPayload, type ProductViewPayload, type PurchasePayload } from './types';

function sendCapiCompanion(
  eventName: 'ViewContent' | 'AddToCart' | 'InitiateCheckout',
  eventId: string,
  customData: Record<string, unknown>
): void {
  if (!hasMarketingConsent() || !getPublicPixelId()) return;
  const cookies = refreshMetaCookies();
  const payload = {
    eventName,
    eventId,
    eventSourceUrl: typeof window !== 'undefined' ? window.location.href : undefined,
    fbp: cookies.fbp,
    fbc: cookies.fbc,
    customData,
  };
  void fetch('/api/analytics/meta', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    /* analytics must never affect commerce */
  });
}

export function trackProductView(product: {
  id: string;
  name: string;
  price: number;
  currency?: string;
}): void {
  if (!product.id) return;
  const eventId = randomEventId('view');
  const payload: ProductViewPayload = {
    content_ids: [product.id],
    content_name: product.name,
    content_type: 'product',
    value: Number(product.price) || 0,
    currency: product.currency || STORE_CURRENCY,
  };
  trackPixel('ViewContent', payload, eventId);
  sendCapiCompanion('ViewContent', eventId, payload);
}

export function trackAddToCart(item: {
  id: string;
  name: string;
  price: number;
  quantity: number;
  currency?: string;
}): void {
  if (!item.id) return;
  const quantity = Math.max(1, Number(item.quantity) || 1);
  const unit = Number(item.price) || 0;
  const eventId = randomEventId('cart');
  const payload: AddToCartPayload = {
    content_ids: [item.id],
    content_name: item.name,
    content_type: 'product',
    value: unit * quantity,
    currency: item.currency || STORE_CURRENCY,
    quantity,
    contents: [{ id: item.id, quantity, item_price: unit }],
  };
  trackPixel('AddToCart', payload, eventId);
  sendCapiCompanion('AddToCart', eventId, payload);
}

export function trackCheckout(items: Array<{ id: string; price: number; quantity: number }>, value: number): void {
  if (!items.length) return;
  const eventId = randomEventId('checkout');
  const contents = items.map((item) => ({
    id: item.id,
    quantity: Math.max(1, Number(item.quantity) || 1),
    item_price: Number(item.price) || 0,
  }));
  const payload: CheckoutPayload = {
    content_ids: contents.map((c) => c.id),
    contents,
    num_items: contents.reduce((sum, c) => sum + c.quantity, 0),
    value: Number(value) || 0,
    currency: STORE_CURRENCY,
  };
  trackPixel('InitiateCheckout', payload, eventId);
  sendCapiCompanion('InitiateCheckout', eventId, payload);
}

/**
 * Browser Purchase only. Server CAPI is sent after payment verification.
 * eventId MUST be purchase_{orderUuid} to dedupe with CAPI.
 */
export function trackPurchase(input: {
  eventId: string;
  orderNumber: string;
  value: number;
  currency?: string;
  items: Array<{ id: string; quantity: number; price: number }>;
}): void {
  if (!input.eventId || !input.orderNumber) return;
  const contents = input.items
    .filter((item) => item.id)
    .map((item) => ({
      id: item.id,
      quantity: Math.max(1, Number(item.quantity) || 1),
      item_price: Number(item.price) || 0,
    }));
  const payload: PurchasePayload = {
    content_ids: contents.map((c) => c.id),
    contents,
    num_items: contents.reduce((sum, c) => sum + c.quantity, 0),
    value: Number(input.value) || 0,
    currency: input.currency || STORE_CURRENCY,
    order_id: input.orderNumber,
  };
  trackPixel('Purchase', payload, input.eventId);
}
