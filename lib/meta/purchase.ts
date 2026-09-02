import 'server-only';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { purchaseEventId } from '@/lib/analytics/event-id';
import { STORE_CURRENCY } from '@/lib/analytics/types';
import { sendCapiEvent } from './conversions-api';
import { getMetaServerConfig } from './config';

type OrderRow = {
  id: string;
  order_number: string;
  email: string | null;
  phone: string | null;
  user_id: string | null;
  payment_status: string;
  total: number | string;
  currency: string | null;
  shipping_address: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
};

type OrderItemRow = {
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number | string;
};

export type MetaPurchaseRequestContext = {
  /** Only pass the shopper's IP (browser verify). Never a gateway webhook IP. */
  clientIp?: string | null;
  eventSourceUrl?: string | null;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringField(obj: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function isoCurrency(value: string | null | undefined): string {
  const raw = (value || STORE_CURRENCY).trim().toUpperCase();
  if (raw === 'GHC' || raw === 'GH₵' || raw === 'CEDIS') return 'GHS';
  return raw || STORE_CURRENCY;
}

async function loadPaidOrder(orderId: string): Promise<{ order: OrderRow; items: OrderItemRow[] } | null> {
  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .select('id, order_number, email, phone, user_id, payment_status, total, currency, shipping_address, metadata')
    .eq('id', orderId)
    .maybeSingle();

  if (error || !order) return null;
  if (order.payment_status !== 'paid') return null;

  const { data: items } = await supabaseAdmin
    .from('order_items')
    .select('product_id, product_name, quantity, unit_price')
    .eq('order_id', orderId);

  return { order: order as OrderRow, items: (items || []) as OrderItemRow[] };
}

async function markPurchaseSent(orderId: string, metadata: Record<string, unknown>, eventId: string): Promise<void> {
  await supabaseAdmin
    .from('orders')
    .update({
      metadata: {
        ...metadata,
        meta_purchase_event_id: eventId,
        meta_purchase_sent_at: new Date().toISOString(),
      },
    })
    .eq('id', orderId);
}

/**
 * Send Purchase CAPI from the stored paid order. Never trusts client amounts.
 * Safe to call on webhook retries — same event_id + sent_at guard.
 */
export async function sendMetaPurchaseForOrderId(
  orderId: string,
  context: MetaPurchaseRequestContext = {}
): Promise<void> {
  if (!getMetaServerConfig()) return;

  const loaded = await loadPaidOrder(orderId);
  if (!loaded) return;

  const { order, items } = loaded;
  const metadata = asRecord(order.metadata);

  if (metadata.marketing_consent === false) {
    console.info('[META_EVENT_FAILED]', {
      event: 'Purchase',
      eventId: purchaseEventId(order.id),
      orderId: order.id,
      reason: 'marketing_consent_false',
    });
    return;
  }

  const eventId =
    (typeof metadata.meta_purchase_event_id === 'string' && metadata.meta_purchase_event_id) ||
    purchaseEventId(order.id);

  if (metadata.meta_purchase_sent_at) {
    console.info('[META_PURCHASE_ALREADY_SENT]', { event: 'Purchase', eventId, orderId: order.id });
    return;
  }

  const address = asRecord(order.shipping_address);
  const contents = items
    .filter((item) => item.product_id)
    .map((item) => ({
      id: String(item.product_id),
      quantity: Number(item.quantity) || 1,
      item_price: Number(item.unit_price) || 0,
    }));

  const result = await sendCapiEvent({
    eventName: 'Purchase',
    eventId,
    eventSourceUrl:
      context.eventSourceUrl ||
      `${(process.env.NEXT_PUBLIC_APP_URL || 'https://veecare.shop').replace(/\/$/, '')}/order-success?order=${encodeURIComponent(order.order_number)}`,
    user: {
      email: order.email,
      phone: order.phone || stringField(address, 'phone'),
      firstName: stringField(metadata, 'first_name') || stringField(address, 'firstName', 'first_name'),
      lastName: stringField(metadata, 'last_name') || stringField(address, 'lastName', 'last_name'),
      city: stringField(address, 'city'),
      state: stringField(address, 'region', 'state'),
      country: 'gh',
      postalCode: stringField(address, 'postalCode', 'postal_code'),
      externalId: order.user_id,
      clientIpAddress: context.clientIp,
      clientUserAgent: stringField(metadata, 'user_agent'),
      fbp: stringField(metadata, 'fbp'),
      fbc: stringField(metadata, 'fbc'),
    },
    customData: {
      value: Number(order.total) || 0,
      currency: isoCurrency(order.currency),
      content_ids: contents.map((c) => c.id),
      content_type: 'product',
      contents,
      num_items: contents.reduce((sum, c) => sum + c.quantity, 0),
      order_id: order.order_number,
    },
  });

  if (result.ok || result.skipped) {
    try {
      await markPurchaseSent(order.id, metadata, eventId);
    } catch (error) {
      console.error('[META_EVENT_FAILED]', {
        event: 'Purchase',
        eventId,
        orderId: order.id,
        reason: 'persist_flag',
      });
      void error;
    }
  }
}

export async function sendMetaPurchaseByOrderNumber(
  orderNumber: string,
  context: MetaPurchaseRequestContext = {}
): Promise<void> {
  const { data } = await supabaseAdmin
    .from('orders')
    .select('id, payment_status')
    .eq('order_number', orderNumber)
    .maybeSingle();
  if (!data?.id || data.payment_status !== 'paid') return;
  await sendMetaPurchaseForOrderId(data.id, context);
}

/** Fire-and-forget so payment completion never waits on Meta. */
export function scheduleMetaPurchaseForPaidOrder(
  order: { id?: string | null; order_number?: string | null; payment_status?: string | null },
  context: MetaPurchaseRequestContext = {}
): void {
  if (order.payment_status && order.payment_status !== 'paid') return;
  const run = order.id
    ? sendMetaPurchaseForOrderId(order.id, context)
    : order.order_number
      ? sendMetaPurchaseByOrderNumber(order.order_number, context)
      : Promise.resolve();
  void run.catch((error: unknown) => {
    console.error('[META_EVENT_FAILED]', {
      event: 'Purchase',
      orderId: order.id || order.order_number,
      reason: error instanceof Error ? error.name : 'unknown',
    });
  });
}
