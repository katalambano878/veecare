import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limit';
import { sendCapiEvent } from '@/lib/meta/conversions-api';
import { getMetaServerConfig } from '@/lib/meta/config';
import type { CapiClientEvent } from '@/lib/analytics/types';

const ALLOWED: ReadonlySet<CapiClientEvent> = new Set([
  'ViewContent',
  'AddToCart',
  'InitiateCheckout',
]);

type IncomingCustom = {
  value?: unknown;
  currency?: unknown;
  content_ids?: unknown;
  content_name?: unknown;
  content_type?: unknown;
  contents?: unknown;
  num_items?: unknown;
  quantity?: unknown;
};

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const ids = value.map((item) => String(item).slice(0, 80)).filter(Boolean).slice(0, 50);
  return ids.length ? ids : undefined;
}

function asContents(value: unknown): Array<{ id: string; quantity: number; item_price: number }> | undefined {
  if (!Array.isArray(value)) return undefined;
  const contents = value
    .map((row) => {
      if (!row || typeof row !== 'object') return null;
      const rec = row as Record<string, unknown>;
      const id = String(rec.id || '').slice(0, 80);
      if (!id) return null;
      return {
        id,
        quantity: Math.min(999, Math.max(1, Number(rec.quantity) || 1)),
        item_price: Math.max(0, Number(rec.item_price) || 0),
      };
    })
    .filter((row): row is { id: string; quantity: number; item_price: number } => row !== null)
    .slice(0, 50);
  return contents.length ? contents : undefined;
}

/**
 * Browser companion CAPI events. Purchase is rejected — only payment hooks may send it.
 */
export async function POST(req: Request) {
  try {
    if (!getMetaServerConfig()) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const clientId = getClientIdentifier(req);
    const rate = checkRateLimit(`meta-capi:${clientId}`, RATE_LIMITS.analytics);
    if (!rate.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = (await req.json()) as Record<string, unknown>;
    const eventName = String(body.eventName || '') as CapiClientEvent;
    if (!ALLOWED.has(eventName)) {
      return NextResponse.json({ error: 'Unsupported event' }, { status: 400 });
    }

    const eventId = String(body.eventId || '').slice(0, 120);
    if (!eventId) {
      return NextResponse.json({ error: 'eventId required' }, { status: 400 });
    }

    const custom = (body.customData && typeof body.customData === 'object'
      ? (body.customData as IncomingCustom)
      : {}) as IncomingCustom;

    const value = Number(custom.value);
    const result = await sendCapiEvent({
      eventName,
      eventId,
      eventSourceUrl: typeof body.eventSourceUrl === 'string' ? body.eventSourceUrl.slice(0, 2000) : null,
      user: {
        clientIpAddress: getClientIdentifier(req),
        clientUserAgent: req.headers.get('user-agent'),
        fbp: typeof body.fbp === 'string' ? body.fbp.slice(0, 200) : null,
        fbc: typeof body.fbc === 'string' ? body.fbc.slice(0, 500) : null,
      },
      customData: {
        value: Number.isFinite(value) ? Math.max(0, value) : undefined,
        currency: typeof custom.currency === 'string' ? custom.currency.slice(0, 8).toUpperCase() : 'GHS',
        content_ids: asStringArray(custom.content_ids),
        content_name: typeof custom.content_name === 'string' ? custom.content_name.slice(0, 200) : undefined,
        content_type: 'product',
        contents: asContents(custom.contents),
        num_items: Number.isFinite(Number(custom.num_items)) ? Number(custom.num_items) : undefined,
        quantity: Number.isFinite(Number(custom.quantity)) ? Number(custom.quantity) : undefined,
      },
    });

    return NextResponse.json({ ok: result.ok, skipped: result.skipped ?? false });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
